import { supabase } from './supabaseClient';

export type ExpenseInput = {
    organization_id: string;
    product_id: string;
    warehouse_id: string;
    period_days: number;
    holding_rate?: number;
    stockout_penalty?: number;
    spoilage_rate?: number;
    fixed_order_cost?: number;
    eoq?: number;
};

export type ExpenseResult = {
    holding_cost: number;
    stockout_cost: number;
    spoilage_cost: number;
    ordering_cost: number;
    total_cost: number;
};

function validPositiveNumber(value: unknown): value is number {
    return typeof value === 'number' && !Number.isNaN(value) && value > 0;
}

async function getLatestMetricRow(organization_id: string, product_id: string, warehouse_id: string) {
    const { data, error } = await supabase
        .from('inventory_metrics')
        .select('forecast_demand, calculated_at')
        .eq('organization_id', organization_id)
        .eq('product_id', product_id)
        .eq('warehouse_id', warehouse_id)
        .order('calculated_at', { ascending: false })
        .limit(1);

    if (error) throw error;
    return data?.[0] || null;
}

async function upsertLatestCostRow(
    organization_id: string,
    product_id: string,
    warehouse_id: string,
    payload: Record<string, unknown>
) {
    const { data: rows, error: existingError } = await supabase
        .from('inventory_cost_analysis')
        .select('id, calculated_at')
        .eq('organization_id', organization_id)
        .eq('product_id', product_id)
        .eq('warehouse_id', warehouse_id)
        .order('calculated_at', { ascending: false });

    if (existingError) throw existingError;

    const latest = rows?.[0];
    const duplicateIds = (rows || []).slice(1).map((row: any) => row.id).filter(Boolean);

    if (latest?.id) {
        const { error: updateError } = await supabase
            .from('inventory_cost_analysis')
            .update(payload)
            .eq('id', latest.id);
        if (updateError) throw updateError;
    } else {
        const { error: insertError } = await supabase
            .from('inventory_cost_analysis')
            .insert(payload);
        if (insertError) throw insertError;
    }

    if (duplicateIds.length > 0) {
        await supabase.from('inventory_cost_analysis').delete().in('id', duplicateIds);
    }
}

export async function runExpense(input: ExpenseInput): Promise<ExpenseResult> {
    const {
        organization_id,
        product_id,
        warehouse_id,
        period_days
    } = input;

    const holding_rate = validPositiveNumber(input.holding_rate) ? input.holding_rate : 0.25;
    const stockout_penalty = validPositiveNumber(input.stockout_penalty) ? input.stockout_penalty : 0.3;
    const spoilage_rate = validPositiveNumber(input.spoilage_rate) ? input.spoilage_rate : 0.1;
    const fixed_order_cost = validPositiveNumber(input.fixed_order_cost) ? input.fixed_order_cost : 50;
    const eoq = validPositiveNumber(input.eoq) ? input.eoq : 100;

    const { data: inventoryRows, error: inventoryError } = await supabase
        .from('inventory')
        .select('current_stock, expiry_date')
        .eq('product_id', product_id)
        .eq('warehouse_id', warehouse_id);

    if (inventoryError) throw inventoryError;

    const current_stock = (inventoryRows || []).reduce((sum: number, row: any) => {
        const qty = typeof row.current_stock === 'number' ? row.current_stock : Number(row.current_stock || 0);
        return sum + (Number.isNaN(qty) ? 0 : qty);
    }, 0);

    const now = new Date();
    const endDate = new Date(now.getTime() + period_days * 24 * 60 * 60 * 1000);
    const perishable_units_at_risk = (inventoryRows || []).reduce((sum: number, row: any) => {
        if (!row.expiry_date) return sum;
        const expiryDate = new Date(row.expiry_date);
        if (Number.isNaN(expiryDate.getTime())) return sum;
        if (expiryDate <= endDate) {
            const qty = typeof row.current_stock === 'number' ? row.current_stock : Number(row.current_stock || 0);
            return sum + (Number.isNaN(qty) ? 0 : qty);
        }
        return sum;
    }, 0);

    const { data: productRow, error: productError } = await supabase
        .from('products')
        .select('cost_price, selling_price')
        .eq('id', product_id)
        .maybeSingle();

    if (productError) throw productError;

    const cost_price = productRow?.cost_price ? Number(productRow.cost_price) : 0;
    const selling_price = productRow?.selling_price ? Number(productRow.selling_price) : 0;

    const metricRow = await getLatestMetricRow(organization_id, product_id, warehouse_id);

    const forecast_demand = metricRow?.forecast_demand ? Number(metricRow.forecast_demand) : 0;
    const stockout_units = Math.max(forecast_demand - current_stock, 0);

    const holding_cost = current_stock * cost_price * holding_rate * (period_days / 365);
    const stockout_cost = stockout_units * selling_price * stockout_penalty;
    const spoilage_cost = perishable_units_at_risk * cost_price * spoilage_rate;
    const ordering_cost = forecast_demand > 0 ? (forecast_demand / eoq) * fixed_order_cost : 0;
    const total_cost = holding_cost + stockout_cost + spoilage_cost + ordering_cost;

    const payload = {
        organization_id,
        product_id,
        warehouse_id,
        holding_cost,
        stockout_cost,
        spoilage_cost,
        ordering_cost,
        total_cost,
        calculated_at: new Date().toISOString()
    };

    await upsertLatestCostRow(organization_id, product_id, warehouse_id, payload);

    return {
        holding_cost,
        stockout_cost,
        spoilage_cost,
        ordering_cost,
        total_cost
    };
}

export async function runExpenseForOrganization(organization_id: string, period_days: number, options?: {
    holding_rate?: number;
    stockout_penalty?: number;
    spoilage_rate?: number;
    fixed_order_cost?: number;
    eoq?: number;
}) {
    const { data: warehouses, error: warehouseError } = await supabase
        .from('warehouses')
        .select('id')
        .eq('organization_id', organization_id);

    if (warehouseError) throw warehouseError;

    const warehouseIds = (warehouses || []).map((w: any) => w.id as string);
    if (warehouseIds.length === 0) return [];

    const { data: inventoryRows, error: inventoryError } = await supabase
        .from('inventory')
        .select('product_id, warehouse_id')
        .in('warehouse_id', warehouseIds);

    if (inventoryError) throw inventoryError;

    const uniqueMap = new Map<string, { product_id: string; warehouse_id: string }>();
    for (const row of inventoryRows || []) {
        const key = `${row.product_id}:${row.warehouse_id}`;
        if (!uniqueMap.has(key)) {
            uniqueMap.set(key, {
                product_id: row.product_id as string,
                warehouse_id: row.warehouse_id as string
            });
        }
    }
    const pairs = Array.from(uniqueMap.values());

    const results = [];
    for (const pair of pairs) {
        const result = await runExpense({
            organization_id,
            product_id: pair.product_id,
            warehouse_id: pair.warehouse_id,
            period_days,
            holding_rate: options?.holding_rate,
            stockout_penalty: options?.stockout_penalty,
            spoilage_rate: options?.spoilage_rate,
            fixed_order_cost: options?.fixed_order_cost,
            eoq: options?.eoq
        });
        results.push({
            product_id: pair.product_id,
            warehouse_id: pair.warehouse_id,
            ...result
        });
    }

    return results;
}
