import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, ShieldAlert, CheckCircle2, LogOut, Sparkles } from 'lucide-react';

const Verify = () => {
  const { user, verifyOtp, resendOtp, logout } = useAuth();
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!code || code.length !== 6) {
      setError('Please enter a valid 6-digit code.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMsg('');

    const result = await verifyOtp(code);
    setLoading(false);

    if (result.success) {
      navigate('/');
    } else {
      setError(result.message);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setError('');
    setSuccessMsg('');
    const result = await resendOtp();
    setResending(false);

    if (result.success) {
      setSuccessMsg(result.message || 'Verification code resent successfully.');
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-primary p-4 relative overflow-hidden transition-colors">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent-glow rounded-full filter blur-[120px] opacity-40 animate-pulse" />

      <div className="w-full max-w-sm bg-bg-secondary border border-border-custom rounded-sm shadow-xl p-8 relative z-10 animate-fadeIn transition-colors">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex p-3.5 rounded-sm bg-bg-primary border border-border-custom mb-3 shadow-sm">
            <MessageSquare className="w-6 h-6 text-accent-custom" />
          </div>
          <h1 className="text-lg font-bold text-text-primary tracking-tight uppercase flex items-center gap-1.5 justify-center">
            Verification Required <Sparkles className="w-4 h-4 text-accent-custom" />
          </h1>
          <p className="text-[10px] uppercase font-bold tracking-wider text-text-muted mt-1 leading-relaxed">
            We sent a 6-digit code to <span className="text-text-primary block lowercase mt-0.5">{user?.email || user?.phone}</span>
          </p>
        </div>

        {/* Success / Error Alerts */}
        {error && (
          <div className="mb-5 flex items-start gap-2.5 p-3 rounded-sm bg-rose-500 bg-opacity-5 border border-rose-500 border-opacity-20 text-rose-750 dark:text-rose-300 text-xs leading-relaxed font-medium">
            <ShieldAlert className="w-4 h-4 text-rose-500 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-5 flex items-start gap-2.5 p-3 rounded-sm bg-emerald-500 bg-opacity-5 border border-emerald-500 border-opacity-20 text-emerald-700 dark:text-emerald-300 text-xs leading-relaxed font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Verification Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-2 text-center">
              Verification OTP Code
            </label>
            <input
              type="text"
              maxLength="6"
              placeholder="000000"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              className="w-full text-center bg-bg-primary border border-border-custom focus:border-accent-custom rounded-sm py-3.5 text-lg font-bold tracking-[8px] text-text-primary placeholder-text-muted outline-none transition-all"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black hover:bg-neutral-900 disabled:bg-bg-tertiary text-white disabled:text-text-muted font-bold text-xs uppercase tracking-widest rounded-sm py-3.5 shadow-sm transition-all hover:scale-102 active:scale-98 cursor-pointer border border-transparent disabled:border-border-custom"
          >
            {loading ? 'Verifying...' : 'Verify Code'}
          </button>
        </form>

        {/* Footer options */}
        <div className="flex justify-between items-center mt-6 border-t border-border-custom pt-4">
          <button
            onClick={handleResend}
            disabled={resending}
            className="text-[10px] font-bold uppercase tracking-wider text-accent-custom hover:underline cursor-pointer disabled:text-text-muted"
          >
            {resending ? 'Resending...' : 'Resend Code'}
          </button>
          <button
            onClick={logout}
            className="text-[10px] font-bold uppercase tracking-wider text-rose-600 hover:underline cursor-pointer flex items-center gap-1"
          >
            <LogOut className="w-3.5 h-3.5" /> Back to Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default Verify;
