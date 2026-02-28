"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { LiquidGlassCard } from "@/components/LiquidGlassCard";
import { submitOnboarding, type OnboardingPayload } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/useAuthStore";
import {
    Building2,
    MapPin,
    ShoppingCart,
    Truck,
    ChevronRight,
    ChevronLeft,
    Check,
    Loader2,
    Sparkles,
} from "lucide-react";

const STEPS = [
    { id: 1, title: "Your Business", icon: Building2 },
    { id: 2, title: "Inventory Details", icon: ShoppingCart },
    { id: 3, title: "Supply Chain", icon: Truck },
];

const BUSINESS_TYPES = [
    "Retail",
    "Warehouse",
    "Manufacturer",
    "Distributor",
    "SME",
];

const PRODUCT_TYPES = [
    "Groceries",
    "Electronics",
    "Clothing",
    "Medicines",
    "Hardware",
    "Cosmetics",
    "Automotive",
    "Other",
];

const INVENTORY_CATEGORIES = [
    "Perishable",
    "Non-Perishable",
    "High-Value",
    "Fast-Moving",
];

const VOLUME_RANGES = [
    "Under ₹1L",
    "₹1L – ₹5L",
    "₹5L – ₹25L",
    "₹25L – ₹1Cr",
    "Above ₹1Cr",
];

function SelectableChip({
    label,
    selected,
    onClick,
}: {
    label: string;
    selected: boolean;
    onClick: () => void;
}) {
    return (
        <motion.button
            type="button"
            onClick={onClick}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`px-4 py-2.5 rounded-full text-sm font-semibold border transition-all duration-200 ${selected
                ? "bg-gradient-to-r from-theme-500 to-theme-300 text-theme-900 border-transparent shadow-[0_0_15px_rgba(204,208,207,0.2)]"
                : "bg-theme-800/40 text-theme-300 border-theme-700/50 hover:bg-theme-700/50 hover:text-white"
                }`}
        >
            {label}
        </motion.button>
    );
}

function FloatingInput({
    label,
    value,
    onChange,
    type = "text",
    required = false,
    placeholder,
}: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    type?: string;
    required?: boolean;
    placeholder?: string;
}) {
    return (
        <div className="space-y-1.5">
            <label className="text-xs font-semibold text-theme-400 uppercase tracking-wider">
                {label} {required && <span className="text-rose-400">*</span>}
            </label>
            <input
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                required={required}
                className="w-full bg-theme-800/50 border border-theme-700/50 rounded-xl px-4 py-3 text-sm text-white placeholder:text-theme-600 focus:outline-none focus:ring-2 focus:ring-theme-500/50 focus:border-theme-500/50 transition-all"
            />
        </div>
    );
}

