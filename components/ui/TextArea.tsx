import React, { useState } from 'react';

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export function TextArea({
  label,
  error,
  helperText,
  style,
  ...props
}: TextAreaProps) {
  const [focused, setFocused] = useState(false);

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
      <textarea
        onFocus={(e) => { setFocused(true); props.onFocus?.(e); }}
        onBlur={(e) => { setFocused(false); props.onBlur?.(e); }}
        style={{
          background: 'var(--sd-bg-secondary)',
          border: `1px solid ${error ? 'var(--sd-danger)' : focused ? 'var(--sd-accent)' : 'var(--sd-border-strong)'}`,
          borderRadius: 'var(--sd-radius-md)',
          color: 'var(--sd-text-primary)',
          fontFamily: 'var(--sd-font)',
          fontSize: '14px',
          padding: '10px 12px',
          outline: 'none',
          resize: 'vertical',
          minHeight: '100px',
          width: '100%',
          transition: 'border-color var(--sd-transition)',
          ...style,
        }}
        {...props}
      />
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
