import { BaseService } from '../core/BaseService';
import { SupplierEvaluation } from '../../entities/SupplierEvaluation';
import { CreateSupplierEvaluationDto } from '../../dtos/CreateSupplierEvaluationDto';
import { UpdateSupplierEvaluationDto } from '../../dtos/UpdateSupplierEvaluationDto';

export interface SupplierPerformanceReport {
  supplier: any;
  evaluationCount: number;
  averageQualityScore: number;
  averageDeliveryScore: number;
  averageServiceScore: number;
  averagePriceScore: number;
  overallRating: number;
  averageOnTimeDeliveryRate: number;
  trend: 'improving' | 'declining' | 'stable';
  lastEvaluationDate: string;
}

export interface EvaluationSummary {
  totalEvaluations: number;
  averageOverallRating: number;
  topPerformingSuppliers: Array<{ supplier: any; rating: number }>;
  improvementAreas: Array<{ area: string; averageScore: number }>;
}

export class SupplierEvaluationService extends BaseService<SupplierEvaluation, CreateSupplierEvaluationDto, UpdateSupplierEvaluationDto> {
  constructor() {
    super(SupplierEvaluation, CreateSupplierEvaluationDto, UpdateSupplierEvaluationDto, ['comments']);
  }

  async create(createDto: CreateSupplierEvaluationDto): Promise<SupplierEvaluation> {
    // Calculate overall rating
    const overallRating = (
      createDto.qualityScore + 
      createDto.deliveryScore + 
      createDto.serviceScore + 
      createDto.priceScore
    ) / 4;

    const evaluationData = {
      ...createDto,
      overallRating,
    };

    return await super.create(evaluationData as CreateSupplierEvaluationDto);
  }

  async findById(id: string): Promise<SupplierEvaluation | null> {
    return await this.repository.findOne({
      where: { id } as any,
      relations: ['supplier', 'evaluator'],
    });
  }

  async getEvaluationsBySupplier(supplierId: string): Promise<SupplierEvaluation[]> {
    const allEvaluations = await this.findAll();
    return allEvaluations.data
      .filter(evaluation => evaluation.supplier?.id === supplierId)
      .sort((a, b) => new Date(b.evaluationDate).getTime() - new Date(a.evaluationDate).getTime());
  }

  async getLatestEvaluationBySupplier(supplierId: string): Promise<SupplierEvaluation | null> {
    const evaluations = await this.getEvaluationsBySupplier(supplierId);
    return evaluations.length > 0 ? evaluations[0] : null;
  }

  async getSupplierPerformanceReport(supplierId: string): Promise<SupplierPerformanceReport | null> {
    const evaluations = await this.getEvaluationsBySupplier(supplierId);
    
    if (evaluations.length === 0) {
      return null;
    }

    const supplier = evaluations[0].supplier;
    const evaluationCount = evaluations.length;

    // Calculate averages
    const averageQualityScore = evaluations.reduce((sum, e) => sum + e.qualityScore, 0) / evaluationCount;
    const averageDeliveryScore = evaluations.reduce((sum, e) => sum + e.deliveryScore, 0) / evaluationCount;
    const averageServiceScore = evaluations.reduce((sum, e) => sum + e.serviceScore, 0) / evaluationCount;
    const averagePriceScore = evaluations.reduce((sum, e) => sum + e.priceScore, 0) / evaluationCount;
    const overallRating = evaluations.reduce((sum, e) => sum + e.overallRating, 0) / evaluationCount;
    const averageOnTimeDeliveryRate = evaluations.reduce((sum, e) => sum + e.onTimeDeliveryRate, 0) / evaluationCount;

    // Calculate trend (simplified)
    let trend: 'improving' | 'declining' | 'stable' = 'stable';
    if (evaluations.length >= 2) {
      const recent = evaluations.slice(0, Math.ceil(evaluations.length / 2));
      const older = evaluations.slice(Math.ceil(evaluations.length / 2));
      
      const recentAvg = recent.reduce((sum, e) => sum + e.overallRating, 0) / recent.length;
      const olderAvg = older.reduce((sum, e) => sum + e.overallRating, 0) / older.length;
      
      if (recentAvg > olderAvg + 0.5) {
        trend = 'improving';
      } else if (recentAvg < olderAvg - 0.5) {
        trend = 'declining';
      }
    }

    return {
      supplier,
      evaluationCount,
      averageQualityScore,
      averageDeliveryScore,
      averageServiceScore,
      averagePriceScore,
      overallRating,
      averageOnTimeDeliveryRate,
      trend,
      lastEvaluationDate: evaluations[0].evaluationDate,
    };
  }

