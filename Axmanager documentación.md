# 📖 Documentación Técnica de AX Manager (Axeron) & Módulos Mali

> **Nota para futuros agentes y desarrolladores:** Este documento es una referencia viva sobre el funcionamiento interno de **AX Manager** (también conocido como *Axeron Manager* o *AxManager*) y la optimización de hardware para procesadores gráficos **Mali**. **Esta documentación puede y debe irse actualizando** conforme se descubran nuevos nodos, APIs o métodos de integración.

---

## 1. ¿Qué es AX Manager (Axeron)?

**AX Manager** es una plataforma y gestor de módulos para Android diseñada por la comunidad de modding móvil (ecosistema FahrezONE / Axeron) que permite ejecutar ajustes avanzados, daemons y plugins similares a los de Magisk o KernelSU, pero con una diferencia arquitectónica fundamental:

### ⚡ Capacidad No-Root (ADB / Depuración Inalámbrica)
- A diferencia de Magisk, que requiere un ramdisk parcheado y bootloader desbloqueado con acceso root permanente, **AX Manager puede funcionar en dispositivos completamente sin root**.
- Se inicia mediante un servidor en segundo plano aprovechando los permisos de depuración inalámbrica de Android (Wireless Debugging) a través del protocolo ADB, Shizuku o LADB.
- **Modo Dual:** Si el dispositivo sí posee permisos Root (vía Magisk, KernelSU o APatch), AxManager los aprovecha automáticamente para otorgar privilegios ampliados a los plugins.

---

## 2. Anatomía de un Plugin / Módulo para AX Manager

Un plugin para AxManager se distribuye como un archivo **`.zip`** que debe contener obligatoriamente sus archivos clave en la **raíz del paquete ZIP**:

```text
mi_modulo.zip
├── module.prop         # Metadatos del módulo (OBLIGATORIO)
├── customize.sh        # Script de instalación (OPCIONAL pero estándar)
├── service.sh          # Daemon de arranque en segundo plano (OPCIONAL)
├── uninstall.sh        # Script de limpieza al eliminar (OPCIONAL)
├── scripts/            # Scripts shell auxiliares
└── webroot/            # Interfaz WebUI embebida dentro de la app AxManager
    └── index.html      # Punto de entrada de la interfaz gráfica
```

### A. `module.prop`
Es el descriptor de propiedades del módulo. Utiliza la sintaxis estándar clave=valor:
```properties
id=ax_mali_core_optimizer
name=Mali GPU Core Engine
version=v1.0.0
versionCode=100
author=AX Mobile Community
description=Módulo de optimización para procesadores Mali y respuesta táctil.
axeronPlugin=30000
minApi=26
```
- **`axeronPlugin=30000`:** Es el identificador de versión de la API de AxManager. Le indica al gestor que el plugin es compatible con la especificación moderna v30000+.
- **`id`:** Identificador único sin espacios ni caracteres especiales.

### B. `customize.sh`
Se ejecuta durante la instalación del módulo desde la app de AxManager:
- AxManager provee variables de entorno como `$MODPATH` (ruta donde se descomprime el plugin) y `$TMPDIR`.
- Se encarga de asignar permisos de ejecución: `chmod -R 0755 "$MODPATH/scripts"` y validar la compatibilidad de la CPU/GPU.

### C. `service.sh`
Se ejecuta en segundo plano cuando el servidor de AxManager arranca o después del inicio del sistema:
- Corre en un entorno **BusyBox Standalone Shell**. Esto significa que utilidades como `ls`, `grep`, `cat` o `chmod` invocan los applets fiables de BusyBox, ignorando binarios corruptos o rutas sucias del sistema Android.
- Debe esperar a que el arranque del sistema concluya:
  ```sh
  while [ "$(getprop sys.boot_completed)" != "1" ]; do
      sleep 2
  done
  ```

### D. `uninstall.sh`
Se dispara automáticamente cuando el usuario desinstala el plugin desde la interfaz de AxManager. Debe limpiar archivos temporales en `/data/local/tmp/` y restaurar configuraciones originales.

---

## 3. La Interfaz WebUI (`webroot/`) y las APIs de Comunicación

Cuando un plugin incluye una carpeta `webroot/` con un archivo `index.html`, AxManager lo detecta y renderiza una ventana de interfaz gráfica directamente dentro de la aplicación móvil.

