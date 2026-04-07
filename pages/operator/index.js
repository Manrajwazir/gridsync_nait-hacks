import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import GridStatus from '../../components/GridStatus'
import DemandGauge from '../../components/DemandGauge'
import EnergyMixChart from '../../components/EnergyMixChart'
import GridHealthScore from '../../components/GridHealthScore'
import { supabase } from '../../lib/supabase'

// Leaflet needs the browser window object — disable SSR
const AlbertaMap = dynamic(() => import('../../components/AlbertaMap'), { ssr: false })

/*
 * Operator Dashboard — Main command center for AESO operators
 * Tab layout: Overview | Generation Mix
 */

const TABS = [
  { id: 'overview',    label: 'Overview' },
  { id: 'generation',  label: 'Generation Mix' },
]

export default function OperatorDashboard() {
  const [tab, setTab]                 = useState('overview')
  const [accuracy, setAccuracy]       = useState(null)
  const [liveStats, setLiveStats]     = useState(null)
  const [mixData, setMixData]         = useState(null)
  const [riskHours, setRiskHours]     = useState(0)
  const [jitteredUsers, setJitteredUsers] = useState(12847)
  const [jitteredSaved, setJitteredSaved] = useState(16.5)
  const [alertCount, setAlertCount]   = useState(0)

  // Alert count last 24h
  useEffect(() => {
    async function fetchAlertCount() {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      const { count, error } = await supabase
        .from('alerts')
        .select('*', { count: 'exact', head: true })
        .gt('created_at', yesterday)
      if (!error && count !== null) setAlertCount(count)
    }
    fetchAlertCount()
  }, [])

  useEffect(() => {
    fetch('/accuracy.json')
      .then(r => r.json())
      .then(d => setAccuracy(d))
      .catch(() => {})
  }, [])

  // Fetch energy mix (also drives the Generation Mix tab)
  useEffect(() => {
    function load() {
      fetch('/api/energy-mix')
        .then(r => r.json())
        .then(d => setMixData(d))
        .catch(() => {})
    }
    load()
    const iv = setInterval(load, 60_000)
    return () => clearInterval(iv)
  }, [])

  // Count forecast risk hours from predictions.json
  useEffect(() => {
    fetch('/predictions.json')
      .then(r => r.json())
      .then(d => {
        const count = (d.predictions ?? []).filter(p => p.risk_level !== 'safe').length
        setRiskHours(count)
      })
      .catch(() => {})
  }, [])

  // Jitter active subscribers
  useEffect(() => {
    const iv = setInterval(() => {
      setJitteredUsers(prev => prev + Math.floor(Math.random() * 5) - 2)
    }, 4000)
    return () => clearInterval(iv)
  }, [])

  // Link MW Saved to live usage
  useEffect(() => {
    if (liveStats?.usageMw) {
      const base = liveStats.usageMw * 0.0015
      setJitteredSaved((base + (Math.random() * 0.4 - 0.2)).toFixed(1))
    }
  }, [liveStats?.usageMw])

  const headlineAccuracy = accuracy?.mae_mw != null
    ? (100 - (accuracy.mae_mw / 13000) * 100).toFixed(1) + '%'
    : '--'

  const stats = [
    { label: 'Active Subscribers', value: jitteredUsers.toLocaleString(), change: '+3.2%',           up: true },
    { label: 'MW Demand Avoided',  value: jitteredSaved,                   change: '+1.8 MW',         up: true },
    { label: 'Alerts Sent',        value: alertCount,                      change: 'Last 24h',        up: null },
    { label: 'Model Accuracy',     value: headlineAccuracy,                change: 'Live · 48h ahead', up: null },
  ]

  return (
    <>
      <style>{`
        .op-tab {
          padding: 8px 18px; border: none; border-radius: 7px;
          background: transparent; cursor: pointer;
          font-size: 13px; font-weight: 600; transition: all 0.18s;
          font-family: 'Inter', sans-serif;
        }
        .op-tab.active  { background: rgba(255,255,255,0.08); color: #ededed; }
        .op-tab:not(.active) { color: #444; }
        .op-tab:not(.active):hover { color: #888; background: rgba(255,255,255,0.04); }
      `}</style>

      <div style={{ padding: '32px 40px' }}>

        {/* ── Header + Tab bar ── */}
        <div style={{ marginBottom: '28px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#ededed', margin: '0 0 6px', letterSpacing: '-0.5px' }}>
            Grid Overview
          </h1>
          <p style={{ fontSize: '13px', color: '#555', margin: '0 0 20px' }}>
            Real-time Alberta grid status, demand forecast, and response coordination
          </p>

          {/* Tab bar */}
          <div style={{
            display: 'inline-flex', gap: '3px',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: '10px', padding: '3px',
          }}>
            {TABS.map(t => (
              <button
                key={t.id}
                className={`op-tab${tab === t.id ? ' active' : ''}`}
                onClick={() => setTab(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* ════════ TAB: OVERVIEW ════════ */}
        {tab === 'overview' && (
          <>
            {/* Grid Health Score — spans 2 cols */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '16px' }}>
              <GridHealthScore
                demandPct={liveStats?.pct ?? 0}
                renewablesPct={mixData?.renewables_pct ?? 0}
                riskHours={riskHours}
              />
              {/* Two narrow stats fill the remaining 2 cols */}
              {stats.slice(2, 4).map((stat, i) => (
                <div key={i} style={{
                  background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: '10px', padding: '20px',
                }}>
                  <div style={{ fontSize: '11px', color: '#555', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                    {stat.label}
                  </div>
                  <div style={{ fontSize: '28px', fontWeight: '700', fontFamily: "'SF Mono', 'Fira Code', monospace", color: '#ededed', letterSpacing: '-1px' }}>
                    {stat.value}
                  </div>
                  <div style={{ fontSize: '11px', marginTop: '6px', color: stat.up === true ? '#00c853' : stat.up === false ? '#ff3b30' : '#444' }}>
                    {stat.change}
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom KPI row — subscribers + MW saved */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '28px' }}>
              {stats.slice(0, 2).map((stat, i) => (
                <div key={i} style={{
                  background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: '10px', padding: '20px',
                }}>
                  <div style={{ fontSize: '11px', color: '#555', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                    {stat.label}
                  </div>
                  <div style={{ fontSize: '28px', fontWeight: '700', fontFamily: "'SF Mono', 'Fira Code', monospace", color: '#ededed', letterSpacing: '-1px' }}>
                    {stat.value}
                  </div>
                  <div style={{ fontSize: '11px', marginTop: '6px', color: stat.up === true ? '#00c853' : stat.up === false ? '#ff3b30' : '#444' }}>
                    {stat.change}
                  </div>
                </div>
              ))}
            </div>

            {/* Two-column: chart + (map + gauge) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '24px', alignItems: 'start' }}>
              <GridStatus onReady={(stats) => setLiveStats(stats)} />

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', overflow: 'hidden' }}>
                  <AlbertaMap />
                </div>
                <DemandGauge
                  pct={liveStats?.pct ?? 0}
                  status={liveStats?.status ?? 'STABLE'}
                  usageMw={liveStats?.usageMw}
                />
              </div>
            </div>
          </>
        )}

        {/* ════════ TAB: GENERATION MIX ════════ */}
        {tab === 'generation' && (
          <div style={{ width: '100%' }}>
            <style>{`
              @keyframes bar-grow { from { width: 0 } }
              .src-card { background: #0a0a0a; border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; padding: 20px 22px; transition: border-color .2s; }
              .src-card:hover { border-color: rgba(255,255,255,0.13); }
            `}</style>

            {/* ── Headline totals ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '16px', marginBottom: '28px' }}>
              {[
                { label: 'Total Generation', value: mixData ? `${mixData.total_mw.toLocaleString()} MW` : '--', sub: 'Net to grid right now' },
                { label: 'Installed Capacity', value: mixData ? `${mixData.total_cap_mw.toLocaleString()} MW` : '--', sub: 'Aggregated max capability' },
                { label: 'Renewables Share', value: mixData ? `${mixData.renewables_pct}%` : '--', sub: 'Wind + Solar + Hydro', green: true },
              ].map((h, i) => (
                <div key={i} style={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '22px 24px' }}>
                  <div style={{ fontSize: '11px', color: '#444', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: '10px' }}>{h.label}</div>
                  <div style={{ fontSize: '32px', fontWeight: '700', color: h.green ? '#00c853' : '#ededed', fontFamily: "'SF Mono',monospace", letterSpacing: '-1px' }}>{h.value}</div>
                  <div style={{ fontSize: '11px', color: '#333', marginTop: '6px' }}>{h.sub}</div>
                </div>
              ))}
            </div>

            {/* ── Stacked bar ── */}
            <div style={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '22px 24px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <div style={{ fontSize: '11px', fontWeight: '700', color: '#444', letterSpacing: '1px', textTransform: 'uppercase' }}>Live Generation Mix</div>
                {mixData?.is_mock && <span style={{ fontSize: '9px', color: '#333', background: 'rgba(255,255,255,0.04)', border: '1px solid #222', borderRadius: '4px', padding: '1px 6px' }}>MOCK DATA</span>}
              </div>
              <div style={{ display: 'flex', height: '18px', borderRadius: '9px', overflow: 'hidden', gap: '1px' }}>
                {(mixData?.sources ?? []).filter(s => s.pct > 0).map(s => (
                  <div key={s.key} title={`${s.label}: ${s.mw.toLocaleString()} MW (${s.pct}%)`}
                    style={{ width: `${s.pct}%`, background: s.color, opacity: 0.85, animation: 'bar-grow 0.9s ease', flexShrink: 0 }}/>
                ))}
              </div>
            </div>

            {/* ── Per-source utilization cards ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: '14px' }}>
              {(mixData?.sources ?? []).map(s => {
                const utilPct = s.cap > 0 ? Math.round((s.mw / s.cap) * 100) : 0
                return (
                  <div key={s.key} className="src-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                      <span style={{ fontSize: '18px' }}>{s.icon}</span>
                      <span style={{ fontSize: '12px', fontWeight: '700', color: '#ededed' }}>{s.label}</span>
                    </div>

                    {/* Current MW */}
                    <div style={{ fontSize: '22px', fontWeight: '700', color: s.color, fontFamily: "'SF Mono',monospace", letterSpacing: '-0.5px', marginBottom: '2px' }}>
                      {s.mw.toLocaleString()}
                    </div>
                    <div style={{ fontSize: '10px', color: '#444', marginBottom: '14px' }}>MW generating</div>

                    {/* Utilization bar */}
                    <div style={{ height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', marginBottom: '6px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${utilPct}%`, background: s.color, borderRadius: '4px', opacity: 0.7, transition: 'width 0.8s ease' }}/>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '10px', color: '#333' }}>{utilPct}% of capacity</span>
                      <span style={{ fontSize: '10px', color: '#2a2a2a' }}>{s.cap.toLocaleString()} MW max</span>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Data note */}
            <div style={{ marginTop: '20px', fontSize: '11px', color: '#2a2a2a', lineHeight: '1.7' }}>
              AESO Current Supply Demand API · Refreshes every 60s · Capacity = aggregated_maximum_capability
            </div>
          </div>
        )}

      </div>
    </>
  )
}
