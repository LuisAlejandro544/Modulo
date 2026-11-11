# 🏗️ Estructura del Proyecto (ESTRUCTURE.md)

Consulta la documentación completa de estructura y árbol de archivos en [STRUCTURE.md](STRUCTURE.md).

```text
ax_module/               # Módulo empaquetable para AX Manager (.ZIP)
├── module.prop          # Metadatos del plugin (axeronPlugin=30000)
├── customize.sh         # Instalador en AxManager
├── service.sh           # Servicio de fondo BusyBox
├── uninstall.sh         # Limpieza de archivos
├── scripts/             # Scripts shell (touch_boost.sh, mali_common.sh, etc.)
└── webroot/             # WebUI con ksu.exec para la app móvil AxManager

src/                     # Plataforma React 19 + TypeScript + Vite
├── components/          # Vistas modulares y centro de control
└── utils/               # Validaciones de seguridad y generador ZIP
```
