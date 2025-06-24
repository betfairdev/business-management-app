import { BaseService } from '../core/BaseService';
import { Opportunity, OpportunityStage } from '../../entities/Opportunity';
import { CreateOpportunityDto } from '../../dtos/CreateOpportunityDto';
import { UpdateOpportunityDto } from '../../dtos/UpdateOpportunityDto';

export interface OpportunityAnalytics {
  totalOpportunities: number;
  totalValue: number;
  averageValue: number;
  winRate: number;
  opportunitiesByStage: Array<{ stage: string; count: number; value: number }>;
  opportunitiesBySource: Array<{ source: string; count: number; value: number }>;
  forecastedRevenue: number;
}

export interface SalesForecast {
  period: string;
  forecastedRevenue: number;
  weightedRevenue: number;
  opportunityCount: number;
  averageDealSize: number;
}

export class OpportunityService extends BaseService<Opportunity, CreateOpportunityDto, UpdateOpportunityDto> {
  constructor() {
    super(Opportunity, CreateOpportunityDto, UpdateOpportunityDto, ['name', 'description', 'notes']);
  }

  async moveToNextStage(opportunityId: string): Promise<Opportunity> {
    const opportunity = await this.findById(opportunityId);
    if (!opportunity) {
      throw new Error('Opportunity not found');
    }

    const stageOrder = [
      OpportunityStage.PROSPECTING,
      OpportunityStage.QUALIFICATION,
      OpportunityStage.PROPOSAL,
      OpportunityStage.NEGOTIATION,
      OpportunityStage.CLOSED_WON,
    ];

    const currentIndex = stageOrder.indexOf(opportunity.stage);
    if (currentIndex < stageOrder.length - 1) {
      const nextStage = stageOrder[currentIndex + 1];
      return await this.update(opportunityId, { stage: nextStage } as UpdateOpportunityDto);
    }

    return opportunity;
  }

  async moveToPreviousStage(opportunityId: string): Promise<Opportunity> {
    const opportunity = await this.findById(opportunityId);
    if (!opportunity) {
      throw new Error('Opportunity not found');
    }

    const stageOrder = [
      OpportunityStage.PROSPECTING,
      OpportunityStage.QUALIFICATION,
      OpportunityStage.PROPOSAL,
      OpportunityStage.NEGOTIATION,
      OpportunityStage.CLOSED_WON,
    ];

    const currentIndex = stageOrder.indexOf(opportunity.stage);
    if (currentIndex > 0) {
      const previousStage = stageOrder[currentIndex - 1];
      return await this.update(opportunityId, { stage: previousStage } as UpdateOpportunityDto);
    }

    return opportunity;
  }

  async markAsWon(opportunityId: string, actualCloseDate?: string): Promise<Opportunity> {
    const updateData: Partial<UpdateOpportunityDto> = {
      stage: OpportunityStage.CLOSED_WON,
      probability: 100,
      actualCloseDate: actualCloseDate || new Date().toISOString().split('T')[0],
    };

    return await this.update(opportunityId, updateData as UpdateOpportunityDto);
  }

  async markAsLost(opportunityId: string, reason?: string): Promise<Opportunity> {
    const opportunity = await this.findById(opportunityId);
    if (!opportunity) {
      throw new Error('Opportunity not found');
    }

    const updateData: Partial<UpdateOpportunityDto> = {
      stage: OpportunityStage.CLOSED_LOST,
      probability: 0,
      actualCloseDate: new Date().toISOString().split('T')[0],
      notes: reason ? `${opportunity.notes || ''}\nLost reason: ${reason}` : opportunity.notes,
    };

    return await this.update(opportunityId, updateData as UpdateOpportunityDto);
  }

  async getOpportunitiesByStage(stage: OpportunityStage): Promise<Opportunity[]> {
    const allOpportunities = await this.findAll();
    return allOpportunities.data.filter(opp => opp.stage === stage);
  }

