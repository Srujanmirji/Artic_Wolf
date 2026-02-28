import { Router } from 'express';
import { dashboardKpisHandler } from '../controllers/dashboardController';
import { supabase } from '../services/supabaseClient';

const router = Router();

router.get('/kpis', dashboardKpisHandler);

// GET /api/dashboard/recent-activity?org=xxx  – returns last 5 items (recommendations or sales)
router.get('/recent-activity', async (req, res) => {
    try {
        const { org } = req.query;
        if (!org) return res.status(400).json({ error: 'org is required' });

        // 1. Fetch Recommendations
        const { data: recommendations, error: recError } = await supabase
            .from('recommendations')
            .select(`
                id,
                action_type,
                quantity,
                expected_cost_saving,
                created_at,
                product:product_id (name, category)
            `)
            .eq('organization_id', org)
            .order('created_at', { ascending: false })
            .limit(5);

        if (recError) throw recError;

        // 2. Fetch Sales History (linking via warehouses to org)
        const { data: warehouses } = await supabase.from('warehouses').select('id').eq('organization_id', org);
        const warehouseIds = (warehouses || []).map(w => w.id);

        let sales: any[] = [];
        if (warehouseIds.length > 0) {
            const { data, error: salesError } = await supabase
                .from('sales_history')
                .select(`
                    id,
                    quantity_sold,
                    date,
                    product:product_id (name, category, selling_price)
                `)
                .in('warehouse_id', warehouseIds)
                .order('date', { ascending: false })
                .limit(5);
            if (salesError) throw salesError;
            sales = data || [];
        }

        // 3. Format and Merge
        const formattedRecs = (recommendations || []).map((r: any) => ({
            id: r.id,
            name: r.product?.name || 'Unknown Product',
            type: r.action_type?.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()) || 'Action',
            amount: r.expected_cost_saving ? `₹${Math.abs(r.expected_cost_saving).toLocaleString('en-IN')}` : null,
            category: r.product?.category || '',
            created_at: r.created_at,
            timestamp: new Date(r.created_at).getTime()
        }));

        const formattedSales = sales.map((s: any) => ({
            id: s.id,
            name: s.product?.name || 'Unknown Product',
            type: 'Sale',
            amount: s.product?.selling_price ? `₹${(s.product.selling_price * s.quantity_sold).toLocaleString('en-IN')}` : null,
            category: s.product?.category || '',
            created_at: s.date,
            timestamp: new Date(s.date).getTime()
        }));

        const combined = [...formattedRecs, ...formattedSales]
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, 5);

        res.json(combined);
    } catch (err: any) {
        console.error('Recent Activity Error:', err);
        res.status(500).json({ error: err.message });
    }
});

export default router;
