import React from 'react';

const UserAvatar = ({ username, profilePic, isOnline, size = 'md' }) => {
  const getInitials = (name) => {
    if (!name) return '?';
    return name.slice(0, 2).toUpperCase();
  };

  const getGradient = (name) => {
    // Premium elegant dark gradients for the initials background
    const colors = [
      'from-slate-800 to-slate-950',
      'from-indigo-950 to-slate-900',
      'from-[#1e1b4b] to-[#0f172a]',  // Dark violet-blue
      'from-[#311042] to-[#0a050f]',  // Deep dark violet
      'from-[#1c1917] to-[#0c0a09]',  // Dark stone
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
    md: 'w-10 h-10 text-xs tracking-wider',
    lg: 'w-12 h-12 text-sm tracking-wider',
  };

  return (
    <div className="relative inline-block select-none flex-shrink-0">
      {profilePic ? (
        <img
          src={profilePic}
          alt={username}
          className={`rounded-sm object-cover border border-border-custom shadow-sm ${sizeClasses[size]}`}
        />
      ) : (
        <div className={`rounded-sm flex items-center justify-center font-bold text-white shadow-sm border border-border-custom bg-gradient-to-br ${getGradient(username)} ${sizeClasses[size]}`}>
          {getInitials(username)}
        </div>
      )}
      {isOnline && (
        <span className="absolute -bottom-0.5 -right-0.5 block h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-bg-primary shadow-sm" />
      )}
    </div>
  );
};

export default UserAvatar;
