'use client';

import React, { createContext, useContext, useMemo } from 'react';
import { Button } from 'antd';
import { HolderOutlined } from '@ant-design/icons';
import type { SyntheticListenerMap } from '@dnd-kit/core/dist/hooks/utilities';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface RowDragContextValue {
    setActivatorNodeRef?: (element: HTMLElement | null) => void;
    listeners?: SyntheticListenerMap;
}

const RowDragContext = createContext<RowDragContextValue>({});

export const DragHandle = () => {
    const { setActivatorNodeRef, listeners } = useContext(RowDragContext);

    return (
        <Button
            type="text"
            size="small"
            icon={<HolderOutlined />}
            ref={setActivatorNodeRef}
            style={{ cursor: 'grab' }}
            {...listeners}
        />
    );
};

interface DraggableTableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
    'data-row-key'?: React.Key;
}

interface SmartTableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
    'data-row-key'?: React.Key;
    'data-row-type'?: string;
}

export const SmartTableRow = ({ 'data-row-type': rowType, ...props }: SmartTableRowProps) => {
    if (rowType === 'total') {
        return <tr {...props} />;
    }
    return <DraggableTableRow {...props} />;
};

export const DraggableTableRow = (props: DraggableTableRowProps) => {
    const rowKey = props['data-row-key'];

    const {
        attributes,
        listeners,
        setActivatorNodeRef,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: String(rowKey ?? '') });

    const style: React.CSSProperties = {
        ...props.style,
        transform: CSS.Translate.toString(transform),
        transition,
        ...(isDragging
            ? {
                position: 'relative',
                zIndex: 999,
            }
            : {}),
    };

    const contextValue = useMemo<RowDragContextValue>(
        () => ({
            setActivatorNodeRef,
            listeners,
        }),
        [setActivatorNodeRef, listeners]
    );

    return (
        <RowDragContext.Provider value={contextValue}>
            <tr {...props} ref={setNodeRef} style={style} {...attributes} />
        </RowDragContext.Provider>
    );
};
