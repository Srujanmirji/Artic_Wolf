import { Router } from 'express';
import { dashboardKpisHandler } from '../controllers/dashboardController';
import { supabase } from '../services/supabaseClient';

const router = Router();

router.get('/kpis', dashboardKpisHandler);

// GET /api/dashboard/recent-activity?org=xxx  – returns last 5 recommendation actions as activity feed
router.get('/recent-activity', async (req, res) => {
    try {
        const { org } = req.query;
        if (!org) return res.status(400).json({ error: 'org is required' });

        const { data, error } = await supabase
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

        if (error) throw error;

        const items = (data || []).map((r: any) => ({
            id: r.id,
            name: r.product?.name || 'Unknown Product',
            type: r.action_type?.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()) || 'Action',
            amount: r.expected_cost_saving ? `₹${Math.abs(r.expected_cost_saving).toLocaleString('en-IN')}` : null,
            category: r.product?.category || '',
            created_at: r.created_at,
        }));

        res.json(items);
    } catch (err: any) {
        console.error('Recent Activity Error:', err);
        res.status(500).json({ error: err.message });
    }
});

export default router;
