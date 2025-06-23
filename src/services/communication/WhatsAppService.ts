export interface WhatsAppMessage {
  id: string;
  to: string;
  message: string;
  type: 'text' | 'image' | 'document' | 'template';
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
  sentAt?: Date;
  deliveredAt?: Date;
  readAt?: Date;
  createdAt: Date;
}

export interface WhatsAppTemplate {
  id: string;
  name: string;
  category: 'marketing' | 'utility' | 'authentication';
  language: string;
  components: Array<{
    type: 'header' | 'body' | 'footer' | 'button';
    text?: string;
    parameters?: string[];
  }>;
}

export class WhatsAppService {
  private messages: WhatsAppMessage[] = [];
  private templates: WhatsAppTemplate[] = [];
  private accessToken: string = '';
  private phoneNumberId: string = '';

  setCredentials(accessToken: string, phoneNumberId: string): void {
    this.accessToken = accessToken;
    this.phoneNumberId = phoneNumberId;
  }

  async sendTextMessage(to: string, message: string): Promise<WhatsAppMessage> {
    const whatsappMessage: WhatsAppMessage = {
      id: Math.random().toString(36).substr(2, 9),
      to,
      message,
      type: 'text',
      status: 'pending',
      createdAt: new Date(),
    };

    try {
      // Simulate API call to WhatsApp Business API
      console.log('Sending WhatsApp message:', whatsappMessage);
      
      whatsappMessage.status = 'sent';
      whatsappMessage.sentAt = new Date();
      
      // Simulate delivery
      setTimeout(() => {
        whatsappMessage.status = 'delivered';
        whatsappMessage.deliveredAt = new Date();
      }, 2000);

    } catch (error) {
      whatsappMessage.status = 'failed';
      console.error('WhatsApp message failed:', error);
    }

    this.messages.push(whatsappMessage);
    return whatsappMessage;
  }

  async sendTemplateMessage(
    to: string,
    templateName: string,
    parameters: Record<string, string>
  ): Promise<WhatsAppMessage> {
    const template = this.templates.find(t => t.name === templateName);
    if (!template) {
      throw new Error('Template not found');
    }

    const whatsappMessage: WhatsAppMessage = {
      id: Math.random().toString(36).substr(2, 9),
      to,
      message: `Template: ${templateName}`,
      type: 'template',
      status: 'pending',
      createdAt: new Date(),
    };

    try {
      console.log('Sending WhatsApp template message:', whatsappMessage);
      
      whatsappMessage.status = 'sent';
      whatsappMessage.sentAt = new Date();

    } catch (error) {
      whatsappMessage.status = 'failed';
      console.error('WhatsApp template message failed:', error);
    }

    this.messages.push(whatsappMessage);
    return whatsappMessage;
  }

  async sendImageMessage(to: string, imageUrl: string, caption?: string): Promise<WhatsAppMessage> {
    const whatsappMessage: WhatsAppMessage = {
      id: Math.random().toString(36).substr(2, 9),
      to,
      message: caption || 'Image',
      type: 'image',
      status: 'pending',
      createdAt: new Date(),
    };

    try {
      console.log('Sending WhatsApp image:', whatsappMessage);
      
      whatsappMessage.status = 'sent';
      whatsappMessage.sentAt = new Date();

    } catch (error) {
      whatsappMessage.status = 'failed';
      console.error('WhatsApp image failed:', error);
    }

    this.messages.push(whatsappMessage);
    return whatsappMessage;
  }

  async sendDocumentMessage(to: string, documentUrl: string, filename: string): Promise<WhatsAppMessage> {
    const whatsappMessage: WhatsAppMessage = {
      id: Math.random().toString(36).substr(2, 9),
      to,
      message: filename,
      type: 'document',
      status: 'pending',
      createdAt: new Date(),
    };

    try {
      console.log('Sending WhatsApp document:', whatsappMessage);
      
      whatsappMessage.status = 'sent';
      whatsappMessage.sentAt = new Date();

    } catch (error) {
      whatsappMessage.status = 'failed';
      console.error('WhatsApp document failed:', error);
    }

    this.messages.push(whatsappMessage);
    return whatsappMessage;
  }

  async getMessages(): Promise<WhatsAppMessage[]> {
    return this.messages.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async createTemplate(template: Omit<WhatsAppTemplate, 'id'>): Promise<WhatsAppTemplate> {
    const newTemplate: WhatsAppTemplate = {
      ...template,
      id: Math.random().toString(36).substr(2, 9),
    };
    
    this.templates.push(newTemplate);
    return newTemplate;
  }

  async getTemplates(): Promise<WhatsAppTemplate[]> {
    return this.templates;
  }

  async sendOrderConfirmation(customerPhone: string, orderNumber: string, orderDetails: string): Promise<void> {
    const message = `🎉 Order Confirmed!\n\nOrder #${orderNumber}\n${orderDetails}\n\nThank you for your business!`;
    await this.sendTextMessage(customerPhone, message);
  }

  async sendDeliveryUpdate(customerPhone: string, trackingNumber: string, status: string): Promise<void> {
    const message = `📦 Delivery Update\n\nTracking: ${trackingNumber}\nStatus: ${status}\n\nTrack your order for real-time updates.`;
    await this.sendTextMessage(customerPhone, message);
  }

  async sendPromotionalMessage(customerPhone: string, offer: string): Promise<void> {
    const message = `🔥 Special Offer!\n\n${offer}\n\nDon't miss out! Visit us today.`;
    await this.sendTextMessage(customerPhone, message);
  }

  async sendInvoice(customerPhone: string, invoiceUrl: string, invoiceNumber: string): Promise<void> {
    await this.sendDocumentMessage(customerPhone, invoiceUrl, `Invoice-${invoiceNumber}.pdf`);
  }

  async sendBulkMessage(recipients: string[], message: string): Promise<WhatsAppMessage[]> {
    const messages: WhatsAppMessage[] = [];

    for (const recipient of recipients) {
      const msg = await this.sendTextMessage(recipient, message);
      messages.push(msg);
      
      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    return messages;
  }
}