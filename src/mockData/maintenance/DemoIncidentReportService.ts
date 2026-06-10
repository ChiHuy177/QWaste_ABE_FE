import type {
    IncidentReport,
    IncidentReportFormData,
    IncidentReportPaginatedParams,
    IncidentReportUpdateData,
} from '@/types/IncidentReport';
import type { PaginatedResult } from '@/types/Common';
import { DEMO_SPACE_AUDIT } from '../admin/factory/spaces';
import { DemoErrorGroupService } from './DemoErrorGroupService';
import { DemoErrorDetailService } from './DemoErrorDetailService';
import { DemoMachineService } from '../admin/factory/DemoMachineService';
import { DemoMoldService } from './DemoMoldService';

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

export const USE_MOCK_MAINTENANCE = true;

const demoIncidentReports: IncidentReport[] = [
    {
        reportId: 1,
        reportNumber: 'RPT-2026-001',
        classification: 'MACHINE',
        machine: { machineId: 'machine-demo-cnc-01', machineName: 'CNC Machine 01', machineCode: 'CNC-01' },
        description: 'Cutting bit jammed mid-operation. Machine halted automatically.',
        imageUrls: [],
        rootCause: 'Excessive feed rate caused bit to seize against workpiece.',
        errorGroup: { errorGroupId: 1, errorGroupName: 'Mechanical Failure' },
        errorDetail: { errorDetailId: 1, errorCode: 'ERR-001', errorName: 'Bit Stuck' },
        status: 'RESOLVED',
        reportedBy: 'user-maintenance-01',
        reportedByName: 'Nguyen Van A',
        reportedAt: '2026-06-03T08:10:44.000Z',
        resolvedAt: '2026-06-03T09:30:00.000Z',
        auditMetaData: DEMO_SPACE_AUDIT,
    },
    {
        reportId: 2,
        reportNumber: 'RPT-2026-002',
        classification: 'MACHINE',
        machine: { machineId: 'machine-demo-cnc-01', machineName: 'CNC Machine 01', machineCode: 'CNC-01' },
        description: 'Motor temperature exceeded safe threshold, emergency shutdown triggered.',
        imageUrls: [],
        rootCause: 'Cooling fan obstructed by metal chips. Fan cleaned and machine restarted.',
        errorGroup: { errorGroupId: 2, errorGroupName: 'Electrical Issue' },
        errorDetail: { errorDetailId: 5, errorCode: 'ERR-005', errorName: 'Overheated' },
        status: 'RESOLVED',
        reportedBy: 'user-maintenance-01',
        reportedByName: 'Nguyen Van A',
        reportedAt: '2026-06-03T09:58:12.000Z',
        resolvedAt: '2026-06-03T11:15:00.000Z',
        auditMetaData: DEMO_SPACE_AUDIT,
    },
    {
        reportId: 3,
        reportNumber: 'RPT-2026-003',
        classification: 'MACHINE',
        machine: { machineId: 'machine-demo-cnc-01', machineName: 'CNC Machine 01', machineCode: 'CNC-01' },
        description: 'Bit fractured at 10:42 during aluminum part machining.',
        imageUrls: [],
        rootCause: 'Under investigation.',
        errorGroup: { errorGroupId: 1, errorGroupName: 'Mechanical Failure' },
        errorDetail: { errorDetailId: 2, errorCode: 'ERR-002', errorName: 'Bit Broken' },
        status: 'IN_PROGRESS',
        reportedBy: 'user-maintenance-02',
        reportedByName: 'Tran Thi B',
        reportedAt: '2026-06-03T10:42:20.000Z',
        auditMetaData: DEMO_SPACE_AUDIT,
    },
    {
        reportId: 4,
        reportNumber: 'RPT-2026-004',
        classification: 'MACHINE',
        machine: { machineId: 'machine-demo-cnc-01', machineName: 'CNC Machine 01', machineCode: 'CNC-01' },
        description: 'Bit stuck again during second shift, machine auto-stopped.',
        imageUrls: [],
        rootCause: 'Pending inspection.',
        errorGroup: { errorGroupId: 1, errorGroupName: 'Mechanical Failure' },
        errorDetail: { errorDetailId: 1, errorCode: 'ERR-001', errorName: 'Bit Stuck' },
        status: 'OPEN',
        reportedBy: 'user-maintenance-02',
        reportedByName: 'Tran Thi B',
        reportedAt: '2026-06-03T16:23:08.000Z',
        auditMetaData: DEMO_SPACE_AUDIT,
    },
    {
        reportId: 5,
        reportNumber: 'RPT-2026-005',
        classification: 'MACHINE',
        machine: { machineId: 'machine-demo-lathe-01', machineName: 'CNC Lathe 01', machineCode: 'LATHE-01' },
        description: 'Welding nozzle blocked, producing inconsistent weld seam.',
        imageUrls: [],
        rootCause: 'Nozzle replaced. Residue buildup from extended use without cleaning.',
        errorGroup: { errorGroupId: 4, errorGroupName: 'Tooling & Mold Issue' },
        errorDetail: { errorDetailId: 8, errorCode: 'ERR-008', errorName: 'Welding Nozzle Contaminated' },
        status: 'RESOLVED',
        reportedBy: 'user-maintenance-01',
        reportedByName: 'Nguyen Van A',
        reportedAt: '2026-06-03T09:58:12.000Z',
        resolvedAt: '2026-06-03T10:45:00.000Z',
        auditMetaData: DEMO_SPACE_AUDIT,
    },
    {
        reportId: 6,
        reportNumber: 'RPT-2026-006',
        classification: 'MACHINE',
        machine: { machineId: 'machine-demo-lathe-01', machineName: 'CNC Lathe 01', machineCode: 'LATHE-01' },
        description: 'Gas pressure sensor alarm triggered during welding operation.',
        imageUrls: [],
        rootCause: 'Gas cylinder pressure dropped below minimum threshold. Cylinder replaced.',
        errorGroup: { errorGroupId: 1, errorGroupName: 'Mechanical Failure' },
        errorDetail: { errorDetailId: 4, errorCode: 'ERR-004', errorName: 'Low Gas Flow Rate' },
        status: 'RESOLVED',
        reportedBy: 'user-maintenance-02',
        reportedByName: 'Tran Thi B',
        reportedAt: '2026-06-03T11:22:39.000Z',
        resolvedAt: '2026-06-03T12:00:00.000Z',
        auditMetaData: DEMO_SPACE_AUDIT,
    },
    {
        reportId: 7,
        reportNumber: 'RPT-2026-007',
        classification: 'MACHINE',
        machine: { machineId: 'machine-demo-cut-01', machineName: 'Laser Cutting 01', machineCode: 'CUT-01' },
        description: 'Vacuum suction not holding sheet metal. Part shifted during cut.',
        imageUrls: [],
        rootCause: 'Suction cup seal worn. Seal replaced.',
        errorGroup: { errorGroupId: 1, errorGroupName: 'Mechanical Failure' },
        errorDetail: { errorDetailId: 3, errorCode: 'ERR-003', errorName: 'Suction Defective' },
        status: 'RESOLVED',
        reportedBy: 'user-maintenance-01',
        reportedByName: 'Nguyen Van A',
        reportedAt: '2026-06-03T09:32:00.000Z',
        resolvedAt: '2026-06-03T10:15:00.000Z',
        auditMetaData: DEMO_SPACE_AUDIT,
    },
    {
        reportId: 8,
        reportNumber: 'RPT-2026-008',
        classification: 'MACHINE',
        machine: { machineId: 'machine-demo-cut-01', machineName: 'Laser Cutting 01', machineCode: 'CUT-01' },
        description: 'Laser beam quality deteriorated, leaving burn marks on cut edges.',
        imageUrls: [],
        rootCause: 'Protective lens contaminated. Lens cleaned with optical cloth.',
        errorGroup: { errorGroupId: 4, errorGroupName: 'Tooling & Mold Issue' },
        errorDetail: { errorDetailId: 11, errorCode: 'ERR-011', errorName: 'Laser Optics Contaminated' },
        status: 'RESOLVED',
        reportedBy: 'user-maintenance-02',
        reportedByName: 'Tran Thi B',
        reportedAt: '2026-06-03T10:17:46.000Z',
        resolvedAt: '2026-06-03T11:00:00.000Z',
        auditMetaData: DEMO_SPACE_AUDIT,
    },
    {
        reportId: 9,
        reportNumber: 'RPT-2026-009',
        classification: 'MACHINE',
        machine: { machineId: 'machine-demo-heat-01', machineName: 'Heat Treatment 01', machineCode: 'HEAT-01' },
        description: 'Spray gun producing uneven coating pattern. Surface quality below spec.',
        imageUrls: [],
        rootCause: 'Nozzle tip clogged. Cleaned with solvent and airflow test passed.',
        errorGroup: { errorGroupId: 4, errorGroupName: 'Tooling & Mold Issue' },
        errorDetail: { errorDetailId: 10, errorCode: 'ERR-010', errorName: 'Spray Gun Clogged' },
        status: 'RESOLVED',
        reportedBy: 'user-maintenance-01',
        reportedByName: 'Nguyen Van A',
        reportedAt: '2026-06-03T10:17:46.000Z',
        resolvedAt: '2026-06-03T11:30:00.000Z',
        auditMetaData: DEMO_SPACE_AUDIT,
    },
    {
        reportId: 10,
        reportNumber: 'RPT-2026-010',
        classification: 'MACHINE',
        machine: { machineId: 'machine-demo-heat-01', machineName: 'Heat Treatment 01', machineCode: 'HEAT-01' },
        description: 'Coat material reservoir empty mid-batch. Production halted.',
        imageUrls: [],
        rootCause: 'Material consumption rate increased. Stock replenished.',
        errorGroup: { errorGroupId: 4, errorGroupName: 'Tooling & Mold Issue' },
        errorDetail: { errorDetailId: 12, errorCode: 'ERR-012', errorName: 'Refill Coat Material' },
        status: 'RESOLVED',
        reportedBy: 'user-maintenance-02',
        reportedByName: 'Tran Thi B',
        reportedAt: '2026-06-03T08:02:59.000Z',
        resolvedAt: '2026-06-03T08:45:00.000Z',
        auditMetaData: DEMO_SPACE_AUDIT,
    },
    {
        reportId: 11,
        reportNumber: 'RPT-2026-011',
        classification: 'MOLD',
        mold: { moldId: 1, moldCode: 'MOLD-A01', moldName: 'Injection Mold A01' },
        description: 'Mold jammed between cycles. Ejector pins unable to retract.',
        imageUrls: [],
        rootCause: 'Foreign debris lodged in ejector pin channel. Cleaned and lubricated.',
        errorGroup: { errorGroupId: 4, errorGroupName: 'Tooling & Mold Issue' },
        errorDetail: { errorDetailId: 9, errorCode: 'ERR-009', errorName: 'Mould Stuck' },
        status: 'RESOLVED',
        reportedBy: 'user-maintenance-01',
        reportedByName: 'Nguyen Van A',
        reportedAt: '2026-06-03T11:38:28.000Z',
        resolvedAt: '2026-06-03T13:00:00.000Z',
        auditMetaData: DEMO_SPACE_AUDIT,
    },
    {
        reportId: 12,
        reportNumber: 'RPT-2026-012',
        classification: 'MOLD',
        mold: { moldId: 2, moldCode: 'MOLD-B02', moldName: 'Compression Mold B02' },
        description: 'Operator placed part upside down. Output was scrapped.',
        imageUrls: [],
        rootCause: 'Operator loaded part without checking orientation marker.',
        errorGroup: { errorGroupId: 5, errorGroupName: 'Operator Error' },
        errorDetail: { errorDetailId: 13, errorCode: 'ERR-013', errorName: 'Incorrect Placement' },
        status: 'RESOLVED',
        reportedBy: 'user-maintenance-02',
        reportedByName: 'Tran Thi B',
        reportedAt: '2026-06-03T13:06:47.000Z',
        resolvedAt: '2026-06-03T13:20:00.000Z',
        auditMetaData: DEMO_SPACE_AUDIT,
    },
];

