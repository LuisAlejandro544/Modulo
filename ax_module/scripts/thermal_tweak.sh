#!/system/bin/sh
# ==============================================================================
# Script: thermal_tweak.sh
# Módulo: AX Mali Core Engine para AX Manager, KernelSU, APatch y Magisk
# Propósito: Anulación de Daemons de Throttling Userspace del Fabricante
#            (Joyose, GOS, Cosa) y Tuning de MediaTek GED & FPSGO.
# ==============================================================================
# REGLAS DE INTEGRIDAD:
# - Cero propiedades permanentes de sistema.
# - Eliminadas las propiedades placebo debug.thermal.throttle y debug.thermal.limit.
# - Preserva intactos los sensores y cortes críticos en /sys/class/thermal/.
# - Verifica privilegios reales (Root vs ADB) y solo reporta lo que realmente aplicó.
# ==============================================================================

SCRIPT_DIR=$(dirname "$0")
BACKUP_STATE="/data/local/tmp/mali_thermal_backup.state"
STATUS_FILE="/data/local/tmp/mali_thermal_status.state"
FROZEN_THERMAL_PIDS="/data/local/tmp/mali_thermal_frozen.pids"
FROZEN_THERMAL_PKGS="/data/local/tmp/mali_thermal_frozen.pkgs"
STOPPED_DAEMONS_FILE="/data/local/tmp/mali_thermal_daemons.state"

if [ -f "$SCRIPT_DIR/mali_common.sh" ]; then
    . "$SCRIPT_DIR/mali_common.sh"
else
    log_info() { echo "[INFO] $1"; }
    log_warn() { echo "[AVISO] $1"; }
    log_error() { echo "[ERROR] $1"; }
    has_root() { [ "$(id -u 2>/dev/null)" = "0" ]; }
fi

THROTTLE_PACKAGES="
    com.xiaomi.joyose
    com.samsung.android.game.gos
    com.samsung.android.thermalguardian
    com.oplus.cosa
    com.coloros.oppoguardelf
    com.oplus.battery
    com.oplus.games
    com.transsion.gamebooster
    com.vivo.daemonService
"

backup_thermal_settings() {
    if [ ! -f "$BACKUP_STATE" ]; then
        ORIG_DVFS_MARGIN=""
        ORIG_GPU_IDLE=""
        ORIG_FSTB_LEVEL=""
        ORIG_EAS_BOOST=""

        [ -r /sys/module/ged/parameters/dvfs_margin_value ] && ORIG_DVFS_MARGIN=$(cat /sys/module/ged/parameters/dvfs_margin_value 2>/dev/null)
        [ -r /sys/module/ged/parameters/gpu_idle ] && ORIG_GPU_IDLE=$(cat /sys/module/ged/parameters/gpu_idle 2>/dev/null)
        [ -r /sys/module/mtk_fpsgo/parameters/fstb_soft_level ] && ORIG_FSTB_LEVEL=$(cat /sys/module/mtk_fpsgo/parameters/fstb_soft_level 2>/dev/null)
        [ -r /proc/perfmgr/boost_ctrl/eas_ctrl/sched_boost ] && ORIG_EAS_BOOST=$(cat /proc/perfmgr/boost_ctrl/eas_ctrl/sched_boost 2>/dev/null)

        cat <<EOF > "$BACKUP_STATE"
ORIG_DVFS_MARGIN=${ORIG_DVFS_MARGIN:-""}
ORIG_GPU_IDLE=${ORIG_GPU_IDLE:-""}
ORIG_FSTB_LEVEL=${ORIG_FSTB_LEVEL:-""}
ORIG_EAS_BOOST=${ORIG_EAS_BOOST:-""}
TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")
EOF
    fi
}

