import { BaseService } from '../core/BaseService';
import { Feature, FeatureType } from '../../entities/Feature';
import { CreateFeatureDto } from '../../dtos/CreateFeatureDto';
import { UpdateFeatureDto } from '../../dtos/UpdateFeatureDto';
import { SubscriptionPlan } from '../../entities/Subscription';

export interface FeatureAccess {
  hasAccess: boolean;
  limit?: number;
  currentUsage?: number;
  remainingUsage?: number;
}

export interface PlanFeatures {
  [featureKey: string]: {
    enabled: boolean;
    limit?: number;
  };
}

export class FeatureService extends BaseService<Feature, CreateFeatureDto, UpdateFeatureDto> {
  constructor() {
    super(Feature, CreateFeatureDto, UpdateFeatureDto, ['key', 'name', 'description']);
  }

  async checkFeatureAccess(featureKey: string, plan: SubscriptionPlan): Promise<FeatureAccess> {
    const feature = await this.findOneByField('key', featureKey);
    
    if (!feature || !feature.isActive) {
      return { hasAccess: false };
    }

    const hasAccess = feature.availableInPlans?.includes(plan) || false;
    const limit = feature.limits?.[plan];

    return {
      hasAccess,
      limit,
      // currentUsage and remainingUsage would be calculated based on actual usage
    };
  }

  async getPlanFeatures(plan: SubscriptionPlan): Promise<PlanFeatures> {
    const allFeatures = await this.findAll();
    const features = allFeatures.data.filter(f => f.isActive);

    const planFeatures: PlanFeatures = {};

    features.forEach(feature => {
      const enabled = feature.availableInPlans?.includes(plan) || false;
      const limit = feature.limits?.[plan];

      planFeatures[feature.key] = {
        enabled,
        ...(limit !== undefined && { limit }),
      };
    });

    return planFeatures;
  }

  async getFeaturesByType(type: FeatureType): Promise<Feature[]> {
    const allFeatures = await this.findAll();
    return allFeatures.data.filter(f => f.type === type && f.isActive);
  }

  async getModuleFeatures(): Promise<Feature[]> {
    return await this.getFeaturesByType(FeatureType.MODULE);
  }

  async getLimitFeatures(): Promise<Feature[]> {
    return await this.getFeaturesByType(FeatureType.LIMIT);
  }

  async getIntegrationFeatures(): Promise<Feature[]> {
    return await this.getFeaturesByType(FeatureType.INTEGRATION);
  }

  async getAdvancedFeatures(): Promise<Feature[]> {
    return await this.getFeaturesByType(FeatureType.ADVANCED);
  }

  async updateFeatureForPlan(featureKey: string, plan: SubscriptionPlan, enabled: boolean, limit?: number): Promise<Feature> {
    const feature = await this.findOneByField('key', featureKey);
    if (!feature) {
      throw new Error('Feature not found');
    }

    const availableInPlans = feature.availableInPlans || [];
    const limits = feature.limits || {};

    if (enabled) {
      if (!availableInPlans.includes(plan)) {
        availableInPlans.push(plan);
      }
      if (limit !== undefined) {
        limits[plan] = limit;
      }
    } else {
      const index = availableInPlans.indexOf(plan);
      if (index > -1) {
        availableInPlans.splice(index, 1);
      }
      delete limits[plan];
    }

    return await this.update(feature.id, {
      availableInPlans,
      limits,
    } as UpdateFeatureDto);
  }

  async createFeatureSet(features: CreateFeatureDto[]): Promise<Feature[]> {
    return await this.bulkCreate(features);
  }

  async getFeatureUsage(featureKey: string, entityType?: string): Promise<number> {
    // This would calculate actual usage based on the feature type
    // For now, return 0 as a placeholder
    return 0;
  }

  async checkLimit(featureKey: string, plan: SubscriptionPlan, currentUsage?: number): Promise<{
    withinLimit: boolean;
    limit: number;
    usage: number;
    remaining: number;
  }> {
    const feature = await this.findOneByField('key', featureKey);
    if (!feature) {
      throw new Error('Feature not found');
    }

    const limit = feature.limits?.[plan] || 0;
    const usage = currentUsage ?? await this.getFeatureUsage(featureKey);
    const remaining = limit === -1 ? -1 : Math.max(0, limit - usage); // -1 means unlimited

    return {
      withinLimit: limit === -1 || usage < limit,
      limit,
      usage,
      remaining,
    };
  }

  async getFeatureComparison(): Promise<Array<{
    feature: Feature;
    planAvailability: Record<SubscriptionPlan, { enabled: boolean; limit?: number }>;
  }>> {
    const allFeatures = await this.findAll();
    const features = allFeatures.data.filter(f => f.isActive);

    return features.map(feature => {
      const planAvailability: Record<SubscriptionPlan, { enabled: boolean; limit?: number }> = {
        [SubscriptionPlan.FREE]: {
          enabled: feature.availableInPlans?.includes(SubscriptionPlan.FREE) || false,
          limit: feature.limits?.[SubscriptionPlan.FREE],
        },
        [SubscriptionPlan.BASIC]: {
          enabled: feature.availableInPlans?.includes(SubscriptionPlan.BASIC) || false,
          limit: feature.limits?.[SubscriptionPlan.BASIC],
        },
        [SubscriptionPlan.PREMIUM]: {
          enabled: feature.availableInPlans?.includes(SubscriptionPlan.PREMIUM) || false,
          limit: feature.limits?.[SubscriptionPlan.PREMIUM],
        },
        [SubscriptionPlan.ENTERPRISE]: {
          enabled: feature.availableInPlans?.includes(SubscriptionPlan.ENTERPRISE) || false,
          limit: feature.limits?.[SubscriptionPlan.ENTERPRISE],
        },
      };

      return {
        feature,
        planAvailability,
      };
    });
  }

  async toggleFeature(featureKey: string, isActive: boolean): Promise<Feature> {
    const feature = await this.findOneByField('key', featureKey);
    if (!feature) {
      throw new Error('Feature not found');
    }

    return await this.update(feature.id, { isActive } as UpdateFeatureDto);
  }

  async getFeaturesByPlan(plan: SubscriptionPlan): Promise<Feature[]> {
    const allFeatures = await this.findAll();
    return allFeatures.data.filter(f => 
      f.isActive && f.availableInPlans?.includes(plan)
    );
  }
}