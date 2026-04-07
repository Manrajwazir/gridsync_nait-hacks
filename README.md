# GridSync — Alberta Grid Intelligence Platform

> AI-powered 48-hour demand forecasting and real-time demand response coordination for AESO, Alberta utilities, and municipalities.

---

## What It Does

GridSync gives grid operators **48 hours of advance warning** before demand stress peaks — then lets them send a province-wide demand response alert to subscribed endpoints in under 1 second.

**The core loop:**
1. A Prophet ML model forecasts Alberta's grid demand for the next 48 hours
2. Operators review the forecast on the intelligence dashboard
3. If a stress window is predicted, they send a demand response alert
4. Subscribers (utilities, facilities, municipalities) receive the alert and reduce load *before* the crisis materializes

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    GridSync Platform                         │
│                                                              │
│  Landing Page (/)        ──► B2G pitch, live stats          │
│  Subscriber Portal (/dashboard) ──► Live grid, alert banner │
│  Login (/login)          ──► Operator auth (Supabase)       │
│  Operator Dashboard (/operator) ──► Intelligence + actions  │
│    ├── Grid Health Score                                     │
│    ├── Generation Mix tab                                    │
│    ├── 48h Forecast (/operator/predictions)                  │
│    ├── Send Alerts (/operator/alerts)                        │
│    └── Analytics (/operator/analytics)                       │
└─────────────────────────────────────────────────────────────┘

Tech stack:
  Next.js 14 (Pages Router) · React · Recharts
  Supabase (Auth + Realtime alerts)
  Python + Prophet ML model
  AESO Current Supply Demand API v2
```

---

## Grid Health Score

The **Grid Health Score** is a 0–100 composite number that answers the question: *"How much runway does the Alberta grid have right now?"*

### Formula

```
score = 100
      − (demandPct / 100) × 55      ← current demand pressure
      − (riskHours / 48)  × 30      ← forecast risk horizon
      + (renewablesPct / 100) × 15   ← renewables stability bonus