let reportCounter = demoIncidentReports.length;

const getNextReportId = () =>
    Math.max(...demoIncidentReports.map((r) => r.reportId), 0) + 1;

const getNextReportNumber = () => {
    reportCounter += 1;
    return `RPT-2026-${String(reportCounter).padStart(3, '0')}`;
};

const findReport = (reportId: number) => {
    const report = demoIncidentReports.find((r) => r.reportId === reportId);
    if (!report) throw new Error('Demo incident report was not found');
    return report;
};

const normalizeText = (value?: string) => value?.trim().toLowerCase();
const includesText = (source: string | undefined, search: string) =>
    source?.toLowerCase().includes(search) ?? false;

export class DemoIncidentReportService {
    static async getIncidentReportsPaginated(
        params: IncidentReportPaginatedParams
    ): Promise<PaginatedResult<IncidentReport>> {
        const searchTerm = normalizeText(params.search);
        const sortParams = Array.isArray(params.sort)
            ? params.sort
            : [params.sort ?? 'reportedAt,DESC'];

        const filtered = demoIncidentReports
            .filter((r) => {
                if (params.classification && r.classification !== params.classification) return false;
                if (params.status && params.status !== 'ALL' && r.status !== params.status) return false;
                if (params.machineId && r.machine?.machineId !== params.machineId) return false;
                if (params.moldId && r.mold?.moldId !== params.moldId) return false;
                if (params.errorGroupId && r.errorGroup.errorGroupId !== params.errorGroupId) return false;
                if (params.fromDate && r.reportedAt < params.fromDate) return false;
                if (params.toDate && r.reportedAt > params.toDate) return false;
                if (searchTerm) {
                    return (
                        includesText(r.reportNumber, searchTerm) ||
                        includesText(r.description, searchTerm) ||
                        includesText(r.machine?.machineName, searchTerm) ||
                        includesText(r.machine?.machineCode, searchTerm) ||
                        includesText(r.mold?.moldName, searchTerm) ||
                        includesText(r.mold?.moldCode, searchTerm) ||
                        includesText(r.errorDetail.errorName, searchTerm) ||
                        includesText(r.reportedByName, searchTerm)
                    );
                }
                return true;
            })
            .sort((a, b) => {
                for (const sortParam of sortParams) {
                    const [field, direction] = sortParam.split(',');
                    const multiplier = direction === 'ASC' ? 1 : -1;
                    if (field === 'reportedAt') {
                        const result = a.reportedAt.localeCompare(b.reportedAt) * multiplier;
                        if (result !== 0) return result;
                    }
                    if (field === 'reportNumber') {
                        const result = a.reportNumber.localeCompare(b.reportNumber) * multiplier;
                        if (result !== 0) return result;
                    }
                }
                return 0;
            });

        const startIndex = params.page * params.size;
        const content = filtered.slice(startIndex, startIndex + params.size);
        const totalPages = Math.ceil(filtered.length / params.size);

        return clone({
            content,
            pageNumber: params.page,
            pageSize: params.size,
            totalElements: filtered.length,
            totalPages,
            first: params.page === 0,
            last: params.page >= totalPages - 1,
            empty: content.length === 0,
        });
    }

