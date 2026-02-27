"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Search, Filter, MoreHorizontal, ArrowDown, AlertTriangle, CheckCircle2 } from "lucide-react";
import { LiquidGlassCard } from "@/components/LiquidGlassCard";
import { getDefaultOrgId, getInventoryList, type InventoryItem } from "@/lib/api";
import { formatCurrency } from "@/lib/format";

const INVENTORY_DATA: InventoryItem[] = [
    { id: "INV-001", product_id: "INV-001", name: "Premium Wireless Headphones", category: "Electronics", stock: 124, status: "In Stock", price: 299 },
    { id: "INV-002", product_id: "INV-002", name: "Ergonomic Office Chair", category: "Furniture", stock: 12, status: "Low Stock", price: 199.5 },
    { id: "INV-003", product_id: "INV-003", name: "Mechanical Keyboard", category: "Electronics", stock: 0, status: "Out of Stock", price: 149.99 },
    { id: "INV-004", product_id: "INV-004", name: "Stainless Steel Water Bottle", category: "Accessories", stock: 450, status: "In Stock", price: 35 },
    { id: "INV-005", product_id: "INV-005", name: "Standing Desk Converter", category: "Furniture", stock: 8, status: "Low Stock", price: 250 },
    { id: "INV-006", product_id: "INV-006", name: "Noise Cancelling Earbuds", category: "Electronics", stock: 85, status: "In Stock", price: 159 },
];

export default function InventoryPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [items, setItems] = useState<InventoryItem[]>(INVENTORY_DATA);
    const [loadError, setLoadError] = useState<string | null>(null);
    const orgId = getDefaultOrgId();

    useEffect(() => {
        if (!orgId) return;
        let active = true;
        getInventoryList(orgId)
            .then((data) => {
                if (!active) return;
                if (data && data.length > 0) setItems(data);
            })
            .catch((err) => {
                if (active) setLoadError(err.message || "Failed to load inventory.");
            });
        return () => {
            active = false;
        };
    }, [orgId]);

    const filteredItems = useMemo(() => {
        if (!searchTerm) return items;
        const lower = searchTerm.toLowerCase();
        return items.filter((item) => {
            return (
                item.name.toLowerCase().includes(lower) ||
                item.category.toLowerCase().includes(lower) ||
                item.id.toLowerCase().includes(lower)
            );
        });
    }, [items, searchTerm]);

    return (
        <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
            {/* Header Actions */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="relative group w-full sm:w-auto">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-theme-500" size={18} />
                    <input
                        type="text"
                        placeholder="Search inventory..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="bg-theme-800/40 border border-theme-500/30 rounded-lg py-2 pl-10 pr-4 text-sm text-theme-100 placeholder:text-theme-500 focus:outline-none focus:ring-1 focus:ring-theme-300 w-full sm:w-80 transition-all"
                    />
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <button className="flex items-center gap-2 px-4 py-2 bg-theme-800/40 border border-theme-500/30 rounded-lg text-sm font-medium text-theme-100 hover:bg-theme-700/50 transition-colors w-full sm:w-auto justify-center">
                        <Filter size={16} /> Filters
                    </button>
                    <button className="px-4 py-2 bg-theme-300 text-theme-900 rounded-lg text-sm font-semibold hover:bg-theme-100 transition-colors shadow-[0_0_15px_rgba(155,168,171,0.3)] w-full sm:w-auto justify-center">
                        Add Item
                    </button>
                </div>
            </div>
            {!orgId && (
                <p className="text-xs text-theme-500">Set NEXT_PUBLIC_ORG_ID to load live inventory.</p>
            )}
            {loadError && (
                <p className="text-xs text-theme-500">{loadError}</p>
            )}

            {/* Inventory Table */}
            <LiquidGlassCard className="border border-theme-500/20 overflow-hidden shadow-sm p-0" borderRadius="0.75rem" blurIntensity="md">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-theme-300 uppercase bg-theme-900/50 border-b border-theme-500/20">
                            <tr>
                                <th className="px-6 py-4 font-medium flex items-center gap-1 cursor-pointer hover:text-white">
                                    Product Info <ArrowDown size={14} />
                                </th>
                                <th className="px-6 py-4 font-medium">Category</th>
                                <th className="px-6 py-4 font-medium">Stock Level</th>
                                <th className="px-6 py-4 font-medium">Status</th>
                                <th className="px-6 py-4 font-medium">Unit Price</th>
                                <th className="px-6 py-4 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-theme-500/10">
                            {filteredItems.map((item) => (
                                <tr key={item.id} className="hover:bg-theme-700/20 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="font-semibold text-theme-100">{item.name}</div>
                                        <div className="text-xs text-theme-500 mt-1">{item.id}</div>
                                    </td>
                                    <td className="px-6 py-4 text-theme-300">{item.category}</td>
                                    <td className="px-6 py-4 text-theme-100 font-medium">{item.stock} units</td>
                                    <td className="px-6 py-4">
                                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border
                                            ${item.status === 'In Stock' ? 'bg-theme-500/20 text-theme-100 border-theme-500/30 shadow-[0_0_10px_rgba(74,92,106,0.2)]' :
                                                item.status === 'Low Stock' ? 'bg-theme-300/20 text-white border-theme-300/40 shadow-[0_0_10px_rgba(155,168,171,0.2)]' :
                                                    'bg-theme-700/40 text-theme-300 border-theme-500/30'}`}>
                                            {item.status === 'In Stock' && <CheckCircle2 size={12} />}
                                            {item.status === 'Low Stock' && <AlertTriangle size={12} />}
                                            {item.status === 'Out of Stock' && <AlertTriangle size={12} />}
                                            {item.status}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-theme-300">{formatCurrency(item.price, { maximumFractionDigits: 2, minimumFractionDigits: 2 })}</td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="p-2 text-theme-500 hover:text-theme-100 rounded-lg hover:bg-theme-700/50 transition-colors opacity-0 group-hover:opacity-100">
                                            <MoreHorizontal size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {/* Pagination (Static for demo) */}
                <div className="p-4 border-t border-theme-500/20 flex items-center justify-between text-sm text-theme-500 bg-theme-900/10">
                    <div>Showing <span className="text-theme-300">1</span> to <span className="text-theme-300">6</span> of <span className="text-theme-300">42</span> results</div>
                    <div className="flex gap-2">
                        <button className="px-3 py-1 rounded border border-theme-500/20 hover:bg-theme-700/30 hover:text-theme-100 disabled:opacity-50 transition-colors">Previous</button>
                        <button className="px-3 py-1 rounded border border-theme-500/20 hover:bg-theme-700/30 hover:text-theme-100 transition-colors">Next</button>
                    </div>
                </div>
            </LiquidGlassCard>
        </div>
    );
}
