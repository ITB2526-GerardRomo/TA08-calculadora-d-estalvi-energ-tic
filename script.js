/**
 * ╔══════════════════════════════════════════════════════════╗
 * ║   EcoCalc ITB · script.js                              ║
 * ║   Lògica de la Calculadora d'Estalvi Energètic         ║
 * ╚══════════════════════════════════════════════════════════╝
 *
 * Com integrar Chart.js:
 *   El fitxer index.html ja inclou el CDN:
 *   <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.4/dist/chart.umd.min.js"></script>
 *   Aquest script.js s'ha d'incloure DESPRÉS del CDN de Chart.js.
 *
 * Estructura del codi:
 *   1. DADES BASE (constants reals de l'ITB)
 *   2. ESTAT (valors actuals dels sliders/toggles)
 *   3. MOTOR DE CÀLCUL (función `compute`)
 *   4. ACTUALITZACIÓ DE LA UI (funció `updateAll`)
 *   5. GRÀFIC CHART.JS (funció `drawChart`)
 *   6. TAULA ANY A ANY
 *   7. LISTENERS D'EVENTOS
 *   8. INICIALITZACIÓ
 */

'use strict';

/* ══════════════════════════════════════════════════════════
   1. DADES BASE
   Valors reals del diagnòstic ESG de l'ITB (data: 20/03/2026)
   ══════════════════════════════════════════════════════════ */

const BASE = {
  elect: {
    kwhPerDay:       156.8,      // kWh/dia (base: 4724 kWh/mes ÷ ~30,1 dies)
    eurPerKwh:       0.165,      // €/kWh (mercat regulat)
    co2PerKwh:       0.233,      // kg CO₂/kWh (factor IDAE 2024)
    nocturnalPct:    0.08,       // 8% consum nocturn / fugues
  },
  agua: {
    m3PerMonth:      20.4,       // m³/mes (dada real JSON)
    eurPerM3:        3.15,       // €/m³ (tarifa Barcelona)
    nocturnalM3:     2.1,        // m³/mes estimat consum nocturn
  },
  cons: {
    sheetsPerYear:   48000,      // fulls/any (dada real JSON)
    eurPaperPerSheet: 0.0042,    // €/full
    eurRotPerYear:   640,        // €/any en retoladors i similars
  },
  limp: {
    eurPerMonth:     245,        // €/mes (dada real JSON)
    paperHygPct:     0.70,       // 70% = paper higiènic / paper de mà
    otherPct:        0.30,       // 30% = altres productes de neteja
  },
};

/* Factors d'estacionalitat mensual (1.0 = consum normal) */
const SEASON = {
  // Electricitat: pics a l'hivern (calefacció) i estiu (AC)
  elect:  [1.15, 1.10, 1.00, 0.95, 0.92, 0.90, 1.05, 1.08, 0.98, 1.00, 1.05, 1.15],
  // Agua: més alta a la tardor/primavera (curs actiu)
  agua:   [0.85, 0.88, 1.05, 1.10, 1.08, 0.75, 0.40, 0.35, 1.05, 1.15, 1.10, 0.88],
  // Consumibles: segueix el calendari escolar
  cons:   [1.10, 1.05, 1.05, 1.08, 1.10, 0.90, 0.20, 0.15, 1.00, 1.12, 1.10, 1.05],
  // Neteja: estable, lleugera baixada estiu
  limp:   [1.05, 1.05, 1.00, 1.00, 1.00, 0.80, 0.50, 0.45, 1.00, 1.05, 1.05, 1.00],
};

const MONTHS = ['Gen','Feb','Mar','Abr','Mai','Jun','Jul','Ago','Set','Oct','Nov','Des'];
const DAYS   = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

/* Mesos del curs lectiu (Set=8 ... Jun=5 en index 0-based) */
const LECTIU = [8, 9, 10, 11, 0, 1, 2, 3, 4, 5]; // Set, Oct, Nov, Des, Gen, Feb, Mar, Abr, Mai, Jun

/* Variabilitat ±5% mensual (seed fix per reproductibilitat) */
const VARIABILITY = [1.03, 0.97, 1.05, 0.98, 1.01, 0.96, 1.04, 0.99, 1.02, 0.98, 1.03, 0.97];

