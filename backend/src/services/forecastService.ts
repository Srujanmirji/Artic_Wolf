import { supabase } from './supabaseClient';
import { expSmoothing, safetyStock } from '../utils/calculations';

export type ForecastInput = {
    organization_id: string;
    product_id: string;
    warehouse_id: string;
    period_days: number;
    method?: string;
    alpha?: number;
    service_level?: number;
    lead_time_days?: number;
    seasonal_demand?: boolean;
};

export type ForecastResult = {
    forecast_demand: number;
    forecast_quantity: number;
    forecast_date: string;
    period_days: number;
    method: 'exponential_smoothing';
    sigma_d: number;
    avg_daily_demand: number;
    safety_stock: number;
    reorder_point: number;
};

async function getLatestBusinessProfile(organization_id: string) {
    const { data, error } = await supabase
        .from('business_profiles')
        .select('supplier_lead_time, seasonal_demand, created_at')
        .eq('organization_id', organization_id)
        .order('created_at', { ascending: false })
        .limit(1);

    if (error) throw error;
    return data?.[0] || null;
}

async function getLatestSupplierLeadTime(product_id: string) {
    const { data, error } = await supabase
        .from('suppliers')
        .select('avg_lead_time_days, id')
        .eq('product_id', product_id)
        .order('id', { ascending: false })
        .limit(1);

    if (error) throw error;
    return data?.[0]?.avg_lead_time_days || null;
}

async function upsertLatestInventoryMetric(
    organization_id: string,
    product_id: string,
    warehouse_id: string,
    payload: Record<string, unknown>
) {
    const { data: rows, error } = await supabase
        .from('inventory_metrics')
        .select('id, calculated_at')
        .eq('organization_id', organization_id)
        .eq('product_id', product_id)
        .eq('warehouse_id', warehouse_id)
        .order('calculated_at', { ascending: false });

    if (error) throw error;

    const latest = rows?.[0];
    const duplicateIds = (rows || []).slice(1).map((row: any) => row.id).filter(Boolean);

    if (latest?.id) {
        const { error: updateError } = await supabase
            .from('inventory_metrics')
            .update(payload)
            .eq('id', latest.id);
        if (updateError) throw updateError;
    } else {
        const { error: insertError } = await supabase
            .from('inventory_metrics')
            .insert(payload);
        if (insertError) throw insertError;
    }

    if (duplicateIds.length > 0) {
        await supabase.from('inventory_metrics').delete().in('id', duplicateIds);
    }
}

export async function runForecast(input: ForecastInput): Promise<ForecastResult> {
    const { organization_id, product_id, warehouse_id, period_days } = input;
    const method = input.method === 'exponential_smoothing' ? 'exponential_smoothing' : 'exponential_smoothing';
    const alpha = typeof input.alpha === 'number' && input.alpha > 0 && input.alpha < 1 ? input.alpha : 0.2;
    const serviceLevel = typeof input.service_level === 'number' && input.service_level > 0 && input.service_level < 1
        ? input.service_level
        : 0.95;

    const { data: salesData, error: salesError } = await supabase
        .from('sales_history')
        .select('quantity_sold')
        .eq('product_id', product_id)
        .eq('warehouse_id', warehouse_id)
        .order('date', { ascending: true });

    if (salesError) throw salesError;

    const history = (salesData || []).map((d: any) => d.quantity_sold as number);
    let forecast_demand = expSmoothing(history, alpha);

    forecast_demand = forecast_demand * period_days;

    const avg_daily_demand = history.length > 0
        ? history.reduce((a: number, b: number) => a + b, 0) / history.length
        : 0;

    const sigma_d = history.length > 0
        ? Math.sqrt(history.reduce((sq: number, n: number) => sq + Math.pow(n - avg_daily_demand, 2), 0) / history.length)
        : 0;

    let lead_time_days = typeof input.lead_time_days === 'number' && input.lead_time_days > 0
        ? input.lead_time_days
        : 0;

    if (!lead_time_days) {
        const bpData = await getLatestBusinessProfile(organization_id);

        if (bpData?.supplier_lead_time && bpData.supplier_lead_time > 0) {
            lead_time_days = bpData.supplier_lead_time;
        } else {
            const supplierLeadTime = await getLatestSupplierLeadTime(product_id);
            lead_time_days = supplierLeadTime || 7;
        }
    }

    let computed_safety_stock = safetyStock(sigma_d, lead_time_days, serviceLevel);

    if (input.seasonal_demand) {
        computed_safety_stock = Math.ceil(computed_safety_stock * 1.25);
    }

    const safety_stock = computed_safety_stock;
    const reorder_point = (avg_daily_demand * lead_time_days) + safety_stock;

    const metricsPayload = {
        organization_id,
        product_id,
        warehouse_id,
        forecast_demand,
        forecast_period_days: period_days,
        safety_stock,
        reorder_point,
        projected_stockout_risk: 0.1,
        calculated_at: new Date().toISOString()
    };

    await upsertLatestInventoryMetric(organization_id, product_id, warehouse_id, metricsPayload);

    return {
        forecast_demand,
        forecast_quantity: forecast_demand,
        forecast_date: new Date().toISOString(),
        period_days,
        method,
        sigma_d,
        avg_daily_demand,
        safety_stock,
        reorder_point
    };
}

export async function runForecastForOrganization(organization_id: string, period_days: number, options?: {
    method?: string;
    alpha?: number;
    service_level?: number;
    lead_time_days?: number;
}) {
    const businessProfile = await getLatestBusinessProfile(organization_id);

    const orgLeadTime = options?.lead_time_days || businessProfile?.supplier_lead_time || undefined;
    const orgSeasonalDemand = businessProfile?.seasonal_demand ?? false;

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
        const result = await runForecast({
            organization_id,
            product_id: pair.product_id,
            warehouse_id: pair.warehouse_id,
            period_days,
            method: options?.method,
            alpha: options?.alpha,
            service_level: options?.service_level,
            lead_time_days: orgLeadTime,
            seasonal_demand: orgSeasonalDemand
        });
        results.push(result);
    }

    return results;
}
