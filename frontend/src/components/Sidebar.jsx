import React, { useState } from 'react';
import { LogOut, UserPlus, MessageSquare, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import UserAvatar from './UserAvatar';
import ContactSearch from './ContactSearch';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const { chats, activeChat, setActiveChat } = useSocket();
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const getOtherParticipant = (chat) => {
    if (!chat || !chat.participants) return null;
    return chat.participants.find(p => p._id !== user._id);
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    
    // Check if today
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    // Check if yesterday
    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }

    // Otherwise show date
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <div className="w-full md:w-80 h-full flex flex-col bg-slate-950 border-r border-slate-900 flex-shrink-0">
      {/* Sidebar Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-900 bg-slate-900 bg-opacity-40">
        <div className="flex items-center gap-3">
          <UserAvatar username={user?.username} isOnline={true} size="md" />
          <div className="min-w-0">
            <h3 className="font-semibold text-sm text-white truncate max-w-[120px]">{user?.username}</h3>
            <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 inline-block animate-ping" /> Online
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsSearchOpen(true)}
            title="Search users"
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
          >
            <UserPlus className="w-5 h-5" />
          </button>
          <button
            onClick={logout}
            title="Log out"
            className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-all"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Quick Search trigger box */}
      <div className="p-3">
        <button
          onClick={() => setIsSearchOpen(true)}
          className="w-full flex items-center gap-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-500 rounded-xl px-4 py-2 text-xs text-left transition-all"
        >
          <Search className="w-3.5 h-3.5" />
          <span>Search username or phone...</span>
        </button>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-1">
        <div className="px-2 py-1 text-[11px] font-semibold text-slate-500 tracking-wider uppercase">
          Conversations
        </div>

        {chats.length === 0 ? (
          <div className="text-center py-12 px-4 text-slate-500">
            <MessageSquare className="w-8 h-8 mx-auto opacity-20 mb-2" />
            <p className="text-xs">No active chats yet.</p>
            <button
              onClick={() => setIsSearchOpen(true)}
              className="mt-3 text-xs text-brand-400 hover:text-brand-300 hover:underline font-semibold"
            >
              Search users to start chatting
            </button>
          </div>
        ) : (
          chats.map((chat) => {
            const peer = getOtherParticipant(chat);
            if (!peer) return null;
            
            const isSelected = activeChat && activeChat._id === chat._id;
            const hasUnread = chat.unreadCount > 0;
            const lastMsg = chat.lastMessage;
            
            return (
              <div
                key={chat._id}
                onClick={() => setActiveChat(chat)}
                className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-brand-600 bg-opacity-20 border border-brand-500 border-opacity-30 text-white shadow-inner'
                    : 'border border-transparent hover:bg-slate-900 hover:bg-opacity-40 text-slate-300 hover:text-white'
                }`}
              >
                <UserAvatar username={peer.username} isOnline={peer.isOnline} />
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-0.5">
                    <h4 className="font-semibold text-sm truncate">{peer.username}</h4>
                    <span className="text-[10px] text-slate-500">
                      {formatTime(lastMsg?.createdAt || chat.createdAt)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className={`text-xs truncate max-w-[140px] ${hasUnread ? 'text-slate-200 font-semibold' : 'text-slate-400'}`}>
                      {lastMsg ? (
                        <>
                          {lastMsg.senderId._id === user._id ? 'You: ' : ''}
                          {lastMsg.text}
                        </>
                      ) : (
                        <span className="italic text-slate-600 text-[11px]">Chat created</span>
                      )}
                    </p>
                    
                    {hasUnread && (
                      <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-500 px-1.5 text-[10px] font-bold text-white shadow-lg animate-pulse">
                        {chat.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <ContactSearch isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </div>
  );
};

export default Sidebar;