/* ══════════════════════════════════════════════════════════
   2. ESTAT
   ══════════════════════════════════════════════════════════ */

const state = {
  /* Valors dels sliders (%) */
  sliders: {
    'elect-red':   20,
    'elect-solar': 15,
    'elect-clima':  0,
    'agua-red':    15,
    'agua-fugas':   0,
    'cons-papel':  25,
    'cons-dig':     0,
    'limp-sec':     0,
    'limp-conc':    0,
  },
  /* Estat on/off de cada indicador */
  active: {
    'elect-red':   true,
    'elect-solar': true,
    'elect-clima': false,
    'agua-red':    true,
    'agua-fugas':  false,
    'cons-papel':  true,
    'cons-dig':    false,
    'limp-sec':    false,
    'limp-conc':   false,
  },
  /* Periode seleccionat */
  period: 'anual',   // 'anual' | 'lectiu' | 'custom'
  chartMode: 'all',  /* 'all' | 'energy' | 'water' | 'costs' */

  /* Instància del gràfic Chart.js (per poder destruir-la i recrear-la) */
  chart: null,
};

/* ══════════════════════════════════════════════════════════
   3. MOTOR DE CÀLCUL
   Retorna tots els valors calculats a partir de l'estat actual
   ══════════════════════════════════════════════════════════ */

function getActiveMonths() {
  if (state.period === 'lectiu') return LECTIU;
  if (state.period === 'custom') {
    const from = document.getElementById('dateFrom')?.value;
    const to   = document.getElementById('dateTo')?.value;
    if (from && to) {
      const fM = parseInt(from.split('-')[1]) - 1;
      const tM = parseInt(to.split('-')[1])   - 1;
      const idxs = [];
      let cur = fM;
      while (true) {
        idxs.push(cur);
        if (cur === tM) break;
        cur = (cur + 1) % 12;
      }
      return idxs;
    }
  }
  return [0,1,2,3,4,5,6,7,8,9,10,11]; // any complet
}

function getVal(key) {
  return state.active[key] ? state.sliders[key] / 100 : 0;
}

