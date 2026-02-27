import { Router } from 'express';

const router = Router();

router.get('/latest', async (req, res) => {
    try {
        const { org, region, industry } = req.query;
        if (!org) return res.status(400).json({ error: 'Organization ID is required' });

        // Stub for fetching latest news using NewsAPI/GNews
        // Returning mock data for demonstration
        const mockNews = [
            {
                id: "mock-news-uuid-1",
                title: "Supply Chain Disruptions in Electronics",
                sentiment_score: -0.45,
                impact: 0.15
            },
            {
                id: "mock-news-uuid-2",
                title: "New Innovations in Battery Tech",
                sentiment_score: 0.82,
                impact: -0.10
            }
        ];

        res.json(mockNews);
    } catch (err: any) {
        console.error('News Error:', err);
        res.status(500).json({ error: err.message });
    }
});

export default router;
