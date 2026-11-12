#!/system/bin/sh
# ==============================================================================
# Script: governor_tweak.sh
# Módulo: AX Mali Core Engine para AX Manager, KernelSU, APatch y Magisk
# Propósito: Control real de DVFS y Piso de Frecuencia GPU (Floor Frequency) en Mali.
# ==============================================================================
# REGLAS DE INTEGRIDAD:
# - Requiere acceso Root real (los nodos /sys/class/devfreq y MediaTek GED son
#   de solo lectura para ADB shell uid=2000). Si no hay Root, reporta NO_ROOT.
# - Corregido el nodo fallback de MediaTek: usa custom_boost_gpu_freq /
#   gpu_bottom_freq (piso mínimo) en lugar de custom_upbound_gpu_freq (techo).
# - Eliminadas las propiedades placebo debug.mali.dvfs_floor y debug.mali.force_floor_freq.
# - Ordena numéricamente available_frequencies antes de elegir el punto medio.
# ==============================================================================

SCRIPT_DIR=$(dirname "$0")
BACKUP_STATE="/data/local/tmp/mali_governor_backup.state"
STATUS_FILE="/data/local/tmp/mali_governor_status.state"

if [ -f "$SCRIPT_DIR/mali_common.sh" ]; then
    . "$SCRIPT_DIR/mali_common.sh"
else
    log_info() { echo "[INFO] $1"; }
    log_warn() { echo "[AVISO] $1"; }
    log_error() { echo "[ERROR] $1"; }
    has_root() { [ "$(id -u 2>/dev/null)" = "0" ]; }
fi

