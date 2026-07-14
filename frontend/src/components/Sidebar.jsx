import React, { useState, useEffect, useRef } from 'react';
import { LogOut, UserPlus, MessageSquare, Search, Sun, Moon, Pin, VolumeX, MoreVertical, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import UserAvatar from './UserAvatar';
import ContactSearch from './ContactSearch';

const Sidebar = () => {
  const { user, logout, theme, toggleTheme, updateProfilePic, uploadProgress } = useAuth();
  const { chats, chatsLoading, activeChat, setActiveChat, togglePinChat, toggleMuteChat, removeChat } = useSocket();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [activeMenuChatId, setActiveMenuChatId] = useState(null);
  const [showAvatarMenu, setShowAvatarMenu] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const handleOutsideClick = () => {
      setActiveMenuChatId(null);
      setShowAvatarMenu(false);
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, []);

  const handleAvatarClick = (e) => {
    e.stopPropagation();
    if (uploadProgress !== null) return; // Prevent clicking while uploading
    
    if (user?.profilePic) {
      setShowAvatarMenu(!showAvatarMenu);
    } else {
      fileInputRef.current?.click();
    }
  };

  // Resize and compress profile pictures client-side to keep base64 strings extremely small (~10KB)
  const compressImage = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const max_size = 150;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > max_size) {
              height *= max_size / width;
              width = max_size;
            }
          } else {
            if (height > max_size) {
              width *= max_size / height;
              height = max_size;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          // Get optimized base64 string
          const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
          resolve(dataUrl);
        };
      };
    });
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const compressedBase64 = await compressImage(file);
      const res = await updateProfilePic(compressedBase64);
      if (!res.success) {
        alert(res.message);
      }
    } catch (err) {
      console.error('Failed to compress and upload image:', err);
      alert('Failed to process image file.');
    }
  };

  const getOtherParticipant = (chat) => {
    if (!chat || !chat.participants) return null;
    return chat.participants.find(p => p._id !== user._id);
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }

    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <div className="w-full md:w-80 h-full flex flex-col bg-bg-primary border-r border-border-custom flex-shrink-0 transition-colors">
      {/* Sidebar Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border-custom bg-bg-secondary transition-colors">
        <div className="flex items-center gap-3">
          {/* Avatar Container with options popup */}
          <div className="relative">
            <div onClick={handleAvatarClick} className="relative cursor-pointer hover:opacity-85 transition-opacity" title="Profile options">
              <UserAvatar username={user?.username} profilePic={user?.profilePic} isOnline={true} size="md" />
              {uploadProgress !== null && (
                <div className="absolute inset-0 bg-black bg-opacity-70 flex flex-col items-center justify-center rounded-sm text-[8px] font-bold text-white uppercase tracking-wider">
                  <span>{uploadProgress}%</span>
                  <div className="w-8 bg-neutral-800 h-0.5 mt-0.5 rounded-full overflow-hidden">
                    <div className="bg-accent-custom h-full transition-all duration-150" style={{ width: `${uploadProgress}%` }} />
                  </div>
                </div>
              )}
            </div>

            {/* Profile Picture options menu */}
            {showAvatarMenu && (
              <div
                onMouseDown={(e) => e.stopPropagation()}
                className="absolute left-0 top-12 z-30 bg-bg-secondary border border-border-custom shadow-xl p-1.5 rounded-sm w-36 animate-fadeIn"
              >
                <button
                  type="button"
                  onClick={() => {
                    fileInputRef.current?.click();
                    setShowAvatarMenu(false);
                  }}
                  className="w-full text-left px-2.5 py-1.5 text-[9px] font-bold uppercase tracking-wider text-text-secondary hover:text-text-primary hover:bg-bg-tertiary rounded-sm transition-all cursor-pointer"
                >
                  Upload New
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    if (confirm('Delete your profile picture?')) {
                      await updateProfilePic('');
                    }
                    setShowAvatarMenu(false);
                  }}
                  className="w-full text-left px-2.5 py-1.5 text-[9px] font-bold uppercase tracking-wider text-rose-600 hover:text-rose-750 hover:bg-bg-tertiary rounded-sm transition-all cursor-pointer border-t border-border-custom mt-1 pt-1.5"
                >
                  Delete Current
                </button>
              </div>
            )}
          </div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />
          <div className="min-w-0">
            <h3 className="font-bold text-sm text-text-primary tracking-tight truncate max-w-[110px]">{user?.username}</h3>
            <span className="text-[9px] text-emerald-600 font-bold uppercase tracking-wider flex items-center gap-1">
              Online
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1">
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

      {/* Quick Search */}
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

        {chatsLoading ? (
          <div className="text-center py-12 px-4 text-text-muted bg-bg-secondary border border-border-custom rounded-sm shadow-sm">
            <div className="flex gap-1.5 justify-center mb-2">
              <span className="h-2 w-2 bg-accent-custom rounded-full animate-bounce [animation-delay:-0.3s]" />
              <span className="h-2 w-2 bg-accent-custom rounded-full animate-bounce [animation-delay:-0.15s]" />
              <span className="h-2 w-2 bg-accent-custom rounded-full animate-bounce" />
            </div>
            <p className="text-[10px] uppercase tracking-wider font-bold">Querying chats...</p>
          </div>
        ) : chats.length === 0 ? (
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

            // Fetch user-specific Pin/Mute values
            const chatSettings = chat.settings?.find(s => s.userId.toString() === user._id.toString());
            const isPinned = chatSettings ? chatSettings.isPinned : false;
            const isMuted = chatSettings ? chatSettings.isMuted : false;
            
            return (
              <div
                key={chat._id}
                className="relative group"
              >
                <div
                  onClick={() => setActiveChat(chat)}
                  className={`flex items-center gap-3 p-3 rounded-sm cursor-pointer transition-all border ${
                    isSelected
                      ? 'bg-bg-secondary border-accent-custom ring-1 ring-accent-custom text-text-primary shadow-md'
                      : 'bg-bg-secondary border-border-custom hover:border-text-muted hover:bg-bg-tertiary text-text-secondary hover:text-text-primary shadow-sm'
                  }`}
                >
                  <UserAvatar username={peer.username} profilePic={peer.profilePic} isOnline={peer.isOnline} />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-0.5">
                      <div className="flex items-center gap-1 min-w-0">
                        <h4 className="font-bold text-xs tracking-wide text-text-primary truncate">{peer.username}</h4>
                        {isPinned && <Pin className="w-3 h-3 text-accent-custom flex-shrink-0" />}
                        {isMuted && <VolumeX className="w-3 h-3 text-text-muted flex-shrink-0" />}
                      </div>
                      <span className="text-[9px] font-medium text-text-muted flex-shrink-0">
                        {formatTime(lastMsg?.createdAt || chat.createdAt)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <p className={`text-[11px] truncate max-w-[120px] ${hasUnread ? 'text-text-primary font-bold' : 'text-text-muted'}`}>
                        {lastMsg ? (
                          <>
                            {lastMsg.senderId._id === user._id ? 'You: ' : ''}
                            {lastMsg.text}
                          </>
                        ) : (
                          <span className="italic text-text-muted opacity-50 text-[10px]">New dialogue opened</span>
                        )}
                      </p>
                      
                      <div className="flex items-center gap-1.5">
                        {hasUnread && (
                          <span className="flex h-4.5 min-w-4.5 items-center justify-center rounded-sm bg-accent-custom px-1 text-[9px] font-bold text-bubble-self-text shadow-sm">
                            {chat.unreadCount}
                          </span>
                        )}
                        
                        {/* 3-Dot Options Action Trigger */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMenuChatId(activeMenuChatId === chat._id ? null : chat._id);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-bg-tertiary text-text-secondary hover:text-text-primary rounded-sm transition-all cursor-pointer"
                        >
                          <MoreVertical className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Inline Action Options Dropdown */}
                {activeMenuChatId === chat._id && (
                  <div
                    onMouseDown={(e) => e.stopPropagation()}
                    className="absolute right-2 top-10 z-30 bg-bg-secondary border border-border-custom shadow-xl p-1.5 rounded-sm w-36 animate-fadeIn"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        togglePinChat(chat._id);
                        setActiveMenuChatId(null);
                      }}
                      className="w-full text-left px-2.5 py-1.5 text-[9px] font-bold uppercase tracking-wider text-text-secondary hover:text-text-primary hover:bg-bg-tertiary rounded-sm transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Pin className="w-3 h-3" /> {isPinned ? 'Unpin Chat' : 'Pin Chat'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        toggleMuteChat(chat._id);
                        setActiveMenuChatId(null);
                      }}
                      className="w-full text-left px-2.5 py-1.5 text-[9px] font-bold uppercase tracking-wider text-text-secondary hover:text-text-primary hover:bg-bg-tertiary rounded-sm transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <VolumeX className="w-3 h-3" /> {isMuted ? 'Unmute Chat' : 'Mute Chat'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm('Delete this conversation? All messages will be permanently deleted.')) {
                          removeChat(chat._id);
                        }
                        setActiveMenuChatId(null);
                      }}
                      className="w-full text-left px-2.5 py-1.5 text-[9px] font-bold uppercase tracking-wider text-rose-600 hover:text-rose-700 hover:bg-bg-tertiary rounded-sm transition-all flex items-center gap-1.5 cursor-pointer border-t border-border-custom mt-1 pt-2"
                    >
                      <Trash2 className="w-3 h-3" /> Delete Chat
                    </button>
                  </div>
                )}
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
