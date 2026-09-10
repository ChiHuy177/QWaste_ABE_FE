'use client';

import SockJS from 'sockjs-client';
import { Client, Frame, Message, StompSubscription } from '@stomp/stompjs';
import { WebSocketConfig, WebSocketErrorMessage, isFatalAuthError } from '@/types/WebSocket';

const isDev = process.env.NODE_ENV === 'development';

export class WebSocketService {
    private static instance: WebSocketService | null = null;
    private client: Client | null = null;
    private subscriptions: Map<string, StompSubscription> = new Map();
    private isConnected: boolean = false;
    private isConnecting: boolean = false;
    private connectionPromise: Promise<void> | null = null;
    private connectionReject: ((reason?: unknown) => void) | null = null;
    private reconnectAttempts: number = 0;
    private maxReconnectAttempts: number = 5;
    private baseReconnectInterval: number = 2000; // Start at 2s
    private maxReconnectInterval: number = 30000; // Cap at 30s
    private reconnectTimeoutId: number | null = null;
    private fatalAuthError: boolean = false; // Prevent reconnect after fatal auth error
    private connectionCallbacks: Set<(connected: boolean) => void> = new Set();
    private errorCallbacks: Set<(error: Error) => void> = new Set();

    private constructor() {}

    public static getInstance(): WebSocketService {
        if (typeof window === 'undefined') {
            throw new Error('WebSocketService can only be used in browser');
        }

        if (!WebSocketService.instance) {
            WebSocketService.instance = new WebSocketService();
        }

        return WebSocketService.instance;
    }

