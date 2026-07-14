import React, { createContext, useState, useEffect, useContext } from 'react';
import io from 'socket.io-client';
import { useAuth } from './AuthContext';
import axios from 'axios';

const SocketContext = createContext();

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export const SocketProvider = ({ children }) => {
  const { token, user, API_URL } = useAuth();
  const [socket, setSocket] = useState(null);
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [chatsLoading, setChatsLoading] = useState(true);
  const [typingUsers, setTypingUsers] = useState({}); // chatId -> { userId: username }
  const [onlineUsers, setOnlineUsers] = useState({}); // userId -> { isOnline, lastSeen }

  // Load user's conversations
  const fetchChats = async () => {
    if (!token) return;
    setChatsLoading(true);
    try {
      const response = await axios.get(`${API_URL}/chats`);
      setChats(response.data);
    } catch (error) {
      console.error('Error fetching chats:', error);
    } finally {
      setChatsLoading(false);
    }
  };

  // Initialize Socket.IO connection
  useEffect(() => {
    if (!token || !user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    const newSocket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000
    });

    newSocket.on('connect', () => {
      console.log('Connected to socket server');
      fetchChats();
    });

    newSocket.on('connect_error', (err) => {
      console.error('Socket connection error:', err);
    });

    // Listen for presence updates
    newSocket.on('presence_update', ({ userId, isOnline, lastSeen }) => {
      setOnlineUsers(prev => ({
        ...prev,
        [userId]: { isOnline, lastSeen }
      }));

      // Update in our chats list state to show live indicators
      setChats(prevChats => prevChats.map(c => {
        const updatedParticipants = c.participants.map(p => {
          if (p._id === userId) {
            return { ...p, isOnline, lastSeen };
          }
          return p;
        });
        return { ...c, participants: updatedParticipants };
      }));
    });

    // Listen for incoming messages
    newSocket.on('new_message', (msg) => {
      // If we are the recipient and this is from another user, send delivery receipt
      if (msg.senderId._id !== user._id) {
        newSocket.emit('msg_delivered', { messageId: msg._id, chatId: msg.chatId });
      }

      // Check if it's the active chat
      if (activeChat && activeChat._id === msg.chatId) {
        setMessages(prev => {
          // Prevent duplicates
          if (prev.some(m => m._id === msg._id)) return prev;
          return [...prev, msg];
        });

        // If active, mark it as read immediately
        if (msg.senderId._id !== user._id) {
          newSocket.emit('read_chat', { chatId: msg.chatId });
        }
      }

      // Update chats list lastMessage and unread count
      setChats(prevChats => {
        return prevChats.map(c => {
          if (c._id === msg.chatId) {
            const isFromSelf = msg.senderId._id === user._id;
            const isActive = activeChat && activeChat._id === msg.chatId;
            return {
              ...c,
              lastMessage: msg,
              unreadCount: (isActive || isFromSelf) ? c.unreadCount : (c.unreadCount + 1)
            };
          }
          return c;
        });
      });
    });

    // Listen for message status updates (e.g. sent -> delivered)
    newSocket.on('message_status_update', ({ messageId, status, chatId }) => {
      if (activeChat && activeChat._id === chatId) {
        setMessages(prev => prev.map(m => m._id === messageId ? { ...m, status } : m));
      }
      setChats(prevChats => prevChats.map(c => {
        if (c._id === chatId && c.lastMessage && c.lastMessage._id === messageId) {
          return {
            ...c,
            lastMessage: { ...c.lastMessage, status }
          };
        }
        return c;
      }));
    });

    // Listen for chat read notifications
    newSocket.on('chat_read', ({ chatId, readerId }) => {
      // If the reader is the other person, mark all our sent messages in this chat as read
      if (readerId !== user._id) {
        if (activeChat && activeChat._id === chatId) {
          setMessages(prev => prev.map(m => m.senderId._id === user._id ? { ...m, status: 'read' } : m));
        }
        setChats(prevChats => prevChats.map(c => {
          if (c._id === chatId) {
            const updatedLast = c.lastMessage && c.lastMessage.senderId._id === user._id
              ? { ...c.lastMessage, status: 'read' }
              : c.lastMessage;
            return {
              ...c,
              lastMessage: updatedLast,
              unreadCount: readerId === user._id ? 0 : c.unreadCount
            };
          }
          return c;
        }));
      }
    });

    // Listen for reactions updates
    newSocket.on('message_reaction_update', ({ messageId, chatId, reactions }) => {
      if (activeChat && activeChat._id === chatId) {
        setMessages(prev => prev.map(m => m._id === messageId ? { ...m, reactions } : m));
      }
    });

    // Listen for typing events
    newSocket.on('user_typing', ({ chatId, username, userId }) => {
      setTypingUsers(prev => ({
        ...prev,
        [chatId]: { ...(prev[chatId] || {}), [userId]: username }
      }));
    });

    newSocket.on('user_stop_typing', ({ chatId, userId }) => {
      setTypingUsers(prev => {
        const next = { ...prev };
        if (next[chatId]) {
          delete next[chatId][userId];
          if (Object.keys(next[chatId]).length === 0) {
            delete next[chatId];
          }
        }
        return next;
      });
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [token, user, activeChat?._id]);

  // Load message history when active chat changes
  useEffect(() => {
    const loadMessages = async () => {
      if (!activeChat || !token) return;
      setMessagesLoading(true);
      try {
        const response = await axios.get(`${API_URL}/chats/${activeChat._id}/messages`);
        setMessages(response.data);

        // Notify that we opened/read this chat
        if (socket) {
          socket.emit('read_chat', { chatId: activeChat._id });
        }

        // Reset unread count locally for this chat
        setChats(prevChats => prevChats.map(c => {
          if (c._id === activeChat._id) {
            return { ...c, unreadCount: 0 };
          }
          return c;
        }));
      } catch (error) {
        console.error('Error loading messages:', error);
      } finally {
        setMessagesLoading(false);
      }
    };
    loadMessages();
  }, [activeChat?._id, token, socket]);

  const sendMessage = (chatId, text) => {
    if (!socket) return;
    socket.emit('send_message', { chatId, text }, (response) => {
      if (response && response.success && response.message) {
        // Optimistically update message if it wasn't caught by the general listener yet
        setMessages(prev => {
          if (prev.some(m => m._id === response.message._id)) return prev;
          return [...prev, response.message];
        });

        // Update chats list lastMessage
        setChats(prevChats => prevChats.map(c => {
          if (c._id === chatId) {
            return { ...c, lastMessage: response.message };
          }
          return c;
        }));
      } else {
        console.error('Error sending message via callback:', response?.error);
      }
    });
  };

  const emitTyping = (chatId) => {
    if (socket) socket.emit('typing', { chatId });
  };

  const emitStopTyping = (chatId) => {
    if (socket) socket.emit('stop_typing', { chatId });
  };

  const reactToMessage = (messageId, chatId, emoji) => {
    if (socket) socket.emit('react_message', { messageId, chatId, emoji });
  };

  return (
    <SocketContext.Provider value={{
      socket,
      chats,
      setChats,
      activeChat,
      setActiveChat,
      messages,
      messagesLoading,
      chatsLoading,
      typingUsers,
      onlineUsers,
      sendMessage,
      reactToMessage,
      emitTyping,
      emitStopTyping,
      fetchChats
    }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
export default SocketContext;
