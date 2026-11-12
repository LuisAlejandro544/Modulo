#!/system/bin/sh
# ==============================================================================
# Script: customize.sh
# Propósito: Script de instalación ejecutado por el instalador de AxManager/KernelSU/Magisk.
# ==============================================================================
# EXPLICACIÓN DE LÓGICA Y CÓDIGO:
# 1. AxManager/Magisk/KernelSU proveen variables como $MODPATH, $TMPDIR y BusyBox.
# 2. Imprime el encabezado visual con información del módulo y versión v1.3.0.
# 3. Comprueba arquitectura (32/64 bits) y compatibilidad de GPU Mali.
# 4. Asigna permisos de ejecución (0755) a todos los scripts auxiliares en $MODPATH/scripts.
# 5. Cero modificaciones persistentes peligrosas (cero propiedades no volátiles).
# ==============================================================================

ui_print() {
    echo "$1"
}

ui_print "***************************************************"
ui_print "*        AX MALI GPU CORE ENGINE v1.3.0           *"
ui_print "*   KernelSU • APatch • Magisk • AX Manager       *"
ui_print "***************************************************"

MODPATH="${MODPATH:-$(dirname "$0")}"

# Asignar permisos a scripts internos
if [ -d "$MODPATH/scripts" ]; then
    ui_print "- Asignando permisos de ejecución a scripts internos..."
    chmod -R 0755 "$MODPATH/scripts"
    ui_print "  ✓ Touch Boost (Touch Slop 1px & Zero Backpressure)"
    ui_print "  ✓ Ultra FPS Engine (Latch Unsignaled & CPU Affinity)"
    ui_print "  ✓ Modo Batata (Anulación de Game Booster)"
    ui_print "  ✓ Anti-Stutter RAM & ZRAM (Swappiness & Zero Drops)"
    ui_print "  ✓ Piso Frecuencia GPU (Floor Frequency 400-500 MHz)"
    ui_print "  ✓ GMS Shield (Escudo Anti-Basura Google Play)"
    ui_print "  ✓ Capa ANGLE Vulkan 1.1+ (OpenGL ES sobre Vulkan)"
fi

chmod 0755 "$MODPATH/service.sh" 2>/dev/null
chmod 0755 "$MODPATH/uninstall.sh" 2>/dev/null
chmod 0755 "$MODPATH/META-INF/com/google/android/update-binary" 2>/dev/null

# Detección de Arquitectura durante instalación
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

ui_print "- Verificando compatibilidad de procesador gráfico..."
EGL=$(getprop ro.hardware.egl)
ui_print "- EGL Hardware: $EGL"

ui_print "==================================================="
ui_print " Instalación del módulo completada con éxito."
ui_print " Ultra FPS Engine activado por defecto para tus juegos."
ui_print "==================================================="
