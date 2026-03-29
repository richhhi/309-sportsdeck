import React from 'react';

interface CardProps {
  children: React.ReactNode;
  padding?: 'sm' | 'md' | 'lg';
  hoverable?: boolean;
  style?: React.CSSProperties;
  onClick?: () => void;
}

const paddingMap = {
  sm: '12px',
  md: '16px',
  lg: '20px',
};

export function Card({ children, padding = 'md', hoverable = false, style, onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      style={{
        background: 'var(--sd-bg-secondary)',
        border: '1px solid var(--sd-border)',
        borderRadius: 'var(--sd-radius-lg)',
        padding: paddingMap[padding],
        transition: 'all var(--sd-transition)',
        cursor: hoverable || onClick ? 'pointer' : undefined,
        ...style,
      }}
      onMouseEnter={(e) => {
        if (hoverable || onClick) {
          e.currentTarget.style.borderColor = 'var(--sd-border-strong)';
          e.currentTarget.style.background = 'var(--sd-bg-tertiary)';
        }
      }}
      onMouseLeave={(e) => {
        if (hoverable || onClick) {
          e.currentTarget.style.borderColor = 'var(--sd-border)';
          e.currentTarget.style.background = 'var(--sd-bg-secondary)';
        }
      }}
    >
      {children}
    </div>
  );
}
