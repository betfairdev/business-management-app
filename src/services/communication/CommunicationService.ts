import { BaseService } from '../core/BaseService';
import { CommunicationLog, CommunicationType, CommunicationDirection } from '../../entities/CommunicationLog';
import { CreateCommunicationLogDto } from '../../dtos/CreateCommunicationLogDto';
import { UpdateCommunicationLogDto } from '../../dtos/UpdateCommunicationLogDto';
import { EmailService } from './EmailService';
import { SMSService } from './SMSService';
import { WhatsAppService } from './WhatsAppService';

export interface CommunicationStats {
  totalCommunications: number;
  byType: Array<{ type: string; count: number }>;
  byDirection: Array<{ direction: string; count: number }>;
  recentCommunications: CommunicationLog[];
}

export interface BulkCommunicationRequest {
  type: CommunicationType;
  recipients: Array<{
    customerId?: string;
    leadId?: string;
    email?: string;
    phone?: string;
  }>;
  subject: string;
  content: string;
  scheduledTime?: string;
}

export class CommunicationService extends BaseService<CommunicationLog, CreateCommunicationLogDto, UpdateCommunicationLogDto> {
  private emailService = new EmailService();
  private smsService = new SMSService();
  private whatsappService = new WhatsAppService();

  constructor() {
    super(CommunicationLog, CreateCommunicationLogDto, UpdateCommunicationLogDto, ['subject', 'content', 'contactPerson']);
  }

  async logCommunication(data: CreateCommunicationLogDto): Promise<CommunicationLog> {
    return await this.create(data);
  }

  async sendEmail(data: {
    customerId?: string;
    leadId?: string;
    to: string;
    subject: string;
    content: string;
    isHtml?: boolean;
  }): Promise<CommunicationLog> {
    try {
      // Send email
      await this.emailService.sendEmail({
        from: 'noreply@business.com',
        to: [data.to],
        subject: data.subject,
        body: data.content,
        isHtml: data.isHtml || false,
      });

      // Log communication
      return await this.logCommunication({
        customerId: data.customerId,
        leadId: data.leadId,
        type: CommunicationType.EMAIL,
        direction: CommunicationDirection.OUTBOUND,
        subject: data.subject,
        content: data.content,
        date: new Date().toISOString().split('T')[0],
        time: new Date().toTimeString().split(' ')[0],
      });
    } catch (error) {
      throw new Error(`Failed to send email: ${error}`);
    }
  }

  async sendSMS(data: {
    customerId?: string;
    leadId?: string;
    to: string;
    message: string;
  }): Promise<CommunicationLog> {
    try {
      // Send SMS
      await this.smsService.sendSMS(data.to, data.message);

      // Log communication
      return await this.logCommunication({
        customerId: data.customerId,
        leadId: data.leadId,
        type: CommunicationType.SMS,
        direction: CommunicationDirection.OUTBOUND,
        subject: 'SMS Message',
        content: data.message,
        date: new Date().toISOString().split('T')[0],
        time: new Date().toTimeString().split(' ')[0],
      });
    } catch (error) {
      throw new Error(`Failed to send SMS: ${error}`);
    }
  }

  async sendWhatsApp(data: {
    customerId?: string;
    leadId?: string;
    to: string;
    message: string;
  }): Promise<CommunicationLog> {
    try {
      // Send WhatsApp message
      await this.whatsappService.sendTextMessage(data.to, data.message);

      // Log communication
      return await this.logCommunication({
        customerId: data.customerId,
        leadId: data.leadId,
        type: CommunicationType.WHATSAPP,
        direction: CommunicationDirection.OUTBOUND,
        subject: 'WhatsApp Message',
        content: data.message,
        date: new Date().toISOString().split('T')[0],
        time: new Date().toTimeString().split(' ')[0],
      });
    } catch (error) {
      throw new Error(`Failed to send WhatsApp message: ${error}`);
    }
  }

  async getCommunicationsByCustomer(customerId: string): Promise<CommunicationLog[]> {
    const result = await this.findAll({ query: customerId, fields: ['customerId'] });
    return result.data.sort((a, b) => new Date(b.date + ' ' + b.time).getTime() - new Date(a.date + ' ' + a.time).getTime());
  }

  async getCommunicationsByLead(leadId: string): Promise<CommunicationLog[]> {
    const result = await this.findAll({ query: leadId, fields: ['leadId'] });
    return result.data.sort((a, b) => new Date(b.date + ' ' + b.time).getTime() - new Date(a.date + ' ' + a.time).getTime());
  }

