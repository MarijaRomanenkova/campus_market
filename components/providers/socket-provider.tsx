'use client';

/**
 * Socket.IO Provider Component
 * @module Components/Providers
 * 
 * This component provides real-time WebSocket connectivity via Socket.IO
 * throughout the application, enabling real-time features such as chat
 * and notifications.
 */

import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useSession } from 'next-auth/react';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { getUnreadMessageCount } from '@/lib/actions/messages.actions';

/**
 * Socket Context Type Definition
 * @interface SocketContextType
 * @property {Socket|null} socket - The Socket.IO client instance or null if not connected
 * @property {boolean} isConnected - Whether the socket is currently connected
 * @property {number} unreadCount - The count of unread messages
 * @property {function} incrementUnreadCount - Function to increment the unread count
 * @property {function} decrementUnreadCount - Function to decrement the unread count
 * @property {function} resetUnreadCount - Function to reset the unread count
 * @property {function} initializeSocket - Function to initialize the socket
 */
interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  unreadCount: number;
  incrementUnreadCount: () => void;
  decrementUnreadCount: () => void;
  resetUnreadCount: () => void;
  initializeSocket: () => Promise<void>;
}

interface SocketProviderProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  userId: string;
  conversationId: string;
}

/**
 * Socket Context
 * Provides socket instance and connection status to child components
 */
const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  unreadCount: 0,
  incrementUnreadCount: () => {},
  decrementUnreadCount: () => {},
  resetUnreadCount: () => {},
  initializeSocket: async () => {}
});

/**
 * Custom hook to access the Socket context
 * @returns {SocketContextType} Socket context with socket instance and connection status
 */
export const useSocket = () => {
  return useContext(SocketContext);
};

class SocketErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Socket Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Chat Service Unavailable</AlertTitle>
          <AlertDescription>
            The chat service is currently unavailable. You can still use other features of the application.
            Please try again later.
          </AlertDescription>
        </Alert>
      );
    }

    return this.props.children;
  }
}

/**
 * SocketProvider Component
 * 
 * Establishes and manages Socket.IO connection with features like:
 * - Automatic reconnection with configurable attempts
 * - Connection status tracking
 * - Error handling for connection issues
 * - Cleanup on unmount
 * 
 * @param {Object} props - Component properties
 * @param {React.ReactNode} props.children - Child components to be wrapped
 * @param {React.ReactNode} props.fallback - Fallback component to be rendered if not connected
 * @param {string} props.userId - The user ID for authentication
 * @param {string} props.conversationId - The conversation ID for authentication
 * @returns {JSX.Element} The SocketContext.Provider with children
 */
export const SocketProvider: React.FC<SocketProviderProps> = ({
  children,
  fallback,
  userId,
  conversationId
}) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const socketRef = useRef<Socket | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout>();
  const messageStatus = useRef(new Map<string, boolean>());
  const { data: session } = useSession();
  const [error, setError] = useState<string | null>(null);

  const incrementUnreadCount = () => setUnreadCount(prev => prev + 1);
  const decrementUnreadCount = () => setUnreadCount(prev => Math.max(0, prev - 1));
  const resetUnreadCount = () => setUnreadCount(0);

  const fetchUnreadCount = async () => {
    try {
      const count = await getUnreadMessageCount();
      setUnreadCount(count);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  // Add session state logging
  useEffect(() => {
    if (session?.user?.id) {
      // Fetch initial unread count after authentication
      fetchUnreadCount();
    }
  }, [session?.user?.id]);

  useEffect(() => {
    const initializeSocket = async () => {
      if (!session?.user?.id || socketRef.current?.connected) {
        return;
      }

      let socketToken: string | undefined;
      try {
        // Fetch socket token first
        const tokenResponse = await fetch('/api/auth/socket-token');
        if (!tokenResponse.ok) {
          console.error('Failed to fetch socket token:', await tokenResponse.text());
          return;
        }
        const { token } = await tokenResponse.json();
        socketToken = token;

        // Check server health first
        const healthResponse = await fetch(`${process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001'}/socket-health`);
        const healthData = await healthResponse.json();
        
        if (healthData.status !== 'ok') {
          console.error('Socket server not ready:', healthData);
          setIsConnected(false);
          return;
        }

        // Clear any existing retry timeout
        if (retryTimeoutRef.current) {
          clearTimeout(retryTimeoutRef.current);
        }

        // Disconnect existing socket if any
        if (socketRef.current?.connected) {
          socketRef.current.disconnect();
        }

        const socketInstance = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001', {
          path: '/socket.io',
          addTrailingSlash: false,
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
          transports: ['polling', 'websocket'],
          autoConnect: false,
          withCredentials: true,
          timeout: 20000,
          forceNew: true,
          auth: {
            token: socketToken,
            userId: userId,
            conversationId: conversationId
          }
        });

        socketInstance.on('connect', () => {
          setIsConnected(true);
          if (retryTimeoutRef.current) {
            clearTimeout(retryTimeoutRef.current);
            retryTimeoutRef.current = undefined;
          }
        });

        socketInstance.on('disconnect', (reason) => {
          setIsConnected(false);
          retryTimeoutRef.current = setTimeout(() => {
            socketInstance.connect();
          }, 2000);
        });

        socketInstance.on('connect_error', (err) => {
          console.error('Socket connection error:', err.message);
          setIsConnected(false);
          const maxAttempts = socketInstance.io.opts.reconnectionAttempts || 5;
          if (socketInstance.io.reconnectionAttempts() < maxAttempts) {
            retryTimeoutRef.current = setTimeout(() => {
              socketInstance.connect();
            }, 2000);
          } else {
            console.error('Max reconnection attempts reached');
          }
        });

        socketInstance.on('error', (error) => {
          console.error('Socket error:', error);
        });

        socketRef.current = socketInstance;
        setSocket(socketInstance);
        socketInstance.connect();
      } catch (error) {
        console.error('Failed to initialize socket:', error);
        setIsConnected(false);
      }
    };

    // Only initialize socket if we have a conversation ID
    if (conversationId) {
      initializeSocket();
    }

    return () => {
      if (socketRef.current?.connected) {
        socketRef.current.disconnect();
      }
    };
  }, [session?.user?.id, userId, conversationId]);

  if (!isConnected && fallback) {
    return <>{fallback}</>;
  }

  return (
    <SocketErrorBoundary>
      <SocketContext.Provider value={{
        socket,
        isConnected,
        unreadCount,
        incrementUnreadCount,
        decrementUnreadCount,
        resetUnreadCount,
        initializeSocket: async () => {
          if (socketRef.current) {
            socketRef.current.connect();
          }
        }
      }}>
        {children}
      </SocketContext.Provider>
    </SocketErrorBoundary>
  );
}; 
