import { Router } from 'express';
import { submitOnboarding, checkOnboarding } from '../controllers/onboardingController';

const router = Router();

// POST /api/onboarding/submit – Save business profile after onboarding wizard
router.post('/submit', submitOnboarding);

// GET /api/onboarding/check?user_id=xxx – Check if user has completed onboarding
router.get('/check', checkOnboarding);

export default router;
