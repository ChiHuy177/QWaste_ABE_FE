import { Layout, LocaleSwitch, Navbar } from 'nextra-theme-docs';
import { Head, Search } from 'nextra/components';
import { getPageMap } from 'nextra/page-map';
import 'nextra-theme-docs/style.css';

export const metadata = {
    title: {
        default: 'Qwaste Docs',
        template: '%s - Qwaste Docs',
    },
    description: 'Developer documentation for the Qwaste v2 application',
};

// Chuỗi giao diện theo từng ngôn ngữ
const dictionaries = {
    vi: {
        searchPlaceholder: 'Tìm kiếm...',
        searchEmptyResult: 'Không tìm thấy kết quả.',
        tocTitle: 'Trên trang này',
        backToTop: 'Lên đầu trang',
        lastUpdated: 'Cập nhật lần cuối',
        dark: 'Tối',
        light: 'Sáng',
        system: 'Hệ thống',
    },
    en: {
        searchPlaceholder: 'Search...',
        searchEmptyResult: 'No results found.',
        tocTitle: 'On This Page',
        backToTop: 'Back to top',
        lastUpdated: 'Last updated',
        dark: 'Dark',
        light: 'Light',
        system: 'System',
    },
};

export default async function RootLayout({ children, params }) {
    const { lang } = await params;
    const t = dictionaries[lang] ?? dictionaries.vi;
    const pageMap = await getPageMap(`/${lang}`);

    const navbar = (
        <Navbar
            logo={<b>Qwaste Docs</b>}
            // projectLink="https://github.com/your-org/your-repo" // link GitHub trên navbar (tùy chọn)
        >
            <LocaleSwitch lite />
        </Navbar>
    );

    // const footer = <Footer>{new Date().getFullYear()} © Qwaste.</Footer>

    return (
        <html lang={lang} dir="ltr" suppressHydrationWarning>
            <Head />
            <body>
                <Layout
                    navbar={navbar}
                    // footer={footer}
                    search={
                        <Search
                            placeholder={t.searchPlaceholder}
                            emptyResult={t.searchEmptyResult}
                        />
                    }
                    pageMap={pageMap}
                    i18n={[
                        { locale: 'vi', name: 'Tiếng Việt' },
                        { locale: 'en', name: 'English' },
                    ]}
                    // docsRepositoryBase="https://github.com/your-org/your-repo/tree/main"
                    editLink={null}
                    feedback={{ content: null }}
                    toc={{ title: t.tocTitle, backToTop: t.backToTop }}
                    themeSwitch={{ dark: t.dark, light: t.light, system: t.system }}
                    sidebar={{ defaultMenuCollapseLevel: 1 }}
                >
                    {children}
                </Layout>
            </body>
        </html>
    );
}
