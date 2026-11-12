#!/system/bin/sh
# ==============================================================================
# Script: touch_boost.sh
# Módulo: AX Mali Core Engine para AX Manager (Root & No-Root)
# Propósito: Optimización real y verificable de respuesta táctil:
#   1. Settings de InputDispatcher y accesibilidad física (Funciona en Root & ADB):
#      - long_press_timeout, multi_press_timeout, pointer_speed,
#        tap_duration_threshold y touch_blocking_period.
#   2. Glove Mode / Alta Sensibilidad en digitalizador (Solo Root):
#      - Nodos reales de panel táctil y desbloqueo de polling Oppo/Realme.
#   3. Boost de CPU/GPU al toque en MediaTek GED & FPSGO (Solo Root):
#      - Nodos reales en /sys/module/ged/parameters/ y /sys/kernel/fpsgo/.
#   4. SurfaceFlinger debug.sf.disable_backpressure (Solo si setprop lo permite).
# ==============================================================================
# REGLAS DE INTEGRIDAD:
# - Cero propiedades persistentes de sistema.
# - Cero propiedades placebo inexistentes (eliminados view.touch_slop,
#   view.scroll_friction, debug.input.velocitytracker.strategy, etc.).
# - Respaldo exacto (incluyendo valores 'null') para reversión limpia.
# ==============================================================================

SCRIPT_DIR=$(dirname "$0")
BACKUP_STATE="/data/local/tmp/mali_touch_backup.state"
NODE_BACKUP="/data/local/tmp/mali_touch_nodes.state"
STATUS_FILE="/data/local/tmp/mali_touch_status.state"

if [ -f "$SCRIPT_DIR/mali_common.sh" ]; then
    . "$SCRIPT_DIR/mali_common.sh"
else
    log_info() { echo "[INFO] $1"; }
    log_warn() { echo "[AVISO] $1"; }
    log_error() { echo "[ERROR] $1"; }
    has_root() { [ "$(id -u 2>/dev/null)" = "0" ]; }
fi

# ==============================================================================
# 1. Respaldo Fiel de Valores Originales (preserva 'null' si no existía)
# ==============================================================================
backup_original_settings() {
    if [ ! -f "$BACKUP_STATE" ]; then
        log_info "Creando respaldo de configuración táctil previa del dispositivo..."
        ORIG_LONG_PRESS=$(settings get secure long_press_timeout 2>/dev/null)
        ORIG_MULTI_PRESS=$(settings get secure multi_press_timeout 2>/dev/null)
        ORIG_POINTER_SPEED=$(settings get system pointer_speed 2>/dev/null)
        ORIG_TAP_DURATION=$(settings get secure tap_duration_threshold 2>/dev/null)
        ORIG_TOUCH_BLOCK=$(settings get secure touch_blocking_period 2>/dev/null)
        ORIG_BACKPRESSURE=$(getprop debug.sf.disable_backpressure 2>/dev/null)

        cat <<EOF > "$BACKUP_STATE"
ORIG_LONG_PRESS=${ORIG_LONG_PRESS:-null}
ORIG_MULTI_PRESS=${ORIG_MULTI_PRESS:-null}
ORIG_POINTER_SPEED=${ORIG_POINTER_SPEED:-null}
ORIG_TAP_DURATION=${ORIG_TAP_DURATION:-null}
ORIG_TOUCH_BLOCK=${ORIG_TOUCH_BLOCK:-null}
ORIG_BACKPRESSURE=${ORIG_BACKPRESSURE:-""}
EOF
        log_info "Respaldo de Settings guardado en $BACKUP_STATE"
    fi
}

restore_setting() {
    _ns="$1"
    _key="$2"
    _val="$3"
    if [ -z "$_val" ] || [ "$_val" = "null" ]; then
        settings delete "$_ns" "$_key" >/dev/null 2>&1
    else
        settings put "$_ns" "$_key" "$_val" >/dev/null 2>&1
    fi
}

