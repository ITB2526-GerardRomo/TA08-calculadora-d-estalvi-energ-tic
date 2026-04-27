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

// Mesures i els seus pesos per indicador (suma lliure, s'aplica cap reductor global)
const MEASURES = {
  'sld-led':         { groups: ['energia'],           weight: 1.0 },
  'sld-sensors':     { groups: ['energia'],           weight: 1.0 },
  'sld-apagat':      { groups: ['energia'],           weight: 1.0 },
  'sld-aixetes':     { groups: ['agua'],              weight: 1.0 },
  'sld-cisternes':   { groups: ['agua'],              weight: 1.0 },
  'sld-fugues':      { groups: ['agua'],              weight: 1.0 },
  'sld-impressio':   { groups: ['oficina'],           weight: 1.0 },
  'sld-paper':       { groups: ['oficina'],           weight: 1.0 },
  'sld-eco':         { groups: ['neteja'],            weight: 1.0 }
};

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
 * Calcula la reducció per grup, aplicant un cap realista.
 * La suma bruta mai supera el 30% global (invisible per l'usuari).
 */
function calcReductions() {
  const raw = { energia: 0, agua: 0, oficina: 0, neteja: 0 };

  Object.entries(MEASURES).forEach(([sliderId, cfg]) => {
    const chkId = sliderId.replace('sld-', 'chk-');
    const isOn = state.toggles[chkId] ?? false;
    if (!isOn) return;
    const val = state.sliders[sliderId] ?? 0;
    const max = parseInt(document.getElementById(sliderId)?.max || 8);
    const pct = (val / max); // 0–1
    cfg.groups.forEach(g => { raw[g] += pct * getGroupMax(g, chkId); });
  });

  // Calcula la reducció bruta global ponderada
  const weights = { energia: 0.50, agua: 0.20, oficina: 0.16, neteja: 0.14 };
  let grossGlobal = Object.entries(weights).reduce((s, [g, w]) => s + raw[g] * w, 0);

  // Factor corrector: si grossGlobal > 30%, escalar tot proporcional (invisible)
  const MAX_GLOBAL = 30;
  const corrector = grossGlobal > MAX_GLOBAL ? MAX_GLOBAL / grossGlobal : 1;

  const result = {};
  Object.keys(raw).forEach(g => { result[g] = Math.min(raw[g] * corrector, 35); });
  result.total = grossGlobal > MAX_GLOBAL ? MAX_GLOBAL : grossGlobal;

  return result;
}

// Max potencial per grup (suma de tots els sliders del grup al màxim)
function getGroupMax(group, activeChk) {
  const maxes = {
    energia:  { 'chk-led': 8, 'chk-sensors': 5, 'chk-apagat': 4 },
    agua:     { 'chk-aixetes': 5, 'chk-cisternes': 6, 'chk-fugues': 5 },
    oficina:  { 'chk-impressio': 6, 'chk-paper': 5 },
    neteja:   { 'chk-eco': 4 }
  };
  const sums  = { energia: 17, agua: 16, oficina: 11, neteja: 4 };
  return ((maxes[group]?.[activeChk] ?? 0) / sums[group]) * 100;
}

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
      const pct = ((parseFloat(sld.value) / max) * 100).toFixed(0);
      const chkId = sld.id.replace('sld-', 'chk-');
      const isOn = state.toggles[chkId] ?? false;
      if (lblId) document.getElementById(lblId).textContent = isOn ? `+${pct}%` : '+0%';
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
      // Update label
      const lblId = sld.dataset.label;
      if (lblId) document.getElementById(lblId).textContent = `+100%`;
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
