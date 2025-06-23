import { getDataSource } from '../../config/database';
import { Supplier, SupplierType } from '../../entities/Supplier';
import { Purchase } from '../../entities/Purchase';
import { SupplierEvaluation } from '../../entities/SupplierEvaluation';
import { PurchaseOrder } from '../../entities/PurchaseOrder';

export interface SupplierPerformance {
  supplier: Supplier;
  totalOrders: number;
  totalSpent: number;
  averageOrderValue: number;
  onTimeDeliveryRate: number;
  qualityScore: number;
  overallRating: number;
}

export interface SupplierAnalytics {
  totalSuppliers: number;
  activeSuppliers: number;
  totalPurchases: number;
  totalSpent: number;
  topSuppliers: Array<{ supplier: Supplier; totalSpent: number }>;
  suppliersByType: Array<{ type: string; count: number }>;
}

export class SRMService {
  private dataSource = getDataSource();

  async getSupplierPerformance(supplierId: string, startDate: string, endDate: string): Promise<SupplierPerformance> {
    const supplierRepo = this.dataSource.getRepository(Supplier);
    const purchaseRepo = this.dataSource.getRepository(Purchase);
    const evaluationRepo = this.dataSource.getRepository(SupplierEvaluation);

    const supplier = await supplierRepo.findOne({
      where: { id: supplierId },
    });

    if (!supplier) {
      throw new Error('Supplier not found');
    }

    const purchases = await purchaseRepo.find({
      where: { supplier: { id: supplierId } },
    });

    const periodPurchases = purchases.filter(p => 
      p.purchaseDate >= startDate && p.purchaseDate <= endDate
    );

    const totalOrders = periodPurchases.length;
    const totalSpent = periodPurchases.reduce((sum, p) => sum + p.totalAmount, 0);
    const averageOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0;

    // Get latest evaluation
    const evaluation = await evaluationRepo.findOne({
      where: { supplier: { id: supplierId } },
      order: { evaluationDate: 'DESC' },
    });

    const onTimeDeliveryRate = evaluation?.onTimeDeliveryRate || 0;
    const qualityScore = evaluation?.qualityScore || 0;
    const overallRating = evaluation?.overallRating || 0;

    return {
      supplier,
      totalOrders,
      totalSpent,
      averageOrderValue,
      onTimeDeliveryRate,
      qualityScore,
      overallRating,
    };
  }

  async getSupplierAnalytics(): Promise<SupplierAnalytics> {
    const supplierRepo = this.dataSource.getRepository(Supplier);
    const purchaseRepo = this.dataSource.getRepository(Purchase);

    const suppliers = await supplierRepo.find({ relations: ['purchases'] });
    const totalSuppliers = suppliers.length;
    const activeSuppliers = suppliers.filter(s => s.status === 'Active').length;

    const purchases = await purchaseRepo.find({ relations: ['supplier'] });
    const totalPurchases = purchases.length;
    const totalSpent = purchases.reduce((sum, p) => sum + p.totalAmount, 0);

    // Top suppliers by spending
    const supplierSpending = new Map<string, { supplier: Supplier; totalSpent: number }>();
    
    purchases.forEach(purchase => {
      if (purchase.supplier) {
        const existing = supplierSpending.get(purchase.supplier.id);
        if (existing) {
          existing.totalSpent += purchase.totalAmount;
        } else {
          supplierSpending.set(purchase.supplier.id, {
            supplier: purchase.supplier,
            totalSpent: purchase.totalAmount,
          });
        }
      }
    });

    const topSuppliers = Array.from(supplierSpending.values())
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 10);

    // Suppliers by type
    const typeMap = new Map<string, number>();
    suppliers.forEach(supplier => {
      const type = supplier.supplierType || SupplierType.Distributor;
      typeMap.set(type, (typeMap.get(type) || 0) + 1);
    });

    const suppliersByType = Array.from(typeMap.entries()).map(([type, count]) => ({
      type,
      count,
    }));

    return {
      totalSuppliers,
      activeSuppliers,
      totalPurchases,
      totalSpent,
      topSuppliers,
      suppliersByType,
    };
  }

  async evaluateSupplier(data: {
    supplierId: string;
    evaluatorId: string;
    qualityScore: number;
    deliveryScore: number;
    serviceScore: number;
    priceScore: number;
    onTimeDeliveryRate: number;
    comments?: string;
  }): Promise<SupplierEvaluation> {
    const evaluationRepo = this.dataSource.getRepository(SupplierEvaluation);

    const overallRating = (
      data.qualityScore + 
      data.deliveryScore + 
      data.serviceScore + 
      data.priceScore
    ) / 4;

    const evaluation = evaluationRepo.create({
      supplier: { id: data.supplierId },
      evaluator: { id: data.evaluatorId },
      evaluationDate: new Date().toISOString().split('T')[0],
      qualityScore: data.qualityScore,
      deliveryScore: data.deliveryScore,
      serviceScore: data.serviceScore,
      priceScore: data.priceScore,
      onTimeDeliveryRate: data.onTimeDeliveryRate,
      overallRating,
      comments: data.comments,
    } as any);

    return await evaluationRepo.save(evaluation);
  }

  async createPurchaseOrder(data: {
    supplierId: string;
    items: Array<{
      productId: string;
      quantity: number;
      unitPrice: number;
    }>;
    deliveryDate: string;
    notes?: string;
  }): Promise<PurchaseOrder> {
    const poRepo = this.dataSource.getRepository(PurchaseOrder);

    const subtotal = data.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    const tax = subtotal * 0.1; // 10% tax
    const total = subtotal + tax;

    const po = poRepo.create({
      supplier: { id: data.supplierId },
      orderDate: new Date().toISOString().split('T')[0],
      deliveryDate: data.deliveryDate,
      status: 'Pending',
      subtotal,
      tax,
      total,
      notes: data.notes,
    } as any);

    return await poRepo.save(po);
  }

  async approvePurchaseOrder(poId: string, approverId: string): Promise<PurchaseOrder> {
    const poRepo = this.dataSource.getRepository(PurchaseOrder);

    await poRepo.update(poId, {
      status: 'Approved',
      approvedBy: approverId,
      approvedDate: new Date().toISOString().split('T')[0],
    } as any);

    return await poRepo.findOne({
      where: { id: poId },
      relations: ['supplier'],
    }) as PurchaseOrder;
  }

  async getSupplierContracts(supplierId: string): Promise<any[]> {
    // This would return supplier contracts
    // For now, return empty array as Contract entity would need to be created
    return [];
  }

  async trackDelivery(poId: string, status: string, notes?: string): Promise<void> {
    const poRepo = this.dataSource.getRepository(PurchaseOrder);

    await poRepo.update(poId, {
      deliveryStatus: status,
      deliveryNotes: notes,
    } as any);
  }

  async getSupplierPaymentTerms(supplierId: string): Promise<any> {
    const supplierRepo = this.dataSource.getRepository(Supplier);

    const supplier = await supplierRepo.findOne({
      where: { id: supplierId },
    });

    // Return default payment terms (would be stored in supplier entity)
    return {
      paymentTerms: '30 days',
      discountTerms: '2/10 net 30',
      currency: 'USD',
    };
  }
}