/* ========================================
   NEXUS · ITB Sostenibilitat
   script.js — Lògica principal
   ======================================== */

// ── DADES BASE (simulen el JSON real del centre) ──────────────────────────────
const DATA = {
  energia:     { anual: 56688, escolar: 47240, unit: 'kWh',  cost: 0.18,  co2: 0.22,  label: 'Electricitat', icon: '⚡', color: '#c8f542' },
  agua:        { anual: 244.8, escolar: 204,   unit: 'm³',   cost: 2.80,  co2: 0.0003, label: 'Aigua',       icon: '💧', color: '#4af4c8' },
  oficina:     { anual: 6542,  escolar: 5452,  unit: '€',    cost: 1,     co2: 0.012, label: 'Material oficina', icon: '📎', color: '#a855f7' },
  neteja:      { anual: 2160,  escolar: 1800,  unit: '€',    cost: 1,     co2: 0.008, label: 'Neteja', icon: '🧹', color: '#f5a442' }
};

// Mesures amb la seva contribució màxima al % global de reducció.
// Cada valor maxGlobalPct correspon directament al pla d'acció de 3 anys.
// Suma total de tots els maxGlobalPct = 30% (objectiu del pla).
const MEASURES = {
  //  Slider ID          Grup        Pla d'acció                  Max global
  'sld-led':       { group: 'energia', maxGlobalPct: 5 },  // LED (−3%) + auditoria (−2%)
  'sld-sensors':   { group: 'energia', maxGlobalPct: 5 },  // Sensors presència (−4%) + fotovoltaic parcial
  'sld-apagat':    { group: 'energia', maxGlobalPct: 4 },  // Apagat nit + reparació equips (−1%) + IT
  'sld-aixetes':   { group: 'agua',    maxGlobalPct: 2 },  // Estalvi aigua directe
  'sld-cisternes': { group: 'agua',    maxGlobalPct: 2 },  // Estalvi descàrrega
  'sld-fugues':    { group: 'agua',    maxGlobalPct: 3 },  // Detecció fugues (−3%)
  'sld-impressio': { group: 'oficina', maxGlobalPct: 3 },  // Impressió responsable (−2%) + compra verda
  'sld-paper':     { group: 'oficina', maxGlobalPct: 3 },  // Paper reciclat + compra verda (−3%)
  'sld-eco':       { group: 'neteja',  maxGlobalPct: 3 },  // Productes ecològics (−2%) + reutilització IT
};
// ∑ maxGlobalPct = 5+5+4+2+2+3+3+3+3 = 30% ✓

// Pes de cada grup en el cost total (per calcular la reducció per categoria)
const GROUP_WEIGHTS = { energia: 0.50, agua: 0.20, oficina: 0.16, neteja: 0.14 };

// ── ESTAT ─────────────────────────────────────────────────────────────────────
const state = {
  toggles: {},
  sliders: {},
  reduction: { energia: 0, agua: 0, oficina: 0, neteja: 0, total: 0 }
};

// ── UTILITATS ─────────────────────────────────────────────────────────────────
function fmt(val, decimals = 0) {
  return val.toLocaleString('ca-ES', { maximumFractionDigits: decimals });
}

/**
 * Calcula la reducció global i per grup.
 * Cada mesura aporta directament el seu maxGlobalPct (proporcional al slider).
 * La suma de tots els maxGlobalPct al 100% = 30% (objectiu del pla).
 */
function calcReductions() {
  const byGroup = { energia: 0, agua: 0, oficina: 0, neteja: 0 };

  Object.entries(MEASURES).forEach(([sliderId, cfg]) => {
    const chkId = sliderId.replace('sld-', 'chk-');
    if (!(state.toggles[chkId] ?? false)) return;
    const sld = document.getElementById(sliderId);
    if (!sld) return;
    const ratio = parseFloat(sld.value) / parseFloat(sld.max); // 0–1
    byGroup[cfg.group] += ratio * cfg.maxGlobalPct;
  });

  // Total global (mai supera el 30% físicament possible)
  const totalGlobal = Math.min(
    Object.values(byGroup).reduce((s, v) => s + v, 0),
    30
  );

  // Reducció per categoria: contribució global del grup / pes del grup en el cost total
  const result = {};
  Object.keys(byGroup).forEach(g => {
    result[g] = Math.min(byGroup[g] / GROUP_WEIGHTS[g], 100);
  });
  result.total = totalGlobal;

  return result;
}

// getGroupMax ja no cal — la lògica és directa via maxGlobalPct

// ── CHARTS ────────────────────────────────────────────────────────────────────
let chartAnual, chartEscolar, chartDonut;

