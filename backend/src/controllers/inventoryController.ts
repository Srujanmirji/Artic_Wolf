import { Request, Response } from 'express';
import { supabase } from '../config/supabase';

export const getInventory = async (req: Request, res: Response) => {
    try {
        const orgId = req.query.orgId as string;

        // Build query
        let query = supabase.from('inventory_items').select('*');
        if (orgId) {
            query = query.eq('org_id', orgId);
        }

        // Order by latest created
        query = query.order('created_at', { ascending: false });

        const { data, error } = await query;

        if (error) {
            console.error('Supabase error fetching inventory:', error);
            return res.status(500).json({ error: 'Failed to fetch inventory from database' });
        }

        res.json({ success: true, data });
    } catch (error: any) {
        console.error('Controller error fetching inventory:', error);
        res.status(500).json({ error: error.message || 'Internal server error' });
    }
};

export const addInventoryItem = async (req: Request, res: Response) => {
    try {
        const { org_id, product_id, name, category, stock, price, status } = req.body;

        if (!product_id || !name || !category) {
            return res.status(400).json({ error: 'Missing required fields: product_id, name, category' });
        }

        const { data, error } = await supabase
            .from('inventory_items')
            .insert([{ org_id, product_id, name, category, stock: stock || 0, price: price || 0, status: status || 'In Stock' }])
            .select();

        if (error) {
            console.error('Supabase error adding inventory item:', error);
            return res.status(500).json({ error: 'Failed to add item to database' });
        }

        res.status(201).json({ success: true, data: data[0] });
    } catch (error: any) {
        console.error('Controller error adding inventory item:', error);
        res.status(500).json({ error: error.message || 'Internal server error' });
    }
};

export const updateInventoryItem = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        if (!id) {
            return res.status(400).json({ error: 'Item ID is required for updating' });
        }

        const { data, error } = await supabase
            .from('inventory_items')
            .update(updates)
            .eq('id', id)
            .select();

        if (error) {
            console.error('Supabase error updating inventory item:', error);
            return res.status(500).json({ error: 'Failed to update item in database' });
        }

        res.json({ success: true, data: data[0] });
    } catch (error: any) {
        console.error('Controller error updating inventory item:', error);
        res.status(500).json({ error: error.message || 'Internal server error' });
    }
};
