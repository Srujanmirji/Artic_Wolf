"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    ArrowRight,
    CheckCircle2,
    Loader2,
    RefreshCw,
    Search,
    SlidersHorizontal,
    Sparkles,
    TrendingDown,
    TrendingUp,
    Truck,
    XCircle
} from "lucide-react";
import { LiquidGlassCard } from "@/components/LiquidGlassCard";
import { getDefaultOrgId, getRecommendations, generateRecommendations, type RecommendationItem } from "@/lib/api";
import { formatCurrency, timeAgo } from "@/lib/format";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import type { TFunction } from "i18next";

type RecommendationView = {
    id: string;
    filter: "high" | "optimization" | "logistics";
    priorityLabel: string;
    actionType: string;
    title: string;
    description: string;
    createdLabel: string;
    createdAtMs: number;
    quantity: number;
    expectedSaving: number;
    confidencePercent: number | null;
    primaryLabel: string;
    primaryHref: string;
    productLabel: string;
};

type FilterKey = "all" | "high" | "optimization" | "logistics";
type SortKey = "newest" | "savings" | "quantity";

function shortId(id?: string | null) {
    if (!id) return "Unknown";
    return id.slice(0, 8);
}

function buildRecommendationView(rec: RecommendationItem, index: number, t: TFunction): RecommendationView {
    const action = rec.action_type || "review";
    const productName = rec.product?.name || rec.product?.sku || `Product ${shortId(rec.product_id)}`;
    const quantity = Number(rec.quantity || 0);
    const expectedSaving = Number(rec.expected_cost_saving || 0);
    const confidencePercent = rec.confidence ? Math.round(rec.confidence * 100) : null;

    let title = t("recs.review_title", "Review '{{productName}}'", { productName });
    let description = t("recs.review_desc", "Review inventory levels for {{productName}}.", { productName });
    let filter: RecommendationView["filter"] = "optimization";
    let priorityLabel = t("recs.opt", "Optimization");
    let primaryLabel = t("recs.action", "Take Action");
    let primaryHref = "/dashboard/inventory";

    if (action === "increase") {
        title = t("recs.reorder_title", "Reorder '{{productName}}' early", { productName });
        description = t("recs.reorder_desc", "Recommended to increase stock by {{quantity}} to reduce stockout risk.", {
            quantity: `${quantity} ${t("recs.units_suffix", "units")}`
        });
        filter = "high";
        priorityLabel = t("recs.high_pri", "High Priority");
        primaryLabel = t("recs.draft_po", "Draft PO");
        primaryHref = "/dashboard/inventory";
    } else if (action === "decrease") {
        title = t("recs.reduce_title", "Reduce holding for '{{productName}}'", { productName });
        description = t("recs.reduce_desc", "Recommended to reduce stock by {{quantity}} to lower holding cost.", {
            quantity: `${quantity} ${t("recs.units_suffix", "units")}`
        });
        filter = "optimization";
        priorityLabel = t("recs.opt", "Optimization");
        primaryLabel = t("recs.action", "Take Action");
        primaryHref = "/dashboard/inventory";
    } else if (action === "transfer") {
        title = t("recs.transfer_title", "Transfer '{{productName}}' inventory", { productName });
        description = t("recs.transfer_desc", "Transfer {{quantity}}.", {
            quantity: `${quantity} ${t("recs.units_suffix", "units")}`
        });
        if (rec.from_warehouse_name && rec.to_warehouse_name) {
            description += ` ${t("recs.move_from", "Move from")} ${rec.from_warehouse_name} ${t("recs.move_to", "to")} ${rec.to_warehouse_name}.`;
        }
        filter = "logistics";
        priorityLabel = t("recs.logistics", "Logistics");
        primaryLabel = t("recs.plan_transfer", "Plan Transfer");
        primaryHref = "/dashboard/transfers";
    }

    if (expectedSaving > 0) {
        description += ` ${t("recs.estimated_savings", "Estimated savings")} ${formatCurrency(expectedSaving)}.`;
    }

    const createdLabel = rec.created_at
        ? t("recs.generated", "Generated {{time}}", { time: timeAgo(rec.created_at) })
        : t("recs.generated_recently", "Generated recently");

    const createdAtMs = rec.created_at ? new Date(rec.created_at).getTime() : 0;

    return {
        id: String(rec.id || `${rec.product_id}-${index}`),
        filter,
        priorityLabel,
        actionType: action,
        title,
        description,
        createdLabel,
        createdAtMs: Number.isNaN(createdAtMs) ? 0 : createdAtMs,
        quantity,
        expectedSaving,
        confidencePercent,
        primaryLabel,
        primaryHref,
        productLabel: productName
    };
}

