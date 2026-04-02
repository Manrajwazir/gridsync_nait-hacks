/*
 * /api/energy-mix — Returns Alberta current generation by fuel type
 *
 * Hits the same AESO CSD v2 endpoint as live-usage but extracts
 * the generation_mix array (gas, wind, solar, hydro, other).
 *
 * Falls back to realistic mock values if AESO_API_KEY is missing.
 */

export default async function handler(req, res) {
  // Cache for 60s — energy mix doesn't change every second
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120')

  const apiKey = process.env.AESO_API_KEY

  if (!apiKey) {
    return res.status(200).json(mockMix())
  }

  try {
    const response = await fetch(
      'https://apimgw.aeso.ca/public/currentsupplydemand-api/v2/csd/summary/current',
      { headers: { 'API-Key': apiKey, 'Accept': 'application/json' } }
    )

    if (!response.ok) throw new Error(`AESO ${response.status}`)

    const data = await response.json()
    const report = data?.return || data

    // Based on real AESO v2 response:
    const mix = report?.generation_data_list ?? report?.summary?.generation_data_list ?? null

    if (!mix || !Array.isArray(mix)) {
      console.log('energy-mix: no generation_data_list found, keys:', Object.keys(report || {}))
      return res.status(200).json(mockMix())
    }

    // Normalise keys based on real response types
    const sources = {}
    for (const entry of mix) {
      const type = (entry.fuel_type || '').toUpperCase()
      const mw   = Math.round(parseFloat(entry.aggregated_net_generation ?? 0))
      
      if (type.includes('WIND')) {
        sources.wind  = (sources.wind  ?? 0) + mw
      } else if (type.includes('SOLAR')) {
        sources.solar = (sources.solar ?? 0) + mw
      } else if (type.includes('HYDRO')) {
        sources.hydro = (sources.hydro ?? 0) + mw
      } else if (
        type.includes('COGEN') || 
        type.includes('CYCLE') || 
        type.includes('GAS') || 
        type.includes('STEAM') ||
        type.includes('STORAGE') // Storage is usually gas-backed or small
      ) {
        sources.gas   = (sources.gas   ?? 0) + mw
      } else {
        sources.other = (sources.other ?? 0) + mw
      }
    }

    const total = Object.values(sources).reduce((a, b) => a + b, 0) || 1
    const result = buildResult(sources, total)
    return res.status(200).json(result)

  } catch (e) {
    console.error('energy-mix error:', e.message)
    return res.status(200).json(mockMix())
  }
}

function buildResult(sources, total) {
  return {
    total_mw: total,
    is_mock: false,
    sources: [
      { key: 'gas',   label: 'Gas / Thermal', mw: sources.gas   ?? 0, pct: pct(sources.gas,   total), color: '#f97316' },
      { key: 'wind',  label: 'Wind',           mw: sources.wind  ?? 0, pct: pct(sources.wind,  total), color: '#00d4ff' },
      { key: 'solar', label: 'Solar',          mw: sources.solar ?? 0, pct: pct(sources.solar, total), color: '#facc15' },
      { key: 'hydro', label: 'Hydro',          mw: sources.hydro ?? 0, pct: pct(sources.hydro, total), color: '#00c853' },
      { key: 'other', label: 'Other',          mw: sources.other ?? 0, pct: pct(sources.other, total), color: '#555'    },
    ],
    renewables_pct: pct((sources.wind ?? 0) + (sources.solar ?? 0) + (sources.hydro ?? 0), total),
    generated_at: new Date().toISOString(),
  }
}

function pct(val, total) { return total === 0 ? 0 : Math.round(((val ?? 0) / total) * 100) }

function mockMix() {
  // Realistic April Alberta mix: mostly gas, decent wind, small solar/hydro
  const sources = { gas: 6400, wind: 1800, solar: 320, hydro: 900, other: 180 }
  const total   = Object.values(sources).reduce((a, b) => a + b, 0)
  return { ...buildResult(sources, total), is_mock: true }
}
