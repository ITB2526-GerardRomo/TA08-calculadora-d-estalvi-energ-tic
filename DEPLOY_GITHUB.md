# 🚀 GUÍA DESPLIEGUE: Publicar la Calculadora en GitHub Pages

**FASE 3: Calculadora d'Estalvi Energètic - TA08**

---

## 📋 Índice de Contenidos
1. [Requisitos previos](#requisitos-previos)
2. [Crear repositorio GitHub](#crear-repositorio-github)
3. [Configurar GitHub Pages](#configurar-github-pages)
4. [Publicar la web](#publicar-la-web)
5. [Verificar despliegue](#verificar-despliegue)
6. [Actualizar contenido](#actualizar-contenido)
7. [Dominio personalizado (opcional)](#dominio-personalizado-opcional)

---

## 📌 Requisitos Previos

✅ Cuenta GitHub creada (gratis en https://github.com/signup)  
✅ Git instalado en tu ordenador  
✅ Archivos listos:
- `index.html`
- `styles.css`
- `script.js`
- `README.md`

---

## 🆕 Crear Repositorio GitHub

### Paso 1: Crear nuevo repositorio

1. **Accede a GitHub** → https://github.com/new
2. **Rellena los datos:**
   - **Repository name:** `ta08-calculadora-energetica`
   - **Description:** "Calculadora de ahorro energético ITB - ASIX"
   - **Public** (marcar para que sea público)
   - **Initialize with README** (ya lo tenemos)
3. **Click en "Create repository"**

### Paso 2: Clonar el repositorio

```bash
git clone https://github.com/TU_USUARIO/ta08-calculadora-energetica.git
cd ta08-calculadora-energetica
```

### Paso 3: Copiar los archivos

```bash
# Copiar los 4 archivos principales
cp /ruta/a/index.html .
cp /ruta/a/styles.css .
cp /ruta/a/script.js .
cp /ruta/a/README.md .

# Verificar que están
ls -la
```

**Resultado esperado:**
```
-rw-r--r-- index.html
-rw-r--r-- styles.css
-rw-r--r-- script.js
-rw-r--r-- README.md
-rw-r--r-- .gitignore (opcional)
```

### Paso 4: Subir los archivos a GitHub

```bash
# Agregar todos los archivos
git add .

# Crear el commit
git commit -m "Fase 3: Calculadora energética completa con 8 cálculos y gráficos"

# Enviar a GitHub
git push origin main
```

**Deberías ver en la terminal:**
```
Counting objects: 4, done.
Compressing objects: 100% (4/4), done.
Writing objects: 100% (4/4), 15.23 KiB | 2.55 MiB/s, done.
```

---

## ⚙️ Configurar GitHub Pages

### Paso 1: Acceder a Settings

1. **En tu repositorio GitHub** → Tab "Settings"
2. **En la barra lateral izquierda** → "Pages"

### Paso 2: Configurar rama

1. **Source:** Select branch: `main`
2. **Folder:** `/ (root)` ← **IMPORTANTE**
3. **Click en "Save"**

**GitHub mostrará:**
> "Your site is live at https://TU_USUARIO.github.io/ta08-calculadora-energetica/"

### Paso 3: Esperar el despliegue

- ⏳ GitHub tarda **2-5 minutos** en publicar
- Una vez listo, verás ✅ en la sección Pages

---

## ✅ Verificar Despliegue

### Test 1: Acceder a la URL

```
https://TU_USUARIO.github.io/ta08-calculadora-energetica/
```

### Test 2: Verificar archivos cargados

Abre la consola del navegador (F12) y verifica:
- ✅ No haya errores de archivos (404)
- ✅ CSS cargado (inspecciona estilos)
- ✅ JavaScript ejecutándose (abre consola)
- ✅ Chart.js cargado desde CDN

### Test 3: Probar funcionalidad

1. Ajusta los sliders de reducción
2. Verifica que los números cambian
3. Haz click en "Calcular Scenario"
4. Comprueba que aparecen los gráficos

---

## 📝 Actualizar Contenido

### Si cambias el código local:

```bash
# Edita los archivos localmente
nano index.html   # o con tu editor favorito

# Una vez hecho, sube los cambios
git add .
git commit -m "Descripción del cambio"
git push origin main

# GitHub desplegará automáticamente en 1-2 minutos
```

### Si quieres ver cambios antes de publicar:

```bash
# Servidor local
python3 -m http.server 8000

# Acceder a http://localhost:8000
```

---

## 🌐 Dominio Personalizado (Opcional)

### Si ITB tiene un dominio propio:

1. **En Settings → Pages → Custom domain**
2. **Escribir:** `sostenibilitat.itb.cat` (o similar)
3. **Configurar registros DNS** en tu proveedor

**Registros DNS necesarios:**
```
A         185.199.108.153
A         185.199.109.153
A         185.199.110.153
A         185.199.111.153
CNAME     TU_USUARIO.github.io
```

---

## 📊 Estructura Final del Repositorio

```
ta08-calculadora-energetica/
├── .git/                    # Git (automático)
├── .github/                 # Flujos CI/CD (opcional)
├── index.html              # Página principal (18.6 KB)
├── styles.css              # Estilos (12.6 KB)
├── script.js               # Lógica (16.8 KB)
├── README.md               # Documentación completa
├── README_FASE3.md         # Detalles técnicos de Fase 3
├── .gitignore              # Archivos a ignorar
└── docs/                   # Documentos adicionales (opcional)
    ├── analisis.pdf
    ├── cronograma.pdf
    └── propuestas.pdf
```

---

## 🐛 Solucionar Problemas Comunes

### Problema: "404 - Página no encontrada"

**Causa:** GitHub no ha generado la página aún  
**Solución:**
1. Espera 5 minutos más
2. Recarga la página (Ctrl+F5)
3. Revisa que `index.html` está en root

### Problema: "Archivo CSS no se carga"

**Causa:** Ruta relativa incorrecta  
**Solución:** En `index.html` debe ser:
```html
<link rel="stylesheet" href="styles.css">  <!-- ✓ Correcto -->
<!-- NO: href="/styles.css" o href="./styles.css" -->
```

### Problema: "Gráficos no aparecen"

**Causa:** Chart.js no carga desde CDN  
**Solución:**
1. Revisa conexión a internet
2. Abre consola (F12) → Network → verifica `chart.umd.js`
3. Si no carga, usa CDN alternativo:
```html
<!-- Alternativa -->
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
```

### Problema: "El botón no funciona"

**Causa:** Error en JavaScript  
**Solución:**
1. Abre consola (F12)
2. Revisa errores en rojo
3. Recarga la página
4. Si persiste, comprueba que `script.js` está cargado

---

## 📈 Analytics (Opcional)

Para ver cuántas personas usan la calculadora:

### Google Analytics

1. Crear cuenta en https://analytics.google.com
2. Copiar el código de seguimiento
3. Pegarlo en `<head>` de `index.html`:
```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_ID');
</script>
```

---

## 🔐 Seguridad y Privacidad

✅ **No almacenamos datos:**
- Todos los cálculos son locales (en el navegador)
- No hay servidor backend
- No hay cookies de tracking (sin Google Analytics es privado)

✅ **HTTPS automático:**
- GitHub Pages proporciona HTTPS gratis
- URL: `https://TU_USUARIO.github.io/...`

---

## 📱 Compartir la Calculadora

### URL pública:
```
https://TU_USUARIO.github.io/ta08-calculadora-energetica/
```

### QR para clase:
Puedes generar un QR con:
- https://qr-code-generator.com
- Código: `https://TU_USUARIO.github.io/ta08-calculadora-energetica/`

### Código para integrar en web ITB:
```html
<iframe 
  src="https://TU_USUARIO.github.io/ta08-calculadora-energetica/" 
  width="100%" 
  height="800px" 
  frameborder="0">
</iframe>
```

---

## 🚀 Despliegue Alternativo (Servidor ITB)

Si ITB tiene servidor web propio:

### Opción A: FTP
```bash
# Configurar cliente FTP (FileZilla, etc.)
Host: ftp.itb.cat
Usuario: tu_usuario
Contraseña: tu_contraseña
Directorio: /public_html/calculadora/

# Subir archivos drag & drop
```

### Opción B: SSH
```bash
# Conectar al servidor
ssh usuario@itb.cat

# Crear directorio
mkdir -p /var/www/sostenibilitat/calculadora

# Copiar archivos
scp *.html *.css *.js usuario@itb.cat:/var/www/sostenibilitat/calculadora/

# URL: https://www.itb.cat/sostenibilitat/calculadora/
```

### Opción C: Panel de Control (cPanel)
1. Acceder a cPanel con credenciales ITB
2. Ir a "Gestor de Archivos"
3. Crear carpeta `/public_html/calculadora/`
4. Subir archivos por interfaz web

---

## ✨ Checklist Final

- [ ] Repositorio creado en GitHub
- [ ] Archivos subidos (git push)
- [ ] GitHub Pages activado en Settings
- [ ] URL pública accesible
- [ ] HTML/CSS/JS cargados correctamente
- [ ] Sliders funcionan
- [ ] Gráficos se generan
- [ ] Datos se exportan a CSV
- [ ] Funciona en móvil
- [ ] Sin errores en consola (F12)
- [ ] README actualizado con instrucciones
- [ ] Compartido con profesores

---

## 📞 Soporte

**Si algo no funciona:**

1. Revisa los "Common Issues" arriba
2. Consulta la documentación de GitHub Pages:
   https://docs.github.com/en/pages
3. Contacta al equipo ASIX:
   - javier.amaya@itb.cat
   - meritxell.durany@itb.cat

---

## 📚 Próximos Pasos (Fase 4-5)

- [ ] Fase 4: Auditoría de campo (validar datos con mediciones reales)
- [ ] Fase 5: Presentación oral de resultados
- [ ] Integración con sistema IoT del centro
- [ ] Certificación ISO 14001
- [ ] Publicación en revista de sostenibilidad

---

**¡La calculadora está lista para compartir con el mundo! 🌍**

---

**Última actualización:** 13 de abril de 2025  
**Versión:** 1.0  
**Licencia:** CC-BY 4.0  
**Instituto:** Institut Tecnològic de Barcelona
