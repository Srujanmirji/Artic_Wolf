"use client";

import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { LiquidGlassCard } from "@/components/LiquidGlassCard";
import { getDefaultOrgId, applyScenario, type ScenarioResult } from "@/lib/api";
import { GitPullRequest, Search, CheckCircle2, AlertCircle, ArrowRight, Loader2 } from "lucide-react";

export default function ScenariosPage() {
    const { t } = useTranslation();
    const orgId = getDefaultOrgId();
    const [selectedScenario, setSelectedScenario] = useState<string>("");
    const [searchTerm, setSearchTerm] = useState("");

    // Simulated available scenarios
    // In a full implementation, you'd fetch these from a GET /api/scenarios endpoint
    const availableScenarios = [
        { id: "1", name: "High Demand Surge (+20%)", description: "Simulates a 20% spike in global product demand.", icon: "📈", type: "demand" },
        { id: "2", name: "Supplier Delay (+5 days)", description: "Increases predicted lead times by 5 days across the board.", icon: "⏳", type: "supply" },
        { id: "3", name: "Holiday Peak Mode", description: "Aggressive safety stock buffering for holiday season.", icon: "🎄", type: "seasonal" },
    ];

    const { mutate: runSimulation, isPending, data: simulationData, error } = useMutation({
        mutationFn: (scenarioId: string) => applyScenario(orgId, scenarioId),
    });

    const handleRunSimulation = () => {
        if (!orgId || !selectedScenario) return;
        runSimulation(selectedScenario);
    };

    const results = simulationData?.results || [];

    const filteredResults = results.filter((item) => {
        const searchLower = searchTerm.toLowerCase();
        return item.product_id.toLowerCase().includes(searchLower) || item.warehouse_id.toLowerCase().includes(searchLower);
    });

    return (
        <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500 pb-10">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
                <div>
                    <h2 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                        <GitPullRequest className="text-theme-300" size={28} />
                        {t("nav.scenarios", "Scenarios Simulator")}
                    </h2>
                    <p className="text-theme-300 mt-1 line-clamp-1">Simulate market conditions and preview AI adjustments.</p>
                </div>
            </div>

            {!orgId && (
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 flex items-center gap-3">
                    <AlertCircle className="text-yellow-500" />
                    <p className="text-sm text-yellow-500">Set NEXT_PUBLIC_ORG_ID to run simulations.</p>
                </div>
            )}

            {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-center gap-3">
                    <AlertCircle className="text-red-500" />
                    <p className="text-sm text-red-500">{(error as Error).message || "Failed to run simulation."}</p>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Configuration Panel */}
                <div className="lg:col-span-1 space-y-6">
                    <LiquidGlassCard className="border border-theme-700/40 p-6 shadow-lg" borderRadius="1.5rem" blurIntensity="md">
                        <h3 className="text-xl font-bold text-white mb-6">Select Scenario</h3>
                        <div className="space-y-4">
                            {availableScenarios.map((scenario) => (
                                <button
                                    key={scenario.id}
                                    onClick={() => setSelectedScenario(scenario.id)}
                                    className={`w-full text-left p-4 rounded-2xl border transition-all duration-300 ${selectedScenario === scenario.id
                                            ? "bg-theme-500/20 border-theme-500 shadow-[0_0_15px_rgba(74,92,106,0.2)]"
                                            : "bg-theme-800/40 border-theme-700/50 hover:bg-theme-700/40 hover:border-theme-500/50"
                                        }`}
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="text-2xl mt-1">{scenario.icon}</div>
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between">
                                                <h4 className="font-semibold text-white">{scenario.name}</h4>
                                                {selectedScenario === scenario.id && <CheckCircle2 size={18} className="text-theme-300" />}
                                            </div>
                                            <p className="text-sm text-theme-300 mt-1 leading-relaxed">{scenario.description}</p>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={handleRunSimulation}
                            disabled={!selectedScenario || isPending || !orgId}
                            className={`w-full mt-8 py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${!selectedScenario || isPending || !orgId
                                    ? "bg-theme-800 text-theme-500 cursor-not-allowed border border-theme-700/50"
                                    : "bg-gradient-to-r from-theme-500 to-theme-300 text-theme-900 shadow-lg hover:shadow-theme-500/25 hover:scale-[1.02]"
                                }`}
                        >
                            {isPending ? (
                                <>
                                    <Loader2 size={18} className="animate-spin" />
                                    Simulating...
                                </>
                            ) : (
                                "Run Simulation"
                            )}
                        </button>
                    </LiquidGlassCard>
                </div>

                {/* Results Panel */}
                <div className="lg:col-span-2">
                    <LiquidGlassCard className="border border-theme-700/40 p-6 shadow-lg h-full flex flex-col" borderRadius="1.5rem" blurIntensity="md">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-white">Impact Analysis</h3>
                            {results.length > 0 && (
                                <div className="relative group">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-theme-300" size={16} />
                                    <input
                                        type="text"
                                        placeholder="Filter products..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="bg-theme-800/60 border border-theme-700/50 rounded-full py-1.5 pl-10 pr-4 text-sm text-theme-100 placeholder:text-theme-500 focus:outline-none focus:ring-1 focus:ring-theme-500/50 w-48 hover:bg-theme-800 transition-all focus:w-64"
                                    />
                                </div>
                            )}
                        </div>

                        {results.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border border-dashed border-theme-700/50 rounded-2xl bg-theme-800/10">
                                <GitPullRequest size={48} className="text-theme-700 mb-4 opacity-50" />
                                <h4 className="text-lg font-medium text-theme-300 mb-2">No Active Simulation</h4>
                                <p className="text-sm text-theme-500 max-w-sm">
                                    Select a scenario from the left panel and click "Run Simulation" to generate AI-driven adjustments to your inventory metrics.
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto rounded-xl border border-theme-700/50 bg-theme-900/30">
                                <table className="w-full text-sm text-left text-theme-300">
                                    <thead className="bg-theme-800/80 text-xs uppercase font-semibold text-theme-100 tracking-wider">
                                        <tr>
                                            <th className="px-5 py-4 rounded-tl-xl whitespace-nowrap">Product / Location</th>
                                            <th className="px-5 py-4">Reorder Point</th>
                                            <th className="px-5 py-4 rounded-tr-xl">Safety Stock</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-theme-700/30">
                                        {filteredResults.map((result, i) => (
                                            <tr key={i} className="hover:bg-theme-800/40 transition-colors">
                                                <td className="px-5 py-4 font-medium text-theme-100 whitespace-nowrap">
                                                    <div>{result.product_id}</div>
                                                    <div className="text-xs text-theme-500 mt-0.5">{result.warehouse_id}</div>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-theme-500 line-through decoration-theme-700">{result.base_reorder_point.toFixed(0)}</span>
                                                        <ArrowRight size={14} className="text-theme-500" />
                                                        <span className="text-theme-100 font-bold bg-theme-700/30 px-2 py-0.5 rounded text-xs">{result.adjusted_reorder_point.toFixed(0)}</span>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-theme-500 line-through decoration-theme-700">{result.base_safety_stock.toFixed(0)}</span>
                                                        <ArrowRight size={14} className="text-theme-500" />
                                                        <span className={`font-bold px-2 py-0.5 rounded text-xs ${result.adjusted_safety_stock > result.base_safety_stock ? "bg-theme-300/20 text-theme-300" : "bg-theme-500/20 text-theme-100"}`}>
                                                            {result.adjusted_safety_stock.toFixed(0)}
                                                        </span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {filteredResults.length === 0 && (
                                    <div className="p-8 text-center text-theme-500">
                                        No metrics matched your search query.
                                    </div>
                                )}
                            </div>
                        )}
                    </LiquidGlassCard>
                </div>
            </div>
        </div>
    );
}
