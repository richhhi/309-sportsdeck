import React from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: `
    background: var(--sd-accent);
    color: var(--sd-text-inverse);
    border: none;
  `,
  secondary: `
    background: transparent;
    color: var(--sd-text-primary);
    border: 1px solid var(--sd-border-strong);
  `,
  ghost: `
    background: transparent;
    color: var(--sd-text-secondary);
    border: none;
  `,
  danger: `
    background: var(--sd-danger);
    color: #fff;
    border: none;
  `,
};

const hoverStyles: Record<ButtonVariant, string> = {
  primary: 'var(--sd-accent-hover)',
  secondary: 'var(--sd-bg-hover)',
  ghost: 'var(--sd-bg-tertiary)',
  danger: 'var(--sd-danger-hover)',
};

const sizeStyles: Record<ButtonSize, React.CSSProperties> = {
  sm: { padding: '6px 12px', fontSize: '13px', height: '32px' },
  md: { padding: '8px 16px', fontSize: '14px', height: '38px' },
  lg: { padding: '10px 24px', fontSize: '15px', height: '44px' },
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  fullWidth = false,
  children,
  disabled,
  style,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <button
      disabled={isDisabled}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        borderRadius: 'var(--sd-radius-md)',
        fontFamily: 'var(--sd-font)',
        fontWeight: 600,
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        opacity: isDisabled ? 0.5 : 1,
        transition: 'all var(--sd-transition)',
        width: fullWidth ? '100%' : undefined,
        whiteSpace: 'nowrap',
        ...sizeStyles[size],
        ...style,
      }}
      onMouseEnter={(e) => {
        if (!isDisabled) {
          if (variant === 'secondary') {
            e.currentTarget.style.background = hoverStyles[variant];
            e.currentTarget.style.borderColor = 'var(--sd-border-strong)';
          } else {
            e.currentTarget.style.background = hoverStyles[variant];
          }
        }
      }}
      onMouseLeave={(e) => {
        if (variant === 'primary') e.currentTarget.style.background = 'var(--sd-accent)';
        else if (variant === 'secondary') {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.borderColor = 'var(--sd-border-strong)';
        }
        else if (variant === 'ghost') e.currentTarget.style.background = 'transparent';
        else if (variant === 'danger') e.currentTarget.style.background = 'var(--sd-danger)';
      }}
      // Apply variant styles via CSS string parsed manually
      ref={(el) => {
        if (el) {
          const styles = variantStyles[variant as ButtonVariant];
          const pairs = styles?.match(/[\w-]+:\s*[^;]+/g);
          pairs?.forEach((pair) => {
            const [prop, val] = pair.split(':').map((s) => s.trim());
            const camel = prop.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
            (el.style as unknown as Record<string, string>)[camel] = val;
          });
        }
      }}
      {...props}
    >
      {loading ? (
        <span
          style={{
            width: '16px',
            height: '16px',
            border: '2px solid currentColor',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: 'spin 0.6s linear infinite',
            display: 'inline-block',
          }}
        />
      ) : icon ? (
        <span style={{ display: 'flex', alignItems: 'center', fontSize: '16px' }}>
          {icon}
        </span>
      ) : null}
      {children}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </button>
  );
}
