import { Router } from 'express';
import { getAllOffices, getOfficeDetails } from '../controllers/offices.controller.js';

const router = Router();

router.get('/', getAllOffices);
router.get('/:id', getOfficeDetails);

export default router;
