import { Router } from 'express';
import { handleAIChat, testAIKey, getAIEngineStatus } from '../controllers/ai.controller.js';

const router = Router();

router.post('/chat', handleAIChat);
router.post('/test-key', testAIKey);
router.get('/status', getAIEngineStatus);

export default router;
