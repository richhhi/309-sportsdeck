import React, { useState } from 'react';

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  inputSize?: 'sm' | 'md' | 'lg';
}

const sizeMap = {
  sm: { height: '34px', fontSize: '13px', px: '14px' },
  md: { height: '40px', fontSize: '14px', px: '16px' },
  lg: { height: '46px', fontSize: '15px', px: '18px' },
};

export function Input({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  inputSize = 'md',
  style,
  ...props
}: InputProps) {
  const [focused, setFocused] = useState(false);
  const sizes = sizeMap[inputSize];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
      {label && (
        <label
          style={{
            fontSize: '13px',
            fontWeight: 500,
            color: 'var(--sd-text-secondary)',
            fontFamily: 'var(--sd-font)',
          }}
        >
          {label}
        </label>
      )}
      <div
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          background: 'var(--sd-bg-secondary)',
          border: `1px solid ${error ? 'var(--sd-danger)' : focused ? 'var(--sd-accent)' : 'var(--sd-border-strong)'}`,
          borderRadius: 'var(--sd-radius-md)',
          transition: 'border-color var(--sd-transition)',
          height: sizes.height,
        }}
      >
        {leftIcon && (
          <span
            style={{
              display: 'flex',
              alignItems: 'center',
              paddingLeft: '12px',
              color: 'var(--sd-text-tertiary)',
              fontSize: '16px',
            }}
          >
            {leftIcon}
          </span>
        )}
        <input
          onFocus={(e) => { setFocused(true); props.onFocus?.(e); }}
          onBlur={(e) => { setFocused(false); props.onBlur?.(e); }}
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: 'var(--sd-text-primary)',
            fontFamily: 'var(--sd-font)',
            fontSize: sizes.fontSize,
            paddingTop: 0,
            paddingBottom: 0,
            paddingLeft: leftIcon ? '8px' : sizes.px,
            paddingRight: rightIcon ? '8px' : sizes.px,
            width: '100%',
            ...style,
          }}
          {...props}
        />
        {rightIcon && (
          <span
            style={{
              display: 'flex',
              alignItems: 'center',
              paddingRight: '12px',
              color: 'var(--sd-text-tertiary)',
              fontSize: '16px',
            }}
          >
            {rightIcon}
          </span>
        )}
      </div>
      {(error || helperText) && (
        <span
          style={{
            fontSize: '12px',
            color: error ? 'var(--sd-danger)' : 'var(--sd-text-tertiary)',
            fontFamily: 'var(--sd-font)',
          }}
        >
          {error || helperText}
        </span>
      )}
    </div>
  );
}
