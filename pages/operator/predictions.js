import { useState, useEffect } from 'react'
import Link from 'next/link'
import PredictionTable from '../../components/PredictionTable'

/*
 * Operator Predictions — 48-hour forecast with smart alert recommendation banner.
 * Banner auto-scans predictions.json for stress windows and surfaces an action.
 */

export default function OperatorPredictions() {
  const [banner, setBanner] = useState(null) // null = loading

  useEffect(() => {
    fetch('/predictions.json')
      .then(r => r.json())
      .then(d => {
        const preds = d.predictions ?? []

        // Find first critical window
        const critical = preds.find(p => p.risk_level === 'critical')
        if (critical) {
          const t = new Date(critical.timestamp)
          setBanner({
            level: 'critical',
            color: '#ff3b30',
            bg: 'rgba(255,59,48,0.07)',
            border: 'rgba(255,59,48,0.2)',
            icon: '🔴',
            heading: 'Critical Demand Window Detected',
            body: `Forecast exceeds critical threshold at ${t.toLocaleString('en-CA', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })} — ${critical.predicted_mw.toLocaleString()} MW predicted (${critical.capacity_pct}% capacity). Immediate demand response recommended.`,
            action: 'Send Alert Now',
          })
          return
        }

        // Find first warning window
        const warning = preds.find(p => p.risk_level === 'warning')
        if (warning) {
          const t = new Date(warning.timestamp)
          setBanner({
            level: 'warning',
            color: '#ff9500',
            bg: 'rgba(255,149,0,0.06)',
            border: 'rgba(255,149,0,0.18)',
            icon: '⚠️',
            heading: 'Elevated Demand Forecast',
            body: `Grid stress predicted starting ${t.toLocaleString('en-CA', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })} — ${warning.predicted_mw.toLocaleString()} MW (${warning.capacity_pct}% capacity). Consider pre-emptive demand response alert.`,
            action: 'Review & Send Alert',
          })
          return
        }

        // All clear
        setBanner({ level: 'safe' })
      })
      .catch(() => setBanner({ level: 'safe' }))
  }, [])

  return (
    <div style={{ padding: '32px 40px' }}>
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#ededed', margin: '0 0 6px', letterSpacing: '-0.5px' }}>
          48-Hour Forecast
        </h1>
        <p style={{ fontSize: '13px', color: '#555', margin: 0 }}>
          Prophet ML predictions — trained on 8,400+ hours of AESO data and Alberta weather
        </p>
      </div>

      {/* ── Smart recommendation banner ── */}
      {banner && banner.level !== 'safe' && (
        <div style={{
          background: banner.bg,
          border: `1px solid ${banner.border}`,
          borderRadius: '12px',
          padding: '18px 22px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: '20px',
          flexWrap: 'wrap',
        }}>
          <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start', flex: 1 }}>
            <span style={{ fontSize: '22px', flexShrink: 0, lineHeight: 1 }}>{banner.icon}</span>
            <div>
              <div style={{ fontSize: '14px', fontWeight: '700', color: banner.color, marginBottom: '5px' }}>
                {banner.heading}
              </div>
              <div style={{ fontSize: '13px', color: '#888', lineHeight: '1.6', maxWidth: '600px' }}>
                {banner.body}
              </div>
            </div>
          </div>
          <Link href="/operator/alerts" style={{
            flexShrink: 0,
            padding: '10px 18px',
            background: banner.color,
            color: '#000',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: '700',
            textDecoration: 'none',
            fontFamily: "'Inter', sans-serif",
            whiteSpace: 'nowrap',
            alignSelf: 'center',
            transition: 'opacity .2s',
          }}>
            {banner.action} →
          </Link>
        </div>
      )}

      {/* All-clear banner */}
      {banner?.level === 'safe' && (
        <div style={{
          background: 'rgba(0,200,83,0.05)',
          border: '1px solid rgba(0,200,83,0.15)',
          borderRadius: '12px',
          padding: '14px 20px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}>
          <span style={{ fontSize: '16px' }}>✅</span>
          <div style={{ fontSize: '13px', color: '#00c853', fontWeight: '600' }}>
            48-hour forecast clear — no grid stress periods detected. No demand response action required.
          </div>
        </div>
      )}

      {/* Alert threshold reference */}
      <div style={{
        background: '#0a0a0a',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: '10px',
        padding: '16px 20px',
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
      }}>
        <div>
          <div style={{ fontSize: '13px', color: '#ededed', fontWeight: '600' }}>Alert Thresholds</div>
          <div style={{ fontSize: '12px', color: '#555', marginTop: '2px' }}>
            Thresholds used to classify risk levels in the forecast
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,149,0,0.08)', border: '1px solid rgba(255,149,0,0.15)', padding: '6px 14px', borderRadius: '6px', fontSize: '12px' }}>
            <span style={{ color: '#ff9500' }}>Warning</span>
            <span style={{ color: '#ff9500', fontFamily: "'SF Mono', monospace", fontWeight: '600' }}>&gt; 86%</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,59,48,0.08)', border: '1px solid rgba(255,59,48,0.15)', padding: '6px 14px', borderRadius: '6px', fontSize: '12px' }}>
            <span style={{ color: '#ff3b30' }}>Critical</span>
            <span style={{ color: '#ff3b30', fontFamily: "'SF Mono', monospace", fontWeight: '600' }}>&gt; 94%</span>
          </div>
        </div>
      </div>

      {/* Prediction table */}
      <PredictionTable />
    </div>
  )
}
