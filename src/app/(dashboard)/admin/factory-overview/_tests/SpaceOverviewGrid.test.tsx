import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import SpaceOverviewGrid from '../_components/SpaceOverviewGrid';

jest.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string) => key,
    }),
}));

// Mock SpaceNode component since we already have full test coverage for it
jest.mock('../_components/SpaceNode', () => {
    return function MockSpaceNode({ space, onToggle }: any) {
        return (
            <div data-testid={`space-node-${space.spaceId}`}>
                Mock Space Node {space.spaceName}
                <button
                    data-testid={`toggle-${space.spaceId}`}
                    onClick={() => onToggle(space.spaceId)}
                >
                    Toggle {space.spaceName}
                </button>
            </div>
        );
    };
});

// Mock Modal Component
jest.mock('../../machines/_components/MachineTimelineModal', () => {
    return function MockMachineTimelineModal({ open, machine }: any) {
        if (!open) return null;
        return <div data-testid="machine-modal">Modal for {machine?.machineName}</div>;
    };
});

describe('SpaceOverviewGrid Component', () => {
    const expandedSpaces = new Set<number>();
    const onToggle = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders null when spaceData is null', () => {
        const { container } = render(
            <SpaceOverviewGrid
                spaceData={null}
                expandedSpaces={expandedSpaces}
                onToggle={onToggle}
            />
        );
        expect(container).toBeEmptyDOMElement();
    });

    it('renders empty state when spaceData has no children', () => {
        render(
            <SpaceOverviewGrid
                spaceData={{ children: [] } as any}
                expandedSpaces={expandedSpaces}
                onToggle={onToggle}
            />
        );

        // Should render the empty InboxOutlined
        expect(screen.getByText('machineManagement.emptyStates.noResults.title')).toBeInTheDocument();
    });

    it('renders a SpaceNode for each child in spaceData', () => {
        const mockData = {
            children: [
                { spaceId: 1, spaceName: 'Child 1' },
                { spaceId: 2, spaceName: 'Child 2' },
            ],
        };

        render(
            <SpaceOverviewGrid
                spaceData={mockData as any}
                expandedSpaces={expandedSpaces}
                onToggle={onToggle}
            />
        );

        expect(screen.getByTestId('space-node-1')).toBeInTheDocument();
        expect(screen.getByText('Mock Space Node Child 1')).toBeInTheDocument();

        expect(screen.getByTestId('space-node-2')).toBeInTheDocument();
        expect(screen.getByText('Mock Space Node Child 2')).toBeInTheDocument();
    });

    it('toggles expandedSpaces correctly inside SpaceOverviewGrid state', () => {
        const mockData = {
            children: [{ spaceId: 1, spaceName: 'Child 1' }],
        };

        render(
            <SpaceOverviewGrid
                spaceData={mockData as any}
                expandedSpaces={expandedSpaces}
                onToggle={onToggle}
            />
        );

        const toggleBtn = screen.getByTestId('toggle-1');

        fireEvent.click(toggleBtn);
        fireEvent.click(toggleBtn);

        expect(onToggle).toHaveBeenCalledTimes(2);
        expect(onToggle).toHaveBeenNthCalledWith(1, 1);
        expect(onToggle).toHaveBeenNthCalledWith(2, 1);
        expect(screen.getByTestId('space-node-1')).toBeInTheDocument();
    });
});
