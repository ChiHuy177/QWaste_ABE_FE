'use client';

import { ConfigProvider, theme as antdTheme, App } from 'antd';
import viVN from 'antd/locale/vi_VN';
import enUS from 'antd/locale/en_US';
import zhCN from 'antd/locale/zh_CN';
import { useTheme } from '@/hooks/useTheme';
import { lightTheme, darkTheme } from '@/configs/antdTheme';

type Lng = 'vi' | 'en' | 'ch';

interface AntdConfigProviderProps {
    children: React.ReactNode;
    lng: Lng;
}

const locales = {
    vi: viVN,
    en: enUS,
    ch: zhCN,
};

export default function AntdConfigProvider({ children, lng }: AntdConfigProviderProps) {
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === 'dark';

    const currentTheme = isDark ? darkTheme : lightTheme;

    return (
        <ConfigProvider
            locale={locales[lng]}
            theme={{
                ...currentTheme,
                algorithm: isDark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
            }}
        >
            <App message={{ top: 24, maxCount: 3 }}>{children}</App>
        </ConfigProvider>
    );
}
