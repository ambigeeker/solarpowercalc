# Industrial Solar PV, Battery & Generator Hybrid Sizer ☀️🔋

A client-side electrical power engineering and financial modeling tool designed to audit facility loads, size off-grid/hybrid solar-inverter architectures, and evaluate 5-year capital payback against diesel or petrol generator operations.

---

## ⚡ Core Engineering Models

The application sizes hybrid power components using standard electrical engineering equations and practical field derating factors:

### 1. Electrical Load & Surge Auditing
For each electrical appliance or motor load, the daily energy demand and peak starting requirements are computed as:

* **Total Running Power (kW):** Sum of (Unit Wattage × Quantity) ÷ 1000
* **Peak Surge Power (kW):** Sum of (Running Power × Motor Surge Multiplier)
* **Daily Energy Consumption (kWh/day):** Sum of (Running Power × Daily Operating Hours)

### 2. Inverter Sizing (Continuous & Starting Surge)
Inverters must simultaneously handle continuous active loads (with a 25% continuous safety headroom) and transient inductive motor starting currents (assuming a 200% short-duration inverter overload rating):

* **Continuous kVA Requirement:** (Peak Running kW × 1.25) ÷ Power Factor
* **Surge kVA Requirement:** (Peak Surge kW ÷ 2.0) ÷ Power Factor
* **Selected Commercial Rating:** Matched to the next standard industrial kVA tier above the governing requirement.

### 3. Battery Storage Bank Sizing
Calculates total storage capacity based on required days of autonomy, inverter conversion efficiency (92%), DC bus voltage (12V / 24V / 48V), and maximum allowable Depth of Discharge (85% for Lithium LiFePO4, 50% for Tubular Lead-Acid):

* **Gross Storage Capacity (kWh):** (Daily Energy kWh × Autonomy Days) ÷ (0.92 × Max DoD)
* **Nominal Bank Capacity (Ah):** (Gross Storage kWh × 1000) ÷ System DC Bus Voltage

### 4. Solar PV Array Sizing
Accounts for site-specific Peak Sun Hours (PSH) and a 0.78 composite system derating factor (covering thermal cell losses, dust/soiling, wiring voltage drop, and MPPT conversion efficiency):

* **Required Array Capacity (kWp):** Daily Energy kWh ÷ (PSH × 0.78)
* **Module Count:** Rounded up to the nearest whole solar panel based on the selected module wattage (400W – 600W).

### 5. Hybrid Generator vs. Solar ROI Cashflow Model
Compares the upfront turnkey Solar CAPEX (plus 1.5% annual O&M) against baseline generator operating expenses:

* **Monthly Generator OPEX:** (Fuel Liters/hr × Daily Run Hours × 30 Days × Fuel Price/Liter) + Monthly Servicing Cost
* **Simple Payback Period (Months):** Solar Turnkey CAPEX ÷ Monthly Generator OPEX
* **5-Year Net Savings:** (60 Months × Monthly Generator OPEX) − Solar Turnkey CAPEX

---

## 📋 Key Features

* **Interactive Load Schedule:** Preloaded with industrial workshop machinery (blowers, submersible pumps, high-bay LED lighting, and workstations) with support for custom inductive surge multipliers (1.0x to 3.0x).
* **Dynamic Architecture Configuration:** Instant recalculation across 12V, 24V, and 48V DC bus topologies and LiFePO4 vs. Lead-Acid chemistries.
* **5-Year Cumulative Cashflow Chart:** Interactive Chart.js visualization plotting the exact breakeven crossover point between generator fuel burn and solar investment.
* **Persistent Local Storage:** Automatically saves custom load schedules in the browser via `localStorage`.
* **Print-Ready Engineering Audit:** Formatted CSS print media queries for one-click PDF export.

---

## 💻 Tech Stack

* **Frontend:** Semantic HTML5, CSS3 (Responsive Dark UI + Print Media Styles)
* **Engine & Math:** Vanilla JavaScript (ES6+)
* **Data Visualization:** Chart.js
* **Persistence:** Browser `localStorage` API
* **Deployment:** Git & Vercel Edge Network
