// import { Order, Task, CNCTask } from '@/types/Order';
// import { DrawingCode } from '@/types/DrawingCode';

// // Enhanced types for process optimization
// export interface ProcessOptimizationResult {
//     orderId: string;
//     estimatedDuration: number; // in minutes
//     estimatedCost: number;
//     efficiency: number; // percentage
//     tasks: OptimizedTask[];
//     machineUtilization: MachineUtilization[];
//     operatorWorkload: OperatorWorkload[];
//     bottlenecks: Bottleneck[];
// }

// export interface OptimizedTask extends Omit<CNCTask, 'id'> {
//     id: string;
//     sequence: number;
//     dependencies: string[];
//     recommendedMachine: {
//         machineId: string;
//         machineName: string;
//         efficiency: number;
//         availability: boolean;
//     };
//     recommendedOperator: {
//         operatorId: string;
//         operatorName: string;
//         skillMatch: number; // percentage
//         availability: boolean;
//         currentWorkload: number;
//     };
//     optimizationScore: number; // overall optimization score
//     alternatives: {
//         machines: Array<{ machineId: string; score: number; reason: string }>;
//         operators: Array<{ operatorId: string; score: number; reason: string }>;
//     };
// }

// export interface MachineUtilization {
//     machineId: string;
//     machineName: string;
//     utilizationRate: number; // percentage
//     scheduledHours: number;
//     availableHours: number;
//     efficiency: number;
//     tasks: string[]; // task IDs
// }

// export interface OperatorWorkload {
//     operatorId: string;
//     operatorName: string;
//     workloadHours: number;
//     availableHours: number;
//     utilizationRate: number; // percentage
//     skillUtilization: {
//         [skill: string]: number; // hours per skill
//     };
//     tasks: string[]; // task IDs
// }

// export interface Bottleneck {
//     type: 'machine' | 'operator' | 'dependency' | 'material';
//     resourceId: string;
//     resourceName: string;
//     impact: 'low' | 'medium' | 'high' | 'critical';
//     delayHours: number;
//     affectedTasks: string[];
//     suggestions: string[];
// }

// // Machine scoring criteria
// export interface MachineCapability {
//     machineId: string;
//     capabilities: string[];
//     efficiency: number; // base efficiency percentage
//     setupTime: number; // minutes
//     hourlyRate: number;
//     maintenanceScore: number; // reliability score
//     currentLoad: number; // current utilization percentage
// }

// // Operator scoring criteria
// export interface OperatorCapability {
//     operatorId: string;
//     skills: string[];
//     experienceLevel: number; // 1-10
//     efficiency: number; // base efficiency percentage
//     hourlyRate: number;
//     currentWorkload: number; // hours this week
//     maxWorkload: number; // max hours per week
//     certifications: string[];
// }

// // Process optimization parameters
// export interface OptimizationConfig {
//     prioritizeEfficiency: boolean;
//     prioritizeCost: boolean;
//     prioritizeSpeed: boolean;
//     maxParallelTasks: number;
//     setupTimeThreshold: number; // minutes
//     skillMatchThreshold: number; // minimum percentage
//     workloadBalancing: boolean;
// }

// // Process Optimization Service Class
// export class ProcessOptimizationService {
//     private machines: MachineCapability[] = [];
//     private operators: OperatorCapability[] = [];
//     private drawingCodes: DrawingCode[] = [];

//     constructor(
//         machines: MachineCapability[],
//         operators: OperatorCapability[],
//         drawingCodes: DrawingCode[]
//     ) {
//         this.machines = machines;
//         this.operators = operators;
//         this.drawingCodes = drawingCodes;
//     }

//     /**
//      * Main optimization method - breaks down order into optimized tasks
//      */
//     async optimizeOrder(
//         order: Order,
//         config: OptimizationConfig = this.getDefaultConfig()
//     ): Promise<ProcessOptimizationResult> {
//         // 1. Analyze order requirements
//         const orderAnalysis = this.analyzeOrderRequirements(order);
        
//         // 2. Generate task sequence from drawing codes
//         const baseTasks = this.generateTasksFromOrder(order);
        
//         // 3. Optimize machine assignments
//         const optimizedTasks = await this.optimizeTaskAssignments(baseTasks, config);
        
