"use client";

import React, { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Lightbulb, ArrowRight, Zap, CheckCircle2, Sparkles, Loader2, RefreshCw } from "lucide-react";
import { LiquidGlassCard } from "@/components/LiquidGlassCard";
import { getDefaultOrgId, getRecommendations, generateRecommendations, type RecommendationItem } from "@/lib/api";
import { formatCurrency, timeAgo } from "@/lib/format";

type RecommendationCard = {
    id: string | number;
    priority: string;
    time: string;
    title: string;
    description: string;
    primaryAction: string;
    secondaryAction: string;
    variant: "primary" | "secondary";
};

const FALLBACK_CARDS: RecommendationCard[] = [
    {
        id: "demo-1",
        priority: "High Priority",
        time: "Generated 2h ago",
        title: "Reorder 'Premium Wireless Headphones' early",
        description: "Forecasted demand requires an additional 200 units to avoid a predicted stockout in 14 days. Lead times from primary supplier have increased by 3 days.",
        primaryAction: "Draft PO",
        secondaryAction: "View Details",
        variant: "primary"
    },
    {
        id: "demo-2",
        priority: "Optimization",
        time: "Generated 5h ago",
        title: "Reduce holding for 'Stainless Steel Water Bottle'",
        description: "Current stock (450 units) exceeds projected 3-month demand by 30%. Consider initiating a temporary 10% discount campaign to free up $3,500 in capital.",
        primaryAction: "Take Action",
        secondaryAction: "Dismiss",
        variant: "secondary"
    }
];
function shortId(id?: string | null) {
    if (!id) return "Unknown";
    return id.slice(0, 8);
}

function buildRecommendationCard(rec: RecommendationItem, index: number): RecommendationCard {
    const action = rec.action_type || "review";
    const productName = rec.product?.name || rec.product?.sku || `Product ${shortId(rec.product_id)}`;
    const quantity = rec.quantity ? `${rec.quantity} units` : "current stock level";
    const savings = rec.expected_cost_saving ? ` Estimated savings ${formatCurrency(rec.expected_cost_saving)}.` : "";
    const transferText =
        rec.from_warehouse_name && rec.to_warehouse_name
            ? ` Move from ${rec.from_warehouse_name} to ${rec.to_warehouse_name}.`
            : "";

    let title = `Review '${productName}'`;
    let description = `Review inventory levels for ${productName}.${savings}`;
    let priority = "Optimization";
    let primaryAction = "Take Action";
    let secondaryAction = "View Details";

    if (action === "increase") {
        title = `Reorder '${productName}' early`;
        description = `Recommended to increase stock by ${quantity} to reduce stockout risk.${savings}`;
        priority = "High Priority";
        primaryAction = "Draft PO";
    } else if (action === "decrease") {
        title = `Reduce holding for '${productName}'`;
        description = `Recommended to reduce stock by ${quantity} to lower holding cost.${savings}`;
        priority = "Optimization";
        primaryAction = "Take Action";
        secondaryAction = "Dismiss";
    } else if (action === "transfer") {
        title = `Transfer '${productName}' inventory`;
        description = `Transfer ${quantity}.${transferText}${savings}`;
        priority = "Logistics";
        primaryAction = "Plan Transfer";
    }

    const time = rec.created_at ? `Generated ${timeAgo(rec.created_at)}` : "Generated recently";
    const variant: RecommendationCard["variant"] = action === "increase" || index % 2 === 0 ? "primary" : "secondary";

    return {
        id: rec.id || `${rec.product_id}-${index}`,
        priority,
        time,
        title,
        description,
        primaryAction,
        secondaryAction,
        variant
    };
}

