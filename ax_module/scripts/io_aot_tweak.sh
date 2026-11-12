#!/system/bin/sh
# ==============================================================================
# Script: io_aot_tweak.sh
# Módulo: AX Mali Core Engine para AX Manager, KernelSU, APatch y Magisk
# Propósito: Acelerador de Carga e I/O de Almacenamiento Flash:
#   1. Pre-Compilación AOT de Bytecode (cmd package compile -m speed):
#      Funciona tanto con Root como sin Root (ADB Shell / AX Manager).
#   2. I/O Readahead Dinámico (read_ahead_kb 1024 KB), iostats=0 y nr_requests:
#      Requiere permisos Root (/sys/block/*/queue/).
# ==============================================================================
# REGLAS DE INTEGRIDAD:
# - Verifica permisos reales: solo incrementa MODIFIED_QUEUES si la escritura
#   en el nodo /sys/block/ tuvo éxito; si es 0, reporta NO_ROOT honestamente.
# - Respalda también nr_requests previo para restaurarlo fielmente.
# ==============================================================================

SCRIPT_DIR=$(dirname "$0")
BACKUP_STATE="/data/local/tmp/mali_io_backup.state"
STATUS_FILE="/data/local/tmp/mali_io_status.state"

if [ -f "$SCRIPT_DIR/mali_common.sh" ]; then
    . "$SCRIPT_DIR/mali_common.sh"
else
    log_info() { echo "[INFO] $1"; }
    log_warn() { echo "[AVISO] $1"; }
    log_error() { echo "[ERROR] $1"; }
    has_root() { [ "$(id -u 2>/dev/null)" = "0" ]; }
fi

resolve_target_pkg() {
    INPUT_PKG=$(echo "$1" | tr -cd 'a-zA-Z0-9._')
    if [ -n "$INPUT_PKG" ] && [ "$INPUT_PKG" != "auto" ]; then
        echo "$INPUT_PKG"
        return
    fi

    for PKG in \
        com.dts.freefireth \
        com.dts.freefiremax \
        com.tencent.ig \
        com.activision.callofduty.shooter \
        com.netease.bloodstrike \
        com.roblox.client \
        com.miHoYo.GenshinImpact; do
        if pm path "$PKG" >/dev/null 2>&1; then
            echo "$PKG"
            return
        fi
    done

    echo "com.dts.freefireth"
}

