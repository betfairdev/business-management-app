import { Capacitor } from '@capacitor/core';

export interface PrintJob {
  id: string;
  type: 'receipt' | 'invoice' | 'label' | 'report';
  content: string;
  printer: PrinterInfo;
  status: 'pending' | 'printing' | 'completed' | 'failed';
  createdAt: Date;
  completedAt?: Date;
}

export interface PrinterInfo {
  id: string;
  name: string;
  type: 'thermal' | 'inkjet' | 'laser';
  connection: 'bluetooth' | 'wifi' | 'usb';
  address?: string; // MAC address for Bluetooth, IP for WiFi
  isDefault: boolean;
  isConnected: boolean;
}

export interface ReceiptData {
  businessName: string;
  businessAddress: string;
  businessPhone: string;
  invoiceNumber: string;
  date: string;
  customerName?: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    total: number;
  }>;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  paymentMethod: string;
}

export class PrintingService {
  private printers: PrinterInfo[] = [];
  private printJobs: PrintJob[] = [];
  private defaultPrinter: PrinterInfo | null = null;

  async discoverPrinters(): Promise<PrinterInfo[]> {
    if (Capacitor.isNativePlatform()) {
      return await this.discoverNativePrinters();
    } else {
      return await this.discoverWebPrinters();
    }
  }

  private async discoverNativePrinters(): Promise<PrinterInfo[]> {
    // Simulate Bluetooth printer discovery
    const bluetoothPrinters: PrinterInfo[] = [
      {
        id: 'bt-printer-1',
        name: 'Thermal Printer BT-001',
        type: 'thermal',
        connection: 'bluetooth',
        address: '00:11:22:33:44:55',
        isDefault: false,
        isConnected: false,
      },
    ];

    // Simulate WiFi printer discovery
    const wifiPrinters: PrinterInfo[] = [
      {
        id: 'wifi-printer-1',
        name: 'Network Printer WiFi-001',
        type: 'inkjet',
        connection: 'wifi',
        address: '192.168.1.100',
        isDefault: false,
        isConnected: false,
      },
    ];

    this.printers = [...bluetoothPrinters, ...wifiPrinters];
    return this.printers;
  }

  private async discoverWebPrinters(): Promise<PrinterInfo[]> {
    // Web printing uses browser's print dialog
    const webPrinter: PrinterInfo = {
      id: 'web-printer',
      name: 'Browser Print',
      type: 'inkjet',
      connection: 'usb',
      isDefault: true,
      isConnected: true,
    };

    this.printers = [webPrinter];
    this.defaultPrinter = webPrinter;
    return this.printers;
  }

  async connectToPrinter(printerId: string): Promise<boolean> {
    const printer = this.printers.find(p => p.id === printerId);
    if (!printer) {
      throw new Error('Printer not found');
    }

    try {
      if (printer.connection === 'bluetooth') {
        await this.connectBluetooth(printer);
      } else if (printer.connection === 'wifi') {
        await this.connectWiFi(printer);
      }

      printer.isConnected = true;
      return true;
    } catch (error) {
      console.error('Failed to connect to printer:', error);
      return false;
    }
  }

