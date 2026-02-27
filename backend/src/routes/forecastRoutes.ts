import { Router } from 'express';
import { runForecastHandler, runForecastAllHandler } from '../controllers/forecastController';

const router = Router();

router.post('/run', runForecastHandler);
router.post('/run-all', runForecastAllHandler);

export default router;
