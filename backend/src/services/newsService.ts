import { supabase } from './supabaseClient';

type NewsFetchParams = {
    organization_id: string;
    region?: string;
    industry?: string;
};

type RawArticle = {
    title?: string;
    description?: string;
    content?: string;
    url?: string;
    publishedAt?: string;
    published_at?: string;
    date?: string;
    source?: { name?: string } | string;
    publisher?: string;
};

function getEnv(name: string, fallback?: string) {
    return process.env[name] || fallback;
}

function toIsoDate(value?: string) {
    if (!value) return new Date().toISOString();
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
}

function buildQueryParams(params: Record<string, string | undefined>) {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
        if (value) query.set(key, value);
    }
    return query.toString();
}

function normalizeArticles(raw: any): RawArticle[] {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    if (Array.isArray(raw.articles)) return raw.articles;
    if (Array.isArray(raw.data)) return raw.data;
    return [];
}

export async function fetchAndStoreNews(params: NewsFetchParams) {
    const { organization_id, region, industry } = params;

    const apiUrl = getEnv('NEWS_API_URL');
    const apiKey = getEnv('NEWS_API_KEY');
    if (!apiUrl || !apiKey) {
        throw new Error('News API not configured');
    }

    const keyParam = getEnv('NEWS_API_KEY_PARAM', 'apiKey')!;
    const queryParam = getEnv('NEWS_API_QUERY_PARAM', 'q')!;
    const languageParam = getEnv('NEWS_API_LANGUAGE_PARAM', 'language')!;
    const regionParam = getEnv('NEWS_API_REGION_PARAM', 'country')!;

    const query = industry || getEnv('NEWS_API_DEFAULT_QUERY', 'supply chain');
    const language = getEnv('NEWS_API_DEFAULT_LANGUAGE', 'en');

    const qs = buildQueryParams({
        [keyParam]: apiKey,
        [queryParam]: query,
        [languageParam]: language,
        [regionParam]: region
    });

    const url = apiUrl.includes('?') ? `${apiUrl}&${qs}` : `${apiUrl}?${qs}`;
    const response = await fetch(url);
    if (!response.ok) {
        const text = await response.text();
        throw new Error(`News API error: ${response.status} ${text}`);
    }

    const data = await response.json();
    const articles = normalizeArticles(data);

    const uniqueByUrl = new Map<string, RawArticle>();
    for (const article of articles) {
        const key = article.url || `${article.title || 'untitled'}-${article.publishedAt || article.published_at || ''}`;
        if (!uniqueByUrl.has(key)) uniqueByUrl.set(key, article);
    }

    const rows = Array.from(uniqueByUrl.values()).map((article) => ({
        organization_id,
        title: article.title || 'Untitled',
        description: article.description || article.content || null,
        url: article.url || null,
        source: typeof article.source === 'string' ? article.source : article.source?.name || article.publisher || null,
        published_at: toIsoDate(article.publishedAt || article.published_at || article.date),
        region: region || null,
        industry: industry || query,
        sentiment_score: null,
        raw_payload: article
    }));

    if (rows.length === 0) return [];

    const { data: inserted, error } = await supabase
        .from('news_articles')
        .insert(rows)
        .select('*');

    if (error) throw error;
    return inserted || [];
}

export async function getLatestNews(organization_id: string, region?: string, industry?: string) {
    let query = supabase
        .from('news_articles')
        .select('*')
        .eq('organization_id', organization_id)
        .order('published_at', { ascending: false })
        .limit(20);

    if (region) query = query.eq('region', region);
    if (industry) query = query.eq('industry', industry);

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
}
