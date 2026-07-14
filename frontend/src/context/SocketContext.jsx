import React, { createContext, useState, useEffect, useContext, useRef } from 'react';
import io from 'socket.io-client';
import { useAuth } from './AuthContext';
import axios from 'axios';

const SocketContext = createContext();

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

// Synthesize a clean, premium notification chime using Web Audio API (100% offline-ready, no files needed)
const playChime = () => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(880, ctx.currentTime); // High A note
    
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(1320, ctx.currentTime); // E note (harmonic)
    
    gainNode.gain.setValueAtTime(0.12, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
    
    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    osc1.start();
    osc2.start();
    osc1.stop(ctx.currentTime + 0.6);
    osc2.stop(ctx.currentTime + 0.6);
  } catch (e) {
    console.error("Audio chime error:", e);
  }
};

export const SocketProvider = ({ children }) => {
  const { token, user, API_URL } = useAuth();
  const [socket, setSocket] = useState(null);
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messagesCache, setMessagesCache] = useState({}); // Cache of chatId -> messages[]
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [chatsLoading, setChatsLoading] = useState(true);
  const [typingUsers, setTypingUsers] = useState({}); // chatId -> { userId: username }
  const [onlineUsers, setOnlineUsers] = useState({}); // userId -> { isOnline, lastSeen }

  // Use refs to prevent socket listeners from getting stale values when activeChat/chats change.
  const activeChatRef = useRef(activeChat);
  const chatsRef = useRef(chats);
  const userRef = useRef(user);

  useEffect(() => {
    activeChatRef.current = activeChat;
  }, [activeChat]);

  useEffect(() => {
    chatsRef.current = chats;
  }, [chats]);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  // Load user's conversations
  const fetchChats = async () => {
    if (!token) return;
    if (chatsRef.current.length === 0) {
      setChatsLoading(true);
    }
    try {
      const response = await axios.get(`${API_URL}/chats`);
      setChats(response.data);
    } catch (error) {
      console.error('Error fetching chats:', error);
    } finally {
      setChatsLoading(false);
    }
  };

  // Initialize Socket.IO connection (Runs once on boot/login, does not reconnect on chat switch)
  useEffect(() => {
    if (!token || !userRef.current) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    // Connect with JWT auth handshake token
    const newSocket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket'],
      reconnectionAttempts: 5
    });

    // Request desktop notification permission on login/dashboard load
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(err => console.error('Error requesting notification permission:', err));
    }

    newSocket.on('connect', () => {
      console.log('Socket.IO connection established locally.');
      fetchChats();
    });

    // Populate active online participants list
    newSocket.on('user_list', (usersMap) => {
      setOnlineUsers(usersMap);
      
      // Update in our chats list state to show live indicators
      setChats(prevChats => prevChats.map(c => {
        const updatedParticipants = c.participants.map(p => {
          if (usersMap[p._id]) {
            return { ...p, ...usersMap[p._id] };
          }
          return p;
        });
        return { ...c, participants: updatedParticipants };
      }));
    });

    // Listen for incoming messages
    newSocket.on('new_message', (msg) => {
      const currentUser = userRef.current;
      if (!currentUser) return;

      // If we are the recipient and this is from another user, send delivery receipt
      if (msg.senderId._id !== currentUser._id) {
        newSocket.emit('msg_delivered', { messageId: msg._id, chatId: msg.chatId });
      }

      // Check if it's the active chat using Ref
      const isFromSelf = msg.senderId._id === currentUser._id;
      const currentActiveChat = activeChatRef.current;
      const isActive = currentActiveChat && currentActiveChat._id === msg.chatId;

      // Play Chime sound & trigger push alert if from peer, not active, and chat is not muted
      if (!isFromSelf && (!isActive || document.hidden)) {
        const matchedChat = chatsRef.current.find(c => c._id === msg.chatId);
        const matchedSettings = matchedChat?.settings?.find(s => s.userId.toString() === currentUser._id.toString());
        const isMuted = matchedSettings ? matchedSettings.isMuted : false;
        if (!isMuted) {
          playChime();

          // Show push notification if permission granted
          if ('Notification' in window && Notification.permission === 'granted') {
            try {
              new Notification(msg.senderId.username, {
                body: msg.text,
                tag: msg.chatId, // Groups notification cards from same chat together
                renotify: true
              });
            } catch (err) {
              console.error('Failed to trigger notification:', err);
            }
          }
        }
      }

      if (isActive) {
        setMessages(prev => {
          if (prev.some(m => m._id === msg._id)) return prev;
          const next = [...prev, msg];
          // Update Cache
          setMessagesCache(cache => ({ ...cache, [msg.chatId]: next }));
          return next;
        });

        // If active, mark it as read immediately
        if (msg.senderId._id !== currentUser._id) {
          newSocket.emit('read_chat', { chatId: msg.chatId });
        }
      } else {
        // Update Cache in background
        setMessagesCache(cache => {
          const current = cache[msg.chatId] || [];
          if (current.some(m => m._id === msg._id)) return cache;
          return { ...cache, [msg.chatId]: [...current, msg] };
        });
      }

      // Update chats list lastMessage and unread count
      setChats(prevChats => {
        const updated = prevChats.map(c => {
          if (c._id === msg.chatId) {
            return {
              ...c,
              lastMessage: msg,
              unreadCount: (isActive || isFromSelf) ? c.unreadCount : (c.unreadCount + 1)
            };
          }
          return c;
        });

        // Sort by Pinned, then latest message time
        return [...updated].sort((a, b) => {
          const aSettings = a.settings?.find(s => s.userId.toString() === currentUser._id.toString());
          const bSettings = b.settings?.find(s => s.userId.toString() === currentUser._id.toString());
          const aPinned = aSettings ? aSettings.isPinned : false;
          const bPinned = bSettings ? bSettings.isPinned : false;

          if (aPinned && !bPinned) return -1;
          if (!aPinned && bPinned) return 1;

          const dateA = a.lastMessage ? new Date(a.lastMessage.createdAt) : new Date(a.createdAt);
          const dateB = b.lastMessage ? new Date(b.lastMessage.createdAt) : new Date(b.createdAt);
          return dateB - dateA;
        });
      });
    });

    // Listen for message status updates (e.g. sent -> delivered)
    newSocket.on('message_status_update', ({ messageId, status, chatId }) => {
      const currentActiveChat = activeChatRef.current;
      const currentUser = userRef.current;
      if (!currentUser) return;

      if (currentActiveChat && currentActiveChat._id === chatId) {
        setMessages(prev => {
          const next = prev.map(m => m._id === messageId ? { ...m, status } : m);
          setMessagesCache(cache => ({ ...cache, [chatId]: next }));
          return next;
        });
      } else {
        setMessagesCache(cache => {
          const current = cache[chatId] || [];
          const next = current.map(m => m._id === messageId ? { ...m, status } : m);
          return { ...cache, [chatId]: next };
        });
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
      const currentActiveChat = activeChatRef.current;
      const currentUser = userRef.current;
      if (!currentUser) return;

      if (readerId !== currentUser._id) {
        if (currentActiveChat && currentActiveChat._id === chatId) {
          setMessages(prev => {
            const next = prev.map(m => m.senderId._id === currentUser._id ? { ...m, status: 'read' } : m);
            setMessagesCache(cache => ({ ...cache, [chatId]: next }));
            return next;
          });
        } else {
          setMessagesCache(cache => {
            const current = cache[chatId] || [];
            const next = current.map(m => m.senderId._id === currentUser._id ? { ...m, status: 'read' } : m);
            return { ...cache, [chatId]: next };
          });
        }

        setChats(prevChats => prevChats.map(c => {
          if (c._id === chatId) {
            const updatedLast = c.lastMessage && c.lastMessage.senderId._id === currentUser._id
              ? { ...c.lastMessage, status: 'read' }
              : c.lastMessage;
            return {
              ...c,
              lastMessage: updatedLast,
              unreadCount: readerId === currentUser._id ? 0 : c.unreadCount
            };
          }
          return c;
        }));
      }
    });

    // Listen for bulk messages delivered status update
    newSocket.on('messages_status_delivered', ({ chatId, updaterId }) => {
      const currentActiveChat = activeChatRef.current;
      const currentUser = userRef.current;
      if (!currentUser) return;

      // If we are the sender of the 'sent' messages, mark them as 'delivered'
      if (updaterId !== currentUser._id) {
        if (currentActiveChat && currentActiveChat._id === chatId) {
          setMessages(prev => {
            const next = prev.map(m => m.senderId._id === currentUser._id && m.status === 'sent' ? { ...m, status: 'delivered' } : m);
            setMessagesCache(cache => ({ ...cache, [chatId]: next }));
            return next;
          });
        } else {
          setMessagesCache(cache => {
            const current = cache[chatId] || [];
            const next = current.map(m => m.senderId._id === currentUser._id && m.status === 'sent' ? { ...m, status: 'delivered' } : m);
            return { ...cache, [chatId]: next };
          });
        }

        setChats(prevChats => prevChats.map(c => {
          if (c._id === chatId && c.lastMessage && c.lastMessage.senderId._id === currentUser._id && c.lastMessage.status === 'sent') {
            return {
              ...c,
              lastMessage: { ...c.lastMessage, status: 'delivered' }
            };
          }
          return c;
        }));
      }
    });

    // Listen for typing events
    newSocket.on('user_typing', ({ chatId, username, userId }) => {
      const currentUser = userRef.current;
      if (!currentUser) return;

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

    // Listen for presence updates
    newSocket.on('presence_update', ({ userId, isOnline, lastSeen }) => {
      setOnlineUsers(prev => ({
        ...prev,
        [userId]: { isOnline, lastSeen }
      }));

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

    // Listen for message reactions updates
    newSocket.on('message_reaction_update', ({ messageId, chatId, reactions }) => {
      const currentActiveChat = activeChatRef.current;
      if (currentActiveChat && currentActiveChat._id === chatId) {
        setMessages(prev => {
          const next = prev.map(m => m._id === messageId ? { ...m, reactions } : m);
          setMessagesCache(cache => ({ ...cache, [chatId]: next }));
          return next;
        });
      } else {
        setMessagesCache(cache => {
          const current = cache[chatId] || [];
          const next = current.map(m => m._id === messageId ? { ...m, reactions } : m);
          return { ...cache, [chatId]: next };
        });
      }
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [token]);

  // Load message history when active chat changes (Cache-First strategy)
  useEffect(() => {
    const loadMessages = async () => {
      if (!activeChat || !token) return;
      
      const cached = messagesCache[activeChat._id];
      if (cached && cached.length > 0) {
        setMessages(cached);
        setMessagesLoading(false);
      } else {
        setMessages([]);
        setMessagesLoading(true);
      }

      try {
        const response = await axios.get(`${API_URL}/chats/${activeChat._id}/messages`);
        setMessages(response.data);
        
        // Populate cache
        setMessagesCache(prev => ({
          ...prev,
          [activeChat._id]: response.data
        }));

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
  }, [activeChat?._id, token]);

  // Notify socket that we opened/read this chat
  useEffect(() => {
    if (activeChat && socket) {
      socket.emit('read_chat', { chatId: activeChat._id });
    }
  }, [activeChat?._id, socket]);

  const sendMessage = (chatId, text, replyToId) => {
    if (!socket) return;
    socket.emit('send_message', { chatId, text, replyToId }, (response) => {
      if (response && response.success && response.message) {
        // Update messages state
        setMessages(prev => {
          if (prev.some(m => m._id === response.message._id)) return prev;
          const next = [...prev, response.message];
          setMessagesCache(cache => ({ ...cache, [chatId]: next }));
          return next;
        });

        // Update chats list lastMessage
        setChats(prevChats => prevChats.map(c => {
          if (c._id === chatId) {
            return { ...c, lastMessage: response.message };
          }
          return c;
        }));
      } else {
        alert(response?.error || 'Failed to send message');
      }
    });
  };

  const togglePinChat = async (chatId) => {
    try {
      const response = await axios.put(`${API_URL}/chats/${chatId}/pin`);
      
      // Update local settings in chats list
      setChats(prev => {
        const updated = prev.map(c => c._id === chatId ? { ...c, settings: response.data.settings } : c);
        
        // Re-sort chats by pinned status
        return [...updated].sort((a, b) => {
          const aSettings = a.settings?.find(s => s.userId.toString() === user._id.toString());
          const bSettings = b.settings?.find(s => s.userId.toString() === user._id.toString());
          const aPinned = aSettings ? aSettings.isPinned : false;
          const bPinned = bSettings ? bSettings.isPinned : false;

          if (aPinned && !bPinned) return -1;
          if (!aPinned && bPinned) return 1;

          const dateA = a.lastMessage ? new Date(a.lastMessage.createdAt) : new Date(a.createdAt);
          const dateB = b.lastMessage ? new Date(b.lastMessage.createdAt) : new Date(b.createdAt);
          return dateB - dateA;
        });
      });

      if (activeChat && activeChat._id === chatId) {
        setActiveChat(prev => ({ ...prev, settings: response.data.settings }));
      }
    } catch (err) {
      console.error('Failed to pin chat:', err);
    }
  };

  const toggleMuteChat = async (chatId) => {
    try {
      const response = await axios.put(`${API_URL}/chats/${chatId}/mute`);
      setChats(prev => prev.map(c => c._id === chatId ? { ...c, settings: response.data.settings } : c));
      if (activeChat && activeChat._id === chatId) {
        setActiveChat(prev => ({ ...prev, settings: response.data.settings }));
      }
    } catch (err) {
      console.error('Failed to mute chat:', err);
    }
  };

  const removeChat = async (chatId) => {
    try {
      await axios.delete(`${API_URL}/chats/${chatId}`);
      setChats(prev => prev.filter(c => c._id !== chatId));
      if (activeChat && activeChat._id === chatId) {
        setActiveChat(null);
      }
    } catch (err) {
      console.error('Failed to delete chat:', err);
    }
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
      togglePinChat,
      toggleMuteChat,
      removeChat,
      emitTyping,
      emitStopTyping,
      fetchChats
    }}>
      {children}
    </SocketContext.Provider>
  );
};

export { SocketContext };
export const useSocket = () => useContext(SocketContext);
