const DEFAULT_BASE_URL = "http://localhost:5000";

export type DashboardKpis = {
  total_products_tracked: number;
  stockout_risk_high: number;
  avg_safety_stock_pct: number;
  total_inventory_value: number;
  projected_stockouts: number;
  holding_cost: number;
  cost_savings: number;
};

export type InventoryItem = {
  id: string;
  product_id: string;
  name: string;
  category: string;
  stock: number;
  status: "In Stock" | "Low Stock" | "Out of Stock";
  price: number;
};

export type NewsItem = {
  id: string;
  title: string;
  description?: string | null;
  url?: string | null;
  source?: string | null;
  published_at?: string | null;
  region?: string | null;
  industry?: string | null;
  sentiment_score?: number | null;
};

export type RecommendationItem = {
  id: string;
  product_id: string;
  action_type: string;
  quantity: number;
  expected_cost_saving?: number | null;
  confidence?: number | null;
  created_at?: string | null;
  from_warehouse?: string | null;
  to_warehouse?: string | null;
  product?: {
    id: string;
    sku?: string | null;
    name?: string | null;
    category?: string | null;
  } | null;
  from_warehouse_name?: string | null;
  to_warehouse_name?: string | null;
};

export function getApiBaseUrl() {
  const env = process.env.NEXT_PUBLIC_API_BASE_URL;
  const base = env && env.trim().length > 0 ? env.trim() : DEFAULT_BASE_URL;
  return base.replace(/\/$/, "");
}

export function getDefaultOrgId() {
  return process.env.NEXT_PUBLIC_ORG_ID || "";
}

function buildUrl(path: string) {
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${getApiBaseUrl()}${path.startsWith("/") ? "" : "/"}${path}`;
}

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = buildUrl(path);
  const headers = new Headers(options.headers);
  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(url, {
    ...options,
    headers
  });

  if (!response.ok) {
    let message = response.statusText;
    try {
      const data = await response.json();
      message = data?.error || data?.message || message;
    } catch {
      // ignore parse errors
    }
    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

export function getDashboardKpis(orgId: string) {
  return apiFetch<DashboardKpis>(`/api/dashboard/kpis?org=${encodeURIComponent(orgId)}`);
}

export function getInventoryList(orgId: string) {
  return apiFetch<InventoryItem[]>(`/api/inventory/list?org=${encodeURIComponent(orgId)}`);
}

export function getLatestNews(orgId: string, region?: string, industry?: string) {
  const params = new URLSearchParams({ org: orgId });
  if (region) params.set("region", region);
  if (industry) params.set("industry", industry);
  return apiFetch<NewsItem[]>(`/api/news/latest?${params.toString()}`);
}

export function getRecommendations(orgId: string) {
  return apiFetch<RecommendationItem[]>(`/api/recommendations?org=${encodeURIComponent(orgId)}`);
}

export function generateRecommendations(orgId: string) {
  return apiFetch<any>('/api/recommendations/run-all', {
    method: 'POST',
    body: JSON.stringify({ organization_id: orgId }),
  });
}

export type ForecastResponse = {
  count: number;
  results: Array<{
    organization_id: string;
    product_id: string;
    warehouse_id: string;
    forecast_date: string;
    forecast_quantity: number;
    method: string;
    confidence_interval_low?: number;
    confidence_interval_high?: number;
    reorder_point?: number;
    safety_stock?: number;
  }>;
};

export function runForecastAnalytics(orgId: string) {
  return apiFetch<ForecastResponse>('/api/forecast/run-all', {
    method: 'POST',
    body: JSON.stringify({
      organization_id: orgId,
      period_days: 180, // Predict 6 months out
    }),
  });
}
