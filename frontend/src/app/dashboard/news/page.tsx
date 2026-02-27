"use client";

import React, { useEffect, useMemo, useState } from "react";
import { ExternalLink, Clock, TrendingUp, AlertCircle } from "lucide-react";
import { LiquidGlassCard } from "@/components/LiquidGlassCard";
import { getDefaultOrgId, getLatestNews, type NewsItem } from "@/lib/api";
import { timeAgo } from "@/lib/format";

type NewsCard = {
    id: string | number;
    source: string;
    title: string;
    summary: string;
    time: string;
    impact: string;
    impactColor: string;
    type: string;
    url?: string | null;
};

const FALLBACK_NEWS: NewsCard[] = [
    {
        id: 1,
        source: "Global Supply Chain Review",
        title: "Suez Canal Delays Expected to Continue Through Q4",
        summary: "Shipping vessels are facing renewed delays at major chokepoints, potentially impacting inventory deliveries for the upcoming holiday season. Analysts suggest increasing buffer stock.",
        time: "2 hours ago",
        impact: "High Impact",
        impactColor: "text-white bg-theme-500/20 border-theme-500/30",
        type: "Logistics"
    },
    {
        id: 2,
        source: "Tech Hardware Daily",
        title: "Silicon Wafer Shortage Easing",
        summary: "Major semiconductor manufacturers report stabilizing inventory levels. Lead times for consumer electronics components are expected to drop by 15% next month.",
        time: "5 hours ago",
        impact: "Positive Impact",
        impactColor: "text-theme-100 bg-theme-700/20 border-theme-700/30",
        type: "Market Trend"
    },
    {
        id: 3,
        source: "Trade Economics",
        title: "New Tariffs on Imported Textiles Announced",
        summary: "Government agencies have announced an additional 5% tariff on specific textile categories starting next month. Cost holding analysis is recommended.",
        time: "12 hours ago",
        impact: "Medium Impact",
        impactColor: "text-theme-300 bg-theme-900/30 border-theme-500/20",
        type: "Policy"
    }
];

function impactFromSentiment(score?: number | null) {
    if (score === null || score === undefined) {
        return { label: "Market Impact", className: "text-theme-300 bg-theme-900/30 border-theme-500/20" };
    }
    if (score >= 0.35) {
        return { label: "Positive Impact", className: "text-theme-100 bg-theme-700/20 border-theme-700/30" };
    }
    if (score <= -0.35) {
        return { label: "High Impact", className: "text-white bg-theme-500/20 border-theme-500/30" };
    }
    return { label: "Medium Impact", className: "text-theme-300 bg-theme-900/30 border-theme-500/20" };
}

function mapNewsItem(item: NewsItem): NewsCard {
    const impact = impactFromSentiment(item.sentiment_score);
    return {
        id: item.id,
        source: item.source || "Industry Feed",
        title: item.title || "Untitled Update",
        summary: item.description || "No summary available for this article.",
        time: timeAgo(item.published_at || undefined),
        impact: impact.label,
        impactColor: impact.className,
        type: item.industry || "Market Trend",
        url: item.url || null
    };
}

