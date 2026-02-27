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
