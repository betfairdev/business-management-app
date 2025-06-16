import { Router } from 'express';
import { QueryController } from '../controllers/QueryController';
import { validateQuery, validateSafeQuery } from '../middleware/validation';
import { queryRateLimit, executeRateLimit } from '../middleware/security';

const router = Router();
const queryController = new QueryController();

// Health check
router.get('/health', queryController.healthCheck);

// Get database schema
router.get('/schema', queryController.getSchema);

// Execute safe queries (SELECT only) with validation
router.post('/query/safe', 
  queryRateLimit,
  validateQuery,
  validateSafeQuery,
  queryController.executeSafeQuery
);

// Execute any SQL query (full permissions)
router.post('/query/execute',
  executeRateLimit,
  validateQuery,
  queryController.executeQuery
);

// Execute transaction
router.post('/query/transaction',
  executeRateLimit,
  queryController.executeTransaction
);

export default router;