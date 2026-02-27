/**
 * Offline Sync Manager
 * Intercepts POST/PUT requests using IndexedDB and replays them when `navigator.onLine` returns true.
 */
import { openDB, IDBPDatabase } from 'idb';

const DB_NAME = 'aagam-offline-sync';
const STORE_NAME = 'sync-queue';

export interface SyncRequest {
    id?: number;
    url: string;
    method: string;
    headers: Record<string, string>;
    body: any;
    timestamp: number;
}

class OfflineSyncManager {
    private dbPromise: Promise<IDBPDatabase | null>;

    constructor() {
        if (typeof window !== 'undefined') {
            this.dbPromise = openDB(DB_NAME, 1, {
                upgrade(db) {
                    if (!db.objectStoreNames.contains(STORE_NAME)) {
                        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
                    }
                },
            }).catch(err => {
                console.error('Failed to open IndexedDB for offline sync:', err);
                return null;
            });

            window.addEventListener('online', () => this.sync());
        } else {
            this.dbPromise = Promise.resolve(null);
        }
    }

    async enqueueRequest(url: string, method: string, headers: HeadersInit, body: any) {
        const db = await this.dbPromise;
        if (!db) return;

        const request: SyncRequest = {
            url,
            method,
            headers: headers as Record<string, string>,
            body,
            timestamp: Date.now()
        };

        await db.add(STORE_NAME, request);
        console.log(`[OfflineSync] Enqueued ${method} request to ${url}`);
    }

    async sync() {
        const db = await this.dbPromise;
        if (!db) return;

        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const requests = await store.getAll();

        if (requests.length === 0) return;

        console.log(`[OfflineSync] Replaying ${requests.length} queued requests...`);

        for (const req of requests) {
            try {
                await fetch(req.url, {
                    method: req.method,
                    headers: req.headers,
                    body: JSON.stringify(req.body)
                });
                console.log(`[OfflineSync] Successfully synced request ID ${req.id}`);
                // Delete from queue on success
                await db.delete(STORE_NAME, req.id!);
            } catch (err) {
                console.error(`[OfflineSync] Failed to sync request ID ${req.id}`, err);
                // Keep it in the queue to retry next time
            }
        }
    }
}

export const syncManager = new OfflineSyncManager();
