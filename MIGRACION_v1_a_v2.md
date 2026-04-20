# 🔄 MIGRACIÓN: V1 → V2 (RECOMENDADO)

## ⚠️ EL PROFESOR QUIERE V2

Si el profesor dice que la v1 está mal, **necesitas usar la v2 que acabamos de crear**.

---

## 🔀 ¿Qué Cambiar?

### PASO 1: Reemplazar archivos principales

**Elimina estos de tu proyecto:**
```
- index.html       (v1 antiguo) ❌
- styles.css       (v1 antiguo) ❌
- script.js        (v1 antiguo) ❌
```

**Agrega estos en su lugar:**
```
- index_v2.html    (nuevo) ✅
- styles_v2.css    (nuevo) ✅
- script_v2.js     (nuevo) ✅
```

### PASO 2: Renombra archivos

```bash
# Renombrar para que sean los principales
mv index_v2.html index.html
mv styles_v2.css styles.css
mv script_v2.js script.js
```

Nota: `<link rel="stylesheet" href="styles.css">` en HTML debe apuntar al archivo correcto

---

## 🎯 Lo Que Cambió (Resumido)

### HTML (index.html)

**V1:** Secciones estáticas con sliders simples  
**V2:** 
- ✅ **Sección parametrizable** con:
  - Checkboxes para períodos (año/académico)
  - Sliders para estacionalidad (invierno, verano, actividad)
  - Sliders para reducciones por indicador
- ✅ **Sección de cálculos** con:
  - 8 cálculos en tarjetas separadas (calc 1-8)
  - Cada uno con período específico
  - Tips box con propuestas de mejora
- ✅ **Sección de resumen** con totales
- ✅ **Sección de gráficos** actualizados
- ✅ **Sección de guía detallada** de acciones

### JavaScript (script.js)

**V1:** Lógica simple de sliders + cálculos básicos  
**V2:**
- ✅ **Funciones de cálculo específicas:**
  - `calculateElec_AnyNatural()` → Calc 1
  - `calculateElec_Academic()` → Calc 2
  - `calculateWater_AnyNatural()` → Calc 3
  - `calculateWater_Academic()` → Calc 4
  - `calculateConsumibles_AnyNatural()` → Calc 5
  - `calculateConsumibles_Academic()` → Calc 6
  - `calculateNeteja_AnyNatural()` → Calc 7
  - `calculateNeteja_Academic()` → Calc 8

- ✅ **Función de estacionalidad:**
  - `applySeasonality(baseValue, indicator, months)`
  - Distribuye consumo realista según meses

- ✅ **Actualización en tiempo real:**
  - Todos los inputs disparan `updateCalculations()`
  - Los 8 cálculos se recalculan automáticamente

### CSS (styles.css)

**V1:** Estilos simples  
**V2:**
- ✅ Better organization
- ✅ Mejor responsividad
- ✅ Más variables CSS
- ✅ Animaciones suaves
- ✅ Cards mejoradas

---

## 📋 Checklist de Migración

- [ ] Descargué los archivos v2 (index_v2.html, styles_v2.js, script_v2.js)
- [ ] Eliminé los archivos v1 (index.html antiguo, styles.css antiguo, script.js antiguo)
- [ ] Renombré los archivos v2 a sus nombres estándar
- [ ] Actualicé las referencias en GitHub (si está en GitHub)
- [ ] Probé abriendo index.html en navegador
- [ ] Verifiqué que los sliders funcionan
- [ ] Probé cada uno de los 8 cálculos
- [ ] Leí la documentación README_v2_EXPLICACION.md
- [ ] Listo para mostrárselo al profesor

---

## 🧪 Pruebas Rápidas

### Test 1: Los 8 cálculos están visibles
Abre index.html y deberías ver:
```
⚡ Consum Elèctric
  1. Any natural (12 mesos) → 117.857 kWh
  2. Període acadèmic (set-juny) → 98.214 kWh

💧 Consum d'Agua
  3. Any natural (12 mesos) → 1.160 m³
  4. Període acadèmic (set-juny) → 967 m³

📄 Consumibles d'Oficina
  5. Any natural (12 mesos) → 7.500 fulls
  6. Període acadèmic (set-juny) → 6.250 fulls

🧼 Productes de Neteja
  7. Any natural (12 mesos) → €4.820
  8. Període acadèmic (set-juny) → €4.017
```

