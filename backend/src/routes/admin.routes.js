import { Router } from 'express';
import { 
  getAuditLogs, 
  getAnalytics, 
  getSecurityDiagnostics, 
  testConnection, 
  updateOffice,
  createOffice,
  triggerMigration
} from '../controllers/admin.controller.js';

const router = Router();

router.get('/audit-logs', getAuditLogs);
router.get('/analytics', getAnalytics);
router.get('/security-diagnostics', getSecurityDiagnostics);
router.post('/test-connection', testConnection);
router.post('/offices', createOffice);
router.put('/offices/:id', updateOffice);
router.all('/migrate', triggerMigration);

export default router;
