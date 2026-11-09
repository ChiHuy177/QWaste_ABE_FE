import { AuditMetaData, SoftDeleteMetaData } from './Metadata';
import { OperationType } from './OperationType';

export type MoldType = 'PRODUCTS_PER_SHOT' | 'SHOTS_PER_PRODUCT';

export interface Mold {
    /** UUID (BE Mold.moldId) */
    moldId: string;
    moldCode: string;
    moldName: string;
    /** Loại khuôn: PRODUCTS_PER_SHOT (1 shot ra N sp) hoặc SHOTS_PER_PRODUCT (N shot ra 1 sp). */
    moldType: MoldType;
    /**
     * Hệ số quy đổi (số nguyên > 0).
     * - PRODUCTS_PER_SHOT -> số sản phẩm mỗi shot (CAV)
     * - SHOTS_PER_PRODUCT -> số shot cho 1 sản phẩm
     */
    conversionFactor: number;
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
    moldType: MoldType;
    conversionFactor: number;
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
    'moldId' | 'moldCode' | 'moldName' | 'moldType' | 'conversionFactor' | 'operationType'
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
