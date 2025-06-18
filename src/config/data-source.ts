// data-source.ts
import "reflect-metadata";
import { DataSource } from "typeorm";
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
import { Permission } from '../entities/Permission.ts';
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

export const AppDataSource = new DataSource({
  type: "sqlite",
  database: "dummy.db",
  entities: ENTITIES,
  logging: false,
});
