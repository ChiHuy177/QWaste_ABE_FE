// import {
// import { DrawingCode } from '@/types/DrawingCode';

// // Mock Drawing Codes with Process Steps
// export const mockProcessSteps: ProcessStep[] = [
//     // Steps for Widget A (WDG-001)
//     {
//         id: 'step-001',
//         drawingCodeId: 'dwg-001',
//         stepNumber: 1,
//         name: 'Material Preparation',
//         description: 'Cut and prepare raw materials according to specifications',
//         estimatedMinutes: 30,
//         requiredSkills: ['cutting', 'measuring'],
//         equipment: ['cutting_machine', 'measuring_tools'],
//         materials: ['steel_sheet', 'aluminum'],
//         qualityCheckpoints: ['dimension_check', 'surface_quality'],
//         isOptional: false,
//         dependencies: [],
//     },
//     {
//         id: 'step-002',
//         drawingCodeId: 'dwg-001',
//         stepNumber: 2,
//         name: 'Initial Assembly',
//         description: 'Assemble base components using specified fasteners',
//         estimatedMinutes: 45,
//         requiredSkills: ['assembly', 'torque_application'],
//         equipment: ['assembly_station', 'torque_wrench'],
//         materials: ['bolts', 'washers'],
//         qualityCheckpoints: ['alignment_check', 'torque_verification'],
//         isOptional: false,
//         dependencies: ['step-001'],
//     },
//     {
//         id: 'step-003',
//         drawingCodeId: 'dwg-001',
//         stepNumber: 3,
//         name: 'Welding',
//         description: 'Weld critical joints according to welding procedure',
//         estimatedMinutes: 60,
//         requiredSkills: ['welding', 'quality_inspection'],
//         equipment: ['welding_station', 'safety_equipment'],
//         materials: ['welding_rod', 'shielding_gas'],
//         qualityCheckpoints: ['weld_quality', 'penetration_test'],
//         isOptional: false,
//         dependencies: ['step-002'],
//     },
//     {
//         id: 'step-004',
//         drawingCodeId: 'dwg-001',
//         stepNumber: 4,
//         name: 'Quality Inspection',
//         description: 'Comprehensive quality check and documentation',
//         estimatedMinutes: 20,
//         requiredSkills: ['quality_control', 'documentation'],
//         equipment: ['inspection_tools', 'documentation_system'],
//         qualityCheckpoints: ['final_dimension_check', 'surface_finish_check'],
//         isOptional: false,
//         dependencies: ['step-003'],
//     },

//     // Steps for Bracket B (BRC-002)
//     {
//         id: 'step-005',
//         drawingCodeId: 'dwg-002',
//         stepNumber: 1,
//         name: 'Metal Cutting',
//         description: 'Precision cutting of bracket material',
//         estimatedMinutes: 20,
//         requiredSkills: ['cutting', 'precision_work'],
//         equipment: ['laser_cutter', 'measuring_tools'],
//         materials: ['steel_plate'],
//         qualityCheckpoints: ['edge_quality', 'dimensions'],
//         isOptional: false,
//         dependencies: [],
//     },
//     {
//         id: 'step-006',
//         drawingCodeId: 'dwg-002',
//         stepNumber: 2,
//         name: 'Bending',
//         description: 'Form bracket shape using press brake',
//         estimatedMinutes: 15,
//         requiredSkills: ['bending', 'forming'],
//         equipment: ['press_brake', 'forming_dies'],
//         qualityCheckpoints: ['angle_verification', 'radius_check'],
//         isOptional: false,
//         dependencies: ['step-005'],
//     },
//     {
//         id: 'step-007',
//         drawingCodeId: 'dwg-002',
//         stepNumber: 3,
//         name: 'Surface Treatment',
//         description: 'Apply coating and finish treatments',
//         estimatedMinutes: 25,
//         requiredSkills: ['surface_treatment', 'coating'],
//         equipment: ['coating_booth', 'drying_oven'],
//         materials: ['primer', 'topcoat'],
//         qualityCheckpoints: ['coating_thickness', 'finish_quality'],
//         isOptional: false,
//         dependencies: ['step-006'],
//     },

