import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import MachineCard, { MachineCardData } from '../components/MachineCard';

jest.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string, defaultValue?: string) => defaultValue || key,
    }),
}));

describe('MachineCard - badge chế độ dập', () => {
    const baseMachine: MachineCardData = {
        machineId: 'm-1',
        machineName: 'CNC Machine 01',
        topic: 'factory/line-a/cnc01',
        currentStatus: 'RUNTIME',
        currentStatusStartTime: '2026-11-10T08:00:00',
        totalProductions: 150,
        runtimeByStatus: {
            RUNTIME: 3600,
            OFFLINE: 0,
        },
    };

    const onClickMock = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('hiển thị badge dập tự động khi mode là AUTOMATIC và máy đang chạy', () => {
        render(
            <MachineCard machine={{ ...baseMachine, mode: 'AUTOMATIC' }} onClick={onClickMock} />
        );

        expect(screen.getByText('pressMode.automatic')).toBeInTheDocument();
        expect(screen.queryByText('pressMode.single')).not.toBeInTheDocument();
    });

    it('hiển thị badge dập đơn khi mode là SINGLE và máy đang chạy', () => {
        render(<MachineCard machine={{ ...baseMachine, mode: 'SINGLE' }} onClick={onClickMock} />);

        expect(screen.getByText('pressMode.single')).toBeInTheDocument();
        expect(screen.queryByText('pressMode.automatic')).not.toBeInTheDocument();
    });

    it('không hiển thị badge khi mode là null (chưa rõ)', () => {
        render(<MachineCard machine={{ ...baseMachine, mode: null }} onClick={onClickMock} />);

        expect(screen.queryByText('pressMode.automatic')).not.toBeInTheDocument();
        expect(screen.queryByText('pressMode.single')).not.toBeInTheDocument();
    });

    it('không hiển thị badge khi máy OFFLINE dù có mode', () => {
        render(
            <MachineCard
                machine={{ ...baseMachine, currentStatus: 'OFFLINE', mode: 'AUTOMATIC' }}
                onClick={onClickMock}
            />
        );

        expect(screen.queryByText('pressMode.automatic')).not.toBeInTheDocument();
        expect(screen.queryByText('pressMode.single')).not.toBeInTheDocument();
    });

    it('gọi onClick khi bấm vào thẻ máy', () => {
        const machine = { ...baseMachine, mode: 'AUTOMATIC' as const };
        render(<MachineCard machine={machine} onClick={onClickMock} />);

        fireEvent.click(screen.getByText('CNC Machine 01'));
        expect(onClickMock).toHaveBeenCalledTimes(1);
    });
});
