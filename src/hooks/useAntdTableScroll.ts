import { useCallback, useEffect, useState } from 'react';

export const useAntdTableScroll = (minScrollY = 120) => {
    // Callback ref (không dùng useRef tĩnh): Card `loading` unmount/remount hẳn node này
    // mỗi lần fetch (loading true -> false), nên effect phải chạy lại mỗi khi node thật sự
    // gắn vào DOM — nếu dùng useRef, effect chỉ chạy 1 lần và sẽ theo dõi node cũ đã bị gỡ.
    const [container, setContainer] = useState<HTMLDivElement | null>(null);
    const tableContainerRef = useCallback((node: HTMLDivElement | null) => {
        setContainer(node);
    }, []);
    const [tableScrollY, setTableScrollY] = useState<number>(320);

    useEffect(() => {
        if (!container) return;

        let animationFrameId: number | undefined;

        const updateTableScrollHeight = () => {
            if (animationFrameId) {
                window.cancelAnimationFrame(animationFrameId);
            }

            animationFrameId = window.requestAnimationFrame(() => {
                const tableHeader =
                    container.querySelector('.ant-table-header') ||
                    container.querySelector('.ant-table-thead');
                const pagination =
                    container.querySelector('.ant-table-pagination') ||
                    container.querySelector('.ant-pagination');

                const containerRect = container.getBoundingClientRect();
                // Đo qua getBoundingClientRect (vị trí thực trên viewport) thay vì cộng dồn
                // margin/padding thủ công: tự động đúng dù container có padding riêng, hay
                // footer (pagination) nằm trong div bọc có margin — những thứ dễ bị bỏ sót
                // nếu chỉ cộng offsetHeight + margin của chính element tìm được.
                const headerBottom = tableHeader
                    ? tableHeader.getBoundingClientRect().bottom
                    : containerRect.top + 55;
                const footerTop = pagination
                    ? pagination.getBoundingClientRect().top
                    : containerRect.bottom;

                const rawScrollY = Math.max(minScrollY, Math.floor(footerTop - headerBottom - 2));

                // Làm tròn xuống bội số chiều cao 1 dòng thật (đo từ DOM, không hardcode) để
                // ranh giới vùng cuộn luôn rơi đúng giữa 2 dòng — tránh cảnh dòng cuối bị cắt
                // nửa ngay sát trước pagination. Lấy max thay vì dòng đầu tiên vì dòng đầu có
                // thể là dòng "anchor" ẩn (rowSpan group-header, các ô còn lại co về height:0).
                let rowHeight = 0;
                container.querySelectorAll('.ant-table-tbody > tr').forEach((row) => {
                    rowHeight = Math.max(rowHeight, row.getBoundingClientRect().height);
                });
                const nextScrollY =
                    rowHeight > 0
                        ? Math.max(minScrollY, Math.floor(rawScrollY / rowHeight) * rowHeight)
                        : rawScrollY;

                setTableScrollY((current) => (current === nextScrollY ? current : nextScrollY));
            });
        };

        updateTableScrollHeight();

        const resizeObserver = new ResizeObserver(updateTableScrollHeight);
        resizeObserver.observe(container);

        const mutationObserver = new MutationObserver(updateTableScrollHeight);
        mutationObserver.observe(container, { childList: true, subtree: true });

        return () => {
            resizeObserver.disconnect();
            mutationObserver.disconnect();
            if (animationFrameId) {
                window.cancelAnimationFrame(animationFrameId);
            }
        };
    }, [container, minScrollY]);

    return { tableContainerRef, tableScrollY };
};
