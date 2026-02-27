import { idb } from '../utils/idb';

const API = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api';

export async function syncPending() {
    const ops = await idb.getAll('pending_changes');
    if (!ops || ops.length === 0) return;

    // Basic chunking implementation by splitting array
    const chunk = (arr: any[], size: number) =>
        Array.from({ length: Math.ceil(arr.length / size) }, (v, i) =>
            arr.slice(i * size, i * size + size)
        );

    const batches = chunk(ops, 10);

    for (const batch of batches) {
        try {
            // Assuming a single organization for demo
            const organization_id = "demo-org-uuid"; // Get from auth in real app

            const res = await fetch(`${API}/sync`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ organization_id, operations: batch })
            });

            if (res.ok) {
                const { results } = await res.json();
                for (const result of results) {
                    if (result.status === 'ok') {
                        await idb.delete('pending_changes', result.op_id);
                    } else {
                        console.error('Operation failed on server:', result);
                        // handle conflict or retry logic here
                    }
                }
            }
        } catch (err) {
            console.error('Network error during sync', err);
            // will retry next time online
        }
    }
}
