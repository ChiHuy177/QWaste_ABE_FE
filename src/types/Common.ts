export type SelectOption = {
    value: number;
    label: string;
};

export interface PaginatedResult<T> {
    content: T[];
    pageNumber: number;
    pageSize: number;
    totalElements: number;
    totalPages: number;
    first: boolean;
    last: boolean;
    empty: boolean;
}
export interface CursorPage<T> {
    items: T[];
    nextCursor: string | null;
    hasMore: boolean;
}
