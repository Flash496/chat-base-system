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
    <div className="min-h-screen flex items-center justify-center bg-bg-primary p-4 relative overflow-hidden transition-colors">
      {/* Background ambient glowing circles */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent-glow rounded-full filter blur-[120px] opacity-40 animate-pulse" />

      <div className="w-full max-w-sm bg-bg-secondary border border-border-custom rounded-sm shadow-xl p-8 relative z-10 animate-fadeIn transition-colors">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex p-3.5 rounded-sm bg-bg-primary border border-border-custom mb-3 shadow-sm">
            <MessageSquare className="w-6 h-6 text-accent-custom" />
          </div>
          <h1 className="text-lg font-bold text-text-primary tracking-tight uppercase flex items-center gap-1.5 justify-center">
            Create Account <Sparkles className="w-4 h-4 text-accent-custom" />
          </h1>
          <p className="text-[10px] uppercase font-bold tracking-wider text-text-muted mt-1">Join the ProtoChat network</p>
        </div>

        {/* Tab Toggle */}
        <div className="grid grid-cols-2 p-1 bg-bg-primary border border-border-custom rounded-sm mb-6">
          <button
            type="button"
            onClick={() => {
              setRegMode('email');
              setError('');
            }}
            className={`py-2 text-[10px] font-bold uppercase tracking-wider rounded-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              regMode === 'email'
                ? 'bg-black text-white shadow-sm'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <Mail className="w-3.5 h-3.5" /> Email
          </button>
          <button
            type="button"
            onClick={() => {
              setRegMode('phone');
              setError('');
            }}
            className={`py-2 text-[10px] font-bold uppercase tracking-wider rounded-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              regMode === 'phone'
                ? 'bg-black text-white shadow-sm'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" /> Phone
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 flex items-start gap-2.5 p-3 rounded-sm bg-rose-500 bg-opacity-5 border border-rose-500 border-opacity-20 text-rose-750 dark:text-rose-300 text-xs leading-relaxed font-medium">
            <ShieldAlert className="w-4 h-4 text-rose-500 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-2">
              Username
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="choose a username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-bg-primary border border-border-custom focus:border-accent-custom rounded-sm py-3 pl-11 pr-4 text-xs font-medium text-text-primary placeholder-text-muted outline-none transition-all"
                required
              />
              <User className="absolute left-3.5 top-3.5 w-4 h-4 text-text-muted" />
            </div>
          </div>

          {regMode === 'email' ? (
            <div>
              <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-2">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  placeholder="name@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-bg-primary border border-border-custom focus:border-accent-custom rounded-sm py-3 pl-11 pr-4 text-xs font-medium text-text-primary placeholder-text-muted outline-none transition-all"
                  required
                />
                <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-text-muted" />
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-2">
                Phone Number
              </label>
              <div className="relative">
                <input
                  type="tel"
                  placeholder="+1234567890"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-bg-primary border border-border-custom focus:border-accent-custom rounded-sm py-3 pl-11 pr-4 text-xs font-medium text-text-primary placeholder-text-muted outline-none transition-all"
                  required
                />
                <Smartphone className="absolute left-3.5 top-3.5 w-4 h-4 text-text-muted" />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-2">
              Password
            </label>
            <div className="relative">
              <input
                type="password"
                placeholder="create password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-bg-primary border border-border-custom focus:border-accent-custom rounded-sm py-3 pl-11 pr-4 text-xs font-medium text-text-primary placeholder-text-muted outline-none transition-all"
                required
              />
              <KeyRound className="absolute left-3.5 top-3.5 w-4 h-4 text-text-muted" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black hover:bg-neutral-900 disabled:bg-bg-tertiary text-white disabled:text-text-muted font-bold text-xs uppercase tracking-widest rounded-sm py-3.5 shadow-sm transition-all hover:scale-102 active:scale-98 cursor-pointer mt-2 border border-transparent disabled:border-border-custom"
          >
            {loading ? 'Creating...' : 'Register'}
          </button>
        </form>

        <div className="text-center mt-6">
          <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
            Already registered?{' '}
            <Link to="/login" className="text-accent-custom hover:underline font-bold ml-1">
              Log in instead
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
