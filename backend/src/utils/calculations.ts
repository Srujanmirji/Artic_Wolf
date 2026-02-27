export function expSmoothing(history: number[], alpha = 0.2): number {
    if (history.length === 0) return 0;
    let s = history[0];
    for (let i = 1; i < history.length; i++) {
        s = alpha * history[i] + (1 - alpha) * s;
    }
    return s;
}

// Very simple inverse normal CDF approximation for Z scores
export function inverseNormalCDF(p: number): number {
    if (p >= 0.99) return 2.326;
    if (p >= 0.95) return 1.645;
    if (p >= 0.90) return 1.282;
    return 1.0; // Default fallback for safety stock calculation demo
}

export function safetyStock(sigma_d: number, leadTimeDays: number, serviceLevel = 0.95): number {
    const z = inverseNormalCDF(serviceLevel);
    return z * sigma_d * Math.sqrt(leadTimeDays);
}

export function computeImpact(sentiment: number, relevance: number, daysOld: number, weight = 0.2): number {
    const recency = 1 / (1 + daysOld);
    const impactScore = sentiment * relevance * recency;
    // clamp between -0.5 and 0.5
    const clampedImpact = Math.max(-0.5, Math.min(0.5, impactScore * weight));
    const multiplier = 1 + clampedImpact;
    return multiplier;
}

export function simpleSentimentScore(text: string): number {
    const positive = ['up', 'growth', 'surge', 'gain', 'record', 'strong', 'bull', 'boost', 'improve', 'profit', 'expansion', 'recovery', 'stabilize'];
    const negative = ['down', 'drop', 'fall', 'loss', 'weak', 'bear', 'cut', 'strike', 'shortage', 'delay', 'disruption', 'decline', 'risk', 'crisis'];
    const tokens = text.toLowerCase().split(/[^a-z]+/).filter(Boolean);
    if (tokens.length === 0) return 0;
    let score = 0;
    for (const token of tokens) {
        if (positive.includes(token)) score += 1;
        if (negative.includes(token)) score -= 1;
    }
    const normalized = score / Math.max(tokens.length, 1);
    return Math.max(-1, Math.min(1, normalized));
}
