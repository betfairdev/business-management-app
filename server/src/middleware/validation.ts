import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';

const querySchema = Joi.object({
  query: Joi.string().required().min(1).max(10000),
  params: Joi.array().items(Joi.any()).optional(),
});

export const validateQuery = (req: Request, res: Response, next: NextFunction) => {
  const { error } = querySchema.validate(req.body);
  
  if (error) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: error.details.map(detail => detail.message)
    });
  }
  
  next();
};

export const validateSafeQuery = (req: Request, res: Response, next: NextFunction) => {
  const { query } = req.body;
  
  // Basic SQL injection protection - block dangerous keywords
  const dangerousKeywords = [
    'DROP', 'DELETE', 'TRUNCATE', 'ALTER', 'CREATE', 'INSERT', 'UPDATE',
    'EXEC', 'EXECUTE', 'UNION', 'SCRIPT', '--', '/*', '*/', ';'
  ];
  
  const upperQuery = query.toUpperCase();
  const hasDangerousKeyword = dangerousKeywords.some(keyword => 
    upperQuery.includes(keyword)
  );
  
  if (hasDangerousKeyword && req.path === '/api/query/safe') {
    return res.status(403).json({
      success: false,
      error: 'Query contains potentially dangerous operations. Use /api/query/execute for write operations.'
    });
  }
  
  next();
};