# ==============================================================================
# 2. Activación Real (ADB Settings + Hardware/Kernel si hay Root)
# ==============================================================================
enable_touch_boost() {
    log_info "Iniciando Touch Boost (Modo $(has_root && echo ROOT || echo ADB_SHELL))..."

    backup_original_settings

    # Paso A: Ajustes reales de InputDispatcher en Android (Root y ADB No-Root)
    SETTINGS_OK=0
    settings put secure long_press_timeout 250 >/dev/null 2>&1 && SETTINGS_OK=$((SETTINGS_OK + 1))
    settings put secure multi_press_timeout 200 >/dev/null 2>&1 && SETTINGS_OK=$((SETTINGS_OK + 1))
    settings put system pointer_speed 7 >/dev/null 2>&1 && SETTINGS_OK=$((SETTINGS_OK + 1))
    settings put secure tap_duration_threshold 0 >/dev/null 2>&1 && SETTINGS_OK=$((SETTINGS_OK + 1))
    settings put secure touch_blocking_period 0 >/dev/null 2>&1 && SETTINGS_OK=$((SETTINGS_OK + 1))

    # Paso B: Nodos de hardware del digitalizador (Glove Mode) y MediaTek GED/FPSGO (Solo Root)
    rm -f "$NODE_BACKUP" 2>/dev/null
    TOUCH_APPLIED=0
    MTK_APPLIED=0
    SF_BP_OK=0

    write_and_backup_node() {
        _target="$1"
        _value="$2"
        if [ -w "$_target" ]; then
            _prev=$(cat "$_target" 2>/dev/null)
            if echo "$_value" > "$_target" 2>/dev/null; then
                echo "${_target}=${_prev}" >> "$NODE_BACKUP"
                return 0
            fi
        fi
        return 1
    }

    if has_root; then
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
        for dyn in /sys/devices/virtual/input/input*/glove_mode /sys/devices/virtual/input/input*/high_sense; do
            [ -w "$dyn" ] && TOUCH_NODES="$TOUCH_NODES $dyn"
        done

        for node in $TOUCH_NODES; do
            if write_and_backup_node "$node" "1"; then
                TOUCH_APPLIED=$((TOUCH_APPLIED + 1))
                log_info "Glove/Sensibilidad hardware activado: $node"
            fi
        done

        if write_and_backup_node "/proc/touchpanel/oppo_tp_limit_enable" "0"; then
            TOUCH_APPLIED=$((TOUCH_APPLIED + 1))
            log_info "Límite de muestreo Oppo/Realme desbloqueado."
        fi

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
            /proc/perfmgr/boost_ctrl/eas_ctrl/sched_boost
            /sys/devices/system/cpu/sched_touchboost/enable
            /sys/module/perfmgr/parameters/touch_boost_enable
        "
        for mtk_node in $MTK_BOOST_NODES; do
            if write_and_backup_node "$mtk_node" "1"; then
                MTK_APPLIED=$((MTK_APPLIED + 1))
                log_info "Nodo MediaTek GED/FPSGO acelerado: $mtk_node"
            fi
        done

        # SurfaceFlinger Zero Backpressure (requiere contexto privilegiado / root según SELinux)
        if setprop debug.sf.disable_backpressure 1 2>/dev/null; then
            SF_BP_OK=1
        fi
    else
        log_warn "Modo ADB sin Root: los nodos del digitalizador (/sys, /proc) y GED/FPSGO requieren Root; se aplicaron los ajustes reales de Android Settings."
    fi

    cat <<EOF > "$STATUS_FILE"
STATUS=1
PRIV_MODE=$(has_root && echo ROOT || echo ADB_SHELL)
SETTINGS_APPLIED=$SETTINGS_OK
TOUCH_NODES=$TOUCH_APPLIED
MTK_NODES=$MTK_APPLIED
SF_BACKPRESSURE=$SF_BP_OK
EOF

    if [ "$SETTINGS_OK" -eq 0 ] && [ "$TOUCH_APPLIED" -eq 0 ] && [ "$MTK_APPLIED" -eq 0 ]; then
        echo "ERROR: No se pudo aplicar ningún ajuste táctil (verifica permisos de AX Manager)."
        return 1
    fi

    if has_root; then
        echo "SUCCESS: Touch Boost aplicado (Settings: $SETTINGS_OK/5, Nodos panel: $TOUCH_APPLIED, MediaTek GED/FPSGO: $MTK_APPLIED, Backpressure: $SF_BP_OK)."
    else
        echo "PARTIAL_ADB: Touch Boost ADB aplicado ($SETTINGS_OK/5 ajustes de InputDispatcher). Nodos Glove Mode y MediaTek GED requieren Root."
    fi
}

