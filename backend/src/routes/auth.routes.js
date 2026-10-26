import { Router } from 'express';
import { 
  register, 
  login, 
  getDemoAccounts, 
  getMe, 
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword
} from '../controllers/auth.controller.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/demo-accounts', getDemoAccounts);
router.get('/me', getMe);
router.put('/profile', updateProfile);
router.post('/change-password', changePassword);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

export default router;
