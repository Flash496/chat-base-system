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
      <div className="flex-1 h-full flex flex-col items-center justify-center bg-slate-900 bg-opacity-40 px-4 text-center">
        <div className="p-4 rounded-full bg-slate-800 bg-opacity-40 border border-slate-800 mb-4 animate-pulse">
          <MessageCircle className="w-10 h-10 text-brand-400" />
        </div>
        <h2 className="text-xl font-bold text-white flex items-center gap-1.5 justify-center">
          Instant Chat Engine <Sparkles className="w-4 h-4 text-brand-400" />
        </h2>
        <p className="text-sm text-slate-500 max-w-sm mt-1">
          Select an active conversation or search for a contact using the directory to begin messaging instantly.
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
    <div className="flex-1 h-full flex flex-col bg-slate-900 bg-opacity-25 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-900 bg-slate-950 bg-opacity-40">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => setActiveChat(null)}
            className="md:hidden p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white mr-1 flex-shrink-0"
            title="Back to chats"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <UserAvatar username={peer?.username} isOnline={peer?.isOnline} />
          <div className="min-w-0">
            <h3 className="font-semibold text-sm text-white truncate">{peer?.username}</h3>
            <span className="text-[11px] text-slate-500 block truncate">
              {peer?.isOnline ? (
                <span className="text-emerald-400 font-medium">Active now</span>
              ) : (
                formatLastSeen(peer?.lastSeen)
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Message Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-600">
            <AlertCircle className="w-6 h-6 opacity-30 mb-1" />
            <p className="text-xs">No message history yet. Send a message to start conversation.</p>
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
                  className={`max-w-[70%] rounded-2xl px-4 py-2.5 shadow-md flex flex-col relative transition-all ${
                    isSelf
                      ? 'bg-brand-600 text-white rounded-tr-none'
                      : 'bg-slate-800 text-slate-200 rounded-tl-none'
                  }`}
                >
                  <p className="text-sm break-words leading-relaxed pr-6">{msg.text}</p>
                  
                  {/* Footer metadata inside bubble */}
                  <div className="flex items-center gap-1 self-end mt-1 text-[9px] text-slate-300 opacity-75">
                    <span>{time}</span>
                    {isSelf && (
                      <span className="inline-block">
                        {msg.status === 'sent' && (
                          <Check className="w-3 h-3 text-slate-400" />
                        )}
                        {msg.status === 'delivered' && (
                          <CheckCheck className="w-3.5 h-3.5 text-slate-300" />
                        )}
                        {msg.status === 'read' && (
                          <CheckCheck className="w-3.5 h-3.5 text-sky-300" />
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
            <div className="bg-slate-800 text-slate-400 text-xs rounded-2xl rounded-tl-none px-4 py-2.5 flex items-center gap-2">
              <span className="font-semibold text-slate-300">{peer?.username}</span> is typing
              <span className="flex gap-1">
                <span className="h-1.5 w-1.5 bg-slate-400 rounded-full animate-bounce delay-75" />
                <span className="h-1.5 w-1.5 bg-slate-400 rounded-full animate-bounce delay-150" />
                <span className="h-1.5 w-1.5 bg-slate-400 rounded-full animate-bounce delay-300" />
              </span>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <form onSubmit={handleSend} className="p-4 border-t border-slate-900 bg-slate-950 bg-opacity-40">
        <div className="flex gap-3 items-center">
          <input
            type="text"
            placeholder="Type a message..."
            value={inputText}
            onChange={handleInputChange}
            className="flex-1 bg-slate-900 border border-slate-800 focus:border-brand-500 rounded-xl py-3 px-4 text-sm text-slate-200 placeholder-slate-500 outline-none transition-all"
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="p-3 bg-brand-600 hover:bg-brand-500 disabled:bg-slate-800 text-white rounded-xl shadow-md transition-all hover:scale-105 active:scale-95"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatWindow;
