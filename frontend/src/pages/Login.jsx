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
    <div className="min-h-screen flex items-center justify-center bg-bg-primary p-4 relative overflow-hidden transition-colors">
      {/* Subtle background ambient glow using our accent color */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent-glow rounded-full filter blur-[120px] opacity-40 animate-pulse" />

      <div className="w-full max-w-sm relative z-10 flex flex-col items-center animate-fadeIn">
        {/* Brand Logo & Name ABOVE the login dialog box */}
        <div className="text-center mb-6 flex flex-col items-center">
          <div className="inline-flex p-4 rounded-sm bg-bg-secondary border border-border-custom mb-3 shadow-md">
            <MessageSquare className="w-7 h-7 text-accent-custom" />
          </div>
          <h1 className="text-2xl font-bold text-text-primary tracking-widest uppercase font-heading flex items-center gap-1.5">
            ProtoChat <Sparkles className="w-4.5 h-4.5 text-accent-custom animate-pulse" />
          </h1>
          <p className="text-[10px] uppercase font-bold tracking-widest text-text-muted mt-1">Minimalist Messaging Protocol</p>
        </div>

        {/* The Login Card Container */}
        <div className="w-full bg-bg-secondary border border-border-custom rounded-sm shadow-xl p-8 transition-colors">
          {/* Error Alert */}
          {error && (
            <div className="mb-6 flex items-start gap-2.5 p-3 rounded-sm bg-rose-500 bg-opacity-5 border border-rose-500 border-opacity-20 text-rose-750 dark:text-rose-300 text-xs leading-relaxed font-medium">
              <ShieldAlert className="w-4 h-4 text-rose-500 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-2">
                Email or Phone Number
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="you@domain.com or +1234567890"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full bg-bg-primary border border-border-custom focus:border-accent-custom rounded-sm py-3 pl-11 pr-4 text-xs font-medium text-text-primary placeholder-text-muted outline-none transition-all"
                  required
                />
                <User className="absolute left-3.5 top-3.5 w-4 h-4 text-text-muted" />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  placeholder="Enter password"
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
              {loading ? 'Verifying...' : 'Log In'}
            </button>
          </form>

          <div className="text-center mt-6">
            <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
              New to ProtoChat?{' '}
              <Link to="/register" className="text-accent-custom hover:underline font-bold ml-1">
                Create account
            </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
