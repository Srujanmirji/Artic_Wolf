import { Request, Response } from 'express';
import { applyScenario } from '../services/scenarioService';

export async function applyScenarioHandler(req: Request, res: Response) {
    try {
        const { organization_id, scenario_id } = req.body;
        if (!organization_id || !scenario_id) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const results = await applyScenario(organization_id, scenario_id);
        res.json({ count: results.length, results });
    } catch (err: any) {
        console.error('Scenario Error:', err);
        res.status(500).json({ error: err.message });
    }
}
