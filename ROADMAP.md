# 🗺️ Roadmap del Proyecto - AX Mali Core Engine

Este documento define la trayectoria técnica del módulo y de la plataforma web. Las fases se desarrollan de forma iterativa y modular.

---

## 📌 Estado Actual (Fase 1 y Fase 2 - Completadas)
- [x] Arquitectura base del módulo para AX Manager (`module.prop`, `customize.sh`, `service.sh`, `uninstall.sh`).
- [x] Detección segura de arquitectura dual: 32-bit (`armeabi-v7a`) y 64-bit (`arm64-v8a`).
- [x] Regla de seguridad auditada: Cero uso de `persist.sys.*`.
- [x] Modo Ultra Sensibilidad Táctil (`touch_boost.sh` con Touch Slop 1px y Zero Backpressure).
- [x] Modo Batata / Gráficos reducidos exclusivo Android 12+ (`surface_tweak.sh` con anulación de Game Booster).
- [x] Ultra FPS Engine (`fps_boost.sh` con Latch Unsignaled y afinidad Big Cores Renice -20).
- [x] **Módulo Anti-Stutter RAM & ZRAM (`ram_tweak.sh`)**:
  - `swappiness` ajustado a 50 para suprimir picos de compresión ZRAM en combate.
  - `vfs_cache_pressure` en 50 para retener estructuras de juego en RAM.
  - `page-cluster` en 0 para lecturas atómicas de 1 página sin ráfagas de retardo.
  - Detección y advertencia de la "RAM Virtual" lenta en disco flash.
- [x] **Piso de Frecuencia GPU Mali (`governor_tweak.sh`)**:
  - Detección de nodos devfreq (`/sys/class/misc/mali0/device/devfreq/*/min_freq` y MediaTek GED).
  - Perfil **Floor Frequency (400-500 MHz)** para evitar que la GPU baje a 150 MHz con Gráficos Batata.
  - Perfiles de Rendimiento Máximo, Powersave y Restauración 100% reversible.
- [x] **GMS Shield (`gms_shield.sh`)**:
  - Neutralización de telemetría parásita (`AppMeasurement`, `AdIdService`, `Bug Feedback`, `PartnerSetup`).
  - Google Account Login, Google Play Games y Compras 100% protegidas y funcionales.
- [x] **Traductor Gráfico ANGLE - OpenGL ES a Vulkan (`angle_tweak.sh`)**:
  - Requisito estricto de hardware: Validación de Vulkan 1.1+ (`android.hardware.vulkan.version` >= `4198400`).
  - Bloqueo automático por defecto si el dispositivo tiene Vulkan 1.0 o no tiene Vulkan para evitar pantallas negras.
  - Inyección de backend ANGLE para Free Fire (`settings put global angle_gl_driver_selection_*`) y juegos pesados.
  - Sincronización con `useAngle=true` en Game Overlay y restauración 100% limpia.
- [x] WebUI nativo para AxManager (`webroot/index.html`) con 7 apartados modulares.
- [x] Empaquetado client-side directo en ZIP para descargar en el móvil sin PC (`zipGenerator.ts`).
- [x] Suite de tests unitarios aprobada (`node:test`) con 9 tests passing.

---

## ⚡ Fase 3: Estabilidad de Tasa de Refresco & SurfaceFlinger (Próxima Fase)

---

## ⚡ Fase 3: Estabilidad de Tasa de Refresco & SurfaceFlinger
- [ ] Implementación activa en `surface_tweak.sh`:
  - Detección de paneles de 60Hz, 90Hz, 120Hz y 144Hz.
  - Sincronización de búferes gráficos de triple buffering dinámico.
  - Detección de throttling térmico sin alterar límites de seguridad del hardware.

---

## 📲 Fase 4: Soporte PWA y Extensión de Plugins
- [ ] Habilitar PWA offline con Service Worker para la web de control.
- [ ] Soporte para exportación directa a múltiples gestores (AxManager, KernelSU, APatch y Magisk).
- [ ] Registro de telemetría local (sin servidores externos) de frametimes en juegos.
