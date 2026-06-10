'use client';

import { ConfigProvider, theme as antdTheme, App } from 'antd';
import viVN from 'antd/locale/vi_VN';
import enUS from 'antd/locale/en_US';
import zhCN from 'antd/locale/zh_CN';
import { useTheme } from '@/hooks/useTheme';
import { lightTheme, darkTheme } from '@/configs/antdTheme';
import { useMemo } from 'react';
import { createCache, extractStyle, StyleProvider } from '@ant-design/cssinjs';
import { useServerInsertedHTML } from 'next/navigation';

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

    // Sử dụng useMemo thay vì useRef để tránh tạo lại cache
    const cache = useMemo(() => createCache(), []);

    useServerInsertedHTML(() => {
        const styleText = extractStyle(cache, true);
        return <style id="antd-cssinjs" dangerouslySetInnerHTML={{ __html: styleText }} />;
    });

    // Select theme configuration based on current theme
    const currentTheme = isDark ? darkTheme : lightTheme;

    return (
        <StyleProvider cache={cache}>
            <ConfigProvider
                locale={locales[lng]}
                theme={{
                    ...currentTheme,
                    algorithm: isDark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
                }}
            >
                <App message={{ top: 24, maxCount: 3 }}>{children}</App>
            </ConfigProvider>
        </StyleProvider>
    );
}
