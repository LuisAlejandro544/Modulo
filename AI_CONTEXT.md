# 🧠 Contexto Técnico de IA (AI_CONTEXT.md)

Este documento contiene el contexto de arquitectura, restricciones del usuario y decisiones de ingeniería para cualquier modelo de lenguaje o agente de IA que trabaje en este repositorio.

---

## 👤 Perfil del Usuario y Entorno de Uso
- **Dispositivo del usuario:** Utiliza **únicamente un teléfono móvil (Android)**, no tiene computadora / PC.
- **Flujo de trabajo móvil:** Todas las descargas, instalaciones y testeos se realizan directamente en el teléfono. Por eso el empaquetado `.zip` se realiza con un botón directo en el frontend (`zipGenerator.ts`).
- **Gestor objetivo:** **AX Manager** (también conocido como *Axeron Manager* o *AxManager*).
- **GPU objetivo:** Procesadores gráficos **Mali** (ARM Mali Bifrost, Valhall y 5th Gen presentes en SoCs MediaTek Dimensity/Helio, Samsung Exynos y HiSilicon Kirin).

---

## 🛑 REGLAS DE ORO (ESTRICTAS Y NO NEGOCIABLES)

1. **PROHIBIDO EL USO DE `persist.sys.*`:**
   - En ningún script shell, archivo de configuración, comando o tweak para móvil se debe usar jamás ninguna propiedad del tipo `persist.sys.*`.
   - Modificar estas propiedades en dispositivos de fabricantes como Xiaomi, Realme, Oppo o Samsung puede corromper el arranque y causar bootloops.
   - Usar en su lugar: `settings put secure ...`, `settings put system ...`, nodos `/sys/class/...`, o propiedades de memoria RAM volátil como `debug.sf.*`.

2. **COMPATIBILIDAD DUAL DE ARQUITECTURAS (32-BIT & 64-BIT):**
   - El código debe detectar dinámicamente si la CPU es de 64 bits (`arm64-v8a`) o 32 bits (`armeabi-v7a`) mediante `getprop ro.product.cpu.abi`.
   - No asumir 64-bit en dispositivos de gama de entrada.

3. **CERO SIMULACIONES EN LA LANDING PAGE:**
   - El usuario detesta las consolas o terminales de simulación falsas en la web. La web debe ser un centro de control real, explicativo, con visor de código real, auditorías y botón de descarga directa de archivos ZIP reales.

4. **ACTIVACIÓN MANUAL DE GITHUB ACTIONS:**
   - La GitHub Action para compilar el ZIP se activa **exclusivamente de forma manual** mediante `workflow_dispatch`. Nunca se debe configurar para dispararse automáticamente en `push` ni en `pull_request`.

5. **RESPALDO Y REVERSIBILIDAD:**
   - Cualquier optimización que altere valores de Android (`settings put ...`) debe respaldar primero el valor original en un archivo de estado (ej. `/data/local/tmp/mali_touch_backup.state`) para que al desactivarse el modo o desinstalarse el módulo, el sistema vuelva exactamente a su estado de fábrica.

---

## 🔌 API de WebUI en AX Manager
AxManager implementa dos APIs expuestas en el objeto global de JavaScript del WebView:
1. **`ksu.exec(command, options)`:** Devuelve una `Promise<{ errno: number, stdout: string, stderr: string }>`. Compatible con la API de KernelSU.
2. **`Axeron.exec(command)`:** Bridge nativo sincrónico/asincrónico de AxManager.
3. Las variables de entorno inyectadas por AxManager son:
   - `AXERON`: Booleano `true`.
   - `AXERONVER`: Versión de API (ej. `30000`).
   - `AXERONDIR`: Directorio base de AxManager.
   - `AXERON_PLUGIN`: ID del plugin en ejecución (`ax_mali_core_optimizer`).
