# Scientific Algorithms & Physiological Formulations

## 1. NOAA Rothfusz Heat Index ($HI$)
Implemented in `backend/app/algorithms/thermal.py`.
Uses 9-parameter multivariable polynomial regression derived from heat balance equations:

$$HI = -42.379 + 2.04901523 T + 10.14333127 RH - 0.22475541 T \cdot RH - 0.00683783 T^2 - 0.05481717 RH^2 + 0.00122874 T^2 \cdot RH + 0.00085282 T \cdot RH^2 - 0.00000199 T^2 \cdot RH^2$$

## 2. Wet-Bulb Globe Temperature ($WBGT$)
Calculated for outdoor sunlit conditions:

$$WBGT = 0.7 T_{nw} + 0.2 T_g + 0.1 T_d$$

Where:
- $T_{nw}$: Natural wet-bulb temperature via Stull (2011) formula.
- $T_g$: Solar globe temperature via Liljegren outdoor model ($T + 0.017 S - 0.208 v + 0.608$).
- Formally marked as **Estimated WBGT**.

## 3. Universal Thermal Climate Index ($UTCI$)
Operational 6th-order polynomial approximation by Bröde et al. (2012) incorporating $T$, relative humidity $RH$, 10m wind speed vector $v_{10}$, and mean radiant temperature offset $\Delta T_{mrt}$.
Formally marked as **Estimated UTCI**.

## 4. Human Thermal Stress Index ($HTSI$)
Normalized score (0 to 100) combining weighted thermal forcing factors. Configured via `app/config/htsi_weights.json`:

```json
{
  "temperature_weight": 0.20,
  "humidity_weight": 0.15,
  "wind_weight": 0.10,
  "radiation_weight": 0.15,
  "wbgt_weight": 0.20,
  "utci_weight": 0.20
}
```

### Risk Level Mapping:
- **0–20**: LOW
- **21–40**: MODERATE
- **41–60**: HIGH
- **61–80**: VERY HIGH
- **81–100**: EXTREME
