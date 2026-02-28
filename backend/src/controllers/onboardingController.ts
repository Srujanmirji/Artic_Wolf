import { Request, Response } from 'express';
import { supabase } from '../services/supabaseClient';
import crypto from 'crypto';

// Convert a non-UUID string (e.g. Google sub "101623712834179778069") to a valid UUID format
function toUUID(input: string): string {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(input)) return input; // Already a UUID
    const hash = crypto.createHash('md5').update(input).digest('hex');
    return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-4${hash.slice(13, 16)}-a${hash.slice(17, 20)}-${hash.slice(20, 32)}`;
}

export async function submitOnboarding(req: Request, res: Response) {
    try {
        const {
            user_id,
            business_name,
            business_type,
            location_count,
            region,
            product_types,
            inventory_category,
            monthly_volume,
            seasonal_demand,
            supplier_lead_time
        } = req.body;

        if (!user_id || !business_name) {
            return res.status(400).json({ error: 'user_id and business_name are required.' });
        }

        const safeUserId = toUUID(user_id);

        // 1. Create a new Organization linked to the business name
        const { data: org, error: orgError } = await supabase
            .from('organizations')
            .insert({ name: business_name })
            .select()
            .single();

        if (orgError) throw orgError;

        const organization_id = org.id;

        // 2. Insert Business Profile (try with user_id, fallback without for Google-auth users)
        let profileError = null;
        const profilePayload: any = {
            organization_id,
            user_id: safeUserId,
            business_name,
            business_type: business_type || null,
            location_count: location_count || 1,
            region: region || null,
            product_types: product_types || null,
            inventory_category: inventory_category || null,
            monthly_volume: monthly_volume || null,
            seasonal_demand: seasonal_demand ?? false,
            supplier_lead_time: supplier_lead_time ?? 14,
        };

        const { error: firstTryError } = await supabase
            .from('business_profiles')
            .insert(profilePayload);

        if (firstTryError) {
            // If FK constraint fails (Google user not in auth.users), retry without user_id
            if (firstTryError.message.includes('foreign key') || firstTryError.code === '23503') {
                const { user_id: _removed, ...payloadWithoutUser } = profilePayload;
                const { error: retryError } = await supabase
                    .from('business_profiles')
                    .insert(payloadWithoutUser);
                if (retryError) throw retryError;
            } else {
                throw firstTryError;
            }
        }

        // 3. Link user profile to the new organization (non-fatal for Google users)
        const { error: linkError } = await supabase
            .from('profiles')
            .upsert({
                id: safeUserId,
                organization_id,
                full_name: business_name,
                role: 'owner'
            }, { onConflict: 'id' });

        if (linkError) {
            console.warn('Profile link warning (non-fatal):', linkError.message);
        }

        // 4. Auto-create a default warehouse for the org so inventory can be used immediately
        const { error: warehouseError } = await supabase
            .from('warehouses')
            .insert({
                organization_id,
                name: `${business_name} - Main Warehouse`,
                location: region || 'India',
            });

        if (warehouseError) {
            console.warn('Default warehouse creation warning (non-fatal):', warehouseError.message);
        }

        res.json({
            message: 'Onboarding complete',
            organization_id,
        });
    } catch (err: any) {
        console.error('Onboarding Error:', err);
        res.status(500).json({ error: err.message });
    }
}

export async function checkOnboarding(req: Request, res: Response) {
    try {
        const userId = req.query.user_id as string;
        if (!userId) {
            return res.status(400).json({ error: 'user_id query parameter is required.' });
        }

        const safeUserId = toUUID(userId);

        const { data, error } = await supabase
            .from('business_profiles')
            .select('id, organization_id')
            .eq('user_id', safeUserId)
            .maybeSingle();

        if (error) throw error;

        res.json({
            isOnboarded: !!data,
            organization_id: data?.organization_id || null,
        });
    } catch (err: any) {
        console.error('Check Onboarding Error:', err);
        res.status(500).json({ error: err.message });
    }
}

