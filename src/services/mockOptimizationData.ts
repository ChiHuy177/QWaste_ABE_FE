// import { MachineCapability, OperatorCapability, OptimizationConfig } from './ProcessOptimizationService';

// // Mock machine capabilities
// export const mockMachineCapabilities: MachineCapability[] = [
//     {
//         machineId: 'machine-cnc-001',
//         capabilities: ['CNC Milling', '5-axis machining', 'High-speed cutting', 'Precision machining'],
//         efficiency: 95,
//         setupTime: 45,
//         hourlyRate: 125.0,
//         maintenanceScore: 92,
//         currentLoad: 65
//     },
//     {
//         machineId: 'machine-cnc-002',
//         capabilities: ['CNC Milling', '3-axis machining', 'Standard cutting'],
//         efficiency: 88,
//         setupTime: 30,
//         hourlyRate: 95.0,
//         maintenanceScore: 85,
//         currentLoad: 45
//     },
//     {
//         machineId: 'machine-cnc-003',
//         capabilities: ['CNC Turning', '4th axis', 'High torque'],
//         efficiency: 90,
//         setupTime: 35,
//         hourlyRate: 110.0,
//         maintenanceScore: 88,
//         currentLoad: 75
//     },
//     {
//         machineId: 'machine-bs-001',
//         capabilities: ['Band Saw', 'Aluminum cutting', 'Steel cutting', 'Auto feed'],
//         efficiency: 85,
//         setupTime: 15,
//         hourlyRate: 25.0,
//         maintenanceScore: 90,
//         currentLoad: 30
//     },
//     {
//         machineId: 'machine-laser-001',
//         capabilities: ['Laser Cutting', 'Sheet metal', 'High precision', 'Automated loading'],
//         efficiency: 92,
//         setupTime: 25,
//         hourlyRate: 150.0,
//         maintenanceScore: 94,
//         currentLoad: 80
//     },
//     {
//         machineId: 'machine-press-001',
//         capabilities: ['Press Forming', 'Sheet metal forming', 'High tonnage'],
//         efficiency: 87,
//         setupTime: 60,
//         hourlyRate: 80.0,
//         maintenanceScore: 82,
//         currentLoad: 55
//     },
//     {
//         machineId: 'station-asm-001',
//         capabilities: ['Assembly', 'Pneumatic tools', 'Torque monitoring'],
//         efficiency: 90,
//         setupTime: 10,
//         hourlyRate: 45.0,
//         maintenanceScore: 95,
//         currentLoad: 40
//     },
//     {
//         machineId: 'machine-weld-001',
//         capabilities: ['TIG Welding', 'MIG Welding', 'Aluminum welding'],
//         efficiency: 88,
//         setupTime: 20,
//         hourlyRate: 65.0,
//         maintenanceScore: 87,
//         currentLoad: 60
//     }
// ];

// // Mock operator capabilities
// export const mockOperatorCapabilities: OperatorCapability[] = [
//     {
//         operatorId: 'emp-001',
//         skills: ['CNC Programming', 'CNC Operation', '5-axis machining', 'Quality Control'],
//         experienceLevel: 9,
//         efficiency: 95,
//         hourlyRate: 35.75,
//         currentWorkload: 32,
//         maxWorkload: 40,
//         certifications: ['CNC Advanced', 'Quality Inspector', 'Safety Level 3']
//     },
//     {
//         operatorId: 'emp-002',
//         skills: ['CNC Operation', '3-axis machining', 'Blueprint Reading'],
//         experienceLevel: 6,
//         efficiency: 85,
//         hourlyRate: 28.50,
//         currentWorkload: 25,
//         maxWorkload: 40,
//         certifications: ['CNC Basic', 'Blueprint Reading']
//     },
//     {
//         operatorId: 'emp-003',
//         skills: ['CNC Programming', 'CAM Programming', 'Tool Setup'],
//         experienceLevel: 8,
//         efficiency: 92,
//         hourlyRate: 33.25,
//         currentWorkload: 38,
//         maxWorkload: 40,
//         certifications: ['CNC Programming', 'CAM Software', 'Tool Management']
//     },
//     {
//         operatorId: 'emp-004',
//         skills: ['Manual Machining', 'Band Saw', 'Material Handling'],
//         experienceLevel: 5,
//         efficiency: 80,
//         hourlyRate: 22.00,
//         currentWorkload: 20,
//         maxWorkload: 40,
//         certifications: ['Material Handling', 'Safety Basic']
//     },
//     {
//         operatorId: 'emp-005',
//         skills: ['Laser Cutting', 'Sheet Metal', 'CAD Reading'],
//         experienceLevel: 7,
//         efficiency: 88,
//         hourlyRate: 30.00,
//         currentWorkload: 35,
//         maxWorkload: 40,
//         certifications: ['Laser Operation', 'Sheet Metal Fabrication']
//     },
//     {
//         operatorId: 'emp-006',
//         skills: ['Press Operation', 'Die Setup', 'Quality Inspection'],
//         experienceLevel: 6,
//         efficiency: 83,
//         hourlyRate: 26.75,
//         currentWorkload: 28,
//         maxWorkload: 40,
//         certifications: ['Press Operation', 'Die Setup']
//     },
//     {
//         operatorId: 'emp-007',
//         skills: ['Assembly', 'Pneumatic Tools', 'Torque Control', 'Quality Control'],
//         experienceLevel: 7,
//         efficiency: 90,
//         hourlyRate: 29.80,
//         currentWorkload: 30,
//         maxWorkload: 40,
//         certifications: ['Assembly Procedures', 'Torque Certification', 'Quality Control']
//     },
//     {
//         operatorId: 'emp-008',
//         skills: ['TIG Welding', 'MIG Welding', 'Aluminum Welding', 'Quality Inspection'],
//         experienceLevel: 8,
//         efficiency: 91,
//         hourlyRate: 32.50,
//         currentWorkload: 36,
//         maxWorkload: 40,
//         certifications: ['AWS Certified Welder', 'Aluminum Specialist']
//     },
//     {
//         operatorId: 'emp-009',
//         skills: ['CNC Operation', 'Turning', 'Thread Cutting'],
//         experienceLevel: 5,
//         efficiency: 82,
//         hourlyRate: 27.25,
//         currentWorkload: 22,
//         maxWorkload: 40,
//         certifications: ['CNC Turning', 'Thread Cutting']
//     },
//     {
//         operatorId: 'emp-010',
//         skills: ['Quality Control', 'CMM Operation', 'Statistical Analysis'],
//         experienceLevel: 9,
//         efficiency: 96,
//         hourlyRate: 38.00,
//         currentWorkload: 35,
//         maxWorkload: 40,
//         certifications: ['Quality Engineer', 'CMM Level 3', 'Statistical Process Control']
//     }
// ];

