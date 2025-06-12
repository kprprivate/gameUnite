import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import io from 'socket.io-client';

const useWebSocket = () => {
  const { user, isAuthenticated } = useAuth();
  const socketRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  const connect = useCallback(() => {
    if (!isAuthenticated || !user?.access_token) {
      return;
    }

    try {
      // Create socket connection
      socketRef.current = io(process.env.REACT_APP_WEBSOCKET_URL || 'http://localhost:5000', {
        auth: {
          token: user.access_token
        },
        transports: ['websocket', 'polling'],
        timeout: 20000,
        forceNew: true
      });

      const socket = socketRef.current;

      // Connection events
      socket.on('connect', () => {
        console.log('WebSocket connected');
        reconnectAttempts.current = 0;
        
        // Join user's personal room for notifications
        if (user?._id) {
          socket.emit('join_user_room', { user_id: user._id });
        }
      });

      socket.on('disconnect', (reason) => {
        console.log('WebSocket disconnected:', reason);
        
        // Auto-reconnect for certain disconnect reasons
        if (reason === 'io server disconnect' || reason === 'transport close') {
          // Server initiated disconnect, try to reconnect
          attemptReconnect();
        }
      });

      socket.on('connect_error', (error) => {
        console.error('WebSocket connection error:', error);
        attemptReconnect();
      });

      // Authentication events
      socket.on('auth_error', (data) => {
        console.error('WebSocket auth error:', data);
        disconnect();
      });

      socket.on('error', (error) => {
        console.error('WebSocket error:', error);
      });

      return socket;

    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
      return null;
    }
  }, [isAuthenticated, user]);

  const attemptReconnect = useCallback(() => {
    if (reconnectAttempts.current >= maxReconnectAttempts) {
      console.log('Max reconnection attempts reached');
      return;
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    const delay = Math.pow(2, reconnectAttempts.current) * 1000; // Exponential backoff
    reconnectAttempts.current += 1;

    console.log(`Attempting to reconnect in ${delay}ms (attempt ${reconnectAttempts.current})`);
    
    reconnectTimeoutRef.current = setTimeout(() => {
      if (isAuthenticated) {
        disconnect();
        connect();
      }
    }, delay);
  }, [isAuthenticated, connect]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
  }, []);

  const emit = useCallback((event, data) => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit(event, data);
      return true;
    }
    return false;
  }, []);

  const on = useCallback((event, callback) => {
    if (socketRef.current) {
      socketRef.current.on(event, callback);
      
      // Return cleanup function
      return () => {
        if (socketRef.current) {
          socketRef.current.off(event, callback);
        }
      };
    }
    return () => {};
  }, []);

  const off = useCallback((event, callback) => {
    if (socketRef.current) {
      socketRef.current.off(event, callback);
    }
  }, []);

  // Connect when authenticated, disconnect when not
  useEffect(() => {
    if (isAuthenticated && user) {
      connect();
    } else {
      disconnect();
    }

    // Cleanup on unmount
    return () => {
      disconnect();
    };
  }, [isAuthenticated, user, connect, disconnect]);

  return {
    socket: socketRef.current,
    isConnected: socketRef.current?.connected || false,
    emit,
    on,
    off,
    reconnect: () => {
      disconnect();
      connect();
    }
  };
};

export default useWebSocket;