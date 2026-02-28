"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { checkOnboardingStatus } from "@/lib/api";
import {
    LayoutDashboard,
    Package,
    TrendingUp,
    LogOut,
    Menu,
    Newspaper,
    X,
    Workflow,
    Activity,
    BrainCircuit,
    UserCircle,
    ShoppingBag,
    Settings,
    Search,
    Bell
} from "lucide-react";

import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import "@/i18n/config";
import { useAuthStore } from "@/store/useAuthStore";

const SIDEBAR_LINKS = [
    { name: "nav.dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "nav.inventory", href: "/dashboard/inventory", icon: Package },
    { name: "nav.orders", href: "/dashboard/orders", icon: ShoppingBag },
    { name: "nav.forecast", href: "/dashboard/forecast", icon: TrendingUp },
    { name: "nav.scenarios", href: "/dashboard/scenarios", icon: Workflow },
    { name: "nav.recommendations", href: "/dashboard/recommendations", icon: BrainCircuit },
    { name: "nav.intelligence", href: "/dashboard/intelligence", icon: Activity },
    { name: "nav.news", href: "/dashboard/news", icon: Newspaper },
    { name: "nav.settings", href: "/dashboard/settings", icon: Settings },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const { t, ready } = useTranslation();
    const userProfile = useAuthStore((state) => state.user);
    const [onboardingChecked, setOnboardingChecked] = useState(false);

    useEffect(() => {
        const hydrateUser = (session: any) => {
            // Don't overwrite if user is already logged in via Google OAuth
            const currentUser = useAuthStore.getState().user;
            if (currentUser?.authProvider === 'google') return;

            if (session?.user) {
                const meta = session.user.user_metadata;
                useAuthStore.getState().login({
                    id: session.user.id,
                    email: session.user.email,
                    name: `${meta?.first_name || ''} ${meta?.last_name || ''}`.trim() || meta?.full_name || meta?.name || 'User',
                    picture: meta?.avatar_url || meta?.picture,
                    authProvider: 'supabase'
                });
            } else {
                // Don't logout if user is authenticated via Google
                if (!currentUser?.authProvider) {
                    useAuthStore.getState().logout();
                }
            }
        };

        // Initial fetch
        supabase.auth.getSession().then(({ data: { session } }) => hydrateUser(session));

        // Subscribe to changes (e.g. from Settings updates or sign out)
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            hydrateUser(session);
        });

        // Listen for manual component-to-component overrides if session reload lags
        const handleProfileUpdated = () => {
            supabase.auth.getSession().then(({ data: { session } }) => hydrateUser(session));
        };
        window.addEventListener('profileUpdated', handleProfileUpdated);

        return () => {
            subscription.unsubscribe();
            window.removeEventListener('profileUpdated', handleProfileUpdated);
        };
    }, []);

    // Onboarding gate: Redirect users who haven't completed onboarding
    useEffect(() => {
        if (!userProfile?.id) return;

        // Check if user already has a saved orgId (they've onboarded)
        const cachedOrgId = localStorage.getItem('aagam_org_id');
        if (cachedOrgId) {
            setOnboardingChecked(true);
            return;
        }

        checkOnboardingStatus(userProfile.id)
            .then((res) => {
                if (!res.isOnboarded) {
                    router.replace('/onboarding');
                } else {
                    if (res.organization_id) {
                        localStorage.setItem('aagam_org_id', res.organization_id);
                    }
                    setOnboardingChecked(true);
                }
            })
            .catch((err) => {
                console.warn('Onboarding check failed, redirecting to onboarding:', err);
                router.replace('/onboarding');
            });
    }, [userProfile?.id, router]);

    // Show loading state while checking onboarding
    if (!onboardingChecked) {
        return (
            <div className="flex h-screen w-full bg-theme-900 items-center justify-center">
                <div className="flex flex-col items-center gap-4 animate-pulse">
                    <Image
                        src="/aagam-logo.png"
                        alt="Aagam AI"
                        width={160}
                        height={45}
                        className="opacity-50 w-auto h-8"
                    />
                    <p className="text-theme-500 text-sm font-medium">Loading workspace...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen w-full bg-theme-900 text-theme-100 font-sans p-2 sm:p-4 lg:p-6 overflow-hidden">
            {/* Main App Wrapper matching the image rounded frame */}
            <div className="flex-1 flex flex-col rounded-[2.5rem] shadow-[0_20px_60px_rgba(0,0,0,0.8)] border border-theme-500/30 relative overflow-hidden bg-gradient-to-br from-theme-900/90 via-theme-700/40 to-theme-900/90">

                {/* Ambient glow effects behind everything */}
                <div className="absolute top-[-10%] left-[-10%] w-[50rem] h-[50rem] bg-gradient-to-br from-theme-500/20 to-theme-300/10 rounded-full blur-[120px] pointer-events-none" />
                <div className="absolute bottom-[-10%] right-[-5%] w-[40rem] h-[40rem] bg-gradient-to-tl from-theme-300/20 to-theme-100/5 rounded-full blur-[150px] pointer-events-none" />
                <div className="absolute top-[40%] left-[30%] w-[30rem] h-[30rem] bg-theme-500/10 rounded-full blur-[100px] pointer-events-none" />

                {/* Top Navbar Area */}
                <header className="flex items-center justify-between px-8 py-6 relative z-50 shrink-0">
                    <div className="flex items-center gap-12">
                        {/* Logo */}
                        <div className="flex items-center gap-3 shrink-0">
                            <Image
                                src="/aagam-logo.png"
                                alt="Aagam AI"
                                width={160}
                                height={45}
                                className="drop-shadow-[0_4px_10px_rgba(0,0,0,0.5)] object-contain w-auto h-8 lg:h-10"
                                priority
                            />
                        </div>

                        {/* Search Pill */}
                        <div className="relative group hidden md:block shrink-0">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-theme-300" size={18} />
                            <input
                                type="text"
                                placeholder="Search payment"
                                className="bg-theme-800/60 border border-theme-700/50 rounded-full py-2.5 pl-12 pr-6 text-sm text-theme-100 placeholder:text-theme-500 focus:outline-none focus:ring-1 focus:ring-theme-500/50 w-64 hover:bg-theme-800 transition-all focus:w-80 shadow-inner"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <LanguageSwitcher />
                        <span className="text-theme-300 font-medium hidden sm:block">
                            {t('greeting', { name: userProfile?.name?.split(' ')[0] || 'User' })}
                        </span>
                        <div className="relative cursor-pointer hover:ring-2 hover:ring-theme-500/50 rounded-full transition-all">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-theme-300 to-theme-500 border-2 border-theme-800 flex items-center justify-center text-sm font-bold text-theme-900 overflow-hidden">
                                {userProfile?.picture ? (
                                    <Image src={userProfile.picture} alt="Profile" width={40} height={40} className="w-full h-full object-cover" />
                                ) : (
                                    userProfile?.name ? userProfile.name.charAt(0).toUpperCase() : "U"
                                )}
                            </div>
                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-theme-500 border-2 border-theme-900 rounded-full" />
                        </div>
                    </div>
                </header>

                <div className="flex flex-1 overflow-hidden px-4 lg:px-8 pb-4 lg:pb-8 relative z-10 gap-6 lg:gap-8">
                    {/* Floating Sidebar Pill */}
                    <aside className="w-[4.5rem] bg-theme-800/40 backdrop-blur-xl border border-theme-700/40 rounded-[2.5rem] flex flex-col items-center py-6 shadow-[0_8px_32px_rgba(0,0,0,0.3)] shrink-0 h-fit my-auto">
                        <nav className="flex flex-col gap-4">
                            {SIDEBAR_LINKS.map((link) => {
                                const isActive = pathname === link.href;
                                return (
                                    <Link
                                        key={link.href}
                                        href={link.href}
                                        className={cn(
                                            "relative flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300 group",
                                            isActive
                                                ? "bg-theme-100 text-theme-900 shadow-[0_0_15px_rgba(204,208,207,0.3)]"
                                                : "text-theme-300 hover:bg-theme-700/50 hover:text-white"
                                        )}
                                        title={ready ? t(link.name) : link.name}
                                    >
                                        <link.icon size={22} className={cn("transition-transform group-hover:scale-110")} strokeWidth={isActive ? 2.5 : 2} />
                                    </Link>
                                )
                            })}
                        </nav>

                        <div className="mt-auto pt-8">
                            <button
                                onClick={async () => {
                                    useAuthStore.getState().logout();
                                    localStorage.removeItem('aagam_org_id');
                                    await supabase.auth.signOut();
                                    window.location.href = '/';
                                }}
                                className="flex items-center justify-center w-12 h-12 rounded-full text-theme-500 hover:bg-theme-700/30 hover:text-rose-400 transition-colors"
                            >
                                <LogOut size={22} />
                            </button>
                        </div>
                    </aside>

                    {/* Content Frame */}
                    <main className="flex-1 flex flex-col overflow-y-auto overflow-x-hidden no-scrollbar rounded-3xl pb-20">
                        {children}
                    </main>
                </div>
            </div>
        </div>
    );
}
