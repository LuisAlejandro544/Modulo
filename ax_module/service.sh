#!/system/bin/sh
# ==============================================================================
# Script: service.sh
# Propósito: Servicio en segundo plano iniciado por AX Manager, KernelSU, APatch o Magisk.
# ==============================================================================
# EXPLICACIÓN DE LÓGICA Y CÓDIGO:
# - Se invoca automáticamente en modo BusyBox standalone tras el arranque.
# - Espera a que el sistema complete el boot (boot_completed = 1).
# - Por requerimiento de diseño: activa automáticamente el Ultra FPS Engine por defecto
#   (Latch Unsignaled, Core Affinity, Disable HWUI DrawBlur y optimización de RAM).
# - CERO propiedades no volátiles (No modifica propiedades persistentes en disco).
# ==============================================================================

MODDIR="$(dirname "$0")"

# Esperar a que el sistema concluya el arranque
while [ "$(getprop sys.boot_completed)" != "1" ]; do
    sleep 2
done

# Cargar biblioteca compartida
if [ -f "$MODDIR/scripts/mali_common.sh" ]; then
    . "$MODDIR/scripts/mali_common.sh"
    log_info "Servicio de AX Mali Core Engine iniciado correctamente."
    log_info "Servidor AXERON: ${AXERON:-no-detectado}, Versión: ${AXERONVER:-indefinida}"
fi

# Activar Ultra FPS Engine por defecto (según especificación del usuario)
if [ -f "$MODDIR/scripts/fps_boost.sh" ]; then
    sh "$MODDIR/scripts/fps_boost.sh" enable auto
    log_info "Ultra FPS Engine activado automáticamente en el arranque."
fi

log_info "Servicio de AX Mali Engine en ejecución y listo para peticiones WebUI."
