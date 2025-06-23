import { getDataSource } from '../../config/database';
import { Customer, CustomerType } from '../../entities/Customer';
import { Sale } from '../../entities/Sale';
import { Lead } from '../../entities/Lead';
import { Opportunity } from '../../entities/Opportunity';
import { CommunicationLog } from '../../entities/CommunicationLog';

export interface CustomerAnalytics {
  customer: Customer;
  totalPurchases: number;
  totalSpent: number;
  averageOrderValue: number;
  lastPurchaseDate: string;
  lifetimeValue: number;
  loyaltyScore: number;
}

export interface SalesAnalytics {
  totalSales: number;
  totalRevenue: number;
  averageOrderValue: number;
  conversionRate: number;
  topCustomers: Array<{ customer: Customer; totalSpent: number }>;
  salesTrends: Array<{ period: string; sales: number; revenue: number }>;
}

export interface LeadAnalytics {
  totalLeads: number;
  convertedLeads: number;
  conversionRate: number;
  leadSources: Array<{ source: string; count: number }>;
  leadsByStage: Array<{ stage: string; count: number }>;
}

export class CRMService {
  private dataSource = getDataSource();

  async getCustomerAnalytics(customerId: string): Promise<CustomerAnalytics> {
    const customerRepo = this.dataSource.getRepository(Customer);
    const saleRepo = this.dataSource.getRepository(Sale);

    const customer = await customerRepo.findOne({
      where: { id: customerId },
      relations: ['sales'],
    });

    if (!customer) {
      throw new Error('Customer not found');
    }

    const sales = await saleRepo.find({
      where: { customer: { id: customerId } },
      order: { saleDate: 'DESC' },
    });

    const totalPurchases = sales.length;
    const totalSpent = sales.reduce((sum, sale) => sum + sale.totalAmount, 0);
    const averageOrderValue = totalPurchases > 0 ? totalSpent / totalPurchases : 0;
    const lastPurchaseDate = sales.length > 0 ? sales[0].saleDate : '';

    // Calculate lifetime value (simplified)
    const lifetimeValue = totalSpent;

    // Calculate loyalty score (simplified)
    const loyaltyScore = Math.min(100, (totalPurchases * 10) + (totalSpent / 100));

    return {
      customer,
      totalPurchases,
      totalSpent,
      averageOrderValue,
      lastPurchaseDate,
      lifetimeValue,
      loyaltyScore,
    };
  }

  async getSalesAnalytics(startDate: string, endDate: string): Promise<SalesAnalytics> {
    const saleRepo = this.dataSource.getRepository(Sale);

    const sales = await saleRepo.find({
      where: {
        // saleDate: Between(startDate, endDate)
      },
      relations: ['customer'],
    });

    const periodSales = sales.filter(s => s.saleDate >= startDate && s.saleDate <= endDate);

    const totalSales = periodSales.length;
    const totalRevenue = periodSales.reduce((sum, sale) => sum + sale.totalAmount, 0);
    const averageOrderValue = totalSales > 0 ? totalRevenue / totalSales : 0;

    // Calculate conversion rate (simplified - would need lead tracking)
    const conversionRate = 0; // Would need lead data

    // Top customers
    const customerSpending = new Map<string, { customer: Customer; totalSpent: number }>();
    
    periodSales.forEach(sale => {
      if (sale.customer) {
        const existing = customerSpending.get(sale.customer.id);
        if (existing) {
          existing.totalSpent += sale.totalAmount;
        } else {
          customerSpending.set(sale.customer.id, {
            customer: sale.customer,
            totalSpent: sale.totalAmount,
          });
        }
      }
    });

    const topCustomers = Array.from(customerSpending.values())
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 10);

    // Sales trends (monthly)
    const salesTrends = this.calculateSalesTrends(periodSales);

