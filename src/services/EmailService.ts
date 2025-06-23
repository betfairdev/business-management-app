import { BaseService } from './BaseService';

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  variables: string[];
}

export interface EmailAccount {
  id: string;
  email: string;
  provider: 'gmail' | 'outlook' | 'yahoo' | 'smtp';
  settings: {
    host?: string;
    port?: number;
    secure?: boolean;
    username?: string;
    password?: string;
  };
  isDefault: boolean;
}

export interface Email {
  id: string;
  from: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  body: string;
  isHtml: boolean;
  attachments?: File[];
  status: 'draft' | 'sent' | 'failed';
  sentAt?: Date;
  createdAt: Date;
}

export class EmailService {
  private accounts: EmailAccount[] = [];
  private templates: EmailTemplate[] = [];
  private emails: Email[] = [];

  async getAccounts(): Promise<EmailAccount[]> {
    return this.accounts;
  }

  async addAccount(account: Omit<EmailAccount, 'id'>): Promise<EmailAccount> {
    const newAccount: EmailAccount = {
      ...account,
      id: Math.random().toString(36).substr(2, 9),
    };
    this.accounts.push(newAccount);
    return newAccount;
  }

  async removeAccount(id: string): Promise<void> {
    this.accounts = this.accounts.filter(account => account.id !== id);
  }

  async getTemplates(): Promise<EmailTemplate[]> {
    return this.templates;
  }

  async createTemplate(template: Omit<EmailTemplate, 'id'>): Promise<EmailTemplate> {
    const newTemplate: EmailTemplate = {
      ...template,
      id: Math.random().toString(36).substr(2, 9),
    };
    this.templates.push(newTemplate);
    return newTemplate;
  }

  async sendEmail(emailData: Omit<Email, 'id' | 'status' | 'createdAt'>): Promise<Email> {
    const email: Email = {
      ...emailData,
      id: Math.random().toString(36).substr(2, 9),
      status: 'sent',
      sentAt: new Date(),
      createdAt: new Date(),
    };

    // Simulate email sending
    try {
      // In a real implementation, this would integrate with email providers
      console.log('Sending email:', email);
      this.emails.push(email);
      return email;
    } catch (error) {
      email.status = 'failed';
      this.emails.push(email);
      throw error;
    }
  }

  async getEmails(): Promise<Email[]> {
    return this.emails.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async sendInvoiceEmail(invoiceId: string, customerEmail: string): Promise<void> {
    await this.sendEmail({
      from: 'noreply@business.com',
      to: [customerEmail],
      subject: `Invoice #${invoiceId}`,
      body: `Please find your invoice attached.`,
      isHtml: false,
    });
  }

  async sendWelcomeEmail(customerEmail: string, customerName: string): Promise<void> {
    await this.sendEmail({
      from: 'welcome@business.com',
      to: [customerEmail],
      subject: 'Welcome to Our Business!',
      body: `Dear ${customerName}, welcome to our business!`,
      isHtml: true,
    });
  }
}
