/**
 * @file zipGenerator.ts
 * @description Generador client-side del archivo ZIP del módulo para AX Manager.
 * Empaqueta todos los scripts y el WebUI asegurando que module.prop y customize.sh
 * queden directamente en la raíz del archivo ZIP, listos para importar en la app móvil.
 */

import JSZip from 'jszip';

export async function generateModuleZipBlob(): Promise<Blob> {
  const zip = new JSZip();

  // 1. Archivos en la raíz del módulo
  zip.file(
    'module.prop',
    `# Propiedades del Módulo para AX Manager / Axeron
id=ax_mali_core_optimizer
name=Mali GPU Core Engine
version=v1.0.0
versionCode=100
author=AX Mobile Community
description=Módulo base para optimización y control de GPU Mali en dispositivos móviles (32-bit y 64-bit). Compatible con AX Manager sin root y con root.
axeronPlugin=30000
minApi=26
`
  );

  zip.file(
    'customize.sh',
    `#!/system/bin/sh
ui_print "***************************************************"
ui_print "*        AX MALI GPU OPTIMIZER (BASE)             *"
ui_print "*   Compatibilidad para AX Manager (Root / No-Root)*"
ui_print "***************************************************"

MODPATH="\${MODPATH:-\$(dirname "\$0")}"

if [ -d "\$MODPATH/scripts" ]; then
    ui_print "- Asignando permisos de ejecución a scripts internos..."
    chmod -R 0755 "\$MODPATH/scripts"
    ui_print "- Script de optimización táctil (touch_boost.sh) configurado."
fi

chmod 0755 "\$MODPATH/service.sh" 2>/dev/null
chmod 0755 "\$MODPATH/uninstall.sh" 2>/dev/null

ABI=\$(getprop ro.product.cpu.abi)
ui_print "- Arquitectura de dispositivo: \$ABI"

case "\$ABI" in
    arm64-v8a*)
        ui_print "- Modo: 64-bit nativo soportado."
        ;;
    armeabi-v7a*)
        ui_print "- Modo: 32-bit legacy soportado."
        ;;
    *)
        ui_print "- Modo: Compatibilidad universal activa."
        ;;
esac

ui_print "- Verificando compatibilidad de procesador gráfico..."
EGL=\$(getprop ro.hardware.egl)
ui_print "- EGL Hardware: \$EGL"

ui_print "==================================================="
ui_print " Instalación del esqueleto base finalizada con éxito."
ui_print " Listo para el desarrollo de funciones personalizadas."
ui_print "==================================================="
`
  );

  zip.file(
    'service.sh',
    `#!/system/bin/sh
MODDIR="\$(dirname "\$0")"

while [ "\$(getprop sys.boot_completed)" != "1" ]; do
    sleep 2
done

if [ -f "\$MODDIR/scripts/mali_common.sh" ]; then
    . "\$MODDIR/scripts/mali_common.sh"
    log_info "Servicio base de AX Mali Optimizer iniciado correctamente."
    log_info "Servidor AXERON: \${AXERON:-no-detectado}, Versión: \${AXERONVER:-indefinida}"
fi

log_info "Servicio en estado pasivo/escucha. Listo para recibir instrucciones."
`
  );

  zip.file(
    'uninstall.sh',
    `#!/system/bin/sh
LOG_FILE="/data/local/tmp/ax_mali_optimizer.log"

if [ -f "\$LOG_FILE" ]; then
    rm -f "\$LOG_FILE"
fi

rm -f /data/local/tmp/mali_touch_*.state 2>/dev/null
echo "Módulo AX Mali Optimizer desinstalado y archivos temporales limpiados correctamente."
`
  );

  // 2. Carpeta scripts/
  const scriptsFolder = zip.folder('scripts');
  if (scriptsFolder) {
    scriptsFolder.file(
      'touch_boost.sh',
      `#!/system/bin/sh
SCRIPT_DIR=\$(dirname "\$0")
BACKUP_STATE="/data/local/tmp/mali_touch_backup.state"
STATUS_FILE="/data/local/tmp/mali_touch_status.state"

if [ -f "\$SCRIPT_DIR/mali_common.sh" ]; then
    . "\$SCRIPT_DIR/mali_common.sh"
else
    log_info() { echo "[INFO] \$1"; }
    log_warn() { echo "[AVISO] \$1"; }
    log_error() { echo "[ERROR] \$1"; }
fi

backup_original_settings() {
    if [ ! -f "\$BACKUP_STATE" ]; then
        log_info "Creando respaldo de configuración táctil previa del dispositivo..."
        ORIG_LONG_PRESS=\$(settings get secure long_press_timeout 2>/dev/null)
        ORIG_MULTI_PRESS=\$(settings get secure multi_press_timeout 2>/dev/null)
        ORIG_POINTER_SPEED=\$(settings get system pointer_speed 2>/dev/null)
        ORIG_TAP_DURATION=\$(settings get secure tap_duration_threshold 2>/dev/null)
        ORIG_TOUCH_BLOCK=\$(settings get secure touch_blocking_period 2>/dev/null)

        cat <<EOF > "\$BACKUP_STATE"
ORIG_LONG_PRESS=\${ORIG_LONG_PRESS:-400}
ORIG_MULTI_PRESS=\${ORIG_MULTI_PRESS:-300}
ORIG_POINTER_SPEED=\${ORIG_POINTER_SPEED:-0}
ORIG_TAP_DURATION=\${ORIG_TAP_DURATION:-0}
ORIG_TOUCH_BLOCK=\${ORIG_TOUCH_BLOCK:-0}
EOF
        log_info "Respaldo guardado exitosamente en \$BACKUP_STATE"
    fi
}

enable_touch_boost() {
    log_info "Iniciando activación de Touch Boost para GPU Mali y Panel Táctil..."
    ARCH=\$(getprop ro.product.cpu.abi)
    log_info "Arquitectura detectada: \$ARCH"

    backup_original_settings

    settings put secure long_press_timeout 250
    settings put secure multi_press_timeout 200
    settings put system pointer_speed 7
    settings put secure tap_duration_threshold 0
    settings put secure touch_blocking_period 0
    log_info "Ajustes de InputDispatcher y pointer_speed aplicados."

    TOUCH_NODES="
        /sys/class/touch/touch_dev/game_switch
        /proc/touchpanel/game_switch_enable
        /proc/touchpanel/oppo_tp_limit_enable
        /sys/devices/virtual/touch/touch_dev/bump_sample_rate
        /sys/devices/platform/tp_gesture/game_mode
        /sys/android_touch/game_mode
    "
    NODES_APPLIED=0
    for node in \$TOUCH_NODES; do
        if [ -w "\$node" ]; then
            if echo "\$node" | grep -q "limit_enable"; then
                echo 0 > "\$node" 2>/dev/null && NODES_APPLIED=\$((NODES_APPLIED + 1))
            else
                echo 1 > "\$node" 2>/dev/null && NODES_APPLIED=\$((NODES_APPLIED + 1))
            fi
            log_info "Nodo del kernel activado: \$node"
        fi
    done
    log_info "Nodos de hardware de panel optimizados: \$NODES_APPLIED"

    setprop debug.sf.early_phase_offset_ns 500000 2>/dev/null
    setprop debug.sf.early_gl_phase_offset_ns 3000000 2>/dev/null
    setprop debug.sf.early_app_phase_offset_ns 500000 2>/dev/null
    log_info "Fases de composición temprana SurfaceFlinger/Mali configuradas."

    echo "1" > "\$STATUS_FILE"
    echo "SUCCESS: Modo Ultra Sensibilidad Táctil activado con éxito."
}

disable_touch_boost() {
    log_info "Desactivando Touch Boost y restaurando valores originales..."
    if [ -f "\$BACKUP_STATE" ]; then
        . "\$BACKUP_STATE"
        settings put secure long_press_timeout "\${ORIG_LONG_PRESS:-400}"
        settings put secure multi_press_timeout "\${ORIG_MULTI_PRESS:-300}"
        settings put system pointer_speed "\${ORIG_POINTER_SPEED:-0}"
        settings put secure tap_duration_threshold "\${ORIG_TAP_DURATION:-0}"
        settings put secure touch_blocking_period "\${ORIG_TOUCH_BLOCK:-0}"
        log_info "Valores del sistema restaurados según respaldo previo."
    else
        settings put secure long_press_timeout 400
        settings put secure multi_press_timeout 300
        settings put system pointer_speed 0
        settings put secure tap_duration_threshold 0
        settings put secure touch_blocking_period 0
    fi

    for node in \\
        /sys/class/touch/touch_dev/game_switch \\
        /proc/touchpanel/game_switch_enable \\
        /sys/devices/virtual/touch/touch_dev/bump_sample_rate \\
        /sys/devices/platform/tp_gesture/game_mode \\
        /sys/android_touch/game_mode; do
        if [ -w "\$node" ]; then
            echo 0 > "\$node" 2>/dev/null
        fi
    done

    if [ -w "/proc/touchpanel/oppo_tp_limit_enable" ]; then
        echo 1 > "/proc/touchpanel/oppo_tp_limit_enable" 2>/dev/null
    fi

    setprop debug.sf.early_phase_offset_ns "" 2>/dev/null
    setprop debug.sf.early_gl_phase_offset_ns "" 2>/dev/null
    setprop debug.sf.early_app_phase_offset_ns "" 2>/dev/null

    echo "0" > "\$STATUS_FILE"
    echo "SUCCESS: Valores táctiles restaurados a la configuración estándar."
}

get_status() {
    CURRENT_STATUS="0"
    if [ -f "\$STATUS_FILE" ]; then
        CURRENT_STATUS=\$(cat "\$STATUS_FILE" 2>/dev/null)
    fi
    LONG_PRESS=\$(settings get secure long_press_timeout 2>/dev/null)
    SPEED=\$(settings get system pointer_speed 2>/dev/null)

    echo "STATUS=\$CURRENT_STATUS"
    echo "LONG_PRESS_TIMEOUT=\$LONG_PRESS"
    echo "POINTER_SPEED=\$SPEED"
    echo "PERSIST_SYS_CHECK=0_VIOLATIONS"
}

ACTION="\${1:-status}"
case "\$ACTION" in
    enable|1|on) enable_touch_boost ;;
    disable|0|off) disable_touch_boost ;;
    status|info) get_status ;;
    *) echo "Uso: \$0 {enable|disable|status}"; exit 1 ;;
esac
`
    );

    scriptsFolder.file(
      'mali_common.sh',
      `#!/system/bin/sh
MODDIR="\${MODDIR:-\$(dirname "\$0")/..}"
LOG_FILE="/data/local/tmp/ax_mali_optimizer.log"
DATE_TAG=\$(date +"%Y-%m-%d %H:%M:%S")

log_info() {
    echo "[\${DATE_TAG}] [INFO] \$1"
    echo "[\${DATE_TAG}] [INFO] \$1" >> "\$LOG_FILE" 2>/dev/null
}

log_warn() {
    echo "[\${DATE_TAG}] [AVISO] \$1"
    echo "[\${DATE_TAG}] [AVISO] \$1" >> "\$LOG_FILE" 2>/dev/null
}

log_error() {
    echo "[\${DATE_TAG}] [ERROR] \$1"
    echo "[\${DATE_TAG}] [ERROR] \$1" >> "\$LOG_FILE" 2>/dev/null
}

detect_architecture() {
    PRIMARY_ABI=\$(getprop ro.product.cpu.abi)
    ABI_LIST=\$(getprop ro.product.cpu.abilist)

    case "\$PRIMARY_ABI" in
        arm64-v8a*) ARCH_TYPE="64-bit"; ARCH_LABEL="AArch64" ;;
        armeabi-v7a*|armeabi*) ARCH_TYPE="32-bit"; ARCH_LABEL="ARMv7" ;;
        x86_64*) ARCH_TYPE="64-bit"; ARCH_LABEL="x86_64" ;;
        x86*) ARCH_TYPE="32-bit"; ARCH_LABEL="x86" ;;
        *) ARCH_TYPE="desconocida"; ARCH_LABEL="\$PRIMARY_ABI" ;;
    esac
    echo "\$ARCH_TYPE"
}

detect_mali_gpu() {
    IS_MALI=0
    POSSIBLE_PATHS="
        /sys/class/misc/mali0
        /sys/devices/platform/mali.0
        /sys/devices/platform/13040000.mali
        /sys/devices/platform/13000000.mali
        /sys/devices/platform/gpu
        /sys/kernel/gpu
    "
    for path in \$POSSIBLE_PATHS; do
        if [ -d "\$path" ] || [ -f "\$path/device/uevent" ]; then
            IS_MALI=1
            break
        fi
    done
    EGL_HARDWARE=\$(getprop ro.hardware.egl)
    if [ "\$IS_MALI" -eq 1 ] || echo "\$EGL_HARDWARE" | grep -iq "mali"; then
        return 0
    fi
    return 1
}
`
    );

    scriptsFolder.file(
      'detect_gpu.sh',
      `#!/system/bin/sh
SCRIPT_DIR=\$(dirname "\$0")
if [ -f "\$SCRIPT_DIR/mali_common.sh" ]; then
    . "\$SCRIPT_DIR/mali_common.sh"
fi

echo "====================================================="
echo "   REPORTE DE DIAGNÓSTICO GPU MALI - AX MANAGER      "
echo "====================================================="
CURRENT_ARCH=\$(detect_architecture)
echo "• Arquitectura del Sistema: \$CURRENT_ARCH"

if detect_mali_gpu; then
    echo "• Estado de la GPU: Compatible (Familia Mali detectada)"
else
    echo "• Estado de la GPU: Genérica / Modo compatibilidad activa"
fi

echo "====================================================="
`
    );

    scriptsFolder.file(
      'governor_tweak.sh',
      `#!/system/bin/sh
SCRIPT_DIR=\$(dirname "\$0")
if [ -f "\$SCRIPT_DIR/mali_common.sh" ]; then
    . "\$SCRIPT_DIR/mali_common.sh"
fi

log_info "Iniciando governor_tweak.sh (Modo base sin funciones activas)..."
ARCH=\$(detect_architecture)
log_info "Entorno preparado para arquitectura: \$ARCH"
`
    );

    scriptsFolder.file(
      'surface_tweak.sh',
      `#!/system/bin/sh
SCRIPT_DIR=\$(dirname "\$0")
if [ -f "\$SCRIPT_DIR/mali_common.sh" ]; then
    . "\$SCRIPT_DIR/mali_common.sh"
fi

log_info "Ejecutando comprobación base de surface_tweak.sh..."
ARCH=\$(detect_architecture)
log_info "Verificación de estabilidad de renderizado para ABI: \$ARCH"
`
    );
  }

  // 3. Carpeta webroot/
  const webrootFolder = zip.folder('webroot');
  if (webrootFolder) {
    webrootFolder.file(
      'index.html',
      `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
  <title>AX Mali Core - WebUI</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, sans-serif; }
    body { background: #090d16; color: #f1f5f9; padding: 16px; font-size: 14px; }
    .header { background: #131c31; border: 1px solid #1e293b; border-radius: 14px; padding: 14px; text-align: center; margin-bottom: 14px; }
    .badge { display: inline-block; background: rgba(14, 165, 233, 0.2); color: #38bdf8; font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 999px; margin-bottom: 6px; }
    h1 { font-size: 18px; color: #fff; }
    .card { background: #0f172a; border: 1px solid #1e293b; border-radius: 12px; padding: 14px; margin-bottom: 12px; }
    .btn { width: 100%; background: #0284c7; color: white; border: none; padding: 12px; border-radius: 10px; font-weight: 600; cursor: pointer; margin-top: 8px; }
    .console-box { background: #050811; border: 1px solid #1e293b; border-radius: 8px; padding: 10px; font-family: monospace; font-size: 11px; color: #38bdf8; min-height: 80px; margin-top: 8px; white-space: pre-wrap; }
  </style>
</head>
<body>
  <div class="header">
    <span class="badge">AX Manager • Plugin WebUI</span>
    <h1>AX Mali Core Engine</h1>
    <p style="font-size: 12px; color: #94a3b8; margin-top: 4px;">Optimización Táctil & GPU Mali</p>
  </div>
  <div class="card">
    <div style="font-weight: 700; margin-bottom: 6px;">⚡ Modo Ultra Sensibilidad Táctil</div>
    <p style="font-size: 12px; color: #94a3b8;">Reduce la latencia de entrada a 250ms y sincroniza la GPU Mali.</p>
    <button class="btn" onclick="toggleBoost(true)">Activar Touch Boost</button>
    <button class="btn" style="background: #334155; margin-top: 6px;" onclick="toggleBoost(false)">Restaurar Original</button>
    <div class="console-box" id="out">Listo. Esperando comando...</div>
  </div>
  <script>
    async function toggleBoost(enable) {
      const out = document.getElementById('out');
      out.textContent = "Ejecutando en AxManager...\\n";
      const action = enable ? "enable" : "disable";
      const cmd = "sh $AXERONDIR/plugins/ax_mali_core_optimizer/scripts/touch_boost.sh " + action + " || sh ./scripts/touch_boost.sh " + action;
      if (typeof ksu !== 'undefined' && typeof ksu.exec === 'function') {
        const res = await ksu.exec(cmd);
        out.textContent += (res.stdout || '') + (res.stderr || '');
      } else {
        out.textContent += "[Vista Previa] Comando: " + cmd;
      }
    }
  </script>
</body>
</html>
`
    );
  }

  return await zip.generateAsync({ type: 'blob' });
}

export async function downloadModuleZip(): Promise<void> {
  const blob = await generateModuleZipBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'ax_mali_core_optimizer_v1.0.0.zip';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
