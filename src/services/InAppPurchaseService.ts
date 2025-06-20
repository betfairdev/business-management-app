import { Capacitor } from '@capacitor/core';

export interface Product {
  id: string;
  title: string;
  description: string;
  price: string;
  currency: string;
  type: 'consumable' | 'non_consumable' | 'subscription';
}

export interface Purchase {
  id: string;
  productId: string;
  transactionId: string;
  purchaseTime: Date;
  purchaseState: 'purchased' | 'pending' | 'cancelled';
  receipt: string;
}

export class InAppPurchaseService {
  private products: Product[] = [
    {
      id: 'premium_monthly',
      title: 'Premium Monthly',
      description: 'Unlock all premium features for 1 month',
      price: '$9.99',
      currency: 'USD',
      type: 'subscription',
    },
    {
      id: 'premium_yearly',
      title: 'Premium Yearly',
      description: 'Unlock all premium features for 1 year (Save 20%)',
      price: '$99.99',
      currency: 'USD',
      type: 'subscription',
    },
    {
      id: 'advanced_reports',
      title: 'Advanced Reports',
      description: 'Unlock advanced reporting features',
      price: '$19.99',
      currency: 'USD',
      type: 'non_consumable',
    },
    {
      id: 'extra_storage',
      title: 'Extra Storage',
      description: '10GB additional cloud storage',
      price: '$4.99',
      currency: 'USD',
      type: 'subscription',
    },
  ];

  private purchases: Purchase[] = [];

  async initialize(): Promise<void> {
    if (Capacitor.isNativePlatform()) {
      // Initialize native in-app purchases
      try {
        // This would use a plugin like @capacitor-community/in-app-purchases
        console.log('Initializing native in-app purchases');
      } catch (error) {
        console.error('Failed to initialize in-app purchases:', error);
      }
    } else {
      // Web implementation (could use Stripe, PayPal, etc.)
      console.log('Initializing web payments');
    }
  }

  async getProducts(): Promise<Product[]> {
    return this.products;
  }

  async purchaseProduct(productId: string): Promise<Purchase> {
    const product = this.products.find(p => p.id === productId);
    if (!product) {
      throw new Error('Product not found');
    }

    if (Capacitor.isNativePlatform()) {
      return await this.purchaseNative(product);
    } else {
      return await this.purchaseWeb(product);
    }
  }

  private async purchaseNative(product: Product): Promise<Purchase> {
    // Simulate native purchase flow
    const purchase: Purchase = {
      id: Math.random().toString(36).substr(2, 9),
      productId: product.id,
      transactionId: Math.random().toString(36).substr(2, 9),
      purchaseTime: new Date(),
      purchaseState: 'purchased',
      receipt: 'native_receipt_' + Date.now(),
    };

    this.purchases.push(purchase);
    return purchase;
  }

  private async purchaseWeb(product: Product): Promise<Purchase> {
    // Simulate web purchase flow (would integrate with Stripe, etc.)
    const purchase: Purchase = {
      id: Math.random().toString(36).substr(2, 9),
      productId: product.id,
      transactionId: 'web_' + Math.random().toString(36).substr(2, 9),
      purchaseTime: new Date(),
      purchaseState: 'purchased',
      receipt: 'web_receipt_' + Date.now(),
    };

    this.purchases.push(purchase);
    return purchase;
  }

  async restorePurchases(): Promise<Purchase[]> {
    // In a real implementation, this would restore purchases from the platform
    return this.purchases;
  }

  async getPurchases(): Promise<Purchase[]> {
    return this.purchases;
  }

  async hasPurchased(productId: string): Promise<boolean> {
    return this.purchases.some(p => p.productId === productId && p.purchaseState === 'purchased');
  }

  async isPremiumUser(): Promise<boolean> {
    const premiumProducts = ['premium_monthly', 'premium_yearly'];
    return this.purchases.some(p => 
      premiumProducts.includes(p.productId) && 
      p.purchaseState === 'purchased'
    );
  }
}