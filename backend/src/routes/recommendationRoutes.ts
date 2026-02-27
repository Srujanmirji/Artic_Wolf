import { Router } from 'express';
import { supabase } from '../services/supabaseClient';

const router = Router();

router.get('/', async (req, res) => {
    try {
        const { org } = req.query;
        if (!org) return res.status(400).json({ error: 'Organization ID is required' });

        // In a real app, this might calculate on the fly or fetch pre-calculated.
        // Fetching pre-calculated recommendations.
        const { data, error } = await supabase
            .from('recommendations')
            .select('*')
            .eq('organization_id', org);

        if (error) throw error;
        res.json(data);
    } catch (err: any) {
        console.error('Recommendations Error:', err);
        res.status(500).json({ error: err.message });
    }
});

export default router;