    static async getIncidentReportById(reportId: number): Promise<IncidentReport> {
        return clone(findReport(reportId));
    }

    static async getAllIncidentReports(): Promise<IncidentReport[]> {
        return clone([...demoIncidentReports].sort((a, b) => b.reportedAt.localeCompare(a.reportedAt)));
    }

    static async createIncidentReport(data: IncidentReportFormData): Promise<IncidentReport> {
        const now = new Date().toISOString();

        const errorGroup = DemoErrorGroupService.findSync(data.errorGroupId);
        const errorDetail = DemoErrorDetailService.findSync(data.errorDetailId);

        const newReport: IncidentReport = {
            reportId: getNextReportId(),
            reportNumber: getNextReportNumber(),
            classification: data.classification,
            description: data.description,
            imageUrls: data.imageUrls ?? [],
            rootCause: data.rootCause,
            errorGroup: {
                errorGroupId: data.errorGroupId,
                errorGroupName: errorGroup?.errorGroupName ?? '',
            },
            errorDetail: {
                errorDetailId: data.errorDetailId,
                errorCode: errorDetail?.errorCode ?? '',
                errorName: errorDetail?.errorName ?? '',
            },
            status: 'OPEN',
            reportedBy: 'user-maintenance-demo',
            reportedByName: 'Demo Technician',
            reportedAt: now,
            auditMetaData: {
                createdAt: now,
                updatedAt: now,
                createdBy: 'Demo Technician',
                updatedBy: 'Demo Technician',
            },
        };

        if (data.classification === 'MACHINE' && data.machineId) {
            const machine = DemoMachineService.findSync(data.machineId);
            newReport.machine = {
                machineId: data.machineId,
                machineName: machine?.machineName ?? data.machineId,
                machineCode: machine?.machineCode ?? data.machineId,
            };
        }

        if (data.classification === 'MOLD' && data.moldId) {
            const mold = DemoMoldService.findSync(data.moldId);
            newReport.mold = {
                moldId: data.moldId,
                moldCode: mold?.moldCode ?? String(data.moldId),
                moldName: mold?.moldName ?? String(data.moldId),
            };
        }

        demoIncidentReports.push(newReport);
        return clone(newReport);
    }

