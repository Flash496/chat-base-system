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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden glass-effect">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-800">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Search className="w-5 h-5 text-brand-400" /> Start a Conversation
          </h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Input */}
        <form onSubmit={handleSearch} className="p-6 border-b border-slate-800">
          <div className="relative">
            <input
              type="text"
              placeholder="Search username or phone..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-brand-500 rounded-xl py-3 pl-11 pr-24 text-sm text-slate-200 placeholder-slate-500 outline-none transition-all"
              autoFocus
            />
            <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
            <button
              type="submit"
              disabled={loading}
              className="absolute right-2 top-2 bg-brand-600 hover:bg-brand-500 disabled:bg-brand-800 text-white font-medium text-xs px-3.5 py-1.5 rounded-lg transition-colors"
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>
        </form>

        {/* Results List */}
        <div className="max-h-[300px] overflow-y-auto p-4 space-y-3">
          {error && (
            <p className="text-sm text-center text-slate-400 py-6">{error}</p>
          )}

          {!loading && results.length === 0 && !error && (
            <div className="text-center py-8 text-slate-500">
              <User className="w-8 h-8 mx-auto opacity-30 mb-2" />
              <p className="text-xs max-w-[280px] mx-auto leading-relaxed">
                Find other users by typing their exact phone number or partial username.
              </p>
            </div>
          )}

          {results.map((user) => (
            <div
              key={user._id}
              className="flex items-center justify-between p-3 rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-950 bg-opacity-40 hover:bg-opacity-80 transition-all"
            >
              <div className="flex items-center gap-3 min-w-0">
                <UserAvatar username={user.username} isOnline={user.isOnline} />
                <div className="min-w-0">
                  <h4 className="font-semibold text-sm text-white truncate">{user.username}</h4>
                  <div className="flex flex-col gap-0.5 mt-0.5">
                    {user.phone && (
                      <span className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Smartphone className="w-3 h-3 text-slate-500" /> {user.phone}
                      </span>
                    )}
                    {user.email && (
                      <span className="text-[11px] text-slate-400 flex items-center gap-1 truncate">
                        <Mail className="w-3 h-3 text-slate-500" /> {user.email}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={() => startChat(user._id)}
                className="flex items-center gap-1.5 bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs px-3 py-2 rounded-xl transition-all hover:scale-105"
              >
                <MessageSquare className="w-3.5 h-3.5" /> Chat
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ContactSearch;
