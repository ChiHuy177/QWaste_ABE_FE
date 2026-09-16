'use client';

import axios from 'axios';
import SockJS from 'sockjs-client';
import { Client, Frame, Message, StompSubscription } from '@stomp/stompjs';
import {
    WebSocketConfig,
    WebSocketErrorCode,
    WebSocketErrorMessage,
    isFatalCloseCode,
    isSessionDeadError,
} from '@/types/WebSocket';
import apiClient from './apiClient';

const isDev = process.env.NODE_ENV === 'development';

const WS_TOKEN_PATH = '/ws-token';

enum ConnectionState {
    DISCONNECTED = 'DISCONNECTED',
    CONNECTING = 'CONNECTING',
    CONNECTED = 'CONNECTED',
    FATAL_ERROR = 'FATAL_ERROR',
}

export class WebSocketService {
    private static instance: WebSocketService | null = null;
    private client: Client | null = null;
    private topicCallbacks: Map<string, Set<(message: unknown) => void>> = new Map();
    private activeStompSubscriptions: Map<string, StompSubscription> = new Map();

    private state: ConnectionState = ConnectionState.DISCONNECTED;

    private connectionPromise: Promise<void> | null = null;
    private connectionReject: ((reason?: unknown) => void) | null = null;
    private connectionResolve: ((value: void) => void) | null = null;
    private connectionSettled: boolean = false;

    private reconnectAttempts: number = 0;
    private baseReconnectInterval: number = 2000;
    private maxReconnectInterval: number = 30000;
    private reconnectTimeoutId: number | null = null;
    private currentToken: string | null = null;
    private currentConfig: WebSocketConfig | null = null;
    private hasListenersSetup: boolean = false;

    private watchdogIntervalId: number | null = null;
    private readonly watchdogIntervalMs: number = 120000;

    private hasErrorSubscription: boolean = false;

    private connectionCallbacks: Set<(connected: boolean) => void> = new Set();
    private errorCallbacks: Set<(error: Error) => void> = new Set();

    private constructor() {
        this.setupNetworkAndVisibilityListeners();
    }

    public static getInstance(): WebSocketService {
        if (typeof window === 'undefined') {
            throw new Error('WebSocketService can only be used in browser');
        }

        if (!WebSocketService.instance) {
            WebSocketService.instance = new WebSocketService();
        }

        return WebSocketService.instance;
    }

    private setupNetworkAndVisibilityListeners(): void {
        if (typeof window === 'undefined' || this.hasListenersSetup) return;
        this.hasListenersSetup = true;

        window.addEventListener('online', this.handleNetworkOrVisibilityChange);
        document.addEventListener('visibilitychange', this.handleNetworkOrVisibilityChange);
        window.addEventListener('pageshow', this.handlePageShow);
        this.startWatchdog();
    }

    private removeNetworkAndVisibilityListeners(): void {
        if (typeof window === 'undefined' || !this.hasListenersSetup) return;

        window.removeEventListener('online', this.handleNetworkOrVisibilityChange);
        document.removeEventListener('visibilitychange', this.handleNetworkOrVisibilityChange);
        window.removeEventListener('pageshow', this.handlePageShow);
        this.hasListenersSetup = false;
        this.stopWatchdog();
    }

    // Lưới an toàn độc lập với reconnectTimeoutId: nếu tab bị browser throttle
    // timer khi chạy nền lâu ngày, setTimeout của reconnect logic chính có thể
    // không chạy đúng lịch — watchdog định kỳ phát hiện và ép reconnect lại.
    private startWatchdog(): void {
        if (typeof window === 'undefined' || this.watchdogIntervalId !== null) return;

        this.watchdogIntervalId = window.setInterval(() => {
            this.watchdogCheck();
        }, this.watchdogIntervalMs);
    }

    private stopWatchdog(): void {
        if (this.watchdogIntervalId !== null) {
            clearInterval(this.watchdogIntervalId);
            this.watchdogIntervalId = null;
        }
    }

    private watchdogCheck(): void {
        if (
            this.state === ConnectionState.DISCONNECTED &&
            this.reconnectTimeoutId === null &&
            this.currentConfig
        ) {
            if (isDev) {
                console.warn(
                    '[WebSocket] Watchdog: stuck in DISCONNECTED with no pending retry. Forcing reconnect.'
                );
            }
            this.reconnectAttempts = 0;
            this.connect(this.currentConfig).catch((err) => {
                if (isDev) console.warn('[WebSocket] Watchdog reconnect failed:', err);
            });
        }
    }

