import React, { useState } from 'react';
import Link from 'next/link';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { GoogleButton, OAuthDivider } from '../ui/GoogleButton';

interface LoginFormProps {
  onSubmit?: (email: string, password: string) => void;
  loading?: boolean;
  error?: string;
}

const MailIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2" /><path d="M22 7l-10 7L2 7" />
  </svg>
);

const LockIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" />
  </svg>
);

export function LoginForm({ onSubmit, loading = false, error }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit?.(email, password);
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        background: 'var(--sd-bg-secondary)',
        border: '1px solid var(--sd-border)',
        borderRadius: 'var(--sd-radius-xl)',
        padding: '32px',
        maxWidth: '380px',
        width: '100%',
      }}
    >
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '28px' }}>
        <span style={{ fontSize: '28px', display: 'block', marginBottom: '8px' }}>⚽</span>
        <h2
          style={{
            margin: 0,
            fontSize: '22px',
            fontWeight: 700,
            color: 'var(--sd-text-primary)',
            fontFamily: 'var(--sd-font)',
          }}
        >
          Welcome back
        </h2>
        <p
          style={{
            margin: '6px 0 0',
            fontSize: '14px',
            color: 'var(--sd-text-tertiary)',
            fontFamily: 'var(--sd-font)',
          }}
        >
          Log in to SportsDeck
        </p>
      </div>

      {/* Error */}
      {error && (
        <div
          style={{
            padding: '10px 14px',
            borderRadius: 'var(--sd-radius-md)',
            background: 'var(--sd-danger-muted)',
            color: 'var(--sd-danger)',
            fontSize: '13px',
            fontFamily: 'var(--sd-font)',
            marginBottom: '16px',
          }}
        >
          {error}
        </div>
      )}

      {/* Inputs */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
        <Input
          label="Email"
          type="email"
          placeholder="you@example.com"
          leftIcon={<MailIcon />}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Input
          label="Password"
          type="password"
          placeholder="••••••••"
          leftIcon={<LockIcon />}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      {/* Submit */}
      <Button variant="primary" fullWidth loading={loading} type="submit">
        Log In
      </Button>

      <OAuthDivider />
      <GoogleButton label="Sign in with Google" />

      {/* Footer */}
      <p
        style={{
          textAlign: 'center',
          marginTop: '20px',
          fontSize: '13px',
          color: 'var(--sd-text-tertiary)',
          fontFamily: 'var(--sd-font)',
        }}
      >
        Don&apos;t have an account?{' '}
        <Link
          href="/signup"
          style={{
            color: 'var(--sd-accent)',
            textDecoration: 'none',
            fontWeight: 500,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
          onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
        >
          Sign up
        </Link>
      </p>
    </form>
  );
}
