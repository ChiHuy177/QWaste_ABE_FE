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
                <div className="flex items-center gap-2">
                    <Image
                        src={flag}
                        alt={name}
                        width={28}
                        height={20}
                        className="rounded object-cover"

                    />
                    <span>{name}</span>
                </div>
            ),
            onClick: () => handleLanguageChange(code),
        })
    );

    if (!mounted) {
        return (
            <div
                suppressHydrationWarning
                className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-input bg-background"
            >
                <div className="w-6 h-6 bg-muted animate-pulse rounded" />
            </div>
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
                className="inline-flex h-9 w-9 items-center justify-center"
                style={{ padding: 0 }}
                aria-label="Select language"
            >
                <Image
                    src={languages[currentLanguage as keyof typeof languages].flag}
                    alt={languages[currentLanguage as keyof typeof languages].name}
                    width={40}
                    height={60}
                    className="rounded"
                />
            </Button>
        </Dropdown>
    );
}