const CHART_DEFAULTS = {
  color: (ctx, fallback) => {
    if (!ctx?.chart?.ctx) return fallback;
    const g = ctx.chart.ctx.createLinearGradient(0, 0, 0, ctx.chart.height);
    g.addColorStop(0, fallback + 'cc'); g.addColorStop(1, fallback + '22');
    return g;
  }
};

function buildCharts() {
  const labels = Object.values(DATA).map(d => d.label);
  const currentVals = Object.values(DATA).map(d => d.anual * d.cost);
  const optVals = currentVals.slice();

  const barOpts = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: { legend: { display: false }, tooltip: {
      backgroundColor: '#161a14', titleColor: '#c8f542', bodyColor: '#e8edd4',
      borderColor: 'rgba(200,245,66,0.2)', borderWidth: 1,
      callbacks: { label: ctx => ` ${fmt(ctx.raw, 0)} €` }
    }},
    scales: {
      x: { ticks: { color: 'rgba(232,237,212,0.5)', font: { family: 'DM Mono', size: 11 } }, grid: { color: 'rgba(255,255,255,0.04)' }, border: { color: 'rgba(255,255,255,0.1)' } },
      y: { ticks: { color: 'rgba(232,237,212,0.5)', font: { family: 'DM Mono', size: 11 }, callback: v => fmt(v, 0) + ' €' }, grid: { color: 'rgba(255,255,255,0.04)' }, border: { color: 'rgba(255,255,255,0.1)' } }
    }
  };

  // ANUAL
  chartAnual = new Chart(document.getElementById('chartAnual'), {
    type: 'bar',
    data: {
      labels,
      datasets: [
        { label: 'Actual', data: currentVals, backgroundColor: 'rgba(200,245,66,0.7)', borderColor: '#c8f542', borderWidth: 1, borderRadius: 6 },
        { label: 'Amb mesures', data: optVals, backgroundColor: 'rgba(74,244,200,0.7)', borderColor: '#4af4c8', borderWidth: 1, borderRadius: 6 }
      ]
    },
    options: { ...barOpts }
  });

  // ESCOLAR
  const escolarCurrent = Object.values(DATA).map(d => d.escolar * d.cost);
  chartEscolar = new Chart(document.getElementById('chartEscolar'), {
    type: 'bar',
    data: {
      labels,
      datasets: [
        { label: 'Actual', data: escolarCurrent.slice(), backgroundColor: 'rgba(200,245,66,0.7)', borderColor: '#c8f542', borderWidth: 1, borderRadius: 6 },
        { label: 'Amb mesures', data: escolarCurrent.slice(), backgroundColor: 'rgba(74,244,200,0.7)', borderColor: '#4af4c8', borderWidth: 1, borderRadius: 6 }
      ]
    },
    options: { ...barOpts }
  });

  // DONUT
  chartDonut = new Chart(document.getElementById('chartDonut'), {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{ data: currentVals, backgroundColor: ['#c8f542cc', '#4af4c8cc', '#a855f7cc', '#f5a442cc'], borderColor: '#0a0c0a', borderWidth: 3, hoverOffset: 8 }]
    },
    options: {
      responsive: true, maintainAspectRatio: false, cutout: '65%',
      plugins: {
        legend: { display: true, position: 'bottom', labels: { color: 'rgba(232,237,212,0.6)', font: { family: 'DM Mono', size: 11 }, padding: 16, boxWidth: 12 } },
        tooltip: { backgroundColor: '#161a14', titleColor: '#c8f542', bodyColor: '#e8edd4', borderColor: 'rgba(200,245,66,0.2)', borderWidth: 1, callbacks: { label: ctx => ` ${fmt(ctx.raw, 0)} €` } }
      }
    }
  });

  updateDonutCenter();
}

function updateDonutCenter() {
  const total = Object.values(DATA).reduce((s, d) => s + d.anual * d.cost, 0);
  document.getElementById('donutCenter').querySelector('.donut-val').textContent = fmt(total, 0) + ' €';
}

