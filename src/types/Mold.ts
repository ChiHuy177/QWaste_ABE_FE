import { AuditMetaData, SoftDeleteMetaData } from './Metadata';
import { OperationType } from './OperationType';

export interface Mold {
    /** UUID (BE Mold.moldId) */
    moldId: string;
    moldCode: string;
    moldName: string;
    /** Cavity factor — số sản phẩm hoàn thành mỗi nhát ép. */
    outputPerShot: number;
    description?: string;
    /** Công đoạn khuôn dùng — xác định khuôn tương thích với máy nào (machine.operationTypeId). */
    operationType: OperationType;
    auditMetaData?: AuditMetaData;
    isDeleted?: boolean;
    softDeleteMetaData?: SoftDeleteMetaData;
}

export interface MoldFormData {
    moldCode: string;
    moldName: string;
    outputPerShot: number;
    description?: string;
    operationTypeId: number;
}

export interface MoldUpdateFormData extends MoldFormData {
    moldId: string;
}

/** Mold khả dụng cho picker/kế hoạch: chưa bị soft-delete. */
export const isMoldSchedulable = (mold: Mold): boolean =>
    !(mold.isDeleted === true || mold.softDeleteMetaData?.isDeleted === true);

export interface MoldImportRowError {
    rowIndex: number;
    column: string;
    message: string;
}

export interface MoldImportResult {
    totalInserted: number;
    errors: MoldImportRowError[];
}

export interface MoldPaginatedParams {
    page: number;
    size: number;
    sort?: string | string[];
    search?: string;
    moldCode?: string;
    moldName?: string;
    operationTypeId?: number;
}