    private handleNetworkOrVisibilityChange = (): void => {
        if (typeof window === 'undefined') return;

        const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
        const isVisible =
            typeof document !== 'undefined' ? document.visibilityState === 'visible' : true;

        if (isDev) {
            console.log('[WebSocket] Event triggered - online:', isOnline, 'visible:', isVisible);
        }

        if (isOnline && isVisible && this.state === ConnectionState.DISCONNECTED) {
            if (isDev) {
                console.log(
                    '[WebSocket] Network or tab active. Resetting attempts and reconnecting...'
                );
            }
            this.reconnectAttempts = 0;

            if (this.currentConfig) {
                this.connect(this.currentConfig).catch((err) => {
                    if (isDev) console.warn('[WebSocket] Reconnect on event failed:', err);
                });
            } else if (this.client && !this.client.active) {
                this.client.activate();
            }
        }
    };

    // Trang được khôi phục từ bfcache: WS đã bị browser đóng ngay khi vào
    // cache (không tự mở lại). pageshow(persisted=true) là tín hiệu riêng,
    // đáng tin cậy hơn visibilitychange cho đúng trường hợp này vì nó fire
    // ngay khi bfcache restore xảy ra, không phụ thuộc thời điểm tab lấy
    // lại visibility.
    private handlePageShow = (event: PageTransitionEvent): void => {
        if (!event.persisted) return;

        if (isDev) {
            console.log('[WebSocket] Page restored from bfcache. Checking connection...');
        }

        this.handleNetworkOrVisibilityChange();
    };

    // Token httpOnly không đọc được từ JS — phải xin lại qua BFF mỗi lần
    // connect()/reconnect(), không được cache, vì access token phía server có
    // thể đã được apiClient tự refresh giữa các lần reconnect. apiClient đã tự
    // refresh access token và retry khi gặp 401 nên không cần try/catch riêng
    // cho refresh ở đây — lỗi bắn ra từ đây là lỗi cuối cùng sau khi đã refresh.
    private async fetchWsToken(): Promise<string> {
        const response = await apiClient.get<{ token: string }>(WS_TOKEN_PATH);
        const token = response.data?.token;
        if (!token) {
            throw new Error('No WebSocket token returned');
        }
        return token;
    }

    private settleConnection(type: 'resolve' | 'reject', value?: unknown): void {
        if (this.connectionSettled) return;
        this.connectionSettled = true;

        if (type === 'resolve' && this.connectionResolve) {
            this.connectionResolve();
        } else if (type === 'reject' && this.connectionReject) {
            this.connectionReject(value);
        }

        this.connectionResolve = null;
        this.connectionReject = null;
        this.connectionPromise = null;
    }

    // Lên lịch reconnect với backoff (jitter ±20%, cap ở maxReconnectInterval).
    // Retry vô hạn (không dừng hẳn sau N lần): với kết nối sống nhiều ngày, một
    // outage backend dài hơn tổng backoff có thể khiến client kẹt DISCONNECTED
    // vĩnh viễn nếu tab không đổi visibility và mạng local không rớt. Watchdog
    // là lưới an toàn thứ 2. Dùng chung cho onWebSocketClose và cho lỗi kết nối
    // tạm thời phát hiện ở beforeConnect (fetch token fail vì backend unreachable).
    private scheduleReconnect(): void {
        this.reconnectAttempts++;
        const exponent = Math.min(this.reconnectAttempts - 1, 10);
        const baseDelay = Math.min(
            this.baseReconnectInterval * Math.pow(2, exponent),
            this.maxReconnectInterval
        );
        // Jitter ±20% để tránh nhiều client cùng đồng loạt reconnect
        // khi server vừa sống lại sau outage (thundering herd)
        const jitter = baseDelay * 0.2 * (Math.random() * 2 - 1);
        const delay = Math.max(0, Math.round(baseDelay + jitter));

        if (isDev) {
            console.log(
                `[WebSocket] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`
            );
        }

        if (this.reconnectTimeoutId !== null) {
            clearTimeout(this.reconnectTimeoutId);
        }

        this.reconnectTimeoutId = window.setTimeout(() => {
            this.reconnectTimeoutId = null;
            if (this.state === ConnectionState.DISCONNECTED && this.currentConfig) {
                this.connect(this.currentConfig).catch((err) => {
                    if (isDev) console.warn('[WebSocket] Reconnect attempt failed:', err);
                });
            }
        }, delay);
    }

