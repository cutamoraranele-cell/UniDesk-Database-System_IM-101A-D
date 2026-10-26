import { Router } from 'express';
import { getAllFacilities, getFacilityCategories, getCampusBuildings } from '../controllers/facilities.controller.js';

const router = Router();

router.get('/', getAllFacilities);
router.get('/categories', getFacilityCategories);
router.get('/buildings', getCampusBuildings);

export default router;
