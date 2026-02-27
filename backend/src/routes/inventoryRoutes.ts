import { Router } from 'express';
import { supabase } from '../services/supabaseClient';

const router = Router();

// /api/sales/upload
router.post('/upload', async (req, res) => {
    try {
        const { organization_id, warehouse_id, rows } = req.body;
        if (!organization_id || !warehouse_id || !rows) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Decorate rows with IDs before insert
        const insertRows = rows.map((row: any) => ({
            warehouse_id,
            product_id: row.product_id,
            date: row.date,
            quantity_sold: row.quantity_sold
        }));

        const { data, error } = await supabase.from('sales_history').insert(insertRows);

        if (error) throw error;

        res.json({ status: 'ok', rows_processed: rows.length });
    } catch (err: any) {
        console.error('Upload Error:', err);
        res.status(500).json({ error: err.message });
    }
});

// /api/inventory/metrics
router.get('/metrics', async (req, res) => {
    try {
        const { org } = req.query;
        if (!org) return res.status(400).json({ error: 'Organization ID is required' });

        const { data, error } = await supabase
            .from('inventory_metrics')
            .select('*')
            .eq('organization_id', org);

        if (error) throw error;
        res.json(data);
    } catch (err: any) {
        console.error('Metrics Error:', err);
        res.status(500).json({ error: err.message });
    }
});

export default router;