    // Reset nhẹ sau lỗi tạm thời (vd. fetch token fail vì backend unreachable) —
    // khác disconnect() ở chỗ GIỮ currentConfig/topicCallbacks/reconnectAttempts để
    // scheduleReconnect() tiếp tục backoff và tự resubscribe khi nối lại được.
    private resetConnectionState(): void {
        if (this.client) {
            this.client.deactivate();
            this.client = null;
        }
        this.activeStompSubscriptions.clear();
        this.hasErrorSubscription = false;

        if (this.state !== ConnectionState.FATAL_ERROR) {
            this.state = ConnectionState.DISCONNECTED;
        }

        this.connectionPromise = null;
        this.connectionResolve = null;
        this.connectionReject = null;
        this.connectionSettled = true;

        this.notifyConnectionChange(false);
    }

    public connect(config: WebSocketConfig): Promise<void> {
        this.currentConfig = config;
        this.setupNetworkAndVisibilityListeners();

        if (this.connectionPromise) {
            return this.connectionPromise;
        }

        if (this.state === ConnectionState.CONNECTED && this.client) {
            return Promise.resolve();
        }

        if (this.state === ConnectionState.FATAL_ERROR) {
            return Promise.reject(new Error('Fatal authentication error. Please log in again.'));
        }

        this.connectionSettled = false;

        this.connectionPromise = new Promise<void>((resolve, reject) => {
            this.connectionResolve = resolve;
            this.connectionReject = reject;
            this.state = ConnectionState.CONNECTING;

            try {
                this.client = new Client({
                    beforeConnect: async () => {
                        try {
                            this.currentToken = await this.fetchWsToken();
                        } catch (error) {
                            if (isDev)
                                console.error(
                                    '[WebSocket] Token fetch failed before connect:',
                                    error
                                );

                            // Chỉ 401/417 (backend đã trả lời và từ chối — apiClient đã tự
                            // refresh token trước khi throw tới đây) mới là hết phiên thật.
                            // Network error / 502 'Không kết nối được tới backend server' từ
                            // BFF proxy / 503-504 là lỗi hạ tầng tạm thời, KHÔNG được coi là
                            // hết phiên.
                            const status = axios.isAxiosError(error)
                                ? error.response?.status
                                : undefined;
                            const isAuthFailure = status === 401 || status === 417;

                            if (!isAuthFailure) {
                                const err =
                                    error instanceof Error
                                        ? error
                                        : new Error('WebSocket token fetch failed');
                                this.settleConnection('reject', err);
                                this.notifyError(err);
                                this.resetConnectionState();
                                this.scheduleReconnect();
                                throw err;
                            }

                            this.state = ConnectionState.FATAL_ERROR;

                            if (this.client) {
                                this.client.deactivate();
                            }

                            const err =
                                error instanceof Error ? error : new Error('Authentication failed');
                            // Settle TRƯỚC khi handleSessionExpired, vì disconnect() bên trong
                            // sẽ set connectionSettled = true và clear promise references
                            this.settleConnection('reject', err);
                            this.handleSessionExpired();
                            throw err;
                        }
                    },

                    webSocketFactory: () => {
                        if (!this.currentToken) {
                            throw new Error('No valid token available for SockJS connection');
                        }
                        // Token có thể đã được apiClient refresh giữa các lần reconnect —
                        // beforeConnect() luôn xin token mới nhất trước khi factory này chạy.
                        return new SockJS(`${config.url}?token=${this.currentToken}`);
                    },

                    connectHeaders: {},

                    debug: (str: string) => {
                        if (config.debug && isDev) {
                            console.log('[STOMP]', str);
                        }
                    },

                    // Tự quản reconnect bằng backoff riêng — tắt cơ chế reconnect built-in.
                    reconnectDelay: 0,
                    heartbeatIncoming: 10000,
                    heartbeatOutgoing: 10000,

                    onConnect: (_frame: Frame) => {
                        this.state = ConnectionState.CONNECTED;
                        this.reconnectAttempts = 0;

                        // Clear stale STOMP subscription references từ connection trước
                        this.activeStompSubscriptions.clear();

                        this.notifyConnectionChange(true);

                        // Subscribe hàng đợi lỗi TRƯỚC mọi subscribe nghiệp vụ khác — nếu
                        // resubscribe topic thường bị từ chối trước khi hàng đợi này sẵn
                        // sàng, thông báo lỗi tương ứng sẽ mất luôn phía client.
                        if (!this.hasErrorSubscription) {
                            this.subscribeToErrors();
                            this.hasErrorSubscription = true;
                        }

                        // Resubscribe tất cả topics nghiệp vụ đang active
                        this.resubscribeAllTopics();

                        this.settleConnection('resolve');
                    },

                    onStompError: (frame: Frame) => {
                        console.error('[WebSocket] STOMP Error:', frame);

                        const disconnectHeader = frame.headers['disconnect'];
                        const errorCodeStr = frame.headers['error-code'];
                        const errorCode = errorCodeStr ? parseInt(errorCodeStr, 10) : null;
                        const errorMessage =
                            frame.headers['message'] || frame.body || 'STOMP error';

                        if (
                            disconnectHeader === 'true' ||
                            (errorCode !== null && isFatalCloseCode(errorCode))
                        ) {
                            console.error(
                                '[WebSocket] Fatal error via ERROR frame. Code:',
                                errorCode,
                                'Message:',
                                errorMessage
                            );
                            this.state = ConnectionState.FATAL_ERROR;

                            if (this.client) {
                                this.client.deactivate();
                            }

                            this.settleConnection('reject', new Error(errorMessage));

                            // 809 (quá nhiều kết nối đồng thời) là mã fatal duy nhất không
                            // đồng nghĩa phiên chết — không đăng xuất, chỉ báo lỗi và dừng
                            // hẳn (reconnect ngay sẽ chỉ tạo socket mới rồi lại bị 809).
                            if (errorCode !== null && !isSessionDeadError(errorCode)) {
                                this.disconnect();
                                this.notifyError(
                                    this.withErrorCode(
                                        new Error('Quá nhiều kết nối. Vui lòng đóng bớt tab.'),
                                        errorCode
                                    )
                                );
                                return;
                            }

                            this.handleSessionExpired();
                            return;
                        }

                        console.warn('[WebSocket] Non-fatal STOMP error:', errorMessage);
                        this.state = ConnectionState.DISCONNECTED;
                        const error = new Error(errorMessage);
                        this.notifyError(error);
                        this.settleConnection('reject', error);
                    },

                    onWebSocketClose: (event: CloseEvent) => {
                        if (isDev) {
                            console.warn('[WebSocket] Connection closed. Code:', event.code);
                        }

                        if (this.state !== ConnectionState.FATAL_ERROR) {
                            this.state = ConnectionState.DISCONNECTED;
                        }

                        this.notifyConnectionChange(false);

                        // SockJS close code 3000 (server rejected HTTP upgrade) KHÔNG đáng tin
                        // để suy ra 401 — cũng xảy ra khi backend unreachable/hạ tầng lỗi. Auth
                        // failure thật sự đã được phát hiện qua fetchWsToken() ở beforeConnect
                        // (status 401/417), nên ở đây fallback về retry bình thường như mọi
                        // close code không xác định khác.

                        if (this.state === ConnectionState.FATAL_ERROR) {
                            this.settleConnection(
                                'reject',
                                new Error('Fatal authentication error.')
                            );
                            return;
                        }

                        // STOMP Client.active chỉ về false khi deactivate() được gọi tường
                        // minh — gọi lại activate() trên client cũ (đã active=true từ lần
                        // connect trước) là no-op. Phải settle promise cũ rồi tạo client mới
                        // qua connect() (giống handleNetworkOrVisibilityChange/watchdogCheck)
                        // để lần retry thực sự mở kết nối mới.
                        this.settleConnection(
                            'reject',
                            new Error(`WebSocket closed (code ${event.code})`)
                        );
                        this.scheduleReconnect();
                    },

                    onWebSocketError: (event: Event) => {
                        console.error('[WebSocket] Connection error:', event);
                        // Không đổi state ở đây vì onWebSocketClose sẽ fire ngay sau
                        const error = new Error('WebSocket connection error');
                        this.notifyError(error);
                    },
                });

                this.client.activate();
            } catch (error) {
                console.error('[WebSocket] Failed to create connection:', error);
                this.state = ConnectionState.DISCONNECTED;
                const err = error instanceof Error ? error : new Error('Unknown error');
                this.notifyError(err);
                this.settleConnection('reject', err);
            }
        });

        return this.connectionPromise;
    }

