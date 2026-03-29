import React from 'react';

/**
 * Google "G" logo button for OAuth sign-in / sign-up.
 * Navigates the browser to /api/auth/google (full-page redirect).
 */
export function GoogleButton({ label = 'Continue with Google' }: { label?: string }) {
  const handleClick = () => {
    window.location.href = '/api/auth/google';
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '10px',
        width: '100%',
        padding: '10px 16px',
        border: '1px solid var(--sd-border)',
        borderRadius: 'var(--sd-radius-md)',
        background: 'var(--sd-bg-primary)',
        color: 'var(--sd-text-primary)',
        fontSize: '14px',
        fontWeight: 500,
        fontFamily: 'var(--sd-font)',
        cursor: 'pointer',
        transition: 'background 0.15s, border-color 0.15s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'var(--sd-bg-tertiary, var(--sd-bg-secondary))';
        e.currentTarget.style.borderColor = 'var(--sd-accent)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'var(--sd-bg-primary)';
        e.currentTarget.style.borderColor = 'var(--sd-border)';
      }}
    >
      {/* Google "G" logo – official brand colours */}
      <svg width="18" height="18" viewBox="0 0 48 48">
        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
        <path fill="#FBBC05" d="M10.53 28.59a14.5 14.5 0 0 1 0-9.18l-7.98-6.19a24.0 24.0 0 0 0 0 21.56l7.98-6.19z"/>
        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
      </svg>
      {label}
    </button>
  );
}

/**
 * Visual "or" divider line.
 */
export function OAuthDivider() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        margin: '20px 0',
      }}
    >
      <div style={{ flex: 1, height: '1px', background: 'var(--sd-border)' }} />
      <span
        style={{
          fontSize: '12px',
          color: 'var(--sd-text-tertiary)',
          fontFamily: 'var(--sd-font)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}
      >
        or
      </span>
      <div style={{ flex: 1, height: '1px', background: 'var(--sd-border)' }} />
    </div>
  );
}
