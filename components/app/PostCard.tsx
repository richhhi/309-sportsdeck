import React from 'react';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';
import { useAuth } from '../AuthProvider';

interface PostCardProps {
  id?: string;
  author: string;
  authorAvatar?: string;
  content: string;
  translatedContent?: string;
  isTranslated?: boolean;
  onTranslateToggle?: () => void;
  onAuthorClick?: (e: React.MouseEvent) => void;
  timeAgo: string;
  isHidden?: boolean;
  isAiFlagged?: boolean;
  isEdited?: boolean;
  isAuthor?: boolean;
  onEdit?: (newContent: string) => void;
  onDelete?: () => void;
  onReport?: () => void;
  versions?: any[];
}

export function PostCard({
  id,
  author,
  authorAvatar,
  content,
  translatedContent,
  isTranslated = false,
  onTranslateToggle,
  timeAgo,
  isHidden = false,
  isAiFlagged = false,
  isEdited = false,
  isAuthor = false,
  onEdit,
  onDelete,
  onReport,
  onAuthorClick,
  versions,
}: PostCardProps) {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = React.useState(false);
  const [editVal, setEditVal] = React.useState(content);
  const [showHistory, setShowHistory] = React.useState(false);

  const displayContent = isTranslated && translatedContent ? translatedContent : content;

  if (isEditing) {
    return (
      <div style={{ padding: '16px 0', borderBottom: '1px solid var(--sd-border)' }}>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
          <Avatar src={authorAvatar} name={author} size="sm" />
          <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--sd-text-primary)' }}>Editing Reply...</span>
        </div>
        <textarea
          value={editVal}
          onChange={(e) => setEditVal(e.target.value)}
          style={{ width: '100%', padding: '12px', minHeight: '80px', borderRadius: 'var(--sd-radius-md)', border: '1px solid var(--sd-border)', background: 'var(--sd-bg-primary)', color: 'var(--sd-text-primary)', fontFamily: 'var(--sd-font)', fontSize: '15px' }}
        />
        <div style={{ display: 'flex', gap: '8px', marginTop: '8px', justifyContent: 'flex-end' }}>
          <Button variant="secondary" onClick={() => { setIsEditing(false); setEditVal(content); }}>Cancel</Button>
          <Button variant="primary" onClick={() => {
            if (onEdit) onEdit(editVal);
            setIsEditing(false);
          }}>Save</Button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        gap: '12px',
        padding: '16px 0',
        borderBottom: '1px solid var(--sd-border)',
        opacity: isHidden ? 0.4 : 1,
      }}
    >
      <div
        onClick={onAuthorClick ? (e) => {
          e.preventDefault();
          e.stopPropagation();
          onAuthorClick(e);
        } : undefined}
        style={{ cursor: onAuthorClick ? 'pointer' : 'default' }}
        className={onAuthorClick ? "hover:opacity-80 transition-opacity" : ""}
      >
        <Avatar src={authorAvatar} name={author} size="sm" />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              onClick={onAuthorClick ? (e) => {
                e.preventDefault();
                e.stopPropagation();
                onAuthorClick(e);
              } : undefined}
              style={{
                fontSize: '14px',
                fontWeight: 600,
                color: 'var(--sd-text-primary)',
                fontFamily: 'var(--sd-font)',
                cursor: onAuthorClick ? 'pointer' : 'default',
              }}
              className={onAuthorClick ? "hover:underline" : ""}
            >
              {author}
            </span>
            <span style={{ fontSize: '12px', color: 'var(--sd-text-tertiary)', fontFamily: 'var(--sd-font)' }}>
              {timeAgo}
            </span>
            {isEdited && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <span
                  onClick={() => { if (versions && versions.length > 0) setShowHistory(!showHistory); }}
                  style={{
                    fontSize: '11px',
                    color: 'var(--sd-text-tertiary)',
                    fontStyle: 'italic',
                    fontFamily: 'var(--sd-font)',
                    cursor: versions && versions.length > 0 ? 'pointer' : 'default',
                    textDecoration: versions && versions.length > 0 ? 'underline' : 'none'
                  }}
                  title={versions && versions.length > 0 ? "Click to view edit history" : undefined}
                >
                  (edited)
                </span>
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

          {/* Post Actions Menu */}
          <div style={{ display: 'flex', gap: '8px' }}>
            {!isHidden && onTranslateToggle && (
              <button
                onClick={onTranslateToggle}
                style={{ fontSize: '12px', background: 'none', border: 'none', color: 'var(--sd-accent)', cursor: 'pointer', fontFamily: 'var(--sd-font)' }}
              >
                {isTranslated ? "Show Original" : "Translate to English"}
              </button>
            )}
            {isAuthor && onEdit && (
              <button
                onClick={() => {
                  setIsEditing(true);
                  setEditVal(content);
                }}
                style={{ fontSize: '12px', background: 'none', border: 'none', color: 'var(--sd-text-secondary)', cursor: 'pointer', fontFamily: 'var(--sd-font)' }}
              >
                Edit
              </button>
            )}
            {(isAuthor || user?.role === 'ADMIN') && onDelete && (
              <button
                onClick={onDelete}
                style={{ fontSize: '12px', background: 'none', border: 'none', color: 'var(--sd-danger)', cursor: 'pointer', fontFamily: 'var(--sd-font)' }}
              >
                Delete
              </button>
            )}
            {user && !isAuthor && onReport && (
              <button
                onClick={onReport}
                style={{ fontSize: '12px', background: 'none', border: 'none', color: 'var(--sd-text-secondary)', cursor: 'pointer', fontFamily: 'var(--sd-font)' }}
              >
                Report
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div>
          <p
            style={{
              margin: 0,
              fontSize: '15px',
              color: 'var(--sd-text-secondary)',
              fontFamily: 'var(--sd-font)',
              lineHeight: 1.6,
              wordBreak: 'break-word',
            }}
          >
            {isHidden ? '[This comment has been hidden by a moderator]' : displayContent}
          </p>

          {showHistory && versions && versions.length > 0 && (
            <div style={{ marginTop: '12px', padding: '12px', background: 'var(--sd-bg-elevated)', borderRadius: 'var(--sd-radius-md)', border: '1px solid var(--sd-border)' }}>
              <h5 style={{ margin: '0 0 8px 0', fontSize: '12px', color: 'var(--sd-text-tertiary)' }}>Edit History</h5>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ opacity: 0.8 }}>
                  <div style={{ fontSize: '11px', color: 'var(--sd-text-tertiary)', marginBottom: '2px' }}>Current</div>
                  <div style={{ fontSize: '13px', color: 'var(--sd-text-secondary)' }}>{content}</div>
                </div>
                {versions.map((v, i) => (
                  <div key={i} style={{ opacity: 0.6, borderTop: '1px solid var(--sd-border)', paddingTop: '8px' }}>
                    <div style={{ fontSize: '11px', color: 'var(--sd-text-tertiary)', marginBottom: '2px' }}>
                      {new Date(v.createdAt).toLocaleString()}
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--sd-text-secondary)' }}>{v.content}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
