import { cookies } from 'next/headers';
import ClientI18nProvider from '../components/ClientI18nProvider';
import './globals.css';
import '@/styles/antd-styles.css';
// import 'antd/dist/reset.css'
import { AuthProvider } from '@/contexts/AuthContext';
import { ErrorProvider } from '@/contexts/ErrorContext';
import type { Metadata } from 'next';
import { NextSSRPlugin } from '@uploadthing/react/next-ssr-plugin';
import { extractRouterConfig } from 'uploadthing/server';
import { ourFileRouter } from './api/uploadthing/core';
import { ThemeProvider } from '@/hooks/useTheme';
import { Toaster } from 'sonner';
import { AntdRegistry } from '@ant-design/nextjs-registry';
import AntdConfigProvider from '@/components/config/AntdConfigProvider';
import { ReduxProvider } from '@/provider/ReduxProvider';
import { ReactQueryProvider } from '@/provider/ReactQueryProvider';
import { AbilityProvider } from '@/contexts/AbilityContext';
import { WebSocketProvider } from '@/contexts/WebSocketContext';
import GlobalErrorHandler from '@/components/shared/ErrorHandle/GlobalErrorHandler';
type Lng = 'vi' | 'en' | 'ch';

export const metadata: Metadata = {
    icons: {
        icon: '/favicon.svg',
    },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
    const cookieStore = await cookies();
    const cv = cookieStore.get('NEXT_LOCALE')?.value as Lng | undefined;

    const lng: Lng = cv === 'en' || cv === 'ch' ? cv : 'vi';

    return (
        <html lang={lng} suppressHydrationWarning>
            <head>
                <script
                    dangerouslySetInnerHTML={{
                        __html: `
                            (function() {
                                try {
                                    var theme = localStorage.getItem('theme') || 'light';
                                    var resolvedTheme = theme;

                                    if (theme === 'system') {
                                        resolvedTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                                    }

                                    document.documentElement.classList.add(resolvedTheme);

                                    var metaThemeColor = document.querySelector('meta[name="theme-color"]');
                                    if (metaThemeColor) {
                                        metaThemeColor.setAttribute('content', resolvedTheme === 'dark' ? '#0f0f23' : '#ffffff');
                                    }
                                } catch (e) {
                                    console.error('Theme init error:', e);
                                }
                            })();
                        `,
                    }}
                />
            </head>
            <body suppressHydrationWarning>
                <AntdRegistry>
                    <ReduxProvider>
                        <ReactQueryProvider>
                            <ClientI18nProvider initialLanguage={lng}>
                                <NextSSRPlugin routerConfig={extractRouterConfig(ourFileRouter)} />
                                <ThemeProvider>
                                    <AntdConfigProvider lng={lng}>
                                        <ErrorProvider>
                                            <AuthProvider>
                                                <WebSocketProvider>
                                                    <AbilityProvider>
                                                        <GlobalErrorHandler />
                                                        {children}
                                                    </AbilityProvider>
                                                </WebSocketProvider>
                                            </AuthProvider>
                                        </ErrorProvider>
                                        <Toaster position="top-right" richColors closeButton />
                                    </AntdConfigProvider>
                                </ThemeProvider>
                            </ClientI18nProvider>
                        </ReactQueryProvider>
                    </ReduxProvider>
                </AntdRegistry>
            </body>
        </html>
    );
}
