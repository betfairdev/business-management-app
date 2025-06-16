import { DataSource, DataSourceOptions } from 'typeorm';
import { CapacitorSQLite } from '@capacitor-community/sqlite';
import { Capacitor } from '@capacitor/core';

// ——— Your Entities ———
import { Account } from '../entities/Account';
import { Attendance } from '../entities/Attendance';
import { Badge } from '../entities/Badge';
import { Batch } from '../entities/Batch';
import { Brand } from '../entities/Brand';
import { Category } from '../entities/Category';
import { Customer } from '../entities/Customer';
import { Department } from '../entities/Department';
import { Employee } from '../entities/Employee';
import { Expense } from '../entities/Expense';
import { ExpenseType } from '../entities/ExpenseType';
import { Income } from '../entities/Income';
import { IncomeType } from '../entities/IncomeType';
import { JournalEntry } from '../entities/JournalEntry';
import { LeaveRequest, LeaveStatus } from '../entities/LeaveRequest';
import { Note } from '../entities/Note';
import { PaymentMethod } from '../entities/PaymentMethod';
import { Permission } from '../entities/Permission';
import { Position } from '../entities/Position';
import { Product } from '../entities/Product';
import { Purchase } from '../entities/Purchase';
import { PurchaseProduct } from '../entities/PurchaseProduct';
import { PurchaseReturn } from '../entities/PurchaseReturn';
import { PurchaseReturnProduct } from '../entities/PurchaseReturnProduct';
import { Role } from '../entities/Role';
import { Sale } from '../entities/Sale';
import { SaleProduct } from '../entities/SaleProduct';
import { SaleReturn } from '../entities/SaleReturn';
import { SaleReturnProduct } from '../entities/SaleReturnProduct';
import { Setting } from '../entities/Setting';
import { Stock } from '../entities/Stock';
import { StockAdjustment } from '../entities/StockAdjustment';
import { StockTransfer } from '../entities/StockTransfer';
import { Store } from '../entities/Store';
import { SubCategory } from '../entities/SubCategory';
import { Supplier } from '../entities/Supplier';
import { TaxGroup } from '../entities/TaxGroup';
import { TaxRate } from '../entities/TaxRate';
import { User } from "../entities/User";

const ENTITIES = [User, Account, Attendance, Badge, Batch, Brand, Category, Customer,
  Department, Employee, Expense, ExpenseType, Income, IncomeType,
  JournalEntry, LeaveRequest, Note, PaymentMethod, Permission, Position,
  Product, Purchase, PurchaseProduct, PurchaseReturn, PurchaseReturnProduct,
  Role, Sale, SaleProduct, SaleReturn, SaleReturnProduct, Setting, Stock,
  StockAdjustment, StockTransfer, Store, SubCategory, Supplier, TaxGroup,
  TaxRate,];

export interface DatabaseConfig {
  type: 'remote' | 'sqlite';
  remoteUrl?: string;
  sqliteConfig?: {
    database: string;
    version?: number;
    encrypted?: boolean;
    mode?: string;
  };
  entities?: any[];
  synchronize?: boolean;
  logging?: boolean;
}

export class DatabaseManager {
  private static instance: DatabaseManager;
  private dataSource: DataSource | null = null;
  private config: DatabaseConfig;
  private sqlite: any;

  private constructor(config: DatabaseConfig) {
    this.config = config;
  }

  static getInstance(config?: DatabaseConfig): DatabaseManager {
    if (!DatabaseManager.instance && config) {
      DatabaseManager.instance = new DatabaseManager(config);
    }
    return DatabaseManager.instance;
  }

  async initialize(): Promise<void> {
    try {
      if (this.config.type === 'sqlite') {
        await this.initializeSQLite();
      } else {
        await this.initializeRemote();
      }
      console.log('✅ Database initialized successfully');
    } catch (error) {
      console.error('❌ Database initialization failed:', error);
      throw error;
    }
  }

