import { theme } from 'antd';
import type {
    OperatorTaskPriority,
    OperatorTaskStatus,
} from '@/hooks/kanban/useKanbanTasks';

type ThemeToken = ReturnType<typeof theme.useToken>['token'];

export const getTaskStatusTheme = (
    token: ThemeToken
): Record<
    OperatorTaskStatus,
    {
        accent: string;
        background: string;
        border: string;
    }
> => ({
    todo: {
        accent: token.colorInfo,
        background: token.colorInfoBg,
        border: token.colorInfoBorder,
    },
    in_progress: {
        accent: token.colorWarningText,
        background: token.colorWarningBg,
        border: token.colorWarningBorderHover,
    },
    qc_check: {
        accent: token.colorPrimary,
        background: token.colorPrimaryBg,
        border: token.colorPrimaryBorder,
    },
    complete: {
        accent: token.colorSuccess,
        background: token.colorSuccessBg,
        border: token.colorSuccessBorder,
    },
});

export const getTaskPriorityTheme = (
    token: ThemeToken
): Record<
    OperatorTaskPriority,
    {
        accent: string;
        background: string;
        border: string;
        tagColor: string;
    }
> => ({
    high: {
        accent: token.colorError,
        background: token.colorErrorBg,
        border: token.colorErrorBorder,
        tagColor: 'error',
    },
    medium: {
        accent: token.colorWarning,
        background: token.colorWarningBg,
        border: token.colorWarningBorder,
        tagColor: 'warning',
    },
    low: {
        accent: token.colorInfo,
        background: token.colorInfoBg,
        border: token.colorInfoBorder,
        tagColor: 'processing',
    },
});
