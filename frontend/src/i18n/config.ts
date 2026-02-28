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
                "logout": "Sign Out",
                "view_all": "View All >",
                "no_org_id": "Set NEXT_PUBLIC_ORG_ID to load live data."
            },
            "dashboard": {
                "my_dashboard": "My Dashboard",
                "demand_flow": "Demand Flow",
                "available_by_category": "Available By Category",
                "total_value": "Total Value",
                "holding_cost": "Holding Cost",
                "this_months_cost": "This month's cost",
                "cost_savings": "Cost Savings",
                "this_months_saving": "This month's saving",
                "my_inventory": "My Inventory",
                "recent_orders": "Recent Orders",
                "team_access": "Team Access",
                "manage_permissions": "Manage permissions & invite members",
                "efficiency": "Efficiency"
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
                "logout": "Cerrar sesión",
                "view_all": "Ver Todo >",
                "no_org_id": "Configurar NEXT_PUBLIC_ORG_ID para cargar datos."
            },
            "dashboard": {
                "my_dashboard": "Mi Panel",
                "demand_flow": "Flujo de Demanda",
                "available_by_category": "Disponible por Categoría",
                "total_value": "Valor Total",
                "holding_cost": "Costo de Mantenimiento",
                "this_months_cost": "Costo de este mes",
                "cost_savings": "Ahorro de Costos",
                "this_months_saving": "Ahorro de este mes",
                "my_inventory": "Mi Inventario",
                "recent_orders": "Pedidos Recientes",
                "team_access": "Acceso del Equipo",
                "manage_permissions": "Gestionar permisos e invitar miembros",
                "efficiency": "Eficiencia"
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
                "logout": "Déconnexion",
                "view_all": "Voir Tout >",
                "no_org_id": "Définir NEXT_PUBLIC_ORG_ID pour charger les données."
            },
            "dashboard": {
                "my_dashboard": "Mon Tableau de Bord",
                "demand_flow": "Flux de Demande",
                "available_by_category": "Disponible par Catégorie",
                "total_value": "Valeur Totale",
                "holding_cost": "Coût de Détention",
                "this_months_cost": "Coût de ce mois",
                "cost_savings": "Économies de Coûts",
                "this_months_saving": "Économie de ce mois",
                "my_inventory": "Mon Inventaire",
                "recent_orders": "Commandes Récentes",
                "team_access": "Accès Équipe",
                "manage_permissions": "Gérer les permissions et inviter des membres",
                "efficiency": "Efficacité"
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
                "logout": "साइन आउट करें",
                "view_all": "सभी देखें >",
                "no_org_id": "लाइव डेटा लोड करने के लिए NEXT_PUBLIC_ORG_ID सेट करें।"
            },
            "dashboard": {
                "my_dashboard": "मेरा डैशबोर्ड",
                "demand_flow": "मांग प्रवाह",
                "available_by_category": "श्रेणी के अनुसार उपलब्ध",
                "total_value": "कुल मूल्य",
                "holding_cost": "होल्डिंग लागत",
                "this_months_cost": "इस महीने की लागत",
                "cost_savings": "लागत बचत",
                "this_months_saving": "इस महीने की बचत",
                "my_inventory": "मेरी इन्वेंटरी",
                "recent_orders": "हाल के आदेश",
                "team_access": "टीम एक्सेस",
                "manage_permissions": "अनुमतियां प्रबंधित करें और आमंत्रित करें",
                "efficiency": "दक्षता"
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
                "logout": "ಸೈನ್ ಔಟ್ ಮಾಡಿ",
                "view_all": "ಎಲ್ಲವನ್ನೂ ವೀಕ್ಷಿಸಿ >",
                "no_org_id": "ಲೈವ್ ಡೇಟಾ ಲೋಡ್ ಮಾಡಲು NEXT_PUBLIC_ORG_ID ಹೊಂದಿಸಿ."
            },
            "dashboard": {
                "my_dashboard": "ನನ್ನ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್",
                "demand_flow": "ಬೇಡಿಕೆ ಹರಿವು",
                "available_by_category": "ವರ್ಗದ ಪ್ರಕಾರ ಲಭ್ಯವಿದೆ",
                "total_value": "ಒಟ್ಟು ಮೌಲ್ಯ",
                "holding_cost": "ಹಿಡುವಳಿ ವೆಚ್ಚ",
                "this_months_cost": "ಈ ತಿಂಗಳ ವೆಚ್ಚ",
                "cost_savings": "ವೆಚ್ಚ ಉಳಿತಾಯ",
                "this_months_saving": "ಈ ತಿಂಗಳ ಉಳಿತಾಯ",
                "my_inventory": "ನನ್ನ ದಾಸ್ತಾನು",
                "recent_orders": "ಇತ್ತೀಚಿನ ಆದೇಶಗಳು",
                "team_access": "ತಂಡದ ಪ್ರವೇಶ",
                "manage_permissions": "ಅನುಮತಿಗಳನ್ನು ನಿರ್ವಹಿಸಿ & ಆಹ್ವಾನಿಸಿ",
                "efficiency": "ದಕ್ಷತೆ"
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
                "logout": "साइन आउट करा",
                "view_all": "सर्व पहा >",
                "no_org_id": "थेट डेटा लोड करण्यासाठी NEXT_PUBLIC_ORG_ID सेट करा."
            },
            "dashboard": {
                "my_dashboard": "माझे डॅशबोर्ड",
                "demand_flow": "मागणी प्रवाह",
                "available_by_category": "श्रेणीनुसार उपलब्ध",
                "total_value": "एकूण मूल्य",
                "holding_cost": "होल्डिंग खर्च",
                "this_months_cost": "या महिन्याचा खर्च",
                "cost_savings": "खर्च बचत",
                "this_months_saving": "या महिन्याची बचत",
                "my_inventory": "माझी इन्व्हेंटरी",
                "recent_orders": "अलीकडील ऑर्डर्स",
                "team_access": "टीम अ‍ॅक्सेस",
                "manage_permissions": "परवानग्या व्यवस्थापित करा आणि आमंत्रित करा",
                "efficiency": "कार्यक्षमता"
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
