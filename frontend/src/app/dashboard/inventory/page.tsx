"use client";

import React, { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Filter, MoreHorizontal, ArrowDown, AlertTriangle, CheckCircle2 } from "lucide-react";
import { LiquidGlassCard } from "@/components/LiquidGlassCard";
import { getDefaultOrgId, getInventoryList, addInventoryItem, updateInventoryItem, deleteInventoryItem, type InventoryItem } from "@/lib/api";
import { formatCurrency } from "@/lib/format";
import { useTranslation } from "react-i18next";

export default function InventoryPage() {
    const { t } = useTranslation();
    const [searchTerm, setSearchTerm] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
    const [formData, setFormData] = useState({ name: "", category: "", price: 0, stock: 0 });

    const orgId = getDefaultOrgId();
    const queryClient = useQueryClient();

    const { data: itemsData, error: queryError, isLoading } = useQuery({
        queryKey: ['inventory', orgId],
        queryFn: () => getInventoryList(orgId),
        enabled: !!orgId
    });

    const invalidateTokens = () => {
        queryClient.invalidateQueries({ queryKey: ['inventory', orgId] });
        queryClient.invalidateQueries({ queryKey: ['kpis', orgId] });
    };

    const addMutation = useMutation({
        mutationFn: (payload: typeof formData) => addInventoryItem(orgId, payload),
        onSuccess: () => { invalidateTokens(); setIsModalOpen(false); }
    });

    const updateMutation = useMutation({
        mutationFn: (payload: typeof formData) => updateInventoryItem(orgId, editingItem!.product_id, payload),
        onSuccess: () => { invalidateTokens(); setIsModalOpen(false); }
    });

    const deleteMutation = useMutation({
        mutationFn: (productId: string) => deleteInventoryItem(orgId, productId),
        onSuccess: () => { invalidateTokens(); }
    });

    const handleSave = () => {
        if (!orgId) return;
        if (editingItem) updateMutation.mutate(formData);
        else addMutation.mutate(formData);
    };

    const handleDelete = (productId: string) => {
        if (!orgId || !confirm(t("inventory.confirm_delete", "Are you sure you want to delete this specific product permanently?"))) return;
        deleteMutation.mutate(productId);
    };

    const loadError = queryError ? (queryError as Error).message :
        addMutation.error ? (addMutation.error as Error).message :
            updateMutation.error ? (updateMutation.error as Error).message :
                deleteMutation.error ? (deleteMutation.error as Error).message : null;

    const isWorking = addMutation.isPending || updateMutation.isPending;

    const items = itemsData || [];

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
                        placeholder={t("inventory.search_placeholder", "Search inventory...")}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="bg-theme-800/40 border border-theme-500/30 rounded-lg py-2 pl-10 pr-4 text-sm text-theme-100 placeholder:text-theme-500 focus:outline-none focus:ring-1 focus:ring-theme-300 w-full sm:w-80 transition-all"
                    />
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <button className="flex items-center gap-2 px-4 py-2 bg-theme-800/40 border border-theme-500/30 rounded-lg text-sm font-medium text-theme-100 hover:bg-theme-700/50 transition-colors w-full sm:w-auto justify-center">
                        <Filter size={16} /> {t("inventory.filters", "Filters")}
                    </button>
                    <button
                        onClick={() => {
                            setEditingItem(null);
                            setFormData({ name: "", category: "General", price: 0, stock: 0 });
                            setIsModalOpen(true);
                        }}
                        disabled={!orgId || isLoading}
                        className="px-4 py-2 bg-theme-300 text-theme-900 rounded-lg text-sm font-semibold hover:bg-theme-100 transition-colors shadow-[0_0_15px_rgba(155,168,171,0.3)] w-full sm:w-auto justify-center disabled:opacity-50"
                    >
                        {t("inventory.add_item", "Add Item")}
                    </button>
                </div>
            </div>
            {!orgId && (
                <p className="text-xs text-theme-500">{t("inventory.no_org_id", "Set NEXT_PUBLIC_ORG_ID to load live inventory.")}</p>
            )}
            {loadError && (
                <p className="text-xs text-red-500">{loadError}</p>
            )}

            {/* Inventory Table */}
            <LiquidGlassCard className="border border-theme-500/20 overflow-hidden shadow-sm p-0" borderRadius="0.75rem" blurIntensity="md">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-theme-300 uppercase bg-theme-900/50 border-b border-theme-500/20">
                            <tr>
                                <th className="px-6 py-4 font-medium flex items-center gap-1 cursor-pointer hover:text-white">
                                    {t("inventory.product_info", "Product Info")} <ArrowDown size={14} />
                                </th>
                                <th className="px-6 py-4 font-medium">{t("inventory.category", "Category")}</th>
                                <th className="px-6 py-4 font-medium">{t("inventory.stock_level", "Stock Level")}</th>
                                <th className="px-6 py-4 font-medium">{t("inventory.status", "Status")}</th>
                                <th className="px-6 py-4 font-medium">{t("inventory.unit_price", "Unit Price")}</th>
                                <th className="px-6 py-4 font-medium text-right">{t("inventory.actions", "Actions")}</th>
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
                                    <td className="px-6 py-4 text-theme-100 font-medium">{item.stock} {t("inventory.units", "units")}</td>
                                    <td className="px-6 py-4">
                                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border
                                            ${item.status === 'In Stock' ? 'bg-theme-500/20 text-theme-100 border-theme-500/30 shadow-[0_0_10px_rgba(74,92,106,0.2)]' :
                                                item.status === 'Low Stock' ? 'bg-theme-300/20 text-white border-theme-300/40 shadow-[0_0_10px_rgba(155,168,171,0.2)]' :
                                                    'bg-theme-700/40 text-theme-300 border-theme-500/30'}`}>
                                            {item.status === 'In Stock' && <CheckCircle2 size={12} />}
                                            {item.status === 'Low Stock' && <AlertTriangle size={12} />}
                                            {item.status === 'Out of Stock' && <AlertTriangle size={12} />}
                                            {item.status === 'In Stock' ? t("inventory.in_stock", "In Stock") : item.status === 'Low Stock' ? t("inventory.low_stock", "Low Stock") : item.status}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-theme-300">{formatCurrency(item.price, { maximumFractionDigits: 2, minimumFractionDigits: 2 })}</td>
                                    <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                                        <button
                                            onClick={() => {
                                                setEditingItem(item);
                                                setFormData({ name: item.name, category: item.category, price: item.price, stock: item.stock });
                                                setIsModalOpen(true);
                                            }}
                                            className="p-2 text-theme-500 hover:text-theme-100 rounded-lg hover:bg-theme-700/50 transition-colors opacity-0 group-hover:opacity-100"
                                        >
                                            <MoreHorizontal size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(item.product_id)}
                                            disabled={deleteMutation.isPending}
                                            className="p-2 text-red-500/70 hover:text-red-400 rounded-lg hover:bg-theme-700/50 transition-colors opacity-0 group-hover:opacity-100"
                                        >
                                            <AlertTriangle size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {/* Pagination (Static for demo) */}
                <div className="p-4 border-t border-theme-500/20 flex items-center justify-between text-sm text-theme-500 bg-theme-900/10">
                    <div>{t("inventory.showing", "Showing")} <span className="text-theme-300">{filteredItems.length}</span> {t("inventory.out_of", "out of")} <span className="text-theme-300">{items.length}</span> {t("inventory.results", "results")}</div>
                </div>
            </LiquidGlassCard>

            {/* Form Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <LiquidGlassCard className="w-full max-w-md p-6 border border-theme-500/30" borderRadius="1rem" blurIntensity="lg">
                        <h3 className="text-xl font-bold text-white mb-4">
                            {editingItem ? t("inventory.edit_product", "Edit Product") : t("inventory.add_new_product", "Add New Product")}
                        </h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-theme-300 mb-1">{t("inventory.product_name", "Product Name")}</label>
                                <input
                                    type="text"
                                    className="w-full bg-theme-800/40 border border-theme-500/30 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-1 focus:ring-theme-300"
                                    value={formData.name} onChange={e => setFormData(f => ({ ...f, name: e.target.value }))}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-theme-300 mb-1">{t("inventory.category_label", "Category")}</label>
                                <input
                                    type="text"
                                    className="w-full bg-theme-800/40 border border-theme-500/30 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-1 focus:ring-theme-300"
                                    value={formData.category} onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-theme-300 mb-1">{t("inventory.unit_price_label", "Unit Price ($)")}</label>
                                    <input
                                        type="number" step="0.01" min="0"
                                        className="w-full bg-theme-800/40 border border-theme-500/30 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-1 focus:ring-theme-300"
                                        value={formData.price} onChange={e => setFormData(f => ({ ...f, price: parseFloat(e.target.value) || 0 }))}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-theme-300 mb-1">{t("inventory.current_stock", "Current Stock")}</label>
                                    <input
                                        type="number" step="1" min="0"
                                        className="w-full bg-theme-800/40 border border-theme-500/30 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-1 focus:ring-theme-300"
                                        value={formData.stock} onChange={e => setFormData(f => ({ ...f, stock: parseInt(e.target.value) || 0 }))}
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-theme-500/20">
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 rounded-lg text-theme-300 hover:text-white hover:bg-theme-700/50 transition-colors"
                                >
                                    {t("common.cancel", "Cancel")}
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={isWorking}
                                    className="px-4 py-2 bg-theme-300 text-theme-900 rounded-lg font-semibold hover:bg-theme-100 transition-colors disabled:opacity-50"
                                >
                                    {isWorking ? t("common.saving", "Saving...") : t("inventory.save_product", "Save Product")}
                                </button>
                            </div>
                        </div>
                    </LiquidGlassCard>
                </div>
            )}
        </div>
    );
}
