import { useState, useEffect, useCallback, useRef } from 'react';

// Types handled by WS
type WSEvent =
    | { type: 'chat_response'; session_id: string; message: string; timestamp: string }
    | { type: 'hint'; session_id: string; hint: string; timestamp: string }
    | { type: 'ack'; message: string };

interface UseWebSocketReturn {
    isConnected: boolean;
    sendMessage: (message: string, context?: any) => void;
    lastMessage: WSEvent | null;
}

export function useWebSocket(url: string, sessionId: string): UseWebSocketReturn {
    const [isConnected, setIsConnected] = useState(false);
    const [lastMessage, setLastMessage] = useState<WSEvent | null>(null);
    const socketRef = useRef<WebSocket | null>(null);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout>();

    const connect = useCallback(() => {
        if (socketRef.current?.readyState === WebSocket.OPEN) return;

        // cleanup previous
        if (socketRef.current) {
            socketRef.current.close();
        }

        const ws = new WebSocket(`${url}/${sessionId}`);
        socketRef.current = ws;

        ws.onopen = () => {
            console.log('WS Connected');
            setIsConnected(true);
        };

        ws.onclose = () => {
            console.log('WS Disconnected');
            setIsConnected(false);
            // Try reconnect
            reconnectTimeoutRef.current = setTimeout(() => {
                console.log('Attempting reconnect...');
                connect();
            }, 3000);
        };

        ws.onerror = (error) => {
            console.error('WS Error:', error);
            ws.close();
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                console.log('WS Received:', data);
                setLastMessage(data);
            } catch (e) {
                console.error('WS Parse Error', e);
            }
        };

    }, [url, sessionId]);

    useEffect(() => {
        connect();
        return () => {
            socketRef.current?.close();
            clearTimeout(reconnectTimeoutRef.current);
        };
    }, [connect]);

    const sendMessage = useCallback((message: string, context?: any) => {
        if (socketRef.current?.readyState === WebSocket.OPEN) {
            const payload: any = {
                event_type: 'chat_message',
                message: message,
                timestamp: new Date().toISOString(),
                ...context // Add problem_context, current_code, etc.
            };

            socketRef.current.send(JSON.stringify(payload));
        } else {
            console.warn('WS not connected, cannot send:', message);
        }
    }, []);

    return { isConnected, sendMessage, lastMessage };
}