//         // 4. Calculate resource utilization
//         const machineUtilization = this.calculateMachineUtilization(optimizedTasks);
//         const operatorWorkload = this.calculateOperatorWorkload(optimizedTasks);
        
//         // 5. Identify bottlenecks
//         const bottlenecks = this.identifyBottlenecks(optimizedTasks, machineUtilization, operatorWorkload);
        
//         // 6. Calculate overall metrics
//         const result: ProcessOptimizationResult = {
//             orderId: order.id,
//             estimatedDuration: this.calculateTotalDuration(optimizedTasks),
//             estimatedCost: this.calculateTotalCost(optimizedTasks),
//             efficiency: this.calculateOverallEfficiency(optimizedTasks),
//             tasks: optimizedTasks,
//             machineUtilization,
//             operatorWorkload,
//             bottlenecks
//         };

//         return result;
//     }

//     /**
//      * Analyze order requirements and complexity
//      */
//     private analyzeOrderRequirements(order: Order) {
//         return {
//             complexity: this.calculateOrderComplexity(order),
//             requiredSkills: this.extractRequiredSkills(order),
//             estimatedHours: this.estimateOrderHours(order),
//             criticalPath: this.identifyCriticalPath(order)
//         };
//     }

//     /**
//      * Generate initial tasks from order and drawing codes
//      */
//     private generateTasksFromOrder(order: Order): OptimizedTask[] {
//         const tasks: OptimizedTask[] = [];
        
//         order.tasks.forEach((task, index) => {
//             const drawingCode = this.drawingCodes.find(dc => dc.id === task.drawingCodeId);
//             if (!drawingCode) return;

//             // Generate CNC tasks based on drawing code steps
//             drawingCode.steps.forEach((step, stepIndex) => {
//                 const optimizedTask: OptimizedTask = {
//                     id: `${task.id}-step-${stepIndex}`,
//                     title: `${task.title} - ${step.name}`,
//                     description: step.description,
//                     status: 'to_do',
//                     priority: task.priority,
//                     drawingCodeId: drawingCode.id,
//                     drawingCode: {
//                         id: drawingCode.id,
//                         code: drawingCode.code,
//                         name: drawingCode.name,
//                         category: drawingCode.category
//                     },
//                     machineId: undefined,
//                     machineName: undefined,
//                     assignedOperatorId: undefined,
//                     assignedOperator: undefined,
//                     estimatedHours: step.estimatedMinutes / 60,
//                     actualHours: 0,
//                     quantity: task.quantity,
//                     unitPrice: task.unitPrice,
//                     totalPrice: task.totalPrice,
//                     dueDate: new Date(order.expectedDeliveryDate),
//                     createdAt: new Date(),
//                     updatedAt: new Date(),
//                     progressPercentage: 0,
//                     orderId: order.id,
//                     orderNumber: order.orderNumber,
//                     sequence: index * 100 + stepIndex,
//                     dependencies: step.dependencies,
//                     recommendedMachine: {
//                         machineId: '',
//                         machineName: '',
//                         efficiency: 0,
//                         availability: false
//                     },
//                     recommendedOperator: {
//                         operatorId: '',
//                         operatorName: '',
//                         skillMatch: 0,
//                         availability: false,
//                         currentWorkload: 0
//                     },
//                     optimizationScore: 0,
//                     alternatives: {
//                         machines: [],
//                         operators: []
//                     }
//                 };
                
//                 tasks.push(optimizedTask);
//             });
//         });

//         return tasks;
//     }

//     /**
//      * Optimize machine and operator assignments for tasks
//      */
//     private async optimizeTaskAssignments(
//         tasks: OptimizedTask[],
//         config: OptimizationConfig
//     ): Promise<OptimizedTask[]> {
//         const optimizedTasks = [...tasks];
        
//         for (const task of optimizedTasks) {
//             // Find best machine for this task
//             const machineRecommendation = this.findBestMachine(task, config);
//             task.recommendedMachine = machineRecommendation.best;
//             task.alternatives.machines = machineRecommendation.alternatives;
            
//             // Find best operator for this task
//             const operatorRecommendation = this.findBestOperator(task, config);
//             task.recommendedOperator = operatorRecommendation.best;
//             task.alternatives.operators = operatorRecommendation.alternatives;
            
//             // Calculate overall optimization score
//             task.optimizationScore = this.calculateTaskOptimizationScore(task, config);
//         }