//     // Steps for Component C (CMP-003)
//     {
//         id: 'step-008',
//         drawingCodeId: 'dwg-003',
//         stepNumber: 1,
//         name: 'Machining',
//         description: 'CNC machining of component features',
//         estimatedMinutes: 90,
//         requiredSkills: ['cnc_operation', 'programming'],
//         equipment: ['cnc_machine', 'cutting_tools'],
//         materials: ['aluminum_block', 'coolant'],
//         qualityCheckpoints: ['dimensional_accuracy', 'surface_finish'],
//         isOptional: false,
//         dependencies: [],
//     },
//     {
//         id: 'step-009',
//         drawingCodeId: 'dwg-003',
//         stepNumber: 2,
//         name: 'Deburring',
//         description: 'Remove burrs and sharp edges',
//         estimatedMinutes: 15,
//         requiredSkills: ['finishing', 'hand_tools'],
//         equipment: ['deburring_tools', 'abrasives'],
//         qualityCheckpoints: ['edge_quality', 'surface_smoothness'],
//         isOptional: false,
//         dependencies: ['step-008'],
//     },
//     {
//         id: 'step-010',
//         drawingCodeId: 'dwg-003',
//         stepNumber: 3,
//         name: 'Anodizing',
//         description: 'Apply anodized finish for corrosion protection',
//         estimatedMinutes: 120,
//         requiredSkills: ['anodizing', 'chemical_handling'],
//         equipment: ['anodizing_tank', 'power_supply'],
//         materials: ['anodizing_chemicals', 'dyes'],
//         qualityCheckpoints: ['coating_thickness', 'color_consistency'],
//         isOptional: true,
//         dependencies: ['step-009'],
//     },
// ];

// export const mockDrawingCodes: DrawingCode[] = [
//     {
//         id: 'dwg-001',
//         code: 'WDG-001',
//         name: 'Widget A',
//         description: 'Standard widget assembly with welded joints',
//         category: 'Widgets',
//         unitPrice: 125.50,
//         estimatedHoursPerUnit: 2.5,
//         isActive: true,
//         createdAt: new Date('2025-01-15'),
//         updatedAt: new Date('2025-03-10'),
//         steps: mockProcessSteps.filter(step => step.drawingCodeId === 'dwg-001'),
//     },
//     {
//         id: 'dwg-002',
//         code: 'BRC-002',
//         name: 'Bracket B',
//         description: 'L-shaped mounting bracket with powder coating',
//         category: 'Brackets',
//         unitPrice: 45.75,
//         estimatedHoursPerUnit: 1.0,
//         isActive: true,
//         createdAt: new Date('2025-02-01'),
//         updatedAt: new Date('2025-02-15'),
//         steps: mockProcessSteps.filter(step => step.drawingCodeId === 'dwg-002'),
//     },
//     {
//         id: 'dwg-003',
//         code: 'CMP-003',
//         name: 'Component C',
//         description: 'Precision machined aluminum component with anodized finish',
//         category: 'Components',
//         unitPrice: 89.25,
//         estimatedHoursPerUnit: 3.5,
//         isActive: true,
//         createdAt: new Date('2025-01-20'),
//         updatedAt: new Date('2025-03-05'),
//         steps: mockProcessSteps.filter(step => step.drawingCodeId === 'dwg-003'),
//     },
//     {
//         id: 'dwg-004',
//         code: 'ASM-004',
//         name: 'Assembly D',
//         description: 'Complex assembly requiring multiple components',
//         category: 'Assemblies',
//         unitPrice: 245.00,
//         estimatedHoursPerUnit: 4.0,
//         isActive: true,
//         createdAt: new Date('2025-02-10'),
//         updatedAt: new Date('2025-03-01'),
//         steps: [], // Simplified for mock data
//     },
//     {
//         id: 'dwg-005',
//         code: 'FRM-005',
//         name: 'Frame E',
//         description: 'Structural frame with complex geometry',
//         category: 'Frames',
//         unitPrice: 156.80,
//         estimatedHoursPerUnit: 3.0,
//         isActive: true,
//         createdAt: new Date('2025-01-25'),
//         updatedAt: new Date('2025-02-28'),
//         steps: [], // Simplified for mock data
//     },
// ];