// // Default optimization configurations
// export const optimizationPresets = {
//     efficiency: {
//         prioritizeEfficiency: true,
//         prioritizeCost: false,
//         prioritizeSpeed: false,
//         maxParallelTasks: 3,
//         setupTimeThreshold: 45,
//         skillMatchThreshold: 80,
//         workloadBalancing: true
//     } as OptimizationConfig,
    
//     cost: {
//         prioritizeEfficiency: false,
//         prioritizeCost: true,
//         prioritizeSpeed: false,
//         maxParallelTasks: 2,
//         setupTimeThreshold: 60,
//         skillMatchThreshold: 60,
//         workloadBalancing: true
//     } as OptimizationConfig,
    
//     speed: {
//         prioritizeEfficiency: false,
//         prioritizeCost: false,
//         prioritizeSpeed: true,
//         maxParallelTasks: 5,
//         setupTimeThreshold: 30,
//         skillMatchThreshold: 70,
//         workloadBalancing: false
//     } as OptimizationConfig,
    
//     balanced: {
//         prioritizeEfficiency: true,
//         prioritizeCost: true,
//         prioritizeSpeed: true,
//         maxParallelTasks: 3,
//         setupTimeThreshold: 40,
//         skillMatchThreshold: 75,
//         workloadBalancing: true
//     } as OptimizationConfig
// };

// // Utility functions for getting available resources
// export const getAvailableMachines = (capability?: string) => {
//     if (!capability) return mockMachineCapabilities.filter(m => m.currentLoad < 90);
    
//     return mockMachineCapabilities.filter(machine => 
//         machine.capabilities.some(cap => 
//             cap.toLowerCase().includes(capability.toLowerCase())
//         ) && machine.currentLoad < 90
//     );
// };

// export const getAvailableOperators = (skill?: string) => {
//     if (!skill) return mockOperatorCapabilities.filter(o => o.currentWorkload < o.maxWorkload * 0.9);
    
//     return mockOperatorCapabilities.filter(operator =>
//         operator.skills.some(s => 
//             s.toLowerCase().includes(skill.toLowerCase())
//         ) && operator.currentWorkload < operator.maxWorkload * 0.9
//     );
// };

// // Resource utilization helpers
// export const calculateResourceUtilization = () => {
//     return {
//         machines: mockMachineCapabilities.map(machine => ({
//             id: machine.machineId,
//             name: machine.machineId.replace('machine-', '').toUpperCase(),
//             utilization: machine.currentLoad,
//             efficiency: machine.efficiency,
//             status: machine.currentLoad > 90 ? 'overloaded' : 
//                    machine.currentLoad > 75 ? 'busy' : 
//                    machine.currentLoad > 50 ? 'moderate' : 'available'
//         })),
//         operators: mockOperatorCapabilities.map(operator => ({
//             id: operator.operatorId,
//             name: operator.operatorId.replace('emp-', 'Operator '),
//             utilization: (operator.currentWorkload / operator.maxWorkload) * 100,
//             efficiency: operator.efficiency,
//             status: operator.currentWorkload >= operator.maxWorkload ? 'overloaded' :
//                    operator.currentWorkload >= operator.maxWorkload * 0.8 ? 'busy' :
//                    operator.currentWorkload >= operator.maxWorkload * 0.5 ? 'moderate' : 'available'
//         }))
//     };
// };