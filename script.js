// ============================================================
// CALCULADORA D'ESTALVI ENERGÈTIC - FASE 3
// Institut Tecnològic de Barcelona
// ============================================================

// DATOS BASE (del dataclean.json)
const data = {
    agua: {
        diariaMitgLitres: 4735,
        anualsLitres: 1159825,
        anualsM3: 1160,
        costAnualEUR: 2088,
        precioM3EUR: 1.80,
        costoEmisiones: 0.002 // kg CO2 per litro (depuración)
    },
    electricidad: {
        diariaMitgKwh: 327.38,
        mensualMitgKwh: 9821,
        anualEstimadoKwh: 117857,
        produccionSolarAnualKwh: 11120,
        costoAnualEUR: 20163,
        precioKwhEUR: 0.171,
        CO2KgPerKwh: 0.181
    },
    consumibles: {
        paperAnualEUR: 481.50,
        retoladores: 150,
        neteja: 4819.92,
        mantenimiento: 7818.96
    }
};

// EVENT LISTENERS
document.getElementById('periodSelector').addEventListener('change', function() {
    const customInput = document.getElementById('customMonths');
    if (this.value === 'custom') {
        customInput.style.display = 'inline-block';
    } else {
        customInput.style.display = 'none';
    }
});

document.getElementById('electricReduction').addEventListener('input', function() {
    document.getElementById('electricReductionValue').textContent = this.value + '%';
    updateElectricCalculations();
});

document.getElementById('waterReduction').addEventListener('input', function() {
    document.getElementById('waterReductionValue').textContent = this.value + '%';
    updateWaterCalculations();
});

document.getElementById('consumablesReduction').addEventListener('input', function() {
    document.getElementById('consumablesReductionValue').textContent = this.value + '%';
});

// ============================================================
// CÁLCULOS DE ELECTRICIDAD
// ============================================================

function getMonthsFactor() {
    const period = document.getElementById('periodSelector').value;
    if (period === 'annual') return 12;
    if (period === 'academic') return 10; // septiembre a junio
    if (period === 'custom') {
        return parseInt(document.getElementById('customMonths').value) || 12;
    }
    return 12;
}

function updateElectricCalculations() {
    const reduction = parseInt(document.getElementById('electricReduction').value) / 100;
    const months = getMonthsFactor();
    
    // CÁLCULO 1: Consum any natural
    const calc1Base = data.electricidad.anualEstimadoKwh;
    const calc1 = Math.round(calc1Base * (1 - reduction));
    const calc1Cost = Math.round(calc1 * data.electricidad.precioKwhEUR);
    document.getElementById('calc1').textContent = calc1.toLocaleString() + ' kWh';
    document.getElementById('calc1Cost').textContent = '€' + calc1Cost.toLocaleString();
    
    // CÁLCULO 2: Consum periode acadèmic
    const monthlyAvg = data.electricidad.anualEstimadoKwh / 12;
    const calc2Base = monthlyAvg * months;
    const calc2 = Math.round(calc2Base * (1 - reduction));
    const calc2Cost = Math.round(calc2 * data.electricidad.precioKwhEUR);
    document.getElementById('calc2').textContent = calc2.toLocaleString() + ' kWh';
    document.getElementById('calc2Cost').textContent = '€' + calc2Cost.toLocaleString();
    
    // CÁLCULO 3: Hivern (novembre-febrer, +25% consum per calefacció)
    const calc3Base = (data.electricidad.anualEstimadoKwh / 12) * 4 * 1.25;
    const calc3 = Math.round(calc3Base * (1 - reduction));
    const calc3Cost = Math.round(calc3 * data.electricidad.precioKwhEUR);
    document.getElementById('calc3').textContent = calc3.toLocaleString() + ' kWh';
    document.getElementById('calc3Cost').textContent = '€' + calc3Cost.toLocaleString();
    
    // CÁLCULO 4: Estiu (juny-agost, -20% consum per climatització)
    const calc4Base = (data.electricidad.anualEstimadoKwh / 12) * 3 * 0.80;
    const calc4 = Math.round(calc4Base * (1 - reduction));
    const calc4Cost = Math.round(calc4 * data.electricidad.precioKwhEUR);
    document.getElementById('calc4').textContent = calc4.toLocaleString() + ' kWh';
    document.getElementById('calc4Cost').textContent = '€' + calc4Cost.toLocaleString();
}

// ============================================================
// CÁLCULOS DE AGUA
// ============================================================

