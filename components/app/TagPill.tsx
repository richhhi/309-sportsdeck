import React from 'react';

interface TagPillProps {
  children: React.ReactNode;
  onClick?: () => void;
  active?: boolean;
}

export function TagPill({ children, onClick, active = false }: TagPillProps) {
  return (
    <span
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '3px 10px',
        borderRadius: 'var(--sd-radius-full)',
        background: active ? 'var(--sd-accent-muted)' : 'var(--sd-bg-elevated)',
        color: active ? 'var(--sd-accent)' : 'var(--sd-text-secondary)',
        fontSize: '12px',
        fontWeight: 500,
        fontFamily: 'var(--sd-font)',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all var(--sd-transition)',
        border: `1px solid ${active ? 'var(--sd-border-accent)' : 'transparent'}`,
      }}
      onMouseEnter={(e) => {
        if (onClick) {
          e.currentTarget.style.background = active ? 'var(--sd-accent-muted)' : 'var(--sd-bg-hover)';
        }
      }}
      onMouseLeave={(e) => {
        if (onClick) {
          e.currentTarget.style.background = active ? 'var(--sd-accent-muted)' : 'var(--sd-bg-elevated)';
        }
      }}
    >
      {children}
    </span>
  );
}
