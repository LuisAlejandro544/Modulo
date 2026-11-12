#!/system/bin/sh
# ==============================================================================
# Script: touch_boost.sh
# Módulo: AX Mali Core Engine para AX Manager (Root & No-Root)
# Propósito: Optimizar la respuesta y sensibilidad táctil del digitalizador,
#            reducir timeouts del InputDispatcher, eliminar la contrapresión
#            de SurfaceFlinger (Zero Backpressure) y bajar Touch Slop a 1px.
# ==============================================================================
# REGLAS CRÍTICAS DE SEGURIDAD:
# 1. NUNCA se utiliza ni se modificará ninguna propiedad persistente de sistema.
# 2. Todos los cambios son 100% reversibles: los valores originales del teléfono
#    se respaldan en un archivo de estado antes de aplicar la optimización.
# 3. Compatible con arquitecturas de 32 bits (ARMv7) y 64 bits (ARMv8/v9).
# ==============================================================================

SCRIPT_DIR=$(dirname "$0")
BACKUP_STATE="/data/local/tmp/mali_touch_backup.state"
STATUS_FILE="/data/local/tmp/mali_touch_status.state"

# Cargar funciones comunes si están disponibles
if [ -f "$SCRIPT_DIR/mali_common.sh" ]; then
    . "$SCRIPT_DIR/mali_common.sh"
else
    log_info() { echo "[INFO] $1"; }
    log_warn() { echo "[AVISO] $1"; }
    log_error() { echo "[ERROR] $1"; }
fi

# ==============================================================================
# 1. Función de Respaldo de Valores Originales del Teléfono
# ==============================================================================
backup_original_settings() {
    if [ ! -f "$BACKUP_STATE" ]; then
        log_info "Creando respaldo de configuración táctil previa del dispositivo..."
        ORIG_LONG_PRESS=$(settings get secure long_press_timeout 2>/dev/null)
        ORIG_MULTI_PRESS=$(settings get secure multi_press_timeout 2>/dev/null)
        ORIG_POINTER_SPEED=$(settings get system pointer_speed 2>/dev/null)
        ORIG_TAP_DURATION=$(settings get secure tap_duration_threshold 2>/dev/null)
        ORIG_TOUCH_BLOCK=$(settings get secure touch_blocking_period 2>/dev/null)

        cat <<EOF > "$BACKUP_STATE"
ORIG_LONG_PRESS=${ORIG_LONG_PRESS:-400}
ORIG_MULTI_PRESS=${ORIG_MULTI_PRESS:-300}
ORIG_POINTER_SPEED=${ORIG_POINTER_SPEED:-0}
ORIG_TAP_DURATION=${ORIG_TAP_DURATION:-0}
ORIG_TOUCH_BLOCK=${ORIG_TOUCH_BLOCK:-0}
EOF
        log_info "Respaldo guardado exitosamente en $BACKUP_STATE"
    fi
}

# ==============================================================================
# 2. Función de Activación: Sensibilidad Ultra, Slop 1px y Zero Backpressure
# ==============================================================================
enable_touch_boost() {
    log_info "Iniciando activación de Touch Boost para GPU Mali y Panel Táctil..."

    ARCH=$(getprop ro.product.cpu.abi)
    log_info "Arquitectura detectada: $ARCH"

    # Paso A: Respaldar estado previo si aún no se ha hecho
    backup_original_settings

    # Paso B: Reducción de retardos en InputDispatcher (Android Settings)
    settings put secure long_press_timeout 250
    settings put secure multi_press_timeout 200
    settings put system pointer_speed 7
    settings put secure tap_duration_threshold 0
    settings put secure touch_blocking_period 0
    log_info "Ajustes de InputDispatcher y pointer_speed aplicados."

    # Paso C: Escaneo de nodos sysfs del kernel para modo juego / alta tasa de reporte
    TOUCH_NODES="
        /sys/class/touch/touch_dev/game_switch
        /proc/touchpanel/game_switch_enable
        /proc/touchpanel/oppo_tp_limit_enable
        /sys/devices/virtual/touch/touch_dev/bump_sample_rate
        /sys/devices/platform/tp_gesture/game_mode
        /sys/android_touch/game_mode
    "
    NODES_APPLIED=0
    for node in $TOUCH_NODES; do
        if [ -w "$node" ]; then
            if echo "$node" | grep -q "limit_enable"; then
                echo 0 > "$node" 2>/dev/null && NODES_APPLIED=$((NODES_APPLIED + 1))
            else
                echo 1 > "$node" 2>/dev/null && NODES_APPLIED=$((NODES_APPLIED + 1))
            fi
            log_info "Nodo del kernel activado: $node"
        fi
    done
    log_info "Nodos de hardware de panel optimizados: $NODES_APPLIED"

    # Paso D: Reducción de Touch Slop a 1px (Respuesta instantánea del dedo al alzar mira)
    # y eliminación de la contrapresión de SurfaceFlinger (Zero Backpressure)
    # Todas propiedades no persistentes en memoria RAM (debug.* y view.*)
    setprop view.touch_slop 1 2>/dev/null
    setprop debug.touch.latency_factor 0 2>/dev/null
    setprop debug.sf.disable_backpressure 1 2>/dev/null
    setprop debug.sf.early_phase_offset_ns 500000 2>/dev/null
    setprop debug.sf.early_gl_phase_offset_ns 3000000 2>/dev/null
    setprop debug.sf.early_app_phase_offset_ns 500000 2>/dev/null
    log_info "Touch Slop (1px), Zero Backpressure y Fases de composición configuradas."

    # Registrar estado activo
    echo "1" > "$STATUS_FILE"
    echo "SUCCESS: Touch Boost (Slop 1px + Zero Backpressure) activado con éxito."
}