// // Mock Operators
// export const mockOperators: Operator[] = [
//     {
//         id: 'op-001',
//         name: 'John Smith',
//         email: 'john.smith@company.com',
//         employeeId: 'EMP001',
//         skills: ['welding', 'assembly', 'quality_control', 'cutting'],
//         hourlyRate: 28.50,
//         isActive: true,
//         availability: 'available',
//         currentTaskIds: [],
//         completedTasksCount: 127,
//         averageRating: 4.8,
//         createdAt: new Date('2023-06-01'),
//         updatedAt: new Date('2025-03-15'),
//     },
//     {
//         id: 'op-002',
//         name: 'Maria Rodriguez',
//         email: 'maria.rodriguez@company.com',
//         employeeId: 'EMP002',
//         skills: ['cnc_operation', 'programming', 'machining', 'precision_work'],
//         hourlyRate: 32.00,
//         isActive: true,
//         availability: 'busy',
//         currentTaskIds: ['task-003'],
//         completedTasksCount: 89,
//         averageRating: 4.9,
//         createdAt: new Date('2023-07-15'),
//         updatedAt: new Date('2025-03-15'),
//     },
//     {
//         id: 'op-003',
//         name: 'David Chen',
//         email: 'david.chen@company.com',
//         employeeId: 'EMP003',
//         skills: ['surface_treatment', 'coating', 'finishing', 'quality_control'],
//         hourlyRate: 26.75,
//         isActive: true,
//         availability: 'available',
//         currentTaskIds: [],
//         completedTasksCount: 156,
//         averageRating: 4.7,
//         createdAt: new Date('2023-08-20'),
//         updatedAt: new Date('2025-03-15'),
//     },
//     {
//         id: 'op-004',
//         name: 'Sarah Wilson',
//         email: 'sarah.wilson@company.com',
//         employeeId: 'EMP004',
//         skills: ['assembly', 'torque_application', 'documentation', 'training'],
//         hourlyRate: 30.25,
//         isActive: true,
//         availability: 'available',
//         currentTaskIds: [],
//         completedTasksCount: 203,
//         averageRating: 4.6,
//         createdAt: new Date('2023-05-10'),
//         updatedAt: new Date('2025-03-15'),
//     },
//     {
//         id: 'op-005',
//         name: 'Michael Johnson',
//         email: 'michael.johnson@company.com',
//         employeeId: 'EMP005',
//         skills: ['cutting', 'bending', 'forming', 'measuring'],
//         hourlyRate: 27.50,
//         isActive: true,
//         availability: 'offline',
//         currentTaskIds: [],
//         completedTasksCount: 98,
//         averageRating: 4.5,
//         createdAt: new Date('2023-09-05'),
//         updatedAt: new Date('2025-03-15'),
//     },
// ];

// // Helper function to create step progresses for a task
// const createStepProgresses = (task: Partial<Task>, steps: ProcessStep[]): StepProgress[] => {
//     return steps.map((step, index) => {
//         let status: StepStatus = 'not_started';
//         let startedAt: Date | undefined;
//         let completedAt: Date | undefined;
//         let actualMinutes: number | undefined;
//         let operatorId: string | undefined;
        
//         // Simulate progress based on task progress
//         if (task.status === 'completed' || (task.progressPercentage && task.progressPercentage > index * (100 / steps.length))) {
//             status = 'completed';
//             startedAt = new Date(Date.now() - (steps.length - index) * 24 * 60 * 60 * 1000);
//             completedAt = new Date(Date.now() - (steps.length - index - 1) * 24 * 60 * 60 * 1000);
//             actualMinutes = step.estimatedMinutes + Math.floor(Math.random() * 10) - 5;
//             operatorId = task.assignedOperatorId;
//         } else if (task.status === 'in_progress' && index === Math.floor((task.progressPercentage || 0) / (100 / steps.length))) {
//             status = 'in_progress';
//             startedAt = new Date(Date.now() - Math.random() * 2 * 60 * 60 * 1000);
//             operatorId = task.assignedOperatorId;
//         }

