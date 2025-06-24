import { getDataSource } from '../../config/database';
import { Subscription, SubscriptionPlan, SubscriptionStatus } from '../../entities/Subscription';
import { Feature } from '../../entities/Feature';
import { User } from '../../entities/User';

export interface PlanFeatures {
  [key: string]: {
    enabled: boolean;
    limit?: number;
  };
}

export interface SubscriptionInfo {
  subscription: Subscription;
  features: PlanFeatures;
  isActive: boolean;
  daysRemaining: number;
}

export class SubscriptionService {
  private dataSource = getDataSource();

  async createSubscription(data: {
    userId: string;
    plan: SubscriptionPlan;
    duration: number; // days
    amount: number;
    currency: string;
    transactionId?: string;
    paymentMethod?: string;
  }): Promise<Subscription> {
    const subscriptionRepo = this.dataSource.getRepository(Subscription);

    const startDate = new Date().toISOString().split('T')[0];
    const endDate = new Date(Date.now() + data.duration * 24 * 60 * 60 * 1000)
      .toISOString().split('T')[0];

    const features = await this.getPlanFeatures(data.plan);

    const subscription = subscriptionRepo.create({
      user: { id: data.userId },
      plan: data.plan,
      status: SubscriptionStatus.ACTIVE,
      startDate,
      endDate,
      amount: data.amount,
      currency: data.currency,
      transactionId: data.transactionId,
      paymentMethod: data.paymentMethod,
      features: Object.keys(features),
    } as any);

    return await subscriptionRepo.save(subscription);
  }

  async getUserSubscription(userId: string): Promise<SubscriptionInfo | null> {
    const subscriptionRepo = this.dataSource.getRepository(Subscription);

    const subscription = await subscriptionRepo.findOne({
      where: { user: { id: userId } },
      order: { createdAt: 'DESC' },
    });

    if (!subscription) {
      return null;
    }

    const features = await this.getPlanFeatures(subscription.plan);
    const isActive = this.isSubscriptionActive(subscription);
    const daysRemaining = this.getDaysRemaining(subscription);

    return {
      subscription,
      features,
      isActive,
      daysRemaining,
    };
  }

  async hasFeature(userId: string, featureKey: string): Promise<boolean> {
    const subscriptionInfo = await this.getUserSubscription(userId);
    
    if (!subscriptionInfo || !subscriptionInfo.isActive) {
      // Check if feature is available in free plan
      const feature = await this.getFeature(featureKey);
      return feature?.availableInPlans?.includes(SubscriptionPlan.FREE) || false;
    }

    return subscriptionInfo.features[featureKey]?.enabled || false;
  }

  async getFeatureLimit(userId: string, featureKey: string): Promise<number | null> {
    const subscriptionInfo = await this.getUserSubscription(userId);
    
    if (!subscriptionInfo || !subscriptionInfo.isActive) {
      const feature = await this.getFeature(featureKey);
      return feature?.limits?.[SubscriptionPlan.FREE] || null;
    }

    return subscriptionInfo.features[featureKey]?.limit || null;
  }

  async upgradeSubscription(
    userId: string,
    newPlan: SubscriptionPlan,
    duration: number,
    amount: number,
    transactionId?: string
  ): Promise<Subscription> {
    const subscriptionRepo = this.dataSource.getRepository(Subscription);

    // Deactivate current subscription
    await subscriptionRepo.update(
      { user: { id: userId }, status: SubscriptionStatus.ACTIVE },
      { status: SubscriptionStatus.CANCELLED }
    );

    // Create new subscription
    return await this.createSubscription({
      userId,
      plan: newPlan,
      duration,
      amount,
      currency: 'USD',
      transactionId,
    });
  }

  async cancelSubscription(userId: string): Promise<void> {
    const subscriptionRepo = this.dataSource.getRepository(Subscription);

    await subscriptionRepo.update(
      { user: { id: userId }, status: SubscriptionStatus.ACTIVE },
      { status: SubscriptionStatus.CANCELLED }
    );
  }

  async renewSubscription(userId: string, duration: number, amount: number): Promise<Subscription> {
    const current = await this.getUserSubscription(userId);
    if (!current) {
      throw new Error('No active subscription found');
    }

    const subscriptionRepo = this.dataSource.getRepository(Subscription);
    const newEndDate = new Date(Date.now() + duration * 24 * 60 * 60 * 1000)
      .toISOString().split('T')[0];

    await subscriptionRepo.update(current.subscription.id, {
      endDate: newEndDate,
      status: SubscriptionStatus.ACTIVE,
    } as any);

    return await subscriptionRepo.findOne({
      where: { id: current.subscription.id },
    }) as Subscription;
  }

  async checkExpiredSubscriptions(): Promise<void> {
    const subscriptionRepo = this.dataSource.getRepository(Subscription);
    const today = new Date().toISOString().split('T')[0];

    await subscriptionRepo.update(
      { endDate: today, status: SubscriptionStatus.ACTIVE },
      { status: SubscriptionStatus.EXPIRED }
    );
  }

  private async getPlanFeatures(plan: SubscriptionPlan): Promise<PlanFeatures> {
    const featureRepo = this.dataSource.getRepository(Feature);
    const features = await featureRepo.find();

    const planFeatures: PlanFeatures = {};

    features.forEach(feature => {
      const isEnabled = feature.availableInPlans?.includes(plan) || false;
      const limit = feature.limits?.[plan];

      planFeatures[feature.key] = {
        enabled: isEnabled,
        ...(limit && { limit }),
      };
    });

    return planFeatures;
  }

  private async getFeature(key: string): Promise<Feature | null> {
    const featureRepo = this.dataSource.getRepository(Feature);
    return await featureRepo.findOne({ where: { key } });
  }

  private isSubscriptionActive(subscription: Subscription): boolean {
    const today = new Date().toISOString().split('T')[0];
    return subscription.status === SubscriptionStatus.ACTIVE && 
           subscription.endDate >= today;
  }

  private getDaysRemaining(subscription: Subscription): number {
    const today = new Date();
    const endDate = new Date(subscription.endDate);
    const diffTime = endDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  async getAvailablePlans(): Promise<Array<{
    plan: SubscriptionPlan;
    features: string[];
    monthlyPrice: number;
    yearlyPrice: number;
  }>> {
    return [
      {
        plan: SubscriptionPlan.FREE,
        features: ['basic_pos', 'basic_inventory', 'basic_reports'],
        monthlyPrice: 0,
        yearlyPrice: 0,
      },
      {
        plan: SubscriptionPlan.BASIC,
        features: ['advanced_pos', 'inventory_management', 'customer_management', 'basic_reports'],
        monthlyPrice: 29,
        yearlyPrice: 290,
      },
      {
        plan: SubscriptionPlan.PREMIUM,
        features: ['all_modules', 'advanced_reports', 'integrations', 'multi_store'],
        monthlyPrice: 79,
        yearlyPrice: 790,
      },
      {
        plan: SubscriptionPlan.ENTERPRISE,
        features: ['unlimited_everything', 'custom_integrations', 'priority_support'],
        monthlyPrice: 199,
        yearlyPrice: 1990,
      },
    ];
  }
}