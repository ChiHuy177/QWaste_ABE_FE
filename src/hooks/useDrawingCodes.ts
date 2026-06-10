import { useEffect, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/stores/hook';
import { drawingCodeActions } from '@/stores';
import { DrawingCodeService } from '@/services';

/**
 * Hook for managing drawing codes data with loading and error states
 * Refactored to use Redux store
 */
export const useDrawingCodes = () => {
    const dispatch = useAppDispatch();

    // Select state from Redux
    const {
        drawingCodes,
        isLoading,
        error: drawingCodesError,
        categories,
        selectedCategory,
        searchQuery,
    } = useAppSelector((state) => state.drawingCode);

    // Load all drawing codes
    const loadDrawingCodes = useCallback(() => {
        return dispatch(drawingCodeActions.fetchDrawingCodes());
    }, [dispatch]);

    // Load drawing codes by category
    const loadByCategory = useCallback(
        (category: string) => {
            return dispatch(drawingCodeActions.fetchDrawingCodesByCategory(category));
        },
        [dispatch]
    );

    // Load categories
    const loadCategories = useCallback(() => {
        return dispatch(drawingCodeActions.loadCategories());
    }, [dispatch]);

    // Search drawing codes – sync action to update searchQuery
    const searchDrawingCodes = useCallback(
        async (query: string, _limit = 20) => {
            dispatch(drawingCodeActions.setSearchQuery(query));
            // For backward compatibility return filtered list
            return drawingCodes.filter(
                (dc: any) =>
                    dc.drawingCode?.toLowerCase().includes(query.toLowerCase()) ||
                    dc.drawingCodeName?.toLowerCase().includes(query.toLowerCase())
            );
        },
        [dispatch, drawingCodes]
    );

    // Set search query directly
    const setDrawingCodeSearchQuery = useCallback(
        (query: string) => {
            dispatch(drawingCodeActions.setSearchQuery(query));
        },
        [dispatch]
    );

    // Get step preview – returns the stepTemplates of the matching drawing code
    const getStepPreview = useCallback(async (drawingCodeId: string) => {
        try {
            const dc = await DrawingCodeService.getDrawingCodeById(drawingCodeId);
            return dc?.stepTemplates ?? null;
        } catch (error) {
            console.error('Failed to get step preview:', error);
            return null;
        }
    }, []);

    // Estimate task cost – not supported; return null
    const estimateTaskCost = useCallback(async (_drawingCodeId: string, _quantity: number) => {
        return null;
    }, []);

    // Validate drawing code – check it exists via getById
    const validateDrawingCode = useCallback(async (drawingCodeId: string) => {
        try {
            const dc = await DrawingCodeService.getDrawingCodeById(drawingCodeId);
            const isDeleted = dc?.softDeleteMetaData?.isDeleted;
            return {
                isValid: !!dc && !isDeleted,
                isActive: !!dc && !isDeleted,
                message: dc ? (isDeleted ? 'Drawing code is deleted' : 'Valid') : 'Not found',
            };
        } catch (error) {
            return { isValid: false, isActive: false, message: 'Validation failed' };
        }
    }, []);

    // Clear errors
    const clearError = useCallback(() => {
        dispatch(drawingCodeActions.clearError());
    }, [dispatch]);

    // Reset category filter
    const clearCategoryFilter = useCallback(() => {
        dispatch(drawingCodeActions.setSelectedCategory(null));
        loadDrawingCodes();
    }, [dispatch, loadDrawingCodes]);

    // Auto-load data on mount
    useEffect(() => {
        if (drawingCodes.length === 0 && !isLoading && !drawingCodesError) {
            loadDrawingCodes();
        }
        if (categories.length === 0) {
            loadCategories();
        }
    }, [
        drawingCodes.length,
        isLoading,
        drawingCodesError,
        loadDrawingCodes,
        categories.length,
        loadCategories,
    ]);

    // Filter drawing codes based on search query
    const filteredDrawingCodes = searchQuery
        ? drawingCodes.filter(
              (code: any) =>
                  code.drawingCode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  code.drawingCodeName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  code.description?.toLowerCase().includes(searchQuery.toLowerCase())
          )
        : drawingCodes;

    return {
        // Data
        drawingCodes: filteredDrawingCodes,
        categories,
        selectedCategory,
        drawingCodeSearchQuery: searchQuery, // Keep this for backward compatibility if needed

        // Loading states
        isLoading,

        // Error states
        error: drawingCodesError,

        // Actions
        loadDrawingCodes,
        loadByCategory,
        loadCategories,
        searchDrawingCodes,
        setDrawingCodeSearchQuery,
        getStepPreview,
        estimateTaskCost,
        validateDrawingCode,
        clearError,
        clearCategoryFilter,

        // Computed values
        hasDrawingCodes: filteredDrawingCodes.length > 0,
        isEmpty: filteredDrawingCodes.length === 0 && !isLoading,
        hasError: !!drawingCodesError,
        isFiltered: !!selectedCategory || !!searchQuery,

        // Statistics
        stats: {
            total: drawingCodes.length,
            filtered: filteredDrawingCodes.length,
            categoriesCount: categories.length,
            averagePrice:
                drawingCodes.length > 0
                    ? drawingCodes.reduce(
                          (sum: any, code: any) => sum + (code as any).unitPrice,
                          0
                      ) / drawingCodes.length
                    : 0,
        },
    };
};
