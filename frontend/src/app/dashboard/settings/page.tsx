"use client";

import React, { useState, useEffect } from "react";
import { User, Bell, Shield, Key, Database, Globe } from "lucide-react";
import { supabase } from "@/lib/supabase";
import Image from "next/image";
import { useTranslation } from "react-i18next";

export default function SettingsPage() {
    const { t } = useTranslation();
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [picture, setPicture] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState("");
    useEffect(() => {
        const loadProfile = async () => {
            const { data: { session } } = await supabase.auth.getSession();

            if (session?.user) {
                setEmail(session.user.email || "");
                const meta = session.user.user_metadata;

                // Name mapping handling between native Google OAuth defaults and our manual edits
                setFirstName(meta?.first_name || meta?.given_name || meta?.full_name?.split(' ')[0] || meta?.name?.split(' ')[0] || "");
                setLastName(meta?.last_name || meta?.family_name || meta?.full_name?.split(' ').slice(1).join(' ') || meta?.name?.split(' ').slice(1).join(' ') || "");
                setPicture(meta?.avatar_url || meta?.picture || "");
            }
        };

        loadProfile();
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setSaveMessage("");

        try {
            // Update Supabase auth db
            const { error } = await supabase.auth.updateUser({
                data: {
                    first_name: firstName,
                    last_name: lastName,
                }
            });

            if (error) throw error;

            // Notify header to refetch session locally across app
            window.dispatchEvent(new Event('profileUpdated'));
            setSaveMessage("Profile updated successfully!");

            // Clear message after 3 seconds
            setTimeout(() => setSaveMessage(""), 3000);
        } catch (error: any) {
            console.error("Error saving profile:", error);
            setSaveMessage(error.message || "Failed to save profile.");
        } finally {
            setIsSaving(false);
        }
    };
    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-500">
            <div>
                <h2 className="text-2xl font-bold text-white">{t("settings.title", "Settings")}</h2>
                <p className="text-theme-300 mt-1">{t("settings.description", "Manage your account settings and preferences.")}</p>
            </div>

            <div className="flex flex-col md:flex-row gap-8">
                {/* Settings Navigation */}
                <div className="w-full md:w-64 shrink-0">
                    <nav className="space-y-1">
                        <a href="#" className="flex items-center gap-3 px-3 py-2.5 bg-theme-500/20 text-white rounded-lg border border-theme-500/30 text-sm font-medium">
                            <User size={18} /> Profile
                        </a>
                        <a href="#" className="flex items-center gap-3 px-3 py-2.5 text-theme-300 hover:bg-theme-700/40 hover:text-theme-100 rounded-lg transition-colors text-sm font-medium">
                            <Bell size={18} /> Notifications
                        </a>
                        <a href="#" className="flex items-center gap-3 px-3 py-2.5 text-theme-300 hover:bg-theme-700/40 hover:text-theme-100 rounded-lg transition-colors text-sm font-medium">
                            <Shield size={18} /> Security
                        </a>
                        <a href="#" className="flex items-center gap-3 px-3 py-2.5 text-theme-300 hover:bg-theme-700/40 hover:text-theme-100 rounded-lg transition-colors text-sm font-medium">
                            <Key size={18} /> API Keys
                        </a>
                        <a href="#" className="flex items-center gap-3 px-3 py-2.5 text-theme-300 hover:bg-theme-700/40 hover:text-theme-100 rounded-lg transition-colors text-sm font-medium">
                            <Database size={18} /> Integrations
                        </a>
                    </nav>
                </div>

                {/* Settings Form Content */}
                <div className="flex-1 bg-theme-800/40 backdrop-blur-sm border border-theme-500/20 rounded-xl p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-white mb-6 border-b border-theme-500/20 pb-4">{t("settings.personal_info", "Personal Information")}</h3>

                    <form className="space-y-6" onSubmit={handleSave}>
                        {saveMessage && (
                            <div className={`p-3 rounded-lg text-sm ${saveMessage.includes('success') ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                                {saveMessage}
                            </div>
                        )}

                        <div className="flex items-center gap-6">
                            <div className="h-20 w-20 rounded-full bg-gradient-to-br from-theme-300 to-theme-500 border-2 border-theme-100/20 flex items-center justify-center text-2xl font-bold text-theme-900 shadow-xl overflow-hidden shrink-0">
                                {picture ? (
                                    <Image src={picture} alt="Avatar" width={80} height={80} className="w-full h-full object-cover" />
                                ) : (
                                    firstName ? firstName.charAt(0).toUpperCase() : "U"
                                )}
                            </div>
                            <div>
                                <button type="button" className="px-4 py-2 bg-theme-900/50 text-theme-100 text-sm font-medium rounded-lg border border-theme-500/30 hover:bg-theme-700/50 transition-colors">
                                    Change Avatar
                                </button>
                                <p className="text-xs text-theme-500 mt-2">JPG, GIF or PNG. Max size of 800K</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-theme-300">{t("settings.first_name", "First Name")}</label>
                                <input
                                    type="text"
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                    className="w-full bg-theme-900/50 border border-theme-500/30 rounded-lg py-2 px-3 text-sm text-theme-100 focus:outline-none focus:ring-1 focus:ring-theme-300 focus:border-theme-300 transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-theme-300">{t("settings.last_name", "Last Name")}</label>
                                <input
                                    type="text"
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                    className="w-full bg-theme-900/50 border border-theme-500/30 rounded-lg py-2 px-3 text-sm text-theme-100 focus:outline-none focus:ring-1 focus:ring-theme-300 focus:border-theme-300 transition-all"
                                />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <label className="text-sm font-medium text-theme-300">{t("settings.email_readonly", "Email Address (Read Only)")}</label>
                                <input
                                    type="email"
                                    value={email}
                                    disabled
                                    className="w-full bg-theme-900/30 border border-theme-500/20 rounded-lg py-2 px-3 text-sm text-theme-500 cursor-not-allowed"
                                />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <label className="text-sm font-medium text-theme-300">{t("settings.role", "Role")}</label>
                                <input type="text" disabled defaultValue={t("settings.role_value", "Admin / Supply Chain Manager")} className="w-full bg-theme-900/30 border border-theme-500/20 rounded-lg py-2 px-3 text-sm text-theme-500 cursor-not-allowed" />
                            </div>
                        </div>

                        <div className="pt-4 border-t border-theme-500/20 flex justify-end gap-3">
                            <button type="button" className="px-4 py-2 text-theme-300 text-sm font-medium hover:text-white transition-colors">
                                {t("common.cancel", "Cancel")}
                            </button>
                            <button type="submit" disabled={isSaving} className="px-5 py-2 bg-theme-300 text-theme-900 text-sm font-bold rounded-lg shadow-[0_0_15px_rgba(155,168,171,0.2)] hover:bg-theme-100 transition-all disabled:opacity-50 flex items-center gap-2">
                                {isSaving ? (
                                    <>
                                        <svg className="animate-spin h-4 w-4 text-theme-900" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        {t("common.saving", "Saving...")}
                                    </>
                                ) : (
                                    t("common.save_changes", "Save Changes")
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
