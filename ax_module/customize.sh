#!/system/bin/sh
# ==============================================================================
# Script: customize.sh
# Propósito: Script de instalación ejecutado por AX Manager / KernelSU / Magisk.
# ==============================================================================

ui_print() {
    echo "$1"
}

ui_print "***************************************************"
ui_print "*        AX MALI GPU CORE ENGINE v1.4.0           *"
ui_print "*   KernelSU • APatch • Magisk • AX Manager       *"
ui_print "***************************************************"

MODPATH="${MODPATH:-$(dirname "$0")}"

if [ -d "$MODPATH/scripts" ]; then
    ui_print "- Asignando permisos de ejecución a scripts internos..."
    chmod -R 0755 "$MODPATH/scripts"
    ui_print "  ✓ Touch Boost (InputDispatcher + Glove Mode + MTK GED)"
    ui_print "  ✓ Ultra FPS Engine (Window Blurs + SCHED_FIFO RenderThread)"
    ui_print "  ✓ Modo Batata (Game Overlay Android 12+)"
    ui_print "  ✓ Anti-Stutter RAM & ZRAM (VM Tuning & Process Freezer)"
    ui_print "  ✓ Piso Frecuencia GPU (Devfreq & MediaTek GED Floor)"
    ui_print "  ✓ GMS Shield (Escudo Anti-Telemetría Google Play)"
    ui_print "  ✓ Capa ANGLE Vulkan 1.1+ (OpenGL ES sobre Vulkan)"
    ui_print "  ✓ I/O Flash Readahead (1024 KB) & AOT Speed Mode (dex2oat)"
    ui_print "  ✓ Thermal Userspace Shield (Joyose/GOS & MTK GED Margin)"
fi

chmod 0755 "$MODPATH/service.sh" 2>/dev/null
chmod 0755 "$MODPATH/uninstall.sh" 2>/dev/null
chmod 0755 "$MODPATH/META-INF/com/google/android/update-binary" 2>/dev/null

ABI=$(getprop ro.product.cpu.abi)
ui_print "- Arquitectura de dispositivo: $ABI"

case "$ABI" in
    arm64-v8a*)
        ui_print "- Modo: 64-bit nativo (AArch64) optimizado."
        ;;
    armeabi-v7a*)
        ui_print "- Modo: 32-bit legacy (ARMv7) optimizado."
        ;;
    *)
        ui_print "- Modo: Compatibilidad universal activa."
        ;;
esac

EGL=$(getprop ro.hardware.egl)
PRIV_UID=$(id -u 2>/dev/null)
ui_print "- EGL Hardware: ${EGL:-desconocido} | UID instalador: ${PRIV_UID:-?}"
ui_print "==================================================="
ui_print " Instalación del módulo completada con éxito."
ui_print "==================================================="
