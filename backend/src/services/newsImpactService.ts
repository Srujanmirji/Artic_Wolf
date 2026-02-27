import { supabase } from './supabaseClient';
import { computeImpact } from '../utils/calculations';

export type NewsImpactResult = {
    news_id: string;
    impact_multiplier: number;
    sentiment_score: number;
    days_old: number;
};

function toNumber(value: unknown): number {
    const num = typeof value === 'number' ? value : Number(value || 0);
    return Number.isNaN(num) ? 0 : num;
}

function daysBetween(date: Date, now: Date) {
    const diff = now.getTime() - date.getTime();
    return Math.max(0, Math.floor(diff / (24 * 60 * 60 * 1000)));
}

export async function computeNewsImpact(organization_id: string) {
    const { data: articles, error } = await supabase
        .from('news_articles')
        .select('id, sentiment_score, published_at')
        .eq('organization_id', organization_id)
        .order('published_at', { ascending: false })
        .limit(50);

    if (error) throw error;

    const now = new Date();
    const results: NewsImpactResult[] = [];

    for (const article of articles || []) {
        const sentiment_score = toNumber(article.sentiment_score);
        const published_at = article.published_at ? new Date(article.published_at) : now;
        const days_old = daysBetween(published_at, now);
        const impact_multiplier = computeImpact(sentiment_score, 1, days_old);
        results.push({
            news_id: article.id,
            impact_multiplier,
            sentiment_score,
            days_old
        });
    }

    return results;
}
