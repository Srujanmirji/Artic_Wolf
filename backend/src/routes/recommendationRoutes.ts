import { Router } from 'express';
import { supabase } from '../services/supabaseClient';
import { runRecommendationHandler, runRecommendationsBulkHandler } from '../controllers/recommendationController';

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

        const rows = data || [];
        if (rows.length === 0) return res.json([]);

        const productIds = Array.from(new Set(rows.map((row: any) => row.product_id).filter(Boolean)));
        const warehouseIds = Array.from(new Set(rows.flatMap((row: any) => [row.from_warehouse, row.to_warehouse]).filter(Boolean)));

        const [productResult, warehouseResult] = await Promise.all([
            productIds.length > 0
                ? supabase.from('products').select('id, sku, name, category').in('id', productIds)
                : Promise.resolve({ data: [], error: null } as any),
            warehouseIds.length > 0
                ? supabase.from('warehouses').select('id, name, location').in('id', warehouseIds)
                : Promise.resolve({ data: [], error: null } as any)
        ]);

        if (productResult.error) throw productResult.error;
        if (warehouseResult.error) throw warehouseResult.error;

        const productMap = new Map<string, any>();
        for (const row of productResult.data || []) {
            productMap.set(row.id as string, row);
        }

        const warehouseMap = new Map<string, any>();
        for (const row of warehouseResult.data || []) {
            warehouseMap.set(row.id as string, row);
        }

        const enriched = rows.map((row: any) => ({
            ...row,
            product: productMap.get(row.product_id) || null,
            from_warehouse_name: row.from_warehouse ? warehouseMap.get(row.from_warehouse)?.name || null : null,
            to_warehouse_name: row.to_warehouse ? warehouseMap.get(row.to_warehouse)?.name || null : null
        }));

        res.json(enriched);
    } catch (err: any) {
        console.error('Recommendations Error:', err);
        res.status(500).json({ error: err.message });
    }
});

// /api/recommendations/run
router.post('/run', runRecommendationHandler);

// /api/recommendations/run-all
router.post('/run-all', runRecommendationsBulkHandler);

export default router;
