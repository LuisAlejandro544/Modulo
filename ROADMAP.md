# 🗺️ Roadmap del Proyecto - AX Mali Core Engine

Este documento define la trayectoria técnica del módulo y de la plataforma web. Las fases se desarrollan de forma iterativa y modular.

---

## 📌 Estado Actual (Fase 1 - Completada)
- [x] Arquitectura base del módulo para AX Manager (`module.prop`, `customize.sh`, `service.sh`, `uninstall.sh`).
- [x] Detección segura de arquitectura dual: 32-bit (`armeabi-v7a`) y 64-bit (`arm64-v8a`).
- [x] Regla de seguridad auditada: Cero uso de `persist.sys.*`.
- [x] Implementación completa de `touch_boost.sh` (reducción de timeouts a 250ms, pointer_speed a 7, escaneo de nodos de panel táctil y reversibilidad 100%).
- [x] WebUI nativo para AxManager (`webroot/index.html`) con llamada segura `ksu.exec`.
- [x] Botón de empaquetado client-side para descargar el `.zip` en el móvil sin PC.
- [x] GitHub Action con disparador exclusivamente manual (`workflow_dispatch`).
- [x] Suite de tests unitarios aprobada (`node:test`).

---

## 🚀 Fase 2: Control de Frecuencias y DVFS para Mali (Próxima Fase)
- [ ] Implementar perfiles de energía en `governor_tweak.sh`:
  - Perfil **Ahorro de Batería (Powersave)**: Frecuencia GPU mínima para multimedia.
  - Perfil **Equilibrado (Balanced)**: DVFS dinámico con rampa suave.
  - Perfil **Rendimiento / Gaming**: Prevención de caídas de frecuencia en juegos pesados.
- [ ] Escaneo de nodos de GPU sysfs específicos:
  - `/sys/class/misc/mali0/device/cur_freq` y `max_freq`.
  - `/sys/devices/platform/13040000.mali/` (Exynos Mali) y nodos MediaTek Dimensity.
- [ ] Selector de perfiles en el WebUI móvil con botones dedicados.

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
