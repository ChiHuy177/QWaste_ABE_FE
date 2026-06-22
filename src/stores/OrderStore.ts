import { OrderService, TaskService } from '@/services';
import {
    OrderSummaryResponse,
    OrderResponse,
    TaskResponse,
    OrderStatus,
    TaskStatus,
    OrderCreationRequest,
    OrderUpdationRequest,
    OrderInfoUpdationRequest,
    OrderPlanUpdationRequest,
    UserForPickingByRole,
    OrderDrawingSummaryResponse,
    OrderManagerReviewResponse,
    OrderOperatorReviewResponse,
    OperatorReviewSubmitPayload,
    OrderOperatorSummaryResponse,
    TaskReviewStatus,
    DrawingCodePickingResponse,
} from '@/types';
// import { OperatorService } from '@/services/OperatorService';
import { createSlice, Dispatch, PayloadAction } from '@reduxjs/toolkit';

const getApiErrorMessage = (error: any, fallback: string) => {
    console.error('API Error:', error);
    const responseData = error?.response?.data;

    if (typeof responseData?.message === 'string' && responseData.message.trim()) {
        return responseData.message;
    }

    if (Array.isArray(responseData?.errors) && responseData.errors.length > 0) {
        return responseData.errors.join('\n');
    }

    return error?.message || fallback;
};

export interface IOrderStoreState {
    orders: OrderSummaryResponse[];
    currentOrder: OrderResponse | null;
    tasks: TaskResponse[];
    operators: UserForPickingByRole[];
    orderDrawings: OrderDrawingSummaryResponse[];
    currentDrawing: TaskResponse[] | null;
    myReviewingOrders: OrderOperatorSummaryResponse[];
    managerReviewData: OrderManagerReviewResponse | null;
    operatorReviewData: OrderOperatorReviewResponse | null;
    isLoadingOrders: boolean;
    isLoadingDetail: boolean;
    isLoadingTasks: boolean;
    isLoadingOperators: boolean;
    isLoadingDrawings: boolean;
    isLoadingReviewData: boolean;
    isSubmitting: boolean;
    isExporting: boolean;
    error: string | null;

    // UI States
    isFormOpen: boolean;
    formMode: 'create' | 'edit';
    selectedOrderId: string | null;
    isDetailDrawerOpen: boolean;
    activeDetailTab: string;
    ordersViewMode: 'table' | 'card';

    // Task & Search UI States
    isAddTaskFormOpen: boolean;
    selectedTaskId: string | null;
    orderSearchQuery: string;
    taskSearchQuery: string;
    operatorSearchQuery: string;
    tasksViewMode: 'table' | 'card';
    isOperatorReviewDrawerOpen: boolean;
    selectedOperatorReviewOrderId: string | null;
    isManagerReviewDrawerOpen: boolean;
    selectedManagerReviewOrderId: string | null;

    drawingTemplates: DrawingCodePickingResponse[];
    isLoadingTemplates: boolean;
}

const initialState: IOrderStoreState = {
    orders: [],
    currentOrder: null,
    tasks: [],
    operators: [],
    orderDrawings: [],
    currentDrawing: null,
    myReviewingOrders: [],
    managerReviewData: null,
    operatorReviewData: null,
    isLoadingOrders: false,
    isLoadingDetail: false,
    isLoadingTasks: false,
    isLoadingOperators: false,
    isLoadingDrawings: false,
    isLoadingReviewData: false,
    isSubmitting: false,
    isExporting: false,
    error: null,
    isFormOpen: false,
    formMode: 'create',
    selectedOrderId: null,
    isDetailDrawerOpen: false,
    activeDetailTab: 'overview',
    ordersViewMode: 'table',
    isAddTaskFormOpen: false,
    selectedTaskId: null,
    orderSearchQuery: '',
    taskSearchQuery: '',
    operatorSearchQuery: '',
    tasksViewMode: 'table',
    isOperatorReviewDrawerOpen: false,
    selectedOperatorReviewOrderId: null,
    isManagerReviewDrawerOpen: false,
    selectedManagerReviewOrderId: null,
    drawingTemplates: [],
    isLoadingTemplates: false,
};

