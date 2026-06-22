import type { ThemeConfig } from 'antd';

//This is the main theme of our app, please ask Huy if you want to modify it, thanks! - Huy
export const statusColors = {
    light: {
        runtime: {
            base: '#1F7A4D',
            bg: 'rgba(31, 122, 77, 0.14)',
            border: 'rgba(31, 122, 77, 0.38)',
        },
        idle: {
            base: '#A96500',
            bg: '#fffbe6',
            border: 'rgba(169, 101, 0, 0.42)',
        },
        error: {
            base: '#B42318',
            bg: '#fff1f0',
            border: 'rgba(180, 35, 24, 0.38)',
        },
        offline: {
            base: '#8C8C8C',
            bg: 'rgba(140, 140, 140, 0.06)',
            border: 'rgba(140, 140, 140, 0.15)',
        },
    },
    dark: {
        runtime: {
            base: '#5FAE85',
            bg: 'rgba(95, 174, 133, 0.16)',
            border: 'rgba(95, 174, 133, 0.4)',
        },
        idle: {
            base: '#D9A03F',
            bg: 'rgba(217, 160, 63, 0.16)',
            border: 'rgba(217, 160, 63, 0.4)',
        },
        error: {
            base: '#E06B62',
            bg: 'rgba(224, 107, 98, 0.16)',
            border: 'rgba(224, 107, 98, 0.4)',
        },
        offline: {
            base: '#6B6B6B',
            bg: 'rgba(107, 107, 107, 0.1)',
            border: 'rgba(107, 107, 107, 0.2)',
        },
    },
};

const sc = statusColors;

const L_SUCCESS = sc.light.runtime.base;
const L_SUCCESS_BG = sc.light.runtime.bg;
const L_SUCCESS_BD = sc.light.runtime.border;

const L_WARNING = sc.light.idle.base;
const L_WARNING_BG = sc.light.idle.bg;
const L_WARNING_BD = sc.light.idle.border;

const L_ERROR = sc.light.error.base;
const L_ERROR_BG = sc.light.error.bg;
const L_ERROR_BD = sc.light.error.border;

const D_SUCCESS = sc.dark.runtime.base;
const D_SUCCESS_BG = sc.dark.runtime.bg;
const D_SUCCESS_BD = sc.dark.runtime.border;

const D_WARNING = sc.dark.idle.base;
const D_WARNING_BG = sc.dark.idle.bg;
const D_WARNING_BD = sc.dark.idle.border;

const D_ERROR = sc.dark.error.base;
const D_ERROR_BG = sc.dark.error.bg;
const D_ERROR_BD = sc.dark.error.border;

