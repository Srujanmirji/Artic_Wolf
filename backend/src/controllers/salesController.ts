import { Request, Response } from 'express';
import { supabase } from '../services/supabaseClient';

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
        res.status(500).json({ error: err.message });
    }
};

export const recordSale = async (req: Request, res: Response) => {
    try {
        const { organization_id, product_id, quantity_sold } = req.body;

        if (!organization_id || !product_id || !quantity_sold || quantity_sold <= 0) {
            return res.status(400).json({ error: 'Missing or invalid required fields (organization_id, product_id, quantity_sold)' });
        }

        // Find primary warehouse where this product is stored
        const { data: inventoryEntries, error: invError } = await supabase
            .from('inventory')
            .select('warehouse_id, current_stock')
            .eq('product_id', product_id)
            .limit(1);

        if (invError) throw invError;

        if (!inventoryEntries || inventoryEntries.length === 0) {
            return res.status(400).json({ error: 'Product not found in any inventory.' });
        }

        const warehouse_id = inventoryEntries[0].warehouse_id;
        const current_stock = Number(inventoryEntries[0].current_stock) || 0;

        if (current_stock < quantity_sold) {
            return res.status(400).json({ error: `Insufficient stock. Current stock is ${current_stock}.` });
        }

        const newStock = current_stock - quantity_sold;

        // 1. Log the sale in history
        const { error: insertError } = await supabase
            .from('sales_history')
            .insert({
                warehouse_id,
                product_id,
                date: new Date().toISOString().split('T')[0],
                quantity_sold
            });

        if (insertError) throw insertError;

        // 2. Decrement the inventory
        const { error: updateError } = await supabase
            .from('inventory')
            .update({ current_stock: newStock })
            .eq('product_id', product_id)
            .eq('warehouse_id', warehouse_id);

        if (updateError) throw updateError;

        res.json({ success: true, message: 'Sale recorded safely.', new_stock: newStock });
    } catch (err: any) {
        console.error('Record Sale Error:', err);
        res.status(500).json({ error: err.message });
    }
};
