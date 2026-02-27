import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface AagamDB extends DBSchema {
    cached_data: {
        key: string;
        value: any;
    };
    pending_changes: {
        key: string;
        value: {
            op_id: string;
            type: 'sales_upload' | 'manual_adjust' | 'scenario_apply';
            payload: any;
            created_at: string;
            retry_count: number;
        };
    };
    news_cache: {
        key: string;
        value: {
            last_fetch: number;
            articles: any[];
        };
    };
}

let dbPromise: Promise<IDBPDatabase<AagamDB>> | null = null;

if (typeof window !== 'undefined') {
    dbPromise = openDB<AagamDB>('aagam-ai-db', 1, {
        upgrade(db) {
            if (!db.objectStoreNames.contains('cached_data')) {
                db.createObjectStore('cached_data');
            }
            if (!db.objectStoreNames.contains('pending_changes')) {
                db.createObjectStore('pending_changes', { keyPath: 'op_id' });
            }
            if (!db.objectStoreNames.contains('news_cache')) {
                db.createObjectStore('news_cache');
            }
        },
    });
}

export const idb = {
    async get(storeName: keyof AagamDB, key: string) {
        if (!dbPromise) return null;
        return (await dbPromise).get(storeName, key);
    },
    async set(storeName: keyof AagamDB, key: string, val: any) {
        if (!dbPromise) return;
        return (await dbPromise).put(storeName, val, key);
    },
    async put(storeName: keyof AagamDB, val: any) {
        if (!dbPromise) return;
        // For object stores with keyPaths
        return (await dbPromise).put(storeName as any, val);
    },
    async getAll(storeName: keyof AagamDB) {
        if (!dbPromise) return [];
        return (await dbPromise).getAll(storeName);
    },
    async delete(storeName: keyof AagamDB, key: string) {
        if (!dbPromise) return;
        return (await dbPromise).delete(storeName, key);
    }
};
