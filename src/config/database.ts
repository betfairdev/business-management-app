// src/config/database.ts

import { Capacitor } from '@capacitor/core';
import { CapacitorSQLite, SQLiteConnection } from '@capacitor-community/sqlite';
import { DataSource, type DataSourceOptions } from 'typeorm';

// ——— Your Entities ———
import { User } from '../entities/User';
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
import { LeaveRequest } from '../entities/LeaveRequest';
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

export const ENTITIES = [
  User,
  Account,
  Attendance,
  Badge,
  Batch,
  Brand,
  Category,
  Customer,
  Department,
  Employee,
  Expense,
  ExpenseType,
  Income,
  IncomeType,
  JournalEntry,
  LeaveRequest,
  Note,
  PaymentMethod,
  Permission,
  Position,
  Product,
  Purchase,
  PurchaseProduct,
  PurchaseReturn,
  PurchaseReturnProduct,
  Role,
  Sale,
  SaleProduct,
  SaleReturn,
  SaleReturnProduct,
  Setting,
  Stock,
  StockAdjustment,
  StockTransfer,
  Store,
  SubCategory,
  Supplier,
  TaxGroup,
  TaxRate,
];

const DATABASE_NAME = 'app.db';

let sqliteConnection: SQLiteConnection | null = null;
export let AppDataSource: DataSource | null = null;

/**
 * Build DataSourceOptions for web via TypeORM `sqljs` driver.
 * - Explicitly import and initialize sql.js so that initSqlJs and .Database exist :contentReference[oaicite:3]{index=3}.
 * - Set window.SQLITE_WASM_PATH so sql.js can fetch the WASM from the correct location :contentReference[oaicite:4]{index=4}.
 * - autoSave persists changes to IndexedDB.
 * - synchronize: true for development; use migrations in production.
 */
async function buildWebDataSourceOptions(): Promise<DataSourceOptions> {
  // Ensure window properties exist
  interface WindowWithSqlJs extends Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    initSqlJs?: any;
    SQLITE_WASM_PATH?: string;
  }
  const win = window as WindowWithSqlJs;

  // Ensure the WASM file is served at this path (copy sql-wasm.wasm into public/)
  win.SQLITE_WASM_PATH = '/sql-wasm.wasm';

  // Load initSqlJs if not already set
  let initSqlJs = win.initSqlJs;
  if (!initSqlJs) {
    try {
      const initModule = await import('sql.js');
      initSqlJs = initModule.default || initModule;
      win.initSqlJs = initSqlJs;
      console.log('✅ sql.js initSqlJs loaded in buildWebDataSourceOptions');
    } catch (err) {
      console.error('❌ Failed to import sql.js in buildWebDataSourceOptions:', err);
      throw err;
    }
  }

  // Initialize the SQL.js module, providing locateFile so it finds the WASM
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let SQL: any;
  try {
    SQL = await initSqlJs({
      locateFile: (_file: string) => {
        // file is e.g. 'sql-wasm.wasm'; return the served path
        return win.SQLITE_WASM_PATH || '/sql-wasm.wasm';
      },
    });
    console.log('✅ sql.js module initialized in buildWebDataSourceOptions');
  } catch (err) {
    console.error('❌ Failed to initialize sql.js module:', err);
    throw err;
  }

  return {
    type: 'sqljs',
    // Pass the initialized module so TypeORM finds SQL.Database
    driver: SQL,
    autoSave: true,
    // 'location' acts as the key name in IndexedDB for the database :contentReference[oaicite:5]{index=5}
    location: DATABASE_NAME,
    entities: ENTITIES,
    synchronize: true,
    logging: ['error', 'warn', 'info'],
  };
}

/**
 * Build DataSourceOptions for native via Capacitor SQLite plugin.
 * Follows capacitor-community/sqlite TypeORM usage guide :contentReference[oaicite:6]{index=6}.
 */
async function buildNativeDataSourceOptions(): Promise<DataSourceOptions> {
  if (!sqliteConnection) {
    sqliteConnection = new SQLiteConnection(CapacitorSQLite);
    console.log('✅ SQLiteConnection instance created for native');
  }
  return {
    type: 'capacitor',
    database: DATABASE_NAME,
    driver: sqliteConnection!,
    entities: ENTITIES,
    synchronize: true,
    logging: ['error', 'warn', 'info'],
  };
}

/**
 * Initialize and return the DataSource, choosing driver by platform.
 * - On web: uses sql.js (TypeORM sqljs driver) :contentReference[oaicite:7]{index=7}.
 * - On iOS/Android: uses Capacitor SQLite plugin :contentReference[oaicite:8]{index=8}.
 */
export async function initializeDatabase(): Promise<DataSource> {
  if (AppDataSource && AppDataSource.isInitialized) {
    return AppDataSource;
  }

  const platform = Capacitor.getPlatform(); // 'web', 'android', 'ios', etc.
  console.log('📡 Detected platform:', platform);

  let options: DataSourceOptions;
  if (platform === 'web') {
    try {
      options = await buildWebDataSourceOptions();
    } catch (err) {
      console.error('❌ Failed to build web DataSourceOptions:', err);
      throw err;
    }
  } else {
    try {
      options = await buildNativeDataSourceOptions();
    } catch (err) {
      console.error('❌ Failed to build native DataSourceOptions:', err);
      throw err;
    }
  }

  AppDataSource = new DataSource(options);

  if (platform !== 'web' && sqliteConnection) {
    try {
      // Official plugin guide: create/open native SQLite before TypeORM init :contentReference[oaicite:9]{index=9}.
      await sqliteConnection.createConnection(
        DATABASE_NAME,
        false,             // encrypted? false for plain
        'no-encryption',   // encryption mode
        1,                 // version; bump on schema changes
        false              // readonly?
      );
      console.log('✅ Native SQLite connection created/opened');
    } catch (err) {
      // If connection exists, plugin may throw; handle or ignore.
      console.warn('⚠️ Could not create Capacitor SQLite connection (might exist already):', err);
    }
  }

  try {
    await AppDataSource.initialize();
    console.log('✅ TypeORM DataSource initialized with driver:', options.type);
    return AppDataSource;
  } catch (err) {
    console.error('❌ Failed to initialize TypeORM DataSource:', err);
    throw err;
  }
}

/**
 * Get the initialized DataSource; throws if not yet initialized.
 */
export function getDataSource(): DataSource {
  if (!AppDataSource || !AppDataSource.isInitialized) {
    throw new Error('DataSource not initialized; call initializeDatabase() first.');
  }
  return AppDataSource;
}
