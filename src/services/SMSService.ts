export interface SMSProvider {
  name: string;
  apiKey: string;
  apiSecret?: string;
  senderId?: string;
}

export interface SMSMessage {
  id: string;
  to: string;
  message: string;
  status: 'pending' | 'sent' | 'delivered' | 'failed';
  provider: string;
  sentAt?: Date;
  deliveredAt?: Date;
  createdAt: Date;
}

export class SMSService {
  private providers: Map<string, SMSProvider> = new Map();
  private messages: SMSMessage[] = [];
  private defaultProvider: string | null = null;

  addProvider(name: string, provider: SMSProvider): void {
    this.providers.set(name, provider);
    if (!this.defaultProvider) {
      this.defaultProvider = name;
    }
  }

  setDefaultProvider(name: string): void {
    if (this.providers.has(name)) {
      this.defaultProvider = name;
    }
  }

  async sendSMS(to: string, message: string, providerName?: string): Promise<SMSMessage> {
    const provider = providerName || this.defaultProvider;
    if (!provider || !this.providers.has(provider)) {
      throw new Error('No SMS provider configured');
    }

    const sms: SMSMessage = {
      id: Math.random().toString(36).substr(2, 9),
      to,
      message,
      status: 'pending',
      provider,
      createdAt: new Date(),
    };

    try {
      // Simulate SMS sending based on provider
      await this.sendWithProvider(sms, this.providers.get(provider)!);
      sms.status = 'sent';
      sms.sentAt = new Date();
    } catch (error) {
      sms.status = 'failed';
      console.error('SMS sending failed:', error);
    }

    this.messages.push(sms);
    return sms;
  }

  private async sendWithProvider(sms: SMSMessage, provider: SMSProvider): Promise<void> {
    // Simulate different provider implementations
    switch (provider.name.toLowerCase()) {
      case 'twilio':
        await this.sendWithTwilio(sms, provider);
        break;
      case 'nexmo':
      case 'vonage':
        await this.sendWithNexmo(sms, provider);
        break;
      case 'aws':
      case 'sns':
        await this.sendWithAWS(sms, provider);
        break;
      default:
        throw new Error(`Unsupported provider: ${provider.name}`);
    }
  }

  private async sendWithTwilio(sms: SMSMessage, provider: SMSProvider): Promise<void> {
    // Simulate Twilio API call
    console.log('Sending SMS via Twilio:', sms);
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  private async sendWithNexmo(sms: SMSMessage, provider: SMSProvider): Promise<void> {
    // Simulate Nexmo/Vonage API call
    console.log('Sending SMS via Nexmo:', sms);
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  private async sendWithAWS(sms: SMSMessage, provider: SMSProvider): Promise<void> {
    // Simulate AWS SNS API call
    console.log('Sending SMS via AWS SNS:', sms);
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  async getMessages(): Promise<SMSMessage[]> {
    return this.messages.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async sendOrderConfirmation(customerPhone: string, orderNumber: string): Promise<void> {
    const message = `Your order #${orderNumber} has been confirmed. Thank you for your business!`;
    await this.sendSMS(customerPhone, message);
  }

  async sendDeliveryNotification(customerPhone: string, trackingNumber: string): Promise<void> {
    const message = `Your order is out for delivery. Tracking: ${trackingNumber}`;
    await this.sendSMS(customerPhone, message);
  }

  async sendPromotionalMessage(customerPhone: string, offer: string): Promise<void> {
    const message = `Special offer: ${offer}. Visit us today!`;
    await this.sendSMS(customerPhone, message);
  }
}