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
                if (!container) return;

                const tableHeader =
                    container.querySelector('.ant-table-header') ||
                    container.querySelector('.ant-table-thead');
                const pagination =
                    container.querySelector('.ant-table-pagination') ||
                    container.querySelector('.ant-pagination');

                const containerRect = container.getBoundingClientRect();
                if (containerRect.height === 0) return;

                // Điểm kết thúc của header bảng
                const headerBottom = tableHeader
                    ? tableHeader.getBoundingClientRect().bottom
                    : containerRect.top + 55;

                // Không gian chiếm dụng của pagination (chiều cao thật + margins)
                let paginationSpace = 0;
                if (pagination) {
                    const pagRect = pagination.getBoundingClientRect();
                    const computedStyle = window.getComputedStyle(pagination);
                    const marginTop = parseFloat(computedStyle.marginTop) || 16;
                    const marginBottom = parseFloat(computedStyle.marginBottom) || 16;
                    paginationSpace = pagRect.height + marginTop + marginBottom;
                }

                // Chiều cao khả dụng thực tế của body table trong container
                // Dùng containerRect.bottom thay vì pagination.getBoundingClientRect().top
                // để tránh vòng lặp tự co rút (collapsing feedback loop) khi zoom/resize.
                const availableHeight = containerRect.bottom - headerBottom - paginationSpace - 2;
                const nextScrollY = Math.max(minScrollY, Math.floor(availableHeight));

                setTableScrollY((current) =>
                    Math.abs(current - nextScrollY) > 2 ? nextScrollY : current
                );
            });
        };

        updateTableScrollHeight();

        const resizeObserver = new ResizeObserver(updateTableScrollHeight);
        resizeObserver.observe(container);

        window.addEventListener('resize', updateTableScrollHeight);

        const mutationObserver = new MutationObserver(updateTableScrollHeight);
        mutationObserver.observe(container, { childList: true, subtree: true });

        return () => {
            resizeObserver.disconnect();
            mutationObserver.disconnect();
            window.removeEventListener('resize', updateTableScrollHeight);
            if (animationFrameId) {
                window.cancelAnimationFrame(animationFrameId);
            }
        };
    }, [container, minScrollY]);

    return { tableContainerRef, tableScrollY };
};
