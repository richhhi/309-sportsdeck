import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';

interface NavBarProps {
  username?: string;
  email?: string;
  avatarUrl?: string;
  userId?: string;
  isAdmin?: boolean;
  onLogin?: () => void;
  onLogout?: () => void;
  onSearch?: (query: string) => void;
}

const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const UserIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
  </svg>
);

const DashboardIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
  </svg>
);

const LogoutIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

const SunIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
  </svg>
);

const MoonIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);


export function NavBar({ username, email, avatarUrl, userId, isAdmin, onLogin, onLogout, onSearch }: NavBarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const menuRef = useRef<HTMLDivElement>(null);

  // Load theme from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'dark' | 'light' | null;
    if (savedTheme) {
      setTheme(savedTheme);
      if (savedTheme === 'light') {
        document.documentElement.classList.add('light-mode');
      }
    } else if (window.matchMedia('(prefers-color-scheme: light)').matches) {
      setTheme('light');
      document.documentElement.classList.add('light-mode');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    if (newTheme === 'light') {
      document.documentElement.classList.add('light-mode');
    } else {
      document.documentElement.classList.remove('light-mode');
    }
  };


  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  const menuItemStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '8px 14px',
    fontSize: '13px',
    fontWeight: 500,
    color: 'var(--sd-text-secondary)',
    textDecoration: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    border: 'none',
    background: 'none',
    width: '100%',
    textAlign: 'left' as const,
    fontFamily: 'var(--sd-font)',
  };

  return (
    <nav
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        height: '56px',
        background: 'var(--sd-bg-secondary)',
        borderBottom: '1px solid var(--sd-border)',
        fontFamily: 'var(--sd-font)',
      }}
    >
      {/* Logo */}
      <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '20px' }}>⚽</span>
        <span style={{ fontSize: '16px', fontWeight: 800, color: 'var(--sd-text-primary)', letterSpacing: '-0.5px' }}>
          Sports<span style={{ color: 'var(--sd-accent)' }}>Deck</span>
        </span>
      </Link>

      {/* Nav Links */}
      <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
        {[
          { name: 'Feed', href: '/' },
          { name: 'Matches', href: '/matches' },
          { name: 'Standings', href: '/standings' },
          { name: 'Forums', href: '/threads' },
        ].map((link) => (
          <Link
            key={link.name}
            href={link.href}
            style={{
              color: 'var(--sd-text-secondary)',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: 500,
              transition: 'color var(--sd-transition)',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--sd-text-primary)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--sd-text-secondary)')}
          >
            {link.name}
          </Link>
        ))}
      </div>

      {/* User */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        {/* User or Login */}
        {username ? (
          <div ref={menuRef} style={{ position: 'relative' }}>
            <div
              onClick={() => setMenuOpen((v) => !v)}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
            >
              <Avatar src={avatarUrl} name={username} size="sm" />
              <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--sd-text-primary)' }}>
                {username}
              </span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                style={{ transition: 'transform 0.2s', transform: menuOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </div>

            {/* Dropdown Menu */}
            {menuOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  right: 0,
                  minWidth: '220px',
                  background: 'var(--sd-bg-secondary)',
                  border: '1px solid var(--sd-border)',
                  borderRadius: '12px',
                  padding: '6px',
                  boxShadow: '0 8px 30px rgba(0,0,0,0.25)',
                  zIndex: 50,
                  animation: 'fadeIn 0.15s ease',
                }}
              >
                {/* User Info Header */}
                <div style={{
                  padding: '10px 14px 10px',
                  borderBottom: '1px solid var(--sd-border)',
                  marginBottom: '4px',
                }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--sd-text-primary)' }}>
                    {username}
                  </div>
                  {email && (
                    <div style={{ fontSize: '12px', color: 'var(--sd-text-tertiary)', marginTop: '2px' }}>
                      {email}
                    </div>
                  )}
                </div>

                {/* Menu Items */}
                <Link
                  href={`/profile/${userId}`}
                  style={menuItemStyle}
                  onClick={() => setMenuOpen(false)}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--sd-bg-tertiary)'; e.currentTarget.style.color = 'var(--sd-text-primary)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--sd-text-secondary)'; }}
                >
                  <UserIcon /> Profile
                </Link>

                {isAdmin && (
                  <Link
                    href="/dashboard"
                    style={menuItemStyle}
                    onClick={() => setMenuOpen(false)}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--sd-bg-tertiary)'; e.currentTarget.style.color = 'var(--sd-text-primary)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--sd-text-secondary)'; }}
                  >
                    <DashboardIcon /> Dashboard
                  </Link>
                )}

                <div style={{ height: '1px', background: 'var(--sd-border)', margin: '4px 0' }} />

                <button
                  style={menuItemStyle}
                  onClick={toggleTheme}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--sd-bg-tertiary)'; e.currentTarget.style.color = 'var(--sd-text-primary)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--sd-text-secondary)'; }}
                >
                  {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
                  {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                </button>

                <div style={{ height: '1px', background: 'var(--sd-border)', margin: '4px 0' }} />

                <button
                  style={{ ...menuItemStyle, color: 'var(--sd-danger, #e53e3e)' }}
                  onClick={() => { setMenuOpen(false); onLogout?.(); }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--sd-bg-tertiary)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
                >
                  <LogoutIcon /> Log out
                </button>

                <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }`}</style>
              </div>
            )}
          </div>
        ) : (
          <Button variant="primary" size="sm" onClick={onLogin}>
            Login
          </Button>
        )}
      </div>
    </nav>
  );
}
