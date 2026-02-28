"use client";

import React from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { LiquidGlassCard } from "@/components/LiquidGlassCard";
import { getDefaultOrgId, optimizeTransfers, type TransferRecommendation } from "@/lib/api";
import { GitMerge, AlertCircle, Loader2, ArrowRightCircle, Check } from "lucide-react";
import Link from "next/link";

export default function TransfersPage() {
    const { t } = useTranslation();
    const orgId = getDefaultOrgId();

    const { mutate: runOptimization, isPending, data: transferData, isSuccess, error } = useMutation({
        mutationFn: () => optimizeTransfers(orgId),
    });

    const handleRunOptimization = () => {
        if (!orgId) return;
        runOptimization();
    };

    const results = transferData?.results || [];

    return (
        <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500 pb-10">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
                <div>
                    <h2 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                        <GitMerge className="text-theme-300" size={28} />
                        {t("nav.transfers", "Network Transfers")}
                    </h2>
                    <p className="text-theme-300 mt-1 line-clamp-1">Optimize cross-warehouse inventory rebalancing using AI heuristics.</p>
                </div>
                <button
                    onClick={handleRunOptimization}
                    disabled={isPending || !orgId}
                    className={`px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-[0_4px_15px_rgba(0,0,0,0.2)] ${isPending || !orgId
                        ? "bg-theme-800 text-theme-500 cursor-not-allowed border border-theme-700/50"
                        : "bg-gradient-to-r from-theme-500 to-theme-300 text-theme-900 hover:scale-105"
                        }`}
                >
                    {isPending ? (
                        <>
                            <Loader2 size={18} className="animate-spin" />
                            Calculating Route Matrix...
                        </>
                    ) : (
                        "Run Supply Network Optimization"
                    )}
                </button>
            </div>

            {!orgId && (
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 flex items-center gap-3">
                    <AlertCircle className="text-yellow-500" />
                    <p className="text-sm text-yellow-500">Set NEXT_PUBLIC_ORG_ID to run the optimizer.</p>
                </div>
            )}

            {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-center gap-3">
                    <AlertCircle className="text-red-500" />
                    <p className="text-sm text-red-500">{(error as Error).message || "Failed to run optimization engine."}</p>
                </div>
            )}

            <LiquidGlassCard className="border border-theme-700/40 p-6 shadow-lg min-h-[400px]" borderRadius="1.5rem" blurIntensity="md">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-white">Suggested Logistics Movements</h3>
                    {results.length > 0 && (
                        <span className="text-xs font-medium text-theme-900 bg-theme-300 px-3 py-1 rounded-full">
                            {results.length} Routes Generated
                        </span>
                    )}
                </div>

                {!isSuccess && !isPending && (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-12 border border-dashed border-theme-700/50 rounded-2xl bg-theme-800/10 h-64">
                        <GitMerge size={48} className="text-theme-700 mb-4 opacity-50" />
                        <h4 className="text-lg font-medium text-theme-300 mb-2">Network Idle</h4>
                        <p className="text-sm text-theme-500 max-w-sm">
                            Click 'Run Supply Network Optimization' to scan your global inventory nodes for structural deficits and surpluses.
                        </p>
                    </div>
                )}

                {isSuccess && results.length === 0 && (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-12 border border-dashed border-green-500/30 rounded-2xl bg-green-500/5 h-64 mt-6">
                        <Check size={48} className="text-green-500 mb-4 opacity-50" />
                        <h4 className="text-lg font-medium text-green-400 mb-2">Perfectly Balanced</h4>
                        <p className="text-sm text-green-500 max-w-sm">
                            No warehouse transfers are currently needed. Your network is fully optimized according to safety stock parameters.
                        </p>
                    </div>
                )}

                {isSuccess && results.length > 0 && (
                    <div className="space-y-4">
                        <div className="bg-theme-500/10 border border-theme-500/20 rounded-lg p-4 mb-6">
                            <p className="text-sm text-theme-100 flex items-center gap-2">
                                <Check size={16} className="text-theme-300" />
                                These recommendations have been securely injected into your overarching Action Center.
                                <Link href="/dashboard/recommendations" className="text-theme-300 hover:text-white underline ml-1">
                                    Review and Approve them here.
                                </Link>
                            </p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                            {results.map((rec, i) => (
                                <div key={i} className="flex flex-col bg-theme-900/60 border border-theme-700/40 rounded-xl p-5 hover:border-theme-500/40 transition-colors shadow-sm">
                                    <div className="flex items-center justify-between mb-4">
                                        <span className="text-xs font-semibold text-theme-500 uppercase tracking-wider">Product ID</span>
                                        <span className="bg-theme-800/80 px-2 py-1 rounded text-xs text-theme-300 border border-theme-700/50 font-mono">
                                            {rec.product_id}
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between flex-1">
                                        <div className="flex flex-col items-center flex-1">
                                            <span className="text-[10px] text-theme-500 uppercase font-semibold mb-1">Source</span>
                                            <div className="text-sm font-bold text-white text-center line-clamp-2 px-1">
                                                {rec.from_warehouse}
                                            </div>
                                        </div>

                                        <div className="flex flex-col items-center justify-center px-4">
                                            <span className="text-xs font-bold text-theme-300 mb-1">{rec.quantity} UN</span>
                                            <ArrowRightCircle size={20} className="text-theme-500/50" />
                                        </div>

                                        <div className="flex flex-col items-center flex-1">
                                            <span className="text-[10px] text-theme-500 uppercase font-semibold mb-1">Target</span>
                                            <div className="text-sm font-bold text-theme-100 text-center line-clamp-2 px-1">
                                                {rec.to_warehouse}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </LiquidGlassCard>
        </div>
    );
}

