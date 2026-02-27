import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'Aagam AI',
        short_name: 'Aagam AI',
        description: 'Intelligent Inventory Forecasting and Optimization',
        start_url: '/',
        display: 'standalone',
        background_color: '#0f172a', /* slate-900 equivalent */
        theme_color: '#1e293b', /* slate-800 equivalent */
        icons: [
            {
                src: '/aagam-logo.png',
                sizes: '192x192',
                type: 'image/png',
            },
            {
                src: '/aagam-logo.png',
                sizes: '512x512',
                type: 'image/png',
            },
        ],
    };
}
