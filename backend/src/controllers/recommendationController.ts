import { Request, Response } from 'express';
import { runRecommendation, runRecommendationsForOrganization } from '../services/recommendationService';

export async function runRecommendationHandler(req: Request, res: Response) {
    try {
        const { organization_id, product_id, warehouse_id } = req.body;
        if (!organization_id || !product_id || !warehouse_id) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const result = await runRecommendation({
            organization_id,
            product_id,
            warehouse_id
        });

        res.json(result);
    } catch (err: any) {
        console.error('Recommendation Error:', err);
        res.status(500).json({ error: err.message });
    }
}

export async function runRecommendationsBulkHandler(req: Request, res: Response) {
    try {
        const { organization_id } = req.body;
        if (!organization_id) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const results = await runRecommendationsForOrganization(organization_id);
        res.json({ count: results.length, results });
    } catch (err: any) {
        console.error('Recommendations Bulk Error:', err);
        res.status(500).json({ error: err.message });
    }
}