backup_io_settings() {
    if [ ! -f "$BACKUP_STATE" ]; then
        > "$BACKUP_STATE"
        for dev in /sys/block/*/queue; do
            [ ! -d "$dev" ] && continue
            B_DEV=$(echo "$dev" | cut -d/ -f4)
            case "$B_DEV" in
                loop*|ram*|zram*) continue ;;
            esac

            CUR_RA=""
            CUR_IO=""
            CUR_NR=""
            [ -r "$dev/read_ahead_kb" ] && CUR_RA=$(cat "$dev/read_ahead_kb" 2>/dev/null)
            [ -r "$dev/iostats" ] && CUR_IO=$(cat "$dev/iostats" 2>/dev/null)
            [ -r "$dev/nr_requests" ] && CUR_NR=$(cat "$dev/nr_requests" 2>/dev/null)

            echo "DEV_${B_DEV}_RA=${CUR_RA:-128}" >> "$BACKUP_STATE"
            echo "DEV_${B_DEV}_IO=${CUR_IO:-1}" >> "$BACKUP_STATE"
            echo "DEV_${B_DEV}_NR=${CUR_NR:-128}" >> "$BACKUP_STATE"
        done
        echo "TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")" >> "$BACKUP_STATE"
    fi
}

enable_io_boost() {
    RA_KB="${1:-1024}"

    if ! has_root; then
        log_warn "Los nodos /sys/block/*/queue/ requieren acceso Root."
        echo "NO_ROOT: El ajuste de I/O Readahead (/sys/block/) requiere Root. La compilación AOT (Modo Speed) sí funciona sin Root."
        return 1
    fi

    backup_io_settings

    MODIFIED_QUEUES=0
    for dev in /sys/block/*/queue; do
        [ ! -d "$dev" ] && continue
        B_DEV=$(echo "$dev" | cut -d/ -f4)
        case "$B_DEV" in
            loop*|ram*|zram*) continue ;;
        esac

        DEV_CHANGED=0
        if [ -w "$dev/read_ahead_kb" ] && echo "$RA_KB" > "$dev/read_ahead_kb" 2>/dev/null; then
            DEV_CHANGED=1
        fi
        if [ -w "$dev/iostats" ] && echo 0 > "$dev/iostats" 2>/dev/null; then
            DEV_CHANGED=1
        fi
        if [ -w "$dev/nr_requests" ]; then
            echo 512 > "$dev/nr_requests" 2>/dev/null
        fi

        [ "$DEV_CHANGED" -eq 1 ] && MODIFIED_QUEUES=$((MODIFIED_QUEUES + 1))
    done

    if [ "$MODIFIED_QUEUES" -eq 0 ]; then
        echo "ERROR_NO_WRITABLE_QUEUE: No se pudo escribir en ninguna cola /sys/block/."
        return 1
    fi

    cat <<EOF > "$STATUS_FILE"
STATUS=1
READAHEAD_KB=$RA_KB
IOSTATS=0
NR_REQUESTS=512
QUEUES_COUNT=$MODIFIED_QUEUES
TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")
EOF

    echo "SUCCESS: Aceleración I/O flash activa ($MODIFIED_QUEUES colas optimizadas a ${RA_KB} KB sin iostats)."
}

disable_io_boost() {
    if ! has_root; then
        echo "NO_ROOT: Restaurar colas /sys/block/ requiere permisos Root."
        return 1
    fi

    if [ -f "$BACKUP_STATE" ]; then
        for dev in /sys/block/*/queue; do
            [ ! -d "$dev" ] && continue
            B_DEV=$(echo "$dev" | cut -d/ -f4)
            case "$B_DEV" in
                loop*|ram*|zram*) continue ;;
            esac

            OLD_RA=$(grep "^DEV_${B_DEV}_RA=" "$BACKUP_STATE" 2>/dev/null | cut -d= -f2)
            OLD_IO=$(grep "^DEV_${B_DEV}_IO=" "$BACKUP_STATE" 2>/dev/null | cut -d= -f2)
            OLD_NR=$(grep "^DEV_${B_DEV}_NR=" "$BACKUP_STATE" 2>/dev/null | cut -d= -f2)

            [ -w "$dev/read_ahead_kb" ] && echo "${OLD_RA:-128}" > "$dev/read_ahead_kb" 2>/dev/null
            [ -w "$dev/iostats" ] && echo "${OLD_IO:-1}" > "$dev/iostats" 2>/dev/null
            [ -w "$dev/nr_requests" ] && [ -n "$OLD_NR" ] && echo "$OLD_NR" > "$dev/nr_requests" 2>/dev/null
        done
        rm -f "$BACKUP_STATE" 2>/dev/null
    fi

    rm -f "$STATUS_FILE" 2>/dev/null
    echo "SUCCESS: Parámetros I/O restaurados al estado original del teléfono."
}

compile_aot_speed() {
    TARGET_PKG="${1:-auto}"
    MODE="${2:-speed}"
    PKG=$(resolve_target_pkg "$TARGET_PKG")

    case "$MODE" in
        speed|speed-profile|everything|quicken) ;;
        *) MODE="speed" ;;
    esac

    if ! pm path "$PKG" >/dev/null 2>&1; then
        echo "ERROR_PACKAGE_NOT_FOUND: $PKG no está instalado."
        return 1
    fi

    log_info "Iniciando compilación AOT ($MODE) para $PKG..."
    COMPILE_OUT=$(cmd package compile -m "$MODE" -f "$PKG" 2>&1)
    EXIT_CODE=$?

    if [ "$EXIT_CODE" -eq 0 ]; then
        echo "SUCCESS: $PKG pre-compilado en modo $MODE ($COMPILE_OUT)."
        return 0
    fi

    log_warn "Fallo en modo $MODE ($COMPILE_OUT). Intentando speed-profile..."
    PROFILE_OUT=$(cmd package compile -m speed-profile -f "$PKG" 2>&1)
    PROFILE_CODE=$?
    if [ "$PROFILE_CODE" -eq 0 ]; then
        echo "SUCCESS: $PKG compilado en modo speed-profile ($PROFILE_OUT)."
        return 0
    fi

    echo "ERROR_COMPILE_FAILED: No se pudo compilar $PKG ($PROFILE_OUT)."
    return 1
}