    public disconnect(): void {
        if (this.reconnectTimeoutId !== null) {
            clearTimeout(this.reconnectTimeoutId);
            this.reconnectTimeoutId = null;
        }

        if (this.client) {
            this.client.deactivate();
            this.client = null;
        }

        // Client đã deactivate ở trên nên các subscription object đã invalid —
        // không gọi unsubscribe() trên chúng, chỉ cần clear references.
        this.activeStompSubscriptions.clear();
        this.topicCallbacks.clear();

        // Preserve FATAL_ERROR — disconnect không nên xóa fatal state
        // vì caller cần biết lý do disconnect là auth failure
        if (this.state !== ConnectionState.FATAL_ERROR) {
            this.state = ConnectionState.DISCONNECTED;
        }
        this.connectionPromise = null;
        this.connectionResolve = null;
        this.connectionReject = null;
        this.connectionSettled = true;
        this.reconnectAttempts = 0;
        this.hasErrorSubscription = false;

        // disconnect() là hành động chủ động dừng hẳn (logout, session expired).
        // Clear currentConfig để watchdog và event-based reconnect
        // (handleNetworkOrVisibilityChange) không tự ý nối lại sau khi đã disconnect.
        this.currentConfig = null;

        this.notifyConnectionChange(false);
    }

    public subscribe<T = unknown>(destination: string, callback: (message: T) => void): () => void {
        if (!this.topicCallbacks.has(destination)) {
            this.topicCallbacks.set(destination, new Set());
        }
        const callbacks = this.topicCallbacks.get(destination)!;
        callbacks.add(callback as (message: unknown) => void);

        if (this.state === ConnectionState.CONNECTED && this.client?.connected) {
            this.ensureStompSubscription(destination);
        }

        return () => this.unsubscribe(destination, callback as (message: unknown) => void);
    }