  private async initializeSQLite(): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      // Web platform - use SQL.js or IndexedDB
      console.log('🌐 Using web SQLite implementation');
    }

    const sqliteConfig = this.config.sqliteConfig || {
      database: 'app.db',
      version: 1,
      encrypted: false,
      mode: 'no-encryption'
    };

    this.sqlite = CapacitorSQLite;

    // Create connection
    const ret = await this.sqlite.createConnection(
      sqliteConfig.database,
      sqliteConfig.encrypted || false,
      sqliteConfig.mode || 'no-encryption',
      sqliteConfig.version || 1,
      false
    );

    if (ret.result) {
      // Open database
      await this.sqlite.open(sqliteConfig.database, false);
      console.log('✅ SQLite database opened');
    }
  }

  private async initializeRemote(): Promise<void> {
    // This would connect to your Express server
    console.log('🌐 Remote database connection configured');
    console.log('Server URL:', this.config.remoteUrl);
  }

  async executeQuery(query: string, params: any[] = []): Promise<any> {
    if (this.config.type === 'sqlite') {
      return await this.executeSQLiteQuery(query, params);
    } else {
      return await this.executeRemoteQuery(query, params);
    }
  }

  private async executeSQLiteQuery(query: string, params: any[] = []): Promise<any> {
    try {
      const result = await this.sqlite.query(
        this.config.sqliteConfig?.database || 'app.db',
        query,
        params
      );
      return result.values || [];
    } catch (error) {
      console.error('SQLite query error:', error);
      throw error;
    }
  }

  private async executeRemoteQuery(query: string, params: any[] = []): Promise<any> {
    try {
      const response = await fetch(`${this.config.remoteUrl}/api/query/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query, params })
      });

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    } catch (error) {
      console.error('Remote query error:', error);
      throw error;
    }
  }

  async createTable(tableName: string, columns: Record<string, string>): Promise<void> {
    const columnDefs = Object.entries(columns)
      .map(([name, type]) => `${name} ${type}`)
      .join(', ');

    const query = `CREATE TABLE IF NOT EXISTS ${tableName} (${columnDefs})`;
    await this.executeQuery(query);
  }

  async insert(tableName: string, data: Record<string, any>): Promise<any> {
    const columns = Object.keys(data).join(', ');
    const placeholders = Object.keys(data).map(() => '?').join(', ');
    const values = Object.values(data);

    const query = `INSERT INTO ${tableName} (${columns}) VALUES (${placeholders})`;
    return await this.executeQuery(query, values);
  }

  async select(tableName: string, where?: Record<string, any>, limit?: number): Promise<any[]> {
    let query = `SELECT * FROM ${tableName}`;
    let params: any[] = [];

    if (where) {
      const conditions = Object.keys(where).map(key => `${key} = ?`).join(' AND ');
      query += ` WHERE ${conditions}`;
      params = Object.values(where);
    }

    if (limit) {
      query += ` LIMIT ${limit}`;
    }

    return await this.executeQuery(query, params);
  }

  async update(tableName: string, data: Record<string, any>, where: Record<string, any>): Promise<any> {
    const setClause = Object.keys(data).map(key => `${key} = ?`).join(', ');
    const whereClause = Object.keys(where).map(key => `${key} = ?`).join(' AND ');

    const query = `UPDATE ${tableName} SET ${setClause} WHERE ${whereClause}`;
    const params = [...Object.values(data), ...Object.values(where)];

    return await this.executeQuery(query, params);
  }

  async delete(tableName: string, where: Record<string, any>): Promise<any> {
    const whereClause = Object.keys(where).map(key => `${key} = ?`).join(' AND ');
    const query = `DELETE FROM ${tableName} WHERE ${whereClause}`;
    const params = Object.values(where);

    return await this.executeQuery(query, params);
  }

  async close(): Promise<void> {
    if (this.config.type === 'sqlite' && this.sqlite) {
      await this.sqlite.close(this.config.sqliteConfig?.database || 'app.db');
    }
  }
}