export default function OnboardingPage() {
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [userId, setUserId] = useState<string | null>(null);

    // Form state
    const [businessName, setBusinessName] = useState("");
    const [businessType, setBusinessType] = useState("");
    const [locationCount, setLocationCount] = useState("1");
    const [region, setRegion] = useState("");
    const [productTypes, setProductTypes] = useState("");
    const [inventoryCategory, setInventoryCategory] = useState("");
    const [monthlyVolume, setMonthlyVolume] = useState("");
    const [seasonalDemand, setSeasonalDemand] = useState(false);
    const [supplierLeadTime, setSupplierLeadTime] = useState("14");

    // Draft auto-save
    useEffect(() => {
        const draft = localStorage.getItem("onboarding_draft");
        if (draft) {
            try {
                const d = JSON.parse(draft);
                setBusinessName(d.businessName || "");
                setBusinessType(d.businessType || "");
                setLocationCount(d.locationCount || "1");
                setRegion(d.region || "");
                setProductTypes(d.productTypes || "");
                setInventoryCategory(d.inventoryCategory || "");
                setMonthlyVolume(d.monthlyVolume || "");
                setSeasonalDemand(d.seasonalDemand || false);
                setSupplierLeadTime(d.supplierLeadTime || "14");
                setCurrentStep(d.currentStep || 1);
            } catch { }
        }
    }, []);

    useEffect(() => {
        const draft = {
            businessName,
            businessType,
            locationCount,
            region,
            productTypes,
            inventoryCategory,
            monthlyVolume,
            seasonalDemand,
            supplierLeadTime,
            currentStep,
        };
        localStorage.setItem("onboarding_draft", JSON.stringify(draft));
    }, [
        businessName,
        businessType,
        locationCount,
        region,
        productTypes,
        inventoryCategory,
        monthlyVolume,
        seasonalDemand,
        supplierLeadTime,
        currentStep,
    ]);

    // Fetch user ID from session or auth store (for Google-auth users)
    useEffect(() => {
        const authUser = useAuthStore.getState().user;
        if (authUser?.id) {
            setUserId(authUser.id);
            return;
        }

        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session?.user) {
                setUserId(session.user.id);
            } else {
                router.replace("/");
            }
        });
    }, [router]);

    const canProceed = () => {
        if (currentStep === 1) return businessName.trim().length > 0 && businessType.length > 0;
        if (currentStep === 2) return productTypes.length > 0 && inventoryCategory.length > 0;
        return true;
    };

    const handleSubmit = async () => {
        if (!userId) return;
        setIsSubmitting(true);
        setError("");

        try {
            const payload: OnboardingPayload = {
                user_id: userId,
                business_name: businessName,
                business_type: businessType,
                location_count: parseInt(locationCount) || 1,
                region,
                product_types: productTypes,
                inventory_category: inventoryCategory,
                monthly_volume: monthlyVolume,
                seasonal_demand: seasonalDemand,
                supplier_lead_time: parseInt(supplierLeadTime) || 14,
            };

            const result = await submitOnboarding(payload);

            // Save org ID for future API calls
            if (result.organization_id) {
                localStorage.setItem("aagam_org_id", result.organization_id);
            }

            // Clear draft
            localStorage.removeItem("onboarding_draft");

            // Redirect to dashboard with a short delay for celebration
            setTimeout(() => {
                router.replace("/dashboard");
            }, 1500);
        } catch (err: any) {
            setError(err.message || "Something went wrong. Please try again.");
            setIsSubmitting(false);
        }
    };

    const progress = (currentStep / STEPS.length) * 100;

    return (
        <div className="min-h-screen bg-theme-900 text-white relative overflow-hidden">
            {/* Ambient Background */}
            <div className="absolute top-[-10%] right-[-10%] w-[50rem] h-[50rem] bg-gradient-to-br from-theme-500/20 to-theme-300/10 rounded-full blur-[150px] pointer-events-none" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[60rem] h-[60rem] bg-gradient-to-tr from-theme-300/20 to-theme-100/5 rounded-full blur-[150px] pointer-events-none" />
            <div className="absolute top-[30%] left-[20%] w-[40rem] h-[40rem] bg-theme-500/10 rounded-full blur-[120px] pointer-events-none" />

            <div className="relative z-10 flex flex-col items-center justify-start min-h-screen p-4 sm:p-8">
                {/* Logo & Title */}
                <div className="flex flex-col items-center gap-4 pt-8 pb-6">
                    <Image
                        src="/aagam-logo.png"
                        alt="Aagam AI"
                        width={180}
                        height={50}
                        className="drop-shadow-[0_0_15px_rgba(255,255,255,0.1)] w-auto h-10 sm:h-12 object-contain"
                    />
                    <div className="text-center">
                        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                            Let's set up your workspace
                        </h1>
                        <p className="text-theme-400 mt-1 text-sm sm:text-base">
                            We'll personalize your analytics and forecasting models
                        </p>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full max-w-2xl mb-6">
                    <div className="flex items-center justify-between mb-3">
                        {STEPS.map((step) => {
                            const StepIcon = step.icon;
                            const isActive = currentStep >= step.id;
                            return (
                                <div key={step.id} className="flex items-center gap-2">
                                    <div
                                        className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${isActive
                                            ? "bg-gradient-to-r from-theme-500 to-theme-300 text-theme-900 shadow-[0_0_12px_rgba(204,208,207,0.3)]"
                                            : "bg-theme-800/60 text-theme-500 border border-theme-700/50"
                                            }`}
                                    >
                                        {currentStep > step.id ? (
                                            <Check size={16} strokeWidth={3} />
                                        ) : (
                                            <StepIcon size={16} />
                                        )}
                                    </div>
                                    <span
                                        className={`text-xs font-semibold hidden sm:block ${isActive ? "text-white" : "text-theme-500"
                                            }`}
                                    >
                                        {step.title}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                    <div className="h-1.5 bg-theme-800/60 rounded-full overflow-hidden">
                        <motion.div
                            className="h-full bg-gradient-to-r from-theme-500 to-theme-300 rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 0.5, ease: "easeOut" }}
                        />
                    </div>
                </div>

                {/* Form Card */}
                <LiquidGlassCard
                    className="w-full max-w-2xl border border-theme-700/40 p-8 sm:p-10 shadow-[0_20px_60px_rgba(0,0,0,0.5)]"
                    borderRadius="2rem"
                    blurIntensity="xl"
                    glowIntensity="sm"
                >
                    <AnimatePresence mode="wait">
                        {/* STEP 1 – Business Info */}
                        {currentStep === 1 && (
                            <motion.div
                                key="step1"
                                initial={{ opacity: 0, x: 40 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -40 }}
                                transition={{ duration: 0.35 }}
                                className="space-y-6"
                            >
                                <div className="flex items-center gap-3 mb-2">
                                    <Building2 className="text-theme-300" size={22} />
                                    <h2 className="text-xl font-bold">Business Information</h2>
                                </div>

                                <FloatingInput
                                    label="Business Name"
                                    value={businessName}
                                    onChange={setBusinessName}
                                    required
                                    placeholder="e.g. Artic Wolf Logistics"
                                />

                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-theme-400 uppercase tracking-wider">
                                        Business Type <span className="text-rose-400">*</span>
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        {BUSINESS_TYPES.map((t) => (
                                            <SelectableChip
                                                key={t}
                                                label={t}
                                                selected={businessType === t}
                                                onClick={() => setBusinessType(t)}
                                            />
                                        ))}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <FloatingInput
                                        label="Number of Locations"
                                        value={locationCount}
                                        onChange={setLocationCount}
                                        type="number"
                                        placeholder="e.g. 3"
                                    />
                                    <FloatingInput
                                        label="Operating Region"
                                        value={region}
                                        onChange={setRegion}
                                        placeholder="e.g. Karnataka, India"
                                    />
                                </div>
                            </motion.div>
                        )}

                        {/* STEP 2 – Product & Inventory Details */}
                        {currentStep === 2 && (
                            <motion.div
                                key="step2"
                                initial={{ opacity: 0, x: 40 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -40 }}
                                transition={{ duration: 0.35 }}
                                className="space-y-6"
                            >
                                <div className="flex items-center gap-3 mb-2">
                                    <ShoppingCart className="text-theme-300" size={22} />
                                    <h2 className="text-xl font-bold">Product & Inventory</h2>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-theme-400 uppercase tracking-wider">
                                        Product Types <span className="text-rose-400">*</span>
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        {PRODUCT_TYPES.map((t) => (
                                            <SelectableChip
                                                key={t}
                                                label={t}
                                                selected={productTypes === t}
                                                onClick={() => setProductTypes(t)}
                                            />
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-theme-400 uppercase tracking-wider">
                                        Inventory Category <span className="text-rose-400">*</span>
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        {INVENTORY_CATEGORIES.map((t) => (
                                            <SelectableChip
                                                key={t}
                                                label={t}
                                                selected={inventoryCategory === t}
                                                onClick={() => setInventoryCategory(t)}
                                            />
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-theme-400 uppercase tracking-wider">
                                        Average Monthly Sales Volume
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        {VOLUME_RANGES.map((v) => (
                                            <SelectableChip
                                                key={v}
                                                label={v}
                                                selected={monthlyVolume === v}
                                                onClick={() => setMonthlyVolume(v)}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* STEP 3 – Supply Chain */}
                        {currentStep === 3 && (
                            <motion.div
                                key="step3"
                                initial={{ opacity: 0, x: 40 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -40 }}
                                transition={{ duration: 0.35 }}
                                className="space-y-6"
                            >
                                <div className="flex items-center gap-3 mb-2">
                                    <Truck className="text-theme-300" size={22} />
                                    <h2 className="text-xl font-bold">Supply Chain</h2>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-theme-400 uppercase tracking-wider">
                                        Seasonal Demand Patterns?
                                    </label>
                                    <div className="flex gap-3">
                                        <SelectableChip
                                            label="Yes, demand fluctuates"
                                            selected={seasonalDemand === true}
                                            onClick={() => setSeasonalDemand(true)}
                                        />
                                        <SelectableChip
                                            label="No, relatively stable"
                                            selected={seasonalDemand === false}
                                            onClick={() => setSeasonalDemand(false)}
                                        />
                                    </div>
                                </div>

                                <FloatingInput
                                    label="Average Supplier Lead Time (days)"
                                    value={supplierLeadTime}
                                    onChange={setSupplierLeadTime}
                                    type="number"
                                    placeholder="e.g. 14"
                                />

                                {/* Summary */}
                                <div className="bg-theme-800/30 border border-theme-700/30 rounded-2xl p-5 space-y-3 mt-4">
                                    <div className="flex items-center gap-2 text-theme-300">
                                        <Sparkles size={16} />
                                        <h3 className="text-sm font-bold uppercase tracking-wider">Quick Summary</h3>
                                    </div>
                                    <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-sm">
                                        <span className="text-theme-500">Business</span>
                                        <span className="text-white font-medium">{businessName || "-"}</span>
                                        <span className="text-theme-500">Type</span>
                                        <span className="text-white font-medium">{businessType || "-"}</span>
                                        <span className="text-theme-500">Products</span>
                                        <span className="text-white font-medium">{productTypes || "-"}</span>
                                        <span className="text-theme-500">Category</span>
                                        <span className="text-white font-medium">{inventoryCategory || "-"}</span>
                                        <span className="text-theme-500">Lead Time</span>
                                        <span className="text-white font-medium">{supplierLeadTime} days</span>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Error Display */}
                    {error && (
                        <div className="mt-4 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-sm text-red-400">
                            {error}
                        </div>
                    )}

                    {/* Navigation Buttons */}
                    <div className="flex items-center justify-between mt-8 gap-4">
                        <motion.button
                            onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
                            disabled={currentStep === 1}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${currentStep === 1
                                ? "text-theme-600 cursor-not-allowed"
                                : "bg-theme-800/40 text-theme-300 border border-theme-700/50 hover:bg-theme-700/50"
                                }`}
                        >
                            <ChevronLeft size={18} />
                            Back
                        </motion.button>

                        {currentStep < STEPS.length ? (
                            <motion.button
                                onClick={() => setCurrentStep(Math.min(STEPS.length, currentStep + 1))}
                                disabled={!canProceed()}
                                whileHover={{ scale: canProceed() ? 1.02 : 1 }}
                                whileTap={{ scale: canProceed() ? 0.98 : 1 }}
                                className={`flex items-center gap-2 px-8 py-3 rounded-xl font-bold transition-all ${canProceed()
                                    ? "bg-gradient-to-r from-theme-500 to-theme-300 text-theme-900 shadow-[0_4px_15px_rgba(204,208,207,0.2)] hover:shadow-[0_4px_25px_rgba(204,208,207,0.35)]"
                                    : "bg-theme-800/40 text-theme-600 border border-theme-700/50 cursor-not-allowed"
                                    }`}
                            >
                                Continue
                                <ChevronRight size={18} />
                            </motion.button>
                        ) : (
                            <motion.button
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                                whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
                                whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
                                className="flex items-center gap-2 px-8 py-3 rounded-xl font-bold bg-gradient-to-r from-theme-500 to-theme-300 text-theme-900 shadow-[0_4px_15px_rgba(204,208,207,0.2)] hover:shadow-[0_4px_25px_rgba(204,208,207,0.35)] transition-all disabled:opacity-50"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 size={18} className="animate-spin" />
                                        Setting up...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles size={18} />
                                        Launch Dashboard
                                    </>
                                )}
                            </motion.button>
                        )}
                    </div>
                </LiquidGlassCard>

                {/* Skip Link (hidden) */}
                <p className="text-theme-600 text-xs mt-6">
                    This information helps us optimize predictions specifically for your business.
                </p>
            </div>
        </div>
    );
}