reset_aot_compile() {
    TARGET_PKG="${1:-auto}"
    PKG=$(resolve_target_pkg "$TARGET_PKG")

    if ! pm path "$PKG" >/dev/null 2>&1; then
        echo "ERROR_PACKAGE_NOT_FOUND: $PKG no está instalado."
        return 1
    fi

    if cmd package compile --reset "$PKG" >/dev/null 2>&1; then
        echo "SUCCESS: Compilación ART de $PKG restaurada a valores de fábrica."
    else
        echo "ERROR: No se pudo restablecer compilación de $PKG."
        return 1
    fi
}

audit_io_aot() {
    TARGET_PKG="${1:-auto}"
    PKG=$(resolve_target_pkg "$TARGET_PKG")

    echo "====================================================="
    echo "  AUDITORÍA DE ALMACENAMIENTO I/O & COMPILACIÓN AOT  "
    echo "====================================================="
    echo "• Modo de Privilegios: $(has_root && echo ROOT || echo ADB_SHELL)"

    for dev in /sys/block/mmcblk0/queue /sys/block/sda/queue /sys/block/sdb/queue /sys/block/dm-0/queue; do
        if [ -d "$dev" ]; then
            DEV_NAME=$(echo "$dev" | cut -d/ -f4)
            RA=$(cat "$dev/read_ahead_kb" 2>/dev/null)
            IO=$(cat "$dev/iostats" 2>/dev/null)
            NR=$(cat "$dev/nr_requests" 2>/dev/null)
            echo "• Dispositivo Flash: $DEV_NAME"
            echo "  - Readahead actual: ${RA:-no legible} KB"
            echo "  - Estadísticas E/S (iostats): ${IO:-no legible}"
            echo "  - Peticiones en cola (nr_requests): ${NR:-no legible}"
        fi
    done
    echo "-----------------------------------------------------"
    echo "• Paquete Consultado: $PKG"
    if pm path "$PKG" >/dev/null 2>&1; then
        COMP_STATUS=$(dumpsys package "$PKG" 2>/dev/null | grep -iE "status=|reason=" | head -n 4)
        echo "${COMP_STATUS:-• Estado ART: Instalado}"
    else
        echo "• Estado: Paquete no instalado actualmente."
    fi
    echo "====================================================="
}

get_status() {
    STATUS="0"
    [ -f "$STATUS_FILE" ] && STATUS="1"
    RA="unknown"
    IO="unknown"
    for dev in /sys/block/mmcblk0/queue /sys/block/sda/queue /sys/block/dm-0/queue; do
        if [ -r "$dev/read_ahead_kb" ]; then
            RA=$(cat "$dev/read_ahead_kb" 2>/dev/null)
            IO=$(cat "$dev/iostats" 2>/dev/null)
            break
        fi
    done

    echo "IO_AOT_STATUS=$STATUS"
    echo "PRIV_MODE=$(has_root && echo ROOT || echo ADB_SHELL)"
    echo "READAHEAD_KB=${RA:-unknown}"
    echo "IOSTATS=${IO:-unknown}"
    echo "SECURITY_RULE=CERO_PERSIST_SYS"
}

ACTION="${1:-status}"
case "$ACTION" in
    enable|1|on) enable_io_boost "$2" ;;
    disable|0|off|restore) disable_io_boost ;;
    compile|speed) compile_aot_speed "$2" "$3" ;;
    reset) reset_aot_compile "$2" ;;
    audit|diag|info) audit_io_aot "$2" ;;
    status) get_status ;;
    *) echo "Uso: $0 {enable [kb]|disable|compile [pkg] [speed|speed-profile]|reset [pkg]|audit [pkg]|status}"; exit 1 ;;
esac
