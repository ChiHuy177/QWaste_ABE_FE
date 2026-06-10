'use client';

import { useState } from 'react';

export type OrderFormTab = 'info' | 'plan';

export const useOrderFormTabs = () => {
    const [activeEditTab, setActiveEditTab] = useState<OrderFormTab>('info');
    const [pendingTabSwitch, setPendingTabSwitch] = useState<OrderFormTab | null>(null);
    const [infoFormDirty, setInfoFormDirty] = useState(false);
    const [planFormDirty, setPlanFormDirty] = useState(false);

    const handleTabSwitch = (newTab: OrderFormTab) => {
        const hasUnsavedChanges = activeEditTab === 'info' ? infoFormDirty : planFormDirty;

        if (hasUnsavedChanges) {
            setPendingTabSwitch(newTab);
        } else {
            setActiveEditTab(newTab);
        }
    };

    const confirmTabSwitch = () => {
        if (pendingTabSwitch) {
            setActiveEditTab(pendingTabSwitch);
            setPendingTabSwitch(null);
        }
    };

    const cancelTabSwitch = () => {
        setPendingTabSwitch(null);
    };

    const resetTabState = () => {
        setActiveEditTab('info');
        setPendingTabSwitch(null);
        setInfoFormDirty(false);
        setPlanFormDirty(false);
    };

    return {
        activeEditTab,
        setActiveEditTab,
        pendingTabSwitch,
        setPendingTabSwitch,
        infoFormDirty,
        setInfoFormDirty,
        planFormDirty,
        setPlanFormDirty,
        handleTabSwitch,
        confirmTabSwitch,
        cancelTabSwitch,
        resetTabState,
    };
};
