import { Router } from 'express';
import { fetchNewsHandler, getLatestNewsHandler } from '../controllers/newsController';

const router = Router();

router.get('/latest', getLatestNewsHandler);
router.post('/fetch', fetchNewsHandler);

export default router;
