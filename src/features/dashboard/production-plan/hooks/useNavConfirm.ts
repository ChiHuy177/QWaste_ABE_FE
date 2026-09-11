'use client';

import { useCallback, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '@/stores/hook';
import { productionPlanActions } from '@/stores/ProductionPlanStore';

interface UseNavConfirmParams {
    isReorderDirty: boolean;
    handleDiscardReorder: () => void;
    handleSaveReorder: () => Promise<void>;
}

/**
 * Chặn điều hướng (đổi ngày/view/filter) khi còn thay đổi thứ tự chưa lưu —
 * mở modal xác nhận Lưu/Hủy thay vì âm thầm mất dữ liệu.
 */
export const useNavConfirm = ({
    isReorderDirty,
    handleDiscardReorder,
    handleSaveReorder,
}: UseNavConfirmParams) => {
    const dispatch = useAppDispatch();
    const navConfirmOpen = useAppSelector((state) => state.productionPlan.navConfirmOpen);
    const pendingNavActionRef = useRef<(() => void) | null>(null);

    const runOrConfirm = useCallback(
        (action: () => void) => {
            if (!isReorderDirty) {
                action();
                return;
            }
            pendingNavActionRef.current = action;
            dispatch(productionPlanActions.setNavConfirmOpen(true));
        },
        [dispatch, isReorderDirty]
    );

    const closeNavConfirm = useCallback(() => {
        dispatch(productionPlanActions.setNavConfirmOpen(false));
        pendingNavActionRef.current = null;
    }, [dispatch]);

    const handleNavConfirmDiscard = useCallback(() => {
        handleDiscardReorder();
        const action = pendingNavActionRef.current;
        closeNavConfirm();
        action?.();
    }, [closeNavConfirm, handleDiscardReorder]);

    const handleNavConfirmSave = useCallback(async () => {
        try {
            await handleSaveReorder();
            const action = pendingNavActionRef.current;
            closeNavConfirm();
            action?.();
        } catch {
            // Lỗi đã toast trong handleSaveReorder — giữ modal mở để thử lại.
        }
    }, [closeNavConfirm, handleSaveReorder]);

    return {
        navConfirmOpen,
        runOrConfirm,
        closeNavConfirm,
        handleNavConfirmDiscard,
        handleNavConfirmSave,
    };
};
