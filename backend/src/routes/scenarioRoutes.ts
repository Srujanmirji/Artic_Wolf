import { Router } from 'express';
import { applyScenarioHandler } from '../controllers/scenarioController';

const router = Router();

router.post('/apply', applyScenarioHandler);

export default router;
