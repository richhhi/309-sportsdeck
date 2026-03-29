import React from 'react';
import { Avatar } from '../ui/Avatar';
import { TagPill } from './TagPill';

interface ThreadCardProps {
  title: string;
  author: string;
  authorAvatar?: string;
  tags?: string[];
  replyCount: number;
  timeAgo: string;
  sentiment?: 'POSITIVE' | 'NEGATIVE' | 'MIXED' | null;
  isLocked?: boolean;
  isPinned?: boolean;
  isAiFlagged?: boolean;
  preview?: string;
  closesAt?: string;
  teamName?: string;
  teamCrest?: string;
  onAuthorClick?: (e: React.MouseEvent) => void;
}

const sentimentColors: Record<string, { color: string; label: string }> = {
  POSITIVE: { color: 'var(--sd-success)', label: '😊' },
  NEGATIVE: { color: 'var(--sd-danger)', label: '😤' },
  MIXED: { color: 'var(--sd-warning)', label: '🤔' },
};

export function ThreadCard({
  title,
  author,
  authorAvatar,
  tags = [],
  replyCount,
  timeAgo,
  sentiment,
  isLocked = false,
  isPinned = false,
  isAiFlagged = false,
  preview,
  closesAt,
  teamName,
  teamCrest,
  onAuthorClick,
}: ThreadCardProps) {
  return (
    <div
      style={{
        background: 'var(--sd-bg-secondary)',
        border: '1px solid var(--sd-border)',
        borderRadius: 'var(--sd-radius-lg)',
        padding: '16px',
        cursor: 'pointer',
        transition: 'all var(--sd-transition)',
        borderLeft: isPinned ? '3px solid var(--sd-accent)' : undefined,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--sd-border-strong)';
        e.currentTarget.style.background = 'var(--sd-bg-tertiary)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--sd-border)';
        e.currentTarget.style.background = 'var(--sd-bg-secondary)';
      }}
    >
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
        <div
          onClick={onAuthorClick ? (e) => {
            e.preventDefault();
            e.stopPropagation();
            onAuthorClick(e);
          } : undefined}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            cursor: onAuthorClick ? 'pointer' : 'default',
          }}
          className={onAuthorClick ? "hover:opacity-80 transition-opacity" : ""}
        >
          <Avatar src={authorAvatar} name={author} size="sm" />
          <span
            style={{
              fontSize: '13px',
              fontWeight: 500,
              color: 'var(--sd-text-secondary)',
              fontFamily: 'var(--sd-font)',
            }}
            className={onAuthorClick ? "hover:underline" : ""}
          >
            {author}
          </span>
        </div>
        <span style={{ fontSize: '12px', color: 'var(--sd-text-tertiary)', fontFamily: 'var(--sd-font)' }}>
          · {timeAgo} {closesAt && `(Closes ${closesAt})`}
        </span>
        {isLocked && (
          <span style={{ fontSize: '12px', color: 'var(--sd-text-tertiary)' }} title="Locked">
            🔒
          </span>
        )}
        {isAiFlagged && (
          <span
            style={{
              fontSize: '11px',
              padding: '1px 6px',
              borderRadius: 'var(--sd-radius-full)',
              background: 'var(--sd-danger-muted)',
              color: 'var(--sd-danger)',
              fontWeight: 600,
              fontFamily: 'var(--sd-font)',
            }}
          >
            AI Flagged
          </span>
        )}
      </div>

      {/* Title */}
      <h3
        style={{
          margin: 0,
          fontSize: '16px',
          fontWeight: 600,
          color: 'var(--sd-text-primary)',
          fontFamily: 'var(--sd-font)',
          lineHeight: 1.4,
        }}
      >
        {title}
      </h3>

      {/* Preview text */}
      {preview && (
        <p
          style={{
            margin: '6px 0 0',
            fontSize: '14px',
            color: 'var(--sd-text-secondary)',
            fontFamily: 'var(--sd-font)',
            lineHeight: 1.5,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {preview}
        </p>
      )}

      {/* Footer */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginTop: '12px',
          flexWrap: 'wrap',
        }}
      >
        {teamName && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'var(--sd-bg-elevated)',
              border: '1px solid var(--sd-border)',
              padding: '2px 8px',
              borderRadius: '12px',
              fontSize: '12px',
              fontWeight: 500,
              color: 'var(--sd-text-secondary)',
              fontFamily: 'var(--sd-font)',
            }}
          >
            {teamCrest && (
              <img
                src={teamCrest}
                alt={teamName}
                style={{ width: '14px', height: '14px', objectFit: 'contain' }}
              />
            )}
            {teamName}
          </div>
        )}

        {tags.map((tag) => (
          <TagPill key={tag}>{tag}</TagPill>
        ))}

        <div style={{ flex: 1 }} />

        {/* Reply count */}
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '13px',
            color: 'var(--sd-text-tertiary)',
            fontFamily: 'var(--sd-font)',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          {replyCount}
        </span>

        {/* Sentiment */}
        {sentiment && sentimentColors[sentiment] && (
          <span
            style={{ fontSize: '14px' }}
            title={`Sentiment: ${sentiment.toLowerCase()}`}
          >
            {sentimentColors[sentiment].label}
          </span>
        )}
      </div>
    </div>
  );
}
