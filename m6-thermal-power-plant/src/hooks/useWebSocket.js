import { useEffect, useRef, useCallback } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

const WS_URL = 'http://localhost:8080/ws';

export function useWebSocket(accountId, onMessage) {
    const clientRef = useRef(null);
    const onMessageRef = useRef(onMessage);
    onMessageRef.current = onMessage;

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
