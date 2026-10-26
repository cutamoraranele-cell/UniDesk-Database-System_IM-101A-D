import { Router } from 'express';
import { handleLookup, getAllIssues } from '../controllers/lookup.controller.js';

const router = Router();

router.get('/', handleLookup);
router.get('/issues', getAllIssues);

export default router;
