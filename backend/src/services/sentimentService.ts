import { supabase } from './supabaseClient';
import { simpleSentimentScore } from '../utils/calculations';

export async function analyzeLatestNewsSentiment(organization_id: string) {
    const { data: articles, error } = await supabase
        .from('news_articles')
        .select('id, title, description, sentiment_score')
        .eq('organization_id', organization_id)
        .order('published_at', { ascending: false })
        .limit(50);

    if (error) throw error;

    const updates = [];
    for (const article of articles || []) {
        if (article.sentiment_score !== null && article.sentiment_score !== undefined) continue;
        const text = `${article.title || ''} ${article.description || ''}`.trim();
        const score = simpleSentimentScore(text);
        updates.push({ id: article.id, sentiment_score: score });
    }

    if (updates.length === 0) return [];

    const { data: updated, error: updateError } = await supabase
        .from('news_articles')
        .upsert(updates, { onConflict: 'id' })
        .select('*');

    if (updateError) throw updateError;
    return updated || [];
}
