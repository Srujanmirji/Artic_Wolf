import { Request, Response } from 'express';
import { optimizeTransfers } from '../services/transferService';

export async function optimizeTransfersHandler(req: Request, res: Response) {
    try {
        const { organization_id } = req.body;
        if (!organization_id) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const results = await optimizeTransfers(organization_id);
        res.json({ count: results.length, results });
    } catch (err: any) {
        console.error('Transfer Optimization Error:', err);
        res.status(500).json({ error: err.message });
    }
}