    static async updateIncidentReport(data: IncidentReportUpdateData): Promise<IncidentReport> {
        const report = findReport(data.reportId);
        report.classification = data.classification;
        report.description = data.description;
        report.imageUrls = data.imageUrls ?? report.imageUrls;
        report.rootCause = data.rootCause;
        report.status = data.status;
        report.resolvedAt = data.resolvedAt;
        report.errorGroup = { ...report.errorGroup, errorGroupId: data.errorGroupId };
        report.errorDetail = { ...report.errorDetail, errorDetailId: data.errorDetailId };
        report.auditMetaData = {
            ...(report.auditMetaData ?? DEMO_SPACE_AUDIT),
            updatedAt: new Date().toISOString(),
            updatedBy: 'Demo Technician',
        };
        return clone(report);
    }

    static async deleteIncidentReport(reportId: number): Promise<void> {
        const index = demoIncidentReports.findIndex((r) => r.reportId === reportId);
        if (index === -1) throw new Error('Demo incident report was not found');
        demoIncidentReports.splice(index, 1);
    }

    static async getTodayIncidentReports(): Promise<IncidentReport[]> {
        const today = new Date().toISOString().slice(0, 10);
        return clone(
            demoIncidentReports.filter((r) => r.reportedAt.startsWith(today))
        );
    }
}