    private ensureStompSubscription(destination: string): void {
        if (this.activeStompSubscriptions.has(destination)) {
            return;
        }

        if (!this.client || !this.client.connected) {
            return;
        }

        try {
            const subscription = this.client.subscribe(destination, (message: Message) => {
                try {
                    const data = JSON.parse(message.body);
                    const callbacks = this.topicCallbacks.get(destination);
                    if (callbacks) {
                        callbacks.forEach((cb) => {
                            try {
                                cb(data);
                            } catch (err) {
                                console.error(
                                    `[WebSocket] Error in callback for ${destination}:`,
                                    err
                                );
                            }
                        });
                    }
                } catch (error) {
                    console.error('[WebSocket] Failed to parse message:', error);
                }
            });

            this.activeStompSubscriptions.set(destination, subscription);
            if (isDev)
                console.log(`[WebSocket] Active STOMP subscription created for: ${destination}`);
        } catch (error) {
            console.error('[WebSocket] Subscription failed:', error, { destination });
        }
    }

    private resubscribeAllTopics(): void {
        this.topicCallbacks.forEach((callbacks, destination) => {
            if (callbacks.size > 0) {
                this.ensureStompSubscription(destination);
            }
        });
    }

    private unsubscribe(destination: string, callback: (message: unknown) => void): void {
        const callbacks = this.topicCallbacks.get(destination);
        if (callbacks) {
            callbacks.delete(callback);
            if (callbacks.size === 0) {
                this.topicCallbacks.delete(destination);
                const subscription = this.activeStompSubscriptions.get(destination);
                if (subscription) {
                    try {
                        subscription.unsubscribe();
                    } catch {
                        /* subscription may already be invalid */
                    }
                    this.activeStompSubscriptions.delete(destination);
                }

                if (destination === '/user/queue/errors') {
                    this.hasErrorSubscription = false;
                }
            }
        }
    }

    // Kênh này một chiều tuyệt đối (server → client) — không có API publish. Gọi
    // client.publish() sẽ luôn bị backend từ chối với mã WS_UNAUTHORIZED_ACTION (811).

