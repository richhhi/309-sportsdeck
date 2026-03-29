import React, { useState } from 'react';
import { Button } from '../ui/Button';

interface PollOption {
  id: string;
  text: string;
  votes: number;
}

interface PollCardProps {
  question: string;
  options: PollOption[];
  totalVotes: number;
  hasVoted?: boolean;
  selectedOptionId?: string;
  deadline?: string;
  onVote?: (optionId: string) => void;
  isAuthor?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  versions?: any[];
}

export function PollCard({
  question,
  options,
  totalVotes,
  hasVoted = false,
  selectedOptionId,
  deadline,
  onVote,
  isAuthor = false,
  onEdit,
  onDelete,
  versions = [],
}: PollCardProps) {
  const [selected, setSelected] = useState<string | null>(selectedOptionId || null);
  const [isViewingHistory, setIsViewingHistory] = useState(false);
  const showResults = hasVoted;

  return (
    <div
      style={{
        background: 'var(--sd-bg-secondary)',
        border: '1px solid var(--sd-border)',
        borderRadius: 'var(--sd-radius-lg)',
        padding: '20px',
        maxWidth: '100%',
        width: '100%',
      }}
    >
      {/* Question */}
      <h4
        style={{
          margin: '0 0 16px',
          fontSize: '16px',
          fontWeight: 600,
          color: 'var(--sd-text-primary)',
          fontFamily: 'var(--sd-font)',
          lineHeight: 1.4,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          flexWrap: 'wrap'
        }}
      >
        <span>📊 {question}</span>
        {versions.length > 0 && (
          <span
            onClick={() => setIsViewingHistory(!isViewingHistory)}
            style={{
              fontSize: '11px',
              color: 'var(--sd-text-tertiary)',
              fontStyle: 'italic',
              cursor: 'pointer',
              fontWeight: 400
            }}
            className="hover:underline"
            title="Click to view edit history"
          >
            (Edited)
          </span>
        )}
      </h4>

      {isViewingHistory && versions.length > 0 && (
        <div
          style={{
            marginBottom: '16px',
            padding: '12px',
            background: 'var(--sd-bg-elevated)',
            borderRadius: 'var(--sd-radius-md)',
            border: '1px solid var(--sd-border)',
            fontSize: '13px'
          }}
        >
          <h5 style={{ margin: '0 0 8px', fontSize: '11px', color: 'var(--sd-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Poll History
          </h5>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ opacity: 0.8 }}>
              <div style={{ fontSize: '10px', color: 'var(--sd-text-tertiary)', marginBottom: '2px' }}>Current</div>
              <div style={{ color: 'var(--sd-text-primary)', fontWeight: 500 }}>{question}</div>
              <div style={{ fontSize: '12px', color: 'var(--sd-text-secondary)', marginTop: '2px' }}>
                Options: {options.map(o => o.text).join(", ")}
              </div>
            </div>
            {versions.map((v, i) => (
              <div key={i} style={{ borderTop: '1px solid var(--sd-border)', paddingTop: '8px', opacity: 0.6 }}>
                <div style={{ fontSize: '10px', color: 'var(--sd-text-tertiary)', marginBottom: '2px' }}>
                  {new Date(v.createdAt).toLocaleString()}
                </div>
                <div style={{ color: 'var(--sd-text-secondary)' }}>{v.question}</div>
                {v.options && (
                  <div style={{ fontSize: '12px', color: 'var(--sd-text-tertiary)', marginTop: '2px' }}>
                    Options: {v.options}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Options */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {options.map((opt) => {
          const pct = totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0;
          const isSelected = selected === opt.id || selectedOptionId === opt.id;

          if (showResults) {
            return (
              <button
                key={opt.id}
                onClick={() => {
                  if (isSelected) return; // Don't re-vote for same option
                  setSelected(opt.id);
                  onVote?.(opt.id);
                }}
                style={{
                  position: 'relative',
                  padding: '10px 14px',
                  borderRadius: 'var(--sd-radius-md)',
                  border: `1px solid ${isSelected ? 'var(--sd-accent)' : 'var(--sd-border)'}`,
                  overflow: 'hidden',
                  cursor: 'pointer',
                  textAlign: 'left',
                  background: 'transparent',
                  display: 'block',
                  width: '100%',
                }}
              >
                {/* Bar fill */}
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    height: '100%',
                    width: `${pct}%`,
                    background: isSelected ? 'var(--sd-accent-muted)' : 'var(--sd-bg-elevated)',
                    transition: 'width 0.5s ease',
                    zIndex: 0,
                  }}
                />
                <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span
                    style={{
                      fontSize: '14px',
                      fontWeight: isSelected ? 600 : 400,
                      color: isSelected ? 'var(--sd-accent)' : 'var(--sd-text-primary)',
                      fontFamily: 'var(--sd-font)',
                    }}
                  >
                    {opt.text} {isSelected && '✓'}
                  </span>
                  <span
                    style={{
                      fontSize: '13px',
                      fontWeight: 600,
                      color: 'var(--sd-text-secondary)',
                      fontFamily: 'var(--sd-font)',
                    }}
                  >
                    {pct}%
                  </span>
                </div>
              </button>
            );
          }

          return (
            <button
              key={opt.id}
              onClick={() => {
                setSelected(opt.id);
                onVote?.(opt.id);
              }}
              style={{
                padding: '10px 14px',
                borderRadius: 'var(--sd-radius-md)',
                border: `1px solid ${isSelected ? 'var(--sd-accent)' : 'var(--sd-border-strong)'}`,
                background: isSelected ? 'var(--sd-accent-muted)' : 'transparent',
                color: isSelected ? 'var(--sd-accent)' : 'var(--sd-text-primary)',
                fontSize: '14px',
                fontWeight: 500,
                fontFamily: 'var(--sd-font)',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all var(--sd-transition)',
              }}
              onMouseEnter={(e) => {
                if (!isSelected) e.currentTarget.style.background = 'var(--sd-bg-elevated)';
              }}
              onMouseLeave={(e) => {
                if (!isSelected) e.currentTarget.style.background = 'transparent';
              }}
            >
              {opt.text}
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '14px',
          paddingTop: '12px',
          borderTop: '1px solid var(--sd-border)',
        }}
      >
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', color: 'var(--sd-text-tertiary)', fontFamily: 'var(--sd-font)' }}>
            {totalVotes} vote{totalVotes !== 1 ? 's' : ''}
          </span>
          {deadline && (
            <span style={{ fontSize: '12px', color: 'var(--sd-text-tertiary)', fontFamily: 'var(--sd-font)' }}>
              • Ends {deadline}
            </span>
          )}
        </div>

        {isAuthor && (
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={onEdit}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: '12px', fontFamily: 'var(--sd-font)',
                padding: 0
              }}
              className="text-sm text-[var(--sd-text-tertiary)] hover:text-[var(--sd-text-primary)] transition-colors"
            >
              Edit / Extend (+7d)
            </button>
            <button
              onClick={onDelete}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: '12px', fontFamily: 'var(--sd-font)',
                padding: 0
              }}
              className="text-sm text-[var(--sd-text-tertiary)] hover:text-red-500 transition-colors"
            >
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