//         // Optimize task sequencing to minimize setup times
//         return this.optimizeTaskSequencing(optimizedTasks, config);
//     }

//     /**
//      * Find the best machine for a given task
//      */
//     private findBestMachine(task: OptimizedTask, config: OptimizationConfig) {
//         const drawingCode = this.drawingCodes.find(dc => dc.id === task.drawingCodeId);
//         const requiredCapabilities = drawingCode?.steps[0]?.equipment || [];
        
//         const machineScores = this.machines.map(machine => {
//             const score = this.calculateMachineScore(machine, requiredCapabilities, config);
//             return {
//                 machineId: machine.machineId,
//                 score,
//                 reason: this.getMachineScoreReason(machine, score, config)
//             };
//         }).sort((a, b) => b.score - a.score);

//         const bestMachine = this.machines.find(m => m.machineId === machineScores[0]?.machineId);
        
//         return {
//             best: {
//                 machineId: bestMachine?.machineId || '',
//                 machineName: bestMachine?.machineId || 'No suitable machine',
//                 efficiency: bestMachine?.efficiency || 0,
//                 availability: (bestMachine?.currentLoad || 100) < 80
//             },
//             alternatives: machineScores.slice(1, 4)
//         };
//     }

//     /**
//      * Find the best operator for a given task
//      */
//     private findBestOperator(task: OptimizedTask, config: OptimizationConfig) {
//         const drawingCode = this.drawingCodes.find(dc => dc.id === task.drawingCodeId);
//         const requiredSkills = drawingCode?.steps[0]?.requiredSkills || [];
        
//         const operatorScores = this.operators.map(operator => {
//             const score = this.calculateOperatorScore(operator, requiredSkills, config);
//             return {
//                 operatorId: operator.operatorId,
//                 score,
//                 reason: this.getOperatorScoreReason(operator, score, config)
//             };
//         }).sort((a, b) => b.score - a.score);

//         const bestOperator = this.operators.find(o => o.operatorId === operatorScores[0]?.operatorId);
        
//         return {
//             best: {
//                 operatorId: bestOperator?.operatorId || '',
//                 operatorName: bestOperator?.operatorId || 'No suitable operator',
//                 skillMatch: this.calculateSkillMatch(bestOperator?.skills || [], requiredSkills),
//                 availability: (bestOperator?.currentWorkload || 0) < (bestOperator?.maxWorkload || 40),
//                 currentWorkload: bestOperator?.currentWorkload || 0
//             },
//             alternatives: operatorScores.slice(1, 4)
//         };
//     }

//     /**
//      * Calculate machine scoring based on capabilities and config
//      */
//     private calculateMachineScore(
//         machine: MachineCapability,
//         requiredCapabilities: string[],
//         config: OptimizationConfig
//     ): number {
//         let score = 0;
        
//         // Capability match (40% weight)
//         const capabilityMatch = this.calculateCapabilityMatch(machine.capabilities, requiredCapabilities);
//         score += capabilityMatch * 0.4;
        
//         // Efficiency (25% weight)
//         if (config.prioritizeEfficiency) {
//             score += (machine.efficiency / 100) * 0.25;
//         }
        
//         // Availability (20% weight)
//         const availability = Math.max(0, (100 - machine.currentLoad) / 100);
//         score += availability * 0.2;
        
//         // Cost effectiveness (15% weight)
//         if (config.prioritizeCost) {
//             const costScore = Math.max(0, (200 - machine.hourlyRate) / 200);
//             score += costScore * 0.15;
//         }
        
//         return score * 100;
//     }

//     /**
//      * Calculate operator scoring based on skills and config
//      */
//     private calculateOperatorScore(
//         operator: OperatorCapability,
//         requiredSkills: string[],
//         config: OptimizationConfig
//     ): number {
//         let score = 0;
        
//         // Skill match (40% weight)
//         const skillMatch = this.calculateSkillMatch(operator.skills, requiredSkills);
//         score += skillMatch * 0.4;
        
//         // Experience level (25% weight)
//         score += (operator.experienceLevel / 10) * 0.25;
        
//         // Availability (20% weight)
//         const availability = Math.max(0, (operator.maxWorkload - operator.currentWorkload) / operator.maxWorkload);
//         score += availability * 0.2;
        
