import React from 'react';
import { Badge } from '../ui/Badge';

interface MatchCardProps {
  homeTeam: string;
  awayTeam: string;
  homeCrest?: string;
  awayCrest?: string;
  homeScore?: number | null;
  awayScore?: number | null;
  status: 'TIMED' | 'LIVE' | 'FINISHED';
  venue?: string;
  date?: string;
  time?: string;
}

const statusBadge: Record<string, { variant: 'live' | 'success' | 'default'; label: string; dot?: boolean }> = {
  LIVE: { variant: 'live', label: 'LIVE', dot: true },
  FINISHED: { variant: 'success', label: 'FT' },
  TIMED: { variant: 'default', label: 'Upcoming' },
};

function TeamCrest({ src, name }: { src?: string; name: string }) {
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        style={{ width: 32, height: 32, objectFit: 'contain', flexShrink: 0 }}
      />
    );
  }
  return (
    <div
      style={{
        width: 32,
        height: 32,
        borderRadius: 'var(--sd-radius-sm)',
        background: 'var(--sd-bg-elevated)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '12px',
        fontWeight: 700,
        color: 'var(--sd-text-tertiary)',
        fontFamily: 'var(--sd-font)',
        flexShrink: 0,
      }}
    >
      {name.slice(0, 3).toUpperCase()}
    </div>
  );
}

export function MatchCard({
  homeTeam,
  awayTeam,
  homeCrest,
  awayCrest,
  homeScore,
  awayScore,
  status,
  venue,
  date,
  time,
}: MatchCardProps) {
  const badge = statusBadge[status] || { variant: 'default', label: status || 'Upcoming' };
  const hasScore = homeScore !== null && homeScore !== undefined;

  return (
    <div
      style={{
        background: 'var(--sd-bg-secondary)',
        border: `1px solid ${status === 'LIVE' ? 'var(--sd-live)' : 'var(--sd-border)'}`,
        borderRadius: 'var(--sd-radius-lg)',
        padding: '16px',
        width: '100%',
        maxWidth: '340px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <Badge variant={badge.variant} dot={badge.dot}>{badge.label}</Badge>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {date && (
            <span style={{ fontSize: '12px', color: 'var(--sd-text-primary)', fontWeight: 600, fontFamily: 'var(--sd-font)' }}>
              {date}
            </span>
          )}
          {time && (
            <span style={{ fontSize: '12px', color: 'var(--sd-text-tertiary)', fontFamily: 'var(--sd-font)' }}>
              {time}
            </span>
          )}
        </div>
      </div>

      {/* Teams */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {/* Home */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <TeamCrest src={homeCrest} name={homeTeam} />
            <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--sd-text-primary)', fontFamily: 'var(--sd-font)' }}>
              {homeTeam}
            </span>
          </div>
          {hasScore && (
            <span style={{ fontSize: '20px', fontWeight: 800, color: 'var(--sd-text-primary)', fontFamily: 'var(--sd-font)', minWidth: '24px', textAlign: 'center' }}>
              {homeScore}
            </span>
          )}
        </div>
        {/* Away */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <TeamCrest src={awayCrest} name={awayTeam} />
            <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--sd-text-primary)', fontFamily: 'var(--sd-font)' }}>
              {awayTeam}
            </span>
          </div>
          {hasScore && (
            <span style={{ fontSize: '20px', fontWeight: 800, color: 'var(--sd-text-primary)', fontFamily: 'var(--sd-font)', minWidth: '24px', textAlign: 'center' }}>
              {awayScore}
            </span>
          )}
        </div>
      </div>

      {/* Venue */}
      {venue && (
        <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid var(--sd-border)' }}>
          <span style={{ fontSize: '12px', color: 'var(--sd-text-tertiary)', fontFamily: 'var(--sd-font)' }}>
            📍 {venue}
          </span>
        </div>
      )}
    </div>
  );
}
