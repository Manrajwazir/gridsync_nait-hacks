/*
 * /api/energy-mix — Returns Alberta current generation by fuel type
 * Includes max_capability per source for utilization display.
 * Falls back to realistic mock values if AESO_API_KEY is missing.
 */

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120')

  const apiKey = process.env.AESO_API_KEY
  if (!apiKey) return res.status(200).json(mockMix())

  try {
    const response = await fetch(
      'https://apimgw.aeso.ca/public/currentsupplydemand-api/v2/csd/summary/current',
      { headers: { 'API-Key': apiKey, 'Accept': 'application/json' } }
    )
    if (!response.ok) throw new Error(`AESO ${response.status}`)

    const data = await response.json()
    const report = data?.return || data
    const mix = report?.generation_data_list ?? report?.summary?.generation_data_list ?? null

    if (!mix || !Array.isArray(mix)) {
      console.log('energy-mix: no generation_data_list found, keys:', Object.keys(report || {}))
      return res.status(200).json(mockMix())
    }

    const sources = {}
    for (const entry of mix) {
      const type  = (entry.fuel_type || '').toUpperCase()
      const mw    = Math.round(parseFloat(entry.aggregated_net_generation ?? 0))
      const capMw = Math.round(parseFloat(entry.aggregated_maximum_capability ?? 0))
      const bucket = getBucket(type)
      sources[bucket] = {
        mw:  (sources[bucket]?.mw  ?? 0) + mw,
        cap: (sources[bucket]?.cap ?? 0) + capMw,
      }
    }

    const total    = Object.values(sources).reduce((a, b) => a + b.mw,  0) || 1
    const totalCap = Object.values(sources).reduce((a, b) => a + b.cap, 0) || 1
    return res.status(200).json(buildResult(sources, total, totalCap, report))

  } catch (e) {
    console.error('energy-mix error:', e.message)
    return res.status(200).json(mockMix())
  }
}

function getBucket(type) {
  if (type.includes('WIND'))   return 'wind'
  if (type.includes('SOLAR'))  return 'solar'
  if (type.includes('HYDRO'))  return 'hydro'
  if (type.includes('COGEN') || type.includes('CYCLE') ||
      type.includes('GAS')   || type.includes('STEAM') ||
      type.includes('STORAGE')) return 'gas'
  return 'other'
}

function buildResult(sources, total, totalCap, report) {
  const g = (key) => ({ mw: sources[key]?.mw ?? 0, cap: sources[key]?.cap ?? 0 })
  return {
    total_mw:     total,
    total_cap_mw: totalCap,
    alberta_internal_load: report?.alberta_internal_load ?? null,
    is_mock: false,
    sources: [
      { key: 'gas',   label: 'Gas / Thermal', icon: '🔥', ...g('gas'),   pct: pct(g('gas').mw,   total), color: '#f97316' },
      { key: 'wind',  label: 'Wind',          icon: '💨', ...g('wind'),  pct: pct(g('wind').mw,  total), color: '#00d4ff' },
      { key: 'solar', label: 'Solar',         icon: '☀️', ...g('solar'), pct: pct(g('solar').mw, total), color: '#facc15' },
      { key: 'hydro', label: 'Hydro',         icon: '💧', ...g('hydro'), pct: pct(g('hydro').mw, total), color: '#00c853' },
      { key: 'other', label: 'Other',         icon: '⚙️', ...g('other'), pct: pct(g('other').mw, total), color: '#888'    },
    ],
    renewables_pct: pct(
      (g('wind').mw + g('solar').mw + g('hydro').mw), total
    ),
    generated_at: new Date().toISOString(),
  }
}

function pct(val, total) { return total === 0 ? 0 : Math.round((val / total) * 100) }

function mockMix() {
  const s = {
    gas:   { mw: 6400, cap: 14188 },
    wind:  { mw: 1800, cap: 5684  },
    solar: { mw:  320, cap: 1870  },
    hydro: { mw:  900, cap:  899  },
    other: { mw:  180, cap:  479  },
  }
  const total    = Object.values(s).reduce((a, b) => a + b.mw,  0)
  const totalCap = Object.values(s).reduce((a, b) => a + b.cap, 0)
  return { ...buildResult(s, total, totalCap, {}), is_mock: true }
}
