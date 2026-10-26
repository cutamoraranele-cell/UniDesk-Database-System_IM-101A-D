import { Router } from 'express';
import { processPayment, getTransactions } from '../controllers/transactions.controller.js';

const router = Router();

router.post('/pay', processPayment);
router.get('/', getTransactions);

export default router;
