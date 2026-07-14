import React, { useState, useEffect, useRef } from 'react';
import { Send, Check, CheckCheck, MessageCircle, AlertCircle, Sparkles, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import UserAvatar from './UserAvatar';

const ChatWindow = () => {
  const { user } = useAuth();
  const {
    activeChat,
    setActiveChat,
    messages,
    sendMessage,
    emitTyping,
    emitStopTyping,
    typingUsers
  } = useSocket();

  const [inputText, setInputText] = useState('');
  const [isTypingLocal, setIsTypingLocal] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUsers]);

  // Clean up typing timeouts on chat switch
  useEffect(() => {
    setInputText('');
    setIsTypingLocal(false);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
  }, [activeChat?._id]);

  if (!activeChat) {
    return (
      <div className="flex-1 h-full flex flex-col items-center justify-center bg-bg-primary px-4 text-center transition-colors">
        <div className="p-4 rounded-sm bg-bg-secondary border border-border-custom mb-4 shadow-sm animate-pulse">
          <MessageCircle className="w-8 h-8 text-accent-custom" />
        </div>
        <h2 className="text-lg font-bold text-text-primary tracking-tight flex items-center gap-1.5 justify-center uppercase">
          ProtoChat Engine <Sparkles className="w-4 h-4 text-accent-custom" />
        </h2>
        <p className="text-xs text-text-muted tracking-wide max-w-xs mt-2 leading-relaxed uppercase">
          Select an active conversation or query the database to begin messaging instantly.
        </p>
      </div>
    );
  }

  const peer = activeChat.participants.find(p => p._id !== user._id);

  const formatLastSeen = (lastSeen) => {
    if (!lastSeen) return 'Offline';
    const date = new Date(lastSeen);
    const today = new Date();
    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (date.toDateString() === today.toDateString()) {
      return `last seen today at ${timeStr}`;
    }
    return `last seen ${date.toLocaleDateString([], { month: 'short', day: 'numeric' })} at ${timeStr}`;
  };

  const handleInputChange = (e) => {
    setInputText(e.target.value);

    // Emit typing status if not already typing
    if (!isTypingLocal && e.target.value.trim() !== '') {
      setIsTypingLocal(true);
      emitTyping(activeChat._id);
    }

    // Set stop typing timeout
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    
    typingTimeoutRef.current = setTimeout(() => {
      setIsTypingLocal(false);
      emitStopTyping(activeChat._id);
    }, 2000);
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    sendMessage(activeChat._id, inputText.trim());
    setInputText('');

    // Stop typing status instantly
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    setIsTypingLocal(false);
    emitStopTyping(activeChat._id);
  };

  // Check if peer is typing
  const isPeerTyping = typingUsers[activeChat._id] && 
                       Object.keys(typingUsers[activeChat._id]).some(uid => uid !== user._id);

  return (
    <div className="flex-1 h-full flex flex-col bg-bg-primary overflow-hidden transition-colors">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3.5 border-b border-border-custom bg-bg-secondary transition-colors">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => setActiveChat(null)}
            className="md:hidden p-1.5 rounded-sm hover:bg-bg-tertiary text-text-secondary hover:text-text-primary mr-1 flex-shrink-0 cursor-pointer"
            title="Back to chats"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <UserAvatar username={peer?.username} isOnline={peer?.isOnline} />
          <div className="min-w-0">
            <h3 className="font-bold text-xs tracking-wide text-text-primary truncate">{peer?.username}</h3>
            <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider block truncate mt-0.5">
              {peer?.isOnline ? (
                <span className="text-emerald-600">Active now</span>
              ) : (
                formatLastSeen(peer?.lastSeen)
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Message Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-bg-primary transition-colors">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-text-muted">
            <AlertCircle className="w-5 h-5 opacity-30 mb-1" />
            <p className="text-[10px] uppercase tracking-wider font-bold">No message history</p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isSelf = msg.senderId._id === user._id;
            const time = new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            return (
              <div
                key={msg._id || index}
                className={`flex w-full ${isSelf ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] rounded-sm px-4 py-2.5 shadow-sm flex flex-col relative border ${
                    isSelf
                      ? 'bg-bubble-self text-bubble-self-text border-accent-custom border-opacity-10 rounded-tr-none'
                      : 'bg-bg-secondary text-text-primary border-border-custom rounded-tl-none'
                  }`}
                >
                  <p className="text-sm break-words leading-relaxed pr-6 font-medium">{msg.text}</p>
                  
                  {/* Footer metadata inside bubble */}
                  <div className={`flex items-center gap-1 self-end mt-1 text-[9px] font-bold uppercase tracking-wider ${
                    isSelf ? 'text-bubble-self-text opacity-70' : 'text-text-muted'
                  }`}>
                    <span>{time}</span>
                    {isSelf && (
                      <span className="inline-block">
                        {msg.status === 'sent' && (
                          <Check className="w-3 h-3 text-current opacity-65" />
                        )}
                        {msg.status === 'delivered' && (
                          <CheckCheck className="w-3.5 h-3.5 text-current opacity-85" />
                        )}
                        {msg.status === 'read' && (
                          <CheckCheck className="w-3.5 h-3.5 text-current" />
                        )}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        
        {/* Peer Typing Indicator Bubble */}
        {isPeerTyping && (
          <div className="flex w-full justify-start animate-pulse">
            <div className="bg-bg-secondary text-text-muted text-[11px] rounded-sm rounded-tl-none px-4 py-2.5 flex items-center gap-2 border border-border-custom shadow-sm">
              <span className="font-bold text-text-primary uppercase tracking-wide">{peer?.username}</span> is typing
              <span className="flex gap-0.5">
                <span className="h-1 w-1 bg-text-muted rounded-full animate-bounce [animation-delay:-0.3s]" />
                <span className="h-1 w-1 bg-text-muted rounded-full animate-bounce [animation-delay:-0.15s]" />
                <span className="h-1 w-1 bg-text-muted rounded-full animate-bounce" />
              </span>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <form onSubmit={handleSend} className="p-4 border-t border-border-custom bg-bg-secondary transition-colors">
        <div className="flex gap-3 items-center">
          <input
            type="text"
            placeholder="Type a message..."
            value={inputText}
            onChange={handleInputChange}
            className="flex-1 bg-bg-primary border border-border-custom focus:border-accent-custom rounded-sm py-3 px-4 text-xs font-medium text-text-primary placeholder-text-muted outline-none transition-all"
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="py-3 px-5 bg-black hover:bg-neutral-900 disabled:bg-bg-tertiary text-white disabled:text-text-muted font-bold text-xs uppercase tracking-widest rounded-sm shadow-sm transition-all hover:scale-102 active:scale-98 cursor-pointer border border-transparent disabled:border-border-custom"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatWindow;
