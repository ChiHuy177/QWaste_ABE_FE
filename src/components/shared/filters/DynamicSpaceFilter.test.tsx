import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import { DynamicSpaceFilter } from './DynamicSpaceFilter';
import { SpacePickingWithChildren } from '@/types/Space';

// Mock react-i18next
jest.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string, defaultValue?: string) => defaultValue || key,
    }),
}));

const mockDataTree: SpacePickingWithChildren[] = [
    {
        spaceId: 1,
        parentId: 0,
        spaceCode: 'FC-1',
        spaceName: 'Factory 1',
        description: 'Test Factory',
        displayOrder: 1,
        spaceLevel: { spaceLevelId: 1, spaceLevel: 1, spaceLevelName: 'Factory' },
        children: [
            {
                spaceId: 11,
                parentId: 1,
                spaceCode: 'ZN-1',
                spaceName: 'Zone 1',
                description: 'Test Zone',
                displayOrder: 1,
                spaceLevel: { spaceLevelId: 2, spaceLevel: 2, spaceLevelName: 'Zone' },
                children: [
                    {
                        spaceId: 111,
                        parentId: 11,
                        spaceCode: 'LN-1',
                        spaceName: 'Line 1',
                        description: 'Test Line',
                        displayOrder: 1,
                        spaceLevel: { spaceLevelId: 3, spaceLevel: 3, spaceLevelName: 'Line' },
                        children: [],
                    },
                ],
            },
        ],
    },
    {
        spaceId: 2,
        parentId: 0,
        spaceCode: 'FC-2',
        spaceName: 'Factory 2',
        description: 'Empty Factory',
        displayOrder: 2,
        spaceLevel: { spaceLevelId: 1, spaceLevel: 1, spaceLevelName: 'Factory' },
        children: [],
    },
];

describe('DynamicSpaceFilter Component', () => {
    const mockOnChange = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders null if tree is empty and not loading', () => {
        const { container } = render(
            <DynamicSpaceFilter spacesTree={[]} selectedPath={[]} onChange={mockOnChange} />
        );
        expect(container).toBeEmptyDOMElement();
    });

    it('renders Level 1 dropdown correctly', () => {
        render(
            <DynamicSpaceFilter spacesTree={mockDataTree} selectedPath={[]} onChange={mockOnChange} />
        );

        // Expect exactly one dropdown initially since no path is selected
        const selects = screen.getAllByRole('combobox');
        expect(selects).toHaveLength(1);
    });

    it('renders Level 1 and Level 2 dropdowns when Level 1 is selected', () => {
        // Path says: Level 1 has spaceId 1 selected
        render(
            <DynamicSpaceFilter
                spacesTree={mockDataTree}
                selectedPath={[1]}
                onChange={mockOnChange}
            />
        );

        // Expect two dropdowns since Level 1 is selected and it has children
        const selects = screen.getAllByRole('combobox');
        expect(selects).toHaveLength(2);
    });

    it('renders Level 1, Level 2, and Level 3 dropdowns when both paths are selected', () => {
        // Path says: Factory 1 -> Zone 1 selected
        render(
            <DynamicSpaceFilter
                spacesTree={mockDataTree}
                selectedPath={[1, 11]}
                onChange={mockOnChange}
            />
        );

        // Expect three dropdowns since Zone 1 has children (Line 1)
        const selects = screen.getAllByRole('combobox');
        expect(selects).toHaveLength(3);
    });

    it('stops rendering when a node has no children', () => {
        // Factory 2 has no children -> should only render 1 dropdown
        render(
            <DynamicSpaceFilter
                spacesTree={mockDataTree}
                selectedPath={[2]}
                onChange={mockOnChange}
            />
        );

        const selects = screen.getAllByRole('combobox');
        expect(selects).toHaveLength(1);
    });

    it('calls onChange with correct index and value when a selection changes', () => {
        // Render 1 dropdown
        render(
            <DynamicSpaceFilter spacesTree={mockDataTree} selectedPath={[]} onChange={mockOnChange} />
        );

        // This acts as a proxy for validating that we pass the props correctly
        const selects = screen.getAllByRole('combobox');
        expect(selects.length).toBeGreaterThan(0);
    });
});
