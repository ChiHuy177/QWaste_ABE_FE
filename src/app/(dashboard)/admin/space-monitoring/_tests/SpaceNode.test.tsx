import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import SpaceNode from '../_components/SpaceNode';
import { SpaceOverview } from '@/types/Space';

jest.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string, defaultValue?: string) => defaultValue || key,
    }),
}));

jest.mock('@/hooks/useTheme', () => ({
    useTheme: () => ({
        resolvedTheme: 'light',
    }),
}));

// Mock the child components to keep the test focused on SpaceNode
jest.mock('../_components/SpaceStatsBar', () => () => (
    <div data-testid="space-stats-bar">Stats Bar</div>
));
jest.mock('../_components/MachineCardGrid', () => () => (
    <div data-testid="machine-card-grid">Machine Grid</div>
));

const mockSpaceDepth0: SpaceOverview = {
    spaceId: 1,
    spaceCode: 'FC-1',
    spaceName: 'Factory Root',
    children: [],
    machineChildren: [],
};

const mockSpaceWithChildren: SpaceOverview = {
    spaceId: 2,
    spaceCode: 'ZN-1',
    spaceName: 'Zone Test',
    children: [
        {
            spaceId: 3,
            spaceCode: 'LN-1',
            spaceName: 'Line Test',
            children: [],
            machineChildren: [],
        },
    ],
    machineChildren: [
        {
            machineId: 'M1',
            machineName: 'Machine 1',
            statusLogs: [],
            currentStatus: 'RUNTIME',
            runtimeByStatus: {},
        } as any,
    ],
};

describe('SpaceNode Component', () => {
    const mockOnToggle = jest.fn();
    const mockOnMachineClick = jest.fn();
    let expandedSpaces: Set<number>;

    beforeEach(() => {
        Object.defineProperty(window, 'matchMedia', {
            writable: true,
            value: jest.fn().mockImplementation((query) => ({
                matches: false,
                media: query,
                onchange: null,
                addListener: jest.fn(),
                removeListener: jest.fn(),
                addEventListener: jest.fn(),
                removeEventListener: jest.fn(),
                dispatchEvent: jest.fn(),
            })),
        });
        jest.clearAllMocks();
        expandedSpaces = new Set();
    });

    it('renders depth 0 node properly', () => {
        render(
            <SpaceNode
                space={mockSpaceDepth0}
                depth={0}
                expandedSpaces={expandedSpaces}
                onToggle={mockOnToggle}
                onMachineClick={mockOnMachineClick}
            />
        );

        // Should display the name
        expect(screen.getByText('Factory Root')).toBeInTheDocument();
        // Should display the inline summary labels
        expect(screen.getByText('Energy')).toBeInTheDocument();
    });

    it('renders depth 1+ node properly with SpaceCode Badge', () => {
        render(
            <SpaceNode
                space={mockSpaceWithChildren}
                depth={1}
                expandedSpaces={expandedSpaces}
                onToggle={mockOnToggle}
                onMachineClick={mockOnMachineClick}
            />
        );

        // For depth 1+, it shows the badge and name
        expect(screen.getByText('ZN-1')).toBeInTheDocument();
        expect(screen.getByText('Zone Test')).toBeInTheDocument();
    });

    it('calls onToggle when header is clicked', () => {
        render(
            <SpaceNode
                space={mockSpaceWithChildren}
                depth={1}
                expandedSpaces={expandedSpaces}
                onToggle={mockOnToggle}
                onMachineClick={mockOnMachineClick}
            />
        );

        // Find the wrapper by text and click it
        const header = screen.getByText('Zone Test').parentElement;
        fireEvent.click(header!);

        expect(mockOnToggle).toHaveBeenCalledTimes(1);
        expect(mockOnToggle).toHaveBeenCalledWith(2, mockSpaceWithChildren);
    });

    it('does not render children or machines when collapsed', () => {
        render(
            <SpaceNode
                space={mockSpaceWithChildren}
                depth={1}
                expandedSpaces={expandedSpaces}
                onToggle={mockOnToggle}
                onMachineClick={mockOnMachineClick}
            />
        );

        // Children shouldn't be rendered
        expect(screen.queryByText('Line Test')).not.toBeInTheDocument();
        expect(screen.queryByTestId('machine-card-grid')).not.toBeInTheDocument();
    });

    it('renders children and machines when expanded', () => {
        expandedSpaces.add(2); // Expand spaceId 2
        render(
            <SpaceNode
                space={mockSpaceWithChildren}
                depth={1}
                expandedSpaces={expandedSpaces}
                onToggle={mockOnToggle}
                onMachineClick={mockOnMachineClick}
            />
        );

        // Both nested child space node and machine grid should render
        expect(screen.getByText('Line Test')).toBeInTheDocument();
        expect(screen.getByTestId('machine-card-grid')).toBeInTheDocument();
    });
});
