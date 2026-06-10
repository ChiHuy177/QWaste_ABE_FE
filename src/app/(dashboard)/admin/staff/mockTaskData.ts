// Mock task data generator for operator tasks
interface MockTask {
    id: string;
    taskName: string;
    machineName: string;
    drawingCode: string;
    duration: string;
    status: 'Running' | 'Pending' | 'Completed';
}

const taskNames = [
    'Phay mặt phẳng',
    'Cắt gọt kim loại',
    'Đánh bóng bề mặt',
    'Kiểm tra chất lượng',
    'Lắp ráp linh kiện',
    'Gia công trục',
    'Khoan lỗ ren',
    'Taro ren trong',
    'Phay rãnh',
    'Nhiệt luyện',
    'Mạ crom',
    'Cắt laser',
    'Hàn TIG',
    'Uốn tấm',
    'Sơn tĩnh điện',
    'Tiện CNC',
    'Phay CNC 3 trục',
    'EDM dây',
    'Đo 3D',
    'Kiểm tra bề mặt',
];

const machineNames = [
    'Milling Machine 01',
    'CNC Machine 02',
    'Grinding Machine 01',
    'QC Station 01',
    'Assembly Line 01',
    'Lathe Machine 02',
    'Drilling Machine 02',
    'CNC Machine 03',
    'Heat Treatment 01',
    'Plating Machine 01',
    'Laser Cutting 01',
    'Welding Station 01',
    'Bending Machine 01',
    'Painting Line 01',
    'CNC Lathe 01',
    'Wire EDM 01',
    'CMM Machine 01',
    'Surface Tester 01',
];

const durations = ['30m', '1h', '1h 30m', '2h', '2h 30m', '3h', '4h', '5h'];

const statuses: Array<'Running' | 'Pending' | 'Completed'> = ['Running', 'Pending', 'Completed'];

/**
 * Generate random mock tasks for an operator
 * @param operatorId - Unique identifier for the operator
 * @param count - Number of tasks to generate (default: random 0-8)
 */
export const generateMockTasks = (operatorId: string, count?: number): MockTask[] => {
    const taskCount = count ?? Math.floor(Math.random() * 9); // 0-8 tasks
    const tasks: MockTask[] = [];

    for (let i = 0; i < taskCount; i++) {
        const randomTaskName = taskNames[Math.floor(Math.random() * taskNames.length)];
        const randomMachine = machineNames[Math.floor(Math.random() * machineNames.length)];
        const randomDuration = durations[Math.floor(Math.random() * durations.length)];
        const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];

        tasks.push({
            id: `task-${operatorId}-${i + 1}`,
            taskName: randomTaskName,
            machineName: randomMachine,
            drawingCode: `DWG-2025-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
            duration: randomDuration,
            status: randomStatus,
        });
    }

    return tasks;
};
