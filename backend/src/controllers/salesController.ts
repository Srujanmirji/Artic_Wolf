import { Request, Response } from 'express';
import { supabase } from '../services/supabaseClient';

function formatDataAccessError(err: any): string {
    const message = String(err?.message || 'Unknown server error');
    const details = String(err?.details || '');
    const combined = `${message} ${details}`.toLowerCase();

    if (combined.includes('fetch failed') || combined.includes('connect timeout')) {
        return 'Database connection failed: Supabase is unreachable from this server. Check DNS/network and retry.';
    }

    return message;
}

export const getSalesHistory = async (req: Request, res: Response) => {
    try {
        const { org } = req.query;
        if (!org) return res.status(400).json({ error: 'Organization ID is required' });

        // First get warehouse IDs for this org
        const { data: warehouses, error: warehouseError } = await supabase
            .from('warehouses')
            .select('id')
            .eq('organization_id', org);

        if (warehouseError) throw warehouseError;

        const warehouseIds = (warehouses || []).map((w: any) => w.id);
        if (warehouseIds.length === 0) return res.json([]);

        // Get sales history for these warehouses
        const { data: sales, error: salesError } = await supabase
            .from('sales_history')
            .select(`
                id,
                date,
                quantity_sold,
                product_id,
                products (
                    name,
                    category,
                    selling_price
                )
            `)
            .in('warehouse_id', warehouseIds)
            .order('date', { ascending: false })
            .limit(100);

        if (salesError) throw salesError;

        res.json(sales);
    } catch (err: any) {
        console.error('Fetch Sales History Error:', err);
        res.status(500).json({ error: formatDataAccessError(err) });
    }
};

export const recordSale = async (req: Request, res: Response) => {
    try {
        const { organization_id, product_id, quantity_sold, cost_price, selling_price } = req.body;

        if (!organization_id || !product_id || !quantity_sold || quantity_sold <= 0) {
            return res.status(400).json({ error: 'Missing or invalid required fields (organization_id, product_id, quantity_sold)' });
        }

        const parsedCost = cost_price === undefined ? undefined : Number(cost_price);
        const parsedSelling = selling_price === undefined ? undefined : Number(selling_price);

        if (parsedCost !== undefined && (Number.isNaN(parsedCost) || parsedCost < 0)) {
            return res.status(400).json({ error: 'cost_price must be a non-negative number' });
        }

        if (parsedSelling !== undefined && (Number.isNaN(parsedSelling) || parsedSelling < 0)) {
            return res.status(400).json({ error: 'selling_price must be a non-negative number' });
        }

        // 1. Find organizations's warehouses
        const { data: warehouses } = await supabase
            .from('warehouses')
            .select('id')
            .eq('organization_id', organization_id);

        const warehouseIds = (warehouses || []).map(w => w.id);

        // Validate product ownership and read current prices
        const { data: productRow, error: productError } = await supabase
            .from('products')
            .select('id, cost_price, selling_price')
            .eq('id', product_id)
            .eq('organization_id', organization_id)
            .maybeSingle();

        if (productError) throw productError;
        if (!productRow) {
            return res.status(404).json({ error: 'Product not found for this organization.' });
        }

        // 2. Find inventory entry in these warehouses
        const { data: inventoryEntries, error: invError } = await supabase
            .from('inventory')
            .select('warehouse_id, current_stock')
            .eq('product_id', product_id)
            .in('warehouse_id', warehouseIds)
            .limit(1);

        if (invError) throw invError;

        if (!inventoryEntries || inventoryEntries.length === 0) {
            return res.status(400).json({ error: 'Product not found in your organization\'s inventory.' });
        }

        const warehouse_id = inventoryEntries[0].warehouse_id;
        const current_stock = Number(inventoryEntries[0].current_stock) || 0;

        if (current_stock < quantity_sold) {
            return res.status(400).json({ error: `Insufficient stock. Current stock is ${current_stock}.` });
        }

        const newStock = current_stock - quantity_sold;

        // 3. Persist editable prices to product if provided
        if (parsedCost !== undefined || parsedSelling !== undefined) {
            const priceUpdatePayload: any = {};
            if (parsedCost !== undefined) priceUpdatePayload.cost_price = parsedCost;
            if (parsedSelling !== undefined) priceUpdatePayload.selling_price = parsedSelling;

            const { error: priceUpdateError } = await supabase
                .from('products')
                .update(priceUpdatePayload)
                .eq('id', product_id)
                .eq('organization_id', organization_id);

            if (priceUpdateError) throw priceUpdateError;
        }

        const effectiveCost = parsedCost !== undefined ? parsedCost : Number(productRow.cost_price || 0);
        const effectiveSelling = parsedSelling !== undefined ? parsedSelling : Number(productRow.selling_price || 0);
        const unitProfit = effectiveSelling - effectiveCost;
        const totalProfit = unitProfit * quantity_sold;

        // 4. Log the sale in history
        const { error: insertError } = await supabase
            .from('sales_history')
            .insert({
                warehouse_id,
                product_id,
                date: new Date().toISOString().split('T')[0],
                quantity_sold
            });

        if (insertError) throw insertError;

        // 5. Decrement the inventory
        const { error: updateError } = await supabase
            .from('inventory')
            .update({ current_stock: newStock })
            .eq('product_id', product_id)
            .eq('warehouse_id', warehouse_id);

        if (updateError) throw updateError;

        res.json({
            success: true,
            message: 'Sale recorded safely.',
            new_stock: newStock,
            unit_profit: unitProfit,
            total_profit: totalProfit
        });
    } catch (err: any) {
        console.error('Record Sale Error:', err);
        res.status(500).json({ error: formatDataAccessError(err) });
    }
};
