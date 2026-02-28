import { Router } from 'express';
import { z } from 'zod';
import { supabase } from '../services/supabaseClient';
import { runExpenseHandler, runExpenseBulkHandler } from '../controllers/expenseController';
import { validateRequest } from '../middleware/validateRequest';

const router = Router();

const itemSchema = z.object({
    body: z.object({
        organization_id: z.string().uuid(),
        name: z.string().min(1),
        category: z.string().min(1),
        price: z.number().nonnegative(),
        stock: z.number().int().nonnegative()
    })
});

const updateItemSchema = itemSchema;

function toNumber(value: unknown): number {
    const num = typeof value === 'number' ? value : Number(value || 0);
    return Number.isNaN(num) ? 0 : num;
}

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

// /api/inventory/items POST
router.post('/items', validateRequest(itemSchema), async (req, res) => {
    try {
        const { organization_id, name, category, price, stock } = req.body;

        // Ensure at least one warehouse exists for the org
        const { data: warehouses, error: wErr } = await supabase
            .from('warehouses')
            .select('id')
            .eq('organization_id', organization_id)
            .limit(1);

        if (wErr || !warehouses || warehouses.length === 0) {
            return res.status(400).json({ error: 'No warehouse found for this organization. Create a warehouse first.' });
        }
        const warehouse_id = warehouses[0].id;

        // Create product
        const { data: product, error: pErr } = await supabase
            .from('products')
            .insert({ organization_id, name, category, selling_price: price, sku: `SKU-${Date.now()}` })
            .select()
            .single();

        if (pErr) throw pErr;

        // Set initial stock
        const { error: iErr } = await supabase
            .from('inventory')
            .insert({ warehouse_id, product_id: product.id, current_stock: stock });

        if (iErr) throw iErr;

        res.json({ status: 'ok', id: product.id });
    } catch (err: any) {
        console.error('Inventory Add Error:', err);
        res.status(500).json({ error: err.message });
    }
});

// /api/inventory/items/:id PUT
router.put('/items/:id', validateRequest(updateItemSchema), async (req, res) => {
    try {
        const productId = req.params.id;
        const { organization_id, name, category, price, stock } = req.body;

        // Verify product belongs to org
        const { data: existing, error: pCheckErr } = await supabase
            .from('products')
            .select('id')
            .eq('id', productId)
            .eq('organization_id', organization_id)
            .single();

        if (pCheckErr || !existing) return res.status(404).json({ error: 'Product not found' });

        // Update product
        const { error: pErr } = await supabase
            .from('products')
            .update({ name, category, selling_price: price })
            .eq('id', productId);

        if (pErr) throw pErr;

        // Find primary warehouse for inventory update
        const { data: inventoryEntries } = await supabase
            .from('inventory')
            .select('warehouse_id, current_stock')
            .eq('product_id', productId)
            .limit(1);

        // Update stock in the first warehouse found
        if (inventoryEntries && inventoryEntries.length > 0) {
            const { error: iErr } = await supabase
                .from('inventory')
                .update({ current_stock: stock })
                .eq('product_id', productId)
                .eq('warehouse_id', inventoryEntries[0].warehouse_id);
            if (iErr) throw iErr;
        }

        res.json({ status: 'ok' });
    } catch (err: any) {
        console.error('Inventory Update Error:', err);
        res.status(500).json({ error: err.message });
    }
});

// /api/inventory/items/:id DELETE
router.delete('/items/:id', async (req, res) => {
    try {
        const productId = req.params.id;
        const orgId = req.query.organization_id;

        if (!orgId) return res.status(400).json({ error: 'organization_id is required' });

        // Verify product belongs to org
        const { data: existing, error: pCheckErr } = await supabase
            .from('products')
            .select('id')
            .eq('id', productId)
            .eq('organization_id', orgId)
            .single();

        if (pCheckErr || !existing) return res.status(404).json({ error: 'Product not found' });

        // Order of deletion matters due to FK constraints
        await supabase.from('inventory').delete().eq('product_id', productId);
        await supabase.from('sales_history').delete().eq('product_id', productId);
        await supabase.from('inventory_metrics').delete().eq('product_id', productId);
        await supabase.from('inventory_cost_analysis').delete().eq('product_id', productId);
        await supabase.from('recommendations').delete().eq('product_id', productId);
        await supabase.from('news_impact_analysis').delete().eq('product_id', productId);

        // Finally remove the product
        const { error: pErr } = await supabase.from('products').delete().eq('id', productId);
        if (pErr) throw pErr;

        res.json({ status: 'ok' });
    } catch (err: any) {
        console.error('Inventory Delete Error:', err);
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
