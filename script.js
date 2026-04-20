// ============================================================
// CALCULADORA D'ESTALVI ENERGÈTIC - FASE 3 (VERSIÓ 2)
// Cálculos parametrizables amb actualització en temps real
// ============================================================

// DADES BASE (de dataclean.json)
const baseData = {
    electricitat: {
        diaKwh: 327.38,
        anyKwh: 117857,
        preu_kWh: 0.171,
        co2_kg_per_kWh: 0.181
    },
    agua: {
        diaLitres: 4735,
        anyM3: 1160,
        preu_m3: 1.80,
        co2_kg_per_m3: 2.0 // depurador
    },
    consumibles: {
        anyFulls: 7500,
        preu_full: 0.084,
        retoladors_any: 150,
        cost_any: 631
    },
    neteja: {
        cost_any_EUR: 4820,
        kg_co2_any: 120
    }
};

// PERÍODES
const PERIODS = {
    ANNUAL: 12,      // 12 mesos
    ACADEMIC: 10,    // 10 mesos (setembre-juny)
    CUSTOM: null     // personalitzat
};

// EVENT LISTENERS
document.querySelectorAll('input[type="range"]').forEach(input => {
    input.addEventListener('input', function() {
        updateRangeLabel(this.id);
        updateCalculations();
    });
});

document.getElementById('customMonths').addEventListener('change', function() {
    document.getElementById('customLabel').textContent = this.value + ' mesos';
    updateCalculations();
});

document.getElementById('annualCheck').addEventListener('change', updateCalculations);
document.getElementById('academicCheck').addEventListener('change', updateCalculations);

// ============================================================
// FUNCIONES AUXILIARES
// ============================================================

function updateRangeLabel(id) {
    const input = document.getElementById(id);
    const value = input.value;
    const labelId = id + 'Value';
    const label = document.getElementById(labelId);
    
    if (label) {
        const sign = value > 0 ? '+' : '';
        label.textContent = sign + value + '%';
    }
}

function getMonthsFactor(periodType) {
    if (periodType === 'annual') return PERIODS.ANNUAL;
    if (periodType === 'academic') return PERIODS.ACADEMIC;
    if (periodType === 'custom') return parseInt(document.getElementById('customMonths').value) || 12;
    return PERIODS.ANNUAL;
}

function applySeasonality(baseValue, indicator, months) {
    /**
     * Aplica ciclos estacionales según el indicador
     * Distribuye los consumos de manera realista a lo largo del año
     */
    
    // Factores estacionales (0-12 meses)
    const winterElec = parseInt(document.getElementById('winterElec').value) / 100;
    const summerElec = parseInt(document.getElementById('summerElec').value) / 100;
    const summerWater = parseInt(document.getElementById('summerWater').value) / 100;
    const schoolActivity = parseInt(document.getElementById('schoolActivity').value) / 100;
    
    let seasonalValue = baseValue;
    
    if (indicator === 'electricitat') {
        // Invierno: des-feb (+25%), Verano: jun-ago (-20%), resto normal
        const winterMonths = 3;   // dic, ene, feb
        const summerMonths = 3;   // jun, jul, ago
        const otherMonths = months - winterMonths - summerMonths;
        
        const monthlyBase = baseValue / PERIODS.ANNUAL;
        const winterConsump = monthlyBase * (1 + winterElec) * winterMonths;
        const summerConsump = monthlyBase * (1 + summerElec) * summerMonths;
        const otherConsump = monthlyBase * otherMonths;
        
        seasonalValue = (winterConsump + summerConsump + otherConsump) * (months / PERIODS.ANNUAL);
    }
    
    else if (indicator === 'agua') {
        // Estiu: mes agua per piscina/riego
        const summerMonths = 3;   // jun, jul, ago
        const otherMonths = months - summerMonths;
        
        const monthlyBase = baseValue / PERIODS.ANNUAL;
        const summerConsump = monthlyBase * (1 + summerWater) * summerMonths;
        const otherConsump = monthlyBase * otherMonths;
        
        seasonalValue = (summerConsump + otherConsump) * (months / PERIODS.ANNUAL);
    }
    
    else if (indicator === 'consumibles') {
        // Mes activitat escolar: sept-dec i jan-jun
        const activeMonths = 10;  // todo menos julio y agosto
        const offMonths = 2;
        
        const monthlyBase = baseValue / PERIODS.ANNUAL;
        const activeConsump = monthlyBase * (1 + schoolActivity) * Math.min(activeMonths, months);
        const offConsump = monthlyBase * Math.max(0, months - activeMonths);
        
        seasonalValue = (activeConsump + offConsump) * (months / PERIODS.ANNUAL);
    }
    
    else if (indicator === 'neteja') {
        // Similar a consumibles
        const activeMonths = 10;
        const offMonths = 2;
        
        const monthlyBase = baseValue / PERIODS.ANNUAL;
        const activeConsump = monthlyBase * (1 + schoolActivity) * Math.min(activeMonths, months);
        const offConsump = monthlyBase * Math.max(0, months - activeMonths);
        
        seasonalValue = (activeConsump + offConsump) * (months / PERIODS.ANNUAL);
    }
    
    return Math.round(seasonalValue * 100) / 100;
}