//         return {
//             id: `progress-${task.id}-${step.id}`,
//             taskId: task.id!,
//             stepId: step.id,
//             step,
//             status,
//             startedAt,
//             completedAt,
//             actualMinutes,
//             operatorId,
//             operator: operatorId ? mockOperators.find(op => op.id === operatorId) : undefined,
//             notes: status === 'completed' ? 'Completed successfully' : undefined,
//             qualityPassed: status === 'completed',
//             qualityNotes: status === 'completed' ? 'All quality checks passed' : undefined,
//         };
//     });
// };

// // Mock Tasks
// export const mockTasks: Task[] = [
//     {
//         id: 'task-001',
//         orderId: 'order-001',
//         title: 'Manufacture Widget A - Batch 1',
//         description: 'First batch of 5 Widget A units for Order #ORD-2025-001',
//         status: 'completed',
//         priority: 'high',
//         drawingCodeId: 'dwg-001',
//         drawingCode: mockDrawingCodes[0],
//         quantity: 5,
//         unitPrice: 125.50,
//         totalPrice: 627.50,
//         assignedOperatorId: 'op-001',
//         assignedOperator: mockOperators[0],
//         estimatedHours: 12.5,
//         actualHours: 13.2,
//         currentStepIndex: 4,
//         completedSteps: 4,
//         totalSteps: 4,
//         progressPercentage: 100,
//         createdAt: new Date('2025-03-01T08:00:00'),
//         updatedAt: new Date('2025-03-05T16:30:00'),
//         startedAt: new Date('2025-03-01T09:00:00'),
//         completedAt: new Date('2025-03-05T16:30:00'),
//         notes: 'Completed ahead of schedule with excellent quality',
//         stepProgresses: [],
//     },
//     {
//         id: 'task-002',
//         orderId: 'order-001',
//         title: 'Manufacture Bracket B - Batch 1',
//         description: 'Production of 10 Bracket B units',
//         status: 'in_progress',
//         priority: 'medium',
//         drawingCodeId: 'dwg-002',
//         drawingCode: mockDrawingCodes[1],
//         quantity: 10,
//         unitPrice: 45.75,
//         totalPrice: 457.50,
//         assignedOperatorId: 'op-003',
//         assignedOperator: mockOperators[2],
//         estimatedHours: 10.0,
//         actualHours: 6.5,
//         currentStepIndex: 2,
//         completedSteps: 2,
//         totalSteps: 3,
//         progressPercentage: 67,
//         createdAt: new Date('2025-03-02T08:00:00'),
//         updatedAt: new Date('2025-03-15T14:20:00'),
//         startedAt: new Date('2025-03-02T10:00:00'),
//         notes: 'Progressing well, currently in surface treatment phase',
//         stepProgresses: [],
//     },
//     {
//         id: 'task-003',
//         orderId: 'order-002',
//         title: 'Machine Component C - Precision',
//         description: 'High-precision machining of Component C',
//         status: 'in_progress',
//         priority: 'high',
//         drawingCodeId: 'dwg-003',
//         drawingCode: mockDrawingCodes[2],
//         quantity: 3,
//         unitPrice: 89.25,
//         totalPrice: 267.75,
//         assignedOperatorId: 'op-002',
//         assignedOperator: mockOperators[1],
//         estimatedHours: 10.5,
//         actualHours: 8.0,
//         currentStepIndex: 1,
//         completedSteps: 1,
//         totalSteps: 3,
//         progressPercentage: 33,
//         createdAt: new Date('2025-03-10T08:00:00'),
//         updatedAt: new Date('2025-03-15T11:45:00'),
//         startedAt: new Date('2025-03-10T09:30:00'),
//         notes: 'Machining completed, moving to deburring phase',
//         stepProgresses: [],
//     },
//     {
//         id: 'task-004',
//         orderId: 'order-003',
//         title: 'Assembly D Production',
//         description: 'Complex assembly requiring multiple sub-components',
//         status: 'not_started',
//         priority: 'medium',
//         drawingCodeId: 'dwg-004',
//         drawingCode: mockDrawingCodes[3],
//         quantity: 2,
//         unitPrice: 245.00,
//         totalPrice: 490.00,
//         estimatedHours: 8.0,
//         actualHours: 0,
//         currentStepIndex: 0,
//         completedSteps: 0,
//         totalSteps: 5,
//         progressPercentage: 0,
//         createdAt: new Date('2025-03-12T08:00:00'),
//         updatedAt: new Date('2025-03-12T08:00:00'),
//         notes: 'Waiting for sub-components to be completed',
//         stepProgresses: [],
//     },
//     {
//         id: 'task-005',
//         orderId: 'order-003',
//         title: 'Frame E Fabrication',
//         description: 'Structural frame with welded joints',
//         status: 'blocked',
//         priority: 'low',
//         drawingCodeId: 'dwg-005',
//         drawingCode: mockDrawingCodes[4],
//         quantity: 1,
//         unitPrice: 156.80,
//         totalPrice: 156.80,
//         estimatedHours: 3.0,
//         actualHours: 0,
//         currentStepIndex: 0,
//         completedSteps: 0,
//         totalSteps: 4,
//         progressPercentage: 0,
//         createdAt: new Date('2025-03-13T08:00:00'),
//         updatedAt: new Date('2025-03-14T10:00:00'),
//         notes: 'Blocked due to material shortage - steel delivery delayed',
//         stepProgresses: [],
//     },
// ];

