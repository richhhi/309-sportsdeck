import React from 'react';

interface AvatarProps {
  src?: string | null;
  alt?: string;
  name?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizeMap = {
  sm: 28,
  md: 36,
  lg: 44,
  xl: 64,
};

const fontSizeMap = {
  sm: 11,
  md: 13,
  lg: 16,
  xl: 22,
};

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function hashColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 45%, 40%)`;
}

export function Avatar({ src, alt, name, size = 'md' }: AvatarProps) {
  const px = sizeMap[size];
  const fs = fontSizeMap[size];

  if (src) {
    return (
      <img
        src={src}
        alt={alt || name || 'Avatar'}
        style={{
          width: px,
          height: px,
          borderRadius: '50%',
          objectFit: 'cover',
          flexShrink: 0,
        }}
      />
    );
  }

  const initials = name ? getInitials(name) : '?';
  const bg = name ? hashColor(name) : 'var(--sd-bg-elevated)';

  return (
    <div
      style={{
        width: px,
        height: px,
        borderRadius: '50%',
        background: bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: fs,
        fontWeight: 600,
        color: '#fff',
        fontFamily: 'var(--sd-font)',
        flexShrink: 0,
      }}
    >
      {initials}
    </div>
  );
}
