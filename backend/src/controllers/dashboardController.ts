import { Request, Response } from 'express';
import { getDashboardKpis } from '../services/dashboardService';

export async function dashboardKpisHandler(req: Request, res: Response) {
    try {
        const { org } = req.query;
        if (!org) return res.status(400).json({ error: 'Organization ID is required' });

        const kpis = await getDashboardKpis(String(org));
        res.json(kpis);
    } catch (err: any) {
        console.error('Dashboard KPI Error:', err);
        res.status(500).json({ error: err.message });
    }
}
