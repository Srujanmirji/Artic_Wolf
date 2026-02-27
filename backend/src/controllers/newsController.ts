import { Request, Response } from 'express';
import { fetchAndStoreNews, getLatestNews } from '../services/newsService';

export async function fetchNewsHandler(req: Request, res: Response) {
    try {
        const { organization_id, region, industry } = req.body;
        if (!organization_id) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const items = await fetchAndStoreNews({
            organization_id,
            region,
            industry
        });

        res.json({ count: items.length, items });
    } catch (err: any) {
        console.error('News Fetch Error:', err);
        res.status(500).json({ error: err.message });
    }
}

export async function getLatestNewsHandler(req: Request, res: Response) {
    try {
        const { org, region, industry } = req.query;
        if (!org) return res.status(400).json({ error: 'Organization ID is required' });

        const items = await getLatestNews(String(org), region ? String(region) : undefined, industry ? String(industry) : undefined);
        res.json(items);
    } catch (err: any) {
        console.error('News Error:', err);
        res.status(500).json({ error: err.message });
    }
}
