import React from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

const LANGUAGES = [
    { code: 'en', label: 'English' },
    { code: 'es', label: 'Español' },
    { code: 'fr', label: 'Français' },
    { code: 'hi', label: 'हिंदी (Hindi)' },
    { code: 'kn', label: 'ಕನ್ನಡ (Kannada)' },
    { code: 'mr', label: 'मराठी (Marathi)' },
];

export function LanguageSwitcher() {
    const { i18n } = useTranslation();

    return (
        <div className="relative group shrink-0">
            <div className="flex items-center gap-2 bg-theme-800/60 border border-theme-700/50 rounded-full py-2 px-3 sm:px-4 cursor-pointer hover:bg-theme-800 transition-all shadow-inner">
                <Globe size={16} className="text-theme-300" />
                <select
                    value={i18n.language || 'en'}
                    onChange={(e) => i18n.changeLanguage(e.target.value)}
                    className="bg-transparent text-sm text-theme-100 font-medium focus:outline-none cursor-pointer appearance-none pr-4"
                    style={{ WebkitAppearance: 'none', MozAppearance: 'none' }}
                >
                    {LANGUAGES.map((lang) => (
                        <option key={lang.code} value={lang.code} className="bg-theme-900 text-theme-100">
                            {lang.label}
                        </option>
                    ))}
                </select>
                {/* Custom arrow for the select */}
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-theme-300 opacity-70">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </div>
            </div>
        </div>
    );
}
