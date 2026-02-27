import { Router } from 'express';

const router = Router();

router.post('/apply', async (req, res) => {
    try {
        const { organization_id, scenario_id } = req.body;
        if (!organization_id || !scenario_id) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        res.json({ status: 'ok', affected_products: 45 });
    } catch (err: any) {
        console.error('Scenario Error:', err);
        res.status(500).json({ error: err.message });
    }
});

export default router;
