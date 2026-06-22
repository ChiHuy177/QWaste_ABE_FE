// import { mockOperators, getOperatorById } from '@/data/mockData';

// // Simulated API delay
// const delay = (ms: number = 500) => new Promise((resolve) => setTimeout(resolve, ms));

// export interface OperatorAvailability {
//     operatorId: string;
//     operator: Operator;
//     isAvailable: boolean;
//     currentWorkload: number; // Number of active tasks
//     estimatedAvailableTime?: Date; // When operator will be available
//     skillMatch: number; // Percentage match for required skills (0-100)
// }

// export class OperatorService {
//     /**
//      * Get all operators
//      */
//     static async getOperators(includeInactive = false): Promise<Operator[]> {
//         await delay(200);

//         if (includeInactive) {
//             return [...mockOperators];
//         }

//         return mockOperators.filter((operator) => operator.isActive);
//     }

//     /**
//      * Get available operators
//      */
//     static async getAvailableOperators(): Promise<Operator[]> {
//         await delay(200);

//         return mockOperators.filter(
//             (operator) => operator.isActive && operator.availability === 'available'
//         );
//     }

//     /**
//      * Get operators by skills
//      */
//     static async getOperatorsBySkills(requiredSkills: string[]): Promise<Operator[]> {
//         await delay(200);

//         return mockOperators.filter(
//             (operator) =>
//                 operator.isActive && requiredSkills.some((skill) => operator.skills.includes(skill))
//         );
//     }

//     /**
//      * Get a single operator by ID
//      */
//     static async getOperatorById(id: string): Promise<Operator | null> {
//         await delay(100);
//         return getOperatorById(id) || null;
//     }

//     /**
//      * Search operators by name or employee ID
//      */
//     static async searchOperators(query: string): Promise<Operator[]> {
//         await delay(200);

//         const searchLower = query.toLowerCase();
//         return mockOperators.filter(
//             (operator) =>
//                 operator.isActive &&
//                 (operator.name.toLowerCase().includes(searchLower) ||
//                     operator.employeeId.toLowerCase().includes(searchLower) ||
//                     operator.email.toLowerCase().includes(searchLower))
//         );
//     }

//     /**
//      * Get operator availability for task assignment
//      */
//     static async getOperatorAvailability(
//         requiredSkills: string[] = []
//     ): Promise<OperatorAvailability[]> {
//         await delay(300);

//         return mockOperators
//             .filter((operator) => operator.isActive)
//             .map((operator) => {
//                 // Calculate skill match
//                 const matchingSkills = requiredSkills.filter((skill) =>
//                     operator.skills.includes(skill)
//                 ).length;
//                 const skillMatch =
//                     requiredSkills.length > 0
//                         ? Math.round((matchingSkills / requiredSkills.length) * 100)
//                         : 100;

//                 // Calculate workload
//                 const currentWorkload = operator.currentTaskIds.length;

//                 // Determine availability
//                 const isAvailable = operator.availability === 'available' && currentWorkload === 0;

//                 // Estimate when operator will be available (mock calculation)
//                 let estimatedAvailableTime: Date | undefined;
//                 if (!isAvailable && currentWorkload > 0) {
//                     // Estimate 4 hours per task on average
//                     const hoursUntilAvailable = currentWorkload * 4;
//                     estimatedAvailableTime = new Date(
//                         Date.now() + hoursUntilAvailable * 60 * 60 * 1000
//                     );
//                 }

//                 return {
//                     operatorId: operator.id,
//                     operator,
//                     isAvailable,
//                     currentWorkload,
//                     estimatedAvailableTime,
//                     skillMatch,
//                 };
//             })
//             .sort((a, b) => {
//                 // Sort by availability first, then by skill match, then by workload
//                 if (a.isAvailable && !b.isAvailable) return -1;
//                 if (!a.isAvailable && b.isAvailable) return 1;
//                 if (a.skillMatch !== b.skillMatch) return b.skillMatch - a.skillMatch;
//                 return a.currentWorkload - b.currentWorkload;
//             });
//     }

//     /**
//      * Find best operator for task
//      */
//     static async findBestOperatorForTask(
//         requiredSkills: string[],
//         preferredOperatorId?: string
//     ): Promise<OperatorAvailability | null> {
//         await delay(200);

//         const availability = await this.getOperatorAvailability(requiredSkills);

//         // If preferred operator is available and has skills, return them
//         if (preferredOperatorId) {
//             const preferredOperator = availability.find(
//                 (op) => op.operatorId === preferredOperatorId
//             );
//             if (preferredOperator && preferredOperator.skillMatch > 0) {
//                 return preferredOperator;
//             }
//         }

//         // Otherwise, return the best available operator
//         const bestOperator = availability.find((op) => op.isAvailable && op.skillMatch > 0);
//         return bestOperator || null;
//     }

//     /**
//      * Get operator performance statistics
//      */
//     static async getOperatorStats(operatorId: string): Promise<{
//         completedTasks: number;
//         averageRating: number;
//         onTimeCompletionRate: number;
//         currentWorkload: number;
//         totalHoursWorked: number;
//         efficiency: number; // Tasks completed vs estimated time
//     }> {
//         await delay(200);

//         const operator = getOperatorById(operatorId);
//         if (!operator) {
//             throw new Error('Operator not found');
//         }

