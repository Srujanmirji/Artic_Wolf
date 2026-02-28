"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ShoppingBag, Loader2, Search, ArrowRight, CheckCircle2, AlertTriangle } from "lucide-react";
import { LiquidGlassCard } from "@/components/LiquidGlassCard";
import { getInventoryList, getSalesHistory, recordSale, getDefaultOrgId, type SalesHistoryItem } from "@/lib/api";
import { formatCurrency } from "@/lib/format";
import { useTranslation } from "react-i18next";

export default function OrdersPage() {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const [orgId, setOrgId] = useState<string>("");

    React.useEffect(() => {
        setOrgId(getDefaultOrgId());
    }, []);

    const [selectedProduct, setSelectedProduct] = useState("");
    const [quantity, setQuantity] = useState<number | "">("");
    const [costPrice, setCostPrice] = useState<number | "">("");
    const [sellingPrice, setSellingPrice] = useState<number | "">("");
    const [errorMsg, setErrorMsg] = useState("");
    const [successMsg, setSuccessMsg] = useState("");

    // Fetch Inventory to populate the dropdown
    const { data: inventory, isLoading: isLoadingInventory, error: invQueryError } = useQuery({
        queryKey: ['inventory', orgId],
        queryFn: () => getInventoryList(orgId),
        enabled: !!orgId,
        retry: false
    });

    // Fetch Sales History
    const { data: salesHistory, isLoading: isLoadingSales, error: salesQueryError } = useQuery({
        queryKey: ['salesHistory', orgId],
        queryFn: () => getSalesHistory(orgId),
        enabled: !!orgId,
        retry: false
    });

    // Mutation to record sale
    const recordSaleMutation = useMutation({
        mutationFn: (payload: {
            organization_id: string;
            product_id: string;
            quantity_sold: number;
            cost_price: number;
            selling_price: number;
        }) => recordSale(payload),
        onSuccess: () => {
            setSuccessMsg(t("orders.sale_recorded", "Sale successfully recorded!"));
            setSelectedProduct("");
            setQuantity("");
            setCostPrice("");
            setSellingPrice("");
            // Refetch data
            queryClient.invalidateQueries({ queryKey: ['inventory', orgId] });
            queryClient.invalidateQueries({ queryKey: ['salesHistory', orgId] });
            queryClient.invalidateQueries({ queryKey: ['kpis', orgId] });
            queryClient.invalidateQueries({ queryKey: ['recentActivity', orgId] });

            setTimeout(() => setSuccessMsg(""), 3000);
        },
        onError: (err: unknown) => {
            setErrorMsg(err instanceof Error ? err.message : "Failed to record sale.");
            setTimeout(() => setErrorMsg(""), 4000);
        }
    });

    const handleRecordSale = (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg("");

        if (!selectedProduct) {
            setErrorMsg("Please select a product.");
            return;
        }

        const qtyNum = Number(quantity);
        if (!quantity || isNaN(qtyNum) || qtyNum <= 0) {
            setErrorMsg("Please enter a valid quantity.");
            return;
        }

        const costNum = Number(costPrice);
        if (costPrice === "" || isNaN(costNum) || costNum < 0) {
            setErrorMsg("Please enter a valid cost price.");
            return;
        }

        const sellingNum = Number(sellingPrice);
        if (sellingPrice === "" || isNaN(sellingNum) || sellingNum < 0) {
            setErrorMsg("Please enter a valid selling price.");
            return;
        }

        const product = inventory?.find(p => p.product_id === selectedProduct);
        if (product && product.stock < qtyNum) {
            setErrorMsg(`Insufficient stock. Only ${product.stock} available.`);
            return;
        }

        recordSaleMutation.mutate({
            organization_id: orgId,
            product_id: selectedProduct,
            quantity_sold: qtyNum,
            cost_price: costNum,
            selling_price: sellingNum
        });
    };

    const selectedProductData = inventory?.find(p => p.product_id === selectedProduct);

    React.useEffect(() => {
        if (!selectedProduct) {
            setCostPrice("");
            setSellingPrice("");
            return;
        }

        const product = inventory?.find((p) => p.product_id === selectedProduct);
        if (!product) return;

        if (typeof product.cost_price === "number" && !Number.isNaN(product.cost_price)) {
            setCostPrice(product.cost_price);
        } else {
            setCostPrice("");
        }

        if (typeof product.selling_price === "number" && !Number.isNaN(product.selling_price) && product.selling_price > 0) {
            setSellingPrice(product.selling_price);
        } else if (typeof product.price === "number" && !Number.isNaN(product.price) && product.price > 0) {
            setSellingPrice(product.price);
        } else {
            setSellingPrice("");
        }
    }, [selectedProduct, inventory]);

    const qtyNum = Number(quantity || 0);
    const costNum = Number(costPrice || 0);
    const sellingNum = Number(sellingPrice || 0);
    const unitProfit = sellingNum - costNum;
    const totalProfit = unitProfit * qtyNum;
    const targetRevenue = sellingNum * qtyNum;

    return (
        <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500 pb-10 max-w-7xl mx-auto">

            {!orgId && (
                <div className="p-4 bg-amber-500/10 border border-amber-500/30 text-amber-200 rounded-2xl flex items-center gap-3 mb-6">
                    <AlertTriangle className="w-5 h-5" />
                    <p className="text-sm font-medium">No Organization ID found. Please complete <Link href="/onboarding" className="underline hover:text-white">onboarding</Link> to record sales.</p>
                </div>
            )}

            {(invQueryError || salesQueryError) && (
                <div className="p-4 bg-red-500/10 border border-red-500/30 text-red-200 rounded-2xl flex items-center gap-3 mb-6">
                    <p className="text-sm font-medium">Error: {(invQueryError as Error)?.message || (salesQueryError as Error)?.message}</p>
                </div>
            )}

            <div className="mb-8">
                <h2 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                    <ShoppingBag className="w-8 h-8 text-theme-300" />
                    {t("nav.orders", "Orders & Sales")}
                </h2>
                <p className="text-theme-300 mt-2">{t("orders.subtitle", "Record new sales and track recent transactions.")}</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* RECORD SALE FORM (Spans 1 col) */}
                <div className="lg:col-span-1 border border-theme-700/40 shadow-xl rounded-[2rem] p-6 lg:p-8 bg-black/20 backdrop-blur-xl relative overflow-hidden h-max flex flex-col justify-between">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-theme-500/10 rounded-full blur-3xl -z-10" />
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-theme-700/10 rounded-full blur-2xl -z-10" />

                    <div>
                        <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                            <span className="w-8 h-8 rounded-full bg-theme-500/20 flex items-center justify-center text-theme-100">
                                1
                            </span>
                            {t("orders.new_sale", "Record New Sale")}
                        </h3>

                        <form onSubmit={handleRecordSale} className="space-y-5 relative z-10">

                            {errorMsg && (
                                <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-200 text-sm rounded-xl">
                                    {errorMsg}
                                </div>
                            )}

                            {successMsg && (
                                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-200 text-sm rounded-xl flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4" />
                                    {successMsg}
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-theme-100 mb-1.5">{t("orders.select_product", "Select Product")}</label>
                                <div className="relative">
                                    <select
                                        value={selectedProduct}
                                        onChange={(e) => setSelectedProduct(e.target.value)}
                                        disabled={isLoadingInventory}
                                        className="w-full bg-theme-800/50 border border-theme-700/50 text-white text-sm rounded-xl focus:ring-2 focus:ring-theme-500 focus:border-transparent block p-3 pr-10 appearance-none disabled:opacity-50"
                                    >
                                        <option value="">{isLoadingInventory ? "Loading inventory..." : "Choose a product..."}</option>
                                        {inventory?.filter(i => i.stock > 0).map(item => (
                                            <option key={item.product_id} value={item.product_id}>
                                                {item.name} ({item.stock} in stock)
                                            </option>
                                        ))}
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-theme-300">
                                        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-theme-100 mb-1.5">{t("orders.quantity", "Quantity Sold")}</label>
                                <input
                                    type="number"
                                    min="1"
                                    step="1"
                                    max={selectedProductData?.stock || ""}
                                    value={quantity}
                                    onChange={(e) => setQuantity(e.target.value ? Number(e.target.value) : "")}
                                    placeholder="Enter quantity"
                                    required
                                    className="w-full bg-theme-800/50 border border-theme-700/50 text-white text-sm rounded-xl focus:ring-2 focus:ring-theme-500 focus:border-transparent block p-3"
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-theme-100 mb-1.5">{t("orders.cost_price", "Cost Price")}</label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={costPrice}
                                        onChange={(e) => setCostPrice(e.target.value ? Number(e.target.value) : "")}
                                        placeholder="Enter cost price"
                                        required
                                        className="w-full bg-theme-800/50 border border-theme-700/50 text-white text-sm rounded-xl focus:ring-2 focus:ring-theme-500 focus:border-transparent block p-3"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-theme-100 mb-1.5">{t("orders.selling_price", "Selling Price")}</label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={sellingPrice}
                                        onChange={(e) => setSellingPrice(e.target.value ? Number(e.target.value) : "")}
                                        placeholder="Enter selling price"
                                        required
                                        className="w-full bg-theme-800/50 border border-theme-700/50 text-white text-sm rounded-xl focus:ring-2 focus:ring-theme-500 focus:border-transparent block p-3"
                                    />
                                </div>
                            </div>

                            {selectedProductData && qtyNum > 0 && (
                                <div className="p-4 bg-black/30 rounded-xl border border-theme-700/30">
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-theme-300">Target revenue:</span>
                                        <span className="text-white font-medium">{formatCurrency(targetRevenue)}</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-theme-500">Stock after sale:</span>
                                        <span className="text-theme-100">{selectedProductData.stock - qtyNum} units</span>
                                    </div>
                                    <div className="flex justify-between text-xs mt-1">
                                        <span className="text-theme-500">Unit profit (Selling - Cost):</span>
                                        <span className={unitProfit >= 0 ? "text-emerald-300" : "text-red-300"}>
                                            {formatCurrency(unitProfit, { maximumFractionDigits: 2, minimumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-xs mt-1">
                                        <span className="text-theme-500">Total profit:</span>
                                        <span className={totalProfit >= 0 ? "text-emerald-300" : "text-red-300"}>{formatCurrency(totalProfit)}</span>
                                    </div>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={recordSaleMutation.isPending || !selectedProduct || !quantity || costPrice === "" || sellingPrice === ""}
                                className="w-full bg-theme-100 text-theme-900 hover:bg-white font-semibold py-3 px-4 rounded-xl shadow-[0_0_20px_rgba(204,208,207,0.3)] transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-50 disabled:shadow-none"
                            >
                                {recordSaleMutation.isPending ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Recording...
                                    </>
                                ) : (
                                    <>
                                        {t("orders.submit_btn", "Submit Order")}
                                        <ArrowRight className="w-4 h-4" />
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>

                {/* RECENT SALES HISTORY (Spans 2 cols) */}
                <div className="lg:col-span-2">
                    <LiquidGlassCard className="border border-theme-700/40 p-6 lg:p-8 shadow-xl relative overflow-hidden h-max min-h-[500px]" borderRadius="2rem" blurIntensity="md">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-semibold text-white">{t("orders.recent_sales", "Recent Sales History")}</h3>
                            <div className="relative">
                                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-theme-500" />
                                <input
                                    type="text"
                                    placeholder={t("orders.search", "Search orders...")}
                                    className="bg-black/20 border border-theme-700/50 text-theme-100 text-sm rounded-full focus:ring-2 focus:ring-theme-500 pl-9 pr-4 py-1.5 w-48 transition-all"
                                />
                            </div>
                        </div>

                        {isLoadingSales ? (
                            <div className="flex items-center justify-center text-theme-500 py-20">
                                <Loader2 className="w-6 h-6 animate-spin mr-2" />
                                Loading history...
                            </div>
                        ) : !salesHistory || salesHistory.length === 0 ? (
                            <div className="flex flex-col items-center justify-center text-theme-500 py-20 bg-black/10 rounded-2xl border border-dashed border-theme-700/50">
                                <ShoppingBag className="w-12 h-12 mb-4 opacity-20" />
                                <p>No sales history found.</p>
                                <p className="text-xs mt-1">Record a sale to see it here.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto -mx-6 px-6 lg:mx-0 lg:px-0">
                                <table className="w-full text-left text-sm whitespace-nowrap">
                                    <thead className="text-xs uppercase bg-theme-800/20 text-theme-300">
                                        <tr>
                                            <th className="px-4 py-3 font-medium rounded-l-lg">Date</th>
                                            <th className="px-4 py-3 font-medium">Product Name</th>
                                            <th className="px-4 py-3 font-medium">Category</th>
                                            <th className="px-4 py-3 font-medium">Qty</th>
                                            <th className="px-4 py-3 font-medium text-right rounded-r-lg">Value</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {salesHistory.map((sale: SalesHistoryItem, idx: number) => {
                                            const val = (sale.products?.selling_price || 0) * sale.quantity_sold;
                                            return (
                                                <tr key={sale.id || idx} className="border-b border-theme-800/30 hover:bg-theme-800/20 transition-colors last:border-0">
                                                    <td className="px-4 py-4 text-theme-100 font-mono text-xs">{new Date(sale.date).toLocaleDateString()}</td>
                                                    <td className="px-4 py-4 text-white font-medium">{sale.products?.name || 'Unknown Item'}</td>
                                                    <td className="px-4 py-4"><span className="px-2 py-1 bg-theme-700/30 text-theme-300 text-xs rounded-full">{sale.products?.category || 'N/A'}</span></td>
                                                    <td className="px-4 py-4 text-theme-100 font-medium">{sale.quantity_sold}</td>
                                                    <td className="px-4 py-4 text-right text-emerald-400 font-mono">{formatCurrency(val)}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </LiquidGlassCard>
                </div>

            </div>
        </div>
    );
}