const slice = createSlice({
    name: 'order',
    initialState,
    reducers: {
        //Loading Setters
        setLoadingOrders: (state, action: PayloadAction<boolean>) => {
            state.isLoadingOrders = action.payload;
        },
        setLoadingDetail: (state, action: PayloadAction<boolean>) => {
            state.isLoadingDetail = action.payload;
        },
        setLoadingTasks: (state, action: PayloadAction<boolean>) => {
            state.isLoadingTasks = action.payload;
        },
        setLoadingOperators: (state, action: PayloadAction<boolean>) => {
            state.isLoadingOperators = action.payload;
        },
        setSubmitting: (state, action: PayloadAction<boolean>) => {
            state.isSubmitting = action.payload;
        },
        setError: (state, action: PayloadAction<string | null>) => {
            state.error = action.payload;
        },
        //Data Setters
        setOrders: (state, action: PayloadAction<OrderSummaryResponse[]>) => {
            state.orders = action.payload;
        },
        setCurrentOrder: (state, action: PayloadAction<OrderResponse | null>) => {
            state.currentOrder = action.payload;
        },
        setTasks: (state, action: PayloadAction<TaskResponse[]>) => {
            state.tasks = action.payload;
        },
        setOperators: (state, action: PayloadAction<UserForPickingByRole[]>) => {
            state.operators = action.payload;
        },
        setOrderDrawings: (state, action: PayloadAction<OrderDrawingSummaryResponse[]>) => {
            state.orderDrawings = action.payload;
        },
        setCurrentDrawing: (state, action: PayloadAction<TaskResponse[] | null>) => {
            state.currentDrawing = action.payload;
        },
        setMyReviewingOrders: (state, action: PayloadAction<OrderOperatorSummaryResponse[]>) => {
            state.myReviewingOrders = action.payload;
        },
        setManagerReviewData: (state, action: PayloadAction<OrderManagerReviewResponse | null>) => {
            state.managerReviewData = action.payload;
        },
        setOperatorReviewData: (
            state,
            action: PayloadAction<OrderOperatorReviewResponse | null>
        ) => {
            state.operatorReviewData = action.payload;
        },
        setLoadingDrawings: (state, action: PayloadAction<boolean>) => {
            state.isLoadingDrawings = action.payload;
        },
        setLoadingReviewData: (state, action: PayloadAction<boolean>) => {
            state.isLoadingReviewData = action.payload;
        },
        setExporting: (state, action: PayloadAction<boolean>) => {
            state.isExporting = action.payload;
        },

        //websocket here
        //WS: /topic/orders/status/{orderId}
        updateOrderStatusRealtime: (
            state,
            action: PayloadAction<{ orderId: string; newStatus: OrderStatus }>
        ) => {
            const { orderId, newStatus } = action.payload;
            // 1. Cập nhật trong Detail nếu đang mở
            if (state.currentOrder && state.currentOrder.orderId === orderId) {
                state.currentOrder.orderStatus = newStatus;
            }
            // 2. Cập nhật trong List bên ngoài
            const orderIndex = state.orders.findIndex((o) => o.orderId === orderId);
            if (orderIndex !== -1) {
                state.orders[orderIndex].orderStatus = newStatus;
            }
        },

        // Gọi khi nhận WS: /topic/orders/tasks/{orderId}
        updateTaskStatusRealtime: (
            state,
            action: PayloadAction<{ taskId: string; newStatus: TaskStatus }>
        ) => {
            const { taskId, newStatus } = action.payload;
            // Tìm và cập nhật task trên Kanban Board
            const taskIndex = state.tasks.findIndex((t) => t.taskId === taskId);
            if (taskIndex !== -1) {
                state.tasks[taskIndex].taskStatus = newStatus;
            }
        },
        resetState: () => initialState,

        // UI Reducers
        setFormOpen: (state, action: PayloadAction<boolean>) => {
            state.isFormOpen = action.payload;
        },
        setFormMode: (state, action: PayloadAction<'create' | 'edit'>) => {
            state.formMode = action.payload;
        },
        setSelectedOrderId: (state, action: PayloadAction<string | null>) => {
            state.selectedOrderId = action.payload;
        },
        setDetailDrawerOpen: (state, action: PayloadAction<boolean>) => {
            state.isDetailDrawerOpen = action.payload;
        },
        setActiveDetailTab: (state, action: PayloadAction<string>) => {
            state.activeDetailTab = action.payload;
        },
        setOrdersViewMode: (state, action: PayloadAction<'table' | 'card'>) => {
            state.ordersViewMode = action.payload;
        },

        // Task & Search UI Reducers
        setAddTaskFormOpen: (state, action: PayloadAction<boolean>) => {
            state.isAddTaskFormOpen = action.payload;
        },
        setSelectedTaskId: (state, action: PayloadAction<string | null>) => {
            state.selectedTaskId = action.payload;
        },
        setOrderSearchQuery: (state, action: PayloadAction<string>) => {
            state.orderSearchQuery = action.payload;
        },
        setTaskSearchQuery: (state, action: PayloadAction<string>) => {
            state.taskSearchQuery = action.payload;
        },
        setOperatorSearchQuery: (state, action: PayloadAction<string>) => {
            state.operatorSearchQuery = action.payload;
        },
        setTasksViewMode: (state, action: PayloadAction<'table' | 'card'>) => {
            state.tasksViewMode = action.payload;
        },
        setOperatorReviewDrawerOpen: (state, action: PayloadAction<boolean>) => {
            state.isOperatorReviewDrawerOpen = action.payload;
        },
        setSelectedOperatorReviewOrderId: (state, action: PayloadAction<string | null>) => {
            state.selectedOperatorReviewOrderId = action.payload;
        },
        setManagerReviewDrawerOpen: (state, action: PayloadAction<boolean>) => {
            state.isManagerReviewDrawerOpen = action.payload;
        },
        setSelectedManagerReviewOrderId: (state, action: PayloadAction<string | null>) => {
            state.selectedManagerReviewOrderId = action.payload;
        },
        setDrawingTemplates: (state, action: PayloadAction<DrawingCodePickingResponse[]>) => {
            state.drawingTemplates = action.payload;
        },
        setLoadingTemplates: (state, action: PayloadAction<boolean>) => {
            state.isLoadingTemplates = action.payload;
        },
    },
});

