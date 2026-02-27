"use client"

import { useInventory, useNews } from '../hooks/useDataFetching';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { AlertCircle, WifiOff, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { idb } from '../utils/idb';
import { v4 as uuidv4 } from 'uuid';

export default function Dashboard() {
    const { metrics, loading: metricsLoading } = useInventory();
    const { news, loading: newsLoading } = useNews();
    const isOnline = useOnlineStatus();
    const [uploading, setUploading] = useState(false);

    // MOCK data for the chart based off metrics
    const chartData = metrics?.length > 0 ? metrics.map(m => ({
        name: m.product_id.substring(0, 4), // mock label
        demand: m.forecast_demand,
        safetyStock: m.safety_stock,
    })) : [
        { name: 'ProdA', demand: 120, safetyStock: 20 },
        { name: 'ProdB', demand: 85, safetyStock: 15 },
        { name: 'ProdC', demand: 210, safetyStock: 40 },
    ];

    const handleOfflineUpload = async () => {
        setUploading(true);
        const op = {
            op_id: uuidv4(),
            type: 'sales_upload',
            payload: { warehouse_id: 'wh-1', rows: [{ product_id: 'pd-1', date: new Date().toISOString(), quantity_sold: 10 }] },
            created_at: new Date().toISOString(),
            retry_count: 0
        };

        await idb.put('pending_changes', op);

        // If online, triggers fetch right away ideally, but let's mock the UI response
        setTimeout(() => {
            setUploading(false);
            alert(isOnline ? "Uploaded successfully" : "Added to pending queue (Offline Mode)");
        }, 500);
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 p-4 md:p-8">
            <div className="max-w-7xl mx-auto space-y-6">

                {/* Header and Controls */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                    <div>
                        <h1 className="text-3xl font-bold dark:text-zinc-50">Operations Dashboard</h1>
                        <div className="flex items-center gap-2 mt-2">
                            {isOnline ? (
                                <span className="inline-flex items-center gap-1.5 py-1 px-2.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                                    <span className="w-2 h-2 rounded-full bg-green-500"></span> Online
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1.5 py-1 px-2.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300">
                                    <WifiOff className="w-3 h-3" /> Offline (Changes Queued)
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="mt-4 md:mt-0 flex gap-3">
                        <button
                            onClick={handleOfflineUpload}
                            disabled={uploading}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors"
                        >
                            {uploading ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Upload Sales CSV"}
                        </button>
                    </div>
                </div>

                {/* Top Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm">
                        <h3 className="text-sm font-medium text-gray-500 dark:text-zinc-400">Total Products Tracked</h3>
                        <p className="text-3xl font-bold mt-2 dark:text-white">{metrics?.length || 45}</p>
                    </div>
                    <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm">
                        <h3 className="text-sm font-medium text-gray-500 dark:text-zinc-400">Stockout Risk (High)</h3>
                        <p className="text-3xl font-bold mt-2 text-red-600 dark:text-red-400">3 SKUs</p>
                    </div>
                    <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm">
                        <h3 className="text-sm font-medium text-gray-500 dark:text-zinc-400">Avg Safety Stock</h3>
                        <p className="text-3xl font-bold mt-2 dark:text-white">18%</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Chart Section */}
                    <div className="lg:col-span-2 bg-white dark:bg-zinc-900 p-6 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm h-96">
                        <h3 className="text-lg font-bold mb-4 dark:text-zinc-50">Demand Forecast vs Safety Stock</h3>
                        <ResponsiveContainer width="100%" height="85%">
                            <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" />
                                <XAxis dataKey="name" stroke="#9CA3AF" />
                                <YAxis stroke="#9CA3AF" />
                                <Tooltip contentStyle={{ backgroundColor: '#18181B', border: 'none', borderRadius: '8px', color: '#fff' }} />
                                <Line type="monotone" dataKey="demand" stroke="#3B82F6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 8 }} />
                                <Line type="monotone" dataKey="safetyStock" stroke="#10B981" strokeWidth={3} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>

                    {/* News Feed Section */}
                    <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm overflow-hidden flex flex-col">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2 dark:text-zinc-50">
                            Market Intelligence
                        </h3>
                        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                            {newsLoading ? (
                                <div className="animate-pulse space-y-4">
                                    <div className="h-20 bg-gray-200 dark:bg-zinc-800 rounded"></div>
                                    <div className="h-20 bg-gray-200 dark:bg-zinc-800 rounded"></div>
                                </div>
                            ) : (
                                (news?.length ? news : [
                                    { id: '1', title: 'Supply Chain Component Shortages Easing', impact: 0.12, sentiment_score: 0.6 },
                                    { id: '2', title: 'Port Strikes threaten Holiday Deliveries', impact: -0.24, sentiment_score: -0.8 }
                                ]).map((item: any) => (
                                    <div key={item.id} className="p-3 bg-gray-50 dark:bg-zinc-800/50 rounded-lg border border-gray-100 dark:border-zinc-800 relative">
                                        <h4 className="text-sm font-semibold dark:text-zinc-200 pr-8">{item.title}</h4>
                                        <div className="mt-2 flex items-center justify-between text-xs font-medium">
                                            <span className={item.sentiment_score > 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}>
                                                Sentiment: {(item.sentiment_score * 100).toFixed(0)}%
                                            </span>
                                            <span className="text-blue-600 dark:text-blue-400">
                                                Impact: {(item.impact * 100).toFixed(1)}%
                                            </span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
