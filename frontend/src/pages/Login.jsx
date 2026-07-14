import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { MessageSquare, ShieldAlert, KeyRound, User, Sparkles } from 'lucide-react';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!identifier || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setLoading(true);
    setError('');

    const result = await login(identifier, password);
    setLoading(false);

    if (result.success) {
      navigate('/');
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4 relative overflow-hidden">
      {/* Background ambient glowing circles */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-brand-600 rounded-full filter blur-[120px] opacity-10 animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-fuchsia-600 rounded-full filter blur-[120px] opacity-10 animate-pulse delay-1000" />

      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-8 glass-effect relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex p-3 rounded-2xl bg-brand-600 bg-opacity-20 border border-brand-500 border-opacity-30 mb-3">
            <MessageSquare className="w-8 h-8 text-brand-400" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-1.5 justify-center">
            Welcome Back <Sparkles className="w-4 h-4 text-brand-400" />
          </h1>
          <p className="text-sm text-slate-500 mt-1">Log in to reconnect with your contacts</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 flex items-start gap-2.5 p-3 rounded-xl bg-rose-500 bg-opacity-10 border border-rose-500 border-opacity-25 text-rose-200 text-xs leading-relaxed">
            <ShieldAlert className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Email or Phone Number
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="you@example.com or +1234567890"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-brand-500 rounded-xl py-3 pl-11 pr-4 text-sm text-slate-200 placeholder-slate-600 outline-none transition-all"
                required
              />
              <User className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-600" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Password
            </label>
            <div className="relative">
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-brand-500 rounded-xl py-3 pl-11 pr-4 text-sm text-slate-200 placeholder-slate-600 outline-none transition-all"
                required
              />
              <KeyRound className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-600" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-600 hover:bg-brand-500 disabled:bg-brand-800 text-white font-semibold rounded-xl py-3 shadow-lg hover:shadow-brand-500/20 transition-all hover:scale-[1.01] active:scale-95 text-sm mt-2"
          >
            {loading ? 'Logging in...' : 'Log In'}
          </button>
        </form>

        <div className="text-center mt-6">
          <p className="text-xs text-slate-500">
            Don't have an account?{' '}
            <Link to="/register" className="text-brand-400 hover:text-brand-300 font-semibold hover:underline">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
