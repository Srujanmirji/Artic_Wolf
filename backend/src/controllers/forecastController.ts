import { Request, Response } from 'express';
import { runForecast, runForecastForOrganization } from '../services/forecastService';

function parseNumber(value: unknown): number | undefined {
    if (typeof value === 'number' && !Number.isNaN(value)) return value;
    if (typeof value === 'string') {
        const parsed = Number(value);
        return Number.isNaN(parsed) ? undefined : parsed;
    }
    return undefined;
}

export async function runForecastHandler(req: Request, res: Response) {
    try {
        const { organization_id, product_id, warehouse_id, method } = req.body;
        const period_days = parseNumber(req.body?.period_days);
        const alpha = parseNumber(req.body?.alpha);
        const service_level = parseNumber(req.body?.service_level);
        const lead_time_days = parseNumber(req.body?.lead_time_days);

        if (!organization_id || !product_id || !warehouse_id || !period_days) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const result = await runForecast({
            organization_id,
            product_id,
            warehouse_id,
            period_days,
            method,
            alpha,
            service_level,
            lead_time_days
        });

        res.json(result);
    } catch (err: any) {
        console.error('Forecast Error:', err);
        res.status(500).json({ error: err.message });
    }
}

export async function runForecastAllHandler(req: Request, res: Response) {
    try {
        const { organization_id, method } = req.body;
        const period_days = parseNumber(req.body?.period_days);
        const alpha = parseNumber(req.body?.alpha);
        const service_level = parseNumber(req.body?.service_level);
        const lead_time_days = parseNumber(req.body?.lead_time_days);

        if (!organization_id || !period_days) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const results = await runForecastForOrganization(organization_id, period_days, {
            method,
            alpha,
            service_level,
            lead_time_days
        });

        res.json({ count: results.length, results });
    } catch (err: any) {
        console.error('Forecast Bulk Error:', err);
        res.status(500).json({ error: err.message });
    }
}
