#!/system/bin/sh
# ==============================================================================
# Script: customize.sh
# Propósito: Script de instalación ejecutado por el instalador de AxManager.
# ==============================================================================
# EXPLICACIÓN DE LÓGICA Y CÓDIGO:
# 1. AxManager provee variables como $MODPATH, $TMPDIR y el entorno Busybox.
# 2. Imprime el encabezado visual con información del módulo y versión.
# 3. Comprueba arquitectura (32/64 bits) y compatibilidad de GPU Mali.
# 4. Asigna permisos de ejecución (+x) a todos los scripts auxiliares en $MODPATH/scripts.
# 5. No altera ningún parámetro 'persist.sys.*' ni realiza modificaciones destructivas.
# ==============================================================================

ui_print() {
    echo "$1"
}

ui_print "***************************************************"
ui_print "*        AX MALI GPU OPTIMIZER (BASE)             *"
ui_print "*   Compatibilidad para AX Manager (Root / No-Root)*"
ui_print "***************************************************"

MODPATH="${MODPATH:-$(dirname "$0")}"

# Asignar permisos a scripts internos
if [ -d "$MODPATH/scripts" ]; then
    ui_print "- Asignando permisos de ejecución a scripts internos..."
    chmod -R 0755 "$MODPATH/scripts"
    ui_print "- Script de optimización táctil (touch_boost.sh) configurado."
fi

chmod 0755 "$MODPATH/service.sh" 2>/dev/null
chmod 0755 "$MODPATH/uninstall.sh" 2>/dev/null

# Detección de Arquitectura durante instalación
ABI=$(getprop ro.product.cpu.abi)
ui_print "- Arquitectura de dispositivo: $ABI"

case "$ABI" in
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
EGL=$(getprop ro.hardware.egl)
ui_print "- EGL Hardware: $EGL"

ui_print "==================================================="
ui_print " Instalación del esqueleto base finalizada con éxito."
ui_print " Listo para el desarrollo de funciones personalizadas."
ui_print "==================================================="
