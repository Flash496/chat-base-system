import React, { useState } from 'react';
import axios from 'axios';
import { Search, MessageSquare, X, Smartphone, Mail, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import UserAvatar from './UserAvatar';

const ContactSearch = ({ isOpen, onClose }) => {
  const { API_URL } = useAuth();
  const { setActiveChat, fetchChats, socket } = useSocket();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSearch = async (e) => {
    e?.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError('');
    setResults([]);
    try {
      const response = await axios.get(`${API_URL}/users/search`, {
        params: { query }
      });
      setResults(response.data);
      if (response.data.length === 0) {
        setError('No users found matching your search.');
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to search users.');
    } finally {
      setLoading(false);
    }
  };

  const startChat = async (recipientId) => {
    try {
      const response = await axios.post(`${API_URL}/chats`, { recipientId });
      const newChat = response.data;
      
      // Update global context and join socket room
      if (socket) {
        socket.emit('join_room', newChat._id);
      }
      
      await fetchChats();
      setActiveChat(newChat);
      onClose();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to start chat.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-xs p-4 animate-fadeIn">
      <div className="w-full max-w-md bg-bg-secondary border border-border-custom rounded-sm shadow-xl overflow-hidden transition-colors">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-border-custom bg-bg-secondary transition-colors">
          <h2 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
            <Search className="w-4 h-4 text-accent-custom" /> Start Conversation
          </h2>
          <button onClick={onClose} className="p-1 rounded-sm hover:bg-bg-tertiary text-text-secondary hover:text-text-primary transition-colors cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Input */}
        <form onSubmit={handleSearch} className="p-6 border-b border-border-custom bg-bg-primary transition-colors">
          <div className="relative">
            <input
              type="text"
              placeholder="Enter username or phone number..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-bg-secondary border border-border-custom focus:border-accent-custom rounded-sm py-3 pl-11 pr-24 text-xs font-medium text-text-primary placeholder-text-muted outline-none transition-all"
              autoFocus
            />
            <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-text-muted" />
            <button
              type="submit"
              disabled={loading}
              className="absolute right-2 top-2 bg-black hover:bg-neutral-900 disabled:bg-bg-tertiary text-white disabled:text-text-muted font-bold text-[10px] uppercase tracking-wider px-3.5 py-1.5 rounded-sm transition-colors cursor-pointer border border-transparent disabled:border-border-custom"
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>
        </form>

        {/* Results List */}
        <div className="max-h-[300px] overflow-y-auto p-4 space-y-3 bg-bg-primary transition-colors">
          {error && (
            <p className="text-xs font-bold uppercase tracking-wider text-center text-text-secondary py-6">{error}</p>
          )}

          {!loading && results.length === 0 && !error && (
            <div className="text-center py-8 text-text-muted">
              <User className="w-6 h-6 mx-auto opacity-30 mb-2" />
              <p className="text-[10px] uppercase tracking-wider font-bold max-w-[280px] mx-auto leading-relaxed">
                Query contacts by partial username or exact phone number.
              </p>
            </div>
          )}

          {results.map((user) => (
            <div
              key={user._id}
              className="flex items-center justify-between p-3 rounded-sm border border-border-custom bg-bg-secondary hover:border-accent-custom transition-all shadow-sm"
            >
              <div className="flex items-center gap-3 min-w-0">
                <UserAvatar username={user.username} profilePic={user.profilePic} isOnline={user.isOnline} />
                <div className="min-w-0">
                  <h4 className="font-bold text-xs tracking-wide text-text-primary truncate">{user.username}</h4>
                  <div className="flex flex-col gap-0.5 mt-0.5">
                    {user.phone && (
                      <span className="text-[10px] font-medium text-text-secondary flex items-center gap-1">
                        <Smartphone className="w-3 h-3 text-text-muted" /> {user.phone}
                      </span>
                    )}
                    {user.email && (
                      <span className="text-[10px] font-medium text-text-secondary flex items-center gap-1 truncate">
                        <Mail className="w-3 h-3 text-text-muted" /> {user.email}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={() => startChat(user._id)}
                className="flex items-center gap-1.5 bg-black hover:bg-neutral-900 text-white font-bold text-[10px] uppercase tracking-wider px-3.5 py-2 rounded-sm transition-all hover:scale-102 cursor-pointer"
              >
                <MessageSquare className="w-3 h-3" /> Chat
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ContactSearch;