  private async connectBluetooth(printer: PrinterInfo): Promise<void> {
    // Simulate Bluetooth connection
    console.log('Connecting to Bluetooth printer:', printer.name);
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  private async connectWiFi(printer: PrinterInfo): Promise<void> {
    // Simulate WiFi connection
    console.log('Connecting to WiFi printer:', printer.name);
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  async setDefaultPrinter(printerId: string): Promise<void> {
    const printer = this.printers.find(p => p.id === printerId);
    if (!printer) {
      throw new Error('Printer not found');
    }

    // Reset all printers
    this.printers.forEach(p => p.isDefault = false);
    
    // Set new default
    printer.isDefault = true;
    this.defaultPrinter = printer;
  }

  async printReceipt(receiptData: ReceiptData, printerId?: string): Promise<PrintJob> {
    const printer = printerId 
      ? this.printers.find(p => p.id === printerId)
      : this.defaultPrinter;

    if (!printer) {
      throw new Error('No printer available');
    }

    if (!printer.isConnected) {
      const connected = await this.connectToPrinter(printer.id);
      if (!connected) {
        throw new Error('Failed to connect to printer');
      }
    }

    const content = this.formatReceipt(receiptData);
    
    const printJob: PrintJob = {
      id: Math.random().toString(36).substr(2, 9),
      type: 'receipt',
      content,
      printer,
      status: 'pending',
      createdAt: new Date(),
    };

    this.printJobs.push(printJob);

    try {
      await this.executePrintJob(printJob);
      printJob.status = 'completed';
      printJob.completedAt = new Date();
    } catch (error) {
      printJob.status = 'failed';
      console.error('Print job failed:', error);
    }

    return printJob;
  }

  async printInvoice(invoiceData: any, printerId?: string): Promise<PrintJob> {
    const printer = printerId 
      ? this.printers.find(p => p.id === printerId)
      : this.defaultPrinter;

    if (!printer) {
      throw new Error('No printer available');
    }

    const content = this.formatInvoice(invoiceData);
    
    const printJob: PrintJob = {
      id: Math.random().toString(36).substr(2, 9),
      type: 'invoice',
      content,
      printer,
      status: 'pending',
      createdAt: new Date(),
    };

    this.printJobs.push(printJob);

    try {
      await this.executePrintJob(printJob);
      printJob.status = 'completed';
      printJob.completedAt = new Date();
    } catch (error) {
      printJob.status = 'failed';
      console.error('Print job failed:', error);
    }

    return printJob;
  }

  async printLabel(labelData: any, printerId?: string): Promise<PrintJob> {
    const printer = printerId 
      ? this.printers.find(p => p.id === printerId)
      : this.defaultPrinter;

    if (!printer) {
      throw new Error('No printer available');
    }

    const content = this.formatLabel(labelData);
    
    const printJob: PrintJob = {
      id: Math.random().toString(36).substr(2, 9),
      type: 'label',
      content,
      printer,
      status: 'pending',
      createdAt: new Date(),
    };

    this.printJobs.push(printJob);

    try {
      await this.executePrintJob(printJob);
      printJob.status = 'completed';
      printJob.completedAt = new Date();
    } catch (error) {
      printJob.status = 'failed';
      console.error('Print job failed:', error);
    }

    return printJob;
  }

  private async executePrintJob(printJob: PrintJob): Promise<void> {
    printJob.status = 'printing';

    if (Capacitor.isNativePlatform()) {
      await this.printNative(printJob);
    } else {
      await this.printWeb(printJob);
    }
  }

  private async printNative(printJob: PrintJob): Promise<void> {
    // Use native printing plugins for Capacitor
    console.log('Printing natively:', printJob);
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  private async printWeb(printJob: PrintJob): Promise<void> {
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      throw new Error('Failed to open print window');
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>Print</title>
          <style>
            body { font-family: monospace; font-size: 12px; margin: 0; padding: 20px; }
            .receipt { max-width: 300px; }
            .center { text-align: center; }
            .line { border-bottom: 1px dashed #000; margin: 10px 0; }
            .item { display: flex; justify-content: space-between; }
          </style>
        </head>
        <body>
          ${printJob.content}
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  }

  private formatReceipt(data: ReceiptData): string {
    return `
      <div class="receipt">
        <div class="center">
          <h2>${data.businessName}</h2>
          <p>${data.businessAddress}</p>
          <p>${data.businessPhone}</p>
        </div>
        <div class="line"></div>
        <p><strong>Invoice: ${data.invoiceNumber}</strong></p>
        <p>Date: ${data.date}</p>
        ${data.customerName ? `<p>Customer: ${data.customerName}</p>` : ''}
        <div class="line"></div>
        ${data.items.map(item => `
          <div class="item">
            <span>${item.name} x${item.quantity}</span>
            <span>${item.total.toFixed(2)}</span>
          </div>
        `).join('')}
        <div class="line"></div>
        <div class="item">
          <span>Subtotal:</span>
          <span>${data.subtotal.toFixed(2)}</span>
        </div>
        ${data.discount > 0 ? `
          <div class="item">
            <span>Discount:</span>
            <span>-${data.discount.toFixed(2)}</span>
          </div>
        ` : ''}
        <div class="item">
          <span>Tax:</span>
          <span>${data.tax.toFixed(2)}</span>
        </div>
        <div class="item">
          <strong>Total: ${data.total.toFixed(2)}</strong>
        </div>
        <div class="line"></div>
        <p>Payment: ${data.paymentMethod}</p>
        <div class="center">
          <p>Thank you for your business!</p>
        </div>
      </div>
    `;
  }

  private formatInvoice(data: any): string {
    // Format invoice for printing
    return `<div>Invoice content for ${data.invoiceNumber}</div>`;
  }

  private formatLabel(data: any): string {
    // Format label for printing
    return `<div>Label content</div>`;
  }

  async getPrintJobs(): Promise<PrintJob[]> {
    return this.printJobs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getPrinters(): Promise<PrinterInfo[]> {
    return this.printers;
  }

  async testPrint(printerId: string): Promise<boolean> {
    try {
      const testData: ReceiptData = {
        businessName: 'Test Business',
        businessAddress: '123 Test St',
        businessPhone: '555-0123',
        invoiceNumber: 'TEST-001',
        date: new Date().toLocaleDateString(),
        items: [
          { name: 'Test Item', quantity: 1, price: 10.00, total: 10.00 }
        ],
        subtotal: 10.00,
        tax: 1.00,
        discount: 0,
        total: 11.00,
        paymentMethod: 'Cash',
      };

      const printJob = await this.printReceipt(testData, printerId);
      return printJob.status === 'completed';
    } catch (error) {
      console.error('Test print failed:', error);
      return false;
    }
  }
}