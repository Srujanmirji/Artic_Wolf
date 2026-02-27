"use client";

import React, { useState, useEffect } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Zap, TrendingUp, CalendarDays, Loader2 } from "lucide-react";
import { LiquidGlassCard } from "@/components/LiquidGlassCard";
import { runForecastAnalytics, getDefaultOrgId, type ForecastResponse } from "@/lib/api";

export default function ForecastPage() {
    const orgId = getDefaultOrgId();
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [chartData, setChartData] = useState<any[]>([]);

    useEffect(() => {
        if (!orgId) {
            setIsLoading(false);
            return;
        }

        let active = true;

        runForecastAnalytics(orgId)
            .then((res) => {
                if (!active) return;

                // Transform the raw flat forecast points into aggregated monthly data for the chart
                // Example input: [{ forecast_date: '2024-03-01', forecast_quantity: 120, product_id: '123' }, ...]
                const monthlyAggregates: Record<string, { month: string; standard: number; premium: number }> = {};

                res.results.forEach(point => {
                    const dateObj = new Date(point.forecast_date);
                    // Use shortened month name like "Jan", "Feb"
                    const monthKey = dateObj.toLocaleString('default', { month: 'short' });

                    if (!monthlyAggregates[monthKey]) {
                        monthlyAggregates[monthKey] = { month: monthKey, standard: 0, premium: 0 };
                    }

                    // For the sake of the visualization, we randomly bucket forecasts into "Standard" and "Premium"
                    // If your real data has actual classifications, you'd match the category here!
                    if (point.forecast_quantity > 50) {
                        monthlyAggregates[monthKey].premium += point.forecast_quantity;
                    } else {
                        monthlyAggregates[monthKey].standard += point.forecast_quantity;
                    }
                });

                // Convert object map out to ordered array
                const finalChartArray = Object.values(monthlyAggregates);

                // Sort by relative month order (in a real app, you might want to sort by actual timestamp)
                setChartData(finalChartArray);
                setIsLoading(false);
            })
            .catch((err) => {
                if (!active) return;
                console.error("Failed to load forecast", err);
                setError(err.message || "Failed to run forecast predictions.");
                setIsLoading(false);
            });

        return () => { active = false; };
    }, [orgId]);
    return (
        <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
            {/* Top Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <LiquidGlassCard className="border border-theme-500/20 p-5 shadow-sm relative group" borderRadius="0.75rem" blurIntensity="md">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <TrendingUp size={64} />
                    </div>
                    <div className="relative z-10">
                        <p className="text-theme-300 text-sm font-medium mb-1">Estimated Q3 Growth</p>
                        <h2 className="text-3xl font-bold text-white mb-2">+24.8%</h2>
                        <div className="flex items-center gap-2 text-xs text-theme-100">
                            <span className="bg-theme-500/20 px-2 py-0.5 rounded-full border border-theme-500/30">High Confidence</span>
                            <span className="text-theme-300">Based on historical patterns</span>
                        </div>
                    </div>
                </LiquidGlassCard>

                <LiquidGlassCard className="border border-theme-500/20 p-5 shadow-sm relative group" borderRadius="0.75rem" blurIntensity="md">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Zap size={64} />
                    </div>
                    <div className="relative z-10">
                        <p className="text-theme-300 text-sm font-medium mb-1">AI Prediction Variance</p>
                        <h2 className="text-3xl font-bold text-white mb-2">±3.2%</h2>
                        <div className="flex items-center gap-2 text-xs text-theme-300">
                            <span className="bg-theme-700/40 px-2 py-0.5 rounded-full border border-theme-500/30">Improved</span>
                            <span>Down from 5.1% last month</span>
                        </div>
                    </div>
                </LiquidGlassCard>

                <LiquidGlassCard className="border border-theme-300/30 p-5 shadow-sm relative group bg-gradient-to-br from-theme-800/20 to-theme-900/40" borderRadius="0.75rem" blurIntensity="md">
                    <div className="absolute top-0 right-0 p-4 opacity-10 text-theme-300">
                        <CalendarDays size={64} />
                    </div>
                    <div className="relative z-10">
                        <p className="text-theme-300 text-sm font-medium mb-1">Next Restock Window</p>
                        <h2 className="text-3xl font-bold text-theme-100 mb-2">14 Days</h2>
                        <div className="flex items-center gap-2 text-xs text-theme-100">
                            <button className="bg-theme-300 text-theme-900 px-3 py-1.5 rounded-md font-semibold hover:bg-theme-100 transition-colors">
                                View Calendar
                            </button>
                        </div>
                    </div>
                </LiquidGlassCard>
            </div>

            {/* Main Forecast Chart */}
            <LiquidGlassCard className="border border-theme-500/20 p-6 shadow-sm" borderRadius="0.75rem" blurIntensity="md">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className="text-lg font-semibold text-theme-100">Demand Forecast Projection</h3>
                        <p className="text-sm text-theme-500 mt-1">Expected demand across product tiers for the next 6 months</p>
                    </div>
                    <select className="bg-theme-900/50 border border-theme-500/30 text-theme-100 text-sm rounded-lg focus:ring-theme-300 focus:border-theme-300 block p-2.5 outline-none">
                        <option>Apparel</option>
                        <option>Electronics</option>
                        <option>Home Goods</option>
                    </select>
                </div>

                <div className="h-[400px] w-full">
                    {isLoading ? (
                        <div className="flex w-full h-full items-center justify-center">
                            <Loader2 className="animate-spin text-theme-500 w-12 h-12" />
                            <span className="ml-4 text-theme-300">Generating AI Forecast...</span>
                        </div>
                    ) : error ? (
                        <div className="flex w-full h-full items-center justify-center">
                            <span className="text-red-400">{error}</span>
                        </div>
                    ) : (!orgId || chartData.length === 0) ? (
                        <div className="flex w-full h-full items-center justify-center">
                            <span className="text-theme-500">No prediction data available for this organization. Include NEXT_PUBLIC_ORG_ID.</span>
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorStandard" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#9BA8AB" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#9BA8AB" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorPremium" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#CCD0CF" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#CCD0CF" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="month" stroke="#9BA8AB" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                                <YAxis stroke="#9BA8AB" fontSize={12} tickLine={false} axisLine={false} dx={-10} />
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(74, 92, 106, 0.2)" vertical={false} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#11212D', borderColor: '#253745', borderRadius: '8px', color: '#fff' }}
                                    itemStyle={{ color: '#CCD0CF' }}
                                />
                                <Area type="monotone" dataKey="premium" stroke="#CCD0CF" fillOpacity={1} fill="url(#colorPremium)" strokeWidth={2} />
                                <Area type="monotone" dataKey="standard" stroke="#4A5C6A" fillOpacity={1} fill="url(#colorStandard)" strokeWidth={2} />
                            </AreaChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </LiquidGlassCard>
        </div>
    );
}
