import React from 'react';

export const TonearmDefinitions: React.FC = () => (
  <defs>
    {/* 3D Directional Shadow for Plinth Mounts */}
    <filter id="cradle-deep-shadow" x="-40%" y="-40%" width="200%" height="200%">
      <feDropShadow dx="-3" dy="5" stdDeviation="3.5" floodColor="#000000" floodOpacity="0.85" />
    </filter>

    {/* Plinth Base Flange Radial Gradient */}
    <radialGradient id="plinth-flange-grad" cx="45%" cy="40%" r="55%">
      <stop offset="0%" stopColor="#464958" />
      <stop offset="50%" stopColor="#2A2C37" />
      <stop offset="85%" stopColor="#181921" />
      <stop offset="100%" stopColor="#0D0E12" />
    </radialGradient>

    {/* Machined Chrome/Steel Pillar Cylindrical Gradient (Creates 3D round cylinder effect) */}
    <linearGradient id="cradle-pillar-metal" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stopColor="#1E2028" />
      <stop offset="25%" stopColor="#434656" />
      <stop offset="48%" stopColor="#D2D5E4" />
      <stop offset="70%" stopColor="#6C6F82" />
      <stop offset="90%" stopColor="#2D2F3C" />
      <stop offset="100%" stopColor="#14151B" />
    </linearGradient>

    {/* Knurled Collar Texture Gradient */}
    <linearGradient id="collar-knurl-grad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stopColor="#2A2C38" />
      <stop offset="30%" stopColor="#5E6174" />
      <stop offset="50%" stopColor="#B0B3C4" />
      <stop offset="75%" stopColor="#4A4D5E" />
      <stop offset="100%" stopColor="#1E202A" />
    </linearGradient>

    {/* Rest Saddle Bracket Gradient */}
    <linearGradient id="cradle-bracket-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stopColor="#525567" />
      <stop offset="40%" stopColor="#2D2F3C" />
      <stop offset="100%" stopColor="#15161D" />
    </linearGradient>

    {/* Gimbal Base Outer Radial Gradient */}
    <radialGradient id="gimbal-base-radial" cx="48%" cy="46%" r="54%">
      <stop offset="0%" stopColor="#3C3E4D" />
      <stop offset="45%" stopColor="#232530" />
      <stop offset="80%" stopColor="#13141B" />
      <stop offset="100%" stopColor="#08090C" />
    </radialGradient>

    {/* Tonearm Wand Specular Tube Gradient */}
    <linearGradient id="wand-metallic-tube" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stopColor="#22232B" />
      <stop offset="20%" stopColor="#5E6070" />
      <stop offset="45%" stopColor="#E2E4F0" />
      <stop offset="68%" stopColor="#8C8E9F" />
      <stop offset="88%" stopColor="#3A3C49" />
      <stop offset="100%" stopColor="#181920" />
    </linearGradient>

    {/* Counterweight Heavy Metal Gradient */}
    <linearGradient id="counterweight-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stopColor="#555869" />
      <stop offset="30%" stopColor="#323440" />
      <stop offset="70%" stopColor="#1D1E26" />
      <stop offset="100%" stopColor="#0C0D11" />
    </linearGradient>

    {/* Cartridge Headshell Dark Obsidian Gradient */}
    <linearGradient id="cartridge-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stopColor="#2E303C" />
      <stop offset="45%" stopColor="#1A1B22" />
      <stop offset="100%" stopColor="#0A0B0E" />
    </linearGradient>

    {/* Needle Diamond Glow Filter */}
    <filter id="stylus-groove-glow-filter" x="-60%" y="-60%" width="220%" height="220%">
      <feGaussianBlur stdDeviation="2.4" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  </defs>
);
