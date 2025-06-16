import { BarcodeScanner, SupportedFormat } from '@capacitor-community/barcode-scanner';
import { Capacitor } from '@capacitor/core';

export interface ScanOptions {
  formats?: SupportedFormat[];
  prompt?: string;
  orientation?: 'portrait' | 'landscape';
  showFlipCameraButton?: boolean;
  showTorchButton?: boolean;
  torchOn?: boolean;
  resultDisplayDuration?: number;
}

export interface ScanResult {
  hasContent: boolean;
  content: string;
  format: string;
}

export class ScannerUtil {
  private static isScanning = false;

  static async checkPermissions(): Promise<boolean> {
    try {
      const status = await BarcodeScanner.checkPermission({ force: true });
      return status.granted;
    } catch (error) {
      console.error('Permission check failed:', error);
      return false;
    }
  }

  static async requestPermissions(): Promise<boolean> {
    try {
      const status = await BarcodeScanner.checkPermission({ force: true });
      if (status.granted) return true;

      if (status.denied) {
        // Permission permanently denied, guide user to settings
        alert('Camera permission is required. Please enable it in your device settings.');
        return false;
      }

      // Request permission
      const newStatus = await BarcodeScanner.checkPermission({ force: true });
      return newStatus.granted;
    } catch (error) {
      console.error('Permission request failed:', error);
      return false;
    }
  }

  static async scanQR(options: ScanOptions = {}): Promise<ScanResult> {
    return await this.scan({
      formats: [SupportedFormat.QR_CODE],
      ...options
    });
  }

  static async scanBarcode(options: ScanOptions = {}): Promise<ScanResult> {
    return await this.scan({
      formats: [
        SupportedFormat.CODABAR,
        SupportedFormat.CODE_39,
        SupportedFormat.CODE_93,
        SupportedFormat.CODE_128,
        SupportedFormat.EAN_8,
        SupportedFormat.EAN_13,
        SupportedFormat.UPC_A,
        SupportedFormat.UPC_E
      ],
      ...options
    });
  }

  static async scan(options: ScanOptions = {}): Promise<ScanResult> {
    if (this.isScanning) {
      throw new Error('Scanner is already active');
    }

    if (!Capacitor.isNativePlatform()) {
      // Web fallback - could implement WebRTC camera access
      console.warn('Barcode scanning not available on web platform');
      return { hasContent: false, content: '', format: '' };
    }

    try {
      // Check permissions
      const hasPermission = await this.checkPermissions();
      if (!hasPermission) {
        const granted = await this.requestPermissions();
        if (!granted) {
          throw new Error('Camera permission denied');
        }
      }

      this.isScanning = true;

      // Hide background to show camera
      document.body.classList.add('scanner-active');
      await BarcodeScanner.hideBackground();

      // Start scanning
      const result = await BarcodeScanner.startScan({
        targetedFormats: options.formats || [SupportedFormat.QR_CODE]
      });

      return {
        hasContent: result.hasContent,
        content: result.content || '',
        format: result.format || ''
      };

    } catch (error) {
      console.error('Scan failed:', error);
      throw error;
    } finally {
      await this.stopScan();
    }
  }

  static async stopScan(): Promise<void> {
    try {
      if (this.isScanning) {
        await BarcodeScanner.stopScan();
        await BarcodeScanner.showBackground();
        document.body.classList.remove('scanner-active');
        this.isScanning = false;
      }
    } catch (error) {
      console.error('Stop scan failed:', error);
    }
  }

  static async toggleTorch(): Promise<void> {
    try {
      await BarcodeScanner.toggleTorch();
    } catch (error) {
      console.error('Toggle torch failed:', error);
    }
  }

  static async getTorchState(): Promise<boolean> {
    try {
      const state = await BarcodeScanner.getTorchState();
      return state.isEnabled;
    } catch (error) {
      console.error('Get torch state failed:', error);
      return false;
    }
  }

  static isSupported(): boolean {
    return Capacitor.isNativePlatform();
  }

  static getSupportedFormats(): SupportedFormat[] {
    return Object.values(SupportedFormat);
  }

  // Utility method to parse common barcode formats
  static parseBarcode(content: string, format: string): any {
    switch (format) {
      case SupportedFormat.QR_CODE:
        try {
          // Try to parse as JSON first
          return JSON.parse(content);
        } catch {
          // If not JSON, check for common QR patterns
          if (content.startsWith('http')) {
            return { type: 'url', url: content };
          } else if (content.includes('@')) {
            return { type: 'email', email: content };
          } else if (content.startsWith('tel:')) {
            return { type: 'phone', phone: content.replace('tel:', '') };
          }
          return { type: 'text', text: content };
        }
      
      case SupportedFormat.EAN_13:
      case SupportedFormat.EAN_8:
      case SupportedFormat.UPC_A:
      case SupportedFormat.UPC_E:
        return { type: 'product', code: content, format };
      
      default:
        return { type: 'unknown', content, format };
    }
  }
}

// CSS for scanner overlay
export const scannerStyles = `
  .scanner-active {
    background: transparent !important;
  }
  
  .scanner-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .scanner-frame {
    width: 250px;
    height: 250px;
    border: 2px solid #fff;
    border-radius: 10px;
    position: relative;
  }
  
  .scanner-corners {
    position: absolute;
    width: 20px;
    height: 20px;
    border: 3px solid #00ff00;
  }
  
  .scanner-corners.top-left {
    top: -3px;
    left: -3px;
    border-right: none;
    border-bottom: none;
  }
  
  .scanner-corners.top-right {
    top: -3px;
    right: -3px;
    border-left: none;
    border-bottom: none;
  }
  
  .scanner-corners.bottom-left {
    bottom: -3px;
    left: -3px;
    border-right: none;
    border-top: none;
  }
  
  .scanner-corners.bottom-right {
    bottom: -3px;
    right: -3px;
    border-left: none;
    border-top: none;
  }
`;