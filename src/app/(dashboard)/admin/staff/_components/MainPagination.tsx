'use client';
import { Pagination, Flex } from 'antd';
import { memo } from 'react';

interface MainPaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}

export const MainPagination = memo(
    ({ currentPage, totalPages, onPageChange }: MainPaginationProps) => {
        return (
            <Flex justify="center" style={{ padding: '5px 0' }}>
                <Pagination
                    current={currentPage}
                    total={totalPages * 3} // 3 operators per page
                    pageSize={3}
                    onChange={onPageChange}
                    showSizeChanger={false}
                    showQuickJumper={totalPages > 5}
                    showTotal={(total, range) => `Page ${currentPage} of ${totalPages}`}
                />
            </Flex>
        );
    }
);

MainPagination.displayName = 'MainPagination';