  async getEvaluationSummary(startDate?: string, endDate?: string): Promise<EvaluationSummary> {
    const allEvaluations = await this.findAll();
    let evaluations = allEvaluations.data;

    // Filter by date range if provided
    if (startDate || endDate) {
      evaluations = evaluations.filter(evaluation => {
        if (startDate && evaluation.evaluationDate < startDate) return false;
        if (endDate && evaluation.evaluationDate > endDate) return false;
        return true;
      });
    }

    const totalEvaluations = evaluations.length;
    const averageOverallRating = totalEvaluations > 0 
      ? evaluations.reduce((sum, e) => sum + e.overallRating, 0) / totalEvaluations 
      : 0;

    // Get top performing suppliers
    const supplierRatings = new Map<string, { supplier: any; ratings: number[]; totalRating: number }>();
    
    evaluations.forEach(evaluation => {
      const supplierId = evaluation.supplier?.id;
      if (!supplierId) return;

      const existing = supplierRatings.get(supplierId) || {
        supplier: evaluation.supplier,
        ratings: [],
        totalRating: 0,
      };

      existing.ratings.push(evaluation.overallRating);
      existing.totalRating += evaluation.overallRating;
      supplierRatings.set(supplierId, existing);
    });

    const topPerformingSuppliers = Array.from(supplierRatings.values())
      .map(data => ({
        supplier: data.supplier,
        rating: data.totalRating / data.ratings.length,
      }))
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 5);

    // Calculate improvement areas
    const improvementAreas = [
      {
        area: 'Quality',
        averageScore: totalEvaluations > 0 
          ? evaluations.reduce((sum, e) => sum + e.qualityScore, 0) / totalEvaluations 
          : 0,
      },
      {
        area: 'Delivery',
        averageScore: totalEvaluations > 0 
          ? evaluations.reduce((sum, e) => sum + e.deliveryScore, 0) / totalEvaluations 
          : 0,
      },
      {
        area: 'Service',
        averageScore: totalEvaluations > 0 
          ? evaluations.reduce((sum, e) => sum + e.serviceScore, 0) / totalEvaluations 
          : 0,
      },
      {
        area: 'Price',
        averageScore: totalEvaluations > 0 
          ? evaluations.reduce((sum, e) => sum + e.priceScore, 0) / totalEvaluations 
          : 0,
      },
    ].sort((a, b) => a.averageScore - b.averageScore);

    return {
      totalEvaluations,
      averageOverallRating,
      topPerformingSuppliers,
      improvementAreas,
    };
  }

  async compareSuppliers(supplierIds: string[]): Promise<Array<{
    supplier: any;
    averageRating: number;
    strengths: string[];
    weaknesses: string[];
  }>> {
    const comparisons = [];

    for (const supplierId of supplierIds) {
      const evaluations = await this.getEvaluationsBySupplier(supplierId);
      
      if (evaluations.length === 0) continue;

      const supplier = evaluations[0].supplier;
      const averageRating = evaluations.reduce((sum, e) => sum + e.overallRating, 0) / evaluations.length;

      // Calculate average scores for each category
      const avgQuality = evaluations.reduce((sum, e) => sum + e.qualityScore, 0) / evaluations.length;
      const avgDelivery = evaluations.reduce((sum, e) => sum + e.deliveryScore, 0) / evaluations.length;
      const avgService = evaluations.reduce((sum, e) => sum + e.serviceScore, 0) / evaluations.length;
      const avgPrice = evaluations.reduce((sum, e) => sum + e.priceScore, 0) / evaluations.length;

      const scores = [
        { category: 'Quality', score: avgQuality },
        { category: 'Delivery', score: avgDelivery },
        { category: 'Service', score: avgService },
        { category: 'Price', score: avgPrice },
      ];

      const strengths = scores.filter(s => s.score >= 8).map(s => s.category);
      const weaknesses = scores.filter(s => s.score < 6).map(s => s.category);

      comparisons.push({
        supplier,
        averageRating,
        strengths,
        weaknesses,
      });
    }

    return comparisons.sort((a, b) => b.averageRating - a.averageRating);
  }

  async getEvaluationsByEvaluator(evaluatorId: string): Promise<SupplierEvaluation[]> {
    const allEvaluations = await this.findAll();
    return allEvaluations.data
      .filter(evaluation => evaluation.evaluator?.id === evaluatorId)
      .sort((a, b) => new Date(b.evaluationDate).getTime() - new Date(a.evaluationDate).getTime());
  }

  async scheduleEvaluationReminder(supplierId: string, reminderDate: string): Promise<string> {
    // This would integrate with a notification system
    const reminderId = Math.random().toString(36).substr(2, 9);
    
    // Store reminder (in a real implementation, this would be in the database)
    localStorage.setItem(`evaluation_reminder_${reminderId}`, JSON.stringify({
      supplierId,
      reminderDate,
      createdAt: new Date().toISOString(),
    }));

    return reminderId;
  }
}