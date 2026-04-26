'use strict';

/* 1. DATOS BASE (Simplificados para el ejemplo) */
const BASE = {
  elect: { kwhPerDay: 156.8, eurPerKwh: 0.165, co2PerKwh: 0.233, nocturnalPct: 0.08 },
  agua:  { m3PerMonth: 20.4, eurPerM3: 3.15, nocturnalM3: 2.1 }
};

const SEASON = {
  elect:  [1.15, 1.10, 1.00, 0.95, 0.92, 0.90, 1.05, 1.08, 0.98, 1.00, 1.05, 1.15],
  agua:   [0.85, 0.88, 1.05, 1.10, 1.08, 0.75, 0.40, 0.35, 1.05, 1.15, 1.10, 0.88],
};

const MONTHS = ['Gen','Feb','Mar','Abr','Mai','Jun','Jul','Ago','Set','Oct','Nov','Des'];
const DAYS   = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

const state = {
  sliders: { 'elect-red': 20, 'elect-solar': 15, 'elect-clima': 0, 'agua-red': 15 },
  active:  { 'elect-red': true, 'elect-solar': true, 'elect-clima': false, 'agua-red': true },
  chart: null,
};

function getVal(key) {
  return state.active[key] ? state.sliders[key] / 100 : 0;
}

/* 2. MOTOR DE CÁLCULO CON LÍMITE (MAX 30%) */
function compute() {
  const months = [0,1,2,3,4,5,6,7,8,9,10,11]; // Año completo para la proyección
  
  const redElect  = getVal('elect-red');
  const solar     = getVal('elect-solar');
  const clima     = getVal('elect-clima');
  const electReductionFactor = redElect + solar + clima;

  let kwhBase = 0, kwhFinal = 0;
  const kwhBaseArr = [], kwhFinalArr = [];

  months.forEach(i => {
    const base  = BASE.elect.kwhPerDay * DAYS[i] * SEASON.elect[i];
    const final = base * (1 - electReductionFactor);
    kwhBase += base; kwhFinal += final;
    kwhBaseArr.push(Math.round(base)); kwhFinalArr.push(Math.round(final));
  });

  let eurElectBase = kwhBase * BASE.elect.eurPerKwh;
  let eurElectSavedRaw = (kwhBase - kwhFinal) * BASE.elect.eurPerKwh;

  const redAgua = getVal('agua-red');
  let m3Base = 0, m3Final = 0;
  
  months.forEach(i => {
    const base   = BASE.agua.m3PerMonth * SEASON.agua[i];
    const saved  = base * redAgua;
    const final  = Math.max(0, base - saved);
    m3Base += base; m3Final += final;
  });

  let eurAguaBase = m3Base * BASE.agua.eurPerM3;
  let eurAguaSavedRaw = (m3Base - m3Final) * BASE.agua.eurPerM3;

  /* --- APLICACIÓN DEL LÍMITE REALISTA DEL 30% --- */
  const totalCostBase = eurElectBase + eurAguaBase;
  const rawTotalSaved = eurElectSavedRaw + eurAguaSavedRaw;
  
  // El ahorro máximo permitido es el 30% del gasto total
  const maxAllowedSaving = totalCostBase * 0.30;
  
  // Si el usuario "ahorra" más del 30% en los sliders, aplicamos un factor de compresión
  const cappingFactor = rawTotalSaved > maxAllowedSaving ? (maxAllowedSaving / rawTotalSaved) : 1;

  // Recalculamos los ahorros reales aplicando el límite
  const realElectSaved = eurElectSavedRaw * cappingFactor;
  const realAguaSaved  = eurAguaSavedRaw * cappingFactor;
  
  const totalSaved = realElectSaved + realAguaSaved;
  const totalCostFinal = totalCostBase - totalSaved;
  const totalPct = (totalSaved / totalCostBase) * 100;
  
  // Recalcular CO2 con el factor aplicado
  const kwhSavedReal = (kwhBase - kwhFinal) * cappingFactor;
  const co2Saved = kwhSavedReal * BASE.elect.co2PerKwh;

  // Ajustar arrays para el gráfico usando el capping factor
  const finalChartData = kwhBaseArr.map((base, i) => {
    let originalSaving = base - kwhFinalArr[i];
    return base - (originalSaving * cappingFactor);
  });

  return { 
    totalCostBase, totalCostFinal, totalSaved, totalPct, co2Saved,
    kwhBaseArr, finalChartData
  };
}

/* 3. ACTUALIZACIÓN UI */
function fmt(num, dec=0) {
  return num.toLocaleString('es-ES', { minimumFractionDigits: dec, maximumFractionDigits: dec });
}

function updateAll() {
  const data = compute();

  // Actualizar contadores del Hero
  document.getElementById('hs-saving').textContent = fmt(data.totalSaved) + ' €';
  document.getElementById('hs-co2').textContent    = fmt(data.co2Saved / 1000, 1) + ' t';
  document.getElementById('hs-pct').textContent    = fmt(data.totalPct, 1) + '%';
  document.getElementById('hs-cost').textContent   = fmt(data.totalCostBase) + ' €';

  // Sincronizar valores visuales de los sliders
  document.querySelectorAll('.ind-slider').forEach(sld => {
    const valEl = document.getElementById('val-' + sld.dataset.key);
    if (valEl) valEl.textContent = sld.value + '%';
  });

  drawChart(data);
}

/* 4. GRÁFICO (Chart.js) */
function drawChart(data) {
  const ctx = document.getElementById('mainChart').getContext('2d');
  if (state.chart) state.chart.destroy();

  state.chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: MONTHS,
      datasets: [
        {
          label: 'Consumo Base (kWh)',
          data: data.kwhBaseArr,
          borderColor: '#456150',
          borderDash: [5, 5],
          backgroundColor: 'transparent',
          tension: 0.4
        },
        {
          label: 'Plan de Reducción',
          data: data.finalChartData,
          borderColor: '#2ce08d',
          backgroundColor: 'rgba(44, 224, 141, 0.1)',
          fill: true,
          tension: 0.4
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { labels: { color: '#ecf2ee', font: { family: 'DM Sans' } } }
      },
      scales: {
        x: { grid: { color: '#1e2b24' }, ticks: { color: '#82a18e' } },
        y: { grid: { color: '#1e2b24' }, ticks: { color: '#82a18e' } }
      }
    }
  });
}

/* 5. EVENTOS E INICIALIZACIÓN */
window.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.ind-slider').forEach(el => {
    el.addEventListener('input', (e) => {
      state.sliders[e.target.dataset.key] = parseFloat(e.target.value);
      updateAll();
    });
  });

  document.querySelectorAll('.ind-toggle').forEach(el => {
    el.addEventListener('change', (e) => {
      state.active[e.target.dataset.key] = e.target.checked;
      const card = e.target.closest('.ind-card');
      card.style.opacity = e.target.checked ? '1' : '0.6';
      updateAll();
    });
  });

  updateAll();
});
