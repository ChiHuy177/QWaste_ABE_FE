import { OrderService } from '@/services';
import {
    OperatorReviewSubmitPayload,
    OrderOperatorReviewResponse,
    OrderOperatorSummaryResponse,
    TaskReviewStatus,
} from '@/types';
import { createSlice, Dispatch, PayloadAction } from '@reduxjs/toolkit';

export interface IOrderStoreState {
    myReviewingOrders: OrderOperatorSummaryResponse[];
    operatorReviewData: OrderOperatorReviewResponse | null;
    isLoadingOrders: boolean;
    isLoadingReviewData: boolean;
    isSubmitting: boolean;
    error: string | null;
    isOperatorReviewDrawerOpen: boolean;
    selectedOperatorReviewOrderId: string | null;
}

const initialState: IOrderStoreState = {
    myReviewingOrders: [],
    operatorReviewData: null,
    isLoadingOrders: false,
    isLoadingReviewData: false,
    isSubmitting: false,
    error: null,
    isOperatorReviewDrawerOpen: false,
    selectedOperatorReviewOrderId: null,
};

const slice = createSlice({
    name: 'order',
    initialState,
    reducers: {
        setLoadingOrders: (state, action: PayloadAction<boolean>) => {
            state.isLoadingOrders = action.payload;
        },
        setLoadingReviewData: (state, action: PayloadAction<boolean>) => {
            state.isLoadingReviewData = action.payload;
        },
        setSubmitting: (state, action: PayloadAction<boolean>) => {
            state.isSubmitting = action.payload;
        },
        setError: (state, action: PayloadAction<string | null>) => {
            state.error = action.payload;
        },
        setMyReviewingOrders: (state, action: PayloadAction<OrderOperatorSummaryResponse[]>) => {
            state.myReviewingOrders = action.payload;
        },
        setOperatorReviewData: (
            state,
            action: PayloadAction<OrderOperatorReviewResponse | null>
        ) => {
            state.operatorReviewData = action.payload;
        },
        setOperatorReviewDrawerOpen: (state, action: PayloadAction<boolean>) => {
            state.isOperatorReviewDrawerOpen = action.payload;
        },
        setSelectedOperatorReviewOrderId: (state, action: PayloadAction<string | null>) => {
            state.selectedOperatorReviewOrderId = action.payload;
        },
        resetState: () => initialState,
    },
});

export const { reducer } = slice;

export const orderActions = {
    fetchMyReviewingOrders: () => async (dispatch: Dispatch) => {
        dispatch(slice.actions.setLoadingOrders(true));
        try {
            const data = await OrderService.getMyReviewingOrders();
            dispatch(slice.actions.setMyReviewingOrders(data));
        } catch (error: any) {
            dispatch(slice.actions.setError(error.message || 'Failed to fetch reviewing orders'));
        } finally {
            dispatch(slice.actions.setLoadingOrders(false));
        }
    },

    fetchOperatorReviewForm: (orderId: string) => async (dispatch: Dispatch) => {
        dispatch(slice.actions.setLoadingReviewData(true));
        try {
            const data = await OrderService.getOperatorReviewForm(orderId);
            dispatch(slice.actions.setOperatorReviewData(data));
        } catch (error: any) {
            dispatch(
                slice.actions.setError(error.message || 'Failed to fetch operator review form')
            );
        } finally {
            dispatch(slice.actions.setLoadingReviewData(false));
        }
    },

    submitOperatorReviews: (reviews: OperatorReviewSubmitPayload[]) => async (dispatch: any) => {
        dispatch(slice.actions.setSubmitting(true));
        try {
            await Promise.all(
                reviews.map(async (review) => {
                    if (review.reviewStatus === 'CONFIRMED') {
                        await OrderService.confirmTaskReview(review.taskReviewId);
                    } else if (review.reviewStatus === 'DECLINED') {
                        await OrderService.declineTaskReview(review.taskReviewId, {
                            declineReason: review.declineReason!,
                            declineComment: review.declineComment || undefined,
                        });
                    }
                })
            );
            return true;
        } catch (error: any) {
            dispatch(slice.actions.setError(error.message || 'Failed to submit operator reviews'));
            return false;
        } finally {
            dispatch(slice.actions.setSubmitting(false));
        }
    },

    submitSingleOperatorReview:
        (payload: {
            taskReviewId: number;
            reviewStatus: TaskReviewStatus;
            declineReason?: string | null;
            declineComment?: string | null;
        }) =>
        async (dispatch: any) => {
            try {
                if (payload.reviewStatus === 'CONFIRMED') {
                    await OrderService.confirmTaskReview(payload.taskReviewId);
                } else if (payload.reviewStatus === 'DECLINED') {
                    await OrderService.declineTaskReview(payload.taskReviewId, {
                        declineReason: payload.declineReason!,
                        declineComment: payload.declineComment || undefined,
                    });
                }
                return true;
            } catch (error: any) {
                dispatch(slice.actions.setError(error.message || 'Failed to submit review'));
                return false;
            }
        },

    openOperatorReviewDrawer: (orderId: string) => (dispatch: Dispatch) => {
        dispatch(slice.actions.setSelectedOperatorReviewOrderId(orderId));
        dispatch(slice.actions.setOperatorReviewDrawerOpen(true));
    },

    closeOperatorReviewDrawer: () => (dispatch: Dispatch) => {
        dispatch(slice.actions.setOperatorReviewDrawerOpen(false));
        dispatch(slice.actions.setSelectedOperatorReviewOrderId(null));
        dispatch(slice.actions.setOperatorReviewData(null));
    },

    clearError: () => slice.actions.setError(null),
    resetState: slice.actions.resetState,
};