```

Clamped to [0, 100].

### Score Bands

| Score | Status | Operator Guidance |
|:---:|:---|:---|
| 75–100 | 🟢 Healthy | No action required |
| 50–74 | 🟡 Elevated | Monitor closely |
| 25–49 | 🟠 Stressed | Consider demand response alert |
| 0–24 | 🔴 Critical | Send alert now |

### Why 55 / 30 / 15?

- **Demand (55 pts max):** The most immediate risk. A grid running at 95% load has almost no buffer for an unexpected trip. This is the dominant factor.
- **Forecast risk (30 pts max):** How many of the next 48 hours are predicted above warning threshold? A clean forecast horizon gives operators confidence. Stale February predictions will score this at maximum penalty.
- **Renewables bonus (15 pts max):** Higher renewable share slightly improves the score — wind/solar at scale helps reduce thermal plant strain, though variability adds uncertainty (hence the bonus is modest).

### Why 13,000 MW as the demand threshold?

The gauge and percentage calculations use **13,000 MW** as the denominator — not Alberta's installed capacity of ~23,310 MW. This is the **demand response trigger threshold**: the operational level above which AESO historically initiates emergency measures. Installed capacity includes generators in maintenance, seasonal outages, etc. The 13,000 MW represents reliably dispatchable supply under typical conditions.

---

## Prediction Pipeline

### How it works

1. **Model:** Facebook Prophet, trained on 8,400+ hours of AESO historical demand data (Feb 2024 – present) with two regressors:
   - `temperature_c` — hourly temperature at Edmonton (lat 53.5, lon -113.5)
   - `is_weekend` — binary flag for Saturday/Sunday demand dip

2. **Training:** `model/merge_and_train.py`
   - Merges `grid_clean.csv` (AESO demand) with `weather_clean.csv` (Open-Meteo)
   - Trains on data up to 2 weeks before the latest date
   - Evaluates on the held-out 2-week period
   - Saves `alberta_model.pkl` and `accuracy.json`

3. **Prediction:** `model/predict.py`
   - Fetches the next 72h of Edmonton temperature forecast from Open-Meteo
   - Builds a 48-hour future DataFrame with matched weather
   - Runs Prophet `.predict()` and writes `public/predictions.json`

### To refresh predictions

```bash
py -3.11 model/predict.py
```

Run from the project root or any directory (paths are `__file__`-relative).

### Prediction JSON structure

```json
{
  "generated_at": "2026-04-06T18:26:05",
  "predictions": [
    {
      "timestamp": "2026-04-06T18:00:00",
      "predicted_mw": 8812,
      "lower_bound": 8273,
      "upper_bound": 9362,
      "capacity_pct": 67.7,
      "risk_level": "safe",
      "temperature_c": 2.7
    }
  ]
}
```

**`capacity_pct`** = `predicted_mw / 13000 × 100`

**`risk_level`** thresholds:
- `safe` → capacity_pct < 86%
- `warning` → 86% ≤ capacity_pct < 94%
- `critical` → capacity_pct ≥ 94%

### 95% Confidence Band

The `lower_bound` and `upper_bound` are Prophet's `yhat_lower` and `yhat_upper` — the 95% prediction interval. Visualised as the shaded band in the GridStatus chart.

---

## Energy Mix (Real-Time Generation Data)

### API Endpoint

`GET /api/energy-mix` — proxies AESO CSD v2 `summary/current`

### Fuel Type Buckets

The AESO API returns raw fuel types. GridSync maps them as follows:

| AESO Fuel Type | GridSync Bucket | Color |
|:---|:---|:---:|
| COGENERATION, COMBINED CYCLE, GAS FIRED STEAM, SIMPLE CYCLE, ENERGY STORAGE | Gas / Thermal | 🟠 |
| WIND | Wind | 🔵 |
| SOLAR | Solar | 🟡 |
| HYDRO | Hydro | 🟢 |
| Everything else | Other | ⬛ |

**Renewables %** = (Wind MW + Solar MW + Hydro MW) / Total Net Generation × 100

**Utilization %** (per source) = `aggregated_net_generation` / `aggregated_maximum_capability` × 100

The distinction: *utilization* shows how much of the installed capacity for each fuel type is actually being dispatched right now. Wind at 48% utilization means 2,702 MW of the 5,684 MW installed wind capacity is generating.

---

## Alert System

### How operators send alerts

1. Operator logs in at `/login` with role `operator`
2. Reviews forecast at `/operator/predictions` — smart banner flags stress windows
3. Navigates to `/operator/alerts`
4. Configures message and triggers — alert row inserted into Supabase `alerts` table

### How subscribers receive alerts

The subscriber portal (`/dashboard`) uses **Supabase Realtime** to listen for new rows in the `alerts` table where `is_active = true`. When an operator creates an alert:
- The Realtime subscription fires
- The subscriber portal shows a red banner within **< 1 second**
- No polling required — pure WebSocket push

---

## Local Development

### Prerequisites

- Node.js 18+
- Python 3.11 (`py -3.11`)
- Supabase project (free tier works)
- AESO API key (register at aeso.ca developer portal)

### Setup

```bash
# Install JS dependencies
npm install

# Install Python dependencies
py -3.11 -m pip install prophet pandas requests

# Copy env file and add your keys
cp .env.local.example .env.local
```

### Environment Variables

```env
AESO_API_KEY=your_aeso_api_key_here
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Run

```bash
# Start dev server
npm run dev

# Refresh 48h predictions (run from project root)
py -3.11 model/predict.py
```

Open `http://localhost:3000`

---

## Data Sources

| Source | What We Use | Refresh Rate |
|:---|:---|:---|
| [AESO CSD API v2](https://apimgw.aeso.ca) | Live grid load, generation mix by fuel type | Every 60s |
| [Open-Meteo](https://open-meteo.com) | Edmonton hourly temperature forecast (72h) | At prediction run |
| [Supabase](https://supabase.com) | Operator auth, real-time alert propagation | WebSocket push |

---

## Accuracy

Evaluated on 2-week held-out test set (most recent data before training cutoff):

| Metric | Value |
|:---|:---|
| MAE | ~350 MW |
| Within ±200 MW | ~65% of hours |
| Within ±500 MW | ~90% of hours |
| Model Accuracy (headline) | 94.2% |

*Headline accuracy = `(1 - MAE / 13000) × 100`*

---

## Future Work

- **Wind/Solar regressors:** Add `wind_mw` and `solar_mw` as Prophet regressors to improve forecast accuracy during high-renewable periods. Requires building a historical fuel-mix CSV from AESO's historical generation API.
- **GitHub Actions:** Re-implement `daily-repredict.yml` to run `predict.py` automatically every morning and commit fresh `predictions.json`
- **Real-time confidence calibration:** Use AESO's 5-minute interval data to re-evaluate Prophet confidence intervals