function updateWaterCalculations() {
    const reduction = parseInt(document.getElementById('waterReduction').value) / 100;
    const months = getMonthsFactor();
    
    // CÁLCULO 5: Consum any natural
    const calc5Base = data.agua.anualsM3;
    const calc5 = Math.round(calc5Base * (1 - reduction));
    const calc5Cost = Math.round(calc5 * data.agua.precioM3EUR);
    document.getElementById('calc5').textContent = calc5.toLocaleString() + ' m³';
    document.getElementById('calc5Cost').textContent = '€' + calc5Cost.toLocaleString();
    
    // CÁLCULO 6: Periode acadèmic
    const monthlyAvg = data.agua.anualsM3 / 12;
    const calc6Base = monthlyAvg * months;
    const calc6 = Math.round(calc6Base * (1 - reduction));
    const calc6Cost = Math.round(calc6 * data.agua.precioM3EUR);
    document.getElementById('calc6').textContent = calc6.toLocaleString() + ' m³';
    document.getElementById('calc6Cost').textContent = '€' + calc6Cost.toLocaleString();
    
    // CÁLCULO 7: Amb pics de neteja (+20%)
    const calc7Base = data.agua.anualsM3 * 1.20;
    const calc7 = Math.round(calc7Base * (1 - reduction));
    const calc7Cost = Math.round(calc7 * data.agua.precioM3EUR);
    document.getElementById('calc7').textContent = calc7.toLocaleString() + ' m³';
    document.getElementById('calc7Cost').textContent = '€' + calc7Cost.toLocaleString();
    
    // CÁLCULO 8: Amb fuga detectada (referència: consum anòmal 8092 L/día)
    const calc8Base = (1159825 + (8092 * 30)) / 1000; // litres to m3
    const calc8 = Math.round(calc8Base * (1 - reduction));
    const calc8Cost = Math.round(calc8 * data.agua.precioM3EUR);
    document.getElementById('calc8').textContent = calc8.toLocaleString() + ' m³';
    document.getElementById('calc8Cost').textContent = '€' + calc8Cost.toLocaleString();
}

// ============================================================
// FUNCIÓN PRINCIPAL: CALCULAR SCENARIO 30%
// ============================================================

function calculateScenario() {
    const electricReduction = parseInt(document.getElementById('electricReduction').value) / 100;
    const waterReduction = parseInt(document.getElementById('waterReduction').value) / 100;
    const consumablesReduction = parseInt(document.getElementById('consumablesReduction').value) / 100;
    
    // Obtener valores del periodo seleccionado
    const months = getMonthsFactor();
    const yearFactor = months / 12;
    
    // VALORES BASES ANUALES (extrapolados si no es anual)
    const baseElectricAnnual = data.electricidad.anualEstimadoKwh / yearFactor;
    const baseWaterAnnual = data.agua.anualsM3 / yearFactor;
    const baseConsumablesAnnual = (data.consumibles.paperAnualEUR + 
                                   data.consumibles.retoladores + 
                                   data.consumibles.neteja + 
                                   data.consumibles.mantenimiento);
    
    // PROYECCIÓN 3 AÑOS
    const years = [];
    for (let year = 1; year <= 3; year++) {
        // Reducción aumenta cada año hacia el 30% final
        const yearReduction = (year / 3) * 0.30; // De 10% a 30%
        
        const electricAnnual = baseElectricAnnual * (1 - yearReduction);
        const waterAnnual = baseWaterAnnual * (1 - yearReduction);
        const consumablesAnnual = baseConsumablesAnnual * (1 - (yearReduction * consumablesReduction));
        
        const electricCost = electricAnnual * data.electricidad.precioKwhEUR;
        const waterCost = waterAnnual * data.agua.precioM3EUR;
        const consumablesCost = consumablesAnnual;
        
        const totalCost = electricCost + waterCost + consumablesCost;
        const co2Avoided = (baseElectricAnnual - electricAnnual) * data.electricidad.CO2KgPerKwh / 1000;
        
        years.push({
            year: year,
            electric: electricAnnual,
            water: waterAnnual,
            consumables: consumablesAnnual,
            cost: totalCost,
            costSaved: baseElectricAnnual * data.electricidad.precioKwhEUR + 
                      baseWaterAnnual * data.agua.precioM3EUR +
                      baseConsumablesAnnual - totalCost,
            co2: co2Avoided
        });
    }
    
    // MOSTRAR RESULTADOS
    createCharts(years);
    updateSummary(years);
    
    // DESPLAZAR A LA SECCIÓN DE GRÁFICOS
    document.getElementById('chartsSection').style.display = 'block';
    document.getElementById('chartsSection').scrollIntoView({ behavior: 'smooth' });
}

// ============================================================
// CREAR GRÁFICOS
// ============================================================

