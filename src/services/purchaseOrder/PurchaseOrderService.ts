import { BaseService } from '../core/BaseService';
import { PurchaseOrder, PurchaseOrderStatus } from '../../entities/PurchaseOrder';
import { PurchaseOrderItem } from '../../entities/PurchaseOrderItem';
import { CreatePurchaseOrderDto } from '../../dtos/CreatePurchaseOrderDto';
import { UpdatePurchaseOrderDto } from '../../dtos/UpdatePurchaseOrderDto';
import { getDataSource } from '../../config/database';

export interface PurchaseOrderAnalytics {
  totalOrders: number;
  totalValue: number;
  averageOrderValue: number;
  ordersByStatus: Array<{ status: string; count: number; value: number }>;
  ordersBySupplier: Array<{ supplier: string; count: number; value: number }>;
  onTimeDeliveryRate: number;
}

export class PurchaseOrderService extends BaseService<PurchaseOrder, CreatePurchaseOrderDto, UpdatePurchaseOrderDto> {
  constructor() {
    super(PurchaseOrder, CreatePurchaseOrderDto, UpdatePurchaseOrderDto, ['orderNumber', 'notes']);
  }

  async create(createDto: CreatePurchaseOrderDto): Promise<PurchaseOrder> {
    const dataSource = getDataSource();
    
    return await dataSource.transaction(async (manager) => {
      const poRepo = manager.getRepository(PurchaseOrder);
      const poItemRepo = manager.getRepository(PurchaseOrderItem);

      // Calculate totals
      const subtotal = createDto.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
      const tax = createDto.tax || subtotal * 0.1; // 10% default tax
      const shipping = createDto.shipping || 0;
      const total = subtotal + tax + shipping;

      // Create purchase order
      const po = poRepo.create({
        ...createDto,
        subtotal,
        tax,
        shipping,
        total,
        status: createDto.status || PurchaseOrderStatus.PENDING,
      });

      const savedPO = await poRepo.save(po);

      // Create purchase order items
      for (const itemData of createDto.items) {
        const item = poItemRepo.create({
          purchaseOrder: savedPO,
          product: { id: itemData.product },
          quantity: itemData.quantity,
          unitPrice: itemData.unitPrice,
          totalPrice: itemData.quantity * itemData.unitPrice,
          specifications: itemData.specifications,
        });

        await poItemRepo.save(item);
      }

      return await this.findById(savedPO.id) as PurchaseOrder;
    });
  }

  async findById(id: string): Promise<PurchaseOrder | null> {
    return await this.repository.findOne({
      where: { id } as any,
      relations: ['supplier', 'items', 'items.product'],
    });
  }

  async approvePurchaseOrder(id: string, approverId: string, comments?: string): Promise<PurchaseOrder> {
    const po = await this.findById(id);
    if (!po) {
      throw new Error('Purchase order not found');
    }

    if (po.status !== PurchaseOrderStatus.PENDING) {
      throw new Error('Only pending purchase orders can be approved');
    }

    return await this.update(id, {
      status: PurchaseOrderStatus.APPROVED,
      approvedBy: approverId,
      approvedDate: new Date().toISOString().split('T')[0],
      notes: comments ? `${po.notes || ''}\nApproval comments: ${comments}` : po.notes,
    } as UpdatePurchaseOrderDto);
  }

  async rejectPurchaseOrder(id: string, rejectorId: string, reason: string): Promise<PurchaseOrder> {
    const po = await this.findById(id);
    if (!po) {
      throw new Error('Purchase order not found');
    }

    if (po.status !== PurchaseOrderStatus.PENDING) {
      throw new Error('Only pending purchase orders can be rejected');
    }

    return await this.update(id, {
      status: PurchaseOrderStatus.CANCELLED,
      notes: `${po.notes || ''}\nRejected by ${rejectorId}: ${reason}`,
    } as UpdatePurchaseOrderDto);
  }

  async sendToSupplier(id: string): Promise<PurchaseOrder> {
    const po = await this.findById(id);
    if (!po) {
      throw new Error('Purchase order not found');
    }

    if (po.status !== PurchaseOrderStatus.APPROVED) {
      throw new Error('Only approved purchase orders can be sent');
    }

    return await this.update(id, {
      status: PurchaseOrderStatus.SENT,
    } as UpdatePurchaseOrderDto);
  }

  async markAsReceived(id: string, receivedDate?: string, notes?: string): Promise<PurchaseOrder> {
    const po = await this.findById(id);
    if (!po) {
      throw new Error('Purchase order not found');
    }

    if (po.status !== PurchaseOrderStatus.SENT) {
      throw new Error('Only sent purchase orders can be marked as received');
    }

    return await this.update(id, {
      status: PurchaseOrderStatus.RECEIVED,
      deliveryStatus: 'Delivered',
      deliveryNotes: notes,
    } as UpdatePurchaseOrderDto);
  }