// ============================================================
// CÁLCUL 1: ELECTRICITAT ANY NATURAL
// ============================================================

function calculateElec_AnyNatural() {
    const months = PERIODS.ANNUAL;
    const baseValue = baseData.electricitat.anyKwh;
    const withSeasonality = applySeasonality(baseValue, 'electricitat', months);
    
    const reduction = parseInt(document.getElementById('elecReduction').value) / 100;
    const withReduction = withSeasonality * (1 - reduction);
    
    const cost = withReduction * baseData.electricitat.preu_kWh;
    const costReduction = (baseValue * baseData.electricitat.preu_kWh) - cost;
    
    return {
        value: Math.round(withReduction),
        cost: Math.round(cost),
        reduction: Math.round(withReduction * reduction),
        costReduction: Math.round(costReduction),
        unit: 'kWh'
    };
}

// ============================================================
// CÁLCUL 2: ELECTRICITAT ACADÈMIC (SET-JUNY)
// ============================================================

function calculateElec_Academic() {
    const months = PERIODS.ACADEMIC;  // 10 meses
    const baseValue = baseData.electricitat.anyKwh * (months / PERIODS.ANNUAL);
    const withSeasonality = applySeasonality(baseValue, 'electricitat', months);
    
    const reduction = parseInt(document.getElementById('elecReduction').value) / 100;
    const withReduction = withSeasonality * (1 - reduction);
    
    const cost = withReduction * baseData.electricitat.preu_kWh;
    const costReduction = (baseValue * baseData.electricitat.preu_kWh) - cost;
    
    return {
        value: Math.round(withReduction),
        cost: Math.round(cost),
        reduction: Math.round(withReduction * reduction),
        costReduction: Math.round(costReduction),
        unit: 'kWh'
    };
}

// ============================================================
// CÁLCUL 3: AGUA ANY NATURAL
// ============================================================

function calculateWater_AnyNatural() {
    const months = PERIODS.ANNUAL;
    const baseValue = baseData.agua.anyM3;
    const withSeasonality = applySeasonality(baseValue, 'agua', months);
    
    const reduction = parseInt(document.getElementById('waterReduction').value) / 100;
    const withReduction = withSeasonality * (1 - reduction);
    
    const cost = withReduction * baseData.agua.preu_m3;
    const costReduction = (baseValue * baseData.agua.preu_m3) - cost;
    
    return {
        value: Math.round(withReduction),
        cost: Math.round(cost),
        reduction: Math.round(withReduction * reduction),
        costReduction: Math.round(costReduction),
        unit: 'm³'
    };
}

