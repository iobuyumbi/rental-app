import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import socketService from '@/lib/socket';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const { user, token } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [notifications, setNotifications] = useState([]);

  // Connect to socket when user is authenticated
  useEffect(() => {
    if (user && token) {
      socketService.connect(token);
      
      // Set up connection status listener
      const unsubscribeConnection = socketService.on('connection_status', ({ connected }) => {
        setIsConnected(connected);
        if (connected) {
          toast.success('Connected to real-time updates');
        } else {
          toast.error('Disconnected from real-time updates');
        }
      });

      // Set up notification listener
      const unsubscribeNotifications = socketService.on('notification', (notification) => {
        setNotifications(prev => [notification, ...prev]);
        
        // Show toast notification
        const toastOptions = {
          duration: 5000,
          action: {
            label: 'View',
            onClick: () => {
              // Navigate to notifications page
              window.location.href = '/notifications';
            }
          }
        };

        switch (notification.type) {
          case 'success':
            toast.success(notification.message, toastOptions);
            break;
          case 'warning':
            toast.warning(notification.message, toastOptions);
            break;
          case 'error':
            toast.error(notification.message, toastOptions);
            break;
          default:
            toast.info(notification.message, toastOptions);
        }
      });

      // Set up online users listener
      const unsubscribeUserOnline = socketService.on('user_online', (userData) => {
        setOnlineUsers(prev => {
          const filtered = prev.filter(u => u.id !== userData.id);
          return [...filtered, userData];
        });
      });

      const unsubscribeUserOffline = socketService.on('user_offline', (userData) => {
        setOnlineUsers(prev => prev.filter(u => u.id !== userData.id));
      });

      // Set up system alerts
      const unsubscribeSystemAlert = socketService.on('system_alert', (alert) => {
        toast.error(alert.message, {
          duration: 10000,
          important: true
        });
      });

      return () => {
        unsubscribeConnection();
        unsubscribeNotifications();
        unsubscribeUserOnline();
        unsubscribeUserOffline();
        unsubscribeSystemAlert();
      };
    } else {
      socketService.disconnect();
      setIsConnected(false);
      setOnlineUsers([]);
      setNotifications([]);
    }
  }, [user, token]);

  // Real-time data update handlers
  const subscribeToDataUpdates = useCallback((callbacks) => {
    const unsubscribers = [];

    if (callbacks.onMemberUpdate) {
      unsubscribers.push(
        socketService.on('member_updated', callbacks.onMemberUpdate)
      );
    }

    if (callbacks.onLoanUpdate) {
      unsubscribers.push(
        socketService.on('loan_updated', callbacks.onLoanUpdate)
      );
    }

    if (callbacks.onTransactionCreate) {
      unsubscribers.push(
        socketService.on('transaction_created', callbacks.onTransactionCreate)
      );
    }

    if (callbacks.onSavingsUpdate) {
      unsubscribers.push(
        socketService.on('savings_updated', callbacks.onSavingsUpdate)
      );
    }

    if (callbacks.onMeetingReminder) {
      unsubscribers.push(
        socketService.on('meeting_reminder', callbacks.onMeetingReminder)
      );
    }

    // Return cleanup function
    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe());
    };
  }, []);

  // Send real-time updates
  const sendUpdate = useCallback((event, data) => {
    socketService.send(event, data);
  }, []);

  // Join/leave rooms for targeted updates
  const joinRoom = useCallback((room) => {
    socketService.joinRoom(room);
  }, []);

  const leaveRoom = useCallback((room) => {
    socketService.leaveRoom(room);
  }, []);

  // Typing indicators
  const startTyping = useCallback((room) => {
    socketService.startTyping(room);
  }, []);

  const stopTyping = useCallback((room) => {
    socketService.stopTyping(room);
  }, []);

  // Update user status
  const updateStatus = useCallback((status) => {
    socketService.updateStatus(status);
  }, []);

  // Clear notifications
  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Mark notification as read
  const markNotificationAsRead = useCallback((notificationId) => {
    setNotifications(prev => 
      prev.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      )
    );
  }, []);

  const value = {
    isConnected,
    onlineUsers,
    notifications,
    subscribeToDataUpdates,
    sendUpdate,
    joinRoom,
    leaveRoom,
    startTyping,
    stopTyping,
    updateStatus,
    clearNotifications,
    markNotificationAsRead,
    socket: socketService
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};
