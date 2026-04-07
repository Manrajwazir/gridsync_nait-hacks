import { useState, useEffect } from 'react'

/*
 * EnergyMixChart — Horizontal stacked bar + legend
 * Shows Alberta's real-time generation mix from /api/energy-mix.
 * Animates bar widths on load. Refreshes every 60 seconds.
 */

export default function EnergyMixChart({ compact = false }) {
  const [mix, setMix]         = useState(null)
  const [animated, setAnimated] = useState(false)

  async function fetchMix() {
    try {
      const r = await fetch('/api/energy-mix')
      const d = await r.json()
      setMix(d)
      // Trigger bar animation after data arrives
      setTimeout(() => setAnimated(true), 80)
    } catch { /* silently ignore */ }
  }

  useEffect(() => {
    fetchMix()
    const iv = setInterval(fetchMix, 60_000)
    return () => clearInterval(iv)
  }, [])

  if (!mix) return (
    <div style={{ height: compact ? '60px' : '80px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', animation: 'shimmer 1.4s infinite', backgroundImage: 'linear-gradient(90deg,#111 25%,#1a1a1a 50%,#111 75%)', backgroundSize: '200% 100%' }}/>
  )

  const visibleSources = mix.sources.filter(s => s.pct > 0)

  return (
    <div>
      <style>{`
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        .em-seg { transition: width 1s cubic-bezier(0.34,1.2,0.64,1); }
        .em-seg:first-child { border-radius: 8px 0 0 8px; }
        .em-seg:last-child  { border-radius: 0 8px 8px 0; }
        .em-legend-row { display:flex; align-items:center; gap:6px; cursor:default; }
        .em-legend-row:hover .em-legend-label { color:#ededed !important; }
      `}</style>

      {!compact && (
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'12px' }}>
          <div style={{ fontSize:'11px', fontWeight:'700', color:'#444', letterSpacing:'1px', textTransform:'uppercase' }}>
            Generation Mix
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
            <span style={{ fontSize:'11px', color:'#555' }}>Renewables</span>
            <span style={{
              fontSize:'12px', fontWeight:'700',
              color: mix.renewables_pct >= 20 ? '#00c853' : '#f97316',
              fontFamily:"'SF Mono',monospace",
            }}>
              {mix.renewables_pct}%
            </span>
            {mix.is_mock && <span style={{ fontSize:'9px', color:'#333', background:'rgba(255,255,255,0.04)', border:'1px solid #222', borderRadius:'4px', padding:'1px 5px' }}>MOCK</span>}
          </div>
        </div>
      )}

      {/* Stacked bar */}
      <div style={{ display:'flex', height: compact ? '10px' : '14px', borderRadius:'8px', overflow:'hidden', gap:'1px', marginBottom: compact ? '0' : '14px' }}>
        {visibleSources.map(s => (
          <div
            key={s.key}
            className="em-seg"
            title={`${s.label}: ${s.mw.toLocaleString()} MW (${s.pct}%)`}
            style={{
              width: animated ? `${s.pct}%` : '0%',
              background: s.color,
              opacity: 0.85,
              flexShrink: 0,
            }}
          />
        ))}
      </div>

      {/* Legend — hidden in compact mode */}
      {!compact && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'6px 12px' }}>
          {visibleSources.map(s => (
            <div key={s.key} className="em-legend-row">
              <div style={{ width:'8px', height:'8px', borderRadius:'50%', background:s.color, flexShrink:0 }}/>
              <span className="em-legend-label" style={{ fontSize:'11px', color:'#555', flex:1, transition:'color .2s' }}>{s.label}</span>
              <span style={{ fontSize:'11px', fontFamily:"'SF Mono',monospace", color:'#888' }}>{s.pct}%</span>
              <span style={{ fontSize:'10px', color:'#333' }}>{s.mw.toLocaleString()} MW</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
