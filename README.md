# AX Mali Core Engine & AX Manager Hub

Plataforma de desarrollo, control y empaquetado de módulos para procesadores gráficos **Mali** (MediaTek Dimensity/Helio, Exynos y Kirin) compatibles con **AX Manager** (Axeron) en dispositivos móviles Android (con y sin Root).

---

## 🚀 Características Principales

1. **Modo Ultra Sensibilidad Táctil Nivel Insignia (`touch_boost.sh`):**
   - **Glove Mode / Alta Sensibilidad:** Activa la ganancia analógica de los digitalizadores (Goodix, FocalTech, Novatek, Synaptics) y elimina el límite de polling de Oppo/Realme.
   - **VelocityTracker Strategy Impulse:** Sintoniza el algoritmo de seguimiento a 1:1 sin amortiguación de inercia para alzar mira instantáneamente.
   - **Disolución de Micro-fricción:** Reduce la fricción de scroll a `0.005` (vs estándar `0.015`) y Touch Slop a `1px`.
   - **MediaTek Touch Boost (GED & FPSGO):** Dispara ráfagas de CPU/GPU al toque en `/sys/module/ged/parameters` y `/sys/kernel/fpsgo/fbt`.
   - **Zero Backpressure & Fases:** Sincroniza la composición temprana de `SurfaceFlinger` (`early_phase_offset_ns`).
   - **100% Reversible:** Realiza un respaldo en caliente de la configuración del usuario y de los nodos sysfs para una restauración exacta.

2. **Módulo Anti-Stutter RAM & ZRAM (`ram_tweak.sh`):**
   - Ajusta `vm.swappiness` a 50 para evitar que el kernel sature la CPU comprimiendo memoria en ZRAM durante tiroteos.
   - Retiene inodos y estructuras de archivos de juego en RAM (`vm.vfs_cache_pressure = 50`).
   - Lecturas atómicas de swap de 1 sola página sin ráfagas (`page-cluster = 0`).
   - Auditoría y detección de la "RAM Virtual" lenta en almacenamiento flash.

3. **Piso de Frecuencia GPU Mali (`governor_tweak.sh`):**
   - Resuelve el problema del reloj dormido con Gráficos Batata.
   - Fija un piso mínimo (Floor Frequency) de 400 a 500 MHz en devfreq para garantizar reacción inmediata en cada fotograma.

4. **GMS Shield (`gms_shield.sh`):**
   - Neutraliza servicios secundarios de telemetría, crash logs y rastreo publicitario de Google Play Services.
   - Preserva al 100% el inicio de sesión con Google, Google Play Games y compras en la Play Store.

5. **Seguridad Absoluta (Cero `persist.sys.*`):**
   - Los scripts **jamás** tocan propiedades del tipo `persist.sys.*`, eliminando el riesgo de bootloop o inestabilidad en Android.

6. **Arquitectura Dual 32-bit y 64-bit:**
   - Detección automática en tiempo de ejecución de `arm64-v8a` (dispositivos modernos) y `armeabi-v7a` (dispositivos legacy/gama de entrada).

7. **Interfaz WebUI para AxManager (`webroot/index.html`):**
   - Interfaz gráfica embebida que corre dentro de la aplicación AxManager en el móvil mediante el puente de comandos `ksu.exec` y la API `Axeron`.

8. **Descarga Directa en Teléfono y GitHub Action Manual:**
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
│   ├── fps_boost.sh       # Ultra FPS Engine (Latch Unsignaled y CPU Affinity)
│   ├── ram_tweak.sh       # Módulo Anti-Stutter RAM & ZRAM (Swappiness 50)
│   ├── governor_tweak.sh  # Piso de Frecuencia GPU (Floor Frequency 400-500 MHz)
│   ├── gms_shield.sh      # Escudo Anti-Basura Google Play Services
│   ├── mali_common.sh     # Utilidades comunes y detección 32/64 bits
│   ├── detect_gpu.sh      # Diagnóstico de GPU Mali en tiempo real
│   └── surface_tweak.sh   # Modo Batata y anulación de Game Booster
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
