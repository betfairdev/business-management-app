import { DataSource } from 'typeorm';
import { User } from '../entities/User';
import { Customer } from '../entities/Customer';
import { Supplier } from '../entities/Supplier';
import { Product } from '../entities/Product';
import { Brand } from '../entities/Brand';
import { Category } from '../entities/Category';
import { Stock } from '../entities/Stock';
import { Sale } from '../entities/Sale';
import { Purchase } from '../entities/Purchase';
import { SaleProduct } from '../entities/SaleProduct';
import { PurchaseProduct } from '../entities/PurchaseProduct';
import { Store } from '../entities/Store';
import { Employee } from '../entities/Employee';
import { Department } from '../entities/Department';
import { PaymentMethod } from '../entities/PaymentMethod';
import { TaxRate } from '../entities/TaxRate';
import * as bcrypt from 'bcryptjs';

export async function seedDummyData(dataSource: DataSource) {
  const em = dataSource.manager;

  console.log('🌱 Starting dummy data seeding...');

  try {
    // Create additional brands
    const brandRepo = em.getRepository(Brand);
    const brands = await brandRepo.save([
      { name: 'Apple', description: 'Premium technology products' },
      { name: 'Samsung', description: 'Electronics and appliances' },
      { name: 'Nike', description: 'Sports and lifestyle brand' },
      { name: 'Adidas', description: 'Athletic wear and equipment' },
      { name: 'Sony', description: 'Consumer electronics' },
    ]);

    // Create additional categories
    const categoryRepo = em.getRepository(Category);
    const categories = await categoryRepo.save([
      { name: 'Electronics', description: 'Electronic devices and gadgets' },
      { name: 'Clothing', description: 'Apparel and fashion items' },
      { name: 'Sports', description: 'Sports equipment and gear' },
      { name: 'Books', description: 'Books and educational materials' },
      { name: 'Home & Garden', description: 'Home improvement and garden supplies' },
    ]);

    // Create stores
    const storeRepo = em.getRepository(Store);
    const stores = await storeRepo.save([
      { name: 'Main Store', address: '123 Main St, City', phone: '+1234567890', type: 'store' },
      { name: 'Warehouse A', address: '456 Industrial Ave', phone: '+1234567891', type: 'warehouse' },
      { name: 'Downtown Branch', address: '789 Downtown Blvd', phone: '+1234567892', type: 'store' },
    ]);

    // Create departments
    const deptRepo = em.getRepository(Department);
    const departments = await deptRepo.save([
      { name: 'Sales', description: 'Sales and customer service' },
      { name: 'Inventory', description: 'Inventory management' },
      { name: 'Administration', description: 'Administrative tasks' },
    ]);

    // Create employees
    const employeeRepo = em.getRepository(Employee);
    const employees = await employeeRepo.save([
      { 
        name: 'John Smith', 
        email: 'john@business.com', 
        phone: '+1234567893',
        department: departments[0],
        store: stores[0],
        salary: 50000,
        hireDate: '2023-01-15'
      },
      { 
        name: 'Sarah Johnson', 
        email: 'sarah@business.com', 
        phone: '+1234567894',
        department: departments[1],
        store: stores[0],
        salary: 45000,
        hireDate: '2023-03-20'
      },
      { 
        name: 'Mike Wilson', 
        email: 'mike@business.com', 
        phone: '+1234567895',
        department: departments[2],
        store: stores[1],
        salary: 55000,
        hireDate: '2022-11-10'
      },
    ]);

    // Create customers
    const customerRepo = em.getRepository(Customer);
    const customers = await customerRepo.save([
      {
        name: 'Alice Brown',
        email: 'alice@email.com',
        phone: '+1234567896',
        address: '123 Customer St, City',
        customerType: 'Retailer',
        status: 'Active'
      },
      {
        name: 'Bob Davis',
        email: 'bob@email.com',
        phone: '+1234567897',
        address: '456 Client Ave, Town',
        customerType: 'Wholesaler',
        status: 'Active'
      },
      {
        name: 'Carol White',
        email: 'carol@email.com',
        phone: '+1234567898',
        address: '789 Buyer Blvd, Village',
        customerType: 'Dealer',
        status: 'Active'
      },
      {
        name: 'David Green',
        email: 'david@email.com',
        phone: '+1234567899',
        address: '321 Shopper St, City',
        customerType: 'Retailer',
        status: 'Active'
      },
      {
        name: 'Eva Martinez',
        email: 'eva@email.com',
        phone: '+1234567800',
        address: '654 Purchase Pl, Town',
        customerType: 'Retailer',
        status: 'Active'
      },
    ]);

    // Create suppliers
    const supplierRepo = em.getRepository(Supplier);
    const suppliers = await supplierRepo.save([
      {
        name: 'Tech Distributors Inc',
        email: 'sales@techdist.com',
        phone: '+1234567801',
        address: '100 Tech Park, Silicon Valley',
        supplierType: 'Distributor',
        status: 'Active'
      },
      {
        name: 'Fashion Wholesale Co',
        email: 'orders@fashionwholesale.com',
        phone: '+1234567802',
        address: '200 Fashion District, NY',
        supplierType: 'Wholesaler',
        status: 'Active'
      },
      {
        name: 'Sports Equipment Ltd',
        email: 'supply@sportsequip.com',
        phone: '+1234567803',
        address: '300 Sports Complex, Chicago',
        supplierType: 'Manufacturer',
        status: 'Active'
      },
    ]);

    // Create products
    const productRepo = em.getRepository(Product);
    const products = await productRepo.save([
      {
        name: 'iPhone 15 Pro',
        sku: 'IPH15PRO',
        barcode: '123456789012',
        description: 'Latest iPhone with advanced features',
        brand: brands[0], // Apple
        category: categories[0], // Electronics
        purchasePrice: 800,
        mrpPrice: 1200,
        wholesalePrice: 1000,
        unitType: 'Piece',
        status: 'Active'
      },
      {
        name: 'Samsung Galaxy S24',
        sku: 'SGS24',
        barcode: '123456789013',
        description: 'Premium Android smartphone',
        brand: brands[1], // Samsung
        category: categories[0], // Electronics
        purchasePrice: 700,
        mrpPrice: 1100,
        wholesalePrice: 900,
        unitType: 'Piece',
        status: 'Active'
      },
      {
        name: 'Nike Air Max 270',
        sku: 'NAM270',
        barcode: '123456789014',
        description: 'Comfortable running shoes',
        brand: brands[2], // Nike
        category: categories[1], // Clothing
        purchasePrice: 80,
        mrpPrice: 150,
        wholesalePrice: 120,
        unitType: 'Piece',
        status: 'Active'
      },
      {
        name: 'Adidas Ultraboost 22',
        sku: 'AUB22',
        barcode: '123456789015',
        description: 'High-performance running shoes',
        brand: brands[3], // Adidas
        category: categories[2], // Sports
        purchasePrice: 90,
        mrpPrice: 180,
        wholesalePrice: 140,
        unitType: 'Piece',
        status: 'Active'
      },
      {
        name: 'Sony WH-1000XM5',
        sku: 'SWH1000XM5',
        barcode: '123456789016',
        description: 'Noise-canceling wireless headphones',
        brand: brands[4], // Sony
        category: categories[0], // Electronics
        purchasePrice: 250,
        mrpPrice: 400,
        wholesalePrice: 320,
        unitType: 'Piece',
        status: 'Active'
      },
      {
        name: 'Business Laptop',
        sku: 'BLAP001',
        barcode: '123456789017',
        description: 'High-performance business laptop',
        brand: brands[0], // Apple
        category: categories[0], // Electronics
        purchasePrice: 1200,
        mrpPrice: 1800,
        wholesalePrice: 1500,
        unitType: 'Piece',
        status: 'Active'
      },
      {
        name: 'Wireless Mouse',
        sku: 'WMOU001',
        barcode: '123456789018',
        description: 'Ergonomic wireless mouse',
        brand: brands[1], // Samsung
        category: categories[0], // Electronics
        purchasePrice: 25,
        mrpPrice: 50,
        wholesalePrice: 40,
        unitType: 'Piece',
        status: 'Active'
      },
      {
        name: 'Office Chair',
        sku: 'OCHR001',
        barcode: '123456789019',
        description: 'Comfortable office chair',
        category: categories[4], // Home & Garden
        purchasePrice: 150,
        mrpPrice: 300,
        wholesalePrice: 240,
        unitType: 'Piece',
        status: 'Active'
      },
    ]);

    // Create stock entries
    const stockRepo = em.getRepository(Stock);
    const stockEntries = [];
    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      const store = stores[i % stores.length];
      const quantity = Math.floor(Math.random() * 100) + 10; // 10-109 items
      
      stockEntries.push({
        product,
        store,
        quantity,
        unitCost: product.purchasePrice,
        warehouse: `Warehouse-${String.fromCharCode(65 + (i % 3))}`, // A, B, C
        status: 'Active'
      });
    }
    await stockRepo.save(stockEntries);

    // Get payment methods
    const paymentMethodRepo = em.getRepository(PaymentMethod);
    const paymentMethods = await paymentMethodRepo.find();

    // Create sales
    const saleRepo = em.getRepository(Sale);
    const saleProductRepo = em.getRepository(SaleProduct);
    
    for (let i = 0; i < 15; i++) {
      const customer = customers[i % customers.length];
      const employee = employees[i % employees.length];
      const store = stores[i % stores.length];
      const paymentMethod = paymentMethods[i % paymentMethods.length];
      
      const saleDate = new Date();
      saleDate.setDate(saleDate.getDate() - Math.floor(Math.random() * 30)); // Last 30 days
      
      const sale = await saleRepo.save({
        saleDate: saleDate.toISOString().split('T')[0],
        customer,
        employee,
        store,
        paymentMethod,
        invoiceNumber: `INV-${String(i + 1).padStart(4, '0')}`,
        subTotal: 0,
        discount: 0,
        taxAmount: 0,
        deliveryCharge: 0,
        totalAmount: 0,
        dueAmount: 0,
        status: ['Pending', 'Paid', 'Partial'][Math.floor(Math.random() * 3)],
        notes: `Sale transaction ${i + 1}`
      });

      // Add 1-3 products to each sale
      const numProducts = Math.floor(Math.random() * 3) + 1;
      let subTotal = 0;
      
      for (let j = 0; j < numProducts; j++) {
        const product = products[Math.floor(Math.random() * products.length)];
        const stock = stockEntries.find(s => s.product.id === product.id);
        const quantity = Math.floor(Math.random() * 3) + 1;
        const unitPrice = product.mrpPrice;
        const totalPrice = quantity * unitPrice;
        
        if (stock) {
          await saleProductRepo.save({
            sale,
            product,
            stock,
            quantity,
            unitPrice,
            totalPrice
          });
          
          subTotal += totalPrice;
          
          // Update stock quantity
          stock.quantity = Math.max(0, stock.quantity - quantity);
          await stockRepo.save(stock);
        }
      }
      
      // Update sale totals
      const taxAmount = subTotal * 0.1; // 10% tax
      const totalAmount = subTotal + taxAmount;
      
      sale.subTotal = subTotal;
      sale.taxAmount = taxAmount;
      sale.totalAmount = totalAmount;
      sale.dueAmount = sale.status === 'Paid' ? 0 : totalAmount;
      
      await saleRepo.save(sale);
    }

    // Create purchases
    const purchaseRepo = em.getRepository(Purchase);
    const purchaseProductRepo = em.getRepository(PurchaseProduct);
    
    for (let i = 0; i < 10; i++) {
      const supplier = suppliers[i % suppliers.length];
      const employee = employees[i % employees.length];
      const store = stores[i % stores.length];
      const paymentMethod = paymentMethods[i % paymentMethods.length];
      
      const purchaseDate = new Date();
      purchaseDate.setDate(purchaseDate.getDate() - Math.floor(Math.random() * 60)); // Last 60 days
      
      const purchase = await purchaseRepo.save({
        purchaseDate: purchaseDate.toISOString().split('T')[0],
        supplier,
        employee,
        store,
        paymentMethod,
        invoiceNumber: `PO-${String(i + 1).padStart(4, '0')}`,
        subTotal: 0,
        discount: 0,
        taxAmount: 0,
        shippingCharge: 0,
        totalAmount: 0,
        dueAmount: 0,
        status: ['Pending', 'Paid', 'Partial'][Math.floor(Math.random() * 3)],
        notes: `Purchase order ${i + 1}`
      });

      // Add 2-4 products to each purchase
      const numProducts = Math.floor(Math.random() * 3) + 2;
      let subTotal = 0;
      
      for (let j = 0; j < numProducts; j++) {
        const product = products[Math.floor(Math.random() * products.length)];
        const quantity = Math.floor(Math.random() * 20) + 5;
        const unitCost = product.purchasePrice;
        const totalCost = quantity * unitCost;
        
        await purchaseProductRepo.save({
          purchase,
          product,
          quantity,
          unitCost,
          totalCost
        });
        
        subTotal += totalCost;
        
        // Update stock quantity
        const stock = stockEntries.find(s => s.product.id === product.id && s.store.id === store.id);
        if (stock) {
          stock.quantity += quantity;
          await stockRepo.save(stock);
        }
      }
      
      // Update purchase totals
      const taxAmount = subTotal * 0.1; // 10% tax
      const shippingCharge = Math.floor(Math.random() * 50) + 10; // $10-60 shipping
      const totalAmount = subTotal + taxAmount + shippingCharge;
      
      purchase.subTotal = subTotal;
      purchase.taxAmount = taxAmount;
      purchase.shippingCharge = shippingCharge;
      purchase.totalAmount = totalAmount;
      purchase.dueAmount = purchase.status === 'Paid' ? 0 : totalAmount;
      
      await purchaseRepo.save(purchase);
    }

    console.log('✅ Dummy data seeding completed successfully!');
    console.log(`Created:
    - ${brands.length} brands
    - ${categories.length} categories
    - ${stores.length} stores
    - ${departments.length} departments
    - ${employees.length} employees
    - ${customers.length} customers
    - ${suppliers.length} suppliers
    - ${products.length} products
    - ${stockEntries.length} stock entries
    - 15 sales with products
    - 10 purchases with products`);

  } catch (error) {
    console.error('❌ Error seeding dummy data:', error);
    throw error;
  }
}