    public connect(config: WebSocketConfig): Promise<void> {
        if (this.connectionPromise) {
            return this.connectionPromise;
        }

        if (this.isConnected && this.client) {
            return Promise.resolve();
        }

        // Block reconnect if fatal auth error occurred
        if (this.fatalAuthError) {
            return Promise.reject(new Error('Fatal authentication error. Please log in again.'));
        }

        this.connectionPromise = new Promise<void>((resolve, reject) => {
            this.connectionReject = reject; // Store for later use in fatal error handling
            this.isConnecting = true;

            // BFF: Lấy token từ server endpoint (httpOnly cookie không đọc được từ JS)
            fetch('/api/bff/ws-token', { credentials: 'include' })
                .then((res) => {
                    if (!res.ok) throw new Error('Unauthorized');
                    return res.json();
                })
                .then((data) => {
                    const token = data.token;

                    if (config.maxReconnectAttempts) {
                        this.maxReconnectAttempts = config.maxReconnectAttempts;
                    }

                    try {
                        this.client = new Client({
                            webSocketFactory: () => new SockJS(`${config.url}?token=${token}`),

                            connectHeaders: {},

                            debug: (str: string) => {
                                if (config.debug && isDev) {
                                    console.log('[STOMP]', str);
                                }
                            },

                            // Disable auto-reconnect - we handle it manually with exponential backoff
                            reconnectDelay: 0,
                            heartbeatIncoming: 4000,
                            heartbeatOutgoing: 4000,

                            onConnect: (frame: Frame) => {
                                this.isConnected = true;
                                this.isConnecting = false;
                                this.reconnectAttempts = 0;
                                this.fatalAuthError = false; // Reset on successful connect
                                this.connectionPromise = null;
                                this.connectionReject = null;
                                this.notifyConnectionChange(true);
                                this.subscribeToErrors();
                                resolve();
                            },

                            onStompError: (frame: Frame) => {
                                console.error('[WebSocket] STOMP Error:', frame);

                                const disconnectHeader = frame.headers['disconnect'];
                                const errorCodeStr = frame.headers['error-code'];
                                const errorCode = errorCodeStr ? parseInt(errorCodeStr, 10) : null;
                                const errorMessage =
                                    frame.headers['message'] || frame.body || 'STOMP error';

                                // Fatal auth error - session is dead, stop reconnecting
                                if (
                                    disconnectHeader === 'true' ||
                                    (errorCode !== null && isFatalAuthError(errorCode))
                                ) {
                                    console.error(
                                        '[WebSocket] Fatal auth error detected. Code:',
                                        errorCode,
                                        'Message:',
                                        errorMessage
                                    );
                                    this.fatalAuthError = true;
                                    this.isConnecting = false;
                                    this.connectionPromise = null;
                                    this.connectionReject = null;

                                    // Deactivate client to stop reconnect attempts
                                    if (this.client) {
                                        this.client.deactivate();
                                    }

                                    this.handleSessionExpired();
                                    reject(new Error(errorMessage));
                                    return;
                                }

                                // Non-fatal error - log and allow reconnect
                                console.warn('[WebSocket] Non-fatal STOMP error:', errorMessage);
                                this.isConnecting = false;
                                this.connectionPromise = null;
                                this.connectionReject = null;
                                const error = new Error(errorMessage);
                                this.notifyError(error);
                                reject(error);
                            },

                            onWebSocketClose: (event: CloseEvent) => {
                                if (isDev)
                                    console.warn(
                                        '[WebSocket] Connection closed. Code:',
                                        event.code
                                    );
                                this.isConnected = false;
                                this.isConnecting = false;
                                this.notifyConnectionChange(false);

                                // SockJS close code 3000 = server rejected HTTP upgrade (likely 401)
                                if (event.code === 3000 && !this.fatalAuthError) {
                                    console.error(
                                        '[WebSocket] HTTP handshake failed (likely 401). Stopping reconnect.'
                                    );
                                    this.fatalAuthError = true;

                                    if (this.client) {
                                        this.client.deactivate();
                                    }

                                    // Reject promise if still pending
                                    const rejectCallback = this.connectionReject;
                                    this.connectionPromise = null;
                                    this.connectionReject = null;

                                    this.handleSessionExpired();

                                    if (rejectCallback) {
                                        rejectCallback(
                                            new Error('Authentication failed. Please log in again.')
                                        );
                                    }
                                    return;
                                }

                                // Don't reconnect if fatal auth error
                                if (this.fatalAuthError) {
                                    this.connectionPromise = null;
                                    this.connectionReject = null;
                                    return;
                                }

                                // Check max reconnect attempts
                                if (this.reconnectAttempts >= this.maxReconnectAttempts) {
                                    console.warn(
                                        '[WebSocket] Max reconnect attempts reached. Stopping.'
                                    );
                                    this.connectionPromise = null;
                                    this.connectionReject = null;

                                    if (this.client) {
                                        this.client.deactivate();
                                    }
                                    return;
                                }

                                // Normal close or network error - reconnect with exponential backoff
                                this.reconnectAttempts++;
                                const delay = Math.min(
                                    this.baseReconnectInterval *
                                        Math.pow(2, this.reconnectAttempts - 1),
                                    this.maxReconnectInterval
                                );

                                if (isDev)
                                    console.log(
                                        `[WebSocket] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`
                                    );

                                this.reconnectTimeoutId = window.setTimeout(() => {
                                    this.reconnectTimeoutId = null;
                                    if (!this.fatalAuthError && !this.isConnected && this.client) {
                                        this.client.activate();
                                    }
                                }, delay);
                            },

                            onWebSocketError: (event: Event) => {
                                console.error('[WebSocket] Connection error:', event);
                                this.isConnecting = false;
                                this.connectionPromise = null;
                                const error = new Error('WebSocket connection error');
                                this.notifyError(error);
                            },
                        });

                        this.client.activate();
                    } catch (error) {
                        console.error('[WebSocket] Failed to create connection:', error);
                        this.isConnecting = false;
                        this.connectionPromise = null;
                        const err = error instanceof Error ? error : new Error('Unknown error');
                        this.notifyError(err);
                        reject(err);
                    }
                })
                .catch(() => {
                    const error = new Error('No authentication token found. Please login.');
                    this.isConnecting = false;
                    this.connectionPromise = null;
                    this.notifyError(error);
                    reject(error);
                });
        });

        return this.connectionPromise;
    }