    return {
      totalSales,
      totalRevenue,
      averageOrderValue,
      conversionRate,
      topCustomers,
      salesTrends,
    };
  }

  async getLeadAnalytics(): Promise<LeadAnalytics> {
    const leadRepo = this.dataSource.getRepository(Lead);

    const leads = await leadRepo.find();
    const totalLeads = leads.length;
    const convertedLeads = leads.filter(l => l.status === 'Converted').length;
    const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;

    // Lead sources
    const sourceMap = new Map<string, number>();
    leads.forEach(lead => {
      const source = lead.source || 'Unknown';
      sourceMap.set(source, (sourceMap.get(source) || 0) + 1);
    });

    const leadSources = Array.from(sourceMap.entries()).map(([source, count]) => ({
      source,
      count,
    }));

    // Leads by stage
    const stageMap = new Map<string, number>();
    leads.forEach(lead => {
      const stage = lead.status || 'Unknown';
      stageMap.set(stage, (stageMap.get(stage) || 0) + 1);
    });

    const leadsByStage = Array.from(stageMap.entries()).map(([stage, count]) => ({
      stage,
      count,
    }));

    return {
      totalLeads,
      convertedLeads,
      conversionRate,
      leadSources,
      leadsByStage,
    };
  }

  async createLead(leadData: {
    name: string;
    email?: string;
    phone?: string;
    company?: string;
    source?: string;
    notes?: string;
  }): Promise<Lead> {
    const leadRepo = this.dataSource.getRepository(Lead);

    const lead = leadRepo.create({
      ...leadData,
      status: 'New',
      createdAt: new Date(),
    });

    return await leadRepo.save(lead);
  }

  async convertLeadToCustomer(leadId: string): Promise<Customer> {
    const leadRepo = this.dataSource.getRepository(Lead);
    const customerRepo = this.dataSource.getRepository(Customer);

    const lead = await leadRepo.findOne({ where: { id: leadId } });
    if (!lead) {
      throw new Error('Lead not found');
    }

    // Create customer from lead
    const customer = customerRepo.create({
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      companyName: lead.company,
      customerType: CustomerType.Retailer,
      status: 'Active',
    });

    const savedCustomer = await customerRepo.save(customer);

    // Update lead status
    await leadRepo.update(leadId, { status: 'Converted' });

    return savedCustomer;
  }

  async logCommunication(data: {
    customerId?: string;
    leadId?: string;
    type: 'Email' | 'Phone' | 'Meeting' | 'SMS';
    subject: string;
    content: string;
    direction: 'Inbound' | 'Outbound';
  }): Promise<CommunicationLog> {
    const commRepo = this.dataSource.getRepository(CommunicationLog);

    const log = commRepo.create({
      ...data,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().split(' ')[0],
    });

    return await commRepo.save(log);
  }

  async getCustomerCommunications(customerId: string): Promise<CommunicationLog[]> {
    const commRepo = this.dataSource.getRepository(CommunicationLog);

    return await commRepo.find({
      where: { customerId },
      order: { date: 'DESC', time: 'DESC' },
    });
  }

  async segmentCustomers(): Promise<Array<{ segment: string; customers: Customer[] }>> {
    const customerRepo = this.dataSource.getRepository(Customer);
    const customers = await customerRepo.find({ relations: ['sales'] });

    const segments = [
      {
        segment: 'High Value',
        customers: customers.filter(c => {
          const totalSpent = c.sales?.reduce((sum, s) => sum + s.totalAmount, 0) || 0;
          return totalSpent > 10000;
        }),
      },
      {
        segment: 'Medium Value',
        customers: customers.filter(c => {
          const totalSpent = c.sales?.reduce((sum, s) => sum + s.totalAmount, 0) || 0;
          return totalSpent >= 1000 && totalSpent <= 10000;
        }),
      },
      {
        segment: 'Low Value',
        customers: customers.filter(c => {
          const totalSpent = c.sales?.reduce((sum, s) => sum + s.totalAmount, 0) || 0;
          return totalSpent < 1000;
        }),
      },
    ];

    return segments;
  }

  private calculateSalesTrends(sales: Sale[]): Array<{ period: string; sales: number; revenue: number }> {
    const monthlyData = new Map<string, { sales: number; revenue: number }>();

    sales.forEach(sale => {
      const month = sale.saleDate.substring(0, 7); // YYYY-MM
      const existing = monthlyData.get(month) || { sales: 0, revenue: 0 };
      existing.sales += 1;
      existing.revenue += sale.totalAmount;
      monthlyData.set(month, existing);
    });

    return Array.from(monthlyData.entries()).map(([period, data]) => ({
      period,
      ...data,
    }));
  }
}