function compute() {
  const months = getActiveMonths();

  /* ── ELECTRICITAT ── */
  const redElect  = getVal('elect-red');
  const solar     = getVal('elect-solar');
  const clima     = getVal('elect-clima');

  // Factor de reducció total d'electricitat (no pot superar 1)
  const electReductionFactor = Math.min(1, redElect + solar + clima);

  let kwhBase = 0, kwhFinal = 0;
  const kwhBaseArr  = [];
  const kwhFinalArr = [];

  months.forEach(i => {
    const base  = BASE.elect.kwhPerDay * DAYS[i] * SEASON.elect[i] * VARIABILITY[i];
    const final = base * (1 - electReductionFactor);
    kwhBase  += base;
    kwhFinal += final;
    kwhBaseArr.push(Math.round(base));
    kwhFinalArr.push(Math.round(final));
  });

  const kwhSaved  = kwhBase - kwhFinal;
  const eurElect  = kwhFinal * BASE.elect.eurPerKwh;
  const eurElectBase = kwhBase * BASE.elect.eurPerKwh;
  const co2Elect  = kwhFinal * BASE.elect.co2PerKwh;
  const eurElectSaved = kwhSaved * BASE.elect.eurPerKwh;

  /* ── AIGUA ── */
  const redAgua   = getVal('agua-red');
  const fugas     = getVal('agua-fugas');

  let m3Base = 0, m3Final = 0, m3Noc = 0;
  const m3BaseArr  = [];
  const m3FinalArr = [];

  months.forEach(i => {
    const base   = BASE.agua.m3PerMonth * SEASON.agua[i] * VARIABILITY[i];
    const noctur = BASE.agua.nocturnalM3 * SEASON.agua[i];
    const saved  = base * redAgua + noctur * fugas;
    const final  = Math.max(0, base - saved);
    m3Base  += base;
    m3Final += final;
    m3Noc   += noctur;
    m3BaseArr.push(+base.toFixed(1));
    m3FinalArr.push(+final.toFixed(1));
  });

  const m3Saved   = m3Base - m3Final;
  const eurAgua   = m3Final * BASE.agua.eurPerM3;
  const eurAguaBase = m3Base * BASE.agua.eurPerM3;
  const eurAguaSaved = m3Saved * BASE.agua.eurPerM3;

  /* ── CONSUMIBLES ── */
  const redPapel  = getVal('cons-papel');
  const digital   = getVal('cons-dig');

  let eurConsBase = 0, eurConsFinal = 0;
  const eurConsBaseArr  = [];
  const eurConsFinalArr = [];
  let sheetsBase = 0, sheetsFinal = 0;

  months.forEach(i => {
    const sheetsMonth  = (BASE.cons.sheetsPerYear / 12) * SEASON.cons[i] * VARIABILITY[i];
    const rotMonth     = (BASE.cons.eurRotPerYear / 12) * SEASON.cons[i];
    const eurPaperBase = sheetsMonth * BASE.cons.eurPaperPerSheet;
    const eurPaperFin  = eurPaperBase * (1 - redPapel);
    const eurRotFin    = rotMonth * (1 - digital);
    const base  = eurPaperBase + rotMonth;
    const final = eurPaperFin + eurRotFin;
    eurConsBase  += base;
    eurConsFinal += final;
    sheetsBase   += sheetsMonth;
    sheetsFinal  += sheetsMonth * (1 - redPapel);
    eurConsBaseArr.push(+base.toFixed(0));
    eurConsFinalArr.push(+final.toFixed(0));
  });

  const eurConsSaved = eurConsBase - eurConsFinal;

  /* ── NETEJA ── */
  const redSec    = getVal('limp-sec');
  const redConc   = getVal('limp-conc');

  let eurLimpBase = 0, eurLimpFinal = 0;
  const eurLimpBaseArr  = [];
  const eurLimpFinalArr = [];

  months.forEach(i => {
    const base   = BASE.limp.eurPerMonth * SEASON.limp[i] * VARIABILITY[i];
    const paper  = base * BASE.limp.paperHygPct;
    const otros  = base * BASE.limp.otherPct;
    const final  = paper * (1 - redSec) + otros * (1 - redConc);
    eurLimpBase  += base;
    eurLimpFinal += final;
    eurLimpBaseArr.push(+base.toFixed(0));
    eurLimpFinalArr.push(+final.toFixed(0));
  });

  const eurLimpSaved = eurLimpBase - eurLimpFinal;

  /* ── TOTALS GLOBALS ── */
  const totalCostBase  = eurElectBase + eurAguaBase + eurConsBase + eurLimpBase;
  const totalCostFinal = eurElect + eurAgua + eurConsFinal + eurLimpFinal;
  const totalSaved     = totalCostBase - totalCostFinal;
  const totalPct       = totalCostBase > 0 ? (totalSaved / totalCostBase) * 100 : 0;
  const co2Saved       = (kwhSaved * BASE.elect.co2PerKwh);

  return {
    months,
    elect: {
      kwhBase, kwhFinal, kwhSaved,
      eurElect, eurElectBase, eurElectSaved,
      co2Elect, kwhBaseArr, kwhFinalArr,
    },
    agua: {
      m3Base, m3Final, m3Saved, m3Noc,
      eurAgua, eurAguaBase, eurAguaSaved,
      m3BaseArr, m3FinalArr,
    },
    cons: {
      eurConsBase, eurConsFinal, eurConsSaved,
      sheetsBase, sheetsFinal,
      eurConsBaseArr, eurConsFinalArr,
    },
    limp: {
      eurLimpBase, eurLimpFinal, eurLimpSaved,
      eurLimpPapel: eurLimpFinal * BASE.limp.paperHygPct,
      eurLimpOtros: eurLimpFinal * BASE.limp.otherPct,
      eurLimpBaseArr, eurLimpFinalArr,
    },
    totals: {
      totalCostBase, totalCostFinal, totalSaved,
      totalPct: Math.min(totalPct, 100),
      co2Saved,
    },
  };
}

/* ══════════════════════════════════════════════════════════
   4. HELPERS D'UI
   ══════════════════════════════════════════════════════════ */

/** Formata un nombre amb separador de milers i decimals */
function fmt(val, dec = 0) {
  return Number(val).toLocaleString('ca-ES', {
    minimumFractionDigits: dec,
    maximumFractionDigits: dec,
  });
}