# ==============================================================================
# 1. Detección Real de Nodos Sysfs de GPU Mali (devfreq & MediaTek GED)
# ==============================================================================
find_mali_devfreq_node() {
    for dir in \
        /sys/class/misc/mali0/device/devfreq/* \
        /sys/class/devfreq/*mali* \
        /sys/class/devfreq/*gpu* \
        /sys/devices/platform/*mali*/devfreq/* \
        /sys/devices/platform/13040000.mali/devfreq/* \
        /sys/devices/platform/13000000.mali/devfreq/* \
        /sys/devices/platform/gpu/devfreq/*; do
        if [ -d "$dir" ] && [ -f "$dir/min_freq" ]; then
            echo "$dir"
            return 0
        fi
    done

    for dir in \
        /sys/class/misc/mali0/device \
        /sys/devices/platform/13040000.mali \
        /sys/devices/platform/13000000.mali; do
        if [ -d "$dir" ] && [ -f "$dir/min_freq" ]; then
            echo "$dir"
            return 0
        fi
    done

    return 1
}

find_mtk_floor_node() {
    for node in \
        /sys/kernel/ged/hal/custom_boost_gpu_freq \
        /sys/module/ged/parameters/gpu_bottom_freq \
        /proc/gpufreq/gpufreq_opp_freq; do
        if [ -f "$node" ]; then
            echo "$node"
            return 0
        fi
    done
    return 1
}

# ==============================================================================
# 2. Respaldo de Frecuencias y Gobernadores Previos
# ==============================================================================
backup_governor_settings() {
    NODE_PATH=$(find_mali_devfreq_node)
    MTK_NODE=$(find_mtk_floor_node)

    if [ ! -f "$BACKUP_STATE" ]; then
        log_info "Creando respaldo de frecuencias y gobernador GPU previo..."
        ORIG_GOV=""
        ORIG_MIN=""
        ORIG_MTK=""

        if [ -n "$NODE_PATH" ]; then
            [ -r "$NODE_PATH/governor" ] && ORIG_GOV=$(cat "$NODE_PATH/governor" 2>/dev/null)
            [ -r "$NODE_PATH/min_freq" ] && ORIG_MIN=$(cat "$NODE_PATH/min_freq" 2>/dev/null)
        fi
        if [ -n "$MTK_NODE" ] && [ -r "$MTK_NODE" ]; then
            ORIG_MTK=$(cat "$MTK_NODE" 2>/dev/null)
        fi

        cat <<EOF > "$BACKUP_STATE"
NODE_PATH=$NODE_PATH
ORIG_GOV=${ORIG_GOV:-""}
ORIG_MIN=${ORIG_MIN:-""}
MTK_NODE=$MTK_NODE
ORIG_MTK=${ORIG_MTK:-""}
TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")
EOF
    fi
}

# ==============================================================================
# 3. Selección y Aplicación Real del Piso de Frecuencia (Floor Frequency)
# ==============================================================================
apply_floor_frequency() {
    FLOOR_HZ="${1:-auto}"

    if ! has_root; then
        log_error "Control de frecuencia GPU Mali (/sys/class/devfreq, GED) requiere acceso Root."
        echo "NO_ROOT: Fijar frecuencias de GPU Mali requiere permisos Root."
        return 1
    fi

    backup_governor_settings
    NODE_PATH=$(find_mali_devfreq_node)
    MTK_NODE=$(find_mtk_floor_node)

    # Caso A: Subsistema devfreq estándar de ARM Mali
    if [ -n "$NODE_PATH" ] && [ -w "$NODE_PATH/min_freq" ]; then
        TARGET_FREQ=""
        if [ "$FLOOR_HZ" != "auto" ] && [ -n "$FLOOR_HZ" ]; then
            TARGET_FREQ="$FLOOR_HZ"
        elif [ -r "$NODE_PATH/available_frequencies" ]; then
            SORTED_FREQS=$(tr ' ' '\n' < "$NODE_PATH/available_frequencies" 2>/dev/null | grep -E '^[0-9]+$' | sort -n)
            COUNT=$(echo "$SORTED_FREQS" | wc -l)
            if [ "$COUNT" -ge 3 ]; then
                MID_LINE=$(( (COUNT / 2) + 1 ))
                TARGET_FREQ=$(echo "$SORTED_FREQS" | sed -n "${MID_LINE}p")
            else
                TARGET_FREQ=$(echo "$SORTED_FREQS" | tail -n 1)
            fi
        fi

        if [ -z "$TARGET_FREQ" ]; then
            MAX_F=$(cat "$NODE_PATH/max_freq" 2>/dev/null)
            if [ -n "$MAX_F" ] && [ "$MAX_F" -gt 1000000 ] 2>/dev/null; then
                TARGET_FREQ="400000000"
            else
                TARGET_FREQ="400000"
            fi
        fi

        if echo "$TARGET_FREQ" > "$NODE_PATH/min_freq" 2>/dev/null; then
            if [ -w "$NODE_PATH/governor" ]; then
                AVAILABLE_GOVS=$(cat "$NODE_PATH/available_governors" 2>/dev/null)
                if echo "$AVAILABLE_GOVS" | grep -q "simple_ondemand"; then
                    echo "simple_ondemand" > "$NODE_PATH/governor" 2>/dev/null
                fi
            fi

            cat <<EOF > "$STATUS_FILE"
STATUS=1
PROFILE=FLOOR_FREQUENCY
TARGET_FREQ=$TARGET_FREQ
NODE_PATH=$NODE_PATH
TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")
EOF
            echo "SUCCESS: Piso de frecuencia GPU Mali fijado realmente en $TARGET_FREQ ($NODE_PATH)."
            return 0
        fi
    fi

    # Caso B: Fallback real en MediaTek GED (piso mínimo custom_boost_gpu_freq / gpu_bottom_freq)
    if [ -n "$MTK_NODE" ] && [ -w "$MTK_NODE" ]; then
        TARGET_MTK="400000"
        [ "$FLOOR_HZ" != "auto" ] && [ -n "$FLOOR_HZ" ] && TARGET_MTK="$FLOOR_HZ"
        if echo "$TARGET_MTK" > "$MTK_NODE" 2>/dev/null; then
            cat <<EOF > "$STATUS_FILE"
STATUS=1
PROFILE=MTK_GED_FLOOR
TARGET_FREQ=$TARGET_MTK
NODE_PATH=$MTK_NODE
TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")
EOF
            echo "SUCCESS: Piso de frecuencia MediaTek GED aplicado en $MTK_NODE ($TARGET_MTK)."
            return 0
        fi
    fi

    echo "ERROR_NO_NODE: No se encontró un nodo devfreq/GED escribible en este kernel."
    return 1
}

# ==============================================================================
# 4. Perfiles Adicionales (Solo Root)
# ==============================================================================
apply_powersave_profile() {
    if ! has_root; then
        echo "NO_ROOT: Cambiar gobernador GPU requiere permisos Root."
        return 1
    fi
    backup_governor_settings
    NODE_PATH=$(find_mali_devfreq_node)
    if [ -n "$NODE_PATH" ] && [ -w "$NODE_PATH/governor" ]; then
        if echo "powersave" > "$NODE_PATH/governor" 2>/dev/null; then
            echo "SUCCESS: Perfil Powersave activado en $NODE_PATH."
            return 0
        fi
    fi
    echo "ERROR_UNSUPPORTED: El kernel no expone gobernador 'powersave' escribible."
    return 1
}

apply_performance_profile() {
    if ! has_root; then
        echo "NO_ROOT: El perfil Performance GPU requiere permisos Root."
        return 1
    fi
    backup_governor_settings
    NODE_PATH=$(find_mali_devfreq_node)
    if [ -n "$NODE_PATH" ]; then
        APPLIED=0
        if [ -w "$NODE_PATH/governor" ]; then
            echo "performance" > "$NODE_PATH/governor" 2>/dev/null && APPLIED=1
        fi
        if [ -r "$NODE_PATH/max_freq" ] && [ -w "$NODE_PATH/min_freq" ]; then
            MAX_F=$(cat "$NODE_PATH/max_freq" 2>/dev/null)
            [ -n "$MAX_F" ] && echo "$MAX_F" > "$NODE_PATH/min_freq" 2>/dev/null && APPLIED=1
        fi
        if [ "$APPLIED" -eq 1 ]; then
            echo "SUCCESS: Perfil Rendimiento Máximo activado en $NODE_PATH."
            return 0
        fi
    fi
    echo "ERROR_NO_NODE: No se encontró nodo devfreq escribible para modo performance."
    return 1
}

# ==============================================================================
# 5. Restauración Completa
# ==============================================================================
restore_default_governor() {
    if ! has_root; then
        echo "NO_ROOT: Restaurar nodos sysfs GPU requiere permisos Root."
        return 1
    fi

    if [ -f "$BACKUP_STATE" ]; then
        . "$BACKUP_STATE"
        if [ -n "$NODE_PATH" ] && [ -d "$NODE_PATH" ]; then
            [ -n "$ORIG_GOV" ] && [ -w "$NODE_PATH/governor" ] && echo "$ORIG_GOV" > "$NODE_PATH/governor" 2>/dev/null
            [ -n "$ORIG_MIN" ] && [ -w "$NODE_PATH/min_freq" ] && echo "$ORIG_MIN" > "$NODE_PATH/min_freq" 2>/dev/null
        fi
        if [ -n "$MTK_NODE" ] && [ -w "$MTK_NODE" ] && [ -n "$ORIG_MTK" ]; then
            echo "$ORIG_MTK" > "$MTK_NODE" 2>/dev/null
        fi
        rm -f "$BACKUP_STATE" 2>/dev/null
    fi

    rm -f "$STATUS_FILE" 2>/dev/null
    echo "SUCCESS: Gobernador y frecuencias de GPU Mali restaurados."
}

# ==============================================================================
# 6. Diagnóstico Real (Root & ADB)
# ==============================================================================
diagnose_gpu_freq() {
    echo "====================================================="
    echo "  DIAGNÓSTICO DE FRECUENCIAS GPU MALI (DVFS)         "
    echo "====================================================="
    echo "• Modo de Privilegios: $(has_root && echo ROOT || echo ADB_SHELL)"
    NODE_PATH=$(find_mali_devfreq_node)
    MTK_NODE=$(find_mtk_floor_node)

    if [ -n "$NODE_PATH" ]; then
        echo "• Nodo Devfreq Detectado: $NODE_PATH"
        [ -r "$NODE_PATH/governor" ] && echo "• Gobernador Actual: $(cat "$NODE_PATH/governor" 2>/dev/null)"
        [ -r "$NODE_PATH/cur_freq" ] && echo "• Frecuencia Actual: $(cat "$NODE_PATH/cur_freq" 2>/dev/null)"
        [ -r "$NODE_PATH/min_freq" ] && echo "• Frecuencia Mínima: $(cat "$NODE_PATH/min_freq" 2>/dev/null)"
        [ -r "$NODE_PATH/max_freq" ] && echo "• Frecuencia Máxima: $(cat "$NODE_PATH/max_freq" 2>/dev/null)"
        [ -r "$NODE_PATH/available_frequencies" ] && echo "• Frecuencias Disponibles: $(cat "$NODE_PATH/available_frequencies" 2>/dev/null)"
        [ -r "$NODE_PATH/available_governors" ] && echo "• Gobernadores Disponibles: $(cat "$NODE_PATH/available_governors" 2>/dev/null)"
    elif [ -n "$MTK_NODE" ]; then
        echo "• Nodo MediaTek GED Detectado: $MTK_NODE"
        [ -r "$MTK_NODE" ] && echo "• Valor Actual: $(cat "$MTK_NODE" 2>/dev/null)"
    else
        echo "• Sin nodo devfreq/GED accesible en este dispositivo o permisos."
    fi
    echo "====================================================="
}

get_status() {
    STATUS="0"
    [ -f "$STATUS_FILE" ] && STATUS="1"
    NODE_PATH=$(find_mali_devfreq_node)
    CUR_MIN="0"
    CUR_GOV="standard"
    if [ -n "$NODE_PATH" ]; then
        [ -r "$NODE_PATH/min_freq" ] && CUR_MIN=$(cat "$NODE_PATH/min_freq" 2>/dev/null)
        [ -r "$NODE_PATH/governor" ] && CUR_GOV=$(cat "$NODE_PATH/governor" 2>/dev/null)
    fi

    echo "GPU_FLOOR_STATUS=$STATUS"
    echo "PRIV_MODE=$(has_root && echo ROOT || echo ADB_SHELL)"
    echo "GPU_MIN_FREQ=${CUR_MIN:-0}"
    echo "GPU_GOVERNOR=${CUR_GOV:-standard}"
    echo "SECURITY_RULE=CERO_PERSIST_SYS"
}

ACTION="${1:-status}"
case "$ACTION" in
    floor|enable|1|gaming) apply_floor_frequency "$2" ;;
    restore|disable|0|off|balanced) restore_default_governor ;;
    performance|max) apply_performance_profile ;;
    powersave|save) apply_powersave_profile ;;
    diag|info|check) diagnose_gpu_freq ;;
    status) get_status ;;
    *) echo "Uso: $0 {floor [frecuencia]|performance|powersave|restore|diag|status}"; exit 1 ;;
esac
