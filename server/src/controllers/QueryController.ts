import { Request, Response } from 'express';
import { QueryService } from '../services/QueryService';

export class QueryController {
  private queryService: QueryService;

  constructor() {
    this.queryService = new QueryService();
  }

  // Execute any SQL query (with full permissions)
  executeQuery = async (req: Request, res: Response): Promise<void> => {
    try {
      const { query, params = [] } = req.body;

      const result = await this.queryService.executeQuery(query, params);

      res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  };

  // Execute safe queries (SELECT only)
  executeSafeQuery = async (req: Request, res: Response): Promise<void> => {
    try {
      const { query, params = [] } = req.body;

      // Only allow SELECT queries for safety
      if (typeof query !== 'string' || !/^(\s*SELECT\s)/i.test(query.trim())) {
        res.status(400).json({
          success: false,
          error: 'Only SELECT queries are allowed on this endpoint'
        });
        return;
      }

      const result = await this.queryService.executeQuery(query, params);

      res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  };

  // Execute multiple queries in a transaction
  executeTransaction = async (req: Request, res: Response): Promise<void> => {
    try {
      const { queries } = req.body;

      if (!Array.isArray(queries) || queries.length === 0) {
        res.status(400).json({
          success: false,
          error: 'Queries array is required and must not be empty'
        });
        return;
      }

      const result = await this.queryService.executeTransaction(queries);

      res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  };

  // Get database schema information
  getSchema = async (req: Request, res: Response): Promise<void> => {
    try {
      const { table } = req.query;

      const result = await this.queryService.getTableInfo(table as string);

      res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  };

  // Health check endpoint
  healthCheck = async (req: Request, res: Response): Promise<void> => {
    try {
      const result = await this.queryService.executeQuery('SELECT 1 as health_check');

      res.json({
        success: true,
        status: 'healthy',
        database: result.success ? 'connected' : 'disconnected',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        status: 'unhealthy',
        error: 'Database connection failed'
      });
    }
  };
}