### A. Seguridad y Aislamiento de Red
- El contenido de `webroot/` se sirve localmente como la raíz del sitio en un esquema seguro local (`ax://plugin.local/` o espejo KernelSU).
- Los archivos fuera de `webroot/` no son accesibles directamente por el navegador WebView por razones de seguridad de Android.

### B. Ejecución de Comandos Shell desde JavaScript

AxManager expone dos APIs en el objeto `window` del navegador:

#### 1. API `ksu.exec` (Compatible con KernelSU)
Es una API basada en Promesas de JavaScript:
```javascript
// Firma de la API
const { errno, stdout, stderr } = await ksu.exec(command, options);
```
- **`errno`:** Código de retorno (0 indica éxito).
- **`stdout`:** Salida estándar generada por el script shell.
- **`stderr`:** Mensajes de error generados durante la ejecución.

#### 2. API Nativa `Axeron`
```javascript
// Ejecución a través del bridge nativo
const output = Axeron.exec(command);
```

#### 3. Marcador de Proceso `AXERON_PLUGIN`
Cada proceso iniciado desde el WebUI mediante `ksu.exec` o `Axeron` lleva una variable de entorno inyectada:
`AXERON_PLUGIN=<id_del_plugin>`. Si el usuario detiene o desinstala el plugin, AxManager mata todos los procesos huérfanos asociados a ese identificador.

---

## 4. Optimización de Procesadores Gráficos Mali

Las GPUs **Mali** (diseñadas por ARM) utilizan un pipeline de renderizado basado en fragmentos y mosaicos (*tile-based deferred rendering*). Están presentes en:
- **MediaTek:** Líneas Helio G y Dimensity (Mali-G52, G57, G68, G77, G710, G720).
- **Samsung Exynos:** Líneas Exynos 850, 980, 1280, 1380, 2100.
- **HiSilicon Kirin:** Kirin 710, 810, 980, 990.

### Puntos Clave de Control en Mali:
1. **Nodos sysfs del controlador:** Rutas comunes en `/sys/class/misc/mali0/` o `/sys/devices/platform/*mali*/`.
2. **DVFS (Dynamic Voltage and Frequency Scaling):** Gobernador que decide con qué rapidez la GPU escala frecuencias ante la carga.
3. **Touch-to-Photon Latency (Latencia Táctil):**
   - El toque registrado por el digitalizador debe despertar la GPU de inmediato.
   - Si la GPU permanece en frecuencias mínimas durante los primeros fotogramas del toque, se percibe lag o lentitud de respuesta.
   - Sincronizando los tiempos de fase temprana de SurfaceFlinger (`debug.sf.early_phase_offset_ns` y `debug.sf.early_gl_phase_offset_ns`), el compositor entrega los eventos táctiles a la GPU Mali sin pérdida de ciclos.

---

## 5. Reglas Inviolables de Seguridad para Desarrolladores / IA

1. **PROHIBIDO EL USO DE `persist.sys.*`:**
   - **NUNCA** utilices comandos como `setprop persist.sys.*`.
   - Las propiedades que comienzan con `persist.` se guardan en la partición persistente de Android. Un valor incompatible puede provocar bootloop irrecuperable en dispositivos con ROMs MIUI, HyperOS, One UI o ColorOS.
   - Usa en su lugar propiedades no persistentes en memoria RAM (`debug.*`), configuraciones del sistema (`settings put secure ...`, `settings put system ...`) o nodos de `/sys/`.

2. **COMPATIBILIDAD CON 32 Y 64 BITS:**
   - La arquitectura de la CPU debe detectarse con `getprop ro.product.cpu.abi`.
   - Soporte para `arm64-v8a` (64-bit) y `armeabi-v7a` (32-bit).

3. **EL USUARIO SOLO TIENE UN TELÉFONO:**
   - No dependas de herramientas que requieran PC.
   - El empaquetado del archivo `.zip` debe estar accesible con un clic desde el navegador móvil.

4. **REVERSIBILIDAD OBLIGATORIA:**
   - Antes de modificar cualquier parámetro de Android, guarda los valores previos del teléfono en `/data/local/tmp/mali_touch_backup.state` para poder revertir al 100% el estado del dispositivo.

---

*Última actualización de esta documentación: Versión v1.0.0 (Base táctil Mali y WebUI AxManager).*
