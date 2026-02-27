import { Router } from 'express';
import { dashboardKpisHandler } from '../controllers/dashboardController';

const router = Router();

router.get('/kpis', dashboardKpisHandler);

export default router;