/** Anima un valor numèric de l'element del DOM (counter-up suau) */
function animVal(el, target, dec = 0, suffix = '') {
  if (!el) return;
  const start  = parseFloat(el.dataset.current || '0');
  const diff   = target - start;
  const dur    = 500;
  const t0     = performance.now();

  function step(now) {
    const p   = Math.min(1, (now - t0) / dur);
    const ease = 1 - Math.pow(1 - p, 3);
    const cur  = start + diff * ease;
    el.textContent = fmt(cur, dec) + suffix;
    if (p < 1) requestAnimationFrame(step);
    else {
      el.textContent = fmt(target, dec) + suffix;
      el.dataset.current = target;
    }
  }
  requestAnimationFrame(step);
}

/** Actualitza la badge d'estalvi d'un indicador */
function setBadge(id, val, unit) {
  const el = document.getElementById(id);
  if (!el) return;
  if (val > 0.1) {
    el.innerHTML = `<span class="saving-badge positive">▼ ${fmt(val, 1)} ${unit}</span>`;
  } else {
    el.innerHTML = '';
  }
}

/** Pinta les mini barres estacionals */
function drawMiniBars(id, seasonArr, color) {
  const el = document.getElementById(id);
  if (!el) return;
  const max = Math.max(...seasonArr);
  el.innerHTML = seasonArr.map(v => {
    const h = Math.max(4, Math.round((v / max) * 24));
    return `<div class="mini-bar" style="height:${h}px;background:${color}"></div>`;
  }).join('');
}

/* ══════════════════════════════════════════════════════════
   5. GRÀFIC CHART.JS
   ══════════════════════════════════════════════════════════ */

/**
 * Crea o actualitza el gràfic de línia amb Chart.js.
 * Mostra: Consum base (línia discontínua) vs Consum projectat (línia sòlida)
 * El gràfic es recrea cada vegada per evitar artefactes d'animació.
 */
