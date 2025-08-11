import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * A custom React hook that maintains a WebSocket connection to the
 * server. Components can call sendMessage to send JSON strings and
 * receive updates on lastMessage when data is received. The hook
 * automatically reconnects if the connection drops.
 *
 * The WebSocket server endpoint defaults to ws://localhost:8080/ws.
 */
export default function useWebSocket(url = 'ws://localhost:8080/ws') {
  const socketRef = useRef(null);
  const [lastMessage, setLastMessage] = useState(null);
  const [isReady, setIsReady] = useState(false);

  // Establish the WebSocket connection on initial mount. If the
  // connection closes this effect will attempt to reconnect after a
  // short delay.
  useEffect(() => {
    let isMounted = true;

    function connect() {
      if (!isMounted) return;
      const ws = new WebSocket(url);
      socketRef.current = ws;

      ws.onopen = () => {
        if (isMounted) setIsReady(true);
        console.info('[WebSocket] Connected');
      };
      ws.onmessage = (event) => {
        if (isMounted) setLastMessage(event);
      };
      ws.onclose = () => {
        if (isMounted) setIsReady(false);
        console.warn('[WebSocket] Disconnected, retrying in 3s...');
        setTimeout(connect, 3000);
      };
      ws.onerror = (err) => {
        console.error('[WebSocket] Error:', err);
        ws.close();
      };
    }
    connect();

    return () => {
      isMounted = false;
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [url]);

  // Function to send a message through the WebSocket. If the socket
  // isn't ready the message will be discarded.
  const sendMessage = useCallback(
    (msg) => {
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.send(msg);
      } else {
        console.warn('[WebSocket] Tried to send message but socket not open');
      }
    },
    []
  );

  return { sendMessage, lastMessage, isReady };
}