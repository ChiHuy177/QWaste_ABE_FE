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

/**
 * DTO rút gọn từ GET /api/molds/v1/picking — chỉ gồm field cần cho select khuôn và tra
 * operationType (lọc máy tương thích). BE đã loại khuôn soft-delete nên FE không lọc lại.
 */
export type MoldPickingResponse = Pick<
    Mold,
    'moldId' | 'moldCode' | 'moldName' | 'outputPerShot' | 'operationType'
>;

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
