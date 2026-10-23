const STORAGE_KEY = "solar_hybrid_loads_v1";
let roiChartInstance = null;

// Standard Commercial Inverter Sizes (kVA)
const STANDARD_INVERTERS_KVA = [1.5, 2.5, 3.5, 5.0, 7.5, 10.0, 15.0, 20.0, 30.0, 50.0, 100.0];

// Preloaded Workshop & Office Electrical Loads
const DEFAULT_LOADS = [
    { id: 1, name: "Kiln Draft Blower Motor (0.75 hp)", watts: 560, qty: 2, hours: 8, surge: 3.0 },
    { id: 2, name: "Workshop LED High-Bay Luminaires", watts: 100, qty: 6, hours: 10, surge: 1.0 },
    { id: 3, name: "Submersible Borehole Pump (1.0 hp)", watts: 750, qty: 1, hours: 2, surge: 3.0 },
    { id: 4, name: "Engineering Workstations & Monitors", watts: 150, qty: 3, hours: 8, surge: 1.0 }
];

let loads = [];

function initApp() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
        try {
            loads = JSON.parse(saved);
        } catch {
            loads = DEFAULT_LOADS;
        }
    } else {
        loads = DEFAULT_LOADS;
        saveLoads();
    }
    runEngineeringModel();
}

function saveLoads() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(loads));
}

