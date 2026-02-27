import { Router } from 'express';

const router = Router();

// Frontend logs in natively with Supabase JS.
// The backend might need routes for custom auth flows or proxying.
// For now, these are just placeholders.
router.get('/session', async (req, res) => {
    res.json({ status: 'ok' });
});

export default router;
