import '@testing-library/jest-dom';

// ─── Shim cho antd trên jsdom ───────────────────────────────────────────────
// antd (Modal/portal/scroll locker, responsive observer, Timeline...) dùng vài API trình
// duyệt mà jsdom chưa implement. Thiếu các shim này thì mọi test render component antd sẽ
// throw ngay ở bước render.

// jsdom throw khi getComputedStyle được gọi kèm pseudo-element → bỏ tham số thứ 2.
const originalGetComputedStyle = window.getComputedStyle;
window.getComputedStyle = ((elt: Element) =>
    originalGetComputedStyle(elt)) as typeof window.getComputedStyle;

if (!('matchMedia' in window)) {
    Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: (query: string) => ({
            matches: false,
            media: query,
            onchange: null,
            addEventListener: jest.fn(),
            removeEventListener: jest.fn(),
            addListener: jest.fn(),
            removeListener: jest.fn(),
            dispatchEvent: jest.fn(),
        }),
    });
}

if (!('ResizeObserver' in window)) {
    class ResizeObserverStub {
        observe = jest.fn();
        unobserve = jest.fn();
        disconnect = jest.fn();
    }
    Object.defineProperty(window, 'ResizeObserver', {
        writable: true,
        value: ResizeObserverStub,
    });
    global.ResizeObserver = ResizeObserverStub as unknown as typeof ResizeObserver;
}
