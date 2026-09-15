import { useLayoutEffect, useRef, useState } from 'react';

export const useAntdTableScroll = (minScrollY = 120) => {
    const tableContainerRef = useRef<HTMLDivElement>(null);
    const [tableScrollY, setTableScrollY] = useState<number>(320);

    // useLayoutEffect (not useEffect) so the very first measurement below commits
    // before the browser paints — otherwise the table flashes at the 320 fallback
    // height for one frame, then jumps to the real height, visibly shifting the
    // pagination bar every time this hook mounts (e.g. first entry to the page).
    useLayoutEffect(() => {
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

        const measureScrollHeight = () => {
            const tableHeader =
                container.querySelector('.ant-table-header') ||
                container.querySelector('.ant-table-thead');
            const pagination = container.querySelector('.ant-table-pagination');
            const headerHeight = getOuterHeight(tableHeader, 55);
            const paginationHeight = getOuterHeight(pagination, 56);
            return Math.max(
                minScrollY,
                Math.floor(container.clientHeight - headerHeight - paginationHeight - 2)
            );
        };

        // Synchronous first measurement: runs pre-paint, so no flash of the fallback height.
        setTableScrollY((current) => {
            const next = measureScrollHeight();
            return current === next ? current : next;
        });

        // Later updates (resize, table content changes) can debounce via rAF safely —
        // by then the correct height is already on screen, so a one-frame delay doesn't flash.
        const scheduleUpdate = () => {
            if (animationFrameId) {
                window.cancelAnimationFrame(animationFrameId);
            }

            animationFrameId = window.requestAnimationFrame(() => {
                setTableScrollY((current) => {
                    const next = measureScrollHeight();
                    return current === next ? current : next;
                });
            });
        };

        const resizeObserver = new ResizeObserver(scheduleUpdate);
        resizeObserver.observe(container);

        const mutationObserver = new MutationObserver(scheduleUpdate);
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
