import { BaseService } from './BaseService';
import { PaymentMethod } from '../entities/PaymentMethod';
import { CreatePaymentMethodDto } from '../dtos/CreatePaymentMethodDto';
import { UpdatePaymentMethodDto } from '../dtos/UpdatePaymentMethodDto';

export class PaymentMethodService extends BaseService<PaymentMethod, CreatePaymentMethodDto, UpdatePaymentMethodDto> {
  constructor() {
    super(PaymentMethod, CreatePaymentMethodDto, UpdatePaymentMethodDto, ['name', 'description']);
  }

  async findById(id: number): Promise<PaymentMethod | null> {
    return await this.repository.findOne({
      where: { id } as any,
      relations: ['sales', 'purchases', 'expenses', 'incomes'],
    });
  }

  async getActivePaymentMethods(): Promise<PaymentMethod[]> {
    return await this.repository.find({
      order: { name: 'ASC' },
    });
  }

  async getPaymentMethodUsage(id: number): Promise<any> {
    const paymentMethod = await this.repository.findOne({
      where: { id } as any,
      relations: ['sales', 'purchases', 'expenses', 'incomes'],
    });

    if (!paymentMethod) {
      throw new Error('Payment method not found');
    }

    return {
      paymentMethod,
      salesCount: paymentMethod.sales?.length || 0,
      purchasesCount: paymentMethod.purchases?.length || 0,
      expensesCount: paymentMethod.expenses?.length || 0,
      incomesCount: paymentMethod.incomes?.length || 0,
      totalTransactions: (paymentMethod.sales?.length || 0) + 
                        (paymentMethod.purchases?.length || 0) + 
                        (paymentMethod.expenses?.length || 0) + 
                        (paymentMethod.incomes?.length || 0),
    };
  }
}