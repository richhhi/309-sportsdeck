import React from 'react';

type BadgeVariant = 'default' | 'live' | 'success' | 'warning' | 'danger' | 'accent';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  dot?: boolean;
}

const variantMap: Record<BadgeVariant, { bg: string; color: string; dotColor?: string }> = {
  default: {
    bg: 'var(--sd-bg-elevated)',
    color: 'var(--sd-text-secondary)',
  },
  live: {
    bg: 'var(--sd-live-muted)',
    color: 'var(--sd-live)',
    dotColor: 'var(--sd-live)',
  },
  success: {
    bg: 'var(--sd-success-muted)',
    color: 'var(--sd-success)',
  },
  warning: {
    bg: 'var(--sd-warning-muted)',
    color: 'var(--sd-warning)',
  },
  danger: {
    bg: 'var(--sd-danger-muted)',
    color: 'var(--sd-danger)',
  },
  accent: {
    bg: 'var(--sd-accent-muted)',
    color: 'var(--sd-accent)',
  },
};

export function Badge({ children, variant = 'default', dot = false }: BadgeProps) {
  const v = variantMap[variant];

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '3px 10px',
        borderRadius: 'var(--sd-radius-full)',
        background: v.bg,
        color: v.color,
        fontSize: '12px',
        fontWeight: 600,
        fontFamily: 'var(--sd-font)',
        whiteSpace: 'nowrap',
        textTransform: 'uppercase',
        letterSpacing: '0.3px',
      }}
    >
      {dot && (
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: v.dotColor || v.color,
            animation: variant === 'live' ? 'pulse 1.5s ease-in-out infinite' : undefined,
          }}
        />
      )}
      {children}
      {variant === 'live' && (
        <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }`}</style>
      )}
    </span>
  );
}
