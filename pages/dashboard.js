import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '../lib/supabase'
import GridStatus from '../components/GridStatus'
import DemandGauge from '../components/DemandGauge'
import GridSchematic from '../components/GridSchematic'
import ThermostatRoundedIcon from '@mui/icons-material/ThermostatRounded'
import KitchenRoundedIcon from '@mui/icons-material/KitchenRounded'
import EvStationRoundedIcon from '@mui/icons-material/EvStationRounded'
import LightbulbRoundedIcon from '@mui/icons-material/LightbulbRounded'

/*
 * Subscriber Portal (/dashboard)
 * Real-time grid status + demand gauge + demand-response tips.
 * This is the public-facing endpoint that receives operator alerts.
 */

const tipCategories = [
  {
    Icon: ThermostatRoundedIcon,
    label: 'Heating & Cooling',
    desc: 'Your furnace is the biggest load.',
    tips: [
      { text: 'Pre-heat to 22°C before a peak period starts', savings: '~1.5 kW' },
      { text: 'Drop thermostat to 19°C during alert window (6–9 PM)', savings: '~2.0 kW' },
      { text: 'Close blinds to retain heat', savings: '~0.5 kW' },
    ],
  },
  {
    Icon: KitchenRoundedIcon,
    label: 'Appliances',
    desc: 'Shift high-draw appliances outside peak hours.',
    tips: [
      { text: 'Delay dishwasher until after 9 PM', savings: '~1.2 kW' },
      { text: 'Delay laundry (washer + dryer) until after 9 PM', savings: '~0.9 kW' },
      { text: 'Use microwave instead of oven — 70% less energy', savings: '~1.0 kW' },
    ],
  },
  {
    Icon: EvStationRoundedIcon,
    label: 'Electric Vehicles',
    desc: 'EV charging is the biggest thing you can shift.',
    tips: [
      { text: "Charge before 6 PM or after 9 PM using your car's schedule", savings: '~7.2 kW' },
      { text: 'Use departure time scheduling in your EV app', savings: '~7.2 kW' },
    ],
  },
  {
    Icon: LightbulbRoundedIcon,
    label: 'Lighting & Electronics',
    desc: 'Small changes add up across thousands of buildings.',
    tips: [
      { text: 'Turn off lights in unoccupied rooms', savings: '~0.3 kW' },
      { text: 'Lower monitor brightness during evening hours', savings: '~0.1 kW' },
      { text: 'Unplug device chargers not in use', savings: '~0.2 kW' },
    ],
  },
]

