import React from 'react';

interface StandingsRowProps {
  position: number;
  teamName: string;
  teamCrest?: string;
  matchesPlayed: number;
  won: number;
  drawn: number;
  lost: number;
  goalDifference: number;
  points: number;
  form?: string; // e.g., "W,W,D,L,W"
  highlight?: boolean;
}

const formColors: Record<string, string> = {
  W: 'var(--sd-success)',
  D: 'var(--sd-text-tertiary)',
  L: 'var(--sd-danger)',
};

export function StandingsRow({
  position,
  teamName,
  teamCrest,
  matchesPlayed,
  won,
  drawn,
  lost,
  goalDifference,
  points,
  form,
  highlight = false,
}: StandingsRowProps) {
  const formItems = form?.split(',').map((f) => f.trim()) || [];

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '36px 1fr repeat(5, 36px) 48px 80px',
        alignItems: 'center',
        padding: '10px 14px',
        background: highlight ? 'var(--sd-accent-muted)' : 'transparent',
        borderBottom: '1px solid var(--sd-border)',
        fontFamily: 'var(--sd-font)',
        fontSize: '13px',
        gap: '4px',
        transition: 'background var(--sd-transition)',
      }}
      onMouseEnter={(e) => {
        if (!highlight) e.currentTarget.style.background = 'var(--sd-bg-tertiary)';
      }}
      onMouseLeave={(e) => {
        if (!highlight) e.currentTarget.style.background = 'transparent';
      }}
    >
      {/* Position */}
      <span style={{ fontWeight: 700, color: highlight ? 'var(--sd-accent)' : 'var(--sd-text-secondary)', textAlign: 'center' }}>
        {position}
      </span>

      {/* Team */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
        {teamCrest ? (
          <img src={teamCrest} alt={teamName} style={{ width: 20, height: 20, objectFit: 'contain', flexShrink: 0 }} />
        ) : (
          <div
            style={{
              width: 20,
              height: 20,
              borderRadius: '4px',
              background: 'var(--sd-bg-elevated)',
              flexShrink: 0,
            }}
          />
        )}
        <span
          style={{
            fontWeight: 500,
            color: 'var(--sd-text-primary)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {teamName}
        </span>
      </div>

      {/* Stats */}
      <span style={{ textAlign: 'center', color: 'var(--sd-text-secondary)' }}>{matchesPlayed}</span>
      <span style={{ textAlign: 'center', color: 'var(--sd-text-secondary)' }}>{won}</span>
      <span style={{ textAlign: 'center', color: 'var(--sd-text-secondary)' }}>{drawn}</span>
      <span style={{ textAlign: 'center', color: 'var(--sd-text-secondary)' }}>{lost}</span>
      <span style={{ textAlign: 'center', color: goalDifference > 0 ? 'var(--sd-success)' : goalDifference < 0 ? 'var(--sd-danger)' : 'var(--sd-text-secondary)' }}>
        {goalDifference > 0 ? '+' : ''}{goalDifference}
      </span>

      {/* Points */}
      <span style={{ textAlign: 'center', fontWeight: 700, color: 'var(--sd-text-primary)', fontSize: '14px' }}>
        {points}
      </span>

      {/* Form */}
      <div style={{ display: 'flex', gap: '3px', justifyContent: 'flex-end' }}>
        {formItems.slice(-5).map((result, i) => (
          <span
            key={i}
            style={{
              width: 18,
              height: 18,
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '10px',
              fontWeight: 700,
              color: '#fff',
              background: formColors[result] || 'var(--sd-bg-elevated)',
            }}
          >
            {result}
          </span>
        ))}
      </div>
    </div>
  );
}
