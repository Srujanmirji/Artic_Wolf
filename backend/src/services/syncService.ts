import { supabase } from './supabaseClient';

type SyncOperation = {
    op_id: string;
    type: string;
    payload?: any;
    created_at?: string;
};

type SyncResult = {
    op_id: string;
    status: 'ok' | 'error';
    error?: string;
    server_ts?: string;
};

function isNonEmptyString(value: unknown): value is string {
    return typeof value === 'string' && value.trim().length > 0;
}

function validateSalesUploadPayload(payload: any) {
    if (!payload || !payload.warehouse_id || !Array.isArray(payload.rows)) {
        return 'Invalid sales_upload payload';
    }
    return null;
}

function resolveSalesConflict(row: any) {
    const serverQty = typeof row?.quantity_sold === 'number' ? row.quantity_sold : Number(row?.quantity_sold || 0);
    const clientQty = typeof row?.incoming_quantity_sold === 'number' ? row.incoming_quantity_sold : Number(row?.incoming_quantity_sold || 0);
    const serverDate = row?.server_date ? new Date(row.server_date) : null;
    const clientDate = row?.client_date ? new Date(row.client_date) : null;

    if (!clientDate || Number.isNaN(clientDate.getTime())) {
        return { strategy: 'server_wins', resolved_quantity_sold: serverQty };
    }

    if (!serverDate || Number.isNaN(serverDate.getTime())) {
        return { strategy: 'client_wins', resolved_quantity_sold: clientQty };
    }

    if (clientDate > serverDate) {
        return { strategy: 'client_wins', resolved_quantity_sold: clientQty };
    }

    return { strategy: 'server_wins', resolved_quantity_sold: serverQty };
}

export async function processSyncOperations(organization_id: string, operations: SyncOperation[]) {
    const results: SyncResult[] = [];

    for (const op of operations) {
        if (!op || !isNonEmptyString(op.op_id) || !isNonEmptyString(op.type)) {
            results.push({ op_id: op?.op_id || 'unknown', status: 'error', error: 'Invalid operation format' });
            continue;
        }

        if (op.type === 'sales_upload') {
            const validationError = validateSalesUploadPayload(op.payload);
            if (validationError) {
                results.push({ op_id: op.op_id, status: 'error', error: validationError });
                continue;
            }

            const warehouse_id = op.payload.warehouse_id;
            const rows = op.payload.rows || [];
            let hadError = false;
            let resolvedConflicts = 0;

            for (const r of rows) {
                const { data: existing, error: selectError } = await supabase
                    .from('sales_history')
                    .select('id, quantity_sold, date')
                    .eq('warehouse_id', warehouse_id)
                    .eq('product_id', r.product_id)
                    .eq('date', r.date)
                    .maybeSingle();

                if (selectError) {
                    hadError = true;
                    continue;
                }

                if (existing?.id) {
                    const resolved = resolveSalesConflict({
                        quantity_sold: existing.quantity_sold,
                        incoming_quantity_sold: r.quantity_sold,
                        server_date: existing.date,
                        client_date: op.created_at
                    });
                    resolvedConflicts += 1;

                    const { error: updateError } = await supabase
                        .from('sales_history')
                        .update({ quantity_sold: resolved.resolved_quantity_sold })
                        .eq('id', existing.id);

                    if (updateError) {
                        hadError = true;
                    }
                } else {
                    const { error: insertError } = await supabase
                        .from('sales_history')
                        .insert({
                            warehouse_id,
                            product_id: r.product_id,
                            date: r.date,
                            quantity_sold: r.quantity_sold
                        });

                    if (insertError) {
                        hadError = true;
                    }
                }
            }

            if (hadError) {
                results.push({
                    op_id: op.op_id,
                    status: 'error',
                    error: `Failed processing ${op.op_id}`
                });
            } else {
                results.push({
                    op_id: op.op_id,
                    status: 'ok',
                    server_ts: new Date().toISOString()
                });
            }
            continue;
        }

        results.push({ op_id: op.op_id, status: 'error', error: 'Unhandled operation type' });
    }

    return {
        organization_id,
        results
    };
}
