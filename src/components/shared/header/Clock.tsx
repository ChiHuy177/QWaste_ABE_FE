'use client';
import { useEffect, useState, memo } from 'react';
import { useTheme } from '@/hooks/useTheme';
import { Grid } from 'antd';

const { useBreakpoint } = Grid;

export const Clock = memo(function Clock() {
    const [time, setTime] = useState<Date | null>(null);
    const { resolvedTheme } = useTheme();
    const screens = useBreakpoint();
    const isDark = resolvedTheme === 'dark';

    useEffect(() => {
        setTime(new Date());
        const timer = setInterval(() => {
            setTime(new Date());
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    if (!time) return null;

    const formatTime = () => {
        const hours = time.getHours().toString().padStart(2, '0');
        const minutes = time.getMinutes().toString().padStart(2, '0');
        const seconds = time.getSeconds().toString().padStart(2, '0');
        return { hours, minutes, seconds };
    };

    const formatDate = () => {
        const days = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
        const day = days[time.getDay()];
        const date = time.getDate().toString().padStart(2, '0');
        const month = (time.getMonth() + 1).toString().padStart(2, '0');
        const year = time.getFullYear();
        return `${day}, ${date}/${month}/${year}`;
    };

    const { hours, minutes, seconds } = formatTime();

    // Ẩn trên mobile
    if (!screens.md) return null;

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
            }}
        >
            {/* Date */}
            <div
                style={{
                    fontSize: 12,
                    fontWeight: 500,
                    color: isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.45)',
                    lineHeight: 1.3,
                }}
            >
                {formatDate()}
            </div>

            {/* Time */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'baseline',
                    fontFamily:
                        'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Monaco, Consolas, monospace',
                    lineHeight: 1.2,
                    marginTop: 2,
                }}
            >
                <span
                    style={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: isDark ? 'rgba(255, 255, 255, 0.85)' : 'rgba(0, 0, 0, 0.85)',
                        letterSpacing: '0.5px',
                    }}
                >
                    {hours}
                    <span style={{ opacity: 0.5 }}>:</span>
                    {minutes}
                </span>
                <span
                    style={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: isDark ? 'rgba(255, 255, 255, 0.85)' : 'rgba(0, 0, 0, 0.85)',
                        letterSpacing: '0.5px',
                    }}
                >
                    :{seconds}
                </span>
            </div>
        </div>
    );
});