export const lightTheme: ThemeConfig = {
    token: {
        colorPrimary: '#074695',
        colorSuccess: L_SUCCESS,
        colorWarning: L_WARNING,
        colorError: L_ERROR,
        colorInfo: '#074695',
        colorInfoBg: '#DDEBFF',
        colorInfoBorder: '#8EB7EA',
        colorSuccessBg: L_SUCCESS_BG,
        colorSuccessBorder: L_SUCCESS_BD,
        colorWarningBg: L_WARNING_BG,
        colorWarningBorder: L_WARNING_BD,
        colorErrorBg: L_ERROR_BG,
        colorErrorBorder: L_ERROR_BD,
        colorPrimaryBg: '#bae0ff',

        colorText: 'rgba(0, 0, 0, 0.88)',
        colorTextSecondary: 'rgba(0, 0, 0, 0.65)',
        colorTextTertiary: 'rgba(0, 0, 0, 0.45)',
        colorTextQuaternary: 'rgba(0, 0, 0, 0.25)',

        colorBgContainer: '#ffffff',
        colorBgElevated: '#ffffff',
        colorBgLayout: '#f5f5f5',
        colorBgSpotlight: 'rgba(0, 0, 0, 0.85)',

        colorBorder: '#d9d9d9',
        colorBorderSecondary: '#f0f0f0',

        borderRadius: 8,
        borderRadiusLG: 12,
        borderRadiusSM: 6,
        borderRadiusXS: 4,

        fontSize: 14,
        fontSizeHeading1: 38,
        fontSizeHeading2: 30,
        fontSizeHeading3: 24,
        fontSizeHeading4: 20,
        fontSizeHeading5: 16,

        padding: 16,
        paddingLG: 24,
        paddingSM: 12,
        paddingXS: 8,
        paddingXXS: 4,

        boxShadow:
            '0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px 0 rgba(0, 0, 0, 0.02)',
        boxShadowSecondary:
            '0 6px 16px 0 rgba(0, 0, 0, 0.08), 0 3px 6px -4px rgba(0, 0, 0, 0.12), 0 9px 28px 8px rgba(0, 0, 0, 0.05)',
    },
    components: {
        Button: {
            controlHeight: 36,
            controlHeightLG: 44,
            controlHeightSM: 28,
            fontWeight: 500,
        },
        Input: {
            controlHeight: 36,
            controlHeightLG: 44,
            controlHeightSM: 28,
        },
        Select: {
            controlHeight: 36,
            controlHeightLG: 44,
            controlHeightSM: 28,
        },
        Table: {
            headerBg: '#fafafa',
            headerColor: 'rgba(0, 0, 0, 0.88)',
            rowHoverBg: '#f5f5f5',
        },
        Card: {
            colorBgContainer: '#ffffff',
            boxShadowTertiary:
                '0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px 0 rgba(0, 0, 0, 0.02)',
        },
        Menu: {
            itemBg: 'transparent',
            itemSelectedBg: '#074695',
            itemSelectedColor: '#ffffff',
            itemHoverBg: 'rgba(28, 81, 106, 0.08)',
            itemHoverColor: '#074695',
            subMenuItemBg: 'transparent',
        },
        Layout: {
            headerBg: '#ffffff',
            headerHeight: 64,
            headerPadding: '0 24px',
            siderBg: '#ffffff',
            bodyBg: '#f5f5f5',
            footerPadding: '12px 24px',
        },
        Typography: {
            colorTextHeading: '#074695',
            titleMarginBottom: 0,
            titleMarginTop: 0,
        },
        Modal: {
            contentBg: '#ffffff',
            headerBg: '#ffffff',
        },
        Drawer: {
            colorBgElevated: '#ffffff',
        },
        Tag: {
            colorSuccess: L_SUCCESS,
            colorSuccessBg: L_SUCCESS_BG,
            colorSuccessBorder: L_SUCCESS_BD,
            colorWarning: L_WARNING,
            colorWarningBg: L_WARNING_BG,
            colorWarningBorder: L_WARNING_BD,
            colorError: L_ERROR,
            colorErrorBg: L_ERROR_BG,
            colorErrorBorder: L_ERROR_BD,
        },
        Badge: {
            colorSuccess: L_SUCCESS,
            colorWarning: L_WARNING,
            colorError: L_ERROR,
        },
        Progress: {
            defaultColor: '#074695',
            remainingColor: 'rgba(0, 0, 0, 0.06)',
        },
        Alert: {
            colorSuccessBg: L_SUCCESS_BG,
            colorSuccessBorder: L_SUCCESS_BD,
            colorWarningBg: L_WARNING_BG,
            colorWarningBorder: L_WARNING_BD,
            colorErrorBg: L_ERROR_BG,
            colorErrorBorder: L_ERROR_BD,
            colorInfoBg: 'rgba(7, 70, 149, 0.13)',
            colorInfoBorder: 'rgba(7, 70, 149, 0.36)',
        },
        Message: {
            contentBg: '#ffffff',
            contentPadding: '10px 16px',
            borderRadiusLG: 8,
        },
        Notification: {
            colorSuccess: L_SUCCESS,
            colorWarning: L_WARNING,
            colorError: L_ERROR,
            colorInfo: '#074695',
        },
    },
};

