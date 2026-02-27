import { Router } from 'express';
import { supabase } from '../services/supabaseClient';
import { expSmoothing, safetyStock } from '../utils/calculations';

const router = Router();

router.post('/run', async (req, res) => {
    try {
        const { organization_id, product_id, warehouse_id, period_days, method } = req.body;

        // Fetch historical sales for the product
        const { data: salesData, error } = await supabase
            .from('sales_history')
            .select('quantity_sold')
            .eq('product_id', product_id)
            .eq('warehouse_id', warehouse_id)
            .order('date', { ascending: true });

        if (error) throw error;

        const history = salesData.map((d: any) => d.quantity_sold);
        let forecast_demand = 0;

        if (method === 'exponential_smoothing') {
            forecast_demand = expSmoothing(history, 0.2);
        } else {
            forecast_demand = expSmoothing(history, 0.2); // Fallback
        }

        // Extrapolate for period_days
        forecast_demand = forecast_demand * period_days;

        // Calculate std dev (mocking for now)
        const avg_daily_demand = history.length > 0 ? history.reduce((a: number, b: number) => a + b, 0) / history.length : 0;
        const sigma_d = Math.sqrt(history.reduce((sq: number, n: number) => sq + Math.pow(n - avg_daily_demand, 2), 0) / (history.length || 1));

        // Fetch lead time
        const { data: supplierData } = await supabase
            .from('suppliers')
            .select('avg_lead_time_days')
            .eq('product_id', product_id)
            .single();

        const lead_time_days = supplierData?.avg_lead_time_days || 7;
        const safety_stock = safetyStock(sigma_d, lead_time_days, 0.95);
        const reorder_point = (avg_daily_demand * lead_time_days) + safety_stock;

        // Upsert to inventory_metrics
        await supabase.from('inventory_metrics').upsert({
            organization_id,
            product_id,
            warehouse_id,
            forecast_demand,
            forecast_period_days: period_days,
            safety_stock,
            reorder_point,
            projected_stockout_risk: 0.1, // mock
            calculated_at: new Date().toISOString()
        }, { onConflict: 'product_id,warehouse_id' }); // Requires unique contraint or manual update logic in production

        res.json({
            forecast_demand,
            period_days,
            method: "exponential_smoothing",
            sigma_d,
            avg_daily_demand
        });
    } catch (err: any) {
        console.error('Forecast Error:', err);
        res.status(500).json({ error: err.message });
    }
});

export default router;