  async getCommunicationStats(startDate?: string, endDate?: string): Promise<CommunicationStats> {
    const allCommunications = await this.findAll();
    let communications = allCommunications.data;

    // Filter by date range if provided
    if (startDate || endDate) {
      communications = communications.filter(comm => {
        if (startDate && comm.date < startDate) return false;
        if (endDate && comm.date > endDate) return false;
        return true;
      });
    }

    const totalCommunications = communications.length;

    // Group by type
    const typeMap = new Map<string, number>();
    communications.forEach(comm => {
      typeMap.set(comm.type, (typeMap.get(comm.type) || 0) + 1);
    });

    const byType = Array.from(typeMap.entries()).map(([type, count]) => ({
      type,
      count,
    }));

    // Group by direction
    const directionMap = new Map<string, number>();
    communications.forEach(comm => {
      directionMap.set(comm.direction, (directionMap.get(comm.direction) || 0) + 1);
    });

    const byDirection = Array.from(directionMap.entries()).map(([direction, count]) => ({
      direction,
      count,
    }));

    // Get recent communications (last 10)
    const recentCommunications = communications
      .sort((a, b) => new Date(b.date + ' ' + b.time).getTime() - new Date(a.date + ' ' + a.time).getTime())
      .slice(0, 10);

    return {
      totalCommunications,
      byType,
      byDirection,
      recentCommunications,
    };
  }

  async sendBulkCommunication(request: BulkCommunicationRequest): Promise<CommunicationLog[]> {
    const results: CommunicationLog[] = [];

    for (const recipient of request.recipients) {
      try {
        let communication: CommunicationLog;

        switch (request.type) {
          case CommunicationType.EMAIL:
            if (!recipient.email) continue;
            communication = await this.sendEmail({
              customerId: recipient.customerId,
              leadId: recipient.leadId,
              to: recipient.email,
              subject: request.subject,
              content: request.content,
            });
            break;

          case CommunicationType.SMS:
            if (!recipient.phone) continue;
            communication = await this.sendSMS({
              customerId: recipient.customerId,
              leadId: recipient.leadId,
              to: recipient.phone,
              message: request.content,
            });
            break;

          case CommunicationType.WHATSAPP:
            if (!recipient.phone) continue;
            communication = await this.sendWhatsApp({
              customerId: recipient.customerId,
              leadId: recipient.leadId,
              to: recipient.phone,
              message: request.content,
            });
            break;

          default:
            continue;
        }

        results.push(communication);

        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Failed to send ${request.type} to recipient:`, error);
      }
    }

    return results;
  }

  async scheduleCommunication(data: {
    type: CommunicationType;
    customerId?: string;
    leadId?: string;
    recipient: string;
    subject: string;
    content: string;
    scheduledTime: string;
  }): Promise<string> {
    const scheduleId = Math.random().toString(36).substr(2, 9);
    const scheduledDate = new Date(data.scheduledTime);

    setTimeout(async () => {
      try {
        switch (data.type) {
          case CommunicationType.EMAIL:
            await this.sendEmail({
              customerId: data.customerId,
              leadId: data.leadId,
              to: data.recipient,
              subject: data.subject,
              content: data.content,
            });
            break;

          case CommunicationType.SMS:
            await this.sendSMS({
              customerId: data.customerId,
              leadId: data.leadId,
              to: data.recipient,
              message: data.content,
            });
            break;

          case CommunicationType.WHATSAPP:
            await this.sendWhatsApp({
              customerId: data.customerId,
              leadId: data.leadId,
              to: data.recipient,
              message: data.content,
            });
            break;
        }
      } catch (error) {
        console.error('Scheduled communication failed:', error);
      }
    }, scheduledDate.getTime() - Date.now());

    return scheduleId;
  }

  async markAsFollowedUp(communicationId: string, followUpNotes?: string): Promise<CommunicationLog> {
    const communication = await this.findById(communicationId);
    if (!communication) {
      throw new Error('Communication not found');
    }

    const updatedContent = followUpNotes 
      ? `${communication.content}\n\nFollow-up: ${followUpNotes}`
      : communication.content;

    return await this.update(communicationId, {
      content: updatedContent,
      outcome: 'Followed up',
    } as UpdateCommunicationLogDto);
  }
}