export const darkTheme: ThemeConfig = {
    token: {
        colorPrimary: '#3D7DD2',
        colorSuccess: D_SUCCESS,
        colorWarning: D_WARNING,
        colorError: D_ERROR,
        colorInfo: '#3D7DD2',
        colorInfoBg: '#16304D',
        colorInfoBorder: '#4E83C4',
        colorSuccessBg: D_SUCCESS_BG,
        colorSuccessBorder: D_SUCCESS_BD,
        colorWarningBg: D_WARNING_BG,
        colorWarningBorder: D_WARNING_BD,
        colorErrorBg: D_ERROR_BG,
        colorErrorBorder: D_ERROR_BD,
        colorPrimaryBg: '#15273F',

        colorText: 'rgba(255, 255, 255, 0.85)',
        colorTextSecondary: 'rgba(255, 255, 255, 0.65)',
        colorTextTertiary: 'rgba(255, 255, 255, 0.45)',
        colorTextQuaternary: 'rgba(255, 255, 255, 0.25)',

        colorBgContainer: '#282828',
        colorBgElevated: '#2F2F2F',
        colorBgLayout: '#19181A',
        colorBgSpotlight: '#424242',

        colorBorder: '#424242',
        colorBorderSecondary: '#303030',

        borderRadius: 8,
        borderRadiusLG: 12,
        borderRadiusSM: 6,
        borderRadiusXS: 4,

        fontSize: 14,
        fontSizeHeading1: 38,
        fontSizeHeading2: 30,
        fontSizeHeading3: 24,
        fontSizeHeading4: 20,
        fontSizeHeading5: 16,

        padding: 16,
        paddingLG: 24,
        paddingSM: 12,
        paddingXS: 8,
        paddingXXS: 4,

        boxShadow:
            '0 1px 2px 0 rgba(0, 0, 0, 0.2), 0 1px 6px -1px rgba(0, 0, 0, 0.15), 0 2px 4px 0 rgba(0, 0, 0, 0.1)',
        boxShadowSecondary:
            '0 6px 16px 0 rgba(0, 0, 0, 0.3), 0 3px 6px -4px rgba(0, 0, 0, 0.25), 0 9px 28px 8px rgba(0, 0, 0, 0.2)',
    },
    components: {
        Button: {
            controlHeight: 36,
            controlHeightLG: 44,
            controlHeightSM: 28,
            fontWeight: 500,
        },
        Input: {
            controlHeight: 36,
            controlHeightLG: 44,
            controlHeightSM: 28,
        },
        Select: {
            controlHeight: 36,
            controlHeightLG: 44,
            controlHeightSM: 28,
        },
        Table: {
            headerBg: '#1f1f1f',
            headerColor: 'rgba(255, 255, 255, 0.85)',
            rowHoverBg: '#262626',
        },
        Card: {
            colorBgContainer: '#282828',
            boxShadowTertiary:
                '0 1px 2px 0 rgba(0, 0, 0, 0.2), 0 1px 6px -1px rgba(0, 0, 0, 0.15), 0 2px 4px 0 rgba(0, 0, 0, 0.1)',
        },
        Menu: {
            itemBg: 'transparent',
            itemSelectedBg: '#3D7DD2',
            itemSelectedColor: '#ffffff',
            itemHoverBg: 'rgba(61, 125, 210, 0.14)',
            itemHoverColor: '#6FA3DC',
            subMenuItemBg: 'transparent',
        },
        Layout: {
            headerBg: '#282828',
            headerHeight: 64,
            headerPadding: '0 24px',
            siderBg: '#282828',
            bodyBg: '#19181A',
            footerPadding: '12px 24px',
        },
        Typography: {
            colorTextHeading: '#6FA3DC',
            titleMarginBottom: 0,
            titleMarginTop: 0,
        },
        Modal: {
            contentBg: '#282828',
            headerBg: '#282828',
        },
        Drawer: {
            colorBgElevated: '#2F2F2F',
        },
        Tag: {
            colorSuccess: D_SUCCESS,
            colorSuccessBg: D_SUCCESS_BG,
            colorSuccessBorder: D_SUCCESS_BD,
            colorWarning: D_WARNING,
            colorWarningBg: D_WARNING_BG,
            colorWarningBorder: D_WARNING_BD,
            colorError: D_ERROR,
            colorErrorBg: D_ERROR_BG,
            colorErrorBorder: D_ERROR_BD,
        },
        Badge: {
            colorSuccess: D_SUCCESS,
            colorWarning: D_WARNING,
            colorError: D_ERROR,
        },
        Progress: {
            defaultColor: '#3D7DD2',
            remainingColor: 'rgba(255, 255, 255, 0.08)',
        },
        Alert: {
            colorSuccessBg: D_SUCCESS_BG,
            colorSuccessBorder: D_SUCCESS_BD,
            colorWarningBg: D_WARNING_BG,
            colorWarningBorder: D_WARNING_BD,
            colorErrorBg: D_ERROR_BG,
            colorErrorBorder: D_ERROR_BD,
            colorInfoBg: 'rgba(61, 125, 210, 0.18)',
            colorInfoBorder: 'rgba(61, 125, 210, 0.45)',
        },
        Message: {
            contentBg: '#282828',
            contentPadding: '10px 16px',
            borderRadiusLG: 8,
        },
        Notification: {
            colorSuccess: D_SUCCESS,
            colorWarning: D_WARNING,
            colorError: D_ERROR,
            colorInfo: '#3D7DD2',
        },
    },
};