    private withErrorCode(error: Error, code?: number | null): Error {
        if (code !== undefined && code !== null) {
            (error as Error & { code?: number }).code = code;
        }
        return error;
    }

    // /user/queue/errors — kết nối vẫn sống, chỉ mang 808/810/811/812/813 (các mã
    // fatal 801-804/809 chỉ tới qua ERROR frame ở onStompError, không qua đây).
    private subscribeToErrors(): void {
        this.subscribe<WebSocketErrorMessage>('/user/queue/errors', (error) => {
            const errorCode = error.code;

            switch (errorCode) {
                case WebSocketErrorCode.WS_UNAUTHORIZED_SUBSCRIPTION:
                    // 810 = destination sai/không tồn tại. Luôn là bug FE, không quyền
                    // nào sửa được — log cho dev, không hiện toast cho user.
                    console.error('[WebSocket] Unauthorized subscription (810), bug FE:', error);
                    return;

                case WebSocketErrorCode.WS_UNAUTHORIZED_ACTION:
                    // 811 = client cố SEND — cũng luôn là bug FE (đã bỏ send() ở service này).
                    console.error(
                        '[WebSocket] Unauthorized action (811), client attempted SEND:',
                        error
                    );
                    return;

                case WebSocketErrorCode.WS_RATE_LIMIT_EXCEEDED:
                    // 808 = chạm hạn mức SUBSCRIBE — kết nối vẫn sống, chỉ cần giãn nhịp
                    // subscribe, KHÔNG reconnect.
                    console.warn('[WebSocket] Rate limit exceeded (808):', error);
                    this.notifyError(
                        this.withErrorCode(
                            new Error(error.message || error.content || 'Rate limit exceeded'),
                            errorCode
                        )
                    );
                    return;

                case WebSocketErrorCode.WS_INSUFFICIENT_PERMISSIONS:
                    // 812 = user thật sự không có quyền — đáng báo cho user.
                    this.notifyError(
                        this.withErrorCode(
                            new Error(error.message || error.content || 'Insufficient permissions'),
                            errorCode
                        )
                    );
                    return;

                case WebSocketErrorCode.WS_INTERNAL_ERROR:
                    console.error('[WebSocket] Internal server error (813):', error);
                    this.notifyError(
                        this.withErrorCode(
                            new Error(error.message || error.content || 'Internal server error'),
                            errorCode
                        )
                    );
                    return;

                default:
                    console.warn('[WebSocket] Unrecognized error on /user/queue/errors:', error);
                    this.notifyError(
                        new Error(error.message || error.content || 'Unknown WebSocket error')
                    );
            }
        });
    }

    private handleSessionExpired(): void {
        console.warn('[WebSocket] Session expired - logging out');

        this.notifyError(new Error('Your session has expired. Please log in again.'));

        this.disconnect();

        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('sessionExpired'));
        }
    }

    public get connected(): boolean {
        return this.state === ConnectionState.CONNECTED;
    }

    public get connecting(): boolean {
        return this.state === ConnectionState.CONNECTING;
    }

    public get hasFatalError(): boolean {
        return this.state === ConnectionState.FATAL_ERROR;
    }

    public onConnectionChange(callback: (connected: boolean) => void): () => void {
        this.connectionCallbacks.add(callback);
        return () => {
            this.connectionCallbacks.delete(callback);
        };
    }

    public onError(callback: (error: Error) => void): () => void {
        this.errorCallbacks.add(callback);
        return () => {
            this.errorCallbacks.delete(callback);
        };
    }

    private notifyConnectionChange(connected: boolean): void {
        this.connectionCallbacks.forEach((callback) => {
            try {
                callback(connected);
            } catch (error) {
                console.error('[WebSocket] Error in connection callback:', error);
            }
        });
    }

    private notifyError(error: Error): void {
        this.errorCallbacks.forEach((callback) => {
            try {
                callback(error);
            } catch (err) {
                console.error('[WebSocket] Error in error callback:', err);
            }
        });
    }

    public static reset(): void {
        if (WebSocketService.instance) {
            WebSocketService.instance.removeNetworkAndVisibilityListeners();
            WebSocketService.instance.disconnect();
            WebSocketService.instance = null;
        }
    }
}

export const getWebSocketService = () => WebSocketService.getInstance();