//         // Efficiency (15% weight)
//         if (config.prioritizeEfficiency) {
//             score += (operator.efficiency / 100) * 0.15;
//         }
        
//         return score * 100;
//     }

//     // Helper methods
//     private calculateCapabilityMatch(machineCapabilities: string[], required: string[]): number {
//         if (required.length === 0) return 1;
//         const matches = required.filter(cap => machineCapabilities.includes(cap)).length;
//         return matches / required.length;
//     }

//     private calculateSkillMatch(operatorSkills: string[], required: string[]): number {
//         if (required.length === 0) return 1;
//         const matches = required.filter(skill => operatorSkills.includes(skill)).length;
//         return matches / required.length;
//     }

//     private calculateTaskOptimizationScore(task: OptimizedTask, config: OptimizationConfig): number {
//         const machineScore = this.machines.find(m => m.machineId === task.recommendedMachine.machineId)?.efficiency || 0;
//         const operatorScore = this.operators.find(o => o.operatorId === task.recommendedOperator.operatorId)?.efficiency || 0;
//         return (machineScore + operatorScore) / 2;
//     }

//     private optimizeTaskSequencing(tasks: OptimizedTask[], config: OptimizationConfig): OptimizedTask[] {
//         // Sort tasks by dependencies first, then by optimization score
//         return tasks.sort((a, b) => {
//             if (a.dependencies.includes(b.id)) return 1;
//             if (b.dependencies.includes(a.id)) return -1;
//             return b.optimizationScore - a.optimizationScore;
//         });
//     }

//     private calculateMachineUtilization(tasks: OptimizedTask[]): MachineUtilization[] {
//         const utilization: Map<string, MachineUtilization> = new Map();
        
//         this.machines.forEach(machine => {
//             const machineTasks = tasks.filter(t => t.recommendedMachine.machineId === machine.machineId);
//             const scheduledHours = machineTasks.reduce((sum, t) => sum + t.estimatedHours, 0);
//             const availableHours = 40; // 40 hours per week
            
//             utilization.set(machine.machineId, {
//                 machineId: machine.machineId,
//                 machineName: machine.machineId,
//                 utilizationRate: Math.min(100, (scheduledHours / availableHours) * 100),
//                 scheduledHours,
//                 availableHours,
//                 efficiency: machine.efficiency,
//                 tasks: machineTasks.map(t => t.id)
//             });
//         });
        
//         return Array.from(utilization.values());
//     }

//     private calculateOperatorWorkload(tasks: OptimizedTask[]): OperatorWorkload[] {
//         const workload: Map<string, OperatorWorkload> = new Map();
        
//         this.operators.forEach(operator => {
//             const operatorTasks = tasks.filter(t => t.recommendedOperator.operatorId === operator.operatorId);
//             const workloadHours = operatorTasks.reduce((sum, t) => sum + t.estimatedHours, 0);
            
//             workload.set(operator.operatorId, {
//                 operatorId: operator.operatorId,
//                 operatorName: operator.operatorId,
//                 workloadHours,
//                 availableHours: operator.maxWorkload,
//                 utilizationRate: Math.min(100, (workloadHours / operator.maxWorkload) * 100),
//                 skillUtilization: this.calculateSkillUtilization(operator, operatorTasks),
//                 tasks: operatorTasks.map(t => t.id)
//             });
//         });
        
//         return Array.from(workload.values());
//     }

//     private calculateSkillUtilization(operator: OperatorCapability, tasks: OptimizedTask[]) {
//         const skillHours: { [skill: string]: number } = {};
//         operator.skills.forEach(skill => {
//             skillHours[skill] = tasks
//                 .filter(t => this.drawingCodes.find(dc => dc.id === t.drawingCodeId)?.steps[0]?.requiredSkills?.includes(skill))
//                 .reduce((sum, t) => sum + t.estimatedHours, 0);
//         });
//         return skillHours;
//     }

//     private identifyBottlenecks(
//         tasks: OptimizedTask[],
//         machineUtilization: MachineUtilization[],
//         operatorWorkload: OperatorWorkload[]
//     ): Bottleneck[] {
//         const bottlenecks: Bottleneck[] = [];
        
