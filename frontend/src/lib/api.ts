import { syncManager } from './offlineSync';

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
  // Prefer the dynamically assigned org ID from onboarding
  if (typeof window !== 'undefined') {
    const dynamicOrgId = localStorage.getItem('aagam_org_id');
    if (dynamicOrgId) return dynamicOrgId;
  }
  return process.env.NEXT_PUBLIC_ORG_ID || "";
}

function buildUrl(path: string) {
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${getApiBaseUrl()}${path.startsWith("/") ? "" : "/"}${path}`;
}

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = buildUrl(path);
  const headers = new Headers(options.headers);
  if (options.body && (!headers.has("Content-Type") || typeof options.body !== "string")) {
    headers.set("Content-Type", "application/json");
  }

  // Handle Offline State gracefully with Background Queueing
  if (typeof window !== 'undefined' && !navigator.onLine) {
    const method = (options.method || 'GET').toUpperCase();

    // Only queue mutating requests
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      await syncManager.enqueueRequest(url, method, options.headers || {}, options.body ? JSON.parse(options.body as string) : null);
      console.warn(`[Offline Queue] ${method} request to ${url} saved for later sync.`);
      throw new Error('You are offline. Your changes have been saved locally and will sync when you reconnect.');
    }
    throw new Error('No internet connection. Please check your network and try again.');
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

export type SalesHistoryItem = {
  id: string;
  date: string;
  quantity_sold: number;
  product_id: string;
  products?: {
    name: string;
    category: string;
    selling_price: number;
  };
};

export function getSalesHistory(orgId: string) {
  return apiFetch<SalesHistoryItem[]>(`/api/sales/history?org=${encodeURIComponent(orgId)}`);
}

export function recordSale(payload: { organization_id: string, product_id: string, quantity_sold: number }) {
  return apiFetch<{ success: boolean; message: string; new_stock: number }>('/api/sales/record', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export type RecentActivityItem = {
  id: string;
  name: string;
  type: string;
  amount: string | null;
  category: string;
  created_at: string;
};

export function getRecentActivity(orgId: string) {
  return apiFetch<RecentActivityItem[]>(`/api/dashboard/recent-activity?org=${encodeURIComponent(orgId)}`);
}

export function getInventoryList(orgId: string) {
  return apiFetch<InventoryItem[]>(`/api/inventory/list?org=${encodeURIComponent(orgId)}`);
}

export function addInventoryItem(orgId: string, payload: { name: string, category: string, price: number, stock: number }) {
  return apiFetch<any>('/api/inventory/items', {
    method: 'POST',
    body: JSON.stringify({ organization_id: orgId, ...payload }),
  });
}

export function updateInventoryItem(orgId: string, productId: string, payload: { name: string, category: string, price: number, stock: number }) {
  return apiFetch<any>(`/api/inventory/items/${encodeURIComponent(productId)}`, {
    method: 'PUT',
    body: JSON.stringify({ organization_id: orgId, ...payload }),
  });
}

export function deleteInventoryItem(orgId: string, productId: string) {
  return apiFetch<any>(`/api/inventory/items/${encodeURIComponent(productId)}?organization_id=${encodeURIComponent(orgId)}`, {
    method: 'DELETE'
  });
}

export function getLatestNews(orgId: string, region?: string, industry?: string) {
  const params = new URLSearchParams({ org: orgId });
  if (region) params.set("region", region);
  if (industry) params.set("industry", industry);
  return apiFetch<NewsItem[]>(`/api/news/latest?${params.toString()}`);
}

export function fetchMarketIntelligence(orgId: string, region?: string, industry?: string) {
  return apiFetch<any>('/api/news/fetch', {
    method: 'POST',
    body: JSON.stringify({ organization_id: orgId, region, industry }),
  });
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

export function applyScenario(orgId: string, scenarioId: string) {
  return apiFetch<{ count: number; results: ScenarioResult[] }>('/api/scenarios/apply', {
    method: 'POST',
    body: JSON.stringify({
      organization_id: orgId,
      scenario_id: scenarioId,
    }),
  });
}

export type TransferRecommendation = {
  product_id: string;
  from_warehouse: string;
  to_warehouse: string;
  quantity: number;
};

export function optimizeTransfers(orgId: string) {
  return apiFetch<{ count: number; results: TransferRecommendation[] }>('/api/transfers/optimize', {
    method: 'POST',
    body: JSON.stringify({
      organization_id: orgId,
    }),
  });
}

// ─── Onboarding ───────────────────────────────────────────────────────────────

export type OnboardingCheckResponse = {
  isOnboarded: boolean;
  organization_id: string | null;
};

export type OnboardingPayload = {
  user_id: string;
  business_name: string;
  business_type: string;
  location_count: number;
  region: string;
  product_types: string;
  inventory_category: string;
  monthly_volume: string;
  seasonal_demand: boolean;
  supplier_lead_time: number;
};

export function checkOnboardingStatus(userId: string) {
  return apiFetch<OnboardingCheckResponse>(`/api/onboarding/check?user_id=${encodeURIComponent(userId)}`);
}

export function submitOnboarding(payload: OnboardingPayload) {
  return apiFetch<{ message: string; organization_id: string }>('/api/onboarding/submit', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

