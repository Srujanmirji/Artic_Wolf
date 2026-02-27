import { Request, Response } from 'express';
import { analyzeLatestNewsSentiment } from '../services/sentimentService';

export async function analyzeSentimentHandler(req: Request, res: Response) {
    try {
        const { organization_id } = req.body;
        if (!organization_id) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const items = await analyzeLatestNewsSentiment(organization_id);
        res.json({ count: items.length, items });
    } catch (err: any) {
        console.error('Sentiment Error:', err);
        res.status(500).json({ error: err.message });
    }
}