// ============================================================
// CÁLCUL 4: AGUA ACADÈMIC (SET-JUNY)
// ============================================================

function calculateWater_Academic() {
    const months = PERIODS.ACADEMIC;
    const baseValue = baseData.agua.anyM3 * (months / PERIODS.ANNUAL);
    const withSeasonality = applySeasonality(baseValue, 'agua', months);
    
    const reduction = parseInt(document.getElementById('waterReduction').value) / 100;
    const withReduction = withSeasonality * (1 - reduction);
    
    const cost = withReduction * baseData.agua.preu_m3;
    const costReduction = (baseValue * baseData.agua.preu_m3) - cost;
    
    return {
        value: Math.round(withReduction),
        cost: Math.round(cost),
        reduction: Math.round(withReduction * reduction),
        costReduction: Math.round(costReduction),
        unit: 'm³'
    };
}

// ============================================================
// CÁLCUL 5: CONSUMIBLES ANY NATURAL
// ============================================================

function calculateConsumibles_AnyNatural() {
    const months = PERIODS.ANNUAL;
    const baseFulls = baseData.consumibles.anyFulls;
    const withSeasonality = applySeasonality(baseFulls, 'consumibles', months);
    
    const reduction = parseInt(document.getElementById('consumerReduction').value) / 100;
    const withReduction = withSeasonality * (1 - reduction);
    
    const cost = (withReduction * baseData.consumibles.preu_full) + baseData.consumibles.retoladors_any;
    const costReduction = baseData.consumibles.cost_any - cost;
    
    return {
        value: Math.round(withReduction),
        cost: Math.round(cost),
        reduction: Math.round(withReduction * reduction),
        costReduction: Math.round(costReduction),
        unit: 'fulls'
    };
}

// ============================================================
// CÁLCUL 6: CONSUMIBLES ACADÈMIC (SET-JUNY)
// ============================================================

function calculateConsumibles_Academic() {
    const months = PERIODS.ACADEMIC;
    const baseFulls = baseData.consumibles.anyFulls * (months / PERIODS.ANNUAL);
    const withSeasonality = applySeasonality(baseFulls, 'consumibles', months);
    
    const reduction = parseInt(document.getElementById('consumerReduction').value) / 100;
    const withReduction = withSeasonality * (1 - reduction);
    
    const cost = (withReduction * baseData.consumibles.preu_full) + (baseData.consumibles.retoladors_any * (months / PERIODS.ANNUAL));
    const costReduction = (baseData.consumibles.cost_any * (months / PERIODS.ANNUAL)) - cost;
    
    return {
        value: Math.round(withReduction),
        cost: Math.round(cost),
        reduction: Math.round(withReduction * reduction),
        costReduction: Math.round(costReduction),
        unit: 'fulls'
    };
}

// ============================================================
// CÁLCUL 7: NETEJA ANY NATURAL
// ============================================================

function calculateNeteja_AnyNatural() {
    const months = PERIODS.ANNUAL;
    const baseCost = baseData.neteja.cost_any_EUR;
    const baseKgCO2 = baseData.neteja.kg_co2_any;
    
    const withSeasonality = applySeasonality(baseCost, 'neteja', months);
    
    const reduction = parseInt(document.getElementById('cleanReduction').value) / 100;
    const withReduction = withSeasonality * (1 - reduction);
    
    const co2Reduction = baseKgCO2 * reduction;
    const costReduction = baseCost - withReduction;
    
    return {
        value: Math.round(withReduction),
        cost: Math.round(baseKgCO2 * (1 - reduction)),  // kg CO2
        reduction: Math.round(withReduction * reduction),
        costReduction: Math.round(costReduction),
        unit: '€'
    };
}

// ============================================================
// CÁLCUL 8: NETEJA ACADÈMIC (SET-JUNY)
// ============================================================