  async updateDeliveryStatus(id: string, status: string, notes?: string): Promise<PurchaseOrder> {
    return await this.update(id, {
      deliveryStatus: status,
      deliveryNotes: notes,
    } as UpdatePurchaseOrderDto);
  }

  async getPurchaseOrdersBySupplier(supplierId: string): Promise<PurchaseOrder[]> {
    const allPOs = await this.findAll();
    return allPOs.data.filter(po => po.supplier?.id === supplierId);
  }

  async getPurchaseOrdersByStatus(status: PurchaseOrderStatus): Promise<PurchaseOrder[]> {
    const allPOs = await this.findAll();
    return allPOs.data.filter(po => po.status === status);
  }

  async getPendingApprovals(): Promise<PurchaseOrder[]> {
    return await this.getPurchaseOrdersByStatus(PurchaseOrderStatus.PENDING);
  }

  async getOverduePurchaseOrders(): Promise<PurchaseOrder[]> {
    const today = new Date().toISOString().split('T')[0];
    const allPOs = await this.findAll();
    
    return allPOs.data.filter(po => 
      po.deliveryDate < today && 
      po.status === PurchaseOrderStatus.SENT
    );
  }

  async getPurchaseOrderAnalytics(startDate?: string, endDate?: string): Promise<PurchaseOrderAnalytics> {
    const allPOs = await this.findAll();
    let purchaseOrders = allPOs.data;

    // Filter by date range if provided
    if (startDate || endDate) {
      purchaseOrders = purchaseOrders.filter(po => {
        if (startDate && po.orderDate < startDate) return false;
        if (endDate && po.orderDate > endDate) return false;
        return true;
      });
    }

    const totalOrders = purchaseOrders.length;
    const totalValue = purchaseOrders.reduce((sum, po) => sum + po.total, 0);
    const averageOrderValue = totalOrders > 0 ? totalValue / totalOrders : 0;

    // Group by status
    const statusMap = new Map<string, { count: number; value: number }>();
    purchaseOrders.forEach(po => {
      const status = po.status;
      const existing = statusMap.get(status) || { count: 0, value: 0 };
      existing.count += 1;
      existing.value += po.total;
      statusMap.set(status, existing);
    });

    const ordersByStatus = Array.from(statusMap.entries()).map(([status, data]) => ({
      status,
      count: data.count,
      value: data.value,
    }));

    // Group by supplier
    const supplierMap = new Map<string, { count: number; value: number }>();
    purchaseOrders.forEach(po => {
      const supplier = po.supplier?.name || 'Unknown';
      const existing = supplierMap.get(supplier) || { count: 0, value: 0 };
      existing.count += 1;
      existing.value += po.total;
      supplierMap.set(supplier, existing);
    });

    const ordersBySupplier = Array.from(supplierMap.entries()).map(([supplier, data]) => ({
      supplier,
      count: data.count,
      value: data.value,
    }));

    // Calculate on-time delivery rate
    const deliveredOrders = purchaseOrders.filter(po => po.status === PurchaseOrderStatus.RECEIVED);
    const onTimeDeliveries = deliveredOrders.filter(po => {
      // This would need actual delivery date tracking
      return true; // Simplified for now
    });

    const onTimeDeliveryRate = deliveredOrders.length > 0 
      ? (onTimeDeliveries.length / deliveredOrders.length) * 100 
      : 0;

    return {
      totalOrders,
      totalValue,
      averageOrderValue,
      ordersByStatus,
      ordersBySupplier,
      onTimeDeliveryRate,
    };
  }

  async generateOrderNumber(): Promise<string> {
    const count = await this.count();
    const year = new Date().getFullYear();
    const orderNumber = `PO-${year}-${(count + 1).toString().padStart(4, '0')}`;
    return orderNumber;
  }

  async duplicatePurchaseOrder(id: string): Promise<PurchaseOrder> {
    const originalPO = await this.findById(id);
    if (!originalPO) {
      throw new Error('Purchase order not found');
    }

    const newOrderNumber = await this.generateOrderNumber();
    
    const duplicateData: CreatePurchaseOrderDto = {
      orderNumber: newOrderNumber,
      supplier: originalPO.supplier.id,
      orderDate: new Date().toISOString().split('T')[0],
      deliveryDate: originalPO.deliveryDate,
      items: originalPO.items.map(item => ({
        product: item.product.id,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        specifications: item.specifications,
      })),
      subtotal: originalPO.subtotal,
      tax: originalPO.tax,
      shipping: originalPO.shipping,
      total: originalPO.total,
      notes: `Duplicated from PO: ${originalPO.orderNumber}`,
    };

    return await this.create(duplicateData);
  }
}