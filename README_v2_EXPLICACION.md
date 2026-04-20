# 🔄 FASE 3 MEJORADA - Versión 2.0

**Calculadora d'Estalvi Energètic - Versió Parametrizable Completa**

---

## ❌ Problemas de V1 y ✅ Soluciones en V2

### Problema 1: Los 8 cálculos no eran específicos
**V1:** Tenía cálculos genéricos sobre electricidad y agua  
**V2:** ✅ Implementa exactamente los 8 cálculos solicitados:
1. Consum elèctric **any natural**
2. Consum elèctric **període acadèmic (set-juny)**
3. Consum água **any natural**
4. Consum água **període acadèmic (set-juny)**
5. Consumibles oficina **any natural**
6. Consumibles oficina **període acadèmic (set-juny)**
7. Productes neteja **any natural**
8. Productes neteja **període acadèmic (set-juny)**

### Problema 2: No era totalmente parametrizable
**V1:** Sliders solo para reducción global  
**V2:** ✅ Usuario puede seleccionar:
- **Período de análisis** para cada cálculo (año natural o académico)
- **Estacionalidad**: Invierno (electricidad), Verano (agua), Actividad escolar
- **Reducciones específicas** para cada indicador (electricidad, agua, consumibles, neteja)
- **Variabilidad mensual** según temporada

### Problema 3: Tendencias y ciclos estacionales no bien aplicados
**V1:** Estacionalidad fija e igual para todos  
**V2:** ✅ Cada indicador tiene su propia lógica estacional:
- **Electricitat**: Invierno +25%, Verano -20% (configurable)
- **Agua**: Verano +15% por piscina/riego (configurable)
- **Consumibles**: +20% meses de actividad escolar (configurable)
- **Neteja**: Similar a consumibles

### Problema 4: No había "opción para reducir consumo"
**V1:** Sliders de reducción sin explicación de cómo hacerlo  
**V2:** ✅ Cada cálculo muestra:
- **Propuestas de mejora específicas** debajo
- **"Tips box"** con acciones concretas
- **Sección completa "Guía Detallada"** al final

---

## 📊 Cómo Funciona V2

### 1. Usuario Elige Parámetros
```
⚙️ CONFIGURA LOS PARÁMETRES
├─ Períodos (Anual / Académico)
├─ Estacionalidad (Invierno, Verano, etc.)
└─ Reducciones por indicador (0-50%)
```

### 2. Cálculos se Actualizan en Tiempo Real
```javascript
// Pseudocódigo simplificado
Para cada uno de los 8 cálculos:
  1. Obtener valor base
  2. Aplicar ciclo estacional
  3. Aplicar reducción del usuario
  4. Calcular costo
  5. Mostrar en pantalla
```

### 3. Usuario Ve Resultados Instantáneamente
```
📊 LOS 8 CÁLCULOS ESPECÍFICOS
├─ Calc 1: Electr. Any natural → 117.857 kWh → €20.163 → Reduc: 0 kWh
├─ Calc 2: Electr. Acadèmic → 98.214 kWh → €16.802 → Reduc: 0 kWh
├─ Calc 3: Agua Any natural → 1.160 m³ → €2.088 → Reduc: 0 m³
├─ ... (5 más)
└─ RESUMEN TOTAL: €28.542 → Estalvi: €0 (0%)
```

---

## 🎯 Los 8 Cálculos en Detalle

### **Cálculo 1-2: Electricidad**

```
FÓRMULA:
Valor base = 117.857 kWh/año (dato ITB real)

Para período A:
  → Meses = 12 (año natural)
  → Aplicar estacionalidad:
     - Invierno (dic-feb): +25% por calefacción
     - Verano (jun-ago): -20% climatización
     - Otros meses: normal
  → Aplicar reducción usuario: × (1 - %)
  → Calcular costo: × €0.171/kWh

Para período B:
  → Meses = 10 (septiembre-junio)
  → Mismo proceso que periodo A
```

**Estacionalidad Configurables:**
- `winterElec`: Invierno +25% (default) → Slider -50% a +50%
- `summerElec`: Verano -20% (default) → Slider -50% a +50%

---

### **Cálculo 3-4: Agua**