### Test 2: Parámetros interactivos
Ajusta un slider y verifica:
- [ ] Los números cambian automáticamente
- [ ] No hay error en la consola (F12)
- [ ] Los gráficos se actualizan

### Test 3: Estacionalidad funciona
Ajusta "Hivern Electricitat" de +25% a +50% y verifica:
- [ ] El consumo de cálculos 1 y 2 aumenta
- [ ] El costo también aumenta

### Test 4: Reducción por indicador
Ajusta "Reducció Electricitat" a 30% y verifica:
- [ ] Calc 1: 117.857 → 82.500 kWh
- [ ] Calc 2: 98.214 → 68.750 kWh
- [ ] El estalvi anual es ~€6.049

---

## 🐛 Si Algo Falla

### "Los sliders no funcionan"
**Solución:**
1. Abre F12 → Consola
2. ¿Hay errores rojos?
3. Verifica que script.js se cargó
4. Recarga página (Ctrl+F5)

### "Los números no cambian al mover slider"
**Solución:**
1. En script.js, verifica que cada input tiene `addEventListener`
2. Revisa que `updateCalculations()` existe
3. Abre consola y ejecuta: `updateCalculations()`
4. ¿Funcionó? Si sí, entonces es un problema de evento

### "Los cálculos no son correctos"
**Solución:**
1. Abre DevTools (F12)
2. Ejecuta en consola: `calculateElec_AnyNatural()`
3. ¿Qué valor devuelve?
4. Compara con 117.857 kWh
5. Si no coincide, contacta al profesor

### "No aparece la sección de parámetros"
**Solución:**
1. Verifica que HTML tiene `<section class="parameters-section">`
2. Verifica que CSS tiene `.parameters-section { ... }`
3. Abre HTML en navegador fresh (Ctrl+F5)

---

## 📞 Contacto de Soporte

Si la v2 sigue sin funcionar:

**Email:** 
- javier.amaya@itb.cat
- meritxell.durany@itb.cat

**Describir:**
1. ¿Qué no funciona exactamente?
2. ¿Qué error ves (consola)?
3. ¿Has seguido los pasos de migración?
4. Screenshot si es posible

---

## ✅ Una Vez Migrés a V2

### Para GitHub Pages

```bash
git add index.html styles.css script.js
git commit -m "Fase 3: Versión 2 - Calculadora parametrizable completa"
git push origin main

# GitHub tardará 1-2 minutos en actualizar
# Accede a: https://usuario.github.io/ta08-calculadora-energetica/
```

### Para servidor local

```bash
# En la carpeta del proyecto
python3 -m http.server 8000

# Accede a: http://localhost:8000
```

---

## 📊 Comparativa V1 vs V2

| Aspecto | V1 | V2 |
|---------|----|----|
| **Cálculos específicos (8)** | ❌ Genéricos | ✅ Exactos |
| **Período año + acadèmic** | ❌ Solo total | ✅ Ambos para c/indicador |
| **Parámetros interactivos** | ⚠️ Solo reducción | ✅ Período, estacional, reduc |
| **Actualización real-time** | ❌ Manual | ✅ Al cambiar slider |
| **Estacionalidad flexible** | ⚠️ Fija | ✅ Configurable |
| **Propuestas de mejora** | ❌ Text genérico | ✅ Tips box + Guía |
| **Gráficos actualizados** | ⚠️ Estáticos | ✅ Dinámicos |
| **Documentación** | ✅ Básica | ✅ Completa |

---

## 🎉 ¡Listo!

Ahora tienes una calculadora que:

✅ Calcula los 8 indicadores específicamente  
✅ Es totalmente parametrizable  
✅ Se actualiza en tiempo real  
✅ Tiene tendencias y ciclos estacionales  
✅ Ofrece opciones de reducción  
✅ Es profesional y lista para presentar

**¡Muestrásela al profesor!**

---

**Versión de Migración:** 1.0  
**Fecha:** 13 de abril de 2025  
**Status:** Listo para migración
