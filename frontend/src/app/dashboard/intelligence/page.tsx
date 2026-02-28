"use client";

import React, { useMemo, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    Activity,
    AlertCircle,
    BarChart3,
    Loader2,
    Mic,
    RefreshCw,
    Sparkles,
    Volume2,
    VolumeX,
    Waves,
    Newspaper,
    Clock3
} from "lucide-react";
import { LiquidGlassCard } from "@/components/LiquidGlassCard";
import {
    analyzeNewsSentiment,
    computeNewsImpact,
    fetchMarketIntelligence,
    getDefaultOrgId,
    getLatestNews,
    type NewsItem,
    type NewsImpactItem,
} from "@/lib/api";
import { timeAgo } from "@/lib/format";
import { useTranslation } from "react-i18next";

declare global {
    interface Window {
        SpeechRecognition?: new () => SpeechRecognition;
        webkitSpeechRecognition?: new () => SpeechRecognition;
    }
}

type SpeechRecognition = {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    onresult: ((event: SpeechRecognitionEvent) => void) | null;
    onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
    onend: (() => void) | null;
    start: () => void;
    stop: () => void;
};

type SpeechRecognitionEvent = {
    results: ArrayLike<ArrayLike<{ transcript: string }>>;
};

type SpeechRecognitionErrorEvent = {
    error: string;
};

function sentimentLabel(score?: number | null) {
    if (score === undefined || score === null) {
        return { text: "Unscored", className: "text-theme-400 bg-theme-900/40 border-theme-700/40" };
    }
    if (score >= 0.3) {
        return { text: "Positive", className: "text-emerald-200 bg-emerald-500/10 border-emerald-500/30" };
    }
    if (score <= -0.3) {
        return { text: "Negative", className: "text-rose-200 bg-rose-500/10 border-rose-500/30" };
    }
    return { text: "Neutral", className: "text-theme-200 bg-theme-700/20 border-theme-500/30" };
}

function buildBriefing(news: NewsItem[], impactRows: NewsImpactItem[]) {
    const scored = news.filter((item) => item.sentiment_score !== null && item.sentiment_score !== undefined);
    const avgSentiment = scored.length > 0
        ? scored.reduce((sum, item) => sum + Number(item.sentiment_score || 0), 0) / scored.length
        : 0;

    const topImpact = [...impactRows].sort((a, b) => b.impact_multiplier - a.impact_multiplier).slice(0, 3);
    const topNews = news.slice(0, 3);

    const mood = avgSentiment >= 0.2 ? "positive" : avgSentiment <= -0.2 ? "negative" : "mixed";

    let script = `Intelligence briefing: Market mood is currently ${mood}. `;

    if (topImpact.length > 0) {
        script += `Top impact multipliers are ${topImpact.map((row) => row.impact_multiplier.toFixed(2)).join(", ")}. `;
    }

    if (topNews.length > 0) {
        script += `Top headlines: `;
        script += topNews.map((item) => item.title || "Untitled article").join(". ");
        script += ".";
    }

    return {
        avgSentiment,
        mood,
        script,
        topImpact,
    };
}

