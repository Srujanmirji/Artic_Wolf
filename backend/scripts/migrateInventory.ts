import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from backend directory
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
    console.log('Running migration...');

    // Create inventory_items table using RPC or raw SQL via the service role
    // Note: Since Supabase JS client doesn't have a direct "execute raw DDL snippet"
    // we either use a migration file or we can just send it via the SQL editor.
    // For automation, we'll try evaluating it as a query if pgcrypto/setup allows, 
    // but standard practice is running this in the Supabase SQL editor.

    const sql = `
    CREATE TABLE IF NOT EXISTS public.inventory_items (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      org_id UUID,
      product_id VARCHAR(255) UNIQUE NOT NULL,
      name VARCHAR(255) NOT NULL,
      category VARCHAR(100) NOT NULL,
      stock INTEGER DEFAULT 0,
      price NUMERIC(10, 2) DEFAULT 0.00,
      status VARCHAR(50) DEFAULT 'In Stock',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
    
    -- Add trigger to automatically update the updated_at column
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
       NEW.updated_at = NOW();
       RETURN NEW;
    END;
    $$ language 'plpgsql';

    DROP TRIGGER IF EXISTS trigger_updated_at on public.inventory_items;
    
    CREATE TRIGGER trigger_updated_at
    BEFORE UPDATE ON public.inventory_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
  `;

    // We actually need to guide the user to run this in their Supabase dashboard 
    // OR we can create a REST endpoint in their backend that executes it if their 
    // postgres user has schema modification permissions via the REST API (rare).

    console.log("==========================================");
    console.log("PLEASE RUN THE FOLLOWING SQL IN YOUR SUPABASE 'SQL EDITOR':\n");
    console.log(sql);
    console.log("==========================================");
}

runMigration();