export default function RecommendationsPage() {
    const { t } = useTranslation();
    const router = useRouter();
    const orgId = getDefaultOrgId();
    const queryClient = useQueryClient();

    const [searchTerm, setSearchTerm] = useState("");
    const [activeFilter, setActiveFilter] = useState<FilterKey>("all");
    const [sortBy, setSortBy] = useState<SortKey>("newest");
    const [dismissedIds, setDismissedIds] = useState<string[]>([]);

    const { data: recommendationsData, error: queryError, isLoading } = useQuery({
        queryKey: ["recommendations", orgId],
        queryFn: () => getRecommendations(orgId),
        enabled: !!orgId
    });

    const generateMutation = useMutation({
        mutationFn: () => generateRecommendations(orgId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["recommendations", orgId] });
        }
    });

    const loadError = queryError ? (queryError as Error).message : generateMutation.error ? (generateMutation.error as Error).message : null;
    const isGenerating = generateMutation.isPending;

    const cards = useMemo<RecommendationView[]>(() => {
        if (!recommendationsData || !recommendationsData.length) return [];
        return recommendationsData.map((rec, index) => buildRecommendationView(rec, index, t));
    }, [recommendationsData, t]);

    const stats = useMemo(() => {
        const total = cards.length;
        const high = cards.filter((card) => card.filter === "high").length;
        const logistics = cards.filter((card) => card.filter === "logistics").length;
        const savings = cards.reduce((sum, card) => sum + card.expectedSaving, 0);
        const confidenceValues = cards
            .filter((card) => card.confidencePercent !== null)
            .map((card) => Number(card.confidencePercent));

        const avgConfidence = confidenceValues.length > 0
            ? Math.round(confidenceValues.reduce((sum, val) => sum + val, 0) / confidenceValues.length)
            : null;

        return { total, high, logistics, savings, avgConfidence };
    }, [cards]);

    const filteredCards = useMemo(() => {
        const term = searchTerm.trim().toLowerCase();

        const visible = cards
            .filter((card) => !dismissedIds.includes(card.id))
            .filter((card) => activeFilter === "all" ? true : card.filter === activeFilter)
            .filter((card) => {
                if (!term) return true;
                return (
                    card.title.toLowerCase().includes(term) ||
                    card.description.toLowerCase().includes(term) ||
                    card.productLabel.toLowerCase().includes(term)
                );
            });

        visible.sort((a, b) => {
            if (sortBy === "savings") return b.expectedSaving - a.expectedSaving;
            if (sortBy === "quantity") return b.quantity - a.quantity;
            return b.createdAtMs - a.createdAtMs;
        });

        return visible;
    }, [activeFilter, cards, dismissedIds, searchTerm, sortBy]);

    const dismissCard = (id: string) => {
        setDismissedIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
    };

    const clearDismissed = () => setDismissedIds([]);

    return (
        <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
            <LiquidGlassCard className="border border-theme-300/30 p-6 relative overflow-hidden" borderRadius="0.75rem" blurIntensity="md">
                <div className="absolute -right-20 -top-20 opacity-10 blur-xl pointer-events-none">
                    <Sparkles size={220} className="text-theme-300" />
                </div>
                <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                    <div>
                        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                            <Sparkles size={24} className="text-theme-300" />
                            {t("recs.insights_title", "Aagam AI Insights")}
                        </h2>
                        <p className="text-theme-300 mt-2 max-w-3xl">
                            {t("recs.insights_desc", "Based on your current inventory levels and historical sales data, we've identified {{count}} key actions to optimize your supply chain.", { count: stats.total })}
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <button
                            onClick={() => generateMutation.mutate()}
                            disabled={isGenerating || !orgId}
                            className="bg-theme-800/60 border border-theme-500/30 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-theme-700/80 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {isGenerating ? <Loader2 size={18} className="animate-spin" /> : <RefreshCw size={18} />}
                            <span>{isGenerating ? t("common.analyzing", "Analyzing...") : t("recs.generate_insights", "Generate Insights")}</span>
                        </button>
                        <button
                            onClick={clearDismissed}
                            disabled={dismissedIds.length === 0}
                            className="bg-theme-900/50 border border-theme-500/20 text-theme-200 px-4 py-2.5 rounded-lg font-medium hover:bg-theme-800/60 transition-all disabled:opacity-50"
                        >
                            {t("recs.clear_hidden", "Restore Hidden")} ({dismissedIds.length})
                        </button>
                    </div>
                </div>

                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 relative z-10">
                    <div className="bg-theme-900/40 border border-theme-500/20 rounded-xl px-4 py-3">
                        <p className="text-theme-500 text-xs uppercase tracking-wide">{t("recs.total", "Total Recommendations")}</p>
                        <p className="text-white text-2xl font-bold mt-1">{stats.total}</p>
                    </div>
                    <div className="bg-theme-900/40 border border-theme-500/20 rounded-xl px-4 py-3">
                        <p className="text-theme-500 text-xs uppercase tracking-wide">{t("recs.high_pri", "High Priority")}</p>
                        <p className="text-white text-2xl font-bold mt-1">{stats.high}</p>
                    </div>
                    <div className="bg-theme-900/40 border border-theme-500/20 rounded-xl px-4 py-3">
                        <p className="text-theme-500 text-xs uppercase tracking-wide">{t("recs.estimated_savings", "Estimated savings")}</p>
                        <p className="text-white text-2xl font-bold mt-1">{formatCurrency(stats.savings)}</p>
                    </div>
                    <div className="bg-theme-900/40 border border-theme-500/20 rounded-xl px-4 py-3">
                        <p className="text-theme-500 text-xs uppercase tracking-wide">{t("recs.avg_confidence", "Avg Confidence")}</p>
                        <p className="text-white text-2xl font-bold mt-1">
                            {stats.avgConfidence === null ? "--" : `${stats.avgConfidence}%`}
                        </p>
                    </div>
                </div>
            </LiquidGlassCard>

            {!orgId && (
                <div className="text-xs text-amber-200 bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-3">
                    {t("recs.no_org_id", "No organization found. Complete ")}
                    <Link href="/onboarding" className="underline">{t("recs.onboarding", "onboarding")}</Link>.
                </div>
            )}
            {loadError && (
                <div className="text-xs text-red-200 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">{loadError}</div>
            )}

            <LiquidGlassCard className="border border-theme-500/20 p-4" borderRadius="0.75rem" blurIntensity="md">
                <div className="flex flex-col xl:flex-row gap-3 xl:items-center xl:justify-between">
                    <div className="relative w-full xl:max-w-md">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-theme-500" />
                        <input
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder={t("recs.search_placeholder", "Search recommendations...")}
                            className="w-full bg-theme-900/40 border border-theme-500/30 rounded-lg py-2 pl-9 pr-3 text-sm text-theme-100 placeholder:text-theme-500 focus:outline-none focus:ring-1 focus:ring-theme-300"
                        />
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        {(
                            [
                                ["all", t("common.all", "All")],
                                ["high", t("recs.high_pri", "High Priority")],
                                ["optimization", t("recs.opt", "Optimization")],
                                ["logistics", t("recs.logistics", "Logistics")]
                            ] as Array<[FilterKey, string]>
                        ).map(([key, label]) => (
                            <button
                                key={key}
                                onClick={() => setActiveFilter(key)}
                                className={cn(
                                    "px-3 py-1.5 rounded-lg text-xs border transition-colors",
                                    activeFilter === key
                                        ? "bg-theme-500/20 border-theme-500/40 text-white"
                                        : "bg-theme-900/30 border-theme-500/20 text-theme-300 hover:bg-theme-800/50"
                                )}
                            >
                                {label}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-2">
                        <SlidersHorizontal size={16} className="text-theme-500" />
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as SortKey)}
                            className="bg-theme-900/40 border border-theme-500/30 rounded-lg py-2 px-3 text-sm text-theme-100 focus:outline-none focus:ring-1 focus:ring-theme-300"
                        >
                            <option value="newest">{t("recs.sort_newest", "Sort: Newest")}</option>
                            <option value="savings">{t("recs.sort_savings", "Sort: Savings")}</option>
                            <option value="quantity">{t("recs.sort_quantity", "Sort: Quantity")}</option>
                        </select>
                    </div>
                </div>
            </LiquidGlassCard>

            {isLoading ? (
                <div className="grid grid-cols-1 gap-4">
                    {[1, 2, 3].map((n) => (
                        <LiquidGlassCard key={n} className="border border-theme-500/20 p-6 animate-pulse" borderRadius="0.75rem" blurIntensity="md">
                            <div className="h-4 w-28 rounded bg-theme-800/60 mb-3" />
                            <div className="h-6 w-2/3 rounded bg-theme-800/50 mb-3" />
                            <div className="h-4 w-full rounded bg-theme-800/40 mb-2" />
                            <div className="h-4 w-4/5 rounded bg-theme-800/40" />
                        </LiquidGlassCard>
                    ))}
                </div>
            ) : filteredCards.length === 0 ? (
                <LiquidGlassCard className="border border-theme-500/20 p-10 text-center" borderRadius="0.75rem" blurIntensity="md">
                    <div className="flex flex-col items-center gap-3">
                        <CheckCircle2 size={30} className="text-theme-300" />
                        <h3 className="text-xl text-white font-semibold">{t("recs.empty_title", "No recommendations match your filters")}</h3>
                        <p className="text-theme-300 text-sm max-w-xl">
                            {cards.length === 0
                                ? t("recs.empty_seed", "Generate insights after recording inventory and sales activity.")
                                : t("recs.empty_filtered", "Try adjusting search, filter, or restore hidden recommendations.")}
                        </p>
                        <button
                            onClick={() => generateMutation.mutate()}
                            disabled={isGenerating || !orgId}
                            className="mt-2 bg-theme-500/20 border border-theme-500/40 text-theme-100 px-4 py-2 rounded-lg hover:bg-theme-500/30 transition-colors disabled:opacity-50"
                        >
                            {isGenerating ? t("common.analyzing", "Analyzing...") : t("recs.generate_insights", "Generate Insights")}
                        </button>
                    </div>
                </LiquidGlassCard>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {filteredCards.map((card) => (
                        <LiquidGlassCard key={card.id} className="border border-theme-500/30 p-6 shadow-sm relative" borderRadius="0.75rem" blurIntensity="md">
                            <div
                                className={cn(
                                    "absolute left-0 top-0 bottom-0 w-1 rounded-l-xl",
                                    card.filter === "high"
                                        ? "bg-gradient-to-b from-red-300/90 to-theme-300"
                                        : card.filter === "logistics"
                                            ? "bg-gradient-to-b from-blue-300/90 to-theme-500"
                                            : "bg-gradient-to-b from-theme-300/80 to-theme-500/70"
                                )}
                            />

                            <div className="flex flex-col lg:flex-row lg:items-start gap-5">
                                <div
                                    className={cn(
                                        "w-11 h-11 rounded-full border flex items-center justify-center shrink-0",
                                        card.filter === "high"
                                            ? "bg-red-500/10 border-red-400/30 text-red-200"
                                            : card.filter === "logistics"
                                                ? "bg-blue-500/10 border-blue-400/30 text-blue-200"
                                                : "bg-theme-500/10 border-theme-500/30 text-theme-200"
                                    )}
                                >
                                    {card.actionType === "increase" && <TrendingUp size={20} />}
                                    {card.actionType === "decrease" && <TrendingDown size={20} />}
                                    {card.actionType === "transfer" && <Truck size={20} />}
                                    {!(["increase", "decrease", "transfer"] as string[]).includes(card.actionType) && <CheckCircle2 size={20} />}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex flex-wrap items-center gap-2 mb-2">
                                        <span
                                            className={cn(
                                                "text-[11px] uppercase tracking-widest font-bold px-2 py-1 rounded-full border",
                                                card.filter === "high"
                                                    ? "text-red-200 border-red-400/40 bg-red-500/10"
                                                    : card.filter === "logistics"
                                                        ? "text-blue-200 border-blue-400/40 bg-blue-500/10"
                                                        : "text-theme-100 border-theme-500/40 bg-theme-500/10"
                                            )}
                                        >
                                            {card.priorityLabel}
                                        </span>
                                        <span className="text-xs text-theme-400">{card.createdLabel}</span>
                                        {card.confidencePercent !== null && (
                                            <span className="text-xs text-theme-300 border border-theme-500/25 rounded-full px-2 py-0.5">
                                                {t("recs.confidence", "Confidence")} {card.confidencePercent}%
                                            </span>
                                        )}
                                    </div>
                                    <h3 className="text-lg font-semibold text-white">{card.title}</h3>
                                    <p className="text-sm text-theme-300 mt-2 leading-relaxed">{card.description}</p>

                                    <div className="mt-3 flex flex-wrap gap-2 text-xs">
                                        <span className="px-2 py-1 rounded-lg bg-theme-900/40 border border-theme-500/20 text-theme-200">
                                            {t("recs.product", "Product")}: {card.productLabel}
                                        </span>
                                        <span className="px-2 py-1 rounded-lg bg-theme-900/40 border border-theme-500/20 text-theme-200">
                                            {t("recs.qty", "Qty")}: {card.quantity}
                                        </span>
                                        <span className="px-2 py-1 rounded-lg bg-theme-900/40 border border-theme-500/20 text-theme-200">
                                            {t("recs.estimated_savings", "Estimated savings")}: {formatCurrency(card.expectedSaving)}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex lg:flex-col gap-2 shrink-0 w-full lg:w-auto">
                                    <button
                                        onClick={() => dismissCard(card.id)}
                                        className="flex-1 lg:flex-none px-3 py-2 bg-theme-900/40 text-theme-200 text-sm rounded-lg border border-theme-500/20 hover:bg-theme-800/60 transition-colors inline-flex items-center justify-center gap-2"
                                    >
                                        <XCircle size={15} />
                                        {t("recs.dismiss", "Dismiss")}
                                    </button>
                                    <button
                                        onClick={() => router.push(card.primaryHref)}
                                        className="flex-1 lg:flex-none px-3 py-2 text-theme-100 text-sm rounded-lg border border-theme-500/30 bg-theme-500/20 hover:bg-theme-500/30 transition-colors inline-flex items-center justify-center gap-2"
                                    >
                                        {card.primaryLabel}
                                        <ArrowRight size={15} />
                                    </button>
                                </div>
                            </div>
                        </LiquidGlassCard>
                    ))}
                </div>
            )}

            <div className="mt-8 flex items-center justify-center">
                <p className="text-sm text-theme-500 flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-theme-500" />
                    {t("recs.caught_up", "You've caught up on all critical insights for today.")}
                    {stats.logistics > 0 && (
                        <span className="text-theme-300">
                            {t("recs.logistics_ready", "{{count}} transfer suggestions ready.", { count: stats.logistics })}
                        </span>
                    )}
                </p>
            </div>
        </div>
    );
}
