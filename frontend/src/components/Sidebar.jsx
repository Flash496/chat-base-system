import React, { useState } from 'react';
import { LogOut, UserPlus, MessageSquare, Search, Sun, Moon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import UserAvatar from './UserAvatar';
import ContactSearch from './ContactSearch';

const Sidebar = () => {
  const { user, logout, theme, toggleTheme } = useAuth();
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
    <div className="w-full md:w-80 h-full flex flex-col bg-bg-primary border-r border-border-custom flex-shrink-0 transition-colors">
      {/* Sidebar Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border-custom bg-bg-secondary transition-colors">
        <div className="flex items-center gap-3">
          <UserAvatar username={user?.username} isOnline={true} size="md" />
          <div className="min-w-0">
            <h3 className="font-bold text-sm text-text-primary tracking-tight truncate max-w-[110px]">{user?.username}</h3>
            <span className="text-[9px] text-emerald-600 font-bold uppercase tracking-wider flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block animate-ping" /> Online
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className="p-2 rounded-sm text-text-secondary hover:text-text-primary hover:bg-bg-tertiary transition-all cursor-pointer"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-accent-custom" /> : <Moon className="w-4.5 h-4.5 text-accent-custom" />}
          </button>
          <button
            onClick={() => setIsSearchOpen(true)}
            title="Search users"
            className="p-2 rounded-sm text-text-secondary hover:text-text-primary hover:bg-bg-tertiary transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
          </button>
          <button
            onClick={logout}
            title="Log out"
            className="p-2 rounded-sm text-text-secondary hover:text-rose-600 hover:bg-bg-tertiary transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Quick Search trigger box */}
      <div className="p-3">
        <button
          onClick={() => setIsSearchOpen(true)}
          className="w-full flex items-center gap-2 bg-bg-secondary hover:bg-bg-tertiary border border-border-custom text-text-muted rounded-sm px-4 py-2.5 text-xs text-left transition-all cursor-pointer shadow-sm font-medium"
        >
          <Search className="w-3.5 h-3.5 text-text-muted" />
          <span className="text-[11px] tracking-wide uppercase text-text-muted">Search contacts...</span>
        </button>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-2.5">
        <div className="px-1 py-1 text-[10px] font-bold text-text-muted tracking-wider uppercase">
          Conversations
        </div>

        {chats.length === 0 ? (
          <div className="text-center py-12 px-4 text-text-muted bg-bg-secondary border border-border-custom rounded-sm shadow-sm">
            <MessageSquare className="w-8 h-8 mx-auto opacity-20 mb-2" />
            <p className="text-xs">No active chats yet.</p>
            <button
              onClick={() => setIsSearchOpen(true)}
              className="mt-3 text-xs text-accent-custom hover:underline font-bold uppercase tracking-wider"
            >
              Search users
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
                className={`flex items-center gap-3 p-3 rounded-sm cursor-pointer transition-all border ${
                  isSelected
                    ? 'bg-bg-secondary border-accent-custom ring-1 ring-accent-custom text-text-primary shadow-md'
                    : 'bg-bg-secondary border-border-custom hover:border-text-muted hover:bg-bg-tertiary text-text-secondary hover:text-text-primary shadow-sm'
                }`}
              >
                <UserAvatar username={peer.username} isOnline={peer.isOnline} />
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-1">
                    <h4 className="font-bold text-xs tracking-wide text-text-primary truncate">{peer.username}</h4>
                    <span className="text-[9px] font-medium text-text-muted">
                      {formatTime(lastMsg?.createdAt || chat.createdAt)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className={`text-[11px] truncate max-w-[130px] ${hasUnread ? 'text-text-primary font-bold' : 'text-text-muted'}`}>
                      {lastMsg ? (
                        <>
                          {lastMsg.senderId._id === user._id ? 'You: ' : ''}
                          {lastMsg.text}
                        </>
                      ) : (
                        <span className="italic text-text-muted opacity-50 text-[10px]">New dialogue opened</span>
                      )}
                    </p>
                    
                    {hasUnread && (
                      <span className="flex h-4.5 min-w-4.5 items-center justify-center rounded-sm bg-accent-custom px-1 text-[9px] font-bold text-bubble-self-text shadow-sm">
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
