/*
 * GridHealthScore — 0–100 composite grid intelligence score
 *
 * Formula:
 *   score = 100
 *         - (demandPct / 100) * 55   ← demand pressure (0–55 pts)
 *         - (riskHours / 48) * 30    ← forecast risk horizon (0–30 pts)
 *         + (renewablesPct / 100) * 15 ← renewables stability bonus (0–15 pts)
 *   clamped 0–100
 *
 * Bands: 75–100 Healthy · 50–74 Elevated · 25–49 Stressed · 0–24 Critical
 */

function describeArc(cx, cy, r, startDeg, endDeg) {
  const rad = (d) => (d * Math.PI) / 180
  const x1 = cx + r * Math.cos(rad(startDeg))
  const y1 = cy + r * Math.sin(rad(startDeg))
  const x2 = cx + r * Math.cos(rad(endDeg))
  const y2 = cy + r * Math.sin(rad(endDeg))
  const large = endDeg - startDeg > 180 ? 1 : 0
  return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`
}

export default function GridHealthScore({
  demandPct      = 0,
  renewablesPct  = 0,
  riskHours      = 0,
}) {
  const raw = 100
    - (demandPct     / 100) * 55
    - (riskHours     / 48)  * 30
    + (renewablesPct / 100) * 15
  const score = Math.round(Math.max(0, Math.min(100, raw)))

  const band = score >= 75 ? { label: 'Healthy',  color: '#00c853', glow: 'rgba(0,200,83,0.25)'     }
             : score >= 50 ? { label: 'Elevated',  color: '#ff9500', glow: 'rgba(255,149,0,0.25)'    }
             : score >= 25 ? { label: 'Stressed',  color: '#ff6b00', glow: 'rgba(255,107,0,0.25)'    }
             :               { label: 'Critical',  color: '#ff3b30', glow: 'rgba(255,59,48,0.25)'    }

  // Arc constants — same style as DemandGauge
  const START = 145, SWEEP = 250
  const cx = 60, cy = 60, r = 46
  const fillEnd = START + (score / 100) * SWEEP

  const factors = [
    { label: 'Demand Load',    value: demandPct    != null ? `${demandPct}%`    : '--', note: 'of capacity' },
    { label: 'Risk Hours',     value: riskHours    != null ? `${riskHours}h`   : '--', note: 'in 48h ahead' },
    { label: 'Renewables',     value: renewablesPct != null ? `${renewablesPct}%` : '--', note: 'of generation' },
  ]

  return (
    <div style={{
      background: '#0a0a0a',
      border: `1px solid rgba(255,255,255,0.07)`,
      borderRadius: '12px',
      padding: '20px 24px',
      display: 'flex',
      alignItems: 'center',
      gap: '24px',
      gridColumn: 'span 2', // spans 2 cols in the KPI grid
    }}>
      {/* Arc gauge */}
      <div style={{ flexShrink: 0 }}>
        <svg viewBox="0 0 120 80" width="140" style={{ overflow: 'visible' }}>
          <defs>
            <filter id="ghs-glow">
              <feGaussianBlur stdDeviation="1.5" result="blur"/>
              <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
          </defs>
          {/* Track */}
          <path d={describeArc(cx, cy, r, START, START + SWEEP)}
            fill="none" stroke="#1a1a1a" strokeWidth="9" strokeLinecap="round"/>
          {/* Fill */}
          <path d={describeArc(cx, cy, r, START, fillEnd)}
            fill="none" stroke={band.color} strokeWidth="8" strokeLinecap="round"
            filter="url(#ghs-glow)"
            style={{ transition: 'all 1s ease' }}/>
          {/* Score */}
          <text x={cx} y={cy + 4} textAnchor="middle" fill={band.color}
            fontSize="20" fontWeight="800"
            fontFamily="'SF Mono','Fira Code',monospace"
            style={{ transition: 'fill 0.5s' }}>
            {score}
          </text>
          {/* Label */}
          <text x={cx} y={cy + 18} textAnchor="middle" fill={band.color}
            fontSize="6" fontWeight="700" letterSpacing="0.8">
            {band.label.toUpperCase()}
          </text>
        </svg>
      </div>

      {/* Right: title + factors */}
      <div style={{ flex: 1 }}>
        <div style={{
          fontSize: '10px', fontWeight: '700', color: '#444',
          letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '12px',
        }}>
          Grid Health Score
        </div>

        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
          {factors.map((f, i) => (
            <div key={i}>
              <div style={{
                fontSize: '18px', fontWeight: '700',
                fontFamily: "'SF Mono','Fira Code',monospace",
                color: '#ededed', letterSpacing: '-0.5px',
              }}>
                {f.value}
              </div>
              <div style={{ fontSize: '10px', color: '#555', marginTop: '2px' }}>{f.label}</div>
              <div style={{ fontSize: '9px',  color: '#333' }}>{f.note}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Action recommendation */}
      <div style={{
        flexShrink: 0, padding: '12px 16px',
        background: score >= 75 ? 'rgba(0,200,83,0.05)' : score >= 50 ? 'rgba(255,149,0,0.05)' : 'rgba(255,59,48,0.05)',
        border: `1px solid ${band.color}22`,
        borderRadius: '10px', maxWidth: '180px', textAlign: 'right',
      }}>
        <div style={{ fontSize: '11px', color: band.color, fontWeight: '700', marginBottom: '4px' }}>
          {score >= 75 ? '✓ No action needed'
          : score >= 50 ? '⚠ Monitor closely'
          : score >= 25 ? '⚡ Alert recommended'
          :               '🔴 Alert required'}
        </div>
        <div style={{ fontSize: '10px', color: '#444', lineHeight: '1.5' }}>
          {score >= 75 ? 'Grid operating within safe margins.'
          : score >= 50 ? 'Demand elevated — watch forecast.'
          : score >= 25 ? 'Consider demand response alert.'
          :               'Send province-wide DR alert now.'}
        </div>
      </div>
    </div>
  )
}
