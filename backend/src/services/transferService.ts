import { supabase } from './supabaseClient';

export type TransferRecommendation = {
    product_id: string;
    from_warehouse: string;
    to_warehouse: string;
    quantity: number;
};

function toNumber(value: unknown): number {
    const num = typeof value === 'number' ? value : Number(value || 0);
    return Number.isNaN(num) ? 0 : num;
}

type StockPoint = {
    warehouse_id: string;
    current_stock: number;
    reorder_point: number;
    safety_stock: number;
};

export async function optimizeTransfers(organization_id: string): Promise<TransferRecommendation[]> {
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

    const { data: metricRows, error: metricError } = await supabase
        .from('inventory_metrics')
        .select('product_id, warehouse_id, reorder_point, safety_stock')
        .eq('organization_id', organization_id)
        .in('warehouse_id', warehouseIds);

    if (metricError) throw metricError;

    const metricMap = new Map<string, { reorder_point: number; safety_stock: number }>();
    for (const row of metricRows || []) {
        metricMap.set(`${row.product_id}:${row.warehouse_id}`, {
            reorder_point: toNumber(row.reorder_point),
            safety_stock: toNumber(row.safety_stock)
        });
    }

    const productMap = new Map<string, StockPoint[]>();
    for (const row of inventoryRows || []) {
        const key = `${row.product_id}:${row.warehouse_id}`;
        const metric = metricMap.get(key);
        if (!metric) continue;
        const point: StockPoint = {
            warehouse_id: row.warehouse_id as string,
            current_stock: toNumber(row.current_stock),
            reorder_point: metric.reorder_point,
            safety_stock: metric.safety_stock
        };
        const list = productMap.get(row.product_id as string) || [];
        list.push(point);
        productMap.set(row.product_id as string, list);
    }

    const transfers: TransferRecommendation[] = [];

    for (const [product_id, points] of productMap.entries()) {
        const deficits = points
            .map((p) => ({
                warehouse_id: p.warehouse_id,
                need: Math.max(p.reorder_point - p.current_stock, 0)
            }))
            .filter((d) => d.need > 0);

        const surpluses = points
            .map((p) => ({
                warehouse_id: p.warehouse_id,
                excess: Math.max(p.current_stock - (p.reorder_point + p.safety_stock), 0)
            }))
            .filter((s) => s.excess > 0);

        if (deficits.length === 0 || surpluses.length === 0) continue;

        for (const deficit of deficits) {
            let remaining = deficit.need;
            for (const surplus of surpluses) {
                if (remaining <= 0) break;
                if (surplus.excess <= 0) continue;
                const qty = Math.min(remaining, surplus.excess);
                if (qty <= 0) continue;
                transfers.push({
                    product_id,
                    from_warehouse: surplus.warehouse_id,
                    to_warehouse: deficit.warehouse_id,
                    quantity: Math.ceil(qty)
                });
                remaining -= qty;
                surplus.excess -= qty;
            }
        }
    }

    if (transfers.length > 0) {
        const rows = transfers.map((t) => ({
            organization_id,
            product_id: t.product_id,
            from_warehouse: t.from_warehouse,
            to_warehouse: t.to_warehouse,
            action_type: 'transfer',
            quantity: t.quantity,
            expected_cost_saving: null,
            confidence: null
        }));

        const { error: insertError } = await supabase
            .from('recommendations')
            .insert(rows);

        if (insertError) throw insertError;
    }

    return transfers;
}
