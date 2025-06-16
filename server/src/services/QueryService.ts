import { AppDataSource } from '../config/database';
import { QueryRunner } from 'typeorm';

export interface QueryResult {
  success: boolean;
  data?: any[];
  affectedRows?: number;
  insertId?: number;
  error?: string;
  executionTime?: number;
}

export class QueryService {
  private queryRunner: QueryRunner;

  constructor() {
    this.queryRunner = AppDataSource.createQueryRunner();
  }

  async executeQuery(query: string, params: any[] = []): Promise<QueryResult> {
    const startTime = Date.now();
    
    try {
      await this.queryRunner.connect();
      
      // Determine query type
      const queryType = this.getQueryType(query);
      
      let result: any;
      
      switch (queryType) {
        case 'SELECT':
          result = await this.queryRunner.query(query, params);
          return {
            success: true,
            data: result,
            executionTime: Date.now() - startTime
          };
          
        case 'INSERT':
        case 'UPDATE':
        case 'DELETE':
          result = await this.queryRunner.query(query, params);
          return {
            success: true,
            affectedRows: result.affectedRows || result.changes || 0,
            insertId: result.insertId || result.lastID,
            executionTime: Date.now() - startTime
          };
          
        case 'CREATE':
        case 'DROP':
        case 'ALTER':
          await this.queryRunner.query(query, params);
          return {
            success: true,
            executionTime: Date.now() - startTime
          };
          
        default:
          result = await this.queryRunner.query(query, params);
          return {
            success: true,
            data: Array.isArray(result) ? result : [result],
            executionTime: Date.now() - startTime
          };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        executionTime: Date.now() - startTime
      };
    } finally {
      await this.queryRunner.release();
    }
  }

  async executeTransaction(queries: Array<{ query: string; params?: any[] }>): Promise<QueryResult> {
    const startTime = Date.now();
    
    try {
      await this.queryRunner.connect();
      await this.queryRunner.startTransaction();
      
      const results: any[] = [];
      
      for (const { query, params = [] } of queries) {
        const result = await this.queryRunner.query(query, params);
        results.push(result);
      }
      
      await this.queryRunner.commitTransaction();
      
      return {
        success: true,
        data: results,
        executionTime: Date.now() - startTime
      };
    } catch (error) {
      await this.queryRunner.rollbackTransaction();
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Transaction failed',
        executionTime: Date.now() - startTime
      };
    } finally {
      await this.queryRunner.release();
    }
  }

  private getQueryType(query: string): string {
    const trimmedQuery = query.trim().toUpperCase();
    
    if (trimmedQuery.startsWith('SELECT')) return 'SELECT';
    if (trimmedQuery.startsWith('INSERT')) return 'INSERT';
    if (trimmedQuery.startsWith('UPDATE')) return 'UPDATE';
    if (trimmedQuery.startsWith('DELETE')) return 'DELETE';
    if (trimmedQuery.startsWith('CREATE')) return 'CREATE';
    if (trimmedQuery.startsWith('DROP')) return 'DROP';
    if (trimmedQuery.startsWith('ALTER')) return 'ALTER';
    
    return 'OTHER';
  }

  async getTableInfo(tableName?: string): Promise<QueryResult> {
    try {
      let query: string;
      
      if (tableName) {
        query = `PRAGMA table_info(${tableName})`;
      } else {
        query = "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'";
      }
      
      const result = await this.executeQuery(query);
      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get table info'
      };
    }
  }
}