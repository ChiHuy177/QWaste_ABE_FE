'use client';

import { useLayoutEffect } from 'react';

export function usePageTitle(title: string) {
    useLayoutEffect(() => {
        const prevTitle = document.title;
        document.title = title;

        return () => {
            document.title = prevTitle;
        };
    }, [title]);
}
