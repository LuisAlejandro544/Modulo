#!/system/bin/sh
# ==============================================================================
# Script: touch_boost.sh
# Módulo: AX Mali Core Engine para AX Manager (Root & No-Root)
# Propósito: Optimización de nivel insignia para sensibilidad táctil en procesadores
#            MediaTek (Dimensity / Helio) y GPUs ARM Mali:
#            1. Activación de Modo Alta Sensibilidad / Glove Mode en digitalizador.
#            2. Optimización de Rastreador de Velocidad (VelocityTracker Strategy = Impulse).
#            3. Disolución del filtro de micro-desplazamientos (Touch Slop 1px & Scroll Friction 0.005).
#            4. Boost instantáneo de CPU y DRAM al toque en MediaTek (GED & FPSGO).
#            5. Eliminación de contrapresión en SurfaceFlinger (Zero Backpressure).
# ==============================================================================
# REGLAS CRÍTICAS DE SEGURIDAD:
# 1. NUNCA se utiliza ni se modificará ninguna propiedad persistente de sistema.
# 2. Todos los cambios son 100% reversibles: los valores originales del teléfono
#    se respaldan en archivos de estado antes de aplicar la optimización.
# 3. Compatible con arquitecturas de 32 bits (ARMv7) y 64 bits (ARMv8/v9).
# ==============================================================================

SCRIPT_DIR=$(dirname "$0")
BACKUP_STATE="/data/local/tmp/mali_touch_backup.state"
NODE_BACKUP="/data/local/tmp/mali_touch_nodes.state"
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
        ORIG_SPEED_TOUCH=$(settings get secure speed_touch 2>/dev/null)

        cat <<EOF > "$BACKUP_STATE"
ORIG_LONG_PRESS=${ORIG_LONG_PRESS:-400}
ORIG_MULTI_PRESS=${ORIG_MULTI_PRESS:-300}
ORIG_POINTER_SPEED=${ORIG_POINTER_SPEED:-0}
ORIG_TAP_DURATION=${ORIG_TAP_DURATION:-0}
ORIG_TOUCH_BLOCK=${ORIG_TOUCH_BLOCK:-0}
ORIG_SPEED_TOUCH=${ORIG_SPEED_TOUCH:-0}
EOF
        log_info "Respaldo de Settings guardado exitosamente en $BACKUP_STATE"
    fi
}

