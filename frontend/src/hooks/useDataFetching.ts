import { useState, useEffect } from 'react';
import { useInventoryStore } from '../store/inventoryStore';
import { idb } from '../utils/idb';
import { useOnlineStatus } from './useOnlineStatus';

const API = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api';
// Demo default
const ORG_ID = 'demo-org-uuid';

export function useInventory() {
    const { metrics, setMetrics } = useInventoryStore();
    const [loading, setLoading] = useState(true);
    const isOnline = useOnlineStatus();

    useEffect(() => {
        async function loadData() {
            // Trying to fetch from cache first
            const cached = await idb.get('cached_data', 'inventory_metrics');
            if (cached) setMetrics(cached);

            if (isOnline) {
                try {
                    const res = await fetch(`${API}/inventory/metrics?org=${ORG_ID}`);
                    if (res.ok) {
                        const data = await res.json();
                        setMetrics(data);
                        await idb.set('cached_data', 'inventory_metrics', data);
                    }
                } catch (err) {
                    console.error("Failed fetching live metrics");
                }
            }
            setLoading(false);
        }
        loadData();
    }, [isOnline, setMetrics]);

    return { metrics, loading };
}

export function useNews() {
    const [news, setNews] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const isOnline = useOnlineStatus();

    useEffect(() => {
        async function loadNews() {
            const cached = await idb.get('news_cache', 'latest');
            if (cached) setNews(cached.articles);

            if (isOnline) {
                try {
                    const res = await fetch(`${API}/news/latest?org=${ORG_ID}`);
                    if (res.ok) {
                        const data = await res.json();
                        setNews(data);
                        await idb.set('news_cache', 'latest', { last_fetch: Date.now(), articles: data });
                    }
                } catch (err) {
                    console.error("Failed fetching live news");
                }
            }
            setLoading(false);
        }
        loadNews();
    }, [isOnline]);

    return { news, loading };
}