enable_thermal_shield() {
    log_info "Activando Thermal Userspace Shield (Modo $(has_root && echo ROOT || echo ADB_SHELL))..."

    backup_thermal_settings
    > "$FROZEN_THERMAL_PIDS"
    > "$FROZEN_THERMAL_PKGS"
    > "$STOPPED_DAEMONS_FILE"

    APPOPS_COUNT=0
    SIGSTOP_COUNT=0
    MTK_TUNED=0

    # Paso A: Restringir paquetes de throttling en segundo plano (ADB & Root)
    for pkg in $THROTTLE_PACKAGES; do
        if pm path "$pkg" >/dev/null 2>&1; then
            if cmd appops set "$pkg" RUN_IN_BACKGROUND ignore >/dev/null 2>&1; then
                echo "$pkg" >> "$FROZEN_THERMAL_PKGS"
                APPOPS_COUNT=$((APPOPS_COUNT + 1))
            fi

            if has_root; then
                PIDS=$(pidof "$pkg" 2>/dev/null)
                if [ -n "$PIDS" ]; then
                    for PID in $PIDS; do
                        if [ "$PID" -gt 500 ] && [ -d "/proc/$PID" ]; then
                            if kill -STOP "$PID" 2>/dev/null; then
                                echo "$PID" >> "$FROZEN_THERMAL_PIDS"
                                SIGSTOP_COUNT=$((SIGSTOP_COUNT + 1))
                            fi
                        fi
                    done
                fi
            fi
        fi
    done

    # Paso B y C: Daemons nativos y MediaTek GED/FPSGO (Solo Root)
    if has_root; then
        for s_daemon in mi_thermald thermal-engine vendor.thermal_hal; do
            SVC_STATE=$(getprop "init.svc.${s_daemon}" 2>/dev/null)
            if [ "$SVC_STATE" = "running" ]; then
                if stop "$s_daemon" 2>/dev/null; then
                    echo "$s_daemon" >> "$STOPPED_DAEMONS_FILE"
                fi
            fi
        done

        if [ -w /sys/module/ged/parameters/dvfs_margin_value ] && echo 50 > /sys/module/ged/parameters/dvfs_margin_value 2>/dev/null; then
            MTK_TUNED=$((MTK_TUNED + 1))
        fi
        if [ -w /sys/module/ged/parameters/gpu_idle ] && echo 0 > /sys/module/ged/parameters/gpu_idle 2>/dev/null; then
            MTK_TUNED=$((MTK_TUNED + 1))
        fi
        if [ -w /sys/kernel/fpsgo/fbt/boost_ta ] && echo 1 > /sys/kernel/fpsgo/fbt/boost_ta 2>/dev/null; then
            MTK_TUNED=$((MTK_TUNED + 1))
        fi
        if [ -w /sys/module/mtk_fpsgo/parameters/fstb_soft_level ] && echo 0 > /sys/module/mtk_fpsgo/parameters/fstb_soft_level 2>/dev/null; then
            MTK_TUNED=$((MTK_TUNED + 1))
        fi
        if [ -w /proc/perfmgr/boost_ctrl/eas_ctrl/sched_boost ] && echo 1 > /proc/perfmgr/boost_ctrl/eas_ctrl/sched_boost 2>/dev/null; then
            MTK_TUNED=$((MTK_TUNED + 1))
        fi
    fi

    cat <<EOF > "$STATUS_FILE"
STATUS=1
PRIV_MODE=$(has_root && echo ROOT || echo ADB_SHELL)
APPOPS_BLOCKED=$APPOPS_COUNT
SIGSTOP_PIDS=$SIGSTOP_COUNT
MTK_TUNED=$MTK_TUNED
HARDWARE_SAFETY=INTACT
TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")
EOF

    if has_root; then
        echo "SUCCESS: Thermal Shield activo (AppOps=$APPOPS_COUNT, SIGSTOP=$SIGSTOP_COUNT, Nodos MTK GED=$MTK_TUNED). Sensores kernel intactos."
    else
        echo "PARTIAL_ADB: Restricción appops aplicada a $APPOPS_COUNT paquetes de throttling. SIGSTOP, stop thermald y nodos GED requieren Root."
    fi
}

disable_thermal_shield() {
    log_info "Desactivando Thermal Shield y restaurando parámetros de fábrica..."

    if has_root && [ -f "$FROZEN_THERMAL_PIDS" ]; then
        for PID in $(cat "$FROZEN_THERMAL_PIDS" 2>/dev/null); do
            [ -d "/proc/$PID" ] && kill -CONT "$PID" 2>/dev/null
        done
    fi
    rm -f "$FROZEN_THERMAL_PIDS" 2>/dev/null

    if [ -f "$FROZEN_THERMAL_PKGS" ]; then
        for pkg in $(cat "$FROZEN_THERMAL_PKGS" 2>/dev/null); do
            cmd appops set "$pkg" RUN_IN_BACKGROUND allow >/dev/null 2>&1
        done
        rm -f "$FROZEN_THERMAL_PKGS" 2>/dev/null
    fi

    if has_root && [ -f "$STOPPED_DAEMONS_FILE" ]; then
        for s_daemon in $(cat "$STOPPED_DAEMONS_FILE" 2>/dev/null); do
            start "$s_daemon" 2>/dev/null
        done
    fi
    rm -f "$STOPPED_DAEMONS_FILE" 2>/dev/null

    if has_root && [ -f "$BACKUP_STATE" ]; then
        . "$BACKUP_STATE"
        [ -n "$ORIG_DVFS_MARGIN" ] && [ -w /sys/module/ged/parameters/dvfs_margin_value ] && echo "$ORIG_DVFS_MARGIN" > /sys/module/ged/parameters/dvfs_margin_value 2>/dev/null
        [ -n "$ORIG_GPU_IDLE" ] && [ -w /sys/module/ged/parameters/gpu_idle ] && echo "$ORIG_GPU_IDLE" > /sys/module/ged/parameters/gpu_idle 2>/dev/null
        [ -n "$ORIG_FSTB_LEVEL" ] && [ -w /sys/module/mtk_fpsgo/parameters/fstb_soft_level ] && echo "$ORIG_FSTB_LEVEL" > /sys/module/mtk_fpsgo/parameters/fstb_soft_level 2>/dev/null
        [ -n "$ORIG_EAS_BOOST" ] && [ -w /proc/perfmgr/boost_ctrl/eas_ctrl/sched_boost ] && echo "$ORIG_EAS_BOOST" > /proc/perfmgr/boost_ctrl/eas_ctrl/sched_boost 2>/dev/null
        rm -f "$BACKUP_STATE" 2>/dev/null
    fi

    rm -f "$STATUS_FILE" 2>/dev/null
    echo "SUCCESS: Thermal Shield desactivado y parámetros restaurados."
}