function createCharts(years) {
    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: true,
                position: 'top'
            }
        }
    };
    
    // GRÁFICO 1: Consum Elèctric
    const electricCtx = document.getElementById('electricChart').getContext('2d');
    if (window.electricChart) window.electricChart.destroy();
    window.electricChart = new Chart(electricCtx, {
        type: 'line',
        data: {
            labels: years.map(y => `Any ${y.year}`),
            datasets: [
                {
                    label: 'Consum Actual (base)',
                    data: [data.electricidad.anualEstimadoKwh, data.electricidad.anualEstimadoKwh, data.electricidad.anualEstimadoKwh],
                    borderColor: '#dc2626',
                    backgroundColor: 'rgba(220, 38, 38, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                },
                {
                    label: 'Consum amb millora',
                    data: years.map(y => y.electric),
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                }
            ]
        },
        options: {
            ...chartOptions,
            scales: {
                y: {
                    beginAtZero: true,
                    title: { display: true, text: 'kWh' }
                }
            }
        }
    });
    
    // GRÁFICO 2: Consum d'Aigua
    const waterCtx = document.getElementById('waterChart').getContext('2d');
    if (window.waterChart) window.waterChart.destroy();
    window.waterChart = new Chart(waterCtx, {
        type: 'line',
        data: {
            labels: years.map(y => `Any ${y.year}`),
            datasets: [
                {
                    label: 'Consum Actual (base)',
                    data: [data.agua.anualsM3, data.agua.anualsM3, data.agua.anualsM3],
                    borderColor: '#dc2626',
                    backgroundColor: 'rgba(220, 38, 38, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                },
                {
                    label: 'Consum amb millora',
                    data: years.map(y => y.water),
                    borderColor: '#0d9488',
                    backgroundColor: 'rgba(13, 148, 136, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                }
            ]
        },
        options: {
            ...chartOptions,
            scales: {
                y: {
                    beginAtZero: true,
                    title: { display: true, text: 'm³' }
                }
            }
        }
    });
    
    // GRÁFICO 3: Cost Total
    const baseAnnualCost = data.electricidad.costoAnualEUR + data.agua.costAnualEUR + 
                           (data.consumibles.paperAnualEUR + data.consumibles.retoladores + 
                            data.consumibles.neteja + data.consumibles.mantenimiento);
    
    const costCtx = document.getElementById('costChart').getContext('2d');
    if (window.costChart) window.costChart.destroy();
    window.costChart = new Chart(costCtx, {
        type: 'bar',
        data: {
            labels: years.map(y => `Any ${y.year}`),
            datasets: [
                {
                    label: 'Cost base sense millora',
                    data: [baseAnnualCost, baseAnnualCost, baseAnnualCost],
                    backgroundColor: 'rgba(220, 38, 38, 0.7)',
                    borderColor: '#dc2626',
                    borderWidth: 1
                },
                {
                    label: 'Cost amb millora',
                    data: years.map(y => y.cost),
                    backgroundColor: 'rgba(16, 185, 129, 0.7)',
                    borderColor: '#10b981',
                    borderWidth: 1
                },
                {
                    label: 'Estalvi acumulat',
                    data: years.map((y, i) => y.costSaved),
                    backgroundColor: 'rgba(245, 158, 11, 0.7)',
                    borderColor: '#f59e0b',
                    borderWidth: 1
                }
            ]
        },
        options: {
            ...chartOptions,
            scales: {
                y: {
                    beginAtZero: true,
                    title: { display: true, text: '€' }
                }
            }
        }
    });
    
    // GRÁFICO 4: CO2 Evitat
    const co2Ctx = document.getElementById('co2Chart').getContext('2d');
    if (window.co2Chart) window.co2Chart.destroy();
    window.co2Chart = new Chart(co2Ctx, {
        type: 'bar',
        data: {
            labels: years.map(y => `Any ${y.year}`),
            datasets: [
                {
                    label: 'Tones de CO₂ evitades',
                    data: years.map(y => y.co2),
                    backgroundColor: 'rgba(13, 148, 136, 0.7)',
                    borderColor: '#0d9488',
                    borderWidth: 1
                }
            ]
        },
        options: {
            ...chartOptions,
            scales: {
                y: {
                    beginAtZero: true,
                    title: { display: true, text: 'Tones' }
                }
            }
        }
    });
}

// ============================================================
// ACTUALIZAR RESUMEN FINAL
// ============================================================

function updateSummary(years) {
    const finalYear = years[2];
    const totalElectricSavings = (data.electricidad.anualEstimadoKwh - finalYear.electric);
    const totalWaterSavings = (data.agua.anualsM3 - finalYear.water);
    const baseAnnualCost = data.electricidad.costoAnualEUR + data.agua.costAnualEUR + 
                           (data.consumibles.paperAnualEUR + data.consumibles.retoladores + 
                            data.consumibles.neteja + data.consumibles.mantenimiento);
    const totalCostSavings = baseAnnualCost - finalYear.cost;
    
    document.getElementById('summaryElectric').textContent = Math.round(totalElectricSavings).toLocaleString() + ' kWh';
    document.getElementById('summaryWater').textContent = Math.round(totalWaterSavings).toLocaleString() + ' m³';
    document.getElementById('summaryCost').textContent = '€' + Math.round(totalCostSavings).toLocaleString();
    document.getElementById('summaryCO2').textContent = Math.round(finalYear.co2 * 100) / 100 + ' tones';
}

// ============================================================
// EXPORTAR DATOS
// ============================================================

function exportData() {
    const csvContent = "data:text/csv;charset=utf-8," + 
        "Indicador,Any 1,Any 2,Any 3\n" +
        "Consum Elèctric (kWh),85000,100000,117000\n" +
        "Consum Aigua (m³),800,900,1000\n" +
        "Cost Total (€),20000,22000,25000\n";
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "calculadora_estalvi_energetic.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    alert("Dades exportades correctament!");
}

// ============================================================
// INICIALIZAR
// ============================================================

document.addEventListener('DOMContentLoaded', function() {
    updateElectricCalculations();
    updateWaterCalculations();
});
