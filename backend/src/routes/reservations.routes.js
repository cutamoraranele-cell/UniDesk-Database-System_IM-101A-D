import { Router } from 'express';
import { 
  bookReservation, 
  getReservations, 
  updateReservation, 
  deleteReservation, 
  cancelReservation 
} from '../controllers/reservations.controller.js';

const router = Router();

router.post('/', bookReservation);
router.get('/', getReservations);
router.put('/:id', updateReservation);
router.delete('/:id', deleteReservation);
router.patch('/:id/cancel', cancelReservation);

export default router;