// // Create step progresses for all tasks
// mockTasks.forEach(task => {
//     task.stepProgresses = createStepProgresses(task, task.drawingCode.steps);
// });

// // Mock Orders
// export const mockOrders: Order[] = [
//     {
//         id: 'order-001',
//         orderNumber: 'ORD-2025-001',
//         title: 'Automotive Parts Production',
//         description: 'Complete production run for automotive client including widgets and brackets',
//         status: 'in_progress',
//         priority: 'high',
//         customerId: 'customer-001',
//         customerName: 'AutoTech Industries',
//         expectedDeliveryDate: new Date('2025-04-15'),
//         createdAt: new Date('2025-03-01T08:00:00'),
//         updatedAt: new Date('2025-03-15T16:00:00'),
//         createdBy: 'John Doe',
//         assignedTo: ['op-001', 'op-003'],
//         totalTasks: 2,
//         completedTasks: 1,
//         progressPercentage: 75,
//         estimatedHours: 22.5,
//         actualHours: 19.7,
//         budget: 1500.00,
//         notes: 'High priority client - ensure quality and on-time delivery',
//         tasks: mockTasks.filter(task => task.orderId === 'order-001'),
//     },
//     {
//         id: 'order-002',
//         orderNumber: 'ORD-2025-002',
//         title: 'Precision Components Order',
//         description: 'High-precision machined components for aerospace application',
//         status: 'in_progress',
//         priority: 'urgent',
//         customerId: 'customer-002',
//         customerName: 'AeroSpace Solutions',
//         expectedDeliveryDate: new Date('2025-03-25'),
//         createdAt: new Date('2025-03-08T09:00:00'),
//         updatedAt: new Date('2025-03-15T14:30:00'),
//         createdBy: 'Jane Smith',
//         assignedTo: ['op-002'],
//         totalTasks: 1,
//         completedTasks: 0,
//         progressPercentage: 33,
//         estimatedHours: 10.5,
//         actualHours: 8.0,
//         budget: 800.00,
//         notes: 'Critical aerospace application - zero defects tolerance',
//         tasks: mockTasks.filter(task => task.orderId === 'order-002'),
//     },
//     {
//         id: 'order-003',
//         orderNumber: 'ORD-2025-003',
//         title: 'Industrial Equipment Order',
//         description: 'Mixed order for industrial equipment manufacturer',
//         status: 'pending',
//         priority: 'medium',
//         customerId: 'customer-003',
//         customerName: 'Industrial Solutions Ltd',
//         expectedDeliveryDate: new Date('2025-04-30'),
//         createdAt: new Date('2025-03-12T10:00:00'),
//         updatedAt: new Date('2025-03-14T15:00:00'),
//         createdBy: 'Mike Johnson',
//         assignedTo: [],
//         totalTasks: 2,
//         completedTasks: 0,
//         progressPercentage: 0,
//         estimatedHours: 11.0,
//         actualHours: 0,
//         budget: 1200.00,
//         notes: 'Standard production timeline, material delivery pending',
//         tasks: mockTasks.filter(task => task.orderId === 'order-003'),
//     },
//     {
//         id: 'order-004',
//         orderNumber: 'ORD-2025-004',
//         title: 'Maintenance Parts Rush Order',
//         description: 'Urgent replacement parts for maintenance operations',
//         status: 'completed',
//         priority: 'urgent',
//         customerId: 'customer-004',
//         customerName: 'MaintenancePro Corp',
//         expectedDeliveryDate: new Date('2025-02-28'),
//         createdAt: new Date('2025-02-15T14:00:00'),
//         updatedAt: new Date('2025-02-28T17:00:00'),
//         createdBy: 'Sarah Wilson',
//         assignedTo: ['op-001', 'op-004'],
//         totalTasks: 3,
//         completedTasks: 3,
//         progressPercentage: 100,
//         estimatedHours: 15.0,
//         actualHours: 14.5,
//         budget: 900.00,
//         notes: 'Rush order completed successfully and on time',
//         tasks: [], // Completed tasks not shown in current mock data
//     },
//     {
//         id: 'order-005',
//         orderNumber: 'ORD-2025-005',
//         title: 'Custom Fabrication Project',
//         description: 'Custom fabrication project for specialized application',
//         status: 'cancelled',
//         priority: 'low',
//         customerId: 'customer-005',
//         customerName: 'Custom Solutions Inc',
//         expectedDeliveryDate: new Date('2025-05-15'),
//         createdAt: new Date('2025-02-20T09:00:00'),
//         updatedAt: new Date('2025-03-10T12:00:00'),
//         createdBy: 'Alex Brown',
//         assignedTo: [],
//         totalTasks: 0,
//         completedTasks: 0,
//         progressPercentage: 0,
//         estimatedHours: 25.0,
//         actualHours: 0,
//         budget: 2000.00,
//         notes: 'Cancelled by customer due to design changes',
//         tasks: [],
//     },
// ];