//         // Mock statistics - in real app, these would be calculated from task history
//         return {
//             completedTasks: operator.completedTasksCount,
//             averageRating: operator.averageRating,
//             onTimeCompletionRate: 0.87, // 87%
//             currentWorkload: operator.currentTaskIds.length,
//             totalHoursWorked: operator.completedTasksCount * 3.5, // Mock calculation
//             efficiency: 0.92, // 92% efficiency
//         };
//     }

//     /**
//      * Get operators workload summary
//      */
//     static async getWorkloadSummary(): Promise<{
//         totalOperators: number;
//         availableOperators: number;
//         busyOperators: number;
//         offlineOperators: number;
//         averageWorkload: number;
//         totalActiveTasks: number;
//     }> {
//         await delay(200);

//         const activeOperators = mockOperators.filter((op) => op.isActive);
//         const availableOperators = activeOperators.filter(
//             (op) => op.availability === 'available'
//         ).length;
//         const busyOperators = activeOperators.filter((op) => op.availability === 'busy').length;
//         const offlineOperators = activeOperators.filter(
//             (op) => op.availability === 'offline'
//         ).length;

//         const totalActiveTasks = activeOperators.reduce(
//             (sum, op) => sum + op.currentTaskIds.length,
//             0
//         );
//         const averageWorkload =
//             activeOperators.length > 0 ? totalActiveTasks / activeOperators.length : 0;

//         return {
//             totalOperators: activeOperators.length,
//             availableOperators,
//             busyOperators,
//             offlineOperators,
//             averageWorkload: Math.round(averageWorkload * 100) / 100,
//             totalActiveTasks,
//         };
//     }

//     /**
//      * Update operator availability
//      */
//     static async updateOperatorAvailability(
//         operatorId: string,
//         availability: Operator['availability']
//     ): Promise<Operator | null> {
//         await delay(200);

//         const operatorIndex = mockOperators.findIndex((op) => op.id === operatorId);
//         if (operatorIndex === -1) {
//             throw new Error('Operator not found');
//         }

//         const updatedOperator = {
//             ...mockOperators[operatorIndex],
//             availability,
//             updatedAt: new Date(),
//         };

//         mockOperators[operatorIndex] = updatedOperator;
//         return updatedOperator;
//     }

//     /**
//      * Assign task to operator
//      */
//     static async assignTask(operatorId: string, taskId: string): Promise<Operator | null> {
//         await delay(200);

//         const operatorIndex = mockOperators.findIndex((op) => op.id === operatorId);
//         if (operatorIndex === -1) {
//             throw new Error('Operator not found');
//         }

//         const operator = mockOperators[operatorIndex];

//         // Add task to operator's current tasks
//         if (!operator.currentTaskIds.includes(taskId)) {
//             operator.currentTaskIds.push(taskId);
//         }

//         // Update availability based on workload
//         const newAvailability: Operator['availability'] =
//             operator.currentTaskIds.length > 0 ? 'busy' : 'available';
//         const updatedOperator: Operator = {
//             ...operator,
//             availability: newAvailability,
//             updatedAt: new Date(),
//         };

//         mockOperators[operatorIndex] = updatedOperator;
//         return updatedOperator;
//     }

//     /**
//      * Remove task from operator
//      */
//     static async unassignTask(operatorId: string, taskId: string): Promise<Operator | null> {
//         await delay(200);

//         const operatorIndex = mockOperators.findIndex((op) => op.id === operatorId);
//         if (operatorIndex === -1) {
//             throw new Error('Operator not found');
//         }

//         const operator = mockOperators[operatorIndex];

//         // Remove task from operator's current tasks
//         const taskIndex = operator.currentTaskIds.indexOf(taskId);
//         if (taskIndex > -1) {
//             operator.currentTaskIds.splice(taskIndex, 1);
//         }

//         // Update availability based on workload
//         const newAvailability: Operator['availability'] =
//             operator.currentTaskIds.length > 0 ? 'busy' : 'available';
//         const updatedOperator: Operator = {
//             ...operator,
//             availability: newAvailability,
//             updatedAt: new Date(),
//         };

//         mockOperators[operatorIndex] = updatedOperator;
//         return updatedOperator;
//     }

//     /**
//      * Get all unique skills across operators
//      */
//     static async getAllSkills(): Promise<string[]> {
//         await delay(100);

//         const allSkills = mockOperators.reduce<string[]>((skills, operator) => {
//             operator.skills.forEach((skill) => {
//                 if (!skills.includes(skill)) {
//                     skills.push(skill);
//                 }
//             });
//             return skills;
//         }, []);

//         return allSkills.sort();
//     }

//     /**
//      * Get operators by skill level (simplified - based on experience)
//      */
//     static async getOperatorsByExperience(
//         skill: string,
//         minExperience: 'beginner' | 'intermediate' | 'expert' = 'beginner'
//     ): Promise<Operator[]> {
//         await delay(200);

//         // Simplified experience calculation based on completed tasks and rating
//         const experienceThresholds = {
//             beginner: { minTasks: 0, minRating: 0 },
//             intermediate: { minTasks: 50, minRating: 4.0 },
//             expert: { minTasks: 100, minRating: 4.5 },
//         };

//         const threshold = experienceThresholds[minExperience];

//         return mockOperators.filter(
//             (operator) =>
//                 operator.isActive &&
//                 operator.skills.includes(skill) &&
//                 operator.completedTasksCount >= threshold.minTasks &&
//                 operator.averageRating >= threshold.minRating
//         );
//     }
// }