// ── INDICADORS ────────────────────────────────────────────────────────────────
function buildIndicators() {
  const grid = document.getElementById('indicatorsGrid');
  grid.innerHTML = '';
  const reductions = calcReductions();

  const indicators = [
    { key: 'energia', period: 'anual',   label: 'Electricitat any complet',     reduction: reductions.energia },
    { key: 'energia', period: 'escolar', label: 'Electricitat període escolar',  reduction: reductions.energia },
    { key: 'agua',    period: 'anual',   label: 'Aigua any complet',             reduction: reductions.agua },
    { key: 'agua',    period: 'escolar', label: 'Aigua període escolar',         reduction: reductions.agua },
    { key: 'oficina', period: 'anual',   label: 'Material oficina any complet',  reduction: reductions.oficina },
    { key: 'oficina', period: 'escolar', label: 'Material oficina esc.',         reduction: reductions.oficina },
    { key: 'neteja',  period: 'anual',   label: 'Neteja any complet',            reduction: reductions.neteja },
    { key: 'neteja',  period: 'escolar', label: 'Neteja període escolar',        reduction: reductions.neteja }
  ];

  indicators.forEach((ind, i) => {
    const d = DATA[ind.key];
    const current = ind.period === 'anual' ? d.anual : d.escolar;
    const optimized = current * (1 - ind.reduction / 100);
    const pct = ind.reduction;

    const card = document.createElement('div');
    card.className = 'indicator-card';
    card.style.setProperty('--indicator-color', d.color);
    card.innerHTML = `
      <div class="ind-header">
        <span class="ind-icon">${d.icon}</span>
        <span class="ind-name">${ind.label}</span>
        <span class="ind-period">${ind.period === 'anual' ? '12 mesos' : 'Set–Jun'}</span>
      </div>
      <div class="ind-values">
        <div class="ind-val-block">
          <div class="ind-val-label">ACTUAL</div>
          <div class="ind-val-num current" id="ind-cur-${i}">${fmt(current, 1)}</div>
          <div class="ind-unit">${d.unit}</div>
        </div>
        <div class="ind-val-block">
          <div class="ind-val-label">AMB MESURES</div>
          <div class="ind-val-num optimized" id="ind-opt-${i}">${fmt(optimized, 1)}</div>
          <div class="ind-unit">${d.unit}</div>
        </div>
      </div>
      <div class="ind-bar"><div class="ind-bar-fill" id="ind-bar-${i}" style="width:${pct}%"></div></div>
      <div class="ind-reduction" id="ind-red-${i}">−${fmt(pct, 1)}% de reducció aplicada</div>
    `;
    grid.appendChild(card);
  });
}

function updateIndicators() {
  const reductions = calcReductions();
  const indicators = [
    { key: 'energia', period: 'anual',   reduction: reductions.energia },
    { key: 'energia', period: 'escolar', reduction: reductions.energia },
    { key: 'agua',    period: 'anual',   reduction: reductions.agua },
    { key: 'agua',    period: 'escolar', reduction: reductions.agua },
    { key: 'oficina', period: 'anual',   reduction: reductions.oficina },
    { key: 'oficina', period: 'escolar', reduction: reductions.oficina },
    { key: 'neteja',  period: 'anual',   reduction: reductions.neteja },
    { key: 'neteja',  period: 'escolar', reduction: reductions.neteja }
  ];
  indicators.forEach((ind, i) => {
    const d = DATA[ind.key];
    const current = ind.period === 'anual' ? d.anual : d.escolar;
    const optimized = current * (1 - ind.reduction / 100);
    const pct = ind.reduction;
    const optEl = document.getElementById(`ind-opt-${i}`);
    const barEl = document.getElementById(`ind-bar-${i}`);
    const redEl = document.getElementById(`ind-red-${i}`);
    if (optEl) optEl.textContent = fmt(optimized, 1);
    if (barEl) barEl.style.width = Math.min(pct, 100) + '%';
    if (redEl) redEl.textContent = `−${fmt(pct, 1)}% de reducció aplicada`;
  });
}

// ── UPDATE CHARTS ─────────────────────────────────────────────────────────────
function updateCharts() {
  const reductions = calcReductions();
  const keys = Object.keys(DATA);

  keys.forEach((key, i) => {
    const d = DATA[key];
    const rPct = (reductions[key] || 0) / 100;

    if (chartAnual) {
      chartAnual.data.datasets[1].data[i] = d.anual * d.cost * (1 - rPct);
      chartAnual.update('none');
    }
    if (chartEscolar) {
      chartEscolar.data.datasets[1].data[i] = d.escolar * d.cost * (1 - rPct);
      chartEscolar.update('none');
    }
  });
}

