import { useEffect, useRef, useCallback } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { API_BASE_URL } from '../services/apiClient';

// Path tương đối, đồng bộ với apiClient.js — để Nginx (prod) / Vite proxy (dev)
// forward sang backend cùng origin, tránh hardcode domain (vỡ trên server thật).
const WS_URL = `${API_BASE_URL}/ws`;

export function useWebSocket(accountId, onMessage) {
    const clientRef = useRef(null);
    const onMessageRef = useRef(onMessage);

    // Ghi ref trong effect, không trong render (react-hooks/refs).
    useEffect(() => {
        onMessageRef.current = onMessage;
    }, [onMessage]);

    const connect = useCallback(() => {
        if (!accountId) return;

        const client = new Client({
            webSocketFactory: () => new SockJS(WS_URL),
            reconnectDelay: 5000,
            onConnect: () => {
                client.subscribe(`/topic/notifications/${accountId}`, (frame) => {
                    try {
                        const notification = JSON.parse(frame.body);
                        onMessageRef.current?.(notification);
                    } catch (e) {
                        console.error('WS parse error', e);
                    }
                });
            },
            onStompError: (frame) => {
                console.error('STOMP error', frame);
            },
        });

        client.activate();
        clientRef.current = client;
    }, [accountId]);

    useEffect(() => {
        connect();
        return () => {
            clientRef.current?.deactivate();
        };
    }, [connect]);
}
