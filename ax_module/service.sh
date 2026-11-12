#!/system/bin/sh
# ==============================================================================
# Script: service.sh
# Propósito: Servicio de arranque iniciado por AX Manager, KernelSU, APatch o Magisk.
# ==============================================================================
# EXPLICACIÓN DE LÓGICA:
# - Espera a que Android complete el arranque (sys.boot_completed = 1).
# - Aplica únicamente optimizaciones seguras para arranque (no congela apps
#   de usuario en el boot para no romper notificaciones ni alarmas).
# - El congelador SIGSTOP y los perfiles de juego se activan desde el WebUI.
# ==============================================================================

MODDIR="$(dirname "$0")"

while [ "$(getprop sys.boot_completed)" != "1" ]; do
    sleep 2
done

if [ -f "$MODDIR/scripts/mali_common.sh" ]; then
    . "$MODDIR/scripts/mali_common.sh"
    log_info "Servicio de AX Mali Core Engine v1.4.0 iniciado (Modo $(get_priv_mode))."
fi

if [ -f "$MODDIR/scripts/fps_boost.sh" ]; then
    sh "$MODDIR/scripts/fps_boost.sh" enable auto >/dev/null 2>&1
    log_info "Ajustes base de Ultra FPS Engine aplicados tras el arranque."
fi

# Solo ajusta parámetros VM (/proc/sys/vm/*) si hay Root; NO congela apps al arranque
if [ -f "$MODDIR/scripts/ram_tweak.sh" ]; then
    sh "$MODDIR/scripts/ram_tweak.sh" vm 50 >/dev/null 2>&1
    log_info "Parámetros VM Anti-Stutter aplicados en arranque (sin congelar apps)."
fi

log_info "Servicio de AX Mali Engine listo para peticiones WebUI."