export const getStatusColors = (mode: 'light' | 'dark') => statusColors[mode];

export const statusColorMap = {
    RUNTIME: 'runtime',
    RUNNING: 'runtime',
    ACTIVE: 'runtime',
    IDLE: 'idle',
    WAITING: 'idle',
    PENDING: 'idle',
    ERROR: 'error',
    FAULT: 'error',
    FAILURE: 'error',
    OFFLINE: 'offline',
    UNKNOWN: 'offline',
    INACTIVE: 'offline',
} as const;

export const leaderboardRankColors = {
    gold: {
        accent: '#D4A836',
        bg: 'rgba(212,168,54,0.10)',
        border: 'rgba(212,168,54,0.35)',
        dot: '#D4A836',
    },
    silver: {
        accent: '#9E9E9E',
        bg: 'rgba(158,158,158,0.10)',
        border: 'rgba(158,158,158,0.35)',
        dot: '#9E9E9E',
    },
    bronze: {
        accent: '#C07A3A',
        bg: 'rgba(192,122,58,0.10)',
        border: 'rgba(192,122,58,0.35)',
        dot: '#C07A3A',
    },
} as const;

const _spaceLevelBaseColors: Record<number, string> = {
    1: '#0050b3',
    2: '#096dd9',
    3: '#1890ff',
    4: '#40a9ff',
    5: '#69c0ff',
    6: '#91d5ff',
    7: '#bae7ff',
    8: '#e6f7ff',
};

export const chartColors = [
    '#FF4D4F',
    '#1890FF',
    '#FAAD14',
    '#52C41A',
    '#722ED1',
    '#EB2F96',
    '#13C2C2',
    '#FADB14',
    '#A0D911',
    '#F5222D',
    '#FA541C',
    '#FA8C16',
    '#1DA57A',
    '#2F54EB',
    '#531DAB',
    '#C41D7F',
    '#873800',
    '#00474F',
    '#003A8C',
    '#9254DE',
    '#FF7A45',
    '#36CFC9',
    '#F759AB',
    '#FFA39E',
    '#91D5FF',
    '#FFE58F',
    '#B7EB8F',
    '#D3ADF7',
    '#FFC069',
    '#FF85C0',
    '#5C0011',
    '#002329',
    '#002C8A',
    '#391085',
    '#52081C',
    '#AD8B00',
    '#006D75',
    '#096DD9',
    '#22075E',
    '#135200',
    '#873800',
    '#237804',
    '#D4380D',
    '#00447C',
    '#780650',
];
export const spaceLevelColors: Record<number, string> = new Proxy(_spaceLevelBaseColors, {
    get: (target, prop) => {
        const level = Number(prop);
        if (isNaN(level) || level <= 0) return target[prop as any];
        const wrappedLevel = ((level - 1) % 8) + 1;
        return target[wrappedLevel];
    },
});

const _spaceLevelTextColors: Record<number, string> = {
    1: '#ffffff',
    2: '#ffffff',
    3: '#ffffff',
    4: '#ffffff',
    5: '#002766',
    6: '#002766',
    7: '#002766',
    8: '#002766',
};

export const spaceLevelTextColors: Record<number, string> = new Proxy(_spaceLevelTextColors, {
    get: (target, prop) => {
        const level = Number(prop);
        if (isNaN(level) || level <= 0) return target[prop as any];
        const wrappedLevel = ((level - 1) % 8) + 1;
        return target[wrappedLevel];
    },
});