    public disconnect(): void {
        // Clear pending reconnect timeout
        if (this.reconnectTimeoutId !== null) {
            clearTimeout(this.reconnectTimeoutId);
            this.reconnectTimeoutId = null;
        }

        if (!this.client) return;

        this.subscriptions.forEach((subscription) => {
            subscription.unsubscribe();
        });
        this.subscriptions.clear();

        this.client.deactivate();
        this.client = null;
        this.isConnected = false;
        this.isConnecting = false;
        this.connectionPromise = null;
        this.connectionReject = null;
        this.reconnectAttempts = 0;

        this.notifyConnectionChange(false);
    }

    public subscribe<T = unknown>(destination: string, callback: (message: T) => void): () => void {
        if (!this.client || !this.isConnected) {
            if (isDev) {
                console.warn('[WebSocket] Cannot subscribe - not connected', {
                    hasClient: !!this.client,
                    isConnected: this.isConnected,
                });
            }
            return () => {};
        }

        if (!this.client.connected) {
            if (isDev) {
                console.warn('[WebSocket] STOMP connection not ready for subscription', {
                    destination,
                });
            }
            return () => {};
        }

        if (this.subscriptions.has(destination)) {
            if (isDev) console.warn(`[WebSocket] Already subscribed to ${destination}`);
            return () => this.unsubscribe(destination);
        }

        try {
            const subscription = this.client.subscribe(destination, (message: Message) => {
                try {
                    const data = JSON.parse(message.body) as T;
                    callback(data);
                } catch (error) {
                    console.error('[WebSocket] Failed to parse message:', error);
                }
            });

            this.subscriptions.set(destination, subscription);

            return () => this.unsubscribe(destination);
        } catch (error) {
            console.error('[WebSocket] Subscription failed:', error, { destination });
            return () => {};
        }
    }

    private unsubscribe(destination: string): void {
        const subscription = this.subscriptions.get(destination);
        if (subscription) {
            subscription.unsubscribe();
            this.subscriptions.delete(destination);
        }
    }

    public send(destination: string, payload: unknown): void {
        if (!this.client || !this.isConnected) {
            if (isDev) console.warn('[WebSocket] Cannot send - not connected');
            return;
        }

        this.client.publish({
            destination,
            body: JSON.stringify(payload),
        });
    }

    private subscribeToErrors(): void {
        this.subscribe<WebSocketErrorMessage>('/user/queue/errors', (error) => {
            console.error('[WebSocket] Error received:', error);

            const errorCode = error.code;

            // Fatal auth error - session is dead
            if (errorCode !== null && isFatalAuthError(errorCode)) {
                console.error(
                    '[WebSocket] Fatal auth error from /user/queue/errors. Code:',
                    errorCode
                );
                this.fatalAuthError = true;

                if (this.client) {
                    this.client.deactivate();
                }

                this.handleSessionExpired();
                return;
            }

            // Non-fatal error - notify but stay connected
            this.notifyError(new Error(error.message || error.content || 'Unknown error'));
        });
    }

    private handleSessionExpired(): void {
        console.warn('[WebSocket] Session expired - logging out');

        // Notify error callbacks
        this.notifyError(new Error('Your session has expired. Please log in again.'));

        this.disconnect();

        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('sessionExpired'));
        }
    }

    public get connected(): boolean {
        return this.isConnected;
    }

    public get connecting(): boolean {
        return this.isConnecting;
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
            WebSocketService.instance.disconnect();
            WebSocketService.instance.fatalAuthError = false; // Reset on full reset
            WebSocketService.instance = null;
        }
    }
}

export const getWebSocketService = () => WebSocketService.getInstance();
