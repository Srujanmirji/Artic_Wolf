import { Request, Response } from 'express';
import { computeNewsImpact } from '../services/newsImpactService';

export async function newsImpactHandler(req: Request, res: Response) {
    try {
        const { organization_id } = req.body;
        if (!organization_id) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const results = await computeNewsImpact(organization_id);
        res.json({ count: results.length, results });
    } catch (err: any) {
        console.error('News Impact Error:', err);
        res.status(500).json({ error: err.message });
    }
}