// ── UPDATE HERO METRICS ───────────────────────────────────────────────────────
function updateHero() {
  const reductions = calcReductions();
  const totalReduction = reductions.total;

  // Total cost saving
  const totalCost = Object.values(DATA).reduce((s, d) => s + d.anual * d.cost, 0);
  const savings = totalCost * (totalReduction / 100);

  // CO2 avoided (rough estimate from energy reduction)
  const energyReduction = DATA.energia.anual * (reductions.energia / 100);
  const co2Avoided = energyReduction * DATA.energia.co2 * 1000; // kg

  document.getElementById('hmReduction').textContent = fmt(totalReduction, 1) + '%';
  document.getElementById('hmSaving').textContent = fmt(savings, 0) + ' €';
  document.getElementById('hmCO2').textContent = fmt(co2Avoided, 0) + ' kg';

  // Total bar
  const fill = document.getElementById('totalFill');
  const pctDisplay = document.getElementById('totalPct');
  if (fill) fill.style.width = Math.min((totalReduction / 30) * 100, 100) + '%';
  if (pctDisplay) pctDisplay.textContent = fmt(totalReduction, 1) + '%';

  // Status dot
  const dot = document.getElementById('statusDot');
  const txt = document.getElementById('statusText');
  if (totalReduction > 25) {
    dot.style.background = '#4af4c8';
    txt.textContent = 'ÒPTIM';
  } else if (totalReduction > 10) {
    dot.style.background = '#c8f542';
    txt.textContent = 'EN PROGRÉS';
  } else {
    dot.style.background = 'rgba(200,245,66,0.4)';
    txt.textContent = 'INICIAL';
  }
}

// ── MAIN UPDATE ───────────────────────────────────────────────────────────────
function update() {
  updateHero();
  updateCharts();
  updateIndicators();
}

// ── INIT CONTROLS ─────────────────────────────────────────────────────────────
function initControls() {
  // Collect all toggles & sliders
  document.querySelectorAll('.toggle').forEach(chk => {
    state.toggles[chk.id] = chk.checked;
    chk.addEventListener('change', () => {
      state.toggles[chk.id] = chk.checked;
      const sldId = chk.id.replace('chk-', 'sld-');
      const sld = document.getElementById(sldId);
      if (sld) sld.disabled = !chk.checked;
      update();
    });
    // Init slider enabled state
    const sldId = chk.id.replace('chk-', 'sld-');
    const sld = document.getElementById(sldId);
    if (sld) sld.disabled = !chk.checked;
  });

  document.querySelectorAll('.slider').forEach(sld => {
    state.sliders[sld.id] = parseFloat(sld.value);
    const lblId = sld.dataset.label;
    const updateLabel = () => {
      const max = parseFloat(sld.max);
      const chkId = sld.id.replace('sld-', 'chk-');
      const isOn = state.toggles[chkId] ?? false;
      if (lblId) {
        if (isOn && MEASURES[sld.id]) {
          const contribution = ((parseFloat(sld.value) / max) * MEASURES[sld.id].maxGlobalPct).toFixed(1);
          document.getElementById(lblId).textContent = `−${contribution}%`;
        } else {
          document.getElementById(lblId).textContent = '−0%';
        }
      }
    };
    sld.addEventListener('input', () => {
      state.sliders[sld.id] = parseFloat(sld.value);
      updateLabel();
      update();
    });
    updateLabel();
  });
}

// ── CHART TABS ────────────────────────────────────────────────────────────────
function initTabs() {
  document.querySelectorAll('.chart-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.chart-tab').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.chart-pane').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('pane-' + btn.dataset.tab).classList.add('active');
    });
  });
}

// ── IMPLEMENT BUTTON ──────────────────────────────────────────────────────────
document.getElementById('implementBtn').addEventListener('click', () => {
  // Smooth scroll to top (hero / calculadora)
  document.getElementById('calculadora').scrollIntoView({ behavior: 'smooth', block: 'start' });

  // Wait for scroll, then apply all measures to max
  setTimeout(() => {
    document.querySelectorAll('.toggle').forEach(chk => {
      chk.checked = true;
      state.toggles[chk.id] = true;
      const sldId = chk.id.replace('chk-', 'sld-');
      const sld = document.getElementById(sldId);
      if (sld) sld.disabled = false;
    });
    document.querySelectorAll('.slider').forEach(sld => {
      sld.value = sld.max;
      state.sliders[sld.id] = parseFloat(sld.max);
      // Mostra la contribució real al % global
      const lblId = sld.dataset.label;
      if (lblId && MEASURES[sld.id]) {
        document.getElementById(lblId).textContent = `−${MEASURES[sld.id].maxGlobalPct.toFixed(1)}%`;
      }
    });
    // Animate the panel
    document.querySelector('.controls-panel').classList.add('implementing');
    setTimeout(() => document.querySelector('.controls-panel').classList.remove('implementing'), 600);
    update();
  }, 600);
});

// ── BOOT ──────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initControls();
  initTabs();
  buildCharts();
  buildIndicators();
  update();
});
