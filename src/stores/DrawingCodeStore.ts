import { createSlice, PayloadAction, Dispatch } from '@reduxjs/toolkit';
import { DrawingCode } from '@/types/DrawingCode';
import { DrawingCodeService } from '@/services';

export interface IDrawingCodeStoreState {
    // Data
    drawingCodes: DrawingCode[];
    categories: string[];
    
    // Selection/Filters
    selectedCategory: string | null;
    searchQuery: string;
    
    // Loading states
    isLoading: boolean;
    isFetchingCategories: boolean;

    // Error states
    error: string | null;
}

const initialState: IDrawingCodeStoreState = {
    drawingCodes: [],
    categories: [],
    selectedCategory: null,
    searchQuery: '',
    isLoading: false,
    isFetchingCategories: false,
    error: null,
};

const slice = createSlice({
    name: 'drawingCode',
    initialState,
    reducers: {
        setLoading: (state, action: PayloadAction<boolean>) => {
            state.isLoading = action.payload;
            if (action.payload) {
                state.error = null;
            }
        },
        setFetchingCategories: (state, action: PayloadAction<boolean>) => {
            state.isFetchingCategories = action.payload;
        },
        setDrawingCodes: (state, action: PayloadAction<DrawingCode[]>) => {
            state.drawingCodes = action.payload;
        },
        setCategories: (state, action: PayloadAction<string[]>) => {
            state.categories = action.payload;
        },
        setSelectedCategory: (state, action: PayloadAction<string | null>) => {
            state.selectedCategory = action.payload;
        },
        setSearchQuery: (state, action: PayloadAction<string>) => {
            state.searchQuery = action.payload;
        },
        setError: (state, action: PayloadAction<string | null>) => {
            state.error = action.payload;
            state.isLoading = false;
        },
        clearError: (state) => {
            state.error = null;
        },
        resetState: () => initialState,
    },
});

export const { reducer } = slice;

export const drawingCodeActions = {
    // Thunks
    fetchDrawingCodes: () => async (dispatch: Dispatch) => {
        dispatch(slice.actions.setLoading(true));
        try {
            const data = await DrawingCodeService.getAllDrawingCode();
            dispatch(slice.actions.setDrawingCodes(data as DrawingCode[]));
        } catch (error: any) {
            console.error('Failed to fetch drawing codes:', error);
            dispatch(slice.actions.setError(error.message || 'Failed to fetch drawing codes'));
        } finally {
            dispatch(slice.actions.setLoading(false));
        }
    },

    fetchDrawingCodesByCategory: (category: string) => async (dispatch: Dispatch) => {
        dispatch(slice.actions.setLoading(true));
        dispatch(slice.actions.setSelectedCategory(category));
        try {
            // Fallback to client-side filtering when backend search is unavailable.
            const data = await DrawingCodeService.getAllDrawingCode();
            dispatch(slice.actions.setDrawingCodes(data as DrawingCode[]));
        } catch (error: any) {
            dispatch(slice.actions.setError(error.message || 'Failed to fetch drawing codes'));
        } finally {
            dispatch(slice.actions.setLoading(false));
        }
    },

    loadCategories: () => async (dispatch: Dispatch) => {
        dispatch(slice.actions.setFetchingCategories(true));
        try {
            const all = await DrawingCodeService.getAllDrawingCode();
            // Use drawingCode prefix (e.g. "DC") as a stand-in for categories
            const unique = [...new Set(all
                .map((dc) => dc.drawingCode.split('-')[0])
                .filter(Boolean)
            )];
            dispatch(slice.actions.setCategories(unique));
        } catch (error) {
            console.error('Failed to load categories:', error);
        } finally {
            dispatch(slice.actions.setFetchingCategories(false));
        }
    },

    // Sync actions from slice
    setSelectedCategory: slice.actions.setSelectedCategory,
    setSearchQuery: slice.actions.setSearchQuery,
    clearError: slice.actions.clearError,
    resetState: slice.actions.resetState,
};
