import React, { useState, useEffect, useRef } from 'react';

export interface SearchQuery {
  title?: string;
  author?: string;
  team?: string;
}

interface SearchBarProps {
  placeholder?: string;
  onSearch?: (query: SearchQuery) => void;
  filters?: string[];
  activeFilter?: string;
  onFilterChange?: (filter: string) => void;
  allowCustomFilter?: boolean;
  initialQuery?: SearchQuery;
}

const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

export function SearchBar({
  placeholder = 'Search threads, teams, or users...',
  onSearch,
  filters,
  activeFilter,
  onFilterChange,
  allowCustomFilter = false,
  initialQuery = {},
}: SearchBarProps) {
  const [title, setTitle] = useState(initialQuery.title || '');
  const [author, setAuthor] = useState(initialQuery.author || '');
  const [team, setTeam] = useState(initialQuery.team || '');

  const [focused, setFocused] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [isEnteringCustomTag, setIsEnteringCustomTag] = useState(false);
  const [customTagInput, setCustomTagInput] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowFilters(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleFireSearch = (t: string, a: string, tm: string) => {
    onSearch?.({ title: t, author: a, team: tm });
  };

  return (
    <div ref={wrapperRef} style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', maxWidth: '480px', position: 'relative' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'var(--sd-bg-secondary)',
          border: `1px solid ${focused ? 'var(--sd-accent)' : 'var(--sd-border-strong)'}`,
          borderRadius: 'var(--sd-radius-full)',
          padding: '0 16px',
          height: '42px',
          transition: 'border-color var(--sd-transition)',
        }}
      >
        <span style={{ color: 'var(--sd-text-tertiary)', display: 'flex' }}>
          <SearchIcon />
        </span>
        <button
          onClick={() => setShowFilters(!showFilters)}
          style={{
            background: 'var(--sd-bg-elevated)',
            border: '1px solid var(--sd-border)',
            borderRadius: 'var(--sd-radius-sm)',
            color: 'var(--sd-text-secondary)',
            fontSize: '12px',
            fontFamily: 'var(--sd-font)',
            cursor: 'pointer',
            padding: '4px 8px',
            marginRight: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          Filters <span style={{ fontSize: '10px' }}>▼</span>
        </button>
        <input
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            handleFireSearch(e.target.value, author, team);
          }}
          onFocus={() => {
            setFocused(true);
          }}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: 'var(--sd-text-primary)',
            fontSize: '14px',
            fontFamily: 'var(--sd-font)',
          }}
        />
        {title && (
          <button
            onClick={() => {
              setTitle('');
              setAuthor('');
              setTeam('');
              handleFireSearch('', '', '');
            }}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--sd-text-tertiary)',
              cursor: 'pointer',
              fontSize: '16px',
              padding: 0,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            ✕
          </button>
        )}
      </div>

      {/* Active Filter Chips */}
      {(author || team) && (
        <div style={{ display: 'flex', gap: '8px', paddingLeft: '8px', flexWrap: 'wrap' }}>
          {author && (
            <span style={{ fontSize: '11px', background: 'var(--sd-accent-muted)', color: 'var(--sd-accent)', padding: '2px 8px', borderRadius: '4px' }}>
              Author: <strong>{author}</strong>
              <button 
                onClick={() => { setAuthor(''); handleFireSearch(title, '', team); }}
                style={{ background: 'none', border: 'none', color: 'inherit', marginLeft: '4px', cursor: 'pointer' }}
              >×</button>
            </span>
          )}
          {team && (
            <span style={{ fontSize: '11px', background: 'var(--sd-accent-muted)', color: 'var(--sd-accent)', padding: '2px 8px', borderRadius: '4px' }}>
              Team: <strong>{team}</strong>
              <button 
                onClick={() => { setTeam(''); handleFireSearch(title, author, ''); }}
                style={{ background: 'none', border: 'none', color: 'inherit', marginLeft: '4px', cursor: 'pointer' }}
              >×</button>
            </span>
          )}
        </div>
      )}

      {showFilters && (
        <div style={{
          position: 'absolute',
          top: '48px',
          left: 0,
          right: 0,
          background: 'var(--sd-bg-primary)',
          border: '1px solid var(--sd-border)',
          borderRadius: 'var(--sd-radius-md)',
          padding: '16px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          zIndex: 50,
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--sd-text-primary)' }}>
            Advanced Filters
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '13px', color: 'var(--sd-text-secondary)' }}>
              Author Username
              <input 
                type="text"
                value={author}
                onChange={(e) => {
                  setAuthor(e.target.value);
                  handleFireSearch(title, e.target.value, team);
                }}
                style={{ background: 'var(--sd-bg-secondary)', border: '1px solid var(--sd-border)', borderRadius: 'var(--sd-radius-sm)', padding: '6px 8px', fontSize: '13px', color: 'var(--sd-text-primary)' }}
                placeholder="e.g. johndoe123"
              />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '13px', color: 'var(--sd-text-secondary)' }}>
              Team Name
              <input 
                type="text"
                value={team}
                onChange={(e) => {
                  setTeam(e.target.value);
                  handleFireSearch(title, author, e.target.value);
                }}
                style={{ background: 'var(--sd-bg-secondary)', border: '1px solid var(--sd-border)', borderRadius: 'var(--sd-radius-sm)', padding: '6px 8px', fontSize: '13px', color: 'var(--sd-text-primary)' }}
                placeholder="e.g. Arsenal"
              />
            </label>
          </div>
        </div>
      )}

      {/* Filter pills */}
      {filters && filters.length > 0 && (
        <div style={{ display: 'flex', gap: '6px', paddingLeft: '4px', flexWrap: 'wrap', alignItems: 'center' }}>
          {filters.map((filter) => {
            const isActive = activeFilter === filter;
            return (
              <button
                key={filter}
                onClick={() => onFilterChange?.(filter)}
                style={{
                  padding: '4px 12px',
                  borderRadius: 'var(--sd-radius-full)',
                  border: `1px solid ${isActive ? 'var(--sd-accent)' : 'var(--sd-border)'}`,
                  background: isActive ? 'var(--sd-accent-muted)' : 'transparent',
                  color: isActive ? 'var(--sd-accent)' : 'var(--sd-text-secondary)',
                  fontSize: '12px',
                  fontWeight: 500,
                  fontFamily: 'var(--sd-font)',
                  cursor: 'pointer',
                  transition: 'all var(--sd-transition)',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.background = 'var(--sd-bg-elevated)';
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.background = 'transparent';
                }}
              >
                {filter}
              </button>
            );
          })}
          
          {/* Support for a custom active filter that isn't in the predefined list */}
          {activeFilter && !filters.includes(activeFilter) && (
            <button
              onClick={() => onFilterChange?.("All Topics")}
              style={{
                padding: '4px 12px',
                borderRadius: 'var(--sd-radius-full)',
                border: '1px solid var(--sd-accent)',
                background: 'var(--sd-accent-muted)',
                color: 'var(--sd-accent)',
                fontSize: '12px',
                fontWeight: 500,
                fontFamily: 'var(--sd-font)',
                cursor: 'pointer',
                transition: 'all var(--sd-transition)',
              }}
            >
              {activeFilter} ✕
            </button>
          )}

          {/* Custom Tag Input Toggle */}
          {allowCustomFilter && (!activeFilter || filters.includes(activeFilter) || activeFilter === 'All Topics') && (
            isEnteringCustomTag ? (
              <form 
                onSubmit={(e) => { 
                  e.preventDefault(); 
                  if (customTagInput.trim()) {
                    onFilterChange?.(customTagInput.trim());
                  }
                  setIsEnteringCustomTag(false);
                  setCustomTagInput('');
                }}
                style={{ display: 'flex' }}
              >
                <input
                  autoFocus
                  value={customTagInput}
                  onChange={e => setCustomTagInput(e.target.value)}
                  onBlur={() => {
                    if (customTagInput.trim()) {
                      onFilterChange?.(customTagInput.trim());
                    }
                    setIsEnteringCustomTag(false);
                    setCustomTagInput('');
                  }}
                  placeholder="Tag name..."
                  style={{
                    padding: '4px 12px',
                    borderRadius: 'var(--sd-radius-full)',
                    border: '1px solid var(--sd-border-strong)',
                    background: 'var(--sd-bg-primary)',
                    color: 'var(--sd-text-primary)',
                    fontSize: '12px',
                    fontFamily: 'var(--sd-font)',
                    outline: 'none',
                    width: '100px',
                  }}
                />
              </form>
            ) : (
              <button
                 type="button"
                 onClick={() => setIsEnteringCustomTag(true)}
                 style={{
                   padding: '4px 12px',
                   borderRadius: 'var(--sd-radius-full)',
                   border: '1px dashed var(--sd-border-strong)',
                   background: 'transparent',
                   color: 'var(--sd-text-secondary)',
                   fontSize: '12px',
                   fontWeight: 500,
                   fontFamily: 'var(--sd-font)',
                   cursor: 'pointer',
                   transition: 'all var(--sd-transition)',
                 }}
                 onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--sd-text-primary)'; e.currentTarget.style.borderColor = 'var(--sd-text-primary)'; }}
                 onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--sd-text-secondary)'; e.currentTarget.style.borderColor = 'var(--sd-border-strong)'; }}
              >
                + Custom Tag
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
}
