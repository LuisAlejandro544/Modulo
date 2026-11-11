# ⚡ Resumen Rápido para Agentes de IA (README_AI.md)

> **ATENCIÓN AGENTE ENTRANTE:** Lee este documento para situarte rápidamente en menos de 60 segundos.

---

## 1. ¿Qué es este proyecto?
Un módulo de optimización para teléfonos Android con procesadores gráficos **Mali** (MediaTek Dimensity/Helio, Exynos) empaquetado para **AX Manager (Axeron)**, acompañado de una **Landing Page React 19** que permite inspeccionar el código, auditar la seguridad y descargar el archivo `.zip` directamente al teléfono.

---

## 2. Puntos Clave que DEBES Saber
- **El usuario solo tiene un teléfono móvil** (no PC). Todas las herramientas deben poder usarse tocando la pantalla del teléfono.
- **NUNCA uses `persist.sys.*`** en ningún script. Es una causa directa de bootloop en Android.
- **Sin simulaciones en la web:** El usuario odia las terminales falsas. La web contiene utilidades reales (empaquetado ZIP real con JSZip, visor de código real, tests reales).
- **GitHub Action Manual:** El archivo `.github/workflows/build_module_zip.yml` debe tener **únicamente** `workflow_dispatch`. Nunca agregues `push:` ni `pull_request:`.
- **Estructura del ZIP:** Los archivos (`module.prop`, `customize.sh`, `service.sh`, `uninstall.sh`, `scripts/`, `webroot/`) deben residir en la raíz del archivo ZIP para que AxManager los instale correctamente.

---

## 3. Comandos Esenciales de Verificación
```bash
# 1. Ejecutar tests unitarios (debe pasar 4/4 tests)
npx --yes tsx --test src/utils/moduleData.test.ts

# 2. Auditar que no haya persist.sys.*
grep -rnE "persist\.sys\." ax_module/ src/
```

---

## 4. Archivo de Documentación Detallada
Consulta `Axmanager documentación.md` para entender en profundidad los internos del servidor AxManager, las APIs de `ksu.exec` y la gestión térmica/DVFS de GPUs Mali.
