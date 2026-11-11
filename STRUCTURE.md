# 🏗️ Estructura del Proyecto (STRUCTURE.md)

Este repositorio combina una aplicación frontend en **React 19 + TypeScript** con un **módulo de sistema para Android (`ax_module/`)** diseñado para ejecutarse dentro de **AX Manager (Axeron)**.

---

## 🌳 Árbol Completo de Archivos

```text
├── .github/
│   └── workflows/
│       └── build_module_zip.yml      # GitHub Action manual (workflow_dispatch)
├── ax_module/                        # MÓDULO PARA AX MANAGER (Empaquetable en .ZIP)
│   ├── module.prop                   # Metadatos del plugin (id, version, axeronPlugin=30000)
│   ├── customize.sh                  # Script de instalación y chequeo de arquitectura
│   ├── service.sh                    # Servicio en segundo plano iniciado por el servidor
│   ├── uninstall.sh                  # Limpieza de temporales al desinstalar
│   ├── scripts/                      # Scripts shell modulares ejecutables en Android
│   │   ├── touch_boost.sh            # Aceleración de respuesta y sensibilidad táctil
│   │   ├── mali_common.sh            # Librería compartida (logging, detección 32/64 bits)
│   │   ├── detect_gpu.sh             # Diagnóstico de hardware Mali
│   │   ├── governor_tweak.sh         # Plantilla para frecuencias y escalado DVFS
│   │   └── surface_tweak.sh          # Sincronización de SurfaceFlinger y buffers
│   └── webroot/                      # INTERFAZ WEBUI (Se abre dentro de la app AxManager)
│       └── index.html                # HTML/JS nativo con ksu.exec y Axeron API
├── src/                              # APLICACIÓN WEB REACT (Centro de control y descarga)
│   ├── components/
│   │   ├── Navbar.tsx                # Barra de navegación adaptable (móvil y escritorio)
│   │   ├── HomeScreen.tsx            # Pantalla principal (Hello World y visión general)
│   │   ├── ScriptsExplorerScreen.tsx # Visor y auditor de scripts .sh
│   │   ├── ArchitectureScreen.tsx    # Análisis de arquitecturas 32-bit y 64-bit
│   │   ├── DeployScreen.tsx          # Panel de empaquetado y botón de descarga directa ZIP
│   │   └── GuideModal.tsx            # Popup con guía de uso en el teléfono
│   ├── utils/
│   │   ├── moduleData.ts             # Metadatos, listas de scripts y validador de seguridad
│   │   ├── moduleData.test.ts        # Suite de unit tests con node:test
│   │   └── zipGenerator.ts           # Generador client-side de ZIP usando JSZip
│   ├── App.tsx                       # Componente raíz
│   ├── index.css                     # Tailwind CSS v4
│   └── main.tsx                      # Punto de entrada de React 19
├── index.html                        # Entrypoint HTML con metadatos y SEO sincronizados
├── metadata.json                     # Metadatos de la applet para AI Studio
├── package.json                      # Dependencias del proyecto
├── tsconfig.json                     # Configuración de TypeScript
├── vite.config.ts                    # Configuración de Vite
├── README.md                         # Documentación general para usuarios
├── ROADMAP.md                        # Plan de desarrollo y fases futuras
├── STRUCTURE.md                      # Este archivo (árbol y descripción)
├── AI_CONTEXT.md                     # Contexto técnico para modelos de lenguaje
├── AGENTS.md                         # Reglas de desarrollo y directrices para agentes
├── README_AI.md                      # Resumen rápido para agentes entrantes
└── Axmanager documentación.md       # Documentación exhaustiva sobre AX Manager y Mali
```

---

## 📌 Roles de Cada Carpeta

1. **`ax_module/`:** Es el paquete que se comprime en el archivo `.zip`. Cuando AxManager instala un plugin, descomprime estos archivos en `$AXERONDIR/plugins/<id>`.
2. **`ax_module/scripts/`:** Contiene los archivos `.sh` que el usuario o el WebUI ejecutan a través de ADB shell o root.
3. **`ax_module/webroot/`:** AxManager renderiza `index.html` en un WebView aislado con la API JavaScript `ksu.exec` y `Axeron.exec`.
4. **`src/`:** Interfaz web accesible vía navegador que compila React para visualizar los scripts, verificar compatibilidad y descargar el archivo `.zip` directamente al almacenamiento del teléfono.
