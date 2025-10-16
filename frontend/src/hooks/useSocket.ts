// Socket.IO custom hook for managing WebSocket connections

import { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';
import { SocketEvents } from '../types';

interface UseSocketOptions {
  serverUrl?: string;
  autoConnect?: boolean;
}

interface UseSocketReturn {
  socket: any | null;
  isConnected: boolean;
  error: string | null;
  connect: () => void;
  disconnect: () => void;
  emit: <K extends keyof SocketEvents>(event: K, data?: Parameters<SocketEvents[K]>[0]) => void;
  on: <K extends keyof SocketEvents>(event: K, handler: SocketEvents[K]) => void;
  off: <K extends keyof SocketEvents>(event: K, handler?: SocketEvents[K]) => void;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const DEFAULT_SERVER_URL = 'ws://localhost:3001';

export const useSocket = (options: UseSocketOptions): UseSocketReturn => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { serverUrl, autoConnect } = options;
  
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<any | null>(null);

  const connect = () => {
    if (socketRef.current?.connected) {
      return;
    }

    try {
      const newSocket = io(serverUrl || 'http://localhost:3001', {
        transports: ['websocket', 'polling'],
        timeout: 20000,
      });

      newSocket.on('connect', () => {
        console.log('Connected to server:', newSocket.id);
        setIsConnected(true);
        setError(null);
      });

      newSocket.on('disconnect', (reason: string) => {
        console.log('Disconnected from server:', reason);
        setIsConnected(false);
        if (reason === 'io server disconnect') {
          // Server disconnected the client, need to reconnect manually
          setTimeout(() => connect(), 1000);
        }
      });

      newSocket.on('connect_error', (err: any) => {
        console.error('Connection error:', err);
        setError(`Connection failed: ${err.message || err}`);
        setIsConnected(false);
      });

      newSocket.on('error', (err: any) => {
        console.error('Socket error:', err);
        setError(`Socket error: ${err.message || err}`);
      });

      socketRef.current = newSocket;
    } catch (err) {
      console.error('Failed to create socket connection:', err);
      setError('Failed to create socket connection');
    }
  };

  const disconnect = () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    }
  };

  const emit = <K extends keyof SocketEvents>(
    event: K, 
    data?: Parameters<SocketEvents[K]>[0]
  ) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event as string, data);
    } else {
      console.warn(`Cannot emit ${String(event)}: Socket not connected`);
    }
  };

  const on = <K extends keyof SocketEvents>(event: K, handler: SocketEvents[K]) => {
    if (socketRef.current) {
      socketRef.current.on(event as string, handler as any);
    }
  };

  const off = <K extends keyof SocketEvents>(event: K, handler?: SocketEvents[K]) => {
    if (socketRef.current) {
      if (handler) {
        socketRef.current.off(event as string, handler as any);
      } else {
        socketRef.current.off(event as string);
      }
    }
  };

  useEffect(() => {
    if (options.autoConnect) {
      connect();
    }

    return () => {
      disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options.autoConnect]);

  return {
    socket: socketRef.current,
    isConnected,
    error,
    connect,
    disconnect,
    emit,
    on,
    off,
  };
};