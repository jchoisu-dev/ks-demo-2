export type PaginationMeta = {
    page: number;
    limit: number;
    totalRecords: number;
    totalPages: number;
    hasPreviousPage: boolean;
    hasNextPage: boolean;
    onPageChange: (page: number) => void;
}
export type PaginatedResponse<T> = {
    data: T;
    meta: PaginationMeta;
}