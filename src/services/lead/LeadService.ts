import { BaseService } from '../core/BaseService';
import { Lead } from '../../entities/Lead';
import { CreateLeadDto } from '../../dtos/CreateLeadDto';
import { UpdateLeadDto } from '../../dtos/UpdateLeadDto';
import { Customer, CustomerType } from '../../entities/Customer';
import { getDataSource } from '../../config/database';

export interface LeadConversionData {
  customerType: CustomerType;
  companyName?: string;
  address?: string;
  taxId?: string;
}

export interface LeadAnalytics {
  totalLeads: number;
  convertedLeads: number;
  conversionRate: number;
  leadsBySource: Array<{ source: string; count: number }>;
  leadsByStatus: Array<{ status: string; count: number }>;
  averageConversionTime: number; // days
}

export class LeadService extends BaseService<Lead, CreateLeadDto, UpdateLeadDto> {
  constructor() {
    super(Lead, CreateLeadDto, UpdateLeadDto, ['name', 'email', 'phone', 'company', 'notes']);
  }

  async convertToCustomer(leadId: string, conversionData: LeadConversionData): Promise<Customer> {
    const dataSource = getDataSource();
    
    return await dataSource.transaction(async (manager) => {
      const lead = await this.findById(leadId);
      if (!lead) {
        throw new Error('Lead not found');
      }

      if (lead.status === 'Converted') {
        throw new Error('Lead is already converted');
      }

      // Create customer from lead
      const customerRepo = manager.getRepository(Customer);
      const customer = customerRepo.create({
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        companyName: conversionData.companyName || lead.company,
        customerType: conversionData.customerType,
        address: conversionData.address,
        taxId: conversionData.taxId,
        status: 'Active',
      });

      const savedCustomer = await customerRepo.save(customer);

      // Update lead status
      await this.update(leadId, { status: 'Converted' } as UpdateLeadDto);

      return savedCustomer;
    });
  }

  async getLeadsBySource(source: string): Promise<Lead[]> {
    const result = await this.findAll({ query: source, fields: ['source'] });
    return result.data;
  }

  async getLeadsByStatus(status: string): Promise<Lead[]> {
    const result = await this.findAll({ query: status, fields: ['status'] });
    return result.data;
  }

  async updateLeadStatus(leadId: string, status: string, notes?: string): Promise<Lead> {
    const updateData: Partial<UpdateLeadDto> = { status };
    if (notes) {
      updateData.notes = notes;
    }
    return await this.update(leadId, updateData as UpdateLeadDto);
  }

  async getLeadAnalytics(startDate?: string, endDate?: string): Promise<LeadAnalytics> {
    const allLeads = await this.findAll();
    let leads = allLeads.data;

    // Filter by date range if provided
    if (startDate || endDate) {
      leads = leads.filter(lead => {
        const leadDate = lead.createdAt.toISOString().split('T')[0];
        if (startDate && leadDate < startDate) return false;
        if (endDate && leadDate > endDate) return false;
        return true;
      });
    }

    const totalLeads = leads.length;
    const convertedLeads = leads.filter(lead => lead.status === 'Converted').length;
    const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;

    // Group by source
    const sourceMap = new Map<string, number>();
    leads.forEach(lead => {
      const source = lead.source || 'Unknown';
      sourceMap.set(source, (sourceMap.get(source) || 0) + 1);
    });

    const leadsBySource = Array.from(sourceMap.entries()).map(([source, count]) => ({
      source,
      count,
    }));

    // Group by status
    const statusMap = new Map<string, number>();
    leads.forEach(lead => {
      const status = lead.status || 'New';
      statusMap.set(status, (statusMap.get(status) || 0) + 1);
    });

    const leadsByStatus = Array.from(statusMap.entries()).map(([status, count]) => ({
      status,
      count,
    }));

    // Calculate average conversion time (simplified)
    const convertedLeadsWithTime = leads.filter(lead => 
      lead.status === 'Converted' && lead.expectedCloseDate
    );

    const averageConversionTime = convertedLeadsWithTime.length > 0
      ? convertedLeadsWithTime.reduce((sum, lead) => {
          const created = new Date(lead.createdAt);
          const converted = new Date(lead.expectedCloseDate!);
          const days = Math.abs(converted.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
          return sum + days;
        }, 0) / convertedLeadsWithTime.length
      : 0;

    return {
      totalLeads,
      convertedLeads,
      conversionRate,
      leadsBySource,
      leadsByStatus,
      averageConversionTime,
    };
  }

  async assignLead(leadId: string, assigneeId: string): Promise<Lead> {
    // This would require adding an assignee field to the Lead entity
    // For now, we'll update the notes field
    const lead = await this.findById(leadId);
    if (!lead) {
      throw new Error('Lead not found');
    }

    const updatedNotes = `${lead.notes || ''}\nAssigned to user: ${assigneeId}`;
    return await this.update(leadId, { notes: updatedNotes } as UpdateLeadDto);
  }

  async getLeadsByDateRange(startDate: string, endDate: string): Promise<Lead[]> {
    const allLeads = await this.findAll();
    return allLeads.data.filter(lead => {
      const leadDate = lead.createdAt.toISOString().split('T')[0];
      return leadDate >= startDate && leadDate <= endDate;
    });
  }

  async bulkUpdateStatus(leadIds: string[], status: string): Promise<void> {
    const updates = leadIds.map(id => ({ id, data: { status } }));
    await this.bulkUpdate(updates);
  }
}