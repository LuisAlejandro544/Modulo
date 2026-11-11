# AX Mali Core Engine & AX Manager Hub

Plataforma de desarrollo, control y empaquetado de módulos para procesadores gráficos **Mali** (MediaTek Dimensity/Helio, Exynos y Kirin) compatibles con **AX Manager** (Axeron) en dispositivos móviles Android (con y sin Root).

---

## 🚀 Características Principales

1. **Modo Ultra Sensibilidad Táctil (`touch_boost.sh`):**
   - Reduce los retardos de entrada del `InputDispatcher` de Android (`long_press_timeout` a 250ms, `pointer_speed` a nivel 7).
   - Escanea y activa nodos de hardware de alta tasa de reporte del digitalizador en SoCs MediaTek.
   - Sincroniza la composición temprana de `SurfaceFlinger` y la GPU Mali (`early_phase_offset_ns`).
   - **100% Reversible:** Realiza un respaldo en caliente de la configuración del usuario antes de aplicar cualquier cambio para permitir la restauración exacta.

2. **Seguridad Absoluta (Cero `persist.sys.*`):**
   - Los scripts **jamás** tocan propiedades del tipo `persist.sys.*`, eliminando el riesgo de bootloop o inestabilidad en Android.

3. **Arquitectura Dual 32-bit y 64-bit:**
   - Detección automática en tiempo de ejecución de `arm64-v8a` (dispositivos modernos) y `armeabi-v7a` (dispositivos legacy/gama de entrada).

4. **Interfaz WebUI para AxManager (`webroot/index.html`):**
   - Interfaz gráfica embebida que corre dentro de la aplicación AxManager en el móvil mediante el puente de comandos `ksu.exec` y la API `Axeron`.

5. **Descarga Directa en Teléfono y GitHub Action Manual:**
   - La web incluye un botón directo para generar y descargar `ax_mali_core_optimizer.zip` al teléfono sin PC.
   - GitHub Action en `.github/workflows/build_module_zip.yml` configurada **exclusivamente con activación manual** (`workflow_dispatch`).

---

## 📁 Estructura del Módulo (`ax_module/`)

```text
ax_module/
├── module.prop         # Identificador, versión y axeronPlugin=30000
├── customize.sh        # Instalador de AxManager: permisos +x y chequeo ABI
├── service.sh          # Servicio de fondo ejecutado por el servidor BusyBox
├── uninstall.sh        # Limpieza de archivos temporales al desinstalar
├── scripts/
│   ├── touch_boost.sh     # Optimización táctil y latencia (Reversible)
│   ├── mali_common.sh     # Utilidades comunes y detección 32/64 bits
│   ├── detect_gpu.sh      # Diagnóstico de GPU Mali en tiempo real
│   ├── governor_tweak.sh  # Hooks preparados para escalado DVFS
│   └── surface_tweak.sh   # Sincronización de SurfaceFlinger
└── webroot/
    └── index.html      # WebUI interactivo para la app de AxManager
```

---

## 📲 Instalación en Teléfono Móvil (Sin PC)

1. Abre esta aplicación web desde tu teléfono.
2. Dirígete a la pestaña **Empaquetado & WebUI**.
3. Pulsa **"Descargar Módulo (.ZIP)"**. El archivo `ax_mali_core_optimizer_v1.0.0.zip` se guardará en tu carpeta de Descargas.
4. Abre la app **AX Manager** en tu teléfono (conectada previamente por Depuración Inalámbrica o Root).
5. Ve a **Plugins** -> **Instalar / Importar ZIP** y selecciona el archivo descargado.
6. Abre el plugin en AxManager para activar el switch de sensibilidad táctil desde la interfaz gráfica.

---

## 🛠️ Desarrollo Frontend
- **Framework:** React 19 + TypeScript + Vite + Tailwind CSS.
- **Tests unitarios:** `npx tsx --test src/utils/moduleData.test.ts`.
- **Compilación:** `npm run build`.
