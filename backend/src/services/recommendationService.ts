import { supabase } from './supabaseClient';

export type RecommendationInput = {
    organization_id: string;
    product_id: string;
    warehouse_id: string;
};

export type RecommendationResult = {
    action_type: 'increase' | 'decrease' | 'none';
    quantity: number;
    current_stock: number;
    reorder_point: number;
    safety_stock: number;
};

function toNumber(value: unknown): number {
    const num = typeof value === 'number' ? value : Number(value || 0);
    return Number.isNaN(num) ? 0 : num;
}

function determineAction(current_stock: number, reorder_point: number, safety_stock: number): RecommendationResult {
    if (current_stock < reorder_point) {
        return {
            action_type: 'increase',
            quantity: Math.ceil(reorder_point - current_stock),
            current_stock,
            reorder_point,
            safety_stock
        };
    }

    if (current_stock > reorder_point + safety_stock) {
        return {
            action_type: 'decrease',
            quantity: Math.ceil(current_stock - (reorder_point + safety_stock)),
            current_stock,
            reorder_point,
            safety_stock
        };
    }

    return {
        action_type: 'none',
        quantity: 0,
        current_stock,
        reorder_point,
        safety_stock
    };
}

export async function runRecommendation(input: RecommendationInput): Promise<RecommendationResult> {
    const { organization_id, product_id, warehouse_id } = input;

    const { data: warehouseRow, error: warehouseError } = await supabase
        .from('warehouses')
        .select('id')
        .eq('id', warehouse_id)
        .eq('organization_id', organization_id)
        .maybeSingle();

    if (warehouseError) throw warehouseError;
    if (!warehouseRow) {
        throw new Error('Warehouse not found for organization');
    }

    const { data: inventoryRows, error: inventoryError } = await supabase
        .from('inventory')
        .select('current_stock')
        .eq('product_id', product_id)
        .eq('warehouse_id', warehouse_id);

    if (inventoryError) throw inventoryError;

    const current_stock = (inventoryRows || []).reduce((sum: number, row: any) => {
        return sum + toNumber(row.current_stock);
    }, 0);

    const { data: metricRow, error: metricError } = await supabase
        .from('inventory_metrics')
        .select('reorder_point, safety_stock')
        .eq('organization_id', organization_id)
        .eq('product_id', product_id)
        .eq('warehouse_id', warehouse_id)
        .maybeSingle();

    if (metricError) throw metricError;
    if (!metricRow) {
        throw new Error('Inventory metrics not found for product and warehouse');
    }

    const reorder_point = toNumber(metricRow.reorder_point);
    const safety_stock = toNumber(metricRow.safety_stock);

    const result = determineAction(current_stock, reorder_point, safety_stock);

    if (result.action_type !== 'none') {
        const { error: insertError } = await supabase
            .from('recommendations')
            .insert({
                organization_id,
                product_id,
                from_warehouse: null,
                to_warehouse: null,
                action_type: result.action_type,
                quantity: result.quantity,
                expected_cost_saving: null,
                confidence: null
            });
        if (insertError) throw insertError;
    }

    return result;
}

export async function runRecommendationsForOrganization(organization_id: string) {
    const { data: warehouses, error: warehouseError } = await supabase
        .from('warehouses')
        .select('id')
        .eq('organization_id', organization_id);

    if (warehouseError) throw warehouseError;

    const warehouseIds = (warehouses || []).map((w: any) => w.id as string);
    if (warehouseIds.length === 0) return [];

    const { data: inventoryRows, error: inventoryError } = await supabase
        .from('inventory')
        .select('product_id, warehouse_id, current_stock')
        .in('warehouse_id', warehouseIds);

    if (inventoryError) throw inventoryError;

    const stockMap = new Map<string, number>();
    for (const row of inventoryRows || []) {
        const key = `${row.product_id}:${row.warehouse_id}`;
        const current = stockMap.get(key) || 0;
        stockMap.set(key, current + toNumber(row.current_stock));
    }

    const { data: metricRows, error: metricError } = await supabase
        .from('inventory_metrics')
        .select('product_id, warehouse_id, reorder_point, safety_stock')
        .eq('organization_id', organization_id)
        .in('warehouse_id', warehouseIds);

    if (metricError) throw metricError;

    const metricMap = new Map<string, { reorder_point: number; safety_stock: number }>();
    for (const row of metricRows || []) {
        const key = `${row.product_id}:${row.warehouse_id}`;
        metricMap.set(key, {
            reorder_point: toNumber(row.reorder_point),
            safety_stock: toNumber(row.safety_stock)
        });
    }

    const results = [];
    const insertRows = [];
    for (const [key, current_stock] of stockMap.entries()) {
        const metric = metricMap.get(key);
        if (!metric) continue;
        const [product_id, warehouse_id] = key.split(':');
        const result = determineAction(current_stock, metric.reorder_point, metric.safety_stock);
        results.push({
            product_id,
            warehouse_id,
            ...result
        });
        if (result.action_type !== 'none') {
            insertRows.push({
                organization_id,
                product_id,
                from_warehouse: null,
                to_warehouse: null,
                action_type: result.action_type,
                quantity: result.quantity,
                expected_cost_saving: null,
                confidence: null
            });
        }
    }

    if (insertRows.length > 0) {
        const { error: insertError } = await supabase
            .from('recommendations')
            .insert(insertRows);
        if (insertError) throw insertError;
    }

    return results;
}
