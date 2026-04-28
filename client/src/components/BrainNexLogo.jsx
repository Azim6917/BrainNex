import React from 'react';


export default function BrainNexLogo({ size = 'md', iconOnly = false }) {
  const imgSizes = { sm: 22, md: 28, lg: 36 };
  const textSizes = { sm: 'text-base', md: 'text-xl', lg: 'text-2xl' };
  const px = imgSizes[size] || 28;

  return (
    <div className="flex items-center gap-2">
      <img
        src="/images/BrainNex_logo.png"
        alt="BrainNex"
        width={px}
        height={px}
        className="object-contain flex-shrink-0"
        style={{ imageRendering: 'auto' }}
      />
      {!iconOnly && (
        <span
          className={`font-syne font-black ${textSizes[size]} tracking-tight`}
          style={{
            background: 'linear-gradient(90deg, #00e5ff 0%, #4f9ef8 45%, #a78bfa 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          BrainNex
        </span>
      )}
    </div>
  );
}
