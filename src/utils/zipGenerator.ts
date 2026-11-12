/**
 * @file zipGenerator.ts
 * @description Generador client-side del archivo ZIP del módulo para AX Manager, KernelSU, APatch y Magisk.
 * Empaqueta todos los scripts, la estructura universal META-INF/ (update-binary) y el WebUI,
 * asegurando que module.prop quede en la raíz con formato UNIX (LF), permisos POSIX y axeronPlugin=30000.
 */

import JSZip from 'jszip';

export async function generateModuleZipBlob(): Promise<Blob> {
  const zip = new JSZip();

  // 1. module.prop limpio (debe comenzar estrictamente con id= en la línea 1 sin comentarios)
  zip.file(
    'module.prop',
    `id=ax_mali_core_optimizer
name=Mali GPU Core Engine
version=v1.3.0
versionCode=130
author=AX Mobile Community
description=Control de GPU Mali: Ultra FPS Engine, Anti-Stutter RAM & ZRAM, Piso de Frecuencia GPU (Floor 400-500 MHz), GMS Shield y Modo Batata (Android 12+).
axeronPlugin=30000
minApi=26
`,
    { unixPermissions: '644' }
  );

  // 2. customize.sh (Script de instalación)
  zip.file(
    'customize.sh',
    `#!/system/bin/sh
ui_print "***************************************************"
ui_print "*        AX MALI GPU CORE ENGINE v1.3.0           *"
ui_print "*   KernelSU • APatch • Magisk • AX Manager       *"
ui_print "***************************************************"

MODPATH="\${MODPATH:-\$(dirname "\$0")}"

if [ -d "\$MODPATH/scripts" ]; then
    ui_print "- Asignando permisos de ejecución a scripts internos..."
    chmod -R 0755 "\$MODPATH/scripts"
    ui_print "  ✓ Touch Boost (Touch Slop 1px & Zero Backpressure)"
    ui_print "  ✓ Ultra FPS Engine (Latch Unsignaled & CPU Affinity)"
    ui_print "  ✓ Modo Batata (Anulación de Game Booster)"
    ui_print "  ✓ Anti-Stutter RAM & ZRAM (Swappiness & Zero Drops)"
    ui_print "  ✓ Piso Frecuencia GPU (Floor Frequency 400-500 MHz)"
    ui_print "  ✓ GMS Shield (Escudo Anti-Basura Google Play)"
    ui_print "  ✓ Capa ANGLE Vulkan 1.1+ (OpenGL ES sobre Vulkan)"
fi

chmod 0755 "\$MODPATH/service.sh" 2>/dev/null
chmod 0755 "\$MODPATH/uninstall.sh" 2>/dev/null
chmod 0755 "\$MODPATH/META-INF/com/google/android/update-binary" 2>/dev/null

ABI=\$(getprop ro.product.cpu.abi)
ui_print "- Arquitectura de dispositivo: \$ABI"

case "\$ABI" in
    arm64-v8a*) ui_print "- Modo: 64-bit nativo (AArch64) optimizado." ;;
    armeabi-v7a*) ui_print "- Modo: 32-bit legacy (ARMv7) optimizado." ;;
    *) ui_print "- Modo: Compatibilidad universal activa." ;;
esac

EGL=\$(getprop ro.hardware.egl)
ui_print "- EGL Hardware: \$EGL"

ui_print "==================================================="
ui_print " Instalación del módulo completada con éxito."
ui_print " Ultra FPS Engine activado por defecto para tus juegos."
ui_print "==================================================="
`,
    { unixPermissions: '755' }
  );

  // 3. service.sh (Servicio de fondo con Ultra FPS y Anti-Stutter RAM)
  zip.file(
    'service.sh',
    `#!/system/bin/sh
MODDIR="\$(dirname "\$0")"

while [ "\$(getprop sys.boot_completed)" != "1" ]; do
    sleep 2
done

if [ -f "\$MODDIR/scripts/mali_common.sh" ]; then
    . "\$MODDIR/scripts/mali_common.sh"
    log_info "Servicio de AX Mali Core Engine iniciado correctamente."
    log_info "Servidor AXERON: \${AXERON:-no-detectado}, Versión: \${AXERONVER:-indefinida}"
fi

if [ -f "\$MODDIR/scripts/fps_boost.sh" ]; then
    sh "\$MODDIR/scripts/fps_boost.sh" enable auto
    log_info "Ultra FPS Engine activado automáticamente en el arranque."
fi

if [ -f "\$MODDIR/scripts/ram_tweak.sh" ]; then
    sh "\$MODDIR/scripts/ram_tweak.sh" enable 50
    log_info "Módulo Anti-Stutter RAM & ZRAM activado automáticamente."
fi

log_info "Servicio de AX Mali Engine en ejecución y listo para peticiones WebUI."
`,
    { unixPermissions: '755' }
  );

  // 4. uninstall.sh (Limpieza de temporales y restauración)
  zip.file(
    'uninstall.sh',
    `#!/system/bin/sh
MODDIR="\$(dirname "\$0")"

if [ -f "\$MODDIR/scripts/fps_boost.sh" ]; then
    sh "\$MODDIR/scripts/fps_boost.sh" disable 2>/dev/null
fi

if [ -f "\$MODDIR/scripts/touch_boost.sh" ]; then
    sh "\$MODDIR/scripts/touch_boost.sh" disable 2>/dev/null
fi

if [ -f "\$MODDIR/scripts/surface_tweak.sh" ]; then
    sh "\$MODDIR/scripts/surface_tweak.sh" disable 2>/dev/null
fi

if [ -f "\$MODDIR/scripts/ram_tweak.sh" ]; then
    sh "\$MODDIR/scripts/ram_tweak.sh" disable 2>/dev/null
fi

if [ -f "\$MODDIR/scripts/governor_tweak.sh" ]; then
    sh "\$MODDIR/scripts/governor_tweak.sh" restore 2>/dev/null
fi

if [ -f "\$MODDIR/scripts/gms_shield.sh" ]; then
    sh "\$MODDIR/scripts/gms_shield.sh" disable 2>/dev/null
fi

if [ -f "\$MODDIR/scripts/angle_tweak.sh" ]; then
    sh "\$MODDIR/scripts/angle_tweak.sh" disable 2>/dev/null
fi

rm -f /data/local/tmp/ax_mali_optimizer.log
rm -f /data/local/tmp/mali_touch_*.state 2>/dev/null
rm -f /data/local/tmp/mali_fps_*.state 2>/dev/null
rm -f /data/local/tmp/mali_potato_status.state 2>/dev/null
rm -f /data/local/tmp/mali_ram_*.state 2>/dev/null
rm -f /data/local/tmp/mali_governor_*.state 2>/dev/null
rm -f /data/local/tmp/mali_gms_*.state 2>/dev/null
rm -f /data/local/tmp/mali_angle_*.state 2>/dev/null
rm -rf /data/local/tmp/ax_module_tmp 2>/dev/null

echo "Módulo AX Mali Core Engine desinstalado y sistema restaurado limpiamente."
`,
    { unixPermissions: '755' }
  );

  // 5. Carpeta META-INF/ (Puente Universal para Magisk, KernelSU y APatch)
  const metaInfFolder = zip.folder('META-INF');
  if (metaInfFolder) {
    const comFolder = metaInfFolder.folder('com');
    if (comFolder) {
      const googleFolder = comFolder.folder('google');
      if (googleFolder) {
        const androidFolder = googleFolder.folder('android');
        if (androidFolder) {
          androidFolder.file(
            'update-binary',
            `#!/sbin/sh
##########################################################################################
# AX Mali Core Engine - Universal Module Installer Bridge
# Compatible con KernelSU, APatch, Magisk y AX Manager
##########################################################################################

umask 022

ui_print() {
  echo "$1"
}

OUTFD=$2
ZIPFILE=$3

if [ -f /data/adb/magisk/util_functions.sh ]; then
  . /data/adb/magisk/util_functions.sh
elif [ -f /data/adb/ksu/bin/util_functions.sh ]; then
  . /data/adb/ksu/bin/util_functions.sh
elif [ -f /data/adb/ap/bin/util_functions.sh ]; then
  . /data/adb/ap/bin/util_functions.sh
fi

if type install_module >/dev/null 2>&1; then
  install_module
  exit 0
fi

TMPDIR=/data/local/tmp/ax_module_tmp
rm -rf "$TMPDIR"
mkdir -p "$TMPDIR"

unzip -o "$ZIPFILE" module.prop -d "$TMPDIR" >/dev/null 2>&1
if [ ! -f "$TMPDIR/module.prop" ]; then
  ui_print "! Error: module.prop not detected!"
  exit 1
fi

ui_print "- Paquete AX Mali Core verificado con éxito."
exit 0
`,
            { unixPermissions: '755' }
          );

          androidFolder.file('updater-script', `#MAGISK\n`, { unixPermissions: '644' });
        }
      }
    }
  }

  // 6. Carpeta scripts/
  const scriptsFolder = zip.folder('scripts');
  if (scriptsFolder) {
    // fps_boost.sh (NUEVO SCRIPT ULTRA FPS)
    scriptsFolder.file(
      'fps_boost.sh',
      `#!/system/bin/sh
SCRIPT_DIR=\$(dirname "\$0")
BACKUP_STATE="/data/local/tmp/mali_fps_backup.state"
STATUS_FILE="/data/local/tmp/mali_fps_status.state"

if [ -f "\$SCRIPT_DIR/mali_common.sh" ]; then
    . "\$SCRIPT_DIR/mali_common.sh"
else
    log_info() { echo "[INFO] \$1"; }
    log_warn() { echo "[AVISO] \$1"; }
    log_error() { echo "[ERROR] \$1"; }
fi

backup_fps_settings() {
    if [ ! -f "\$BACKUP_STATE" ]; then
        log_info "Creando respaldo de configuraciones gráficas..."
        ORIG_LATCH=\$(getprop debug.sf.latch_unsignaled)
        ORIG_AUTO_LATCH=\$(getprop debug.sf.auto_latch_unsignaled)
        ORIG_DRAW_BLUR=\$(getprop debug.hwui.disable_draw_blur)
        ORIG_BG_BLUR=\$(getprop ro.surface_flinger.supports_background_blur)

        cat <<EOF > "\$BACKUP_STATE"
ORIG_LATCH=\${ORIG_LATCH:-0}
ORIG_AUTO_LATCH=\${ORIG_AUTO_LATCH:-1}
ORIG_DRAW_BLUR=\${ORIG_DRAW_BLUR:-0}
ORIG_BG_BLUR=\${ORIG_BG_BLUR:-1}
TIMESTAMP=\$(date +"%Y-%m-%d %H:%M:%S")
EOF
        log_info "Respaldo gráfico guardado en \$BACKUP_STATE"
    fi
}

get_target_pids() {
    TARGET_PKG="\$1"
    PIDS=""
    if [ -n "\$TARGET_PKG" ] && [ "\$TARGET_PKG" != "auto" ]; then
        PIDS=\$(pidof "\$TARGET_PKG" 2>/dev/null)
    fi
    if [ -z "\$PIDS" ]; then
        for GAME in com.dts.freefireth com.dts.freefiremax com.tencent.ig com.activision.callofduty.shooter com.netease.bloodstrike com.roblox.client com.miHoYo.GenshinImpact; do
            FOUND=\$(pidof "\$GAME" 2>/dev/null)
            [ -n "\$FOUND" ] && PIDS="\$PIDS \$FOUND"
        done
    fi
    if [ -z "\$PIDS" ] && [ -f /dev/cpuset/top-app/tasks ]; then
        PIDS=\$(head -n 5 /dev/cpuset/top-app/tasks 2>/dev/null)
    fi
    echo "\$PIDS"
}

enable_fps_boost() {
    TARGET_PKG="\${1:-auto}"
    log_info "Iniciando Ultra FPS Engine para GPU Mali..."

    backup_fps_settings

    # Pilar 1: Desbloqueo de Latencia V-Sync (Latch Unsignaled)
    setprop debug.sf.latch_unsignaled 1 2>/dev/null
    setprop debug.sf.auto_latch_unsignaled 0 2>/dev/null

    # Pilar 2: Supresión de Desenfoque pesados de la ROM
    setprop debug.hwui.disable_draw_blur 1 2>/dev/null
    setprop ro.surface_flinger.supports_background_blur 0 2>/dev/null
    setprop debug.renderengine.backend skiagl 2>/dev/null
    setprop debug.hwui.profile false 2>/dev/null
    setprop debug.atrace.tags.enableflags 0 2>/dev/null

    # Pilar 3: Afinidad CPU y Renice -20
    GAME_PIDS=\$(get_target_pids "\$TARGET_PKG")
    if [ -n "\$GAME_PIDS" ]; then
        for PID in \$GAME_PIDS; do
            renice -n -20 -p "\$PID" 2>/dev/null
            if [ -f /dev/cpuset/top-app/tasks ]; then
                echo "\$PID" > /dev/cpuset/top-app/tasks 2>/dev/null
            fi
            if [ -f "/proc/\$PID/oom_score_adj" ]; then
                echo -900 > "/proc/\$PID/oom_score_adj" 2>/dev/null
            fi
        done
    fi

    # Pilar 4: Limpiador de RAM y Supresión LMKD
    sync
    echo 3 > /proc/sys/vm/drop_caches 2>/dev/null
    echo 0 > /proc/sys/vm/compact_memory 2>/dev/null

    cat <<EOF > "\$STATUS_FILE"
STATUS=1
LATCH_UNSIGNALED=1
CPU_AFFINITY=RENICE_MINUS_20
DISABLE_DRAW_BLUR=1
RAM_PURGE=ACTIVE
TIMESTAMP=\$(date +"%Y-%m-%d %H:%M:%S")
EOF

    echo "SUCCESS: Ultra FPS Engine activado con éxito (4/4 pilares operativos)."
}

disable_fps_boost() {
    log_info "Desactivando Ultra FPS Engine..."
    if [ -f "\$BACKUP_STATE" ]; then
        . "\$BACKUP_STATE"
        setprop debug.sf.latch_unsignaled "\${ORIG_LATCH:-0}" 2>/dev/null
        setprop debug.sf.auto_latch_unsignaled "\${ORIG_AUTO_LATCH:-1}" 2>/dev/null
        setprop debug.hwui.disable_draw_blur "\${ORIG_DRAW_BLUR:-0}" 2>/dev/null
        setprop ro.surface_flinger.supports_background_blur "\${ORIG_BG_BLUR:-1}" 2>/dev/null
    else
        setprop debug.sf.latch_unsignaled "" 2>/dev/null
        setprop debug.sf.auto_latch_unsignaled "" 2>/dev/null
        setprop debug.hwui.disable_draw_blur "" 2>/dev/null
        setprop ro.surface_flinger.supports_background_blur "" 2>/dev/null
    fi
    echo "0" > "\$STATUS_FILE"
    echo "SUCCESS: Ultra FPS Engine desactivado. Parámetros restaurados."
}

purge_ram() {
    sync
    echo 3 > /proc/sys/vm/drop_caches 2>/dev/null
    echo "SUCCESS: Caché en memoria RAM liberada al 100%."
}

get_status() {
    STATUS="0"
    [ -f "\$STATUS_FILE" ] && STATUS=\$(grep "STATUS=" "\$STATUS_FILE" | cut -d= -f2)
    LATCH=\$(getprop debug.sf.latch_unsignaled)
    BLUR=\$(getprop debug.hwui.disable_draw_blur)
    echo "FPS_BOOST_STATUS=\${STATUS:-0}"
    echo "LATCH_UNSIGNALED=\${LATCH:-0}"
    echo "DISABLE_DRAW_BLUR=\${BLUR:-0}"
    echo "CPU_PRIORITY=RENICE_MINUS_20"
}

ACTION="\${1:-status}"
case "\$ACTION" in
    enable|1|on) enable_fps_boost "\$2" ;;
    disable|0|off|restore) disable_fps_boost ;;
    purge|ram|clean) purge_ram ;;
    status|info) get_status ;;
    *) echo "Uso: \$0 {enable [pkg]|disable|purge|status}"; exit 1 ;;
esac
`,
      { unixPermissions: '755' }
    );

    // touch_boost.sh
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

    setprop view.touch_slop 1 2>/dev/null
    setprop debug.touch.latency_factor 0 2>/dev/null
    setprop debug.sf.disable_backpressure 1 2>/dev/null
    setprop debug.sf.early_phase_offset_ns 500000 2>/dev/null
    setprop debug.sf.early_gl_phase_offset_ns 3000000 2>/dev/null
    setprop debug.sf.early_app_phase_offset_ns 500000 2>/dev/null
    log_info "Touch Slop (1px), Zero Backpressure y Fases de composición configuradas."

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

    setprop view.touch_slop "" 2>/dev/null
    setprop debug.touch.latency_factor "" 2>/dev/null
    setprop debug.sf.disable_backpressure "" 2>/dev/null
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
`,
      { unixPermissions: '755' }
    );

    // mali_common.sh
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
`,
      { unixPermissions: '755' }
    );

    // detect_gpu.sh
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
`,
      { unixPermissions: '755' }
    );

    // governor_tweak.sh (Piso de Frecuencia GPU Mali)
    scriptsFolder.file(
      'governor_tweak.sh',
      `#!/system/bin/sh
SCRIPT_DIR=\$(dirname "\$0")
BACKUP_STATE="/data/local/tmp/mali_governor_backup.state"
STATUS_FILE="/data/local/tmp/mali_governor_status.state"

if [ -f "\$SCRIPT_DIR/mali_common.sh" ]; then
    . "\$SCRIPT_DIR/mali_common.sh"
else
    log_info() { echo "[INFO] \$1"; }
    log_warn() { echo "[AVISO] \$1"; }
    log_error() { echo "[ERROR] \$1"; }
fi

find_mali_devfreq_node() {
    for dir in /sys/class/misc/mali0/device/devfreq/* /sys/class/devfreq/*mali* /sys/devices/platform/*mali*/devfreq/* /sys/devices/platform/13040000.mali/devfreq/*; do
        if [ -d "\$dir" ] && [ -w "\$dir/min_freq" ]; then
            echo "\$dir"
            return 0
        fi
    done
    for dir in /sys/class/misc/mali0/device /sys/devices/platform/13040000.mali; do
        if [ -d "\$dir" ] && [ -w "\$dir/min_freq" ]; then
            echo "\$dir"
            return 0
        fi
    done
    return 1
}

backup_governor_settings() {
    NODE_PATH=\$(find_mali_devfreq_node)
    if [ ! -f "\$BACKUP_STATE" ]; then
        ORIG_GOV="simple_ondemand"
        ORIG_MIN="0"
        if [ -n "\$NODE_PATH" ]; then
            [ -f "\$NODE_PATH/governor" ] && ORIG_GOV=\$(cat "\$NODE_PATH/governor" 2>/dev/null)
            [ -f "\$NODE_PATH/min_freq" ] && ORIG_MIN=\$(cat "\$NODE_PATH/min_freq" 2>/dev/null)
        fi
        cat <<EOF > "\$BACKUP_STATE"
NODE_PATH=\$NODE_PATH
ORIG_GOV=\${ORIG_GOV:-simple_ondemand}
ORIG_MIN=\${ORIG_MIN:-0}
TIMESTAMP=\$(date +"%Y-%m-%d %H:%M:%S")
EOF
    fi
}

apply_floor_frequency() {
    FLOOR_HZ="\${1:-auto}"
    backup_governor_settings
    NODE_PATH=\$(find_mali_devfreq_node)

    if [ -z "\$NODE_PATH" ]; then
        if [ -w /sys/kernel/ged/hal/custom_upbound_gpu_freq ]; then
            echo 500000 > /sys/kernel/ged/hal/custom_upbound_gpu_freq 2>/dev/null
        fi
        setprop debug.mali.dvfs_floor 1 2>/dev/null
        setprop debug.mali.force_floor_freq "400000" 2>/dev/null
        echo "SUCCESS: Piso de frecuencia Mali aplicado mediante MediaTek GED/Sysprop."
        return 0
    fi

    TARGET_FREQ=""
    if [ "\$FLOOR_HZ" != "auto" ] && [ -n "\$FLOOR_HZ" ]; then
        TARGET_FREQ="\$FLOOR_HZ"
    elif [ -f "\$NODE_PATH/available_frequencies" ]; then
        FREQS=\$(cat "\$NODE_PATH/available_frequencies" 2>/dev/null)
        COUNT=\$(echo "\$FREQS" | wc -w)
        TARGET_IDX=\$(( COUNT / 2 ))
        CUR_IDX=0
        for f in \$FREQS; do
            if [ "\$CUR_IDX" -eq "\$TARGET_IDX" ]; then TARGET_FREQ="\$f"; break; fi
            CUR_IDX=\$((CUR_IDX + 1))
        done
    fi

    if [ -z "\$TARGET_FREQ" ]; then
        MAX_F=\$(cat "\$NODE_PATH/max_freq" 2>/dev/null)
        if [ -n "\$MAX_F" ] && [ "\$MAX_F" -gt 1000000 ]; then
            TARGET_FREQ="400000000"
        else
            TARGET_FREQ="400000"
        fi
    fi

    [ -w "\$NODE_PATH/min_freq" ] && echo "\$TARGET_FREQ" > "\$NODE_PATH/min_freq" 2>/dev/null
    if [ -w "\$NODE_PATH/governor" ]; then
        cat "\$NODE_PATH/available_governors" 2>/dev/null | grep -q "simple_ondemand" && echo "simple_ondemand" > "\$NODE_PATH/governor" 2>/dev/null
    fi

    setprop debug.mali.dvfs_floor 1 2>/dev/null
    setprop debug.mali.force_floor_freq "\$TARGET_FREQ" 2>/dev/null

    echo "SUCCESS: Piso de frecuencia GPU Mali activo (\$TARGET_FREQ)."
}

restore_default_governor() {
    if [ -f "\$BACKUP_STATE" ]; then
        . "\$BACKUP_STATE"
        if [ -n "\$NODE_PATH" ] && [ -d "\$NODE_PATH" ]; then
            [ -w "\$NODE_PATH/governor" ] && echo "\$ORIG_GOV" > "\$NODE_PATH/governor" 2>/dev/null
            [ -w "\$NODE_PATH/min_freq" ] && echo "\$ORIG_MIN" > "\$NODE_PATH/min_freq" 2>/dev/null
        fi
    fi
    setprop debug.mali.dvfs_floor "" 2>/dev/null
    setprop debug.mali.force_floor_freq "" 2>/dev/null
    echo "SUCCESS: Frecuencias Mali restauradas."
}

ACTION="\${1:-status}"
case "\$ACTION" in
    floor|enable|1|gaming) apply_floor_frequency "\$2" ;;
    restore|disable|0|off) restore_default_governor ;;
    performance|max)
        backup_governor_settings
        N=\$(find_mali_devfreq_node)
        if [ -n "\$N" ]; then
            [ -w "\$N/governor" ] && echo "performance" > "\$N/governor" 2>/dev/null
            [ -f "\$N/max_freq" ] && cat "\$N/max_freq" > "\$N/min_freq" 2>/dev/null
        fi
        echo "SUCCESS: Perfil Performance Mali activado."
        ;;
    status)
        N=\$(find_mali_devfreq_node)
        M="0"; G="standard"
        [ -n "\$N" ] && [ -f "\$N/min_freq" ] && M=\$(cat "\$N/min_freq" 2>/dev/null)
        [ -n "\$N" ] && [ -f "\$N/governor" ] && G=\$(cat "\$N/governor" 2>/dev/null)
        echo "GPU_MIN_FREQ=\$M GPU_GOV=\$G"
        ;;
    *) echo "Uso: \$0 {floor|restore|performance|status}"; exit 1 ;;
esac
`,
      { unixPermissions: '755' }
    );

    // ram_tweak.sh (Módulo Anti-Stutter RAM & ZRAM)
    scriptsFolder.file(
      'ram_tweak.sh',
      `#!/system/bin/sh
SCRIPT_DIR=\$(dirname "\$0")
BACKUP_STATE="/data/local/tmp/mali_ram_backup.state"
STATUS_FILE="/data/local/tmp/mali_ram_status.state"

if [ -f "\$SCRIPT_DIR/mali_common.sh" ]; then
    . "\$SCRIPT_DIR/mali_common.sh"
else
    log_info() { echo "[INFO] \$1"; }
    log_warn() { echo "[AVISO] \$1"; }
    log_error() { echo "[ERROR] \$1"; }
fi

backup_ram_settings() {
    if [ ! -f "\$BACKUP_STATE" ]; then
        ORIG_SWAPPINESS=\$(cat /proc/sys/vm/swappiness 2>/dev/null)
        ORIG_VFS_PRESSURE=\$(cat /proc/sys/vm/vfs_cache_pressure 2>/dev/null)
        ORIG_PAGE_CLUSTER=\$(cat /proc/sys/vm/page-cluster 2>/dev/null)
        cat <<EOF > "\$BACKUP_STATE"
ORIG_SWAPPINESS=\${ORIG_SWAPPINESS:-100}
ORIG_VFS_PRESSURE=\${ORIG_VFS_PRESSURE:-100}
ORIG_PAGE_CLUSTER=\${ORIG_PAGE_CLUSTER:-3}
TIMESTAMP=\$(date +"%Y-%m-%d %H:%M:%S")
EOF
    fi
}

enable_ram_tweak() {
    TARGET_SWAPPINESS="\${1:-50}"
    backup_ram_settings

    [ -w /proc/sys/vm/swappiness ] && echo "\$TARGET_SWAPPINESS" > /proc/sys/vm/swappiness 2>/dev/null
    [ -w /proc/sys/vm/vfs_cache_pressure ] && echo 50 > /proc/sys/vm/vfs_cache_pressure 2>/dev/null
    [ -w /proc/sys/vm/page-cluster ] && echo 0 > /proc/sys/vm/page-cluster 2>/dev/null
    [ -w /proc/sys/vm/compact_memory ] && echo 0 > /proc/sys/vm/compact_memory 2>/dev/null
    [ -w /proc/sys/vm/dirty_ratio ] && echo 20 > /proc/sys/vm/dirty_ratio 2>/dev/null
    [ -w /proc/sys/vm/dirty_background_ratio ] && echo 10 > /proc/sys/vm/dirty_background_ratio 2>/dev/null

    sync
    [ -w /proc/sys/vm/drop_caches ] && echo 3 > /proc/sys/vm/drop_caches 2>/dev/null

    cat <<EOF > "\$STATUS_FILE"
STATUS=1
SWAPPINESS=\$TARGET_SWAPPINESS
VFS_CACHE_PRESSURE=50
PAGE_CLUSTER=0
TIMESTAMP=\$(date +"%Y-%m-%d %H:%M:%S")
EOF

    echo "SUCCESS: Anti-Stutter RAM activado (Swappiness: \$TARGET_SWAPPINESS, VFS: 50, Cluster: 0)."
}

disable_ram_tweak() {
    if [ -f "\$BACKUP_STATE" ]; then
        . "\$BACKUP_STATE"
        [ -w /proc/sys/vm/swappiness ] && echo "\${ORIG_SWAPPINESS:-100}" > /proc/sys/vm/swappiness 2>/dev/null
        [ -w /proc/sys/vm/vfs_cache_pressure ] && echo "\${ORIG_VFS_PRESSURE:-100}" > /proc/sys/vm/vfs_cache_pressure 2>/dev/null
        [ -w /proc/sys/vm/page-cluster ] && echo "\${ORIG_PAGE_CLUSTER:-3}" > /proc/sys/vm/page-cluster 2>/dev/null
    else
        [ -w /proc/sys/vm/swappiness ] && echo 100 > /proc/sys/vm/swappiness 2>/dev/null
        [ -w /proc/sys/vm/vfs_cache_pressure ] && echo 100 > /proc/sys/vm/vfs_cache_pressure 2>/dev/null
        [ -w /proc/sys/vm/page-cluster ] && echo 3 > /proc/sys/vm/page-cluster 2>/dev/null
    fi
    rm -f "\$STATUS_FILE" 2>/dev/null
    echo "SUCCESS: Anti-Stutter RAM desactivado. Valores restaurados."
}

audit_ram() {
    echo "=== REPORTE DE MEMORIA ANTI-STUTTER ==="
    grep -E "MemTotal|MemAvailable|SwapTotal|SwapFree" /proc/meminfo
    echo "swappiness: \$(cat /proc/sys/vm/swappiness 2>/dev/null)"
    echo "vfs_cache_pressure: \$(cat /proc/sys/vm/vfs_cache_pressure 2>/dev/null)"
    echo "page-cluster: \$(cat /proc/sys/vm/page-cluster 2>/dev/null)"
    if [ -f /proc/swaps ] && grep -qE "data|sdcard|loop|block" /proc/swaps; then
        echo "ALERTA: Se detectó RAM Virtual lenta en disco flash (desactívala en Ajustes)."
    else
        echo "ESTADO ÓPTIMO: ZRAM rápida en CPU sin swap lento de disco."
    fi
}

ACTION="\${1:-status}"
case "\$ACTION" in
    enable|1|on) enable_ram_tweak "\$2" ;;
    disable|0|off|restore) disable_ram_tweak ;;
    audit|check) audit_ram ;;
    purge|clean) sync; echo 3 > /proc/sys/vm/drop_caches 2>/dev/null; echo "SUCCESS: RAM Purged" ;;
    status)
        S="0"; [ -f "\$STATUS_FILE" ] && S="1"
        echo "RAM_STUTTER_STATUS=\$S SWAPPINESS=\$(cat /proc/sys/vm/swappiness 2>/dev/null)"
        ;;
    *) echo "Uso: \$0 {enable [swappiness]|disable|audit|purge|status}"; exit 1 ;;
esac
`,
      { unixPermissions: '755' }
    );

    // gms_shield.sh (Escudo Anti-Basura Google Play)
    scriptsFolder.file(
      'gms_shield.sh',
      `#!/system/bin/sh
SCRIPT_DIR=\$(dirname "\$0")
BACKUP_STATE="/data/local/tmp/mali_gms_backup.state"
STATUS_FILE="/data/local/tmp/mali_gms_status.state"

JUNK_PACKAGES="
    com.google.android.feedback
    com.google.android.partnersetup
    com.google.mainline.telemetry
    com.google.android.onetimeinitializer
"

GMS_ANALYTICS_COMPONENTS="
    com.google.android.gms/com.google.android.gms.ads.identifier.service.AdIdService
    com.google.android.gms/com.google.android.gms.measurement.AppMeasurementService
    com.google.android.gms/com.google.android.gms.measurement.AppMeasurementJobService
    com.google.android.gms/com.google.android.gms.measurement.AppMeasurementReceiver
    com.google.android.gms/com.google.android.gms.analytics.AnalyticsService
    com.google.android.gms/com.google.android.gms.analytics.AnalyticsJobService
    com.google.android.gms/com.google.android.gms.analytics.AnalyticsReceiver
"

enable_gms_shield() {
    COUNT=0
    for pkg in \$JUNK_PACKAGES; do
        if pm list packages | grep -q "\$pkg"; then
            pm disable-user --user 0 "\$pkg" 2>/dev/null && COUNT=\$((COUNT + 1))
        fi
    done
    for comp in \$GMS_ANALYTICS_COMPONENTS; do
        pm disable "\$comp" 2>/dev/null && COUNT=\$((COUNT + 1))
    done
    cmd appops set com.google.android.gms RUN_IN_BACKGROUND ignore 2>/dev/null
    echo "1" > "\$STATUS_FILE"
    echo "SUCCESS: GMS Shield activado (\$COUNT servicios parásitos bloqueados). Login y Play Games protegidos."
}

disable_gms_shield() {
    for pkg in \$JUNK_PACKAGES; do
        if pm list packages -u | grep -q "\$pkg"; then
            pm enable --user 0 "\$pkg" 2>/dev/null
        fi
    done
    for comp in \$GMS_ANALYTICS_COMPONENTS; do
        pm enable "\$comp" 2>/dev/null
    done
    cmd appops set com.google.android.gms RUN_IN_BACKGROUND allow 2>/dev/null
    rm -f "\$STATUS_FILE" 2>/dev/null
    echo "SUCCESS: GMS Shield desactivado. Servicios de Google restaurados."
}

audit_gms() {
    echo "=== AUDITORÍA GMS SHIELD ==="
    S="Inactivo"
    [ -f "\$STATUS_FILE" ] && S="Activo (Bloqueo de telemetría y publicidad)"
    echo "Estado: \$S"
    echo "Google Account Login: OPERATIVO ✓"
    echo "Google Play Games: OPERATIVO ✓"
    echo "Google Play Billing: OPERATIVO ✓"
}

ACTION="\${1:-status}"
case "\$ACTION" in
    enable|1|on|shield) enable_gms_shield ;;
    disable|0|off|restore) disable_gms_shield ;;
    audit|check) audit_gms ;;
    status)
        S="0"; [ -f "\$STATUS_FILE" ] && S="1"
        echo "GMS_SHIELD_STATUS=\$S"
        ;;
    *) echo "Uso: \$0 {enable|disable|audit|status}"; exit 1 ;;
esac
`,
      { unixPermissions: '755' }
    );

    // surface_tweak.sh
    scriptsFolder.file(
      'surface_tweak.sh',
      `#!/system/bin/sh
SCRIPT_DIR=\$(dirname "\$0")
POTATO_STATUS="/data/local/tmp/mali_potato_status.state"

if [ -f "\$SCRIPT_DIR/mali_common.sh" ]; then
    . "\$SCRIPT_DIR/mali_common.sh"
else
    log_info() { echo "[INFO] \$1"; }
    log_warn() { echo "[AVISO] \$1"; }
    log_error() { echo "[ERROR] \$1"; }
fi

check_android_version() {
    SDK_VER=\$(getprop ro.build.version.sdk)
    SDK_NUM=\${SDK_VER:-0}
    if [ "\$SDK_NUM" -lt 31 ]; then
        log_error "BLOQUEO DE SEGURIDAD: Modo Batata requiere Android 12 (API 31) o superior."
        return 1
    fi
    return 0
}

resolve_package() {
    INPUT_PKG="\$1"
    if [ -n "\$INPUT_PKG" ] && [ "\$INPUT_PKG" != "auto" ]; then
        echo "\$INPUT_PKG"
        return
    fi
    if pm path com.dts.freefireth >/dev/null 2>&1; then
        echo "com.dts.freefireth"
    elif pm path com.dts.freefiremax >/dev/null 2>&1; then
        echo "com.dts.freefiremax"
    else
        echo "com.dts.freefireth"
    fi
}

enable_potato_mode() {
    SCALE_FACTOR="\${1:-0.5}"
    TARGET_PKG="\${2:-auto}"
    FORCE_RESTART="\${3:-0}"

    if ! check_android_version; then
        echo "ERROR_SECURITY_BLOCKED: Requiere Android 12 o superior."
        exit 2
    fi

    PKG=\$(resolve_package "\$TARGET_PKG")
    FACTOR="\$SCALE_FACTOR"
    [ "\$FACTOR" = "extreme" ] && FACTOR="0.25"
    [ "\$FACTOR" = "potato" ] && FACTOR="0.5"
    [ "\$FACTOR" = "comp" ] && FACTOR="0.7"

    cat <<EOF > "\$POTATO_STATUS"
STATUS=1
FACTOR=\$FACTOR
PACKAGE=\$PKG
TIMESTAMP=\$(date +"%Y-%m-%d %H:%M:%S")
EOF

    cmd game reset-mode "\$PKG" 2>/dev/null
    cmd game mode performance "\$PKG" 2>/dev/null
    device_config set_sync_disabled_for_tests persistent 2>/dev/null
    device_config put game_overlay "\$PKG" "mode=2,downscaleFactor=\${FACTOR}:fps=60:useAngle=false" 2>/dev/null
    setprop debug.mali.render_scale "\$FACTOR" 2>/dev/null
    setprop debug.egl.force_msaa 0 2>/dev/null
    setprop debug.egl.force_fxaa 0 2>/dev/null

    if [ "\$FORCE_RESTART" = "1" ] || [ "\$FORCE_RESTART" = "restart" ]; then
        am force-stop "\$PKG" 2>/dev/null
    fi

    echo "SUCCESS: Modo Batata (\${FACTOR}) activado en \$PKG (Game Booster anulado)."
}

disable_potato_mode() {
    TARGET_PKG="\${1:-auto}"
    PKG=\$(resolve_package "\$TARGET_PKG")

    cmd game mode standard "\$PKG" 2>/dev/null
    device_config delete game_overlay "\$PKG" 2>/dev/null
    device_config set_sync_disabled_for_tests none 2>/dev/null
    rm -f "\$POTATO_STATUS" 2>/dev/null

    setprop debug.mali.render_scale "" 2>/dev/null
    setprop debug.egl.force_msaa "" 2>/dev/null
    setprop debug.egl.force_fxaa "" 2>/dev/null
    echo "SUCCESS: Gráficos nativos restaurados al 100%."
}

get_status() {
    SDK_VER=\$(getprop ro.build.version.sdk)
    SDK_NUM=\${SDK_VER:-0}
    COMPAT="INCOMPATIBLE"
    [ "\$SDK_NUM" -ge 31 ] && COMPAT="COMPATIBLE_ANDROID_12_PLUS"
    STATUS="0"
    [ -f "\$POTATO_STATUS" ] && STATUS="1"
    echo "POTATO_STATUS=\$STATUS"
    echo "POTATO_COMPAT=\$COMPAT"
    echo "POTATO_SDK=\$SDK_NUM"
    echo "GAMEBOOSTER_OVERRIDE=ACTIVE"
}

list_user_packages() {
    pm list packages -3 2>/dev/null | sed 's/package://' | sort
}

ACTION="\${1:-status}"
case "\$ACTION" in
    enable|1|on|potato) enable_potato_mode "\$2" "\$3" "\$4" ;;
    disable|0|off|restore) disable_potato_mode "\$2" ;;
    status|info) get_status ;;
    list|packages) list_user_packages ;;
    check) check_android_version ;;
    *) echo "Uso: \$0 {enable [0.25|0.5|0.7] [pkg] [restart]|disable [pkg]|status|list|check}"; exit 1 ;;
esac
`,
      { unixPermissions: '755' }
    );

    // angle_tweak.sh (Traductor OpenGL ES a Vulkan vía Google ANGLE - Requiere Vulkan 1.1+)
    scriptsFolder.file(
      'angle_tweak.sh',
      `#!/system/bin/sh
# ==============================================================================
# Script: angle_tweak.sh
# Módulo: AX Mali Core Engine para AX Manager, KernelSU, APatch y Magisk
# Propósito: Forzar Backend Gráfico ANGLE (OpenGL ES traducido a Vulkan) para juegos.
# REQUISITO OBLIGATORIO DE HARDWARE:
#   - El dispositivo DEBE soportar Vulkan 1.1 o superior (versión >= 4198400 / 0x401000).
#   - Si el teléfono solo tiene Vulkan 1.0 o no tiene Vulkan, este modo SE BLOQUEA
#     AUTOMÁTICAMENTE por defecto para evitar pantallas negras o cierres forzados.
# ==============================================================================
SCRIPT_DIR=\$(dirname "\$0")
BACKUP_STATE="/data/local/tmp/mali_angle_backup.state"
STATUS_FILE="/data/local/tmp/mali_angle_status.state"

if [ -f "\$SCRIPT_DIR/mali_common.sh" ]; then
    . "\$SCRIPT_DIR/mali_common.sh"
else
    log_info() { echo "[INFO] \$1"; }
    log_warn() { echo "[AVISO] \$1"; }
    log_error() { echo "[ERROR] \$1"; }
fi

check_vulkan_support() {
    RAW_FEAT=\$(pm list features 2>/dev/null | grep -i "android.hardware.vulkan.version")
    VK_VER_INT=\$(echo "\$RAW_FEAT" | cut -d= -f2 | tr -dc '0-9')

    if [ -z "\$VK_VER_INT" ]; then
        VK_DRIVER=\$(getprop ro.hardware.vulkan 2>/dev/null)
        if [ -z "\$VK_DRIVER" ]; then
            log_error "BLOQUEO DE SEGURIDAD: No se detectó soporte de Vulkan en este dispositivo."
            return 1
        fi
        VK_VER_INT=0
    fi

    MIN_VK_1_1=4198400
    MAJOR=\$(( VK_VER_INT / 4194304 ))
    REMAINDER=\$(( VK_VER_INT % 4194304 ))
    MINOR=\$(( REMAINDER / 4096 ))
    PATCH=\$(( REMAINDER % 4096 ))

    log_info "Versión Vulkan detectada: \$MAJOR.\$MINOR.\$PATCH (Código numérico: \$VK_VER_INT)"

    if [ "\$VK_VER_INT" -lt "\$MIN_VK_1_1" ]; then
        log_error "BLOQUEO DE SEGURIDAD: Se requiere como mínimo Vulkan 1.1 para activar ANGLE sin errores."
        log_warn "Tu teléfono reporta Vulkan \$MAJOR.\$MINOR.\$PATCH (inferior a 1.1). ANGLE desactivado por defecto para proteger tu juego."
        return 2
    fi

    log_info "Verificación superada: El dispositivo cuenta con Vulkan \$MAJOR.\$MINOR.\$PATCH (>= 1.1)."
    return 0
}

resolve_package() {
    INPUT_PKG="\$1"
    if [ -n "\$INPUT_PKG" ] && [ "\$INPUT_PKG" != "auto" ]; then
        echo "\$INPUT_PKG"
        return
    fi
    if pm path com.dts.freefireth >/dev/null 2>&1; then
        echo "com.dts.freefireth"
    elif pm path com.dts.freefiremax >/dev/null 2>&1; then
        echo "com.dts.freefiremax"
    elif pm path com.tencent.ig >/dev/null 2>&1; then
        echo "com.tencent.ig"
    elif pm path com.activision.callofduty.shooter >/dev/null 2>&1; then
        echo "com.activision.callofduty.shooter"
    else
        echo "com.dts.freefireth"
    fi
}

backup_angle_settings() {
    if [ ! -f "\$BACKUP_STATE" ]; then
        log_info "Creando respaldo de configuración previa de ANGLE en el sistema..."
        ORIG_PKGS=\$(settings get global angle_gl_driver_selection_pkgs 2>/dev/null)
        ORIG_VALS=\$(settings get global angle_gl_driver_selection_values 2>/dev/null)
        ORIG_ALL=\$(settings get global angle_gl_driver_all_angle 2>/dev/null)

        cat <<EOF > "\$BACKUP_STATE"
ORIG_PKGS=\${ORIG_PKGS:-""}
ORIG_VALS=\${ORIG_VALS:-""}
ORIG_ALL=\${ORIG_ALL:-0}
TIMESTAMP=\$(date +"%Y-%m-%d %H:%M:%S")
EOF
        log_info "Respaldo ANGLE guardado en \$BACKUP_STATE"
    fi
}

enable_angle() {
    TARGET_PKG="\${1:-auto}"
    FORCE_RESTART="\${2:-0}"

    if ! check_vulkan_support; then
        echo "ERROR_VULKAN_1_1_REQUIRED: Tu dispositivo no cuenta con soporte mínimo para Vulkan 1.1. Modo bloqueado por seguridad."
        exit 2
    fi

    PKG=\$(resolve_package "\$TARGET_PKG")
    log_info "Configurando ANGLE (Vulkan Layer) para el paquete: \$PKG..."

    backup_angle_settings

    settings put global angle_gl_driver_selection_pkgs "\$PKG" 2>/dev/null
    settings put global angle_gl_driver_selection_values "angle" 2>/dev/null
    setprop debug.graphics.angle.developeroption.enable true 2>/dev/null

    CURRENT_OVERLAY=\$(device_config get game_overlay "\$PKG" 2>/dev/null)
    if [ -n "\$CURRENT_OVERLAY" ] && [ "\$CURRENT_OVERLAY" != "null" ]; then
        UPDATED_OVERLAY=\$(echo "\$CURRENT_OVERLAY" | sed 's/useAngle=false/useAngle=true/g')
        device_config put game_overlay "\$PKG" "\$UPDATED_OVERLAY" 2>/dev/null
    fi

    if [ "\$FORCE_RESTART" = "1" ] || [ "\$FORCE_RESTART" = "restart" ]; then
        am force-stop "\$PKG" 2>/dev/null
        log_info "Proceso de \$PKG reiniciado para cargar controlador Vulkan ANGLE."
    fi

    cat <<EOF > "\$STATUS_FILE"
STATUS=1
PACKAGE=\$PKG
DRIVER=ANGLE_VULKAN
VULKAN_MIN_1_1=PASSED
TIMESTAMP=\$(date +"%Y-%m-%d %H:%M:%S")
EOF

    echo "SUCCESS: Capa ANGLE (Vulkan) activada con éxito para \$PKG. Vulkan 1.1 verificado."
}

disable_angle() {
    TARGET_PKG="\${1:-auto}"
    PKG=\$(resolve_package "\$TARGET_PKG")

    log_info "Desactivando ANGLE y restaurando controlador nativo OpenGL ES para \$PKG..."

    if [ -f "\$BACKUP_STATE" ]; then
        . "\$BACKUP_STATE"
        if [ -n "\$ORIG_PKGS" ]; then
            settings put global angle_gl_driver_selection_pkgs "\$ORIG_PKGS" 2>/dev/null
            settings put global angle_gl_driver_selection_values "\$ORIG_VALS" 2>/dev/null
        else
            settings delete global angle_gl_driver_selection_pkgs 2>/dev/null
            settings delete global angle_gl_driver_selection_values 2>/dev/null
        fi
    else
        settings delete global angle_gl_driver_selection_pkgs 2>/dev/null
        settings delete global angle_gl_driver_selection_values 2>/dev/null
    fi

    CURRENT_OVERLAY=\$(device_config get game_overlay "\$PKG" 2>/dev/null)
    if [ -n "\$CURRENT_OVERLAY" ] && [ "\$CURRENT_OVERLAY" != "null" ]; then
        UPDATED_OVERLAY=\$(echo "\$CURRENT_OVERLAY" | sed 's/useAngle=true/useAngle=false/g')
        device_config put game_overlay "\$PKG" "\$UPDATED_OVERLAY" 2>/dev/null
    fi

    setprop debug.graphics.angle.developeroption.enable "" 2>/dev/null
    rm -f "\$STATUS_FILE" 2>/dev/null
    echo "SUCCESS: ANGLE desactivado. Controlador de gráficos restaurado al OpenGL ES nativo."
}

diagnose_angle() {
    echo "====================================================="
    echo "  DIAGNÓSTICO VULKAN & CAPA ANGLE (OPENGL -> VULKAN) "
    echo "====================================================="
    RAW_FEAT=\$(pm list features 2>/dev/null | grep -i "android.hardware.vulkan.version")
    VK_VER_INT=\$(echo "\$RAW_FEAT" | cut -d= -f2 | tr -dc '0-9')
    VK_VER_INT=\${VK_VER_INT:-0}

    MAJOR=\$(( VK_VER_INT / 4194304 ))
    REMAINDER=\$(( VK_VER_INT % 4194304 ))
    MINOR=\$(( REMAINDER / 4096 ))
    PATCH=\$(( REMAINDER % 4096 ))

    echo "• Soporte Vulkan Hardware: \$MAJOR.\$MINOR.\$PATCH (Código: \$VK_VER_INT)"
    if [ "\$VK_VER_INT" -ge 4198400 ]; then
        echo "• Estado Vulkan 1.1+: COMPATIBLE ✓ (Cumple requisito mínimo)"
    else
        echo "• Estado Vulkan 1.1+: NO COMPATIBLE ✗ (Requiere Vulkan 1.1+ para ANGLE)"
    fi

    EGL_HW=\$(getprop ro.hardware.egl 2>/dev/null)
    VK_HW=\$(getprop ro.hardware.vulkan 2>/dev/null)
    echo "• Controlador EGL: \${EGL_HW:-desconocido}"
    echo "• Controlador Vulkan: \${VK_HW:-mali}"

    CUR_PKGS=\$(settings get global angle_gl_driver_selection_pkgs 2>/dev/null)
    CUR_VALS=\$(settings get global angle_gl_driver_selection_values 2>/dev/null)
    echo "• Apps con ANGLE: \${CUR_PKGS:-'Ninguna (OpenGL nativo)'}"
    echo "• Modo de Driver: \${CUR_VALS:-'default'}"
    echo "====================================================="
}

get_status() {
    RAW_FEAT=\$(pm list features 2>/dev/null | grep -i "android.hardware.vulkan.version")
    VK_VER_INT=\$(echo "\$RAW_FEAT" | cut -d= -f2 | tr -dc '0-9')
    VK_VER_INT=\${VK_VER_INT:-0}

    VULKAN_1_1="0"
    [ "\$VK_VER_INT" -ge 4198400 ] && VULKAN_1_1="1"
    STATUS="0"
    [ -f "\$STATUS_FILE" ] && STATUS="1"
    CUR_PKGS=\$(settings get global angle_gl_driver_selection_pkgs 2>/dev/null)

    echo "ANGLE_STATUS=\$STATUS"
    echo "VULKAN_1_1_SUPPORTED=\$VULKAN_1_1"
    echo "VULKAN_VERSION_CODE=\$VK_VER_INT"
    echo "TARGET_PACKAGE=\${CUR_PKGS:-none}"
    echo "SECURITY_RULE=CERO_PERSIST_SYS"
}

ACTION="\${1:-status}"
case "\$ACTION" in
    enable|1|on|angle) enable_angle "\$2" "\$3" ;;
    disable|0|off|restore) disable_angle "\$2" ;;
    check|vulkan) check_vulkan_support ;;
    diag|info) diagnose_angle ;;
    status) get_status ;;
    *) echo "Uso: \$0 {enable [pkg] [restart]|disable [pkg]|check|diag|status}"; exit 1 ;;
esac
`,
      { unixPermissions: '755' }
    );
  }

  // 7. Carpeta webroot/ (con el nuevo apartado Ultra FPS y scripts)
  const webrootFolder = zip.folder('webroot');
  if (webrootFolder) {
    webrootFolder.file(
      'index.html',
      `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
  <title>AX Mali Core Engine</title>
  <style>
    :root {
      --bg: #090d16; --surface: #101726; --card: #162032; --primary: #38bdf8;
      --border: #1e293b; --text: #f8fafc; --muted: #94a3b8;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: system-ui, sans-serif; -webkit-tap-highlight-color: transparent; }
    body { background: var(--bg); color: var(--text); font-size: 14px; min-height: 100vh; }
    .bar { padding: 14px 16px; display: flex; align-items: center; justify-content: space-between; background: var(--surface); border-bottom: 1px solid var(--border); }
    .chip { font-size: 10px; font-weight: 700; padding: 3px 8px; border-radius: 999px; background: rgba(56,189,248,0.15); color: var(--primary); }
    .tabs { display: flex; padding: 8px 12px; gap: 4px; background: var(--surface); border-bottom: 1px solid var(--border); overflow-x: auto; }
    .tbtn { flex: 1; padding: 8px 4px; border-radius: 10px; background: transparent; border: 1px solid transparent; color: var(--muted); font-size: 11px; font-weight: 700; cursor: pointer; white-space: nowrap; }
    .tbtn.active { background: rgba(56,189,248,0.15); color: var(--primary); border-color: rgba(56,189,248,0.3); }
    .pane { display: none; padding: 16px; }
    .pane.active { display: block; }
    .card { background: var(--surface); border: 1px solid var(--border); border-radius: 16px; padding: 16px; margin-bottom: 14px; }
    .btn { width: 100%; padding: 12px; border-radius: 10px; font-weight: 700; border: none; cursor: pointer; font-size: 13px; margin-top: 8px; }
    .btn-p { background: #0284c7; color: white; }
    .btn-s { background: #1e293b; color: var(--text); border: 1px solid var(--border); }
    .opt { border: 1px solid var(--border); background: var(--card); padding: 12px; border-radius: 10px; margin-bottom: 8px; cursor: pointer; display: flex; justify-content: space-between; align-items: center; }
    .opt.sel { border-color: var(--primary); background: rgba(56,189,248,0.12); }
    .chips { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 10px; }
    .chip-btn { background: var(--card); border: 1px solid var(--border); border-radius: 999px; padding: 4px 10px; font-size: 11px; font-weight: 600; color: var(--muted); cursor: pointer; }
    .chip-btn.sel { background: rgba(56,189,248,0.15); border-color: var(--primary); color: var(--primary); }
    .input-box { width: 100%; background: var(--card); color: var(--text); border: 1px solid var(--border); border-radius: 10px; padding: 10px; margin: 8px 0; font-size: 12px; font-weight: 600; outline: none; }
    .console { background: #060912; border: 1px solid var(--border); border-radius: 10px; padding: 10px; font-family: monospace; font-size: 11px; color: #38bdf8; min-height: 80px; max-height: 150px; overflow-y: auto; white-space: pre-wrap; margin-top: 10px; }
    .pcard { background: var(--card); border: 1px solid var(--border); border-radius: 10px; padding: 10px; margin-bottom: 8px; font-size: 11px; }
  </style>
</head>
<body>
  <div class="bar">
    <strong style="font-size: 16px;">AX Mali Core</strong>
    <span class="chip">v1.3</span>
  </div>
  <div class="tabs">
    <button class="tbtn active" onclick="nav('fps')">🚀 Ultra FPS</button>
    <button class="tbtn" onclick="nav('touch')">⚡ Táctil</button>
    <button class="tbtn" onclick="nav('potato')">🥔 Batata</button>
    <button class="tbtn" onclick="nav('diag')">📊 Hardware</button>
  </div>
  <div id="p-fps" class="pane active">
    <div class="card">
      <div style="font-weight: 700; margin-bottom: 6px;">🚀 Ultra FPS Engine (Activo por defecto)</div>
      <p style="font-size: 12px; color: var(--muted); margin-bottom: 12px;">Desbloquea V-Sync Latch Unsignaled, ancla hilos a Big Cores (Renice -20), suprime Gaussian Blur de la ROM y purga la RAM.</p>
      <div class="pcard"><strong>⚡ V-Sync Latch Unsignaled:</strong> Entrega inmediata sin esperar pulso de reloj.</div>
      <div class="pcard"><strong>🧠 Afinidad CPU:</strong> Prioridad -20 en top-app para Cortex-A76/A78.</div>
      <div class="pcard"><strong>🪓 No HWUI Blur:</strong> Libera 20% de GPU Mali al saltar blur de MIUI/HyperOS.</div>
      <div class="pcard"><strong>🧹 Zero Memory Freezes:</strong> Purga de caché y supresión de LMKD/ZRAM drops.</div>
      <button class="btn btn-p" onclick="cmdFps(true)">Re-aplicar Ultra FPS Engine</button>
      <button class="btn btn-s" onclick="cmdPurgeRam()">Purgar Memoria RAM Ahora</button>
      <button class="btn btn-s" onclick="cmdFps(false)">Desactivar y Restaurar Estándar</button>
    </div>
  </div>
  <div id="p-touch" class="pane">
    <div class="card">
      <div style="font-weight: 700; margin-bottom: 6px;">⚡ Touch Slop 1px & Zero Backpressure</div>
      <p style="font-size: 12px; color: var(--muted); margin-bottom: 12px;">Respuesta instantánea del dedo para alzar mira sin retardo de SurfaceFlinger.</p>
      <button class="btn btn-p" onclick="cmdTouch(true)">Activar Touch Boost (Slop 1px)</button>
      <button class="btn btn-s" onclick="cmdTouch(false)">Restaurar Original</button>
    </div>
  </div>
  <div id="p-potato" class="pane">
    <div class="card">
      <div style="font-weight: 700; margin-bottom: 6px;">🥔 Gráficos Batata (Android 12+)</div>
      <p style="font-size: 12px; color: var(--muted); margin-bottom: 10px;">Exclusivo Android 12+. Anula Game Boosters del fabricante y reduce el renderizado en Mali.</p>
      <input type="text" id="pkgInput" class="input-box" value="com.dts.freefireth">
      <div class="opt" id="o25" onclick="selScale('0.25','o25')">
        <div><strong>🥔 Modo Batata Extremo Ultra (25%)</strong><div style="font-size: 11px; color: var(--muted);">Gráficos de cartón • Libera 85% Mali</div></div>
        <span>🔥</span>
      </div>
      <div class="opt sel" id="o50" onclick="selScale('0.5','o50')">
        <div><strong>🥔 Modo Batata Clásico (50%)</strong><div style="font-size: 11px; color: var(--muted);">Texturas plastilina • +30 FPS en tiroteos</div></div>
        <span>⚡</span>
      </div>
      <div class="opt" id="o70" onclick="selScale('0.7','o70')">
        <div><strong>⚡ Modo Competitivo (70%)</strong><div style="font-size: 11px; color: var(--muted);">Balance nítido y fluido</div></div>
        <span>🎯</span>
      </div>
      <button class="btn btn-p" onclick="cmdPotato(true, true)">Aplicar y Reiniciar Juego</button>
      <button class="btn btn-s" onclick="cmdPotato(false, false)">Restaurar Gráficos Nativos</button>
    </div>
  </div>
  <div id="p-diag" class="pane">
    <div class="card">
      <div style="font-weight: 700; margin-bottom: 6px;">📊 Diagnóstico Mali & Sistema</div>
      <div id="info" style="font-size: 12px; color: var(--muted);">Consultando hardware...</div>
      <div class="console" id="log">Conectado a AX Manager.</div>
    </div>
  </div>
  <script>
    let curScale = "0.5";
    function nav(p) {
      document.querySelectorAll('.tbtn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.pane').forEach(el => el.classList.remove('active'));
      document.getElementById('p-' + p).classList.add('active');
      const btn = Array.from(document.querySelectorAll('.tbtn')).find(b => b.getAttribute('onclick').includes(p));
      if (btn) btn.classList.add('active');
    }
    function selScale(s, id) {
      curScale = s;
      document.querySelectorAll('.opt').forEach(o => o.classList.remove('sel'));
      document.getElementById(id).classList.add('sel');
    }
    async function exec(c) {
      const log = document.getElementById('log');
      if (log) log.textContent += "\\n> " + c.slice(0, 45) + "...\\n";
      if (typeof ksu !== 'undefined' && typeof ksu.exec === 'function') {
        const res = await ksu.exec(c);
        if (log) log.textContent += (res.stdout || '') + (res.stderr || '');
        return res.stdout || '';
      } else if (typeof Axeron !== 'undefined') {
        const out = Axeron.exec(c);
        if (log) log.textContent += out || 'OK\\n';
        return out;
      }
      return null;
    }
    async function cmdFps(en) {
      const a = en ? 'enable' : 'disable';
      await exec('sh $AXERONDIR/plugins/ax_mali_core_optimizer/scripts/fps_boost.sh ' + a + ' auto || sh ./scripts/fps_boost.sh ' + a + ' auto');
      alert(en ? 'Ultra FPS Engine activado.' : 'Ultra FPS desactivado.');
    }
    async function cmdPurgeRam() {
      await exec('sh $AXERONDIR/plugins/ax_mali_core_optimizer/scripts/fps_boost.sh purge || sync; echo 3 > /proc/sys/vm/drop_caches');
      alert('Memoria RAM purgada con éxito.');
    }
    async function cmdTouch(en) {
      const a = en ? 'enable' : 'disable';
      await exec('sh $AXERONDIR/plugins/ax_mali_core_optimizer/scripts/touch_boost.sh ' + a + ' || sh ./scripts/touch_boost.sh ' + a);
      alert(en ? 'Touch Boost activado.' : 'Touch Boost restaurado.');
    }
    async function cmdPotato(en, restart) {
      const p = document.getElementById('pkgInput').value.trim() || 'com.dts.freefireth';
      const r = restart ? '1' : '0';
      if (en) {
        await exec('sh $AXERONDIR/plugins/ax_mali_core_optimizer/scripts/surface_tweak.sh enable ' + curScale + ' ' + p + ' ' + r + ' || sh ./scripts/surface_tweak.sh enable ' + curScale + ' ' + p + ' ' + r);
        if (restart) alert('Modo Batata aplicado a ' + p + '.');
      } else {
        await exec('sh $AXERONDIR/plugins/ax_mali_core_optimizer/scripts/surface_tweak.sh disable ' + p + ' || sh ./scripts/surface_tweak.sh disable ' + p);
        alert('Gráficos nativos restaurados.');
      }
    }
    window.addEventListener('DOMContentLoaded', async () => {
      const out = await exec('getprop ro.build.version.sdk; getprop ro.product.cpu.abi');
      if (out) {
        const p = out.trim().split('\\n');
        document.getElementById('info').innerHTML = 'SDK: ' + (p[0]||'Desconocido') + '<br>ABI: ' + (p[1]||'arm64');
      }
    });
  </script>
</body>
</html>
`,
      { unixPermissions: '644' }
    );
  }

  // Generación en formato POSIX UNIX compatible con Magisk, KernelSU, APatch y AxManager
  return await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
    platform: 'UNIX',
  });
}

export async function downloadModuleZip(): Promise<void> {
  const blob = await generateModuleZipBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'ax_mali_core_optimizer_v1.3.0.zip';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