```
FÓRMULA:
Valor base = 1.160 m³/año (dato ITB real)

Aplicar estacionalidad:
  - Verano (jun-ago): +15% por piscina/riego
  - Otros meses: normal
  - Noches con fugas: detectado (8.092 L/día vs 4.735 L/día)

Aplicar reducción usuario
Calcular costo: × €1.80/m³
```

**Estacionalidad Configurable:**
- `summerWater`: Verano +15% → Slider -50% a +50%

---

### **Cálculo 5-6: Consumibles Oficina**

```
FÓRMULA:
Valor base = 7.500 fulls/año (dato ITB real)

Aplicar estacionalidad:
  - Meses lectivos (sept-dic, ene-jun): +20%
  - Julio-agosto: normal
  
Costo: 7.500 fulls × €0.084/full = €631/año

Aplicar reducción usuario
Añadir: retoladores €150/año
```

**Estacionalidad Configurable:**
- `schoolActivity`: +20% en meses de actividad → Slider -50% a +50%

---

### **Cálculo 7-8: Productos Neteja**

```
FÓRMULA:
Valor base = €4.820/año (dato ITB real)

Desglose:
  - Paper higiènic/manos: 70% (€3.375)
  - Jabón, sacos, bolsas: 30% (€1.445)

Aplica estacionalidad similar a consumibles
Costo en CO₂: ~120 kg/año

Aplicar reducción usuario
```

**Nota:** Mostrar tanto en € como en kg CO₂

---

## 🔧 Características Técnicas V2

### Parámetros Interactivos
```html
<!-- PERÍODO -->
<input type="checkbox" id="annualCheck"> Año natural (12 meses)
<input type="checkbox" id="academicCheck"> Período académico (10 meses)
<input type="number" id="customMonths" min="1" max="12" value="6">

<!-- ESTACIONALIDAD (Sliders) -->
<input type="range" id="winterElec" min="-50" max="50" value="25">
<input type="range" id="summerElec" min="-50" max="50" value="-20">
<input type="range" id="summerWater" min="-50" max="50" value="15">
<input type="range" id="schoolActivity" min="-50" max="50" value="20">

<!-- REDUCCIONES (Sliders) -->
<input type="range" id="elecReduction" min="0" max="50" value="0">
<input type="range" id="waterReduction" min="0" max="50" value="0">
<input type="range" id="consumerReduction" min="0" max="50" value="0">
<input type="range" id="cleanReduction" min="0" max="50" value="0">
```

### Actualización en Tiempo Real
```javascript
// Todos los inputs disparan updateCalculations()
document.querySelectorAll('input').forEach(input => {
    input.addEventListener('change', updateCalculations);
});

// Se recalculan los 8 valores
updateCalculations() {
    calc1 = calculateElec_AnyNatural();
    calc2 = calculateElec_Academic();
    calc3 = calculateWater_AnyNatural();
    // ... etc
    
    // Actualizar DOM en tiempo real
    document.getElementById('calc1').textContent = calc1.value;
    // ... etc
}
```

### Aplicación de Estacionalidad
```javascript
function applySeasonality(baseValue, indicator, months) {
    if (indicator === 'electricitat') {
        // Invierno: dic-feb (+25%)
        // Verano: jun-ago (-20%)
        // Distribución realista en los meses
    }
    else if (indicator === 'agua') {
        // Verano: +15% por piscina
    }
    else if (indicator === 'consumibles') {
        // Meses lectivos: +20%
    }
    // ... etc
}
```

---

## 📋 Propuestas de Mejora por Indicador

### ⚡ Electricidad: "Como reducir consum"

1. **Apagat GPOs (22:00)** → -8% nocturn
2. **Servidores eficientes** → -12% computing
3. **Ampliar solar (30→50 kWp)** → -10% xarxa
4. **Climatización inteligente** → -5% estacional
5. **Total potencial: -30% (€6.049/any)**

Visible en:
- ✅ "Tips box" dentro del cálculo 1 y 2
- ✅ Sección "Guía Detallada de Reduccions"

### 💧 Agua

1. **Reparar fugas** → -15%
2. **Airejadores sensoritzats** → -8%
3. **Assecadors vs paper** → -10%
4. **Recirculació agua** → -5%

### 📄 Consumibles

1. **Digitalización** → -40%
2. **Retoladores reutilizables** → -50%
3. **Doble cara** → -30%
4. **Cartuchos regenerados** → -20%

### 🧼 Neteja