function drawChart() {
  const r      = compute();
  const canvas = document.getElementById('mainChart');
  if (!canvas) return;

  // Destruir el gràfic anterior si existeix
  if (state.chart) {
    state.chart.destroy();
    state.chart = null;
  }

  const months = r.months;
  const labels = months.map(i => MONTHS[i]);
  const mode   = state.chartMode;
  const datasets = [];

  // Paletes de colors per categoria
  const palette = {
    elect: { base: 'rgba(86,195,247,0.5)',  proj: '#56c3f7' },
    agua:  { base: 'rgba(61,220,120,0.5)',  proj: '#3ddc78' },
    cons:  { base: 'rgba(242,191,68,0.5)',  proj: '#f2bf44' },
    limp:  { base: 'rgba(184,160,248,0.5)', proj: '#b8a0f8' },
  };

  function makeDataset(label, data, color, dashed = false) {
    return {
      label,
      data,
      borderColor: color,
      backgroundColor: dashed
        ? 'transparent'
        : color.replace('rgb', 'rgba').replace(')', ',0.08)'),
      borderWidth:    dashed ? 1.5 : 2,
      borderDash:     dashed ? [5, 4] : [],
      pointRadius:    dashed ? 2 : 3,
      pointBackgroundColor: color,
      fill: !dashed,
      tension: 0.35,
    };
  }

  // Electricitat
  if (mode === 'all' || mode === 'energy') {
    if (state.active['elect-red'] || state.active['elect-solar'] || state.active['elect-clima']) {
      datasets.push(makeDataset('Elect. Base (kWh)', r.elect.kwhBaseArr,  palette.elect.base, true));
      datasets.push(makeDataset('Elect. Proj. (kWh)', r.elect.kwhFinalArr, palette.elect.proj));
    }
  }
  // Aigua
  if (mode === 'all' || mode === 'water') {
    if (state.active['agua-red'] || state.active['agua-fugas']) {
      datasets.push(makeDataset('Aigua Base (m³)', r.agua.m3BaseArr,  palette.agua.base, true));
      datasets.push(makeDataset('Aigua Proj. (m³)', r.agua.m3FinalArr, palette.agua.proj));
    }
  }
  // Consumibles + Neteja
  if (mode === 'all' || mode === 'costs') {
    if (state.active['cons-papel'] || state.active['cons-dig']) {
      datasets.push(makeDataset('Consum. Base (€)', r.cons.eurConsBaseArr,  palette.cons.base, true));
      datasets.push(makeDataset('Consum. Proj. (€)', r.cons.eurConsFinalArr, palette.cons.proj));
    }
    if (state.active['limp-sec'] || state.active['limp-conc']) {
      datasets.push(makeDataset('Neteja Base (€)', r.limp.eurLimpBaseArr,  palette.limp.base, true));
      datasets.push(makeDataset('Neteja Proj. (€)', r.limp.eurLimpFinalArr, palette.limp.proj));
    }
  }

  // Si no hi ha dades, mostra un missatge
  if (datasets.length === 0) {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#3a5040';
    ctx.font = '14px DM Mono, monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Activa almenys un indicador per veure el gràfic', canvas.width / 2, canvas.height / 2);
    return;
  }

  state.chart = new Chart(canvas, {
    type: 'line',
    data: { labels, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      interaction: { mode: 'index', intersect: false },
      animation: { duration: 400, easing: 'easeOutCubic' },
      plugins: {
        legend: { display: false }, // Fem la nostra llegenda personalitzada
        tooltip: {
          backgroundColor: 'rgba(17,25,22,0.95)',
          borderColor: '#243026',
          borderWidth: 1,
          titleFont: { family: 'DM Mono', size: 11 },
          bodyFont:  { family: 'DM Mono', size: 11 },
          titleColor: '#7a9b82',
          bodyColor: '#e8f0ea',
          padding: 12,
          callbacks: {
            label(ctx) {
              const v = ctx.parsed.y;
              const unit = ctx.dataset.label.includes('kWh') ? ' kWh'
                         : ctx.dataset.label.includes('m³')  ? ' m³'
                         : ' €';
              return ` ${ctx.dataset.label}: ${fmt(v, 0)}${unit}`;
            },
          },
        },
      },
      scales: {
        x: {
          grid:  { color: 'rgba(36,48,38,0.6)', drawTicks: false },
          ticks: { color: '#3a5040', font: { family: 'DM Mono', size: 10 }, maxRotation: 0 },
          border: { color: '#243026' },
        },
        y: {
          grid:  { color: 'rgba(36,48,38,0.6)', drawTicks: false },
          ticks: { color: '#3a5040', font: { family: 'DM Mono', size: 10 },
                   callback: v => fmt(v, 0) },
          border: { color: '#243026' },
        },
      },
    },
  });

  // Llegenda personalitzada
  buildLegend(datasets);
}

function buildLegend(datasets) {
  const el = document.getElementById('chartLegend');
  if (!el) return;
  el.innerHTML = datasets.map(ds => `
    <div class="legend-item">
      <div class="legend-dot" style="background:${Array.isArray(ds.borderDash) && ds.borderDash.length
        ? ds.borderColor.replace('0.5', '0.6') : ds.borderColor};
        ${Array.isArray(ds.borderDash) && ds.borderDash.length ? 'opacity:0.55' : ''}"></div>
      <span>${ds.label}</span>
    </div>
  `).join('');
}

/* ══════════════════════════════════════════════════════════
   6. TAULA ANY A ANY
   ══════════════════════════════════════════════════════════ */

function drawYearTable() {
  const r    = compute();
  const tbody = document.getElementById('yearTableBody');
  if (!tbody) return;

  // Percentatges acumulats any a any (escenari gradual)
  const pct1 = 0.10, pct2 = 0.20, pct3 = 0.30;

  const rows = [
    {
      label: '💡 Electricitat',
      base:  r.elect.eurElectBase,
      unit:  '€',
    },
    {
      label: '💧 Aigua',
      base:  r.agua.eurAguaBase,
      unit:  '€',
    },
    {
      label: '📎 Consumibles',
      base:  r.cons.eurConsBase,
      unit:  '€',
    },
    {
      label: '🧹 Neteja',
      base:  r.limp.eurLimpBase,
      unit:  '€',
    },
  ];

  tbody.innerHTML = rows.map(row => {
    const y1  = row.base * (1 - pct1);
    const y2  = row.base * (1 - pct2);
    const y3  = row.base * (1 - pct3);
    const sav = row.base - y3;
    return `
      <tr>
        <td>${row.label}</td>
        <td class="mono">${fmt(row.base, 0)} ${row.unit}</td>
        <td class="mono amber">${fmt(y1, 0)} ${row.unit}</td>
        <td class="mono amber">${fmt(y2, 0)} ${row.unit}</td>
        <td class="mono green">${fmt(y3, 0)} ${row.unit}</td>
        <td class="mono green">▼ ${fmt(sav, 0)} ${row.unit}</td>
      </tr>
    `;
  }).join('');
}

