// src/seeds/seed.ts
import 'reflect-metadata';
import { DataSource } from 'typeorm';
import bcrypt from 'bcryptjs';

// Adjust these imports according to your project setup:
import { AppDataSource } from '../config/database'; // or however you initialize TypeORM DataSource
import { entitiesMap } from '../config/entities';   // import the entitiesMap: Record<string, { entity, createDto, updateDto, searchableFields? }>
import { Permission } from '../entities/Permission';
import { Role } from '../entities/Role';
import { User } from '../entities/User';
import { PaymentMethod } from '../entities/PaymentMethod';
import { Category } from '../entities/Category';
import { Brand } from '../entities/Brand';
import { TaxRate } from '../entities/TaxRate';
import { TaxGroup } from '../entities/TaxGroup';
import { Supplier, SupplierType } from '../entities/Supplier';
import { Store, StoreType } from '../entities/Store';
import { Employee } from '../entities/Employee';
import { Department } from '../entities/Department';
// import other reference entities as desired

export async function runSeeds(dataSource: DataSource) {
  const em = dataSource.manager;

  // Declare adminRole in the outer scope so it's accessible in both try-catch blocks
  let adminRole: Role | undefined;

  // 1. PERMISSIONS
  try {
    // Generate CRUD permissions for each entity key in entitiesMap
    const permissionRepo = em.getRepository(Permission);
    const existingPermissions = await permissionRepo.find();
    const existingSet = new Set(existingPermissions.map(p => `${p.module}:${p.action}`));

    const crudActions = ['create', 'read', 'update', 'delete'];
    const toInsertPermissions: Permission[] = [];

    for (const entityKey of Object.keys(entitiesMap)) {
      // Use PascalCase or as-is for module name?
      // For clarity, use entityKey in PascalCase. If your entity classes differ, adjust.
      const moduleName = entityKey.charAt(0).toUpperCase() + entityKey.slice(1);
      for (const action of crudActions) {
        const key = `${moduleName}:${action}`;
        if (!existingSet.has(key)) {
          const perm = permissionRepo.create({
            module: moduleName,
            action,
            isAllowed: true,
          });
          toInsertPermissions.push(perm);
        }
      }
    }
    if (toInsertPermissions.length > 0) {
      console.log(`Seeding ${toInsertPermissions.length} permissions...`);
      await permissionRepo.save(toInsertPermissions);
    } else {
      console.log('No new permissions to seed.');
    }

    // Reload all permissions
    const allPermissions = await permissionRepo.find();
    // 2. ROLE: Admin
    const roleRepo = em.getRepository(Role);
    adminRole = (await roleRepo.findOne({ where: { name: 'Admin' }, relations: ['permissions'] })) ?? undefined;
    if (!adminRole) {
      adminRole = roleRepo.create({
        name: 'Admin',
        description: 'Administrator with full access',
        permissions: allPermissions,
        isSystemRole: true, // Add this if your Role entity requires it
      });
      await roleRepo.save(adminRole);
      console.log('Admin role created.');
    } else {
      // ensure it has all permissions
      const missing = allPermissions.filter(p => !adminRole!.permissions.some(rp => rp.id === p.id));
      if (missing.length > 0) {
        adminRole.permissions = [...adminRole.permissions, ...missing];
        await roleRepo.save(adminRole);
        console.log(`Added ${missing.length} missing permissions to Admin role.`);
      } else {
        console.log('Admin role already has all permissions.');
      }
    }
  } catch (err) {
    console.error('Error seeding permissions or roles:', err);
  }

  // 3. DEFAULT ADMIN USER
  try {
    const userRepo = em.getRepository(User);
    const defaultAdminEmail = 'admin@example.com';
    let adminUser = await userRepo.findOne({ where: { email: defaultAdminEmail } });
    if (!adminUser) {
      // Use environment variable for password if available
      const passwordPlain = 'password123';
      const hashed = await bcrypt.hash(passwordPlain, 10);
      adminUser = userRepo.create({
        email: defaultAdminEmail,
        password: hashed,
        firstName: 'System',
        lastName: 'Administrator',
        role: adminRole,
      });
      await userRepo.save(adminUser);
      console.log(`Created default admin user (${defaultAdminEmail}) with password '${passwordPlain}'.`);
    } else {
      console.log('Default admin user already exists.');
      // Optionally ensure role:
      if ((adminUser as any).role?.id !== adminRole?.id) {
        adminUser.role = adminRole;
        await userRepo.save(adminUser);
        console.log('Assigned Admin role to existing admin user.');
      }
    }
  } catch (err) {
    console.error('Error seeding admin user:', err);
  }

  // 4. PAYMENT METHODS
  try {
    const paymentMethods = ['Cash', 'Credit Card', 'Bank Transfer', 'Cheque', 'Mobile Payment'];
    const pmRepo = em.getRepository(PaymentMethod);
    for (const name of paymentMethods) {
      const exists = await pmRepo.findOne({ where: { name } });
      if (!exists) {
        const pm = pmRepo.create({ name, description: `${name} payment method` } as any);
        await pmRepo.save(pm);
        console.log(`Seeded PaymentMethod: ${name}`);
      }
    }
  } catch (err) {
    console.error('Error seeding payment methods:', err);
  }

  // 5. TAX GROUP & RATES
  try {
    const taxGroupRepo = em.getRepository(TaxGroup);
    const taxRateRepo = em.getRepository(TaxRate);
    // Example: a standard tax group
    let standardGroup = await taxGroupRepo.findOne({ where: { name: 'Standard' } });
    if (!standardGroup) {
      standardGroup = taxGroupRepo.create({ name: 'Standard', description: 'Standard tax rates' });
      standardGroup = await taxGroupRepo.save(standardGroup);
      console.log('Seeded TaxGroup: Standard');
    }
    // Example tax rates; adjust percentages as needed
    const rates = [
      { name: 'VAT 5%', rate: 5 },
      { name: 'VAT 10%', rate: 10 },
      { name: 'VAT 15%', rate: 15 },
    ];
    for (const { name, rate } of rates) {
      const exists = await taxRateRepo.findOne({ where: { name } });
      if (!exists) {
        const tr = taxRateRepo.create({
          name,
          rate,
          group: standardGroup,
          description: `${name} under Standard group`,
        } as any);
        await taxRateRepo.save(tr);
        console.log(`Seeded TaxRate: ${name}`);
      }
    }
  } catch (err) {
    console.error('Error seeding tax groups/rates:', err);
  }

  // 6. SAMPLE CATEGORIES & BRANDS
  try {
    const categoryRepo = em.getRepository(Category);
    const brandRepo = em.getRepository(Brand);
    const defaultCategories = ['Miscellaneous', 'General'];
    for (const name of defaultCategories) {
      const exists = await categoryRepo.findOne({ where: { name } });
      if (!exists) {
        const cat = categoryRepo.create({ name, description: `${name} category` } as any);
        await categoryRepo.save(cat);
        console.log(`Seeded Category: ${name}`);
      }
    }
    const defaultBrands = ['Generic', 'Unbranded'];
    for (const name of defaultBrands) {
      const exists = await brandRepo.findOne({ where: { name } });
      if (!exists) {
        const br = brandRepo.create({ name, description: `${name} brand` } as any);
        await brandRepo.save(br);
        console.log(`Seeded Brand: ${name}`);
      }
    }
  } catch (err) {
    console.error('Error seeding categories/brands:', err);
  }

  // 7. SAMPLE SUPPLIER, STORE, DEPARTMENT, EMPLOYEE
  try {
    // Adjust fields if your entities require more
    const supplierRepo = em.getRepository(Supplier);
    const storeRepo = em.getRepository(Store);
    const deptRepo = em.getRepository(Department);
    const employeeRepo = em.getRepository(Employee);

    let defaultSupplier = await supplierRepo.findOne({ where: { name: 'Default Supplier' } });
    if (!defaultSupplier) {
      // Import SupplierType enum/type from your entities if not already imported
      // import { SupplierType } from '../entities/Supplier';
      defaultSupplier = supplierRepo.create({
        name: 'Default Supplier',
        supplierType: SupplierType.Wholesaler,
        email: '',
        address: '',
        phone: ''
        // Add only properties that exist on Supplier entity
      });
      await supplierRepo.save(defaultSupplier);
      console.log('Seeded Supplier: Default Supplier');
    }

    let defaultStore = await storeRepo.findOne({ where: { name: 'Main Store' } });
    if (!defaultStore) {
      defaultStore = storeRepo.create({
        name: 'Main Store',
        address: '',
        phone: '',
        whatsapp: '',
        type: StoreType.RETAIL,
        stocks: [],
        stockAdjustments: [],
        outgoingTransfers: [],
        incomingTransfers: [],
        purchases: [],
        sales: [],
        employees: [],
        createdBy: 1, // Assuming 1 is the ID of the admin user
        updatedBy: 1,
      });
      if (defaultStore) {
        await storeRepo.save(defaultStore);
        console.log('Seeded Store: Main Store');
      }
    }

    let defaultDept = await deptRepo.findOne({ where: { name: 'General' } });
    if (!defaultDept) {
      defaultDept = deptRepo.create({ name: 'General', description: 'General department' });
      await deptRepo.save(defaultDept);
      console.log('Seeded Department: General');
    }

    // Sample employee linked to default user? If Employee entity relates to User, adjust accordingly.
    const defaultAdminEmail = 'admin@example.com';
    let defaultEmployee = await employeeRepo.findOne({ where: { email: defaultAdminEmail } });
    if (!defaultEmployee) {
      defaultEmployee = employeeRepo.create({
        name: 'System',
        email: defaultAdminEmail,
        department: defaultDept,
        // Add all required fields for Employee entity here, e.g.:
        // name: 'System Admin',
        // attendances: [],
        // leaveRequests: [],
        // ...other required fields
      });
      await employeeRepo.save(defaultEmployee);
      console.log('Seeded Employee: System Admin');
    }
  } catch (err) {
    console.error('Error seeding supplier/store/department/employee:', err);
  }

  console.log('Seeding complete.');
}

async function bootstrap() {
  try {
    const ds = await AppDataSource.initialize();
    console.log('DataSource initialized for seeding.');
    await runSeeds(ds);
    await ds.destroy();
    console.log('DataSource closed. Seed script finished.');
  } catch (err) {
    console.error('Error running seed script:', err);
    process.exit(1);
  }
}

bootstrap();
