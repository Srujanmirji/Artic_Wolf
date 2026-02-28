import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const LANGUAGES = [
    { code: 'en', label: 'English' },
    { code: 'hi', label: 'हिंदी (Hindi)' },
    { code: 'kn', label: 'ಕನ್ನಡ (Kannada)' },
    { code: 'mr', label: 'मराठी (Marathi)' },
];

export function LanguageSwitcher() {
    const { i18n } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const activeLang = LANGUAGES.find((l) => l.code === i18n.language) || LANGUAGES[0];

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectLanguage = (code: string) => {
        i18n.changeLanguage(code);
        setIsOpen(false);
    };

    return (
        <div className="relative group shrink-0" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 bg-theme-800/60 border border-theme-700/50 rounded-full py-2 px-3 sm:px-4 cursor-pointer hover:bg-theme-800 hover:border-theme-500/50 transition-all shadow-inner focus:outline-none focus:ring-2 focus:ring-theme-500/50"
            >
                <Globe size={16} className={cn("transition-colors", isOpen ? "text-theme-100" : "text-theme-300")} />
                <span className="text-sm font-medium text-theme-100 hidden sm:block">
                    {activeLang.label.split(' ')[0]} {/* Abbreviate for mobile nav */}
                </span>
                <ChevronDown size={14} className={cn("text-theme-300 transition-transform duration-300", isOpen && "rotate-180")} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-full mt-2 w-48 bg-theme-800 rounded-2xl shadow-xl overflow-hidden py-2 z-[100] backdrop-blur-xl"
                    >
                        {LANGUAGES.map((lang) => (
                            <button
                                key={lang.code}
                                onClick={() => selectLanguage(lang.code)}
                                className={cn(
                                    "w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between",
                                    i18n.language === lang.code
                                        ? "bg-theme-500/20 text-theme-100 font-medium"
                                        : "text-theme-300 hover:bg-theme-700/50 hover:text-white"
                                )}
                            >
                                {lang.label}
                                {i18n.language === lang.code && <Check size={16} className="text-theme-300" />}
                            </button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