/* ══════════════════════════════════════════════════════════
   7. ACTUALITZACIÓ COMPLETA DE LA UI
   Crida compute() i actualitza tots els elements del DOM
   ══════════════════════════════════════════════════════════ */

function updateAll() {
  const r = compute();

  /* ── Header stats ── */
  animVal(document.getElementById('hs-saving'), r.totals.totalSaved,   0, ' €');
  animVal(document.getElementById('hs-co2'),    r.totals.co2Saved / 1000, 2, ' t');
  animVal(document.getElementById('hs-pct'),    r.totals.totalPct,      1, '%');
  animVal(document.getElementById('hs-cost'),   r.totals.totalCostFinal, 0, ' €');

  /* ── Barra de progrés ── */
  const pct = Math.min(r.totals.totalPct, 100);
  document.getElementById('progressPct').textContent = fmt(pct, 1) + '%';
  document.getElementById('progressFill').style.width = pct + '%';

  /* ── KPI Electricitat ── */
  animVal(document.getElementById('r-elect-kwh'), r.elect.kwhFinal, 0);
  animVal(document.getElementById('r-elect-eur'), r.elect.eurElect, 0);
  animVal(document.getElementById('r-elect-co2'), r.elect.co2Elect, 0);
  animVal(document.getElementById('r-elect-red'), r.elect.kwhSaved, 0);
  setBadge('kpi-badge-elect', r.elect.kwhSaved, 'kWh estalviats');

  /* ── KPI Aigua ── */
  animVal(document.getElementById('r-agua-m3'),   r.agua.m3Final, 1);
  animVal(document.getElementById('r-agua-eur'),  r.agua.eurAgua, 0);
  animVal(document.getElementById('r-agua-noc'),  r.agua.m3Noc,  1);
  animVal(document.getElementById('r-agua-save'), r.agua.m3Saved, 1);
  setBadge('kpi-badge-agua', r.agua.m3Saved, 'm³ estalviats');

  /* ── KPI Consumibles ── */
  animVal(document.getElementById('r-cons-hojas'), r.cons.sheetsFinal, 0);
  animVal(document.getElementById('r-cons-papel'), r.cons.eurConsFinal * 0.7, 0);
  animVal(document.getElementById('r-cons-rot'),   r.cons.eurConsFinal * 0.3, 0);
  animVal(document.getElementById('r-cons-save'),  r.cons.eurConsSaved, 0);
  setBadge('kpi-badge-cons', r.cons.eurConsSaved, '€ estalviats');

  /* ── KPI Neteja ── */
  animVal(document.getElementById('r-limp-eur'),   r.limp.eurLimpFinal, 0);
  animVal(document.getElementById('r-limp-papel'), r.limp.eurLimpPapel, 0);
  animVal(document.getElementById('r-limp-otros'), r.limp.eurLimpOtros, 0);
  animVal(document.getElementById('r-limp-save'),  r.limp.eurLimpSaved, 0);
  setBadge('kpi-badge-limp', r.limp.eurLimpSaved, '€ estalviats');

  /* ── Banner totals ── */
  animVal(document.getElementById('tot-cost'),  r.totals.totalCostFinal, 0, ' €');
  const ts = document.getElementById('tot-cost-save');
  if (ts) ts.textContent = r.totals.totalSaved > 0
    ? `▼ Estalvi: ${fmt(r.totals.totalSaved, 0)} €`
    : 'Sense estalvi configurat';

  animVal(document.getElementById('tot-co2'),   r.totals.co2Saved / 1000, 3, ' t');
  const tc = document.getElementById('tot-co2-save');
  if (tc) tc.textContent = r.totals.co2Saved > 0
    ? `▼ ${fmt(r.totals.co2Saved, 0)} kg CO₂ evitats`
    : '';

  animVal(document.getElementById('tot-agua'),  r.agua.m3Saved, 1, ' m³');
  const ta = document.getElementById('tot-agua-save');
  if (ta) ta.textContent = r.agua.eurAguaSaved > 0
    ? `▼ ${fmt(r.agua.eurAguaSaved, 0)} € estalviats`
    : '';

  animVal(document.getElementById('tot-hojas'), r.cons.sheetsBase - r.cons.sheetsFinal, 0);
  const th = document.getElementById('tot-hojas-save');
  if (th) th.textContent = r.cons.eurConsSaved > 0
    ? `▼ ${fmt(r.cons.eurConsSaved, 0)} € estalviats`
    : '';

  /* ── Badges individuals dels sliders ── */
  setBadge('badge-elect-red',   r.elect.kwhSaved * (getVal('elect-red') / (getVal('elect-red') + getVal('elect-solar') + getVal('elect-clima') + 0.001)) * BASE.elect.eurPerKwh, '€');
  setBadge('badge-elect-solar', r.elect.kwhSaved * (getVal('elect-solar') / (getVal('elect-red') + getVal('elect-solar') + getVal('elect-clima') + 0.001)) * BASE.elect.eurPerKwh, '€');
  setBadge('badge-elect-clima', r.elect.kwhSaved * (getVal('elect-clima') / (getVal('elect-red') + getVal('elect-solar') + getVal('elect-clima') + 0.001)) * BASE.elect.eurPerKwh, '€');
  setBadge('badge-agua-red',   r.agua.m3Saved, 'm³');
  setBadge('badge-agua-fugas', r.agua.m3Noc * getVal('agua-fugas'), 'm³');
  setBadge('badge-cons-papel', r.cons.eurConsSaved * 0.7, '€');
  setBadge('badge-cons-dig',   r.cons.eurConsSaved * 0.3, '€');
  setBadge('badge-limp-sec',   r.limp.eurLimpSaved * 0.7, '€');
  setBadge('badge-limp-conc',  r.limp.eurLimpSaved * 0.3, '€');

  /* ── Mini barres estacionals ── */
  drawMiniBars('bars-elect',  SEASON.elect, '#56c3f7');
  drawMiniBars('bars-solar',  SEASON.elect, '#f2bf44');
  drawMiniBars('bars-clima',  SEASON.elect, '#b8a0f8');
  drawMiniBars('bars-agua',   SEASON.agua,  '#3ddc78');
  drawMiniBars('bars-fugas',  SEASON.agua,  '#44c6b0');
  drawMiniBars('bars-cons',   SEASON.cons,  '#f2bf44');
  drawMiniBars('bars-dig',    SEASON.cons,  '#f2bf44');
  drawMiniBars('bars-limp',   SEASON.limp,  '#b8a0f8');
  drawMiniBars('bars-conc',   SEASON.limp,  '#b8a0f8');

  /* ── Gràfic i taula ── */
  drawChart();
  drawYearTable();
}

