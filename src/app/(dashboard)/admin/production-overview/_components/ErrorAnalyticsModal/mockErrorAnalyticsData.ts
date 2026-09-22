import {
    MachineErrorDetailItem,
    MachineStatusLogChartResponse,
    MachineStatusSummaryItem,
    MtbfChartResponse,
    MttrChartResponse,
} from '@/types/Monitoring';
import dayjs from 'dayjs';

export interface MockWorkshop {
    spaceId: number;
    spaceName: string;
    machineIds: string[];
}

export const MOCK_WORKSHOPS: MockWorkshop[] = [
    {
        spaceId: 101,
        spaceName: 'Phân xưởng Phay & Tiện CNC',
        machineIds: ['CNC-01', 'CNC-02', 'CNC-03', 'CNC-04'],
    },
    {
        spaceId: 102,
        spaceName: 'Phân xưởng Cắt Laser kim loại',
        machineIds: ['LASER-01', 'LASER-02'],
    },
    {
        spaceId: 103,
        spaceName: 'Phân xưởng Ép dập & Hàn tự động',
        machineIds: ['PRESS-01', 'WELD-01', 'INJECT-01'],
    },
];

export const MOCK_MACHINE_STATUS_SUMMARY: MachineStatusSummaryItem[] = [
    {
        machineId: 'CNC-01',
        machineName: 'Máy Phay CNC 5 Trục (CNC-01)',
        totalRuntimeHours: 18.5,
        totalIdleHours: 2.5,
        totalErrorHours: 1.2,
        totalOfflineHours: 1.8,
    },
    {
        machineId: 'CNC-02',
        machineName: 'Máy Phay CNC Đứng (CNC-02)',
        totalRuntimeHours: 16.0,
        totalIdleHours: 3.5,
        totalErrorHours: 3.2,
        totalOfflineHours: 1.3,
    },
    {
        machineId: 'CNC-03',
        machineName: 'Máy Phay CNC Ngang (CNC-03)',
        totalRuntimeHours: 12.0,
        totalIdleHours: 4.5,
        totalErrorHours: 5.8,
        totalOfflineHours: 1.7,
    },
    {
        machineId: 'CNC-04',
        machineName: 'Máy Tiện CNC Cao Tốc (CNC-04)',
        totalRuntimeHours: 20.0,
        totalIdleHours: 1.5,
        totalErrorHours: 0.8,
        totalOfflineHours: 1.7,
    },
    {
        machineId: 'LASER-01',
        machineName: 'Máy Cắt Laser Fiber 12kW (LASER-01)',
        totalRuntimeHours: 15.2,
        totalIdleHours: 3.8,
        totalErrorHours: 4.0,
        totalOfflineHours: 1.0,
    },
    {
        machineId: 'LASER-02',
        machineName: 'Máy Cắt Laser CO2 (LASER-02)',
        totalRuntimeHours: 18.0,
        totalIdleHours: 2.2,
        totalErrorHours: 1.5,
        totalOfflineHours: 2.3,
    },
    {
        machineId: 'PRESS-01',
        machineName: 'Máy Ép Dập Thủy Lực 200T (PRESS-01)',
        totalRuntimeHours: 14.0,
        totalIdleHours: 4.0,
        totalErrorHours: 4.5,
        totalOfflineHours: 1.5,
    },
    {
        machineId: 'WELD-01',
        machineName: 'Robot Hàn Tự Động 6 Trục (WELD-01)',
        totalRuntimeHours: 19.2,
        totalIdleHours: 2.0,
        totalErrorHours: 1.0,
        totalOfflineHours: 1.8,
    },
    {
        machineId: 'INJECT-01',
        machineName: 'Máy Ép Nhựa Định Hình (INJECT-01)',
        totalRuntimeHours: 17.5,
        totalIdleHours: 2.8,
        totalErrorHours: 2.2,
        totalOfflineHours: 1.5,
    },
];

