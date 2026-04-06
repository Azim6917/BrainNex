import React from 'react';

/* Matches the uploaded logo: brain icon + "Brain" in cyan, "Nex" in violet */
export default function BrainNexLogo({ size = 'md', iconOnly = false }) {
  const iconSizes = { sm: 24, md: 32, lg: 40 };
  const textSizes = { sm: 'text-base', md: 'text-xl', lg: 'text-2xl' };
  const px = iconSizes[size] || 32;

  return (
    <div className="flex items-center gap-2.5">
      {/* Brain SVG icon matching the logo */}
      <svg width={px} height={px} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="brainGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%"   stopColor="#00e5ff" />
            <stop offset="50%"  stopColor="#4f9ef8" />
            <stop offset="100%" stopColor="#a78bfa" />
          </linearGradient>
        </defs>
        {/* Brain outline */}
        <path
          d="M20 6C14 6 9 10.5 9 16.5C9 19 10 21.2 11.7 22.8C11.3 23.8 11 24.9 11 26C11 29.3 13.7 32 17 32H23C26.3 32 29 29.3 29 26C29 24.9 28.7 23.8 28.3 22.8C30 21.2 31 19 31 16.5C31 10.5 26 6 20 6Z"
          stroke="url(#brainGrad)" strokeWidth="1.8" fill="none" strokeLinecap="round"
        />
        {/* Neural network dots and lines inside brain */}
        <circle cx="16" cy="15" r="1.5" fill="url(#brainGrad)" />
        <circle cx="24" cy="13" r="1.5" fill="url(#brainGrad)" />
        <circle cx="22" cy="20" r="1.5" fill="url(#brainGrad)" />
        <circle cx="20" cy="27" r="1.5" fill="url(#brainGrad)" />
        {/* Connecting lines */}
        <line x1="16" y1="15" x2="24" y2="13" stroke="url(#brainGrad)" strokeWidth="1.2" strokeLinecap="round" />
        <line x1="24" y1="13" x2="22" y2="20" stroke="url(#brainGrad)" strokeWidth="1.2" strokeLinecap="round" />
        <line x1="22" y1="20" x2="16" y2="15" stroke="url(#brainGrad)" strokeWidth="1.2" strokeLinecap="round" />
        <line x1="22" y1="20" x2="20" y2="27" stroke="url(#brainGrad)" strokeWidth="1.2" strokeLinecap="round" />
        {/* Speech bubble tail */}
        <path d="M18 32L20 36L22 32" stroke="url(#brainGrad)" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>

      {/* Gradient text matching logo */}
      {!iconOnly && (
        <span className={`font-syne font-black ${textSizes[size]} tracking-tight`}>
          <span style={{
            background: 'linear-gradient(90deg, #00e5ff 0%, #4f9ef8 40%, #a78bfa 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            Brain
          </span>
          <span style={{
            background: 'linear-gradient(90deg, #4f9ef8 0%, #a78bfa 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            Nex
          </span>
        </span>
      )}
    </div>
  );
}
