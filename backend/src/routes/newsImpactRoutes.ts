import { Router } from 'express';
import { newsImpactHandler } from '../controllers/newsImpactController';

const router = Router();

router.post('/compute', newsImpactHandler);

export default router;