  async getOpportunityAnalytics(startDate?: string, endDate?: string): Promise<OpportunityAnalytics> {
    const allOpportunities = await this.findAll();
    let opportunities = allOpportunities.data;

    // Filter by date range if provided
    if (startDate || endDate) {
      opportunities = opportunities.filter(opp => {
        const oppDate = opp.createdAt.toISOString().split('T')[0];
        if (startDate && oppDate < startDate) return false;
        if (endDate && oppDate > endDate) return false;
        return true;
      });
    }

    const totalOpportunities = opportunities.length;
    const totalValue = opportunities.reduce((sum, opp) => sum + opp.value, 0);
    const averageValue = totalOpportunities > 0 ? totalValue / totalOpportunities : 0;

    const wonOpportunities = opportunities.filter(opp => opp.stage === OpportunityStage.CLOSED_WON);
    const totalOpportunitiesWithOutcome = opportunities.filter(opp => 
      opp.stage === OpportunityStage.CLOSED_WON || opp.stage === OpportunityStage.CLOSED_LOST
    );
    const winRate = totalOpportunitiesWithOutcome.length > 0 
      ? (wonOpportunities.length / totalOpportunitiesWithOutcome.length) * 100 
      : 0;

    // Group by stage
    const stageMap = new Map<string, { count: number; value: number }>();
    opportunities.forEach(opp => {
      const stage = opp.stage;
      const existing = stageMap.get(stage) || { count: 0, value: 0 };
      existing.count += 1;
      existing.value += opp.value;
      stageMap.set(stage, existing);
    });

    const opportunitiesByStage = Array.from(stageMap.entries()).map(([stage, data]) => ({
      stage,
      count: data.count,
      value: data.value,
    }));

    // Group by source
    const sourceMap = new Map<string, { count: number; value: number }>();
    opportunities.forEach(opp => {
      const source = opp.source || 'Unknown';
      const existing = sourceMap.get(source) || { count: 0, value: 0 };
      existing.count += 1;
      existing.value += opp.value;
      sourceMap.set(source, existing);
    });

    const opportunitiesBySource = Array.from(sourceMap.entries()).map(([source, data]) => ({
      source,
      count: data.count,
      value: data.value,
    }));

    // Calculate forecasted revenue (weighted by probability)
    const activeOpportunities = opportunities.filter(opp => 
      ![OpportunityStage.CLOSED_WON, OpportunityStage.CLOSED_LOST].includes(opp.stage)
    );

    const forecastedRevenue = activeOpportunities.reduce((sum, opp) => {
      return sum + (opp.value * (opp.probability / 100));
    }, 0);

    return {
      totalOpportunities,
      totalValue,
      averageValue,
      winRate,
      opportunitiesByStage,
      opportunitiesBySource,
      forecastedRevenue,
    };
  }

  async getSalesForecast(period: 'month' | 'quarter' | 'year'): Promise<SalesForecast[]> {
    const allOpportunities = await this.findAll();
    const opportunities = allOpportunities.data.filter(opp => 
      ![OpportunityStage.CLOSED_WON, OpportunityStage.CLOSED_LOST].includes(opp.stage) &&
      opp.expectedCloseDate
    );

    const forecastMap = new Map<string, {
      forecastedRevenue: number;
      weightedRevenue: number;
      opportunityCount: number;
      totalValue: number;
    }>();

    opportunities.forEach(opp => {
      const closeDate = new Date(opp.expectedCloseDate!);
      let periodKey: string;

      switch (period) {
        case 'month':
          periodKey = `${closeDate.getFullYear()}-${(closeDate.getMonth() + 1).toString().padStart(2, '0')}`;
          break;
        case 'quarter':
          const quarter = Math.floor(closeDate.getMonth() / 3) + 1;
          periodKey = `${closeDate.getFullYear()}-Q${quarter}`;
          break;
        case 'year':
          periodKey = closeDate.getFullYear().toString();
          break;
      }

      const existing = forecastMap.get(periodKey) || {
        forecastedRevenue: 0,
        weightedRevenue: 0,
        opportunityCount: 0,
        totalValue: 0,
      };

      existing.forecastedRevenue += opp.value;
      existing.weightedRevenue += opp.value * (opp.probability / 100);
      existing.opportunityCount += 1;
      existing.totalValue += opp.value;

      forecastMap.set(periodKey, existing);
    });

    return Array.from(forecastMap.entries()).map(([period, data]) => ({
      period,
      forecastedRevenue: data.forecastedRevenue,
      weightedRevenue: data.weightedRevenue,
      opportunityCount: data.opportunityCount,
      averageDealSize: data.opportunityCount > 0 ? data.totalValue / data.opportunityCount : 0,
    }));
  }

  async updateProbability(opportunityId: string, probability: number): Promise<Opportunity> {
    if (probability < 0 || probability > 100) {
      throw new Error('Probability must be between 0 and 100');
    }

    return await this.update(opportunityId, { probability } as UpdateOpportunityDto);
  }

  async getOpportunitiesClosingSoon(days: number = 30): Promise<Opportunity[]> {
    const allOpportunities = await this.findAll();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() + days);

    return allOpportunities.data.filter(opp => {
      if (!opp.expectedCloseDate) return false;
      if ([OpportunityStage.CLOSED_WON, OpportunityStage.CLOSED_LOST].includes(opp.stage)) return false;
      
      const closeDate = new Date(opp.expectedCloseDate);
      return closeDate <= cutoffDate;
    });
  }
}