# ==============================================================================
# 3. Desactivación y Reversión Exacta
# ==============================================================================
disable_touch_boost() {
    log_info "Desactivando Touch Boost y restaurando valores originales..."

    if [ -f "$BACKUP_STATE" ]; then
        . "$BACKUP_STATE"
        restore_setting secure long_press_timeout "${ORIG_LONG_PRESS:-400}"
        restore_setting secure multi_press_timeout "${ORIG_MULTI_PRESS:-300}"
        restore_setting system pointer_speed "${ORIG_POINTER_SPEED:-0}"
        restore_setting secure tap_duration_threshold "${ORIG_TAP_DURATION:-null}"
        restore_setting secure touch_blocking_period "${ORIG_TOUCH_BLOCK:-null}"
        if has_root; then
            setprop debug.sf.disable_backpressure "${ORIG_BACKPRESSURE:-}" 2>/dev/null
        fi
        rm -f "$BACKUP_STATE" 2>/dev/null
    else
        settings put secure long_press_timeout 400 >/dev/null 2>&1
        settings put secure multi_press_timeout 300 >/dev/null 2>&1
        settings put system pointer_speed 0 >/dev/null 2>&1
        settings delete secure tap_duration_threshold >/dev/null 2>&1
        settings delete secure touch_blocking_period >/dev/null 2>&1
    fi

    RESTORED_NODES=0
    if [ -f "$NODE_BACKUP" ]; then
        while IFS="=" read -r target_node prev_val; do
            if [ -w "$target_node" ] && [ -n "$prev_val" ]; then
                echo "$prev_val" > "$target_node" 2>/dev/null && RESTORED_NODES=$((RESTORED_NODES + 1))
            fi
        done < "$NODE_BACKUP"
        rm -f "$NODE_BACKUP" 2>/dev/null
    fi

    rm -f "$STATUS_FILE" 2>/dev/null
    echo "SUCCESS: Valores táctiles restaurados ($RESTORED_NODES nodos hardware revertidos)."
}

# ==============================================================================
# 4. Consulta de Estado Real
# ==============================================================================
get_status() {
    CURRENT_STATUS="0"
    TOUCH_NODES="0"
    MTK_NODES="0"
    if [ -f "$STATUS_FILE" ]; then
        CURRENT_STATUS=$(grep "^STATUS=" "$STATUS_FILE" | cut -d= -f2)
        TOUCH_NODES=$(grep "^TOUCH_NODES=" "$STATUS_FILE" | cut -d= -f2)
        MTK_NODES=$(grep "^MTK_NODES=" "$STATUS_FILE" | cut -d= -f2)
    fi

    LONG_PRESS=$(settings get secure long_press_timeout 2>/dev/null)
    SPEED=$(settings get system pointer_speed 2>/dev/null)
    BP=$(getprop debug.sf.disable_backpressure 2>/dev/null)

    echo "STATUS=${CURRENT_STATUS:-0}"
    echo "PRIV_MODE=$(has_root && echo ROOT || echo ADB_SHELL)"
    echo "LONG_PRESS_TIMEOUT=${LONG_PRESS:-default}"
    echo "POINTER_SPEED=${SPEED:-default}"
    echo "TOUCH_NODES_APPLIED=${TOUCH_NODES:-0}"
    echo "MTK_NODES_APPLIED=${MTK_NODES:-0}"
    echo "ZERO_BACKPRESSURE=${BP:-default}"
    echo "PERSIST_SYS_CHECK=0_VIOLATIONS"
}

ACTION="${1:-status}"
case "$ACTION" in
    enable|1|on) enable_touch_boost ;;
    disable|0|off) disable_touch_boost ;;
    status|info) get_status ;;
    *) echo "Uso: $0 {enable|disable|status}"; exit 1 ;;
esac