function calculateNeteja_Academic() {
    const months = PERIODS.ACADEMIC;
    const baseCost = baseData.neteja.cost_any_EUR * (months / PERIODS.ANNUAL);
    const baseKgCO2 = baseData.neteja.kg_co2_any * (months / PERIODS.ANNUAL);
    
    const withSeasonality = applySeasonality(baseCost, 'neteja', months);
    
    const reduction = parseInt(document.getElementById('cleanReduction').value) / 100;
    const withReduction = withSeasonality * (1 - reduction);
    
    const co2Reduction = baseKgCO2 * reduction;
    const costReduction = baseCost - withReduction;
    
    return {
        value: Math.round(withReduction),
        cost: Math.round(baseKgCO2 * (1 - reduction)),  // kg CO2
        reduction: Math.round(withReduction * reduction),
        costReduction: Math.round(costReduction),
        unit: '€'
    };
}

// ============================================================
// ACTUALIZAR TODOS LOS CÁLCULOS
// ============================================================

function updateCalculations() {
    // Calcular los 8 valores
    const calc1 = calculateElec_AnyNatural();
    const calc2 = calculateElec_Academic();
    const calc3 = calculateWater_AnyNatural();
    const calc4 = calculateWater_Academic();
    const calc5 = calculateConsumibles_AnyNatural();
    const calc6 = calculateConsumibles_Academic();
    const calc7 = calculateNeteja_AnyNatural();
    const calc8 = calculateNeteja_Academic();
    
    // Actualizar DOM
    document.getElementById('calc1').textContent = calc1.value.toLocaleString() + ' ' + calc1.unit;
    document.getElementById('calc1Cost').textContent = '€' + calc1.cost.toLocaleString();
    document.getElementById('calc1Red').textContent = calc1.reduction.toLocaleString() + ' kWh';
    
    document.getElementById('calc2').textContent = calc2.value.toLocaleString() + ' ' + calc2.unit;
    document.getElementById('calc2Cost').textContent = '€' + calc2.cost.toLocaleString();
    document.getElementById('calc2Red').textContent = calc2.reduction.toLocaleString() + ' kWh';
    
    document.getElementById('calc3').textContent = calc3.value.toLocaleString() + ' ' + calc3.unit;
    document.getElementById('calc3Cost').textContent = '€' + calc3.cost.toLocaleString();
    document.getElementById('calc3Red').textContent = calc3.reduction.toLocaleString() + ' m³';
    
    document.getElementById('calc4').textContent = calc4.value.toLocaleString() + ' ' + calc4.unit;
    document.getElementById('calc4Cost').textContent = '€' + calc4.cost.toLocaleString();
    document.getElementById('calc4Red').textContent = calc4.reduction.toLocaleString() + ' m³';
    
    document.getElementById('calc5').textContent = calc5.value.toLocaleString() + ' ' + calc5.unit;
    document.getElementById('calc5Cost').textContent = '€' + calc5.cost.toLocaleString();
    document.getElementById('calc5Red').textContent = calc5.reduction.toLocaleString() + ' fulls';
    
    document.getElementById('calc6').textContent = calc6.value.toLocaleString() + ' ' + calc6.unit;
    document.getElementById('calc6Cost').textContent = '€' + calc6.cost.toLocaleString();
    document.getElementById('calc6Red').textContent = calc6.reduction.toLocaleString() + ' fulls';
    
    document.getElementById('calc7').textContent = '€' + calc7.value.toLocaleString();
    document.getElementById('calc7Cost').textContent = Math.round(calc7.cost).toLocaleString() + ' kg CO₂';
    document.getElementById('calc7Red').textContent = '€' + calc7.reduction.toLocaleString();
    
    document.getElementById('calc8').textContent = '€' + calc8.value.toLocaleString();
    document.getElementById('calc8Cost').textContent = Math.round(calc8.cost).toLocaleString() + ' kg CO₂';
    document.getElementById('calc8Red').textContent = '€' + calc8.reduction.toLocaleString();
    
    // Calcular totales
    const totalCost = calc1.cost + calc3.cost + calc5.cost + calc7.value;
    const totalSavings = calc1.costReduction + calc3.costReduction + calc5.costReduction + calc7.costReduction;
    const totalFinal = totalCost - totalSavings;
    const percentSavings = totalCost > 0 ? Math.round((totalSavings / totalCost) * 100) : 0;
    
    document.getElementById('totalCostAnnual').textContent = '€' + totalCost.toLocaleString();
    document.getElementById('totalSavings').textContent = '€' + totalSavings.toLocaleString();
    document.getElementById('totalCostFinal').textContent = '€' + totalFinal.toLocaleString();
    document.getElementById('totalPercent').textContent = percentSavings + '%';
    
    // Actualizar gráficos
    updateCharts(calc1, calc3, totalCost, totalSavings);
}

