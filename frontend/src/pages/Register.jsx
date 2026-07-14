import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { MessageSquare, ShieldAlert, KeyRound, User, Mail, Smartphone, Sparkles } from 'lucide-react';

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [regMode, setRegMode] = useState('email'); // 'email' or 'phone'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Username and password are required.');
      return;
    }
    if (regMode === 'email' && !email) {
      setError('Email address is required.');
      return;
    }
    if (regMode === 'phone' && !phone) {
      setError('Phone number is required.');
      return;
    }

    setLoading(true);
    setError('');

    const result = await register(
      username,
      password,
      regMode === 'email' ? email : '',
      regMode === 'phone' ? phone : ''
    );
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

      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-8 glass-effect relative z-10 animate-fadeIn">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex p-3 rounded-2xl bg-brand-600 bg-opacity-20 border border-brand-500 border-opacity-30 mb-3">
            <MessageSquare className="w-8 h-8 text-brand-400" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-1.5 justify-center">
            Create Account <Sparkles className="w-4 h-4 text-brand-400" />
          </h1>
          <p className="text-sm text-slate-500 mt-1">Get started with your custom chat application</p>
        </div>

        {/* Tab Toggle */}
        <div className="grid grid-cols-2 p-1 bg-slate-950 border border-slate-800 rounded-xl mb-6">
          <button
            type="button"
            onClick={() => {
              setRegMode('email');
              setError('');
            }}
            className={`py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              regMode === 'email'
                ? 'bg-brand-600 text-white shadow-md'
                : 'text-slate-500 hover:text-slate-355'
            }`}
          >
            <Mail className="w-3.5 h-3.5" /> Email Auth
          </button>
          <button
            type="button"
            onClick={() => {
              setRegMode('phone');
              setError('');
            }}
            className={`py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              regMode === 'phone'
                ? 'bg-brand-600 text-white shadow-md'
                : 'text-slate-500 hover:text-slate-355'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" /> Phone Auth
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 flex items-start gap-2.5 p-3 rounded-xl bg-rose-500 bg-opacity-10 border border-rose-500 border-opacity-25 text-rose-200 text-xs leading-relaxed">
            <ShieldAlert className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Username
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="choose a username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-brand-500 rounded-xl py-3 pl-11 pr-4 text-sm text-slate-200 placeholder-slate-600 outline-none transition-all"
                required
              />
              <User className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-600" />
            </div>
          </div>

          {regMode === 'email' ? (
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  placeholder="name@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-brand-500 rounded-xl py-3 pl-11 pr-4 text-sm text-slate-200 placeholder-slate-600 outline-none transition-all"
                  required
                />
                <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-600" />
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Phone Number
              </label>
              <div className="relative">
                <input
                  type="tel"
                  placeholder="+1234567890"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-brand-500 rounded-xl py-3 pl-11 pr-4 text-sm text-slate-200 placeholder-slate-600 outline-none transition-all"
                  required
                />
                <Smartphone className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-600" />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Password
            </label>
            <div className="relative">
              <input
                type="password"
                placeholder="create a password"
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
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <div className="text-center mt-6">
          <p className="text-xs text-slate-500">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-400 hover:text-brand-300 font-semibold hover:underline">
              Log in instead
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
