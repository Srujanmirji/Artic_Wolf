import { Router } from 'express';
import { syncHandler } from '../controllers/syncController';

const router = Router();

router.post('/', syncHandler);

export default router;