// ============================================================
// GRÁFICOS
// ============================================================

function updateCharts(calc1, calc3, totalCost, totalSavings) {
    // GRÁFICO 1: Costos
    const costCtx = document.getElementById('costChart');
    if (window.costChart) window.costChart.destroy();
    
    window.costChart = new Chart(costCtx, {
        type: 'bar',
        data: {
            labels: ['Electricitat', 'Agua', 'Consumibles', 'Neteja', 'TOTAL'],
            datasets: [
                {
                    label: 'Cost actual',
                    data: [
                        baseData.electricitat.anyKwh * baseData.electricitat.preu_kWh,
                        baseData.agua.anyM3 * baseData.agua.preu_m3,
                        baseData.consumibles.cost_any,
                        baseData.neteja.cost_any_EUR,
                        totalCost
                    ],
                    backgroundColor: 'rgba(220, 38, 38, 0.7)',
                    borderColor: '#dc2626',
                    borderWidth: 1
                },
                {
                    label: 'Cost amb reduccions',
                    data: [
                        calc1.cost,
                        calc3.cost,
                        baseData.consumibles.cost_any * (1 - parseInt(document.getElementById('consumerReduction').value) / 100),
                        baseData.neteja.cost_any_EUR * (1 - parseInt(document.getElementById('cleanReduction').value) / 100),
                        totalCost - totalSavings
                    ],
                    backgroundColor: 'rgba(16, 185, 129, 0.7)',
                    borderColor: '#10b981',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: { y: { beginAtZero: true } }
        }
    });
    
    // GRÁFICO 2: CO₂
    const co2Ctx = document.getElementById('co2Chart');
    if (window.co2Chart) window.co2Chart.destroy();
    
    const co2Elec = (baseData.electricitat.anyKwh * baseData.electricitat.co2_kg_per_kWh) / 1000;
    const co2Water = (baseData.agua.anyM3 * baseData.agua.co2_kg_per_m3) / 1000;
    const co2Clean = baseData.neteja.kg_co2_any / 1000;
    
    window.co2Chart = new Chart(co2Ctx, {
        type: 'doughnut',
        data: {
            labels: ['Electricitat', 'Agua', 'Neteja'],
            datasets: [{
                data: [co2Elec, co2Water, co2Clean],
                backgroundColor: [
                    'rgba(220, 38, 38, 0.7)',
                    'rgba(59, 130, 246, 0.7)',
                    'rgba(245, 158, 11, 0.7)'
                ],
                borderColor: ['#dc2626', '#3b82f6', '#f59e0b'],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom' } }
        }
    });
}

// ============================================================
// EXPORTAR DATOS
// ============================================================

function exportData() {
    alert('Funció d\'exportació en desenvolupament.\n\nContacta amb els formadors per a descarregar PDF personalitzat.');
}

// ============================================================
// INICIALIZAR
// ============================================================

document.addEventListener('DOMContentLoaded', function() {
    // Inicializar sliders
    document.querySelectorAll('input[type="range"]').forEach(input => {
        updateRangeLabel(input.id);
    });
    
    // Calcular valores iniciales
    updateCalculations();
});
