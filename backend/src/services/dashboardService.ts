import { supabase } from './supabaseClient';

export type DashboardKpis = {
    total_products_tracked: number;
    stockout_risk_high: number;
    avg_safety_stock_pct: number;
    total_inventory_value: number;
    projected_stockouts: number;
    holding_cost: number;
    cost_savings: number;
};

function toNumber(value: unknown): number {
    const num = typeof value === 'number' ? value : Number(value || 0);
    return Number.isNaN(num) ? 0 : num;
}

export async function getDashboardKpis(organization_id: string): Promise<DashboardKpis> {
    const { data: warehouses, error: warehouseError } = await supabase
        .from('warehouses')
        .select('id')
        .eq('organization_id', organization_id);

    if (warehouseError) throw warehouseError;

    const warehouseIds = (warehouses || []).map((w: any) => w.id as string);
    if (warehouseIds.length === 0) {
        return {
            total_products_tracked: 0,
            stockout_risk_high: 0,
            avg_safety_stock_pct: 0,
            total_inventory_value: 0,
            projected_stockouts: 0,
            holding_cost: 0,
            cost_savings: 0
        };
    }

    const { data: inventoryRows, error: inventoryError } = await supabase
        .from('inventory')
        .select('product_id, warehouse_id, current_stock')
        .in('warehouse_id', warehouseIds);

    if (inventoryError) throw inventoryError;

    const { data: metricRows, error: metricError } = await supabase
        .from('inventory_metrics')
        .select('product_id, warehouse_id, reorder_point, safety_stock, forecast_demand')
        .eq('organization_id', organization_id)
        .in('warehouse_id', warehouseIds);

    if (metricError) throw metricError;

    const productSet = new Set<string>();
    const metricMap = new Map<string, { reorder_point: number; safety_stock: number; forecast_demand: number }>();
    for (const row of metricRows || []) {
        metricMap.set(`${row.product_id}:${row.warehouse_id}`, {
            reorder_point: toNumber(row.reorder_point),
            safety_stock: toNumber(row.safety_stock),
            forecast_demand: toNumber(row.forecast_demand)
        });
    }

    let stockout_risk_high = 0;
    for (const row of inventoryRows || []) {
        if (row.product_id) productSet.add(row.product_id as string);
        const key = `${row.product_id}:${row.warehouse_id}`;
        const metric = metricMap.get(key);
        if (!metric) continue;
        const current_stock = toNumber(row.current_stock);
        if (current_stock < metric.reorder_point) {
            stockout_risk_high += 1;
        }
    }

    const productIds = Array.from(productSet.values());
    let total_inventory_value = 0;
    if (productIds.length > 0) {
        const { data: productRows, error: productError } = await supabase
            .from('products')
            .select('id, cost_price, selling_price')
            .in('id', productIds);

        if (productError) throw productError;

        const priceMap = new Map<string, number>();
        for (const row of productRows || []) {
            const cost = toNumber(row.cost_price);
            const selling = toNumber(row.selling_price);
            priceMap.set(row.id as string, cost > 0 ? cost : selling);
        }

        for (const row of inventoryRows || []) {
            const price = priceMap.get(row.product_id as string) || 0;
            const stock = toNumber(row.current_stock);
            total_inventory_value += stock * price;
        }
    }

    const { data: costRows, error: costError } = await supabase
        .from('inventory_cost_analysis')
        .select('holding_cost')
        .eq('organization_id', organization_id);

    if (costError) throw costError;

    const holding_cost = (costRows || []).reduce((sum: number, row: any) => {
        return sum + toNumber(row.holding_cost);
    }, 0);

    const { data: recommendationRows, error: recommendationError } = await supabase
        .from('recommendations')
        .select('expected_cost_saving')
        .eq('organization_id', organization_id);

    if (recommendationError) throw recommendationError;

    const cost_savings = (recommendationRows || []).reduce((sum: number, row: any) => {
        return sum + toNumber(row.expected_cost_saving);
    }, 0);

    let safetySum = 0;
    let demandSum = 0;
    for (const metric of metricMap.values()) {
        if (metric.forecast_demand > 0) {
            safetySum += metric.safety_stock;
            demandSum += metric.forecast_demand;
        }
    }
    const avg_safety_stock_pct = demandSum > 0 ? (safetySum / demandSum) * 100 : 0;

    return {
        total_products_tracked: productSet.size,
        stockout_risk_high,
        avg_safety_stock_pct,
        total_inventory_value,
        projected_stockouts: stockout_risk_high,
        holding_cost,
        cost_savings
    };
}