// // Update operator availability based on current assignments
// mockOperators.forEach(operator => {
//     const assignedTasks = mockTasks.filter(task => 
//         task.assignedOperatorId === operator.id && 
//         (task.status === 'in_progress' || task.status === 'not_started')
//     );
//     operator.currentTaskIds = assignedTasks.map(task => task.id);
//     operator.availability = assignedTasks.length > 0 ? 'busy' : 'available';
// });

// // Mock data for easy export
// export const mockData = {
//     orders: mockOrders,
//     tasks: mockTasks,
//     drawingCodes: mockDrawingCodes,
//     operators: mockOperators,
//     processSteps: mockProcessSteps,
// };

// // Utility functions for mock data
// export const getOrderById = (id: string): Order | undefined => 
//     mockOrders.find(order => order.id === id);

// export const getTaskById = (id: string): Task | undefined => 
//     mockTasks.find(task => task.id === id);

// export const getDrawingCodeById = (id: string): DrawingCode | undefined => 
//     mockDrawingCodes.find(code => code.id === id);

// export const getOperatorById = (id: string): Operator | undefined => 
//     mockOperators.find(operator => operator.id === id);

// export const getTasksByOrderId = (orderId: string): Task[] => 
//     mockTasks.filter(task => task.orderId === orderId);

// export const getAvailableOperators = (): Operator[] => 
//     mockOperators.filter(operator => operator.availability === 'available' && operator.isActive);

// export const getActiveDrawingCodes = (): DrawingCode[] => 
//     mockDrawingCodes.filter(code => code.isActive);

// // Generate additional mock data if needed
// export const generateMockOrderNumber = (): string => {
//     const year = new Date().getFullYear();
//     const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
//     return `ORD-${year}-${randomNum}`;
// };

// export const generateMockTaskId = (): string => {
//     const randomNum = Math.floor(Math.random() * 10000).toString().padStart(3, '0');
//     return `task-${randomNum}`;
// };

// export const generateMockOrderId = (): string => {
//     const randomNum = Math.floor(Math.random() * 10000).toString().padStart(3, '0');
//     return `order-${randomNum}`;
// };