function runEngineeringModel() {
    const tbody = document.getElementById("load_tbody");
    tbody.innerHTML = "";

    let totalRunningWatts = 0;
    let totalSurgeWatts = 0;
    let totalDailyWh = 0;

    loads.forEach(item => {
        const lineWatts = item.watts * item.qty;
        const lineSurge = lineWatts * item.surge;
        const lineWh = lineWatts * item.hours;

        totalRunningWatts += lineWatts;
        totalSurgeWatts += lineSurge;
        totalDailyWh += lineWh;

        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td><strong>${item.name}</strong></td>
            <td>${item.watts} W</td>
            <td>${item.qty}</td>
            <td>${lineWatts.toLocaleString()} W</td>
            <td>${lineSurge.toLocaleString()} W <small>(${item.surge}x)</small></td>
            <td>${item.hours} h</td>
            <td>${lineWh.toLocaleString()} Wh</td>
            <td><button class="btn-del" onclick="removeLoad(${item.id})">✕</button></td>
        `;
        tbody.appendChild(tr);
    });

    const dailyKwh = totalDailyWh / 1000;
    const peakKw = totalRunningWatts / 1000;
    const surgeKw = totalSurgeWatts / 1000;

    // Read System Config Inputs
    const sysVoltage = parseFloat(document.getElementById("sys_voltage").value);
    const battDod = parseFloat(document.getElementById("batt_dod").value);
    const autonomyDays = parseFloat(document.getElementById("autonomy_days").value);
    const powerFactor = parseFloat(document.getElementById("power_factor").value);
    const psh = parseFloat(document.getElementById("peak_sun_hours").value);
    const panelWatts = parseFloat(document.getElementById("panel_wattage").value);

    // 1. Inverter Sizing (25% continuous safety margin + 200% peak overload capability check)
    const contKvaReq = (peakKw * 1.25) / powerFactor;
    const surgeKvaReq = (surgeKw / 2.0) / powerFactor;
    const rawKva = Math.max(contKvaReq, surgeKvaReq);
    const recommendedKva = STANDARD_INVERTERS_KVA.find(s => s >= rawKva) || Math.ceil(rawKva);

    // 2. Battery Bank Sizing (Inverter efficiency = 92%)
    const invEfficiency = 0.92;
    const requiredBatteryKwh = (dailyKwh * autonomyDays) / (invEfficiency * battDod);
    const requiredBatteryAh = (requiredBatteryKwh * 1000) / sysVoltage;

    // 3. Solar PV Array Sizing (Overall system derating = 0.78 for temp, dust, MPPT losses)
    const pvDerating = 0.78;
    const requiredPvKwp = dailyKwh / (psh * pvDerating);
    const numPanels = Math.ceil((requiredPvKwp * 1000) / panelWatts);
    const actualInstalledKwp = (numPanels * panelWatts) / 1000;

    // 4. Hybrid Generator vs. Solar ROI Economics
    const solarCapex = parseFloat(document.getElementById("solar_capex").value);
    const fuelPrice = parseFloat(document.getElementById("fuel_price").value);
    const genLph = parseFloat(document.getElementById("gen_lph").value);
    const genHours = parseFloat(document.getElementById("gen_hours").value);
    const genMaint = parseFloat(document.getElementById("gen_maint").value);

    const monthlyFuelCost = genLph * genHours * 30 * fuelPrice;
    const monthlyGenTotal = monthlyFuelCost + genMaint;
    const paybackMonths = monthlyGenTotal > 0 ? (solarCapex / monthlyGenTotal) : 0;
    const fiveYearGenCost = monthlyGenTotal * 60;
    const fiveYearNetSavings = fiveYearGenCost - solarCapex;

    // Update DOM KPIs
    document.getElementById("kpi_daily_kwh").innerHTML = `${dailyKwh.toFixed(2)} <small>kWh/d</small>`;
    document.getElementById("kpi_peak_load").innerText = `Cont: ${peakKw.toFixed(2)} kW | Surge: ${surgeKw.toFixed(2)} kW`;

    document.getElementById("kpi_inverter_kva").innerHTML = `${recommendedKva.toFixed(1)} <small>kVA</small>`;
    document.getElementById("kpi_inverter_spec").innerText = `Min Req: ${rawKva.toFixed(1)} kVA @ PF ${powerFactor}`;

    document.getElementById("kpi_battery_kwh").innerHTML = `${requiredBatteryKwh.toFixed(1)} <small>kWh</small>`;
    document.getElementById("kpi_battery_ah").innerText = `${Math.ceil(requiredBatteryAh).toLocaleString()} Ah @ ${sysVoltage}V (${battDod * 100}% DoD)`;

    document.getElementById("kpi_pv_kwp").innerHTML = `${actualInstalledKwp.toFixed(2)} <small>kWp</small>`;
    document.getElementById("kpi_pv_panels").innerText = `${numPanels} × ${panelWatts}W Panels (${psh}h PSH)`;

    document.getElementById("kpi_payback").innerHTML = `${paybackMonths.toFixed(1)} <small>Months</small>`;
    document.getElementById("kpi_five_yr_savings").innerText = `5-Yr Net Savings: ${fiveYearNetSavings.toLocaleString()}`;

    renderRoiChart(solarCapex, monthlyGenTotal);
}

function renderRoiChart(solarCapex, monthlyGenExpense) {
    const labels = [];
    const genTrajectory = [];
    const solarTrajectory = [];

    // Annual minor O&M for solar (~1.5% of CAPEX per year, divided monthly)
    const monthlySolarOm = (solarCapex * 0.015) / 12;

    for (let m = 0; m <= 60; m += 6) {
        labels.push(`Month ${m}`);
        genTrajectory.push(Math.round(monthlyGenExpense * m));
        solarTrajectory.push(Math.round(solarCapex + (monthlySolarOm * m)));
    }

    const ctx = document.getElementById("roiChart").getContext("2d");
    if (roiChartInstance) roiChartInstance.destroy();

    roiChartInstance = new Chart(ctx, {
        type: "line",
        data: {
            labels,
            datasets: [
                {
                    label: "Cumulative Generator Expense (Fuel + Servicing)",
                    data: genTrajectory,
                    borderColor: "#f87171",
                    backgroundColor: "rgba(248, 113, 113, 0.1)",
                    borderWidth: 2.5,
                    tension: 0.2,
                    fill: true
                },
                {
                    label: "Solar Hybrid Turnkey CAPEX + O&M",
                    data: solarTrajectory,
                    borderColor: "#38bdf8",
                    backgroundColor: "rgba(56, 189, 248, 0.05)",
                    borderWidth: 2.5,
                    borderDash: [5, 5],
                    tension: 0.1,
                    fill: false
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: "index", intersect: false },
            plugins: {
                legend: { labels: { color: "#94a3b8" } }
            },
            scales: {
                x: {
                    grid: { color: "#334155" },
                    ticks: { color: "#94a3b8" }
                },
                y: {
                    grid: { color: "#334155" },
                    ticks: { color: "#94a3b8" },
                    title: { display: true, text: "Cumulative Cost", color: "#94a3b8" }
                }
            }
        }
    });
}

window.removeLoad = function(id) {
    loads = loads.filter(item => item.id !== id);
    saveLoads();
    runEngineeringModel();
};

document.getElementById("add_load_form").addEventListener("submit", function(e) {
    e.preventDefault();
    const newLoad = {
        id: Date.now(),
        name: document.getElementById("load_name").value.trim(),
        watts: parseFloat(document.getElementById("load_watts").value),
        qty: parseInt(document.getElementById("load_qty").value, 10),
        hours: parseFloat(document.getElementById("load_hours").value),
        surge: parseFloat(document.getElementById("load_surge").value)
    };
    loads.push(newLoad);
    saveLoads();
    runEngineeringModel();
    this.reset();
    document.getElementById("load_qty").value = 1;
    document.getElementById("load_hours").value = 6;
});

document.getElementById("system_config_form").addEventListener("submit", function(e) {
    e.preventDefault();
    runEngineeringModel();
});

document.addEventListener("DOMContentLoaded", initApp);