function HomeSkeleton() {
  return (
    <>
      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        .sk { background: linear-gradient(90deg, #111 25%, #1a1a1a 50%, #111 75%); background-size: 200% 100%; animation: shimmer 1.4s infinite; border-radius: 6px; }
      `}</style>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px', alignItems: 'start' }}>
        <div style={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '28px 32px' }}>
          <div className="sk" style={{ height: '12px', width: '30%', marginBottom: '20px' }} />
          <div className="sk" style={{ height: '48px', width: '50%', marginBottom: '8px' }} />
          <div className="sk" style={{ height: '12px', width: '38%', marginBottom: '24px' }} />
          <div className="sk" style={{ height: '4px', width: '100%', marginBottom: '28px' }} />
          <div className="sk" style={{ height: '300px', width: '100%' }} />
        </div>
        <div>
          <div className="sk" style={{ height: '200px', borderRadius: '12px', marginBottom: '16px' }} />
          {[1, 2, 3, 4].map(i => (
            <div key={i} style={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '14px 16px', marginBottom: '8px', display: 'flex', gap: '10px', alignItems: 'center' }}>
              <div className="sk" style={{ width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div className="sk" style={{ height: '13px', width: '55%', marginBottom: '6px' }} />
                <div className="sk" style={{ height: '10px', width: '75%' }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

export default function SubscriberPortal() {
  const [openCategory, setOpenCategory] = useState(null)
  const [gridLoaded, setGridLoaded] = useState(false)
  const [liveStats, setLiveStats] = useState(null)
  const [activeAlert, setActiveAlert] = useState(null)

  // Listen for real-time alerts from Supabase
  useEffect(() => {
    const fetchExisting = async () => {
      const { data } = await supabase
        .from('alerts')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
      if (data?.[0]) setActiveAlert(data[0])
    }
    fetchExisting()

    const channel = supabase
      .channel('public:alerts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'alerts' }, payload => {
        if (payload.new && payload.new.is_active) {
          setActiveAlert(payload.new)
        } else if (payload.new && !payload.new.is_active) {
          setActiveAlert(current => {
            if (current && current.id === payload.new.id) return null
            return current
          })
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  return (
    <div style={{ position: 'relative', minHeight: '100vh' }}>
      {/* Lighter Alberta grid schematic in background */}
      <GridSchematic opacity={0.045} glow={false} />

      <style>{`
        .op-signin-btn {
          font-size: 12px; color: #7aaeff; text-decoration: none;
          padding: 7px 14px;
          background: rgba(0,112,243,0.08);
          border: 1px solid rgba(0,112,243,0.28);
          border-radius: 7px; transition: all 0.2s;
          white-space: nowrap; margin-top: 6px;
          font-family: 'Inter', sans-serif;
        }
        .op-signin-btn:hover {
          background: rgba(0,112,243,0.16);
          border-color: rgba(0,112,243,0.6);
          box-shadow: 0 0 16px rgba(0,112,243,0.2);
          color: #b8d0ff;
        }
      `}</style>

      <div style={{ position: 'relative', zIndex: 1, padding: '20px 24px 100px', paddingTop: '68px', maxWidth: '1100px', margin: '0 auto', fontFamily: "'Inter', sans-serif" }}>

      {/* ── Header ── */}
      <div style={{ marginBottom: '24px', paddingTop: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
          <Link href="/" style={{ fontSize: '20px', fontWeight: '700', color: '#ededed', letterSpacing: '-0.3px', textDecoration: 'none' }}>GridSync</Link>
          <span style={{ fontSize: '9px', padding: '2px 7px', background: 'rgba(0,212,255,0.08)', color: '#00d4ff', borderRadius: '4px', fontWeight: '700', letterSpacing: '0.5px' }}>SUBSCRIBER PORTAL</span>
        </div>
        <p style={{ fontSize: '13px', color: '#555', margin: 0 }}>Alberta grid — live status and demand response</p>
      </div>

      {/* ── Real-time Alert Banner ── */}
      {activeAlert && (
        <div style={{
          background: 'rgba(255,59,48,0.1)', border: '1px solid #ff3b30',
          borderRadius: '12px', padding: '16px 20px',
          marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '8px',
          animation: 'alert-pulse 2s infinite',
        }}>
          <style>{`
            @keyframes alert-pulse {
              0%   { box-shadow: 0 0 0 0 rgba(255,59,48,0.4); }
              70%  { box-shadow: 0 0 0 10px rgba(255,59,48,0); }
              100% { box-shadow: 0 0 0 0 rgba(255,59,48,0); }
            }
          `}</style>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '18px' }}>🚨</span>
            <span style={{ fontWeight: '800', color: '#ff3b30', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Grid Demand Response Alert
            </span>
            <button
              onClick={() => setActiveAlert(null)}
              style={{ marginLeft: 'auto', background: 'transparent', border: 'none', color: '#555', cursor: 'pointer', fontSize: '12px' }}
            >
              Dismiss
            </button>
          </div>
          <div style={{ fontSize: '14px', color: '#ededed', lineHeight: '1.5', fontWeight: '500' }}>
            {activeAlert.message}
          </div>
        </div>
      )}

      {/* ── Skeleton ── */}
      {!gridLoaded && <HomeSkeleton />}

      {/* ── Two-column layout ── */}
      <div style={{
        display: gridLoaded ? 'grid' : 'none',
        gridTemplateColumns: '1fr 340px',
        gap: '24px', alignItems: 'start',
      }}>
        {/* Left: Live grid status */}
        <GridStatus
          onReady={(stats) => {
            setGridLoaded(true)
            if (stats) setLiveStats(stats)
          }}
        />

        {/* Right: Gauge + Demand-Response Tips */}
        <div>
          <div style={{ marginBottom: '16px' }}>
            <DemandGauge
              pct={liveStats?.pct ?? 0}
              status={liveStats?.status ?? 'STABLE'}
              usageMw={liveStats?.usageMw}
            />
          </div>

          <div style={{
            fontSize: '11px', fontWeight: '600', color: '#333',
            letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '10px',
          }}>
            Demand-Response Tips
          </div>

          <div style={{
            background: 'rgba(0,112,243,0.06)', border: '1px solid rgba(0,112,243,0.12)',
            borderRadius: '10px', padding: '10px 14px',
            marginBottom: '12px', fontSize: '12px', color: '#777', lineHeight: '1.6',
          }}>
            <span style={{ color: '#4d94ff', fontWeight: '600' }}>Why this matters: </span>
            10,000 buildings × 2 kW = <strong style={{ color: '#ededed' }}>20 MW shaved</strong>{' '}
            from peak demand instantly.
          </div>

          {tipCategories.map((cat, ci) => {
            const isOpen = openCategory === ci
            return (
              <div key={ci} style={{
                background: '#0a0a0a',
                border: `1px solid ${isOpen ? 'rgba(0,112,243,0.2)' : 'rgba(255,255,255,0.06)'}`,
                borderRadius: '10px', overflow: 'hidden', marginBottom: '8px',
                transition: 'border-color 0.2s',
              }}>
                <button
                  onClick={() => setOpenCategory(isOpen ? null : ci)}
                  style={{
                    width: '100%', padding: '12px 14px',
                    background: 'transparent', border: 'none',
                    display: 'flex', alignItems: 'center', gap: '10px',
                    cursor: 'pointer', textAlign: 'left',
                    fontFamily: "'Inter', sans-serif",
                  }}
                >
                  <cat.Icon sx={{ fontSize: 20, color: isOpen ? '#0070f3' : '#444', transition: 'color 0.2s' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: '#ededed' }}>{cat.label}</div>
                    <div style={{ fontSize: '11px', color: '#444', marginTop: '1px' }}>{cat.desc}</div>
                  </div>
                  <span style={{
                    fontSize: '16px', color: isOpen ? '#0070f3' : '#333',
                    transform: isOpen ? 'rotate(90deg)' : 'none',
                    transition: 'transform 0.2s, color 0.2s', display: 'inline-block',
                  }}>›</span>
                </button>

                {isOpen && cat.tips.map((tip, ti) => (
                  <div key={ti} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    gap: '12px', padding: '10px 14px',
                    borderTop: '1px solid rgba(255,255,255,0.04)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', flex: 1 }}>
                      <span style={{ color: '#0070f3', fontSize: '13px', flexShrink: 0, marginTop: '1px' }}>›</span>
                      <span style={{ fontSize: '12px', color: '#888', lineHeight: '1.5' }}>{tip.text}</span>
                    </div>
                    <span style={{
                      fontSize: '10px', fontFamily: "'SF Mono', monospace",
                      color: '#00c853', background: 'rgba(0,200,83,0.06)',
                      border: '1px solid rgba(0,200,83,0.15)',
                      padding: '2px 7px', borderRadius: '4px',
                      whiteSpace: 'nowrap', flexShrink: 0,
                    }}>{tip.savings}</span>
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      </div>
      </div>
    </div>
  )
}