1. **Assecadors elèctrics** → -60%
2. **Productes eco** → -10%
3. **Máquina eficiente** → -15%
4. **Neteja preventiva** → -25%

---

## 🎮 Cómo Usar la Calculadora

### Paso 1: Abrir la web
```
https://usuario.github.io/ta08-calculadora-energetica/index_v2.html
```

### Paso 2: Seleccionar parámetros
```
⚙️ Configura los parámetres
- Marca "Año natural" o "Período acadèmic"
- Ajusta los sliders de estacionalidad (invierno +25%, verano -20%, etc.)
- Selecciona reducciones deseadas (0-50% para cada indicador)
```

### Paso 3: Ver cálculos actualizarse
```
📊 Los 8 cálculos se actualizan AUTOMÁTICAMENTE
- Calc 1: Electr. any natural → 117.857 kWh (original)
- Si seleccionas -10% reducción → 106.071 kWh
- Si seleccionas -30% reducción → 82.500 kWh
```

### Paso 4: Analizar resultados
```
📋 Resumen Total:
- Cost total actual: €28.542
- Estalvi con reducciones: €4.282 (15%)
- Cost final: €24.260
```

### Paso 5: Leer propuestas
```
💡 Tips box en cada cálculo muestra cómo reducir
🛠️ Sección "Guía Detallada" al final
```

---

## 📈 Ejemplos de Uso

### Ejemplo 1: Analizar año académico (sept-junio)

**Usuario:**
1. Marca ✓ "Período acadèmic"
2. Ve que calc 2 y calc 4 muestra valores ajustados (10 meses)

**Resultado:**
- Calc 1 (Electr. any): 117.857 kWh
- **Calc 2 (Electr. acadèmic): 98.214 kWh** ← Solo 10 meses
- Calc 3 (Agua any): 1.160 m³
- **Calc 4 (Agua acadèmic): 967 m³** ← Solo 10 meses

---

### Ejemplo 2: Simular reducción electricidad 30%

**Usuario:**
1. Ajusta slider "Reducció Electricitat" a 30%

**Resultado Automático:**
- Calc 1: 117.857 → **82.500 kWh** (-35.357)
- Calc 2: 98.214 → **68.750 kWh** (-29.464)
- Estalvi anual: **€6.049**

---

### Ejemplo 3: Estación invierno muy fría (+50% consum)

**Usuario:**
1. Ajusta slider "Hivern Electricitat" de +25% a +50%

**Resultado Automático:**
- Consumo de invierno aumenta
- Calc 1 y Calc 2 se actualizan
- Resumen total refleja el cambio

---

## ✅ Cumple Requisitos del Profesor

| Requisito | V1 | V2 | Cómo Cumple |
|-----------|----|----|------------|
| **8 cálculos específicos** | ❌ Genéricos | ✅ | Calc 1-8 nombrados exactamente como solicita |
| **"Consum any" + "consum periode"** | ❌ Solo año | ✅ | Cada indicador: any natural + acadèmic |
| **Parámetros interactivos** | ⚠️ Solo reducción | ✅ | Período, estacionalidad, reducciones |
| **Actualización en tiempo real** | ❌ Click manualmente | ✅ | onChange en cada slider/input |
| **Tendencias temporales** | ⚠️ Genéricas | ✅ | Invierno/verano configurable |
| **Ciclos estacionales** | ⚠️ Iguales para todos | ✅ | Específicos por indicador |
| **Opciones de reducción** | ❌ Solo sliders | ✅ | Sliders + Tips box + Guía detallada |

---

## 📁 Archivos V2

```
v2.0/
├── index_v2.html        (Estructura HTML)
├── styles_v2.css        (Estilos mejorados)
├── script_v2.js         (Lógica de cálculos parametrizables)
└── README_v2.md         (Este documento)
```

---

## 🚀 Próximas Mejoras (Fase 4-5)

- [ ] Exportar a PDF con los parámetros elegidos
- [ ] Gráficos de tendencia a 3 años
- [ ] Comparativa con otras instituciones
- [ ] Integración con sensores IoT reales
- [ ] Base de datos de reducciones exitosas

---

## 📞 Soporte

**Si hay dudas sobre los cálculos:**
- Contactar a javier.amaya@itb.cat
- Contactar a meritxell.durany@itb.cat

---

**Versión:** 2.0  
**Fecha:** 13 de abril de 2025  
**Estado:** Listo para presentar al profesor