export const getMockMachineErrorDetails = (
    machineId: string,
    startDate?: string,
    endDate?: string
): MachineErrorDetailItem[] => {
    const errorMap: Record<string, MachineErrorDetailItem[]> = {
        'CNC-01': [
            {
                id: 'ERR-001',
                machineId: 'CNC-01',
                errorName: 'Quá nhiệt đầu trục chính (Spindle Overheat)',
                reason: 'Hệ thống nước làm mát bị nghẽn lọc tản nhiệt',
                logStatus: 'ERROR',
                startTime: '2026-08-28T08:30:00',
                endTime: '2026-08-28T09:15:00',
                durationHours: 0.75,
            },
            {
                id: 'ERR-002',
                machineId: 'CNC-01',
                errorName: 'Kẹt phoi băng tải xả phôi (Conveyor Jam)',
                reason: 'Phoi dôi phôi cuộn quấn vào trục cuốn băng tải',
                logStatus: 'ERROR',
                startTime: '2026-08-28T11:20:00',
                endTime: '2026-08-28T11:47:00',
                durationHours: 0.45,
            },
        ],
        'CNC-02': [
            {
                id: 'ERR-003',
                machineId: 'CNC-02',
                errorName: 'Gãy dao phay ngón số 4 (Tool #4 Breakage)',
                reason: 'Quá tải bước tiến dao khi gia công bề mặt hợp kim cứng',
                logStatus: 'ERROR',
                startTime: '2026-08-28T07:15:00',
                endTime: '2026-08-28T08:45:00',
                durationHours: 1.5,
            },
            {
                id: 'ERR-004',
                machineId: 'CNC-02',
                errorName: 'Lệch sai số tọa độ trục Z (Z-axis Deviation)',
                reason: 'Lỏng khớp nối trục vít me bi dẫn hướng',
                logStatus: 'ERROR',
                startTime: '2026-08-28T13:00:00',
                endTime: '2026-08-28T14:42:00',
                durationHours: 1.7,
            },
        ],
        'CNC-03': [
            {
                id: 'ERR-005',
                machineId: 'CNC-03',
                errorName: 'Áp suất dầu bôi trơn thấp (Low Hydraulic Pressure)',
                reason: 'Rò rỉ ống dẫn dầu thủy lực cụm bơm phụ trợ',
                logStatus: 'ERROR',
                startTime: '2026-08-28T06:10:00',
                endTime: '2026-08-28T08:30:00',
                durationHours: 2.33,
            },
            {
                id: 'ERR-006',
                machineId: 'CNC-03',
                errorName: 'Kẹt tay gắp phôi tự động (Robotic Arm Jam)',
                reason: 'Cảm biến kẹp phôi bám mạt bụi kim loại',
                logStatus: 'ERROR',
                startTime: '2026-08-28T10:15:00',
                endTime: '2026-08-28T13:45:00',
                durationHours: 3.5,
            },
        ],
        'LASER-01': [
            {
                id: 'ERR-007',
                machineId: 'LASER-01',
                errorName: 'Nhiệt độ thấu kính hội tụ vượt ngưỡng (Optics Overheat)',
                reason: 'Thấu kính bảo vệ bám bụi bẩn chưa kịp vệ sinh định kỳ',
                logStatus: 'ERROR',
                startTime: '2026-08-28T09:00:00',
                endTime: '2026-08-28T11:30:00',
                durationHours: 2.5,
            },
            {
                id: 'ERR-008',
                machineId: 'LASER-01',
                errorName: 'Cảnh báo áp suất khí bảo vệ N2 thấp (Low Assist Gas)',
                reason: 'Bình tích áp N2 sụt giảm áp suất dưới 15 bar',
                logStatus: 'ERROR',
                startTime: '2026-08-28T14:10:00',
                endTime: '2026-08-28T15:40:00',
                durationHours: 1.5,
            },
        ],
        'PRESS-01': [
            {
                id: 'ERR-009',
                machineId: 'PRESS-01',
                errorName: 'Lỗi rò rỉ van thủy lực sơ cấp (Hydraulic Valve Leak)',
                reason: 'Lão hóa gioăng phớt cao su làm kín lòng xi lanh',
                logStatus: 'ERROR',
                startTime: '2026-08-28T08:00:00',
                endTime: '2026-08-28T11:30:00',
                durationHours: 3.5,
            },
            {
                id: 'ERR-010',
                machineId: 'PRESS-01',
                errorName: 'Kẹt cảm biến an toàn cửa bảo vệ (Safety Gate Fault)',
                reason: 'Lệch cữ hành trình cảm biến tiếp điểm cửa chắn',
                logStatus: 'ERROR',
                startTime: '2026-08-28T15:00:00',
                endTime: '2026-08-28T16:00:00',
                durationHours: 1.0,
            },
        ],
    };

    const rawItems = errorMap[machineId] || [
        {
            id: `ERR-${machineId}-01`,
            machineId,
            errorName: 'Cảnh báo cảm biến nạp phôi (Material Feed Sensor Warning)',
            reason: 'Phôi bị lệch cữ nạp nguyên liệu đầu vào',
            logStatus: 'ERROR',
            startTime: '2026-08-28T09:00:00',
            endTime: '2026-08-28T09:45:00',
            durationHours: 0.75,
        },
        {
            id: `ERR-${machineId}-02`,
            machineId,
            errorName: 'Độ rung động cơ vượt ngưỡng cho phép (High Motor Vibration)',
            reason: 'Vòng bi trục động cơ khô mỡ bôi trơn',
            logStatus: 'ERROR',
            startTime: '2026-08-28T14:20:00',
            endTime: '2026-08-28T15:05:00',
            durationHours: 0.75,
        },
    ];

    if (!startDate) return rawItems;

    const sDay = dayjs(startDate);
    const eDay = endDate ? dayjs(endDate) : sDay;
    const diffDays = Math.max(0, eDay.diff(sDay, 'day'));

    return rawItems.map((item, idx) => {
        const dayOffset = diffDays === 0 ? 0 : idx % (diffDays + 1);
        const targetDate = sDay.add(dayOffset, 'day').format('YYYY-MM-DD');
        const origStartTime = item.startTime ? item.startTime.split('T')[1] : '08:30:00';
        const origEndTime = item.endTime ? item.endTime.split('T')[1] : '09:15:00';

        return {
            ...item,
            startTime: `${targetDate}T${origStartTime}`,
            endTime: `${targetDate}T${origEndTime}`,
        };
    });
};

