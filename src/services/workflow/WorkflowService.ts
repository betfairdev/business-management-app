export interface WorkflowStep {
  id: string;
  name: string;
  type: 'approval' | 'notification' | 'action' | 'condition';
  config: Record<string, any>;
  nextSteps: string[];
  conditions?: Record<string, any>;
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  trigger: string; // e.g., 'sale_created', 'purchase_approved'
  steps: WorkflowStep[];
  isActive: boolean;
}

export interface WorkflowInstance {
  id: string;
  workflowId: string;
  entityId: string;
  entityType: string;
  currentStep: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  data: Record<string, any>;
  createdAt: Date;
  completedAt?: Date;
}

export class WorkflowService {
  private workflows: Workflow[] = [];
  private instances: WorkflowInstance[] = [];

  async createWorkflow(workflow: Omit<Workflow, 'id'>): Promise<Workflow> {
    const newWorkflow: Workflow = {
      ...workflow,
      id: this.generateId(),
    };

    this.workflows.push(newWorkflow);
    return newWorkflow;
  }

  async triggerWorkflow(
    trigger: string,
    entityType: string,
    entityId: string,
    data: Record<string, any>
  ): Promise<WorkflowInstance[]> {
    const applicableWorkflows = this.workflows.filter(
      w => w.trigger === trigger && w.isActive
    );

    const instances: WorkflowInstance[] = [];

    for (const workflow of applicableWorkflows) {
      const instance: WorkflowInstance = {
        id: this.generateId(),
        workflowId: workflow.id,
        entityId,
        entityType,
        currentStep: workflow.steps[0]?.id || '',
        status: 'pending',
        data,
        createdAt: new Date(),
      };

      this.instances.push(instance);
      instances.push(instance);

      // Start processing the workflow
      this.processWorkflowStep(instance);
    }

    return instances;
  }

  async processWorkflowStep(instance: WorkflowInstance): Promise<void> {
    const workflow = this.workflows.find(w => w.id === instance.workflowId);
    if (!workflow) {
      instance.status = 'failed';
      return;
    }

    const currentStep = workflow.steps.find(s => s.id === instance.currentStep);
    if (!currentStep) {
      instance.status = 'completed';
      instance.completedAt = new Date();
      return;
    }

    try {
      await this.executeStep(currentStep, instance);

      // Move to next step
      const nextStepId = this.getNextStep(currentStep, instance);
      if (nextStepId) {
        instance.currentStep = nextStepId;
        // Continue processing
        setTimeout(() => this.processWorkflowStep(instance), 100);
      } else {
        instance.status = 'completed';
        instance.completedAt = new Date();
      }
    } catch (error) {
      console.error('Workflow step failed:', error);
      instance.status = 'failed';
    }
  }

  private async executeStep(step: WorkflowStep, instance: WorkflowInstance): Promise<void> {
    switch (step.type) {
      case 'approval':
        await this.executeApprovalStep(step, instance);
        break;
      case 'notification':
        await this.executeNotificationStep(step, instance);
        break;
      case 'action':
        await this.executeActionStep(step, instance);
        break;
      case 'condition':
        await this.executeConditionStep(step, instance);
        break;
    }
  }

  private async executeApprovalStep(step: WorkflowStep, instance: WorkflowInstance): Promise<void> {
    // Send approval request
    console.log(`Approval required for ${instance.entityType} ${instance.entityId}`);
    
    // In a real implementation, this would:
    // 1. Create an approval request
    // 2. Notify approvers
    // 3. Wait for approval/rejection
    
    // For now, simulate approval
    instance.data.approvalStatus = 'pending';
  }

  private async executeNotificationStep(step: WorkflowStep, instance: WorkflowInstance): Promise<void> {
    const { NotificationService } = await import('../communication/NotificationService');
    const notificationService = new NotificationService();

    await notificationService.sendLocalNotification({
      title: step.config.title || 'Workflow Notification',
      body: step.config.message || `Workflow step completed for ${instance.entityType}`,
      data: { workflowInstanceId: instance.id },
    });
  }

  private async executeActionStep(step: WorkflowStep, instance: WorkflowInstance): Promise<void> {
    // Execute custom action based on step configuration
    const { action, params } = step.config;

    switch (action) {
      case 'update_status':
        // Update entity status
        console.log(`Updating ${instance.entityType} ${instance.entityId} status to ${params.status}`);
        break;
      case 'send_email':
        // Send email
        console.log(`Sending email to ${params.recipient}`);
        break;
      case 'create_task':
        // Create a task
        console.log(`Creating task: ${params.title}`);
        break;
    }
  }

  private async executeConditionStep(step: WorkflowStep, instance: WorkflowInstance): Promise<void> {
    // Evaluate conditions and set next step accordingly
    const { conditions } = step;
    
    for (const [condition, value] of Object.entries(conditions || {})) {
      if (this.evaluateCondition(condition, value, instance)) {
        instance.data.conditionResult = condition;
        break;
      }
    }
  }

  private evaluateCondition(condition: string, expectedValue: any, instance: WorkflowInstance): boolean {
    // Simple condition evaluation
    const actualValue = this.getValueFromPath(condition, instance.data);
    return actualValue === expectedValue;
  }

  private getValueFromPath(path: string, data: any): any {
    return path.split('.').reduce((obj, key) => obj?.[key], data);
  }

  private getNextStep(currentStep: WorkflowStep, instance: WorkflowInstance): string | null {
    if (currentStep.type === 'condition') {
      const conditionResult = instance.data.conditionResult;
      const nextStepMap = currentStep.config.nextSteps || {};
      return nextStepMap[conditionResult] || currentStep.nextSteps[0] || null;
    }

    return currentStep.nextSteps[0] || null;
  }

  async getWorkflowInstances(filters?: {
    workflowId?: string;
    entityType?: string;
    status?: string;
  }): Promise<WorkflowInstance[]> {
    let filtered = [...this.instances];

    if (filters) {
      if (filters.workflowId) {
        filtered = filtered.filter(i => i.workflowId === filters.workflowId);
      }
      if (filters.entityType) {
        filtered = filtered.filter(i => i.entityType === filters.entityType);
      }
      if (filters.status) {
        filtered = filtered.filter(i => i.status === filters.status);
      }
    }

    return filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async approveWorkflowStep(instanceId: string, approved: boolean, comments?: string): Promise<void> {
    const instance = this.instances.find(i => i.id === instanceId);
    if (!instance) {
      throw new Error('Workflow instance not found');
    }

    instance.data.approvalStatus = approved ? 'approved' : 'rejected';
    instance.data.approvalComments = comments;

    if (approved) {
      // Continue workflow
      await this.processWorkflowStep(instance);
    } else {
      // Stop workflow
      instance.status = 'cancelled';
    }
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}