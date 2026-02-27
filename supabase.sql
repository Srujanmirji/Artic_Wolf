CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- organizations
CREATE TABLE organizations (
id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
name TEXT NOT NULL,
created_at TIMESTAMPTZ DEFAULT now()
);

-- users uses supabase auth, link to organizations via profile table
CREATE TABLE profiles (
id UUID PRIMARY KEY REFERENCES auth.users(id),
organization_id UUID REFERENCES organizations(id),
full_name TEXT,
role TEXT,
created_at TIMESTAMPTZ DEFAULT now()
);

-- warehouses
CREATE TABLE warehouses (
id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
organization_id UUID REFERENCES organizations(id),
name TEXT NOT NULL,
location TEXT,
capacity INT,
created_at TIMESTAMPTZ DEFAULT now()
);

-- products
CREATE TABLE products (
id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
organization_id UUID REFERENCES organizations(id),
sku TEXT NOT NULL,
name TEXT,
category TEXT,
cost_price NUMERIC,
selling_price NUMERIC,
shelf_life_days INT,
created_at TIMESTAMPTZ DEFAULT now()
);

-- inventory
CREATE TABLE inventory (
id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
warehouse_id UUID REFERENCES warehouses(id),
product_id UUID REFERENCES products(id),
current_stock INT DEFAULT 0,
reserved_stock INT DEFAULT 0,
expiry_date DATE,
last_updated TIMESTAMPTZ DEFAULT now()
);

-- sales_history
CREATE TABLE sales_history (
id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
warehouse_id UUID REFERENCES warehouses(id),
product_id UUID REFERENCES products(id),
date DATE NOT NULL,
quantity_sold INT NOT NULL
);

-- suppliers
CREATE TABLE suppliers (
id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
product_id UUID REFERENCES products(id),
name TEXT,
avg_lead_time_days INT,
lead_time_variance NUMERIC
);

-- market_scenarios
CREATE TABLE market_scenarios (
id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
organization_id UUID REFERENCES organizations(id),
name TEXT,
demand_multiplier NUMERIC DEFAULT 1.0,
lead_time_multiplier NUMERIC DEFAULT 1.0,
created_at TIMESTAMPTZ DEFAULT now()
);

-- inventory_metrics
CREATE TABLE inventory_metrics (
id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
organization_id UUID REFERENCES organizations(id),
product_id UUID REFERENCES products(id),
warehouse_id UUID REFERENCES warehouses(id),
forecast_demand NUMERIC,
forecast_period_days INT,
safety_stock NUMERIC,
reorder_point NUMERIC,
projected_stockout_risk NUMERIC,
calculated_at TIMESTAMPTZ DEFAULT now()
);

-- inventory_cost_analysis
CREATE TABLE inventory_cost_analysis (
id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
organization_id UUID REFERENCES organizations(id),
product_id UUID REFERENCES products(id),
warehouse_id UUID REFERENCES warehouses(id),
holding_cost NUMERIC,
stockout_cost NUMERIC,
spoilage_cost NUMERIC,
ordering_cost NUMERIC,
total_cost NUMERIC,
calculated_at TIMESTAMPTZ DEFAULT now()
);

-- recommendations
CREATE TABLE recommendations (
id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
organization_id UUID REFERENCES organizations(id),
product_id UUID REFERENCES products(id),
from_warehouse UUID,
to_warehouse UUID,
action_type TEXT, -- "increase", "decrease", "transfer"
quantity INT,
expected_cost_saving NUMERIC,
confidence NUMERIC,
created_at TIMESTAMPTZ DEFAULT now()
);

-- news articles
CREATE TABLE news_articles (
id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
organization_id UUID REFERENCES organizations(id),
title TEXT,
description TEXT,
url TEXT,
source TEXT,
published_at TIMESTAMPTZ,
region TEXT,
industry TEXT,
sentiment_score NUMERIC,
raw_payload JSONB,
created_at TIMESTAMPTZ DEFAULT now()
);

-- news impact
CREATE TABLE news_impact_analysis (
id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
organization_id UUID REFERENCES organizations(id),
product_id UUID REFERENCES products(id),
industry TEXT,
impact_score NUMERIC,
recommended_action TEXT,
confidence_score NUMERIC,
analyzed_at TIMESTAMPTZ DEFAULT now()
);

-- enable RLS
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_cost_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE news_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE news_impact_analysis ENABLE ROW LEVEL SECURITY;

-- policy: profiles can access rows for their organization
CREATE POLICY "org_isolation" ON warehouses
USING (organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "org_isolation" ON organizations
USING (id = (SELECT organization_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "org_isolation" ON products
USING (organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid()));

-- For inventory, it references warehouse, which refers to organization
CREATE POLICY "org_isolation" ON inventory
USING (warehouse_id IN (SELECT id FROM warehouses WHERE organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid())));

CREATE POLICY "org_isolation" ON sales_history
USING (warehouse_id IN (SELECT id FROM warehouses WHERE organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid())));

CREATE POLICY "org_isolation" ON suppliers
USING (product_id IN (SELECT id FROM products WHERE organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid())));

CREATE POLICY "org_isolation" ON market_scenarios
USING (organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "org_isolation" ON inventory_metrics
USING (organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "org_isolation" ON inventory_cost_analysis
USING (organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "org_isolation" ON recommendations
USING (organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "org_isolation" ON news_articles
USING (organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "org_isolation" ON news_impact_analysis
USING (organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid()));
