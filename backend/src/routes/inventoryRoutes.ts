import { Router } from 'express';
import { supabase } from '../services/supabaseClient';
import { runExpenseHandler, runExpenseBulkHandler } from '../controllers/expenseController';

const router = Router();

function toNumber(value: unknown): number {
    const num = typeof value === 'number' ? value : Number(value || 0);
    return Number.isNaN(num) ? 0 : num;
}

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

// /api/inventory/list
router.get('/list', async (req, res) => {
    try {
        const { org } = req.query;
        if (!org) return res.status(400).json({ error: 'Organization ID is required' });

        const { data: warehouses, error: warehouseError } = await supabase
            .from('warehouses')
            .select('id')
            .eq('organization_id', org);

        if (warehouseError) throw warehouseError;

        const warehouseIds = (warehouses || []).map((w: any) => w.id as string);
        if (warehouseIds.length === 0) return res.json([]);

        const { data: inventoryRows, error: inventoryError } = await supabase
            .from('inventory')
            .select('product_id, warehouse_id, current_stock')
            .in('warehouse_id', warehouseIds);

        if (inventoryError) throw inventoryError;

        const { data: productRows, error: productError } = await supabase
            .from('products')
            .select('id, sku, name, category, selling_price, cost_price')
            .eq('organization_id', org);

        if (productError) throw productError;

        const { data: metricRows, error: metricError } = await supabase
            .from('inventory_metrics')
            .select('product_id, warehouse_id, reorder_point, safety_stock')
            .eq('organization_id', org)
            .in('warehouse_id', warehouseIds);

        if (metricError) throw metricError;

        const productMap = new Map<string, any>();
        for (const row of productRows || []) {
            productMap.set(row.id as string, row);
        }

        const stockMap = new Map<string, number>();
        for (const row of inventoryRows || []) {
            const current = stockMap.get(row.product_id as string) || 0;
            stockMap.set(row.product_id as string, current + toNumber(row.current_stock));
        }

        const reorderMap = new Map<string, number>();
        for (const row of metricRows || []) {
            const current = reorderMap.get(row.product_id as string) || 0;
            reorderMap.set(row.product_id as string, current + toNumber(row.reorder_point));
        }

        const items = [];
        for (const [productId, stock] of stockMap.entries()) {
            const product = productMap.get(productId);
            const reorderPoint = reorderMap.get(productId) || 0;

            let status = 'In Stock';
            if (stock <= 0) {
                status = 'Out of Stock';
            } else if (reorderPoint > 0 && stock < reorderPoint) {
                status = 'Low Stock';
            }

            const price = product ? toNumber(product.selling_price) || toNumber(product.cost_price) : 0;

            items.push({
                id: product?.sku || productId,
                product_id: productId,
                name: product?.name || `Product ${String(productId).slice(0, 8)}`,
                category: product?.category || 'Uncategorized',
                stock,
                status,
                price
            });
        }

        items.sort((a: any, b: any) => a.name.localeCompare(b.name));

        res.json(items);
    } catch (err: any) {
        console.error('Inventory List Error:', err);
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

// /api/inventory/expense
router.post('/expense', runExpenseHandler);

// /api/inventory/expense/bulk
router.post('/expense/bulk', runExpenseBulkHandler);

export default router;