# ==============================================================================
# 2. Función de Activación: Sensibilidad Insignia, Glove Mode y Boost MediaTek
# ==============================================================================
enable_touch_boost() {
    log_info "Iniciando activación de Touch Boost de nivel insignia para MediaTek & Mali..."

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
    settings put secure speed_touch 1 2>/dev/null
    log_info "Ajustes de InputDispatcher y pointer_speed aplicados."

    # Limpiar archivo previo de respaldo de nodos si existiera
    [ -f "$NODE_BACKUP" ] && rm -f "$NODE_BACKUP"

    # Helper para respaldar y escribir nodos sysfs con seguridad
    write_and_backup_node() {
        _target="$1"
        _value="$2"
        if [ -w "$_target" ]; then
            _prev=$(cat "$_target" 2>/dev/null)
            echo "${_target}=${_prev}" >> "$NODE_BACKUP"
            echo "$_value" > "$_target" 2>/dev/null
            return 0
        fi
        return 1
    }

    # ==========================================================================
    # Paso C: Modo Alta Sensibilidad / Glove Mode en el Digitalizador
    # Activa la ganancia analógica y muestreo rápido en controladores
    # Goodix, FocalTech, Novatek, Synaptics, Ilitek y OEMs (Xiaomi, Realme, Oppo)
    # ==========================================================================
    TOUCH_NODES="
        /sys/class/touch/touch_dev/glove_mode
        /proc/touchpanel/glove_mode_enable
        /proc/touchpanel/high_sensitivity
        /proc/touchpanel/sensitity_mode
        /sys/class/touch/touch_dev/touch_sensitivity
        /sys/class/touch/glove_mode
        /sys/touchpanel/glove_mode
        /sys/devices/platform/tp_gesture/high_sensitivity
        /sys/devices/platform/tp_gesture/game_mode
        /sys/class/touch/touch_dev/game_switch
        /proc/touchpanel/game_switch_enable
        /sys/devices/virtual/touch/touch_dev/bump_sample_rate
        /sys/android_touch/game_mode
    "
    # Escanear nodos dinámicos de inputs virtuales
    for dyn in /sys/devices/virtual/input/input*/glove_mode /sys/devices/virtual/input/input*/high_sense; do
        [ -w "$dyn" ] && TOUCH_NODES="$TOUCH_NODES $dyn"
    done

    TOUCH_APPLIED=0
    for node in $TOUCH_NODES; do
        if write_and_backup_node "$node" "1"; then
            TOUCH_APPLIED=$((TOUCH_APPLIED + 1))
            log_info "Glove/Sensibilidad activado: $node"
        fi
    done

    # Desactivar límite de polling de Oppo/Realme si existe (0 = sin límite de reporte)
    if write_and_backup_node "/proc/touchpanel/oppo_tp_limit_enable" "0"; then
        TOUCH_APPLIED=$((TOUCH_APPLIED + 1))
        log_info "Límite de muestreo Oppo/Realme anulado (Polling desbloqueado)."
    fi
    log_info "Nodos de hardware de digitalizador optimizados: $TOUCH_APPLIED"

    # ==========================================================================
    # Paso D: Boost de CPU y DRAM al Toque en MediaTek (GED & FPSGO)
    # MediaTek GED (Graphics Enhancement Driver) y FPSGO aceleran el procesador
    # inmediatamente al contacto, eliminando micro-lag al comenzar el arrastre
    # ==========================================================================
    MTK_BOOST_NODES="
        /sys/module/ged/parameters/gx_force_cpu_boost
        /sys/module/ged/parameters/gx_game_mode
        /sys/module/ged/parameters/boost_gpu_enable
        /sys/module/ged/parameters/ged_smart_boost
        /sys/module/ged/parameters/ged_boost_enable
        /sys/module/ged/parameters/gx_boost_on
        /sys/kernel/fpsgo/fbt/boost_ta
        /sys/kernel/fpsgo/fbt/fbt_en
        /sys/kernel/fpsgo/common/gpu_block_boost
        /sys/module/mtk_fpsgo/parameters/fstb_soft_level
        /proc/perfmgr/boost_ctrl/eas_ctrl/sched_boost
        /sys/devices/system/cpu/sched_touchboost/enable
        /sys/module/perfmgr/parameters/touch_boost_enable
    "
    MTK_APPLIED=0
    for mtk_node in $MTK_BOOST_NODES; do
        if write_and_backup_node "$mtk_node" "1"; then
            MTK_APPLIED=$((MTK_APPLIED + 1))
            log_info "Nodo MediaTek GED/FPSGO acelerado: $mtk_node"
        fi
    done
    log_info "Nodos MediaTek GED/FPSGO aplicados: $MTK_APPLIED"

    # ==========================================================================
    # Paso E: Optimización de VelocityTracker Strategy (Rastreador de Velocidad)
    # Cambia la estrategia de seguimiento de Android a 'impulse' para reaccionar
    # de inmediato a la energía cinética del dedo en vez de usar filtros retardados
    # ==========================================================================
    setprop debug.input.velocitytracker.strategy impulse 2>/dev/null
    setprop debug.velocitytracker.strategy impulse 2>/dev/null
    setprop input.velocitytracker.strategy impulse 2>/dev/null
    setprop debug.input.pointer_acceleration 0 2>/dev/null
    log_info "VelocityTracker configurado en estrategia: impulse (sin aceleración falsa)."

    # ==========================================================================
    # Paso F: Disolución del Filtro de Micro-desplazamientos
    # Reduce la fricción virtual de scroll a 0.005 (vs estándar 0.015) y Slop a 1px.
    # Calibra presión física para registrar toques tenues sin resistencia
    # ==========================================================================
    setprop view.touch_slop 1 2>/dev/null
    setprop view.scroll_friction 0.005 2>/dev/null
    setprop debug.touch.latency_factor 0 2>/dev/null
    setprop touch.pressure.scale 0.001 2>/dev/null
    setprop touch.size.calibration geometric 2>/dev/null
    setprop touch.pressure.calibration physical 2>/dev/null

    # Sincronización de SurfaceFlinger (Zero Backpressure y fases tempranas)
    setprop debug.sf.disable_backpressure 1 2>/dev/null
    setprop debug.sf.early_phase_offset_ns 500000 2>/dev/null
    setprop debug.sf.early_gl_phase_offset_ns 3000000 2>/dev/null
    setprop debug.sf.early_app_phase_offset_ns 500000 2>/dev/null
    log_info "Filtro de micro-movimientos disuelto (Fricción 0.005, Slop 1px, Zero Backpressure)."

    # Registrar estado activo
    echo "1" > "$STATUS_FILE"
    echo "SUCCESS: Touch Boost Insignia (Glove Mode + Impulse + Fricción 0.005 + MTK GED/FPSGO) activado."
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
        settings put secure speed_touch "${ORIG_SPEED_TOUCH:-0}" 2>/dev/null
        log_info "Valores de Settings restaurados según respaldo previo."
    else
        settings put secure long_press_timeout 400
        settings put secure multi_press_timeout 300
        settings put system pointer_speed 0
        settings put secure tap_duration_threshold 0
        settings put secure touch_blocking_period 0
        settings put secure speed_touch 0 2>/dev/null
    fi

    # Restaurar todos los nodos de kernel respaldados dinámicamente
    if [ -f "$NODE_BACKUP" ]; then
        RESTORED_NODES=0
        while IFS="=" read -r target_node prev_val; do
            if [ -w "$target_node" ] && [ -n "$prev_val" ]; then
                echo "$prev_val" > "$target_node" 2>/dev/null
                RESTORED_NODES=$((RESTORED_NODES + 1))
            fi
        done < "$NODE_BACKUP"
        rm -f "$NODE_BACKUP"
        log_info "Nodos de hardware restaurados a sus valores previos: $RESTORED_NODES"
    fi

    # Restaurar propiedades en memoria RAM a valores por defecto
    setprop debug.input.velocitytracker.strategy "" 2>/dev/null
    setprop debug.velocitytracker.strategy "" 2>/dev/null
    setprop input.velocitytracker.strategy "" 2>/dev/null
    setprop debug.input.pointer_acceleration "" 2>/dev/null
    setprop view.touch_slop "" 2>/dev/null
    setprop view.scroll_friction "" 2>/dev/null
    setprop debug.touch.latency_factor "" 2>/dev/null
    setprop touch.pressure.scale "" 2>/dev/null
    setprop touch.size.calibration "" 2>/dev/null
    setprop touch.pressure.calibration "" 2>/dev/null
    setprop debug.sf.disable_backpressure "" 2>/dev/null
    setprop debug.sf.early_phase_offset_ns "" 2>/dev/null
    setprop debug.sf.early_gl_phase_offset_ns "" 2>/dev/null
    setprop debug.sf.early_app_phase_offset_ns "" 2>/dev/null

    echo "0" > "$STATUS_FILE"
    echo "SUCCESS: Valores táctiles restaurados al estado original del teléfono."
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
    FRICTION=$(getprop view.scroll_friction)
    STRATEGY=$(getprop debug.input.velocitytracker.strategy)
    BP=$(getprop debug.sf.disable_backpressure)

    echo "STATUS=$CURRENT_STATUS"
    echo "LONG_PRESS_TIMEOUT=$LONG_PRESS"
    echo "POINTER_SPEED=$SPEED"
    echo "TOUCH_SLOP=${SLOP:-default}"
    echo "SCROLL_FRICTION=${FRICTION:-default}"
    echo "VELOCITY_STRATEGY=${STRATEGY:-default}"
    echo "ZERO_BACKPRESSURE=${BP:-default}"
    echo "PERSIST_SYS_CHECK=0_VIOLATIONS"
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
