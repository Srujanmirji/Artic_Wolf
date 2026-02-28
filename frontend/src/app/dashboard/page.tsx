"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar
} from "recharts";
import { cn } from "@/lib/utils";
import { getDashboardKpis, getDefaultOrgId, type DashboardKpis } from "@/lib/api";
import { formatCurrency } from "@/lib/format";
import { LiquidGlassCard } from "@/components/LiquidGlassCard";

const FORECAST_DATA = [
    { name: 'Jan', forecast: 4000, actual: 4400 },
    { name: 'Feb', forecast: 3000, actual: 3200 },
    { name: 'Mar', forecast: 2000, actual: 2800 },
    { name: 'Apr', forecast: 2780, actual: 2908 },
    { name: 'May', forecast: 1890, actual: 1800 },
    { name: 'Jun', forecast: 2390, actual: 2500 },
    { name: 'Jul', forecast: 3490, actual: 3600 },
];

const INVENTORY_BREAKDOWN = [
    { name: 'Electronics', value: 400, color: '#4A5C6A' }, // theme-500
    { name: 'Apparel', value: 300, color: '#9BA8AB' }, // theme-300
    { name: 'Home Goods', value: 300, color: '#CCD0CF' }, // theme-100
    { name: 'Other', value: 200, color: '#253745' }, // theme-700
];

const RECENT_ORDERS = [
    { id: 1, name: 'Logistics Pro', type: 'Restock', amount: '-$12,400', date: 'Today, 09:24', icon: 'LP', color: 'bg-theme-500/20 text-theme-100' },
    { id: 2, name: 'TechSupply Inc', type: 'Fulfillment', amount: '-$8,250', date: 'Yesterday', icon: 'TS', color: 'bg-theme-300/20 text-white' },
    { id: 3, name: 'Global Freight', type: 'Shipping', amount: '-$3,100', date: 'Mar 12', icon: 'GF', color: 'bg-theme-700/40 text-theme-300' },
];

const SPARK_DATA = [
    { val: 10 }, { val: 25 }, { val: 15 }, { val: 40 }, { val: 30 }, { val: 50 }, { val: 45 }
];