export default function RecommendationsPage() {
    const orgId = getDefaultOrgId();
    const queryClient = useQueryClient();

    const { data: recommendationsData, error: queryError, isLoading } = useQuery({
        queryKey: ['recommendations', orgId],
        queryFn: () => getRecommendations(orgId),
        enabled: !!orgId
    });

    const generateMutation = useMutation({
        mutationFn: () => generateRecommendations(orgId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['recommendations', orgId] });
        }
    });

    const loadError = queryError ? (queryError as Error).message : generateMutation.error ? (generateMutation.error as Error).message : null;
    const isGenerating = generateMutation.isPending;

    const cards = useMemo(() => {
        if (!recommendationsData || !recommendationsData.length) return [];
        return recommendationsData.map(buildRecommendationCard);
    }, [recommendationsData]);

    return (
        <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
            <LiquidGlassCard className="border border-theme-300/30 p-6 relative flex flex-col md:flex-row items-center justify-between gap-6" borderRadius="0.75rem" blurIntensity="md">
                <div className="absolute -right-10 -top-10 opacity-10 blur-xl">
                    <Sparkles size={200} className="text-theme-300" />
                </div>
                <div className="relative z-10">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Sparkles size={24} className="text-theme-300" />
                        Aagam AI Insights
                    </h2>
                    <p className="text-theme-300 mt-2 max-w-2xl">
                        Based on your current inventory levels and historical sales data, we've identified {cards.length} key actions to optimize your supply chain.
                    </p>
                </div>
                <div className="relative z-10 flex flex-col sm:flex-row gap-3 flex-shrink-0">
                    <button
                        onClick={() => generateMutation.mutate()}
                        disabled={isGenerating || !orgId}
                        className="bg-theme-800/60 border border-theme-500/30 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-theme-700/80 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {isGenerating ? <Loader2 size={18} className="animate-spin" /> : <RefreshCw size={18} />}
                        <span>{isGenerating ? "Analyzing..." : "Generate Insights"}</span>
                    </button>
                    <button className="bg-gradient-to-tr from-theme-500 to-theme-300 text-white px-6 py-2.5 rounded-lg font-bold shadow-[0_0_20px_rgba(155,168,171,0.3)] hover:opacity-90 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2">
                        Auto-Apply All <Zap size={18} />
                    </button>
                </div>
            </LiquidGlassCard>
            {!orgId && (
                <p className="text-xs text-theme-500">Set NEXT_PUBLIC_ORG_ID to load live recommendations.</p>
            )}
            {loadError && (
                <p className="text-xs text-theme-500">{loadError}</p>
            )}

            <div className="grid grid-cols-1 gap-4">
                {cards.map((card) => (
                    <LiquidGlassCard key={card.id} className="border border-theme-500/30 p-6 shadow-sm flex flex-col md:flex-row gap-6 items-start md:items-center relative group" borderRadius="0.75rem" blurIntensity="md">
                        <div className={`absolute left-0 top-0 bottom-0 w-1 ${card.variant === "primary" ? "bg-gradient-to-b from-theme-300 to-theme-500" : "bg-theme-300/50"}`}></div>
                        <div className={`bg-theme-500/10 p-4 rounded-full border border-theme-500/20 ${card.variant === "primary" ? "text-theme-100" : "text-theme-300"}`}>
                            <Lightbulb size={24} />
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-1">
                                <span className={`text-xs font-bold uppercase tracking-wider ${card.variant === "primary" ? "text-theme-100" : "text-theme-300"}`}>{card.priority}</span>
                                <span className="text-xs text-theme-300">{card.time}</span>
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2">{card.title}</h3>
                            <p className="text-sm text-theme-300">
                                {card.description}
                            </p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                            <button className="px-4 py-2 bg-theme-900/50 text-theme-100 text-sm font-medium rounded-lg border border-theme-500/20 hover:bg-theme-700/50 transition-colors">
                                {card.secondaryAction}
                            </button>
                            <button className={`px-4 py-2 text-theme-100 text-sm font-medium rounded-lg border border-theme-500/30 transition-colors flex items-center justify-center gap-2 ${card.variant === "primary" ? "bg-theme-500/20 hover:bg-theme-500/30" : "bg-theme-300/20 hover:bg-theme-300/30"}`}>
                                {card.primaryAction} <ArrowRight size={16} />
                            </button>
                        </div>
                    </LiquidGlassCard>
                ))}
            </div>

            <div className="mt-8 flex items-center justify-center">
                <p className="text-sm text-theme-500 flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-theme-500" /> You've caught up on all critical insights for today.
                </p>
            </div>
        </div>
    );
}
