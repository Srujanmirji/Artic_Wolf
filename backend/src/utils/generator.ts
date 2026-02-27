import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function generateData() {
    const orgId = process.argv[2] || uuidv4();
    console.log(`Generating data for org: ${orgId}`);

    // Create organization
    const { data: org, error: orgErr } = await supabase.from('organizations').insert({ id: orgId, name: 'Aagam Demo Corp' }).select().single();
    if (orgErr) {
        if (orgErr.code !== '23505') { // Ignore unique violation if org exists
            console.error("Org Error:", orgErr);
            return;
        }
    }

    // Create warehouse
    const whId = uuidv4();
    await supabase.from('warehouses').insert({
        id: whId,
        organization_id: orgId,
        name: 'Main Hub',
        location: 'Mumbai',
        capacity: 10000
    });

    // Create products
    const products = [];
    for (let i = 0; i < 30; i++) {
        const prodId = uuidv4();
        products.push({
            id: prodId,
            organization_id: orgId,
            sku: `SKU-${Math.floor(Math.random() * 10000)}`,
            name: `Demo Product ${i}`,
            category: i % 2 === 0 ? 'Electronics' : 'Apparel',
            cost_price: Math.floor(Math.random() * 100) + 10,
            selling_price: Math.floor(Math.random() * 100) + 150,
            shelf_life_days: 365
        });
    }
    await supabase.from('products').insert(products);

    // Generate sales history (90 days)
    const salesHistory = [];
    for (const product of products) {
        let currentStock = Math.floor(Math.random() * 500) + 100;
        await supabase.from('inventory').insert({
            warehouse_id: whId,
            product_id: product.id,
            current_stock: currentStock
        });

        // Supplier metrics
        await supabase.from('suppliers').insert({
            product_id: product.id,
            name: `Supplier for ${product.name}`,
            avg_lead_time_days: Math.floor(Math.random() * 14) + 3,
            lead_time_variance: 2.5
        });

        for (let day = 0; day < 90; day++) {
            const date = new Date();
            date.setDate(date.getDate() - (90 - day));

            // Base demand + noise
            const base = product.category === 'Electronics' ? 15 : 25;
            const noise = Math.floor(Math.random() * 10) - 5;
            const qty = Math.max(0, base + noise);

            salesHistory.push({
                warehouse_id: whId,
                product_id: product.id,
                date: date.toISOString().split('T')[0],
                quantity_sold: qty
            });
        }
    }

    // Batch insert sales history
    const chunkSize = 500;
    for (let i = 0; i < salesHistory.length; i += chunkSize) {
        const chunk = salesHistory.slice(i, i + chunkSize);
        await supabase.from('sales_history').insert(chunk);
    }

    console.log('✅ Synthetic Data Generated Successfully!');
    console.log(`Demo Org ID: ${orgId}`);
}

generateData().catch(console.error);
