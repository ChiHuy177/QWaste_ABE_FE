import { useEffect, useRef, useState } from 'react';

export const useAntdTableScroll = (minScrollY = 120) => {
    const tableContainerRef = useRef<HTMLDivElement>(null);
    const [tableScrollY, setTableScrollY] = useState<number>(320);

    useEffect(() => {
        const container = tableContainerRef.current;
        if (!container) return;

        let animationFrameId: number | undefined;

        const getOuterHeight = (element: Element | null, fallback: number) => {
            if (!(element instanceof HTMLElement)) return fallback;

            const styles = window.getComputedStyle(element);
            const marginTop = Number.parseFloat(styles.marginTop) || 0;
            const marginBottom = Number.parseFloat(styles.marginBottom) || 0;
            return element.offsetHeight + marginTop + marginBottom;
        };

        const updateTableScrollHeight = () => {
            if (animationFrameId) {
                window.cancelAnimationFrame(animationFrameId);
            }

            animationFrameId = window.requestAnimationFrame(() => {
                const tableHeader =
                    container.querySelector('.ant-table-header') ||
                    container.querySelector('.ant-table-thead');
                const pagination = container.querySelector('.ant-table-pagination');
                const headerHeight = getOuterHeight(tableHeader, 55);
                const paginationHeight = getOuterHeight(pagination, 56);
                const nextScrollY = Math.max(
                    minScrollY,
                    Math.floor(container.clientHeight - headerHeight - paginationHeight - 2)
                );

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
    }, [minScrollY]);

    return { tableContainerRef, tableScrollY };
};
