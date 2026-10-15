import { useCallback, useLayoutEffect, useState } from 'react';

export const useAntdTableScroll = (minScrollY = 120) => {
    // State (not useRef) so the container element is a reactive dependency below.
    // Callers that sit behind a loading flag (e.g. antd <Card loading> swaps its
    // children for a Skeleton and back) unmount/remount this div; a callback ref
    // fires again on every such attach, whereas a plain ref object would silently
    // stay null forever if the node didn't exist yet on the hook's first run.
    const [container, setContainer] = useState<HTMLDivElement | null>(null);
    const tableContainerRef = useCallback((node: HTMLDivElement | null) => {
        setContainer(node);
    }, []);
    const [tableScrollY, setTableScrollY] = useState<number>(320);

    // useLayoutEffect (not useEffect) so the very first measurement below commits
    // before the browser paints — otherwise the table flashes at the 320 fallback
    // height for one frame, then jumps to the real height, visibly shifting the
    // pagination bar every time this hook mounts (e.g. first entry to the page).
    useLayoutEffect(() => {
        if (!container) return;

        let animationFrameId: number | undefined;

        // Geometry-based, not offsetHeight + computed margin: some callers (DailyTable)
        // wrap the <Pagination> in their own div with its own margin-top, so the margin
        // doesn't live on the `.ant-pagination` node itself — reading that node's computed
        // style silently misses it and overshoots scrollY, clipping the last table row
        // under the pagination row. Measuring the actual on-screen gap between the header's
        // bottom edge and the next element's top edge (pagination, or the container's own
        // bottom edge when there's no pagination) is correct regardless of which element
        // the spacing happens to be styled on.
        //
        // FOOTER_GAP is subtracted from the raw measurement for two reasons at once:
        // (1) visual breathing room between the table and whatever sits below it, and
        // (2) safety slack against this being a hair too generous (sub-pixel rounding,
        // fonts not fully settled yet, etc.) — a near-zero gap meant any tiny overshoot
        // clipped the last row under the pagination bar. Note bumping the *pagination's*
        // own margin-top does NOT create this gap: it sits in a flex column next to the
        // table's flex:1 wrapper, so the wrapper simply shrinks by the same amount and
        // the pagination's final on-screen position is unchanged — the gap has to come
        // from shrinking the table side (here), not padding the pagination side.
        const FOOTER_GAP = 16;

        const measureScrollHeight = () => {
            const containerRect = container.getBoundingClientRect();
            const tableHeader =
                container.querySelector('.ant-table-header') ||
                container.querySelector('.ant-table-thead');
            // Built-in Table pagination renders `.ant-table-pagination`; pages that pass
            // pagination={false} and render their own <Pagination> (e.g. DailyTable) only
            // get the plain `.ant-pagination` class — match both.
            const pagination =
                container.querySelector('.ant-table-pagination') ||
                container.querySelector('.ant-pagination');

            const headerBottom =
                tableHeader instanceof HTMLElement
                    ? tableHeader.getBoundingClientRect().bottom
                    : containerRect.top + 55;
            const footerTop =
                pagination instanceof HTMLElement
                    ? pagination.getBoundingClientRect().top
                    : containerRect.bottom;

            return Math.max(minScrollY, Math.floor(footerTop - headerBottom - FOOTER_GAP));
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
    }, [container, minScrollY]);

    return { tableContainerRef, tableScrollY };
};