/* ══════════════════════════════════════════════════════════
   8. LISTENERS D'EVENTS
   ══════════════════════════════════════════════════════════ */

function initListeners() {

  /* ── Sliders ── */
  document.querySelectorAll('.ind-slider').forEach(slider => {
    const key    = slider.dataset.key;
    const valEl  = document.getElementById('val-' + key);
    slider.addEventListener('input', () => {
      const v = parseInt(slider.value);
      state.sliders[key] = v;
      if (valEl) valEl.textContent = v + '%';
      updateAll();
    });
  });

  /* ── Toggles on/off ── */
  document.querySelectorAll('.ind-toggle').forEach(chk => {
    const key  = chk.dataset.key;
    const card = chk.closest('.ind-card');
    chk.addEventListener('change', () => {
      state.active[key] = chk.checked;
      if (card) card.classList.toggle('inactive', !chk.checked);
      updateAll();
    });
    // Estat inicial
    if (!state.active[key]) {
      chk.checked = false;
      if (card) card.classList.add('inactive');
    } else {
      chk.checked = true;
    }
  });

  /* ── Pestanyes de periode ── */
  document.querySelectorAll('.ptab').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.ptab').forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');
      state.period = btn.dataset.period;
      const customEl = document.getElementById('customDates');
      if (customEl) {
        customEl.classList.toggle('visible', state.period === 'custom');
        customEl.setAttribute('aria-hidden', state.period !== 'custom');
      }
      updateAll();
    });
  });

  /* ── Dates personalitzades ── */
  ['dateFrom', 'dateTo'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('change', () => {
      if (state.period === 'custom') updateAll();
    });
  });

  /* ── Filtres del gràfic ── */
  document.querySelectorAll('.cflt').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.cflt').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.chartMode = btn.dataset.mode;
      drawChart();
    });
  });

  /* ── Botó "Aplicar tot (–30%)" ── */
  const btnAll = document.getElementById('btnSelectAll');
  if (btnAll) {
    btnAll.addEventListener('click', () => {
      // Activa tots i posa el slider al màxim
      document.querySelectorAll('.ind-toggle').forEach(chk => {
        chk.checked = true;
        state.active[chk.dataset.key] = true;
        chk.closest('.ind-card')?.classList.remove('inactive');
      });
      document.querySelectorAll('.ind-slider').forEach(sl => {
        const max = parseInt(sl.max);
        const key = sl.dataset.key;
        sl.value = max;
        state.sliders[key] = max;
        const valEl = document.getElementById('val-' + key);
        if (valEl) valEl.textContent = max + '%';
      });
      updateAll();
    });
  }

  /* ── Botó "Restablir" ── */
  const btnReset = document.getElementById('btnReset');
  if (btnReset) {
    btnReset.addEventListener('click', () => {
      // Valors per defecte
      const defaults = {
        'elect-red':   20, 'elect-solar': 15, 'elect-clima':  0,
        'agua-red':    15, 'agua-fugas':   0,
        'cons-papel':  25, 'cons-dig':     0,
        'limp-sec':     0, 'limp-conc':    0,
      };
      const defaultActive = {
        'elect-red': true, 'elect-solar': true, 'elect-clima': false,
        'agua-red':  true, 'agua-fugas':  false,
        'cons-papel': true, 'cons-dig':   false,
        'limp-sec':  false, 'limp-conc':  false,
      };
      Object.assign(state.sliders, defaults);
      Object.assign(state.active,  defaultActive);

      document.querySelectorAll('.ind-slider').forEach(sl => {
        const key = sl.dataset.key;
        sl.value = defaults[key];
        const valEl = document.getElementById('val-' + key);
        if (valEl) valEl.textContent = defaults[key] + '%';
      });
      document.querySelectorAll('.ind-toggle').forEach(chk => {
        const key = chk.dataset.key;
        chk.checked = defaultActive[key];
        chk.closest('.ind-card')?.classList.toggle('inactive', !defaultActive[key]);
      });
      updateAll();
    });
  }

  /* ── Mode Sostenible ── */
  const btnSos = document.getElementById('btnSostenible');
  const banner = document.getElementById('modeBanner');
  if (btnSos) {
    btnSos.addEventListener('click', () => {
      const active = btnSos.getAttribute('aria-pressed') === 'true';
      const next   = !active;
      btnSos.setAttribute('aria-pressed', next);
      if (banner) banner.hidden = !next;

      if (next) {
        // Activa tots i posa sliders al màxim
        document.getElementById('btnSelectAll')?.click();
      } else {
        // Torna als valors per defecte
        document.getElementById('btnReset')?.click();
      }
    });
  }

  /* ── Checkboxes del pla d'acció ── */
  document.querySelectorAll('.action-check').forEach(chk => {
    chk.addEventListener('change', () => {
      let total = 0;
      document.querySelectorAll('.action-check:checked').forEach(c => {
        total += parseFloat(c.dataset.impact || 0);
      });
      total = Math.min(total, 30);
      const el = document.getElementById('planReduction');
      if (el) el.textContent = fmt(total, 0) + '%';
    });
  });

}

/* ══════════════════════════════════════════════════════════
   9. INICIALITZACIÓ
   ══════════════════════════════════════════════════════════ */

window.addEventListener('DOMContentLoaded', () => {
  initListeners();
  updateAll();

  // Resize: redibuja el gràfic si la finestra canvia de mida
  window.addEventListener('resize', () => {
    drawChart();
  });
});
