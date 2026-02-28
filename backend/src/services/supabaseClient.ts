import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        persistSession: false
    },
    global: {
        fetch: (url, options) => {
            return fetch(url, {
                ...options,
                // @ts-ignore - signal is supported in modern node fetch
                signal: AbortSignal.timeout(30000)
            });
        }
    }
});
