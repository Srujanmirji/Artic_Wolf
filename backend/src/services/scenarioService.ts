import { supabase } from './supabaseClient';

export type ScenarioResult = {
    product_id: string;
    warehouse_id: string;
    base_forecast_demand: number;
    adjusted_forecast_demand: number;
    base_safety_stock: number;
    adjusted_safety_stock: number;
    base_reorder_point: number;
    adjusted_reorder_point: number;
};

function toNumber(value: unknown): number {
    const num = typeof value === 'number' ? value : Number(value || 0);
    return Number.isNaN(num) ? 0 : num;
}

function isUuid(value: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

type ScenarioMultipliers = {
    demand_multiplier: number;
    lead_time_multiplier: number;
};

function resolvePresetScenario(scenario_id: string): ScenarioMultipliers | null {
    const key = String(scenario_id || '').trim().toLowerCase();

    // Frontend currently sends fixed IDs 1/2/3.
    if (key === '1' || key === 'high-demand' || key === 'high_demand') {
        return { demand_multiplier: 1.2, lead_time_multiplier: 1.0 };
    }
    if (key === '2' || key === 'supplier-delay' || key === 'supplier_delay') {
        return { demand_multiplier: 1.0, lead_time_multiplier: 1.35 };
    }
    if (key === '3' || key === 'holiday-peak' || key === 'holiday_peak') {
        return { demand_multiplier: 1.3, lead_time_multiplier: 1.2 };
    }

    return null;
}

export async function applyScenario(organization_id: string, scenario_id: string): Promise<ScenarioResult[]> {
    let demand_multiplier = 1;
    let lead_time_multiplier = 1;

    let scenario: { id: string; demand_multiplier: number; lead_time_multiplier: number } | null = null;
    let scenarioError: any = null;

    if (isUuid(String(scenario_id || ''))) {
        const queryResult = await supabase
            .from('market_scenarios')
            .select('id, demand_multiplier, lead_time_multiplier')
            .eq('organization_id', organization_id)
            .eq('id', scenario_id)
            .maybeSingle();
        scenario = queryResult.data;
        scenarioError = queryResult.error;
    }

    if (scenarioError) throw scenarioError;
    if (scenario) {
        demand_multiplier = toNumber(scenario.demand_multiplier) || 1;
        lead_time_multiplier = toNumber(scenario.lead_time_multiplier) || 1;
    } else {
        const preset = resolvePresetScenario(scenario_id);
        if (!preset) {
            throw new Error('Scenario not found for organization');
        }
        demand_multiplier = preset.demand_multiplier;
        lead_time_multiplier = preset.lead_time_multiplier;
    }

    const { data: metrics, error: metricsError } = await supabase
        .from('inventory_metrics')
        .select('product_id, warehouse_id, forecast_demand, safety_stock, reorder_point')
        .eq('organization_id', organization_id);

    if (metricsError) throw metricsError;

    const results: ScenarioResult[] = [];

    for (const row of metrics || []) {
        const base_forecast_demand = toNumber(row.forecast_demand);
        const base_safety_stock = toNumber(row.safety_stock);
        const base_reorder_point = toNumber(row.reorder_point);

        const adjusted_forecast_demand = base_forecast_demand * demand_multiplier;
        const adjusted_safety_stock = base_safety_stock * demand_multiplier * Math.sqrt(Math.max(lead_time_multiplier, 0));

        const base_avg_daily_lead_time = Math.max(base_reorder_point - base_safety_stock, 0);
        const adjusted_avg_daily_lead_time = base_avg_daily_lead_time * demand_multiplier * lead_time_multiplier;
        const adjusted_reorder_point = adjusted_avg_daily_lead_time + adjusted_safety_stock;

        results.push({
            product_id: row.product_id,
            warehouse_id: row.warehouse_id,
            base_forecast_demand,
            adjusted_forecast_demand,
            base_safety_stock,
            adjusted_safety_stock,
            base_reorder_point,
            adjusted_reorder_point
        });
    }

    return results;
}
