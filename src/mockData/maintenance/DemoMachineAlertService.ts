import type { MachineAlert } from '@/types/MachineAlert';

const minsAgo = (mins: number): string =>
    new Date(Date.now() - mins * 60_000).toISOString();

const SEED_ALERTS: MachineAlert[] = [
    // ── ACTIVE ────────────────────────────────────────────────────────────────
    {
        alertId: 'ALERT-001',
        classification: 'MACHINE',
        machine: { machineId: 'machine-demo-cnc-01', machineName: 'CNC Machine 01', machineCode: 'CNC-01' },
        errorGroup: { errorGroupId: 1, errorGroupName: 'Mechanical Failure' },
        errorDetail: { errorDetailId: 1, errorCode: 'ERR-001', errorName: 'Bit Stuck', description: 'Cutting bit is jammed and unable to rotate or move.' },
        severity: 'CRITICAL',
        status: 'ACTIVE',
        detectedAt: minsAgo(135),
    },
    {
        alertId: 'ALERT-002',
        classification: 'MACHINE',
        machine: { machineId: 'machine-demo-cnc-02', machineName: 'CNC Machine 02', machineCode: 'CNC-02' },
        errorGroup: { errorGroupId: 2, errorGroupName: 'Electrical Issue' },
        errorDetail: { errorDetailId: 5, errorCode: 'ERR-005', errorName: 'Overheated', description: 'Machine or motor component reached critical temperature threshold.' },
        severity: 'CRITICAL',
        status: 'ACTIVE',
        detectedAt: minsAgo(45),
    },
    {
        alertId: 'ALERT-003',
        classification: 'MACHINE',
        machine: { machineId: 'machine-demo-cut-01', machineName: 'Laser Cutting 01', machineCode: 'CUT-01' },
        errorGroup: { errorGroupId: 4, errorGroupName: 'Tooling & Mold Issue' },
        errorDetail: { errorDetailId: 11, errorCode: 'ERR-011', errorName: 'Laser Optics Contaminated', description: 'Laser lens or mirror is dirty, reducing beam quality and cut accuracy.' },
        severity: 'HIGH',
        status: 'ACTIVE',
        detectedAt: minsAgo(20),
    },
    // ── REPORTED ──────────────────────────────────────────────────────────────
    {
        alertId: 'ALERT-004',
        classification: 'MACHINE',
        machine: { machineId: 'machine-demo-lathe-01', machineName: 'CNC Lathe 01', machineCode: 'LATHE-01' },
        errorGroup: { errorGroupId: 1, errorGroupName: 'Mechanical Failure' },
        errorDetail: { errorDetailId: 4, errorCode: 'ERR-004', errorName: 'Low Gas Flow Rate', description: 'Insufficient assist gas pressure detected during cutting process.' },
        severity: 'HIGH',
        status: 'REPORTED',
        detectedAt: minsAgo(180),
    },
    {
        alertId: 'ALERT-005',
        classification: 'MOLD',
        mold: { moldId: 1, moldName: 'Injection Mold A01', moldCode: 'MOLD-A01' },
        errorGroup: { errorGroupId: 4, errorGroupName: 'Tooling & Mold Issue' },
        errorDetail: { errorDetailId: 9, errorCode: 'ERR-009', errorName: 'Mould Stuck', description: 'Mold cannot be opened or closed properly due to jamming.' },
        severity: 'MEDIUM',
        status: 'REPORTED',
        detectedAt: minsAgo(240),
    },
    // ── RESOLVED ──────────────────────────────────────────────────────────────
    {
        alertId: 'ALERT-006',
        classification: 'MOLD',
        mold: { moldId: 2, moldName: 'Compression Mold B02', moldCode: 'MOLD-B02' },
        errorGroup: { errorGroupId: 4, errorGroupName: 'Tooling & Mold Issue' },
        errorDetail: { errorDetailId: 10, errorCode: 'ERR-010', errorName: 'Spray Gun Clogged', description: 'Coating spray gun nozzle is blocked, preventing uniform coverage.' },
        severity: 'MEDIUM',
        status: 'RESOLVED',
        detectedAt: minsAgo(360),
    },
];

let _alerts: MachineAlert[] = SEED_ALERTS.map((a) => ({ ...a }));

export class DemoMachineAlertService {
    static getAllAlerts(): MachineAlert[] {
        return [..._alerts];
    }

    /** Remove from list — only allowed for ACTIVE alerts */
    static dismissAlert(alertId: string): void {
        const alert = _alerts.find((a) => a.alertId === alertId);
        if (alert && alert.status === 'ACTIVE') {
            _alerts = _alerts.filter((a) => a.alertId !== alertId);
        }
    }

    /** Set status to REPORTED after a report is created, storing the linked reportId */
    static markAsReported(alertId: string, reportId?: number): void {
        const alert = _alerts.find((a) => a.alertId === alertId);
        if (alert) { alert.status = 'REPORTED'; alert.reportId = reportId; }
    }

    /** Resolve the alert linked to an incident report */
    static resolveByReportId(reportId: number): void {
        const alert = _alerts.find((a) => a.reportId === reportId);
        if (alert) alert.status = 'RESOLVED';
    }

    /** Set status to RESOLVED */
    static markAsResolved(alertId: string): void {
        const alert = _alerts.find((a) => a.alertId === alertId);
        if (alert) alert.status = 'RESOLVED';
    }

    static reset(): void {
        _alerts = SEED_ALERTS.map((a) => ({ ...a }));
    }
}
