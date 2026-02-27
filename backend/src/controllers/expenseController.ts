import { Request, Response } from 'express';
import { runExpense, runExpenseForOrganization } from '../services/expenseService';

function parseNumber(value: unknown): number | undefined {
    if (typeof value === 'number' && !Number.isNaN(value)) return value;
    if (typeof value === 'string') {
        const parsed = Number(value);
        return Number.isNaN(parsed) ? undefined : parsed;
    }
    return undefined;
}

export async function runExpenseHandler(req: Request, res: Response) {
    try {
        const { organization_id, product_id, warehouse_id } = req.body;
        const period_days = parseNumber(req.body?.period_days);
        const holding_rate = parseNumber(req.body?.holding_rate);
        const stockout_penalty = parseNumber(req.body?.stockout_penalty);
        const spoilage_rate = parseNumber(req.body?.spoilage_rate);
        const fixed_order_cost = parseNumber(req.body?.fixed_order_cost);
        const eoq = parseNumber(req.body?.eoq);

        if (!organization_id || !product_id || !warehouse_id || !period_days) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const result = await runExpense({
            organization_id,
            product_id,
            warehouse_id,
            period_days,
            holding_rate,
            stockout_penalty,
            spoilage_rate,
            fixed_order_cost,
            eoq
        });

        res.json(result);
    } catch (err: any) {
        console.error('Expense Error:', err);
        res.status(500).json({ error: err.message });
    }
}

export async function runExpenseBulkHandler(req: Request, res: Response) {
    try {
        const { organization_id } = req.body;
        const period_days = parseNumber(req.body?.period_days);
        const holding_rate = parseNumber(req.body?.holding_rate);
        const stockout_penalty = parseNumber(req.body?.stockout_penalty);
        const spoilage_rate = parseNumber(req.body?.spoilage_rate);
        const fixed_order_cost = parseNumber(req.body?.fixed_order_cost);
        const eoq = parseNumber(req.body?.eoq);

        if (!organization_id || !period_days) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const results = await runExpenseForOrganization(organization_id, period_days, {
            holding_rate,
            stockout_penalty,
            spoilage_rate,
            fixed_order_cost,
            eoq
        });

        res.json({ count: results.length, results });
    } catch (err: any) {
        console.error('Expense Bulk Error:', err);
        res.status(500).json({ error: err.message });
    }
}