export default function NewsIntelligencePage() {
    const orgId = getDefaultOrgId();
    const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
    const [loadError, setLoadError] = useState<string | null>(null);

    useEffect(() => {
        if (!orgId) return;
        let active = true;
        getLatestNews(orgId)
            .then((data) => {
                if (active) setNewsItems(data || []);
            })
            .catch((err) => {
                if (active) setLoadError(err.message || "Failed to load news.");
            });
        return () => {
            active = false;
        };
    }, [orgId]);

    const cards = useMemo(() => {
        if (!newsItems.length) return FALLBACK_NEWS;
        return newsItems.map(mapNewsItem);
    }, [newsItems]);

    return (
        <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">

            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white tracking-tight">Market Intelligence</h2>
                    <p className="text-theme-300 mt-1">Real-time alerts and news impacting your supply chain</p>
                </div>
                <div className="bg-theme-800/60 flex p-1 rounded-lg border border-theme-500/30">
                    <button className="px-4 py-1.5 text-sm font-medium bg-theme-500/40 text-white rounded-md shadow-sm">Latest</button>
                    <button className="px-4 py-1.5 text-sm font-medium text-theme-300 hover:text-white transition-colors">Saved</button>
                </div>
            </div>
            {!orgId && (
                <p className="text-xs text-theme-500">Set NEXT_PUBLIC_ORG_ID to load live news.</p>
            )}
            {loadError && (
                <p className="text-xs text-theme-500">{loadError}</p>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* News Feed - 2 Columns wide */}
                <div className="lg:col-span-2 space-y-4">
                    {cards.map((news) => (
                        <LiquidGlassCard key={news.id} className="border border-theme-500/20 p-5 group cursor-pointer transition-all duration-300" borderRadius="0.75rem" blurIntensity="md">
                            {/* Hover glow */}
                            <div className="absolute inset-0 bg-gradient-to-r from-theme-300/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                            <div className="flex justify-between items-start mb-3 relative z-10">
                                <div className="flex items-center gap-2">
                                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${news.impactColor}`}>
                                        {news.impact}
                                    </span>
                                    <span className="text-xs text-theme-500 flex items-center gap-1">
                                        <Clock size={12} /> {news.time}
                                    </span>
                                </div>
                                <span className="text-xs font-medium text-theme-300 bg-theme-900/50 px-2 py-1 rounded">
                                    {news.type}
                                </span>
                            </div>

                            <h3 className="text-lg font-semibold text-theme-100 mb-2 group-hover:text-white transition-colors">
                                {news.title}
                            </h3>
                            <p className="text-sm text-theme-300 leading-relaxed mb-4">
                                {news.summary}
                            </p>

                            <div className="flex items-center justify-between text-sm relative z-10 border-t border-theme-500/10 pt-4 mt-2">
                                <span className="text-theme-500 font-medium">{news.source}</span>
                                <a
                                    href={news.url || "#"}
                                    target={news.url ? "_blank" : undefined}
                                    rel={news.url ? "noreferrer" : undefined}
                                    className="text-theme-300 flex items-center gap-1 group-hover:text-theme-100 transition-colors"
                                >
                                    Read Full Article <ExternalLink size={14} />
                                </a>
                            </div>
                        </LiquidGlassCard>
                    ))}

                    <button className="w-full py-3 border border-theme-500/20 rounded-xl text-theme-300 font-medium hover:bg-theme-800/40 transition-colors">
                        Load More Updates
                    </button>
                </div>

                {/* Sidebar intelligence stats */}
                <div className="space-y-6">
                    <LiquidGlassCard className="border border-theme-500/30 p-5 shadow-sm" borderRadius="0.75rem" blurIntensity="md">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-theme-300/20 text-theme-100 rounded-lg">
                                <TrendingUp size={20} />
                            </div>
                            <h3 className="font-semibold text-white">Sentiment AI</h3>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-theme-300">Market Mood</span>
                                    <span className="text-theme-100 font-medium">Positive (68%)</span>
                                </div>
                                <div className="w-full bg-theme-900 rounded-full h-2">
                                    <div className="bg-gradient-to-r from-theme-500 to-theme-300 h-2 rounded-full" style={{ width: '68%' }}></div>
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-theme-300">Risk Factor</span>
                                    <span className="text-theme-300 font-medium">Elevated (42%)</span>
                                </div>
                                <div className="w-full bg-theme-900 rounded-full h-2">
                                    <div className="bg-theme-500 h-2 rounded-full" style={{ width: '42%' }}></div>
                                </div>
                            </div>
                        </div>
                    </LiquidGlassCard>

                    <LiquidGlassCard className="border border-theme-500/20 p-5 shadow-sm space-y-4" borderRadius="0.75rem" blurIntensity="md">
                        <h3 className="font-semibold text-white flex items-center gap-2">
                            <AlertCircle size={16} className="text-theme-300" /> Topic Watchlist
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {['Semiconductors', 'Freight Rates', 'Port Automation', 'Raw Materials', 'Tariffs'].map(topic => (
                                <span key={topic} className="px-3 py-1 bg-theme-900/50 border border-theme-500/20 rounded-full text-xs text-theme-300 cursor-pointer hover:border-theme-300 hover:text-white transition-colors">
                                    {topic}
                                </span>
                            ))}
                        </div>
                    </LiquidGlassCard>
                </div>

            </div>
        </div>
    );
}
