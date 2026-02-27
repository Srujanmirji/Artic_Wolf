import { Router } from 'express';
import { optimizeTransfersHandler } from '../controllers/transferController';

const router = Router();

router.post('/optimize', optimizeTransfersHandler);

export default router;
