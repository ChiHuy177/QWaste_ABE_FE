import type { TaskDeclineReason } from '@/services/UtilsService';

export const USE_MOCK_OPERATOR_REVIEWS = true;

export const MOCK_TASK_DECLINE_REASONS: TaskDeclineReason[] = [
    {
        name: 'WORKLOAD_FULL',
        nameEn: 'Workload full',
        nameVi: 'Qua tai cong viec',
    },
    {
        name: 'SKILL_MISMATCH',
        nameEn: 'Skill mismatch',
        nameVi: 'Khong phu hop ky nang',
    },
    {
        name: 'EQUIPMENT_UNAVAILABLE',
        nameEn: 'Equipment unavailable',
        nameVi: 'Thiet bi khong san sang',
    },
    {
        name: 'OTHER',
        nameEn: 'Other',
        nameVi: 'Ly do khac',
    },
];

export class DemoOperatorReviewService {
    static async getTaskDeclineReasons(): Promise<TaskDeclineReason[]> {
        return MOCK_TASK_DECLINE_REASONS.map((reason) => ({ ...reason }));
    }
}
