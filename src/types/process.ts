// types/process.ts

export interface Process {
  name: string;
  id: string;
  drawingCodeId: string;
  machineId: string;
  predictedDuration?: number; // measure in miliseconds
  // the predicted end time will be start time + predicted duration
  startTime?: number;
  endTime?: number;
  taskStatus: ProcessTaskStatus;
  approved?: string | null; // 'true', 'false', or null
  status?: string | null; // Currently unused
  createdTime?: number;
  updatedTime?: number;
  qcRemarks?: string;

  // Populated fields from relations
  drawingCodeName?: string;
  machineName?: string;
}

export type ProcessTaskStatus = "to_do" | "in_progress" | "wait_qc" | "checked";

export interface ProcessCreateRequest {
  name: string;
  machineId: string;
  drawingCodeId: string;
  predictedDuration?: number;
}

export interface ProcessUpdateRequest {
  name?: string;
  machineId?: string;
  predictedDuration?: number;
  startTime?: number;
  endTime?: number;
  taskStatus?: ProcessTaskStatus;
  approved?: string | null;
  qcRemarks?: string;
}

export interface ProcessResponse {
  success: boolean;
  data?: Process;
  message?: string;
}

export interface ProcessListResponse {
  success: boolean;
  data?: Process[];
  message?: string;
}

// Drawing Code interface for dropdown selection
export interface DrawingCodeOption {
  id: string;
  drawingCodeId: string;
  name: string;
  description?: string;
}

// Machine interface for dropdown selection
export interface MachineOption {
  id: string;
  machineId: string;
  name: string;
  description?: string;
  status?: string;
}
