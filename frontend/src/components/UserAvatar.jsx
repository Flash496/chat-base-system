import React from 'react';

const UserAvatar = ({ username, isOnline, size = 'md' }) => {
  const getInitials = (name) => {
    if (!name) return '?';
    return name.slice(0, 2).toUpperCase();
  };

  const getGradient = (name) => {
    const colors = [
      'from-indigo-500 to-purple-600',
      'from-pink-500 to-rose-600',
      'from-blue-500 to-indigo-600',
      'from-teal-400 to-emerald-600',
      'from-orange-400 to-red-600',
      'from-fuchsia-500 to-violet-600',
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };

  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-11 h-11 text-sm',
    lg: 'w-14 h-14 text-lg',
  };

  return (
    <div className="relative inline-block select-none flex-shrink-0">
      <div className={`rounded-full flex items-center justify-center font-bold text-white shadow-md bg-gradient-to-br ${getGradient(username)} ${sizeClasses[size]}`}>
        {getInitials(username)}
      </div>
      {isOnline && (
        <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-slate-900 shadow-glow" />
      )}
    </div>
  );
};

export default UserAvatar;