export const getMockMtbfData = (): MtbfChartResponse => {
    const days = ['22/08', '23/08', '24/08', '25/08', '26/08', '27/08', '28/08'];
    const machines = ['CNC-01', 'CNC-02', 'CNC-03', 'CNC-04', 'LASER-01', 'PRESS-01'];
    return {
        series: machines.map((m, idx) => ({
            machineId: m,
            machineName: m,
            dataPoints: days.map((day, dIdx) => ({
                label: day,
                value: Number((12 + idx * 3.5 + Math.sin(dIdx + idx) * 4).toFixed(1)),
            })),
        })),
    };
};

export const getMockMttrData = (): MttrChartResponse => {
    const days = ['22/08', '23/08', '24/08', '25/08', '26/08', '27/08', '28/08'];
    const machines = ['CNC-01', 'CNC-02', 'CNC-03', 'CNC-04', 'LASER-01', 'PRESS-01'];
    return {
        series: machines.map((m, idx) => ({
            machineId: m,
            machineName: m,
            dataPoints: days.map((day, dIdx) => ({
                label: day,
                value: Number((0.8 + idx * 0.4 + Math.cos(dIdx + idx) * 0.3).toFixed(2)),
            })),
        })),
    };
};

export const getMockMachineStatusLogs = (_machineId: string): MachineStatusLogChartResponse => {
    const hours = Array.from({ length: 12 }, (_, i) => `${(i + 6).toString().padStart(2, '0')}:00`);
    return {
        series: [
            {
                status: 'RUNTIME',
                data: hours.map((h, i) => ({
                    label: h,
                    hours: i === 3 || i === 4 ? 0.2 : 0.85,
                })),
            },
            {
                status: 'IDLE',
                data: hours.map((h, i) => ({
                    label: h,
                    hours: i === 1 ? 0.3 : 0.05,
                })),
            },
            {
                status: 'ERROR',
                data: hours.map((h, i) => ({
                    label: h,
                    hours: i === 3 ? 0.6 : i === 4 ? 0.4 : 0,
                })),
            },
            {
                status: 'OFFLINE',
                data: hours.map((h) => ({
                    label: h,
                    hours: 0,
                })),
            },
        ],
    };
};
