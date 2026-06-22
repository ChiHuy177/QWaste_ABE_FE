'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { Dropdown, Button } from 'antd';
import type { MenuProps } from 'antd';
import { setLanguageToCookie } from '@/lib/cookies';
import Image from 'next/image';

import { useAppDispatch } from '@/stores/hook';
import { userSettingsActions } from '@/stores';
import { LanguageOption } from '@/types/User';

const languages = {
    vi: { name: 'Tiếng Việt', flag: '/img/flag/vietnam.svg?v=2' },
    en: { name: 'English', flag: '/img/flag/uk.svg' },
    // ch: { name: '中文', flag: '/img/flag/china.png' },
};

export default function LanguageSwitcher() {
    const router = useRouter();
    const { i18n } = useTranslation();
    const dispatch = useAppDispatch();
    const [mounted, setMounted] = useState(false);
    const currentLanguage = i18n.language || 'vi';

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleLanguageChange = async (locale: string) => {
        await i18n.changeLanguage(locale);
        setLanguageToCookie(locale);
        dispatch(userSettingsActions.updateSettings({ language: locale as LanguageOption }));
        router.refresh();
    };

    const menuItems: MenuProps['items'] = Object.entries(languages).map(
        ([code, { name, flag }]) => ({
            key: code,
            label: (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Image
                        src={flag}
                        alt={name}
                        width={28}
                        height={20}
                        style={{ borderRadius: 4, objectFit: 'cover' }}
                    />
                    <span>{name}</span>
                </div>
            ),
            onClick: () => handleLanguageChange(code),
        })
    );

    if (!mounted) {
        return (
            <>
                <style>{`@keyframes lang-pulse{0%,100%{opacity:1}50%{opacity:.5}}`}</style>
                <div
                    suppressHydrationWarning
                    style={{ display: 'inline-flex', width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 6, border: '1px solid var(--input)', background: 'var(--background)' }}
                >
                    <div style={{ width: 24, height: 24, borderRadius: 4, background: 'var(--muted)', animation: 'lang-pulse 2s cubic-bezier(0.4,0,0.6,1) infinite' }} />
                </div>
            </>
        );
    }

    return (
        <Dropdown
            menu={{ items: menuItems, style: { border: 'none' } }}
            trigger={['click']}
            placement="bottomRight"
        >
            <Button
                type="text"
                style={{ padding: 0, display: 'inline-flex', width: 36, height: 36, alignItems: 'center', justifyContent: 'center' }}
                aria-label="Select language"
            >
                <Image
                    src={languages[currentLanguage as keyof typeof languages].flag}
                    alt={languages[currentLanguage as keyof typeof languages].name}
                    width={40}
                    height={60}
                    style={{ borderRadius: 4 }}
                />
            </Button>
        </Dropdown>
    );
}