export const { reducer } = slice;

export const orderActions = {
    fetchOrders: () => async (dispatch: Dispatch) => {
        dispatch(slice.actions.setLoadingOrders(true));
        try {
            const data = await OrderService.getAllOrders();
            dispatch(slice.actions.setOrders(data));
        } catch (error: any) {
            dispatch(slice.actions.setError(error.message || 'Failed to fetch orders'));
        } finally {
            dispatch(slice.actions.setLoadingOrders(false));
        }
    },

    fetchOrderDetail: (orderId: string) => async (dispatch: Dispatch) => {
        dispatch(slice.actions.setLoadingDetail(true));
        try {
            const data = await OrderService.getOrderById(orderId);
            dispatch(slice.actions.setCurrentOrder(data as OrderResponse));
        } catch (error: any) {
            console.error(`Failed to fetch order ${orderId}:`, error);
            dispatch(slice.actions.setError(error.message || 'Failed to fetch order detail'));
        } finally {
            dispatch(slice.actions.setLoadingDetail(false));
        }
    },

    fetchTasks: (orderId: string) => async (dispatch: Dispatch) => {
        dispatch(slice.actions.setLoadingTasks(true));
        try {
            const data = await TaskService.getTasksByOrderId(orderId);
            dispatch(slice.actions.setTasks(data));
        } catch (error: any) {
            dispatch(slice.actions.setError(error.message || 'Failed to fetch tasks'));
        } finally {
            dispatch(slice.actions.setLoadingTasks(false));
        }
    },

    // fetchOperators: () => async (dispatch: Dispatch) => {
    //     dispatch(slice.actions.setLoadingOperators(true));
    //     try {
    //         const data = await OperatorService.getOperators();
    //         dispatch(slice.actions.setOperators(data));
    //     } catch (error: any) {
    //         dispatch(slice.actions.setError(error.message || 'Failed to fetch operators'));
    //     } finally {
    //         dispatch(slice.actions.setLoadingOperators(false));
    //     }
    // },

    // fetchAvailableOperators: () => async (dispatch: Dispatch) => {
    //     dispatch(slice.actions.setLoadingOperators(true));
    //     try {
    //         const data = await OperatorService.getAvailableOperators();
    //         dispatch(slice.actions.setOperators(data));
    //     } catch (error: any) {
    //         dispatch(
    //             slice.actions.setError(error.message || 'Failed to fetch available operators')
    //         );
    //     } finally {
    //         dispatch(slice.actions.setLoadingOperators(false));
    //     }
    // },

    // assignTaskToOperator: (taskId: string, operatorId: string) => async (dispatch: any) => {
    //     dispatch(slice.actions.setSubmitting(true));
    //     try {
    //         await OperatorService.assignTask(operatorId, taskId);
    //         // Có thể cần fetch lại order detail hoặc tasks để cập nhật UI
    //         return true;
    //     } catch (error: any) {
    //         dispatch(slice.actions.setError(error.message));
    //         return false;
    //     } finally {
    //         dispatch(slice.actions.setSubmitting(false));
    //     }
    // },

    createOrder: (payload: OrderCreationRequest) => async (dispatch: any) => {
        dispatch(slice.actions.setSubmitting(true));
        try {
            await OrderService.createOrder(payload);
            dispatch(orderActions.fetchOrders());
            return { success: true };
        } catch (error: any) {
            const errorMessage = getApiErrorMessage(error, 'Failed to create order');
            dispatch(slice.actions.setError(errorMessage));
            return { success: false, error: errorMessage };
        } finally {
            dispatch(slice.actions.setSubmitting(false));
        }
    },

    updateOrder: (payload: OrderUpdationRequest) => async (dispatch: any) => {
        dispatch(slice.actions.setSubmitting(true));
        try {
            await OrderService.updateOrder(payload);
            dispatch(orderActions.fetchOrders());
            dispatch(orderActions.fetchOrderDetail(payload.orderId));
            return { success: true };
        } catch (error: any) {
            const errorMessage = getApiErrorMessage(error, 'Failed to update order');
            dispatch(slice.actions.setError(errorMessage));
            return { success: false, error: errorMessage };
        } finally {
            dispatch(slice.actions.setSubmitting(false));
        }
    },

    updateOrderInfo: (payload: OrderInfoUpdationRequest) => async (dispatch: any) => {
        dispatch(slice.actions.setSubmitting(true));
        try {
            await OrderService.updateOrderInfo(payload);
            dispatch(orderActions.fetchOrders());
            dispatch(orderActions.fetchOrderDetail(payload.orderId));
            return { success: true };
        } catch (error: any) {
            const errorMessage = getApiErrorMessage(error, 'Failed to update order info');
            dispatch(slice.actions.setError(errorMessage));
            return { success: false, error: errorMessage };
        } finally {
            dispatch(slice.actions.setSubmitting(false));
        }
    },

    updateOrderPlan: (payload: OrderPlanUpdationRequest) => async (dispatch: any) => {
        dispatch(slice.actions.setSubmitting(true));
        try {
            await OrderService.updateOrderPlan(payload);
            dispatch(orderActions.fetchOrders());
            dispatch(orderActions.fetchOrderDetail(payload.orderId));
            return { success: true };
        } catch (error: any) {
            const errorMessage = getApiErrorMessage(error, 'Failed to update order plan');
            dispatch(slice.actions.setError(errorMessage));
            return { success: false, error: errorMessage };
        } finally {
            dispatch(slice.actions.setSubmitting(false));
        }
    },

    confirmOrder: (orderId: string) => async (dispatch: any) => {
        dispatch(slice.actions.setSubmitting(true));
        try {
            await OrderService.confirmOrder(orderId);
            // Sau khi confirm, gọi lại API để đồng bộ DRAFT -> IN_PRODUCTION và LOCKED -> TO_DO
            dispatch(orderActions.fetchOrders());
            dispatch(orderActions.fetchOrderDetail(orderId));
            dispatch(orderActions.fetchTasks(orderId));
            return true;
        } catch (error: any) {
            dispatch(slice.actions.setError(error.message));
            return false;
        } finally {
            dispatch(slice.actions.setSubmitting(false));
        }
    },

    deleteOrder: (orderId: string) => async (dispatch: any) => {
        dispatch(slice.actions.setSubmitting(true));
        try {
            await OrderService.deleteOrder(orderId);
            dispatch(slice.actions.setCurrentOrder(null)); // Clear current order nếu đang mở
            dispatch(orderActions.fetchOrders());
            return true;
        } catch (error: any) {
            console.error('Failed to delete order:', error);
            dispatch(slice.actions.setError(error.message || 'Failed to delete order'));
            return false;
        } finally {
            dispatch(slice.actions.setSubmitting(false));
        }
    },

    //websocket actions
    updateOrderStatusRealtime: slice.actions.updateOrderStatusRealtime,
    updateTaskStatusRealtime: slice.actions.updateTaskStatusRealtime,
    clearCurrentOrder: () => (dispatch: Dispatch) => {
        dispatch(slice.actions.setCurrentOrder(null));
        dispatch(slice.actions.setOrderDrawings([]));
    },
    clearTasks: () => slice.actions.setTasks([]),
    clearError: () => slice.actions.setError(null),

    // UI Handlers
    openOrderForm: (mode: 'create' | 'edit', orderId?: string) => (dispatch: Dispatch) => {
        dispatch(slice.actions.setFormMode(mode));
        dispatch(slice.actions.setSelectedOrderId(orderId || null));
        dispatch(slice.actions.setFormOpen(true));
    },
    closeOrderForm: () => (dispatch: Dispatch) => {
        dispatch(slice.actions.setFormOpen(false));
        // Don't clear selectedOrderId - drawer might still be open
    },
    openOrderDetailDrawer: (orderId: string) => (dispatch: Dispatch) => {
        dispatch(slice.actions.setSelectedOrderId(orderId));
        dispatch(slice.actions.setDetailDrawerOpen(true));
        dispatch(slice.actions.setActiveDetailTab('overview'));
    },
    closeOrderDetailDrawer: () => (dispatch: Dispatch) => {
        dispatch(slice.actions.setDetailDrawerOpen(true)); // Wait, checking if this should be false
        dispatch(slice.actions.setDetailDrawerOpen(false));
        dispatch(slice.actions.setSelectedOrderId(null));
    },
    setOrdersViewMode: slice.actions.setOrdersViewMode,
    setActiveDetailTab: slice.actions.setActiveDetailTab,

    // Task & Search UI Handlers
    openAddTaskForm: (orderId: string) => (dispatch: Dispatch) => {
        dispatch(slice.actions.setSelectedOrderId(orderId));
        dispatch(slice.actions.setAddTaskFormOpen(true));
    },
    closeAddTaskForm: () => (dispatch: Dispatch) => {
        dispatch(slice.actions.setAddTaskFormOpen(false));
    },
    setOrderSearchQuery: slice.actions.setOrderSearchQuery,
    setTaskSearchQuery: slice.actions.setTaskSearchQuery,
    setOperatorSearchQuery: slice.actions.setOperatorSearchQuery,
    setTasksViewMode: slice.actions.setTasksViewMode,

    openOperatorReviewDrawer: (orderId: string) => (dispatch: Dispatch) => {
        dispatch(slice.actions.setSelectedOperatorReviewOrderId(orderId));
        dispatch(slice.actions.setOperatorReviewDrawerOpen(true));
    },
    closeOperatorReviewDrawer: () => (dispatch: Dispatch) => {
        dispatch(slice.actions.setOperatorReviewDrawerOpen(false));
        dispatch(slice.actions.setSelectedOperatorReviewOrderId(null));
        dispatch(slice.actions.setOperatorReviewData(null));
    },
    openManagerReviewDrawer: (orderId: string) => (dispatch: Dispatch) => {
        dispatch(slice.actions.setSelectedManagerReviewOrderId(orderId));
        dispatch(slice.actions.setManagerReviewDrawerOpen(true));
    },
    closeManagerReviewDrawer: () => (dispatch: Dispatch) => {
        dispatch(slice.actions.setManagerReviewDrawerOpen(false));
        dispatch(slice.actions.setSelectedManagerReviewOrderId(null));
        dispatch(slice.actions.setManagerReviewData(null));
    },

    fetchOrderDrawings: (orderId: string) => async (dispatch: Dispatch) => {
        dispatch(slice.actions.setLoadingDrawings(true));
        try {
            const data = await OrderService.getOrderDrawings(orderId);
            dispatch(slice.actions.setOrderDrawings(data));
        } catch (error: any) {
            dispatch(slice.actions.setError(error.message || 'Failed to fetch order drawings'));
        } finally {
            dispatch(slice.actions.setLoadingDrawings(false));
        }
    },

    fetchOrderDrawingDetail: (orderId: string, drawingId: string) => async (dispatch: Dispatch) => {
        dispatch(slice.actions.setLoadingDrawings(true));
        try {
            const data = await OrderService.getOrderDrawingDetail(orderId, drawingId);
            dispatch(slice.actions.setCurrentDrawing(data));
        } catch (error: any) {
            dispatch(slice.actions.setError(error.message || 'Failed to fetch drawing detail'));
        } finally {
            dispatch(slice.actions.setLoadingDrawings(false));
        }
    },

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

    fetchManagerReviewDashboard: (orderId: string) => async (dispatch: Dispatch) => {
        dispatch(slice.actions.setLoadingReviewData(true));
        try {
            const data = await OrderService.getManagerReviewDashboard(orderId);
            dispatch(slice.actions.setManagerReviewData(data));
        } catch (error: any) {
            dispatch(
                slice.actions.setError(error.message || 'Failed to fetch manager review dashboard')
            );
        } finally {
            dispatch(slice.actions.setLoadingReviewData(false));
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

    cancelOrder: (orderId: string, reason: string) => async (dispatch: any) => {
        dispatch(slice.actions.setSubmitting(true));
        try {
            await OrderService.cancelOrder(orderId, reason);
            dispatch(orderActions.fetchOrders());
            dispatch(orderActions.fetchOrderDetail(orderId));
            return true;
        } catch (error: any) {
            dispatch(slice.actions.setError(error.message || 'Failed to cancel order'));
            return false;
        } finally {
            dispatch(slice.actions.setSubmitting(false));
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

    restoreOrder: (orderId: string) => async (dispatch: any) => {
        dispatch(slice.actions.setSubmitting(true));
        try {
            await OrderService.restoreOrder(orderId);
            dispatch(orderActions.fetchOrders());
            dispatch(orderActions.fetchOrderDetail(orderId));
            return true;
        } catch (error: any) {
            dispatch(slice.actions.setError(error.message || 'Failed to restore order'));
            return false;
        } finally {
            dispatch(slice.actions.setSubmitting(false));
        }
    },

    exportOrderToExcel: (orderId: string) => async (dispatch: Dispatch) => {
        dispatch(slice.actions.setExporting(true));
        try {
            const blob = await OrderService.exportOrderToExcel(orderId);
            // Trigger download
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `order-${orderId}.xlsx`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            return true;
        } catch (error: any) {
            dispatch(slice.actions.setError(error.message || 'Failed to export order'));
            return false;
        } finally {
            dispatch(slice.actions.setExporting(false));
        }
    },

    fetchDrawingTemplates: () => async (dispatch: Dispatch) => {
        dispatch(slice.actions.setLoadingTemplates(true));
        try {
            const { DrawingCodeService } = await import('@/services');
            const data = await DrawingCodeService.getDrawingCodesForPicking();
            dispatch(slice.actions.setDrawingTemplates(data));
        } catch (error: any) {
            dispatch(slice.actions.setError(error.message || 'Failed to fetch drawing templates'));
        } finally {
            dispatch(slice.actions.setLoadingTemplates(false));
        }
    },

    fetchOperators: () => async (dispatch: Dispatch) => {
        dispatch(slice.actions.setLoadingOperators(true));
        try {
            const { UserService } = await import('@/services/UserService');
            const data = await UserService.getUsersByRole('OPERATOR');
            dispatch(slice.actions.setOperators(data));
        } catch (error: any) {
            dispatch(slice.actions.setError(error.message || 'Failed to fetch operators'));
        } finally {
            dispatch(slice.actions.setLoadingOperators(false));
        }
    },

    refreshDrawingTemplates: () => (dispatch: any) => {
        dispatch(orderActions.fetchDrawingTemplates());
    },
};