//         // Machine bottlenecks
//         machineUtilization.forEach(machine => {
//             if (machine.utilizationRate > 95) {
//                 bottlenecks.push({
//                     type: 'machine',
//                     resourceId: machine.machineId,
//                     resourceName: machine.machineName,
//                     impact: machine.utilizationRate > 100 ? 'critical' : 'high',
//                     delayHours: Math.max(0, machine.scheduledHours - machine.availableHours),
//                     affectedTasks: machine.tasks,
//                     suggestions: [
//                         'Consider adding overtime shifts',
//                         'Look for alternative machines',
//                         'Reschedule non-critical tasks'
//                     ]
//                 });
//             }
//         });
        
//         // Operator bottlenecks
//         operatorWorkload.forEach(operator => {
//             if (operator.utilizationRate > 95) {
//                 bottlenecks.push({
//                     type: 'operator',
//                     resourceId: operator.operatorId,
//                     resourceName: operator.operatorName,
//                     impact: operator.utilizationRate > 100 ? 'critical' : 'high',
//                     delayHours: Math.max(0, operator.workloadHours - operator.availableHours),
//                     affectedTasks: operator.tasks,
//                     suggestions: [
//                         'Cross-train other operators',
//                         'Consider overtime or additional shifts',
//                         'Reassign less critical tasks'
//                     ]
//                 });
//             }
//         });
        
//         return bottlenecks;
//     }

//     private calculateTotalDuration(tasks: OptimizedTask[]): number {
//         // Simple sequential duration for now - could be enhanced with parallel processing
//         return tasks.reduce((sum, task) => sum + task.estimatedHours * 60, 0);
//     }

//     private calculateTotalCost(tasks: OptimizedTask[]): number {
//         return tasks.reduce((sum, task) => {
//             const machine = this.machines.find(m => m.machineId === task.recommendedMachine.machineId);
//             const operator = this.operators.find(o => o.operatorId === task.recommendedOperator.operatorId);
            
//             const machineCost = (machine?.hourlyRate || 0) * task.estimatedHours;
//             const operatorCost = (operator?.hourlyRate || 0) * task.estimatedHours;
            
//             return sum + machineCost + operatorCost;
//         }, 0);
//     }

//     private calculateOverallEfficiency(tasks: OptimizedTask[]): number {
//         if (tasks.length === 0) return 0;
//         const totalScore = tasks.reduce((sum, task) => sum + task.optimizationScore, 0);
//         return totalScore / tasks.length;
//     }

//     // Utility methods
//     private calculateOrderComplexity(order: Order): number {
//         return order.tasks.length * 10 + (order.estimatedHours / 8);
//     }

//     private extractRequiredSkills(order: Order): string[] {
//         const skills: Set<string> = new Set();
//         order.tasks.forEach(task => {
//             const drawingCode = this.drawingCodes.find(dc => dc.id === task.drawingCodeId);
//             drawingCode?.steps.forEach(step => {
//                 step.requiredSkills.forEach(skill => skills.add(skill));
//             });
//         });
//         return Array.from(skills);
//     }

//     private estimateOrderHours(order: Order): number {
//         return order.estimatedHours;
//     }

//     private identifyCriticalPath(order: Order): string[] {
//         // Simplified critical path - would need proper algorithm for complex dependencies
//         return order.tasks.map(t => t.id);
//     }

//     private getMachineScoreReason(machine: MachineCapability, score: number, config: OptimizationConfig): string {
//         if (score > 80) return 'Excellent match - high efficiency and availability';
//         if (score > 60) return 'Good match - suitable capabilities';
//         if (score > 40) return 'Fair match - some limitations';
//         return 'Poor match - consider alternatives';
//     }

//     private getOperatorScoreReason(operator: OperatorCapability, score: number, config: OptimizationConfig): string {
//         if (score > 80) return 'Excellent match - high skills and availability';
//         if (score > 60) return 'Good match - suitable skills';
//         if (score > 40) return 'Fair match - may need supervision';
//         return 'Poor match - requires training';
//     }

//     private getDefaultConfig(): OptimizationConfig {
//         return {
//             prioritizeEfficiency: true,
//             prioritizeCost: false,
//             prioritizeSpeed: true,
//             maxParallelTasks: 3,
//             setupTimeThreshold: 30,
//             skillMatchThreshold: 70,
//             workloadBalancing: true
//         };
//     }
// }