export default function IntelligencePage() {
    const { t } = useTranslation();
    const orgId = getDefaultOrgId();
    const queryClient = useQueryClient();

    const [voiceCommand, setVoiceCommand] = useState("");
    const [voiceError, setVoiceError] = useState("");
    const [isListening, setIsListening] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const recognitionRef = useRef<SpeechRecognition | null>(null);

    const { data: news = [], isLoading: newsLoading, error: newsError } = useQuery({
        queryKey: ["intelligence-news", orgId],
        queryFn: () => getLatestNews(orgId),
        enabled: !!orgId,
    });

    const { data: impactData, error: impactError } = useQuery({
        queryKey: ["intelligence-impact", orgId],
        queryFn: () => computeNewsImpact(orgId),
        enabled: !!orgId,
    });

    const refreshMutation = useMutation({
        mutationFn: () => fetchMarketIntelligence(orgId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["intelligence-news", orgId] });
            queryClient.invalidateQueries({ queryKey: ["news", orgId] });
        },
    });

    const sentimentMutation = useMutation({
        mutationFn: () => analyzeNewsSentiment(orgId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["intelligence-news", orgId] });
            queryClient.invalidateQueries({ queryKey: ["news", orgId] });
            queryClient.invalidateQueries({ queryKey: ["intelligence-impact", orgId] });
        },
    });

    const impactMutation = useMutation({
        mutationFn: () => computeNewsImpact(orgId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["intelligence-impact", orgId] });
        },
    });

    const impactRows = useMemo(() => impactData?.results ?? [], [impactData]);

    const briefing = useMemo(() => buildBriefing(news, impactRows), [news, impactRows]);

    const combinedError =
        (newsError as Error | undefined)?.message ||
        (impactError as Error | undefined)?.message ||
        (refreshMutation.error as Error | undefined)?.message ||
        (sentimentMutation.error as Error | undefined)?.message ||
        (impactMutation.error as Error | undefined)?.message ||
        "";

    const runVoiceCommand = (commandRaw: string) => {
        const command = commandRaw.toLowerCase();

        if (command.includes("refresh") || command.includes("fetch")) {
            refreshMutation.mutate();
            return;
        }
        if (command.includes("sentiment")) {
            sentimentMutation.mutate();
            return;
        }
        if (command.includes("impact")) {
            impactMutation.mutate();
            return;
        }
        if (command.includes("read") || command.includes("brief")) {
            speakBriefing();
            return;
        }
        if (command.includes("stop")) {
            stopSpeaking();
            return;
        }
    };

    const speakBriefing = () => {
        if (typeof window === "undefined" || !("speechSynthesis" in window)) {
            setVoiceError("Speech synthesis is not supported in this browser.");
            return;
        }
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(briefing.script);
        utterance.rate = 1;
        utterance.pitch = 1;
        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => {
            setIsSpeaking(false);
            setVoiceError("Unable to play voice briefing.");
        };

        window.speechSynthesis.speak(utterance);
    };

    const stopSpeaking = () => {
        if (typeof window !== "undefined" && "speechSynthesis" in window) {
            window.speechSynthesis.cancel();
        }
        setIsSpeaking(false);
    };

    const startListening = () => {
        setVoiceError("");

        if (typeof window === "undefined") return;
        const Ctor = window.SpeechRecognition || window.webkitSpeechRecognition;

        if (!Ctor) {
            setVoiceError("Voice commands are not supported in this browser.");
            return;
        }

        if (!recognitionRef.current) {
            recognitionRef.current = new Ctor();
        }

        const recognition = recognitionRef.current;
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = "en-US";

        recognition.onresult = (event) => {
            const transcript = event.results?.[0]?.[0]?.transcript || "";
            setVoiceCommand(transcript);
            runVoiceCommand(transcript);
        };

        recognition.onerror = (event) => {
            setVoiceError(`Voice input error: ${event.error}`);
            setIsListening(false);
        };

        recognition.onend = () => {
            setIsListening(false);
        };

        try {
            recognition.start();
            setIsListening(true);
        } catch {
            setVoiceError("Unable to start voice command session.");
            setIsListening(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500 pb-10 max-w-7xl mx-auto">
            <div className="mb-2">
                <h2 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                    <Activity className="w-8 h-8 text-theme-300" />
                    {t("nav.intelligence", "Intelligence")}
                </h2>
                <p className="text-theme-300 mt-2">AI-driven market signals, sentiment impact, and voice copilot.</p>
            </div>

            {!orgId && (
                <div className="p-4 bg-amber-500/10 border border-amber-500/30 text-amber-200 rounded-2xl flex items-center gap-3">
                    <AlertCircle className="w-5 h-5" />
                    <p className="text-sm font-medium">No organization ID found. Complete onboarding first.</p>
                </div>
            )}

            {combinedError && (
                <div className="p-4 bg-red-500/10 border border-red-500/30 text-red-200 rounded-2xl flex items-center gap-3">
                    <AlertCircle className="w-5 h-5" />
                    <p className="text-sm font-medium">{combinedError}</p>
                </div>
            )}

            <LiquidGlassCard className="border border-theme-700/40 p-6 lg:p-8" borderRadius="1.5rem" blurIntensity="md">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div>
                        <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-theme-300" /> AI Copilot
                        </h3>
                        <p className="text-sm text-theme-300 mt-1">Use buttons or voice commands like refresh intelligence, run sentiment, run impact, or read briefing.</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => refreshMutation.mutate()}
                            disabled={!orgId || refreshMutation.isPending}
                            className="px-4 py-2 rounded-lg border border-theme-500/30 bg-theme-800/50 text-theme-100 hover:bg-theme-700/60 disabled:opacity-50 inline-flex items-center gap-2"
                        >
                            {refreshMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                            Refresh
                        </button>
                        <button
                            onClick={() => sentimentMutation.mutate()}
                            disabled={!orgId || sentimentMutation.isPending}
                            className="px-4 py-2 rounded-lg border border-theme-500/30 bg-theme-800/50 text-theme-100 hover:bg-theme-700/60 disabled:opacity-50 inline-flex items-center gap-2"
                        >
                            {sentimentMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Waves className="w-4 h-4" />}
                            Analyze Sentiment
                        </button>
                        <button
                            onClick={() => impactMutation.mutate()}
                            disabled={!orgId || impactMutation.isPending}
                            className="px-4 py-2 rounded-lg border border-theme-500/30 bg-theme-800/50 text-theme-100 hover:bg-theme-700/60 disabled:opacity-50 inline-flex items-center gap-2"
                        >
                            {impactMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <BarChart3 className="w-4 h-4" />}
                            Compute Impact
                        </button>
                        <button
                            onClick={isSpeaking ? stopSpeaking : speakBriefing}
                            className="px-4 py-2 rounded-lg border border-theme-500/30 bg-theme-500/20 text-theme-100 hover:bg-theme-500/30 inline-flex items-center gap-2"
                        >
                            {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                            {isSpeaking ? "Stop Voice" : "Read Briefing"}
                        </button>
                        <button
                            onClick={startListening}
                            disabled={isListening}
                            className="px-4 py-2 rounded-lg border border-theme-500/30 bg-black/30 text-theme-100 hover:bg-theme-700/30 disabled:opacity-50 inline-flex items-center gap-2"
                        >
                            {isListening ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mic className="w-4 h-4" />}
                            {isListening ? "Listening..." : "Voice Command"}
                        </button>
                    </div>
                </div>

                {(voiceCommand || voiceError) && (
                    <div className="mt-4 p-3 rounded-xl border border-theme-700/40 bg-black/20 text-sm">
                        {voiceCommand && <p className="text-theme-200">Heard: {voiceCommand}</p>}
                        {voiceError && <p className="text-red-300 mt-1">{voiceError}</p>}
                    </div>
                )}
            </LiquidGlassCard>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                <LiquidGlassCard className="border border-theme-700/40 p-5" borderRadius="1rem" blurIntensity="md">
                    <p className="text-theme-400 text-xs uppercase tracking-wide">Articles</p>
                    <p className="text-3xl font-bold text-white mt-1">{news.length}</p>
                </LiquidGlassCard>
                <LiquidGlassCard className="border border-theme-700/40 p-5" borderRadius="1rem" blurIntensity="md">
                    <p className="text-theme-400 text-xs uppercase tracking-wide">Market Mood</p>
                    <p className="text-3xl font-bold text-white mt-1 capitalize">{briefing.mood}</p>
                </LiquidGlassCard>
                <LiquidGlassCard className="border border-theme-700/40 p-5" borderRadius="1rem" blurIntensity="md">
                    <p className="text-theme-400 text-xs uppercase tracking-wide">Avg Sentiment</p>
                    <p className="text-3xl font-bold text-white mt-1">{briefing.avgSentiment.toFixed(2)}</p>
                </LiquidGlassCard>
                <LiquidGlassCard className="border border-theme-700/40 p-5" borderRadius="1rem" blurIntensity="md">
                    <p className="text-theme-400 text-xs uppercase tracking-wide">Impact Rows</p>
                    <p className="text-3xl font-bold text-white mt-1">{impactRows.length}</p>
                </LiquidGlassCard>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-2">
                    <LiquidGlassCard className="border border-theme-700/40 p-6 lg:p-8 min-h-[460px]" borderRadius="1.5rem" blurIntensity="md">
                        <div className="flex items-center justify-between mb-5">
                            <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                                <Newspaper className="w-5 h-5 text-theme-300" /> Latest Intelligence
                            </h3>
                        </div>

                        {newsLoading ? (
                            <div className="flex items-center justify-center text-theme-500 py-24">
                                <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading intelligence...
                            </div>
                        ) : news.length === 0 ? (
                            <div className="flex flex-col items-center justify-center text-theme-500 py-24 bg-black/10 rounded-2xl border border-dashed border-theme-700/50">
                                <Newspaper className="w-12 h-12 mb-4 opacity-20" />
                                <p>No news available.</p>
                                <p className="text-xs mt-1">Click Refresh to fetch latest market intelligence.</p>
                            </div>
                        ) : (
                            <div className="space-y-3 max-h-[560px] overflow-y-auto pr-1">
                                {news.slice(0, 25).map((item) => {
                                    const sentiment = sentimentLabel(item.sentiment_score);
                                    return (
                                        <div key={item.id} className="p-4 rounded-xl border border-theme-700/40 bg-black/20 hover:bg-black/30 transition-colors">
                                            <div className="flex flex-wrap items-center gap-2 mb-2">
                                                <span className={`text-xs px-2 py-0.5 rounded-full border ${sentiment.className}`}>{sentiment.text}</span>
                                                <span className="text-xs text-theme-400 inline-flex items-center gap-1">
                                                    <Clock3 className="w-3 h-3" /> {timeAgo(item.published_at || null)}
                                                </span>
                                                <span className="text-xs text-theme-400">{item.source || "Source unavailable"}</span>
                                            </div>
                                            <h4 className="text-white font-semibold leading-snug">{item.title || "Untitled"}</h4>
                                            {item.description && <p className="text-theme-300 text-sm mt-1 line-clamp-2">{item.description}</p>}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </LiquidGlassCard>
                </div>

                <div>
                    <LiquidGlassCard className="border border-theme-700/40 p-6 lg:p-8 min-h-[460px]" borderRadius="1.5rem" blurIntensity="md">
                        <h3 className="text-xl font-semibold text-white mb-4">AI Briefing</h3>
                        <div className="p-4 rounded-xl border border-theme-700/40 bg-black/20 text-sm text-theme-200 leading-relaxed">
                            {briefing.script}
                        </div>

                        <div className="mt-5">
                            <h4 className="text-sm text-theme-400 uppercase tracking-wide mb-2">Top Impact Multipliers</h4>
                            <div className="space-y-2">
                                {briefing.topImpact.length === 0 ? (
                                    <p className="text-xs text-theme-500">Run Compute Impact to populate this panel.</p>
                                ) : (
                                    briefing.topImpact.map((row) => (
                                        <div key={row.news_id} className="flex items-center justify-between text-sm border border-theme-700/30 rounded-lg px-3 py-2 bg-black/20">
                                            <span className="text-theme-300">{row.news_id.slice(0, 8)}</span>
                                            <span className="text-white font-semibold">{row.impact_multiplier.toFixed(2)}x</span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </LiquidGlassCard>
                </div>
            </div>
        </div>
    );
}
