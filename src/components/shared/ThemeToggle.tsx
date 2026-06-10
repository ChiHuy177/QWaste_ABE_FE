'use client';

import { Switch } from 'antd';
import { MoonOutlined, SunOutlined } from '@ant-design/icons';
import { useTheme } from '@/hooks/useTheme';
import { useAppDispatch } from '@/stores/hook';
import { userSettingsActions } from '@/stores';

interface ThemeToggleProps {
    className?: string;
}

export default function ThemeToggle({ className }: ThemeToggleProps) {
    const { resolvedTheme, setTheme } = useTheme();
    const dispatch = useAppDispatch();
    const isDark = resolvedTheme === 'dark';

    const handleToggle = (checked: boolean) => {
        const newTheme = checked ? 'dark' : 'light';
        setTheme(newTheme);
        dispatch(userSettingsActions.updateSettings({ theme: newTheme }));
    };

    return (
        <Switch
            checked={isDark}
            onChange={handleToggle}
            checkedChildren={<MoonOutlined />}
            unCheckedChildren={<SunOutlined />}
            className={className}
        />
    );
}
