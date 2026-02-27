import { Router } from 'express';
import { supabase } from '../services/supabaseClient';

const router = Router();

router.post('/', async (req, res) => {
    try {
        const { organization_id, operations } = req.body;
        if (!organization_id || !Array.isArray(operations)) {
            return res.status(400).json({ error: 'Invalid payload' });
        }

        const results = [];

        for (const op of operations) {
            if (op.type === 'sales_upload') {
                const insertRows = op.payload.rows.map((r: any) => ({
                    warehouse_id: op.payload.warehouse_id,
                    product_id: r.product_id,
                    date: r.date,
                    quantity_sold: r.quantity_sold
                }));
                const { error } = await supabase.from('sales_history').insert(insertRows);

                if (error) {
                    results.push({ op_id: op.op_id, status: 'error', error: error.message });
                } else {
                    results.push({ op_id: op.op_id, status: 'ok', server_ts: new Date().toISOString() });
                }
            } else {
                // Handle other operation types or mark as unhandled
                results.push({ op_id: op.op_id, status: 'error', error: 'Unhandled operation type' });
            }
        }

        res.json({ results });
    } catch (err: any) {
        console.error('Sync Error:', err);
        res.status(500).json({ error: err.message });
    }
});

export default router;