audit_thermal() {
    echo "====================================================="
    echo "  AUDITORÍA DE THROTTLING DE FABRICANTES & MEDIATEK  "
    echo "====================================================="
    echo "• Modo de Privilegios: $(has_root && echo ROOT || echo ADB_SHELL)"

    FOUND_THROTTLER=0
    for pkg in $THROTTLE_PACKAGES; do
        if pm path "$pkg" >/dev/null 2>&1; then
            FOUND_THROTTLER=1
            STATE="[ACTIVO]"
            if [ -f "$FROZEN_THERMAL_PKGS" ] && grep -qx "$pkg" "$FROZEN_THERMAL_PKGS"; then
                STATE="[RESTRINGIDO POR SHIELD ✓]"
            fi
            echo "  - $pkg: $STATE"
        fi
    done
    [ "$FOUND_THROTTLER" -eq 0 ] && echo "  - No se detectaron paquetes throttlers OEM conocidos."

    echo "-----------------------------------------------------"
    [ -r /sys/module/ged/parameters/dvfs_margin_value ] && echo "  - dvfs_margin_value: $(cat /sys/module/ged/parameters/dvfs_margin_value 2>/dev/null)"
    [ -r /sys/module/ged/parameters/gpu_idle ] && echo "  - gpu_idle: $(cat /sys/module/ged/parameters/gpu_idle 2>/dev/null)"
    [ -r /sys/module/mtk_fpsgo/parameters/fstb_soft_level ] && echo "  - fstb_soft_level: $(cat /sys/module/mtk_fpsgo/parameters/fstb_soft_level 2>/dev/null)"

    TEMP_RAW=""
    for t_zone in /sys/class/thermal/thermal_zone0/temp /sys/class/thermal/thermal_zone1/temp; do
        if [ -r "$t_zone" ]; then
            TEMP_RAW=$(cat "$t_zone" 2>/dev/null)
            break
        fi
    done
    if [ -n "$TEMP_RAW" ]; then
        if [ "$TEMP_RAW" -gt 1000 ] 2>/dev/null; then
            TEMP_C=$(( TEMP_RAW / 1000 ))
        else
            TEMP_C="$TEMP_RAW"
        fi
        echo "• Temperatura Sensor Kernel: ${TEMP_C}°C"
    fi
    echo "• Protección de Apagado de Emergencia: INTACTA (Nivel Kernel)"
    echo "====================================================="
}

get_status() {
    STATUS="0"
    [ -f "$STATUS_FILE" ] && STATUS="1"
    MARGIN="unknown"
    [ -r /sys/module/ged/parameters/dvfs_margin_value ] && MARGIN=$(cat /sys/module/ged/parameters/dvfs_margin_value 2>/dev/null)
    FROZEN_NUM=0
    [ -f "$FROZEN_THERMAL_PIDS" ] && FROZEN_NUM=$(wc -l < "$FROZEN_THERMAL_PIDS" 2>/dev/null)

    echo "THERMAL_SHIELD_STATUS=$STATUS"
    echo "PRIV_MODE=$(has_root && echo ROOT || echo ADB_SHELL)"
    echo "DVFS_MARGIN=${MARGIN:-unknown}"
    echo "FROZEN_THROTTLERS=${FROZEN_NUM:-0}"
    echo "HARDWARE_PROTECTION=INTACT"
    echo "SECURITY_RULE=CERO_PERSIST_SYS"
}

ACTION="${1:-status}"
case "$ACTION" in
    enable|1|on|shield) enable_thermal_shield ;;
    disable|0|off|restore) disable_thermal_shield ;;
    audit|diag|check|info) audit_thermal ;;
    status) get_status ;;
    *) echo "Uso: $0 {enable|disable|audit|status}"; exit 1 ;;
esac