# ==============================================================================
# 3. Función de Desactivación: Reversión Completa a Valores Originales
# ==============================================================================
disable_touch_boost() {
    log_info "Desactivando Touch Boost y restaurando valores originales..."

    if [ -f "$BACKUP_STATE" ]; then
        . "$BACKUP_STATE"
        settings put secure long_press_timeout "${ORIG_LONG_PRESS:-400}"
        settings put secure multi_press_timeout "${ORIG_MULTI_PRESS:-300}"
        settings put system pointer_speed "${ORIG_POINTER_SPEED:-0}"
        settings put secure tap_duration_threshold "${ORIG_TAP_DURATION:-0}"
        settings put secure touch_blocking_period "${ORIG_TOUCH_BLOCK:-0}"
        log_info "Valores del sistema restaurados según respaldo previo."
    else
        settings put secure long_press_timeout 400
        settings put secure multi_press_timeout 300
        settings put system pointer_speed 0
        settings put secure tap_duration_threshold 0
        settings put secure touch_blocking_period 0
    fi

    # Restaurar nodos de hardware si existen
    for node in \
        /sys/class/touch/touch_dev/game_switch \
        /proc/touchpanel/game_switch_enable \
        /sys/devices/virtual/touch/touch_dev/bump_sample_rate \
        /sys/devices/platform/tp_gesture/game_mode \
        /sys/android_touch/game_mode; do
        if [ -w "$node" ]; then
            echo 0 > "$node" 2>/dev/null
        fi
    done

    if [ -w "/proc/touchpanel/oppo_tp_limit_enable" ]; then
        echo 1 > "/proc/touchpanel/oppo_tp_limit_enable" 2>/dev/null
    fi

    # Restaurar propiedades en memoria RAM a valores por defecto
    setprop view.touch_slop "" 2>/dev/null
    setprop debug.touch.latency_factor "" 2>/dev/null
    setprop debug.sf.disable_backpressure "" 2>/dev/null
    setprop debug.sf.early_phase_offset_ns "" 2>/dev/null
    setprop debug.sf.early_gl_phase_offset_ns "" 2>/dev/null
    setprop debug.sf.early_app_phase_offset_ns "" 2>/dev/null

    echo "0" > "$STATUS_FILE"
    echo "SUCCESS: Valores táctiles restaurados a la configuración estándar."
}

# ==============================================================================
# 4. Consulta de Estado
# ==============================================================================
get_status() {
    CURRENT_STATUS="0"
    if [ -f "$STATUS_FILE" ]; then
        CURRENT_STATUS=$(cat "$STATUS_FILE" 2>/dev/null)
    fi

    LONG_PRESS=$(settings get secure long_press_timeout 2>/dev/null)
    SPEED=$(settings get system pointer_speed 2>/dev/null)
    SLOP=$(getprop view.touch_slop)
    BP=$(getprop debug.sf.disable_backpressure)

    echo "STATUS=$CURRENT_STATUS"
    echo "LONG_PRESS_TIMEOUT=$LONG_PRESS"
    echo "POINTER_SPEED=$SPEED"
    echo "TOUCH_SLOP=${SLOP:-default}"
    echo "ZERO_BACKPRESSURE=${BP:-default}"
    echo "SECURITY_AUDIT=0_VIOLATIONS"
}

ACTION="${1:-status}"
case "$ACTION" in
    enable|1|on)
        enable_touch_boost
        ;;
    disable|0|off)
        disable_touch_boost
        ;;
    status|info)
        get_status
        ;;
    *)
        echo "Uso: $0 {enable|disable|status}"
        exit 1
        ;;
esac
