const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'frontend', 'src', 'i18n', 'config.ts');
let content = fs.readFileSync(filePath, 'utf8');

const additions = {
    en: {
        logoutWord: '"logout": "Sign Out"',
        commonAdd: '"logout": "Sign Out",\n                "view_all": "View All >",\n                "no_org_id": "Set NEXT_PUBLIC_ORG_ID to load live data."',
        dashboardAdd: `            "dashboard": {
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
            }`
    },
    es: {
        logoutWord: '"logout": "Cerrar sesión"',
        commonAdd: '"logout": "Cerrar sesión",\n                "view_all": "Ver Todo >",\n                "no_org_id": "Configurar NEXT_PUBLIC_ORG_ID para cargar datos."',
        dashboardAdd: `            "dashboard": {
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
            }`
    },
    fr: {
        logoutWord: '"logout": "Déconnexion"',
        commonAdd: '"logout": "Déconnexion",\n                "view_all": "Voir Tout >",\n                "no_org_id": "Définir NEXT_PUBLIC_ORG_ID pour charger les données."',
        dashboardAdd: `            "dashboard": {
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
            }`
    },
    hi: {
        logoutWord: '"logout": "साइन आउट करें"',
        commonAdd: '"logout": "साइन आउट करें",\n                "view_all": "सभी देखें >",\n                "no_org_id": "लाइव डेटा लोड करने के लिए NEXT_PUBLIC_ORG_ID सेट करें।"',
        dashboardAdd: `            "dashboard": {
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
            }`
    },
    kn: {
        logoutWord: '"logout": "ಸೈನ್ ಔಟ್ ಮಾಡಿ"',
        commonAdd: '"logout": "ಸೈನ್ ಔಟ್ ಮಾಡಿ",\n                "view_all": "ಎಲ್ಲವನ್ನೂ ವೀಕ್ಷಿಸಿ >",\n                "no_org_id": "ಲೈವ್ ಡೇಟಾ ಲೋಡ್ ಮಾಡಲು NEXT_PUBLIC_ORG_ID ಹೊಂದಿಸಿ."',
        dashboardAdd: `            "dashboard": {
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
            }`
    },
    mr: {
        logoutWord: '"logout": "साइन आउट करा"',
        commonAdd: '"logout": "साइन आउट करा",\n                "view_all": "सर्व पहा >",\n                "no_org_id": "थेट डेटा लोड करण्यासाठी NEXT_PUBLIC_ORG_ID सेट करा."',
        dashboardAdd: `            "dashboard": {
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
            }`
    }
};

for (const lang in additions) {
    const { logoutWord, commonAdd, dashboardAdd } = additions[lang];
    // We expect the original file to have:
    // "logout": "something"
    // }
    // We'll replace it.

    content = content.replace(logoutWord + '\\n            }', commonAdd + '\\n            },\\n' + dashboardAdd);
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('i18n patched successfully');
