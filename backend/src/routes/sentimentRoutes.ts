import { Router } from 'express';
import { analyzeSentimentHandler } from '../controllers/sentimentController';

const router = Router();

router.post('/analyze', analyzeSentimentHandler);

export default router;
