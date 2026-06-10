'use client';

import { Spin } from 'antd';

interface FullPageLoaderProps {
    message?: string;
}

export const FullPageLoader = ({ message }: FullPageLoaderProps) => {
    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                width: '100vw',
                height: '100vh',
                backgroundColor: 'var(--background)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 9999,
            }}
        >
            <Spin size="large" />
        </div>
    );
};
