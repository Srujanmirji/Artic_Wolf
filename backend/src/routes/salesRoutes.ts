import { Router } from 'express';
import { z } from 'zod';
import { supabase } from '../services/supabaseClient';
import { validateRequest } from '../middleware/validateRequest';
import { getSalesHistory, recordSale } from '../controllers/salesController';

const router = Router();

const uploadSchema = z.object({
    body: z.object({
        organization_id: z.string().uuid(),
        warehouse_id: z.string().uuid(),
        rows: z.array(z.object({
            product_id: z.string().uuid(),
            date: z.string().refine(val => !isNaN(Date.parse(val)), { message: "Invalid date format" }),
            quantity_sold: z.number().int().nonnegative()
        }))
    })
});

const recordSaleSchema = z.object({
    body: z.object({
        organization_id: z.string().uuid(),
        product_id: z.string().uuid(),
        quantity_sold: z.number().int().positive()
    })
});

// GET /api/sales/history?org=org_id
router.get('/history', getSalesHistory);

// POST /api/sales/record
router.post('/record', validateRequest(recordSaleSchema), recordSale);

// POST /api/sales/upload (Migrated from inventoryRoutes)
router.post('/upload', validateRequest(uploadSchema), async (req, res) => {
    try {
        const { organization_id, warehouse_id, rows } = req.body;

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

export default router;
