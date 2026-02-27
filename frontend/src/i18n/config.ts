import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Translation dictionaries
const resources = {
    en: {
        translation: {
            "greeting": "Hi {{name}}!",
            "dashboard_title": "Aagam AI Insights",
            "nav": {
                "overview": "Overview",
                "inventory": "Inventory",
                "forecast": "Forecast",
                "recommendations": "Recommendations",
                "scenarios": "Scenarios",
                "news": "Market Intelligence",
                "settings": "Settings"
            },
            "common": {
                "search_placeholder": "Search...",
                "auto_apply": "Auto-Apply All",
                "generate_insights": "Generate Insights",
                "analyzing": "Analyzing...",
                "latest": "Latest",
                "saved": "Saved",
                "logout": "Sign Out"
            }
        }
    },
    es: {
        translation: {
            "greeting": "¡Hola {{name}}!",
            "dashboard_title": "Perspectivas de Aagam AI",
            "nav": {
                "overview": "Resumen",
                "inventory": "Inventario",
                "forecast": "Pronóstico",
                "recommendations": "Recomendaciones",
                "scenarios": "Escenarios",
                "news": "Inteligencia de Mercado",
                "settings": "Configuración"
            },
            "common": {
                "search_placeholder": "Buscar...",
                "auto_apply": "Aplicar Todo",
                "generate_insights": "Generar Ideas",
                "analyzing": "Analizando...",
                "latest": "Último",
                "saved": "Guardado",
                "logout": "Cerrar sesión"
            }
        }
    },
    fr: {
        translation: {
            "greeting": "Salut {{name}}!",
            "dashboard_title": "Aperçus Aagam AI",
            "nav": {
                "overview": "Aperçu",
                "inventory": "Inventaire",
                "forecast": "Prévision",
                "recommendations": "Recommandations",
                "scenarios": "Scénarios",
                "news": "Intelligence du Marché",
                "settings": "Paramètres"
            },
            "common": {
                "search_placeholder": "Rechercher...",
                "auto_apply": "Tout Appliquer",
                "generate_insights": "Générer des Idées",
                "analyzing": "Analyse en cours...",
                "latest": "Dernier",
                "saved": "Enregistré",
                "logout": "Déconnexion"
            }
        }
    },
    hi: {
        translation: {
            "greeting": "नमस्ते {{name}}!",
            "dashboard_title": "Agam AI इनसाइट्स",
            "nav": {
                "overview": "अवलोकन",
                "inventory": "इन्वेंट्री",
                "forecast": "पूर्वानुमान",
                "recommendations": "सिफारिशें",
                "scenarios": "परिदृश्य",
                "news": "बाज़ार बुद्धिमत्ता",
                "settings": "सेटिंग्स"
            },
            "common": {
                "search_placeholder": "खोजें...",
                "auto_apply": "सभी स्वतः लागू करें",
                "generate_insights": "इनसाइट्स उत्पन्न करें",
                "analyzing": "विश्लेषण हो रहा है...",
                "latest": "नवीनतम",
                "saved": "सहेजा गया",
                "logout": "साइन आउट करें"
            }
        }
    },
    kn: {
        translation: {
            "greeting": "ನಮಸ್ಕಾರ {{name}}!",
            "dashboard_title": "ಆಗಮ್ ಎಐ ಒಳನೋಟಗಳು",
            "nav": {
                "overview": "ಅವಲೋಕನ",
                "inventory": "ದಾಸ್ತಾನು",
                "forecast": "ಮುನ್ಸೂಚನೆ",
                "recommendations": "ಶಿಫಾರಸುಗಳು",
                "scenarios": "ಸನ್ನಿವೇಶಗಳು",
                "news": "ಮಾರುಕಟ್ಟೆ ಬುದ್ಧಿಮತ್ತೆ",
                "settings": "ಸೆಟ್ಟಿಂಗ್‌ಗಳು"
            },
            "common": {
                "search_placeholder": "ಹುಡುಕಿ...",
                "auto_apply": "ಎಲ್ಲವನ್ನೂ ಸ್ವಯಂ ಅನ್ವಯಿಸಿ",
                "generate_insights": "ಒಳನೋಟಗಳನ್ನು ರಚಿಸಿ",
                "analyzing": "ವಿಶ್ಲೇಷಿಸಲಾಗುತ್ತಿದೆ...",
                "latest": "ಇತ್ತೀಚಿನ",
                "saved": "ಉಳಿಸಲಾಗಿದೆ",
                "logout": "ಸೈನ್ ಔಟ್ ಮಾಡಿ"
            }
        }
    },
    mr: {
        translation: {
            "greeting": "नमस्कार {{name}}!",
            "dashboard_title": "आगम एआय इनसाइट्स",
            "nav": {
                "overview": "आढावा",
                "inventory": "इन्व्हेंटरी",
                "forecast": "अंदाज",
                "recommendations": "शिफारसी",
                "scenarios": "परिस्थिती",
                "news": "मार्केट इंटेलिजेंस",
                "settings": "सेटिंग्ज"
            },
            "common": {
                "search_placeholder": "शोधा...",
                "auto_apply": "सर्व स्वयं लागू करा",
                "generate_insights": "इनसाइट्स व्युत्पन्न करा",
                "analyzing": "विश्लेषण करत आहे...",
                "latest": "नवीनतम",
                "saved": "जतन केले",
                "logout": "साइन आउट करा"
            }
        }
    }
};

i18n
    // detect user language
    // learn more: https://github.com/i18next/i18next-browser-languageDetector
    .use(LanguageDetector)
    // pass the i18n instance to react-i18next.
    .use(initReactI18next)
    // init i18next
    // for all options read: https://www.i18next.com/overview/configuration-options
    .init({
        resources,
        fallbackLng: 'en',
        debug: process.env.NODE_ENV === 'development',

        interpolation: {
            escapeValue: false, // not needed for react as it escapes by default
        }
    });

export default i18n;
