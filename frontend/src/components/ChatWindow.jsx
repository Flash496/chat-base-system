import React, { useState, useEffect, useRef } from 'react';
import { Send, Check, CheckCheck, MessageCircle, AlertCircle, Sparkles, ArrowLeft, X, CornerUpLeft, Ban, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import UserAvatar from './UserAvatar';

const ChatWindow = () => {
  const { user, blockUser, unblockUser } = useAuth();
  const {
    chats,
    activeChat,
    setActiveChat,
    messages,
    messagesLoading,
    typingUsers,
    onlineUsers,
    sendMessage,
    reactToMessage
  } = useSocket();

  const [inputText, setInputText] = useState('');
  const [isTypingLocal, setIsTypingLocal] = useState(false);
  const [activeMenuMsgId, setActiveMenuMsgId] = useState(null);
  const [forwardingMsg, setForwardingMsg] = useState(null);
  const [replyingToMsg, setReplyingToMsg] = useState(null);
  const [toast, setToast] = useState('');
  
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUsers]);

  // Clean up states on chat switch
  useEffect(() => {
    setInputText('');
    setIsTypingLocal(false);
    setActiveMenuMsgId(null);
    setForwardingMsg(null);
    setReplyingToMsg(null);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
  }, [activeChat?._id]);

  // Click outside to close message options menu
  useEffect(() => {
    const handleGlobalClick = (e) => {
      if (activeMenuMsgId && !e.target.closest('.message-bubble-wrapper')) {
        setActiveMenuMsgId(null);
      }
    };
    document.addEventListener('mousedown', handleGlobalClick);
    return () => {
      document.removeEventListener('mousedown', handleGlobalClick);
    };
  }, [activeMenuMsgId]);

  const showToast = (text) => {
    setToast(text);
    setTimeout(() => {
      setToast('');
    }, 2500);
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    showToast('Copied to clipboard');
    setActiveMenuMsgId(null);
  };

  const handleForwardClick = (msg) => {
    setForwardingMsg(msg);
    setActiveMenuMsgId(null);
  };

  const handleForward = (chatId, recipientName) => {
    if (!forwardingMsg) return;
    sendMessage(chatId, forwardingMsg.text);
    setForwardingMsg(null);
    showToast(`Forwarded to ${recipientName}`);
  };

  const handleReaction = (messageId, emoji) => {
    reactToMessage(messageId, activeChat._id, emoji);
    setActiveMenuMsgId(null);
  };

  const handleReplyClick = (msg) => {
    setReplyingToMsg(msg);
    setActiveMenuMsgId(null);
  };

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
  
  // Track accurate live online presence state from SocketContext mapping
  const livePresence = onlineUsers[peer?._id];
  const isOnline = livePresence ? livePresence.isOnline : peer?.isOnline;
  const lastSeen = livePresence ? livePresence.lastSeen : peer?.lastSeen;

  // Block states
  const isPeerBlocked = user?.blockedUsers?.includes(peer?._id);

  const handleBlockToggle = async () => {
    if (isPeerBlocked) {
      const res = await unblockUser(peer._id);
      if (res.success) {
        showToast(`Unblocked ${peer.username}`);
      } else {
        alert(res.message);
      }
    } else {
      if (confirm(`Block ${peer.username}? You will not receive any further messages from them.`)) {
        const res = await blockUser(peer._id);
        if (res.success) {
          showToast(`Blocked ${peer.username}`);
        } else {
          alert(res.message);
        }
      }
    }
  };

  const formatLastSeen = (lastSeenTime) => {
    if (!lastSeenTime) return 'Offline';
    const date = new Date(lastSeenTime);
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

    sendMessage(activeChat._id, inputText.trim(), replyingToMsg?._id);
    setInputText('');
    setReplyingToMsg(null);

    // Stop typing status instantly
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    setIsTypingLocal(false);
    emitStopTyping(activeChat._id);
  };

  // Check if peer is typing
  const isPeerTyping = typingUsers[activeChat._id] && 
                       Object.keys(typingUsers[activeChat._id]).some(uid => uid !== user._id);

  return (
    <div className="flex-1 h-full flex flex-col bg-bg-primary overflow-hidden transition-colors relative">
      {/* Toast Notification */}
      {toast && (
        <div className="absolute top-16 left-1/2 transform -translate-x-1/2 z-40 bg-black text-white text-[10px] font-bold uppercase tracking-wider px-4 py-2 border border-border-custom shadow-lg rounded-sm animate-fadeIn">
          {toast}
        </div>
      )}

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
          <UserAvatar username={peer?.username} profilePic={peer?.profilePic} isOnline={isOnline} />
          <div className="min-w-0">
            <h3 className="font-bold text-xs tracking-wide text-text-primary truncate">{peer?.username}</h3>
            <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider block truncate mt-0.5">
              {isOnline ? (
                <span className="text-emerald-600">Active now</span>
              ) : (
                formatLastSeen(lastSeen)
              )}
            </span>
          </div>
        </div>

        {/* Right side Actions: Block & Close Chat */}
        <div className="flex items-center gap-1">
          <button
            onClick={handleBlockToggle}
            className={`p-1.5 rounded-sm hover:bg-bg-tertiary transition-all flex items-center justify-center cursor-pointer ${
              isPeerBlocked ? 'text-emerald-600' : 'text-rose-600'
            }`}
            title={isPeerBlocked ? 'Unblock User' : 'Block User'}
          >
            {isPeerBlocked ? <ShieldCheck className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setActiveChat(null)}
            className="p-1.5 rounded-sm hover:bg-bg-tertiary text-text-secondary hover:text-text-primary cursor-pointer transition-all flex items-center justify-center"
            title="Close Chat"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Message Area */}
      <div className="flex-1 overflow-y-auto px-6 pt-6 pb-28 space-y-5 bg-bg-primary transition-colors">
        {messagesLoading ? (
          <div className="flex flex-col items-center justify-center h-full text-text-muted">
            <div className="flex gap-1.5 mb-2">
              <span className="h-2.5 w-2.5 bg-accent-custom rounded-full animate-bounce [animation-delay:-0.3s]" />
              <span className="h-2.5 w-2.5 bg-accent-custom rounded-full animate-bounce [animation-delay:-0.15s]" />
              <span className="h-2.5 w-2.5 bg-accent-custom rounded-full animate-bounce" />
            </div>
            <p className="text-[10px] uppercase tracking-wider font-bold">Loading conversation...</p>
          </div>
        ) : messages.length === 0 ? (
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
                <div className="relative group message-bubble-wrapper">
                  {/* Crooked Hand-made Looking Message Bubble */}
                  <div
                    onClick={() => setActiveMenuMsgId(activeMenuMsgId === msg._id ? null : msg._id)}
                    className={`max-w-[280px] px-4 py-2.5 shadow-sm flex flex-col relative border cursor-pointer hover:brightness-95 transition-all select-none ${
                      isSelf
                        ? 'bg-bubble-self text-bubble-self-text border-accent-custom border-opacity-10 rounded-tl-xl rounded-bl-2xl rounded-br-none rounded-tr-md transform rotate-[0.3deg]'
                        : 'bg-bg-secondary text-text-primary border-border-custom rounded-tr-xl rounded-br-2xl rounded-bl-none rounded-tl-md transform rotate-[-0.3deg]'
                    }`}
                  >
                    {/* Quoted Reply Box inside bubble */}
                    {msg.replyTo && (
                      <div className={`text-[10px] rounded-xs border-l-2 p-1.5 mb-2 leading-relaxed text-left opacity-90 ${
                        isSelf 
                          ? 'bg-black bg-opacity-25 border-white text-white' 
                          : 'bg-bg-tertiary border-accent-custom text-text-secondary'
                      }`}>
                        <div className="font-bold text-[9px] uppercase tracking-wider mb-0.5">
                          {msg.replyTo.senderId?._id === user._id ? 'You' : msg.replyTo.senderId?.username}
                        </div>
                        <div className="truncate">{msg.replyTo.text}</div>
                      </div>
                    )}

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
                            <span className="flex items-center gap-0.5">
                              <CheckCheck className="w-3.5 h-3.5 text-current" />
                              <span className="text-[7.5px] uppercase tracking-wider font-extrabold opacity-95">Seen</span>
                            </span>
                          )}
                        </span>
                      )}
                    </div>

                    {/* Reactions Pill Overlay */}
                    {msg.reactions && msg.reactions.length > 0 && (
                      <div className="absolute -bottom-2 right-2 flex items-center gap-0.5 bg-bg-secondary border border-border-custom rounded-full px-1.5 py-0.5 shadow-sm text-[9px] z-10 select-none">
                        {msg.reactions.map((r, i) => (
                          <span key={i} title={r.userId === user._id ? 'You reacted' : 'Peer reacted'}>
                            {r.emoji}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Hold/React Instagram-style popover menu */}
                  {activeMenuMsgId === msg._id && (
                    <div className={`absolute z-30 bg-bg-secondary border border-border-custom shadow-xl p-2 rounded-sm w-44 animate-fadeIn ${
                      isSelf ? 'right-0' : 'left-0'
                    } ${
                      index >= messages.length - 2 ? 'bottom-full mb-2' : 'top-full mt-1.5'
                    }`}>
                      {/* Emoji Reactions strip */}
                      <div className="flex justify-between items-center gap-1 border-b border-border-custom pb-2 mb-1.5">
                        {['👍', '❤️', '😂', '😮', '😢', '🙏'].map(emoji => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => handleReaction(msg._id, emoji)}
                            className="text-sm hover:scale-130 transition-transform cursor-pointer p-0.5"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                      
                      {/* Actions */}
                      <div className="flex flex-col text-left">
                        <button
                          type="button"
                          onClick={() => handleReplyClick(msg)}
                          className="text-[9px] font-bold uppercase tracking-wider text-text-secondary hover:text-text-primary hover:bg-bg-tertiary px-2 py-1.5 rounded-sm transition-all text-left cursor-pointer flex items-center gap-1.5"
                        >
                          <CornerUpLeft className="w-3 h-3" /> Reply
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCopy(msg.text)}
                          className="text-[9px] font-bold uppercase tracking-wider text-text-secondary hover:text-text-primary hover:bg-bg-tertiary px-2 py-1.5 rounded-sm transition-all text-left cursor-pointer"
                        >
                          Copy Text
                        </button>
                        <button
                          type="button"
                          onClick={() => handleForwardClick(msg)}
                          className="text-[9px] font-bold uppercase tracking-wider text-text-secondary hover:text-text-primary hover:bg-bg-tertiary px-2 py-1.5 rounded-sm transition-all text-left cursor-pointer"
                        >
                          Forward Message
                        </button>
                      </div>
                    </div>
                  )}
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

      {/* Input Bar with Reply Quote Banner */}
      <div className="p-4 border-t border-border-custom bg-bg-secondary transition-all">
        {replyingToMsg && (
          <div className="flex justify-between items-center bg-bg-primary border border-border-custom rounded-sm px-4 py-2.5 mb-2.5 text-xs text-text-secondary animate-fadeIn">
            <div className="min-w-0">
              <span className="font-bold text-[9px] uppercase tracking-wider text-accent-custom block">
                Replying to {replyingToMsg.senderId?._id === user._id ? 'yourself' : replyingToMsg.senderId?.username}
              </span>
              <p className="truncate text-text-muted font-medium mt-0.5">{replyingToMsg.text}</p>
            </div>
            <button
              onClick={() => setReplyingToMsg(null)}
              className="p-1 rounded-sm text-text-muted hover:text-text-primary hover:bg-bg-tertiary transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <form onSubmit={handleSend}>
          <div className="flex gap-3 items-center">
            <input
              type="text"
              placeholder={isPeerBlocked ? "Unblock this user to send messages..." : "Type a message..."}
              value={inputText}
              disabled={isPeerBlocked}
              onChange={handleInputChange}
              className="flex-1 bg-bg-primary border border-border-custom focus:border-accent-custom rounded-sm py-3 px-4 text-xs font-medium text-text-primary placeholder-text-muted outline-none transition-all disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || isPeerBlocked}
              className="py-3 px-5 bg-black hover:bg-neutral-900 disabled:bg-bg-tertiary text-white disabled:text-text-muted font-bold text-xs uppercase tracking-widest rounded-sm shadow-sm transition-all hover:scale-102 active:scale-98 cursor-pointer border border-transparent disabled:border-border-custom"
            >
              Send
            </button>
          </div>
        </form>
      </div>

      {/* Forward Modal */}
      {forwardingMsg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="w-full max-w-xs bg-bg-secondary border border-border-custom rounded-sm shadow-xl overflow-hidden">
            <div className="flex justify-between items-center px-4 py-3 border-b border-border-custom bg-bg-secondary">
              <h3 className="text-[10px] font-bold uppercase tracking-wider text-text-primary">Forward Message</h3>
              <button
                onClick={() => setForwardingMsg(null)}
                className="text-text-secondary hover:text-text-primary font-bold cursor-pointer"
              >
                &times;
              </button>
            </div>
            <div className="max-h-60 overflow-y-auto p-3 space-y-1.5 bg-bg-primary">
              {chats.map(c => {
                const peerNode = c.participants.find(p => p._id !== user._id);
                if (!peerNode) return null;
                return (
                  <button
                    key={c._id}
                    onClick={() => handleForward(c._id, peerNode.username)}
                    className="w-full text-left p-2.5 bg-bg-secondary border border-border-custom hover:border-accent-custom hover:bg-bg-tertiary rounded-sm font-bold text-xs tracking-wide text-text-primary transition-all cursor-pointer shadow-sm"
                  >
                    {peerNode.username}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatWindow;