export default function DashboardOverview() {
    const orgId = getDefaultOrgId();
    const { data: kpis, error: queryError } = useQuery({
        queryKey: ['kpis', orgId],
        queryFn: () => getDashboardKpis(orgId),
        enabled: !!orgId
    });

    const kpiError = queryError ? (queryError as Error).message : null;

    const totalInventoryValue = kpis?.total_inventory_value ?? 0;
    const holdingCost = kpis?.holding_cost ?? 0;
    const costSavings = kpis?.cost_savings ?? 0;

    return (
        <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500 pb-10">

            {/* Header / Tabs */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
                <h2 className="text-3xl font-bold text-white tracking-tight">My Dashboard</h2>
                <div className="flex bg-theme-800/40 p-1.5 rounded-full border border-theme-700/50 backdrop-blur-md overflow-x-auto no-scrollbar w-max max-w-full">
                    {['All', 'Electronics', 'Apparel', 'Home Goods'].map((tab, i) => (
                        <button key={tab} className={cn(
                            "px-5 py-2 text-sm font-medium transition-all rounded-full whitespace-nowrap",
                            i === 0
                                ? "bg-theme-500/20 text-theme-100 shadow-[0_0_15px_rgba(74,92,106,0.15)]"
                                : "text-theme-300 hover:text-white hover:bg-theme-700/30"
                        )}>
                            {tab}
                        </button>
                    ))}
                </div>
            </div>
            {!orgId && (
                <p className="text-xs text-theme-500">Set NEXT_PUBLIC_ORG_ID to load live data.</p>
            )}
            {kpiError && (
                <p className="text-xs text-theme-500">{kpiError}</p>
            )}

            {/* Main Grid Layout */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

                {/* LEFT COLUMN (Spans 2) */}
                <div className="xl:col-span-2 space-y-6 flex flex-col">

                    {/* Main Chart */}
                    <LiquidGlassCard className="border border-theme-700/40 p-6 shadow-lg flex-1 min-h-[350px]" borderRadius="2rem" blurIntensity="md">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-semibold text-white">Demand Flow</h3>
                            <button className="text-sm text-theme-300 hover:text-white transition-colors">View All &gt;</button>
                        </div>
                        <div className="h-[250px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={FORECAST_DATA} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                                    <defs>
                                        <pattern id="stripe" patternUnits="userSpaceOnUse" width="8" height="8" patternTransform="rotate(45)">
                                            <line x1="0" y1="0" x2="0" y2="8" stroke="#4A5C6A" strokeWidth="3" strokeOpacity="0.3" />
                                        </pattern>
                                        <linearGradient id="purpleGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#9BA8AB" />
                                            <stop offset="100%" stopColor="#4A5C6A" />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(74, 92, 106, 0.1)" vertical={false} />
                                    <XAxis dataKey="name" stroke="#9BA8AB" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                                    <YAxis stroke="#9BA8AB" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `${val / 1000}k`} />
                                    <Tooltip
                                        cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                                        contentStyle={{ backgroundColor: '#11212D', borderColor: '#253745', borderRadius: '12px', color: '#fff' }}
                                    />
                                    <Bar dataKey="forecast" fill="url(#stripe)" radius={[8, 8, 8, 8]} barSize={40} />
                                    {/* Simulated "active" bar overlaying using actual data */}
                                    <Bar dataKey="actual" fill="url(#purpleGradient)" radius={[8, 8, 8, 8]} barSize={40} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </LiquidGlassCard>

                    {/* Bottom Row inside Left Column */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">

                        {/* Donut Chart Component */}
                        <LiquidGlassCard className="border border-theme-700/40 p-6 shadow-lg flex flex-col justify-center" borderRadius="2rem" blurIntensity="md">
                            <div className="flex justify-between items-center mb-2">
                                <h3 className="text-lg font-semibold text-white">Available By Category</h3>
                                <button className="text-sm text-theme-300 hover:text-white transition-colors">View All &gt;</button>
                            </div>
                            <div className="flex-1 flex items-center justify-center relative min-h-[180px]">
                                {/* Custom CSS Donut representation since Recharts PieChart takes complex setup */}
                                <div className="relative w-40 h-40">
                                    <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90 drop-shadow-lg">
                                        {/* Outer track */}
                                        <circle cx="50" cy="50" r="40" fill="transparent" stroke="#11212D" strokeWidth="12" />
                                        {/* Emerald segment replacement (Theme-500) */}
                                        <circle cx="50" cy="50" r="40" fill="transparent" stroke="#4A5C6A" strokeWidth="12" strokeDasharray="251.2" strokeDashoffset="100.48" strokeLinecap="round" />
                                        {/* Violet segment replacement (Theme-300) */}
                                        <circle cx="50" cy="50" r="40" fill="transparent" stroke="#9BA8AB" strokeWidth="12" strokeDasharray="251.2" strokeDashoffset="200" strokeLinecap="round" className="-rotate-45 origin-center" />
                                        {/* Yellow segment replacement (Theme-100) */}
                                        <circle cx="50" cy="50" r="40" fill="transparent" stroke="#CCD0CF" strokeWidth="12" strokeDasharray="251.2" strokeDashoffset="220" strokeLinecap="round" className="rotate-[120deg] origin-center" />
                                    </svg>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                        <span className="text-xl font-bold text-white">{formatCurrency(totalInventoryValue, { notation: "compact", maximumFractionDigits: 1 })}</span>
                                        <span className="text-xs text-theme-300">Total Value</span>
                                    </div>
                                </div>
                            </div>
                        </LiquidGlassCard>

                        {/* KPI Stack */}
                        <div className="flex flex-col gap-6">
                            <LiquidGlassCard className="border border-theme-700/40 p-5 shadow-lg flex-1 flex flex-col justify-center relative overflow-hidden group" borderRadius="2rem" blurIntensity="md">
                                <div className="absolute -right-4 -top-4 w-24 h-24 bg-theme-500/10 rounded-full blur-xl group-hover:bg-theme-500/20 transition-all" />
                                <div className="flex justify-between items-start mb-2 relative z-10">
                                    <h3 className="text-white font-medium">Holding Cost</h3>
                                    <button className="text-theme-300 hover:text-white">...</button>
                                </div>
                                <div className="text-3xl font-bold text-theme-100 mb-1 relative z-10">{formatCurrency(holdingCost, { notation: "compact", maximumFractionDigits: 1 })}</div>
                                <div className="flex justify-between items-center relative z-10">
                                    <p className="text-xs text-theme-300">This month's cost</p>
                                    <span className="bg-theme-500/20 text-theme-300 text-xs font-semibold px-2 py-0.5 rounded-full">-8.2%</span>
                                </div>
                            </LiquidGlassCard>

                            <LiquidGlassCard className="border border-theme-700/40 p-5 shadow-lg flex-1 flex flex-col justify-center relative overflow-hidden group" borderRadius="2rem" blurIntensity="md">
                                <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-theme-300/10 rounded-full blur-xl group-hover:bg-theme-300/20 transition-all" />
                                <div className="flex justify-between items-start mb-2 relative z-10">
                                    <h3 className="text-white font-medium">Cost Savings</h3>
                                    <button className="text-theme-300 hover:text-white">...</button>
                                </div>
                                <div className="text-3xl font-bold text-white mb-1 relative z-10">{formatCurrency(costSavings, { notation: "compact", maximumFractionDigits: 1 })}</div>
                                <div className="flex justify-between items-center relative z-10">
                                    <p className="text-xs text-theme-300">This month's saving</p>
                                    <span className="bg-theme-300/20 text-theme-100 text-xs font-semibold px-2 py-0.5 rounded-full">+24%</span>
                                </div>
                            </LiquidGlassCard>
                        </div>

                    </div>
                </div>


                {/* RIGHT COLUMN (Spans 1) */}
                <div className="space-y-6 flex flex-col">

                    {/* Glassmorphic Gradient Card (My Card equivalent) */}
                    <LiquidGlassCard className="border border-theme-700/40 p-2 shadow-xl relative overflow-hidden h-[330px]" borderRadius="2.5rem" blurIntensity="md">
                        {/* Background structural glow */}
                        <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-b from-theme-700/20 to-transparent pointer-events-none" />

                        {/* The actual "Card" inside */}
                        <div className="bg-gradient-to-br from-theme-500 via-theme-700 to-theme-900 h-48 rounded-[2rem] p-6 relative overflow-hidden shadow-[0_10px_30px_rgba(37,55,69,0.3)] transform transition-transform hover:-translate-y-1">
                            {/* Card abstract shapes */}
                            <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
                            <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-theme-300/30 rounded-full blur-xl" />

                            <div className="relative z-10 flex justify-between items-start mb-6">
                                <span className="text-theme-100 text-sm font-medium opacity-90">Total Value</span>
                                <button className="bg-white/20 hover:bg-white/30 text-white w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-sm transition-colors shadow-sm">
                                    <span className="text-lg leading-none">+</span>
                                </button>
                            </div>
                            <div className="relative z-10 text-4xl font-black tracking-tight text-white drop-shadow-md">
                                {formatCurrency(totalInventoryValue, { notation: "compact", maximumFractionDigits: 1 })}
                            </div>
                            <div className="relative z-10 mt-6 flex justify-between items-center text-theme-100/70 text-xs tracking-wider font-mono">
                                <span>4358 4445 0968 2323</span>
                                <span>08/24</span>
                            </div>
                        </div>

                        {/* Bottom half of the visual card structure in the image */}
                        <div className="px-5 py-4 relative z-10">
                            <div className="flex justify-between items-center">
                                <span className="text-white font-medium">My Inventory</span>
                                <button className="text-xs text-theme-300 hover:text-white transition-colors">View All &gt;</button>
                            </div>
                            <div className="mt-4 flex gap-2">
                                {/* Skeleton visual indicators for the sub-cards effect seen in the image */}
                                <div className="h-10 w-full bg-theme-700/30 rounded-xl" />
                                <div className="h-10 w-full bg-theme-700/10 rounded-xl" />
                            </div>
                        </div>
                    </LiquidGlassCard>

                    {/* Transactions List */}
                    <LiquidGlassCard className="border border-theme-700/40 p-6 shadow-lg flex-1" borderRadius="2rem" blurIntensity="md">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-semibold text-white">Recent Orders</h3>
                            <button className="text-sm text-theme-300 hover:text-white transition-colors">View All &gt;</button>
                        </div>
                        <div className="space-y-5">
                            {RECENT_ORDERS.map((order) => (
                                <div key={order.id} className="flex items-center justify-between group hover:bg-theme-700/20 p-2 -mx-2 rounded-xl transition-colors cursor-pointer">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${order.color}`}>
                                            {order.icon}
                                        </div>
                                        <div>
                                            <p className="text-white font-medium text-sm">{order.name}</p>
                                            <p className="text-theme-500 text-xs">{order.type}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-white font-medium text-sm group-hover:text-theme-300 transition-colors">{order.amount}</p>
                                        <p className="text-theme-500 text-xs">{order.date}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </LiquidGlassCard>

                    {/* Bottom Mini Widgets */}
                    <div className="grid grid-cols-2 gap-4">
                        <LiquidGlassCard className="border border-theme-700/40 p-5 shadow-lg flex flex-col justify-between hover:border-theme-500/30 transition-colors cursor-pointer" borderRadius="2rem" blurIntensity="md">
                            <p className="text-sm font-medium text-white mb-2 relative z-10">Team Access</p>
                            <p className="text-xs text-theme-300 mb-4 line-clamp-2 relative z-10">Manage permissions &amp; invite members</p>
                            <div className="flex -space-x-2 relative z-10">
                                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-theme-300 to-theme-500 border-2 border-theme-800 z-30" />
                                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-theme-500 to-theme-700 border-2 border-theme-800 z-20" />
                                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-theme-100 to-theme-300 border-2 border-theme-800 z-10" />
                            </div>
                        </LiquidGlassCard>

                        <LiquidGlassCard className="border border-theme-700/40 p-5 shadow-lg flex flex-col justify-between group" borderRadius="2rem" blurIntensity="md">
                            <p className="text-sm font-medium text-white mb-3">Efficiency</p>
                            <div className="h-12 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={SPARK_DATA}>
                                        <Line type="monotone" dataKey="val" stroke="#4A5C6A" strokeWidth={3} dot={false} strokeLinecap="round" />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </LiquidGlassCard>
                    </div>

                </div>

            </div>
        </div>
    );
}
