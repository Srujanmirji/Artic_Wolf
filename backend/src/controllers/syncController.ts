import { Request, Response } from 'express';
import { processSyncOperations } from '../services/syncService';

export async function syncHandler(req: Request, res: Response) {
    try {
        const { organization_id, operations } = req.body;
        if (!organization_id || !Array.isArray(operations)) {
            return res.status(400).json({ error: 'Invalid payload' });
        }

        const result = await processSyncOperations(organization_id, operations);
        res.json(result);
    } catch (err: any) {
        console.error('Sync Error:', err);
        res.status(500).json({ error: err.message });
    }
}
