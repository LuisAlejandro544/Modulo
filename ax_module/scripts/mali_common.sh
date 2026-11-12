#!/system/bin/sh
# ==============================================================================
# Script: mali_common.sh
# Propósito: Librería de funciones comunes, detección de privilegios (Root/ADB),
#            arquitectura (32/64 bits) y utilidades de registro para AX Manager.
# ==============================================================================
# REGLA ESTRICTA DE SEGURIDAD:
# NUNCA se utiliza ni se modificará ninguna propiedad persistente de sistema.
# ==============================================================================

# Directorios de trabajo y rutas de logs
MODDIR="${MODDIR:-$(dirname "$0")/..}"
LOG_FILE="/data/local/tmp/ax_mali_optimizer.log"

# Función para marca de tiempo dinámica en cada línea de log
_now_tag() {
    date +"%Y-%m-%d %H:%M:%S" 2>/dev/null || echo "0000-00-00 00:00:00"
}

# Funciones de registro en consola y archivo temporal
log_info() {
    _t=$(_now_tag)
    echo "[$_t] [INFO] $1"
    echo "[$_t] [INFO] $1" >> "$LOG_FILE" 2>/dev/null
}

log_warn() {
    _t=$(_now_tag)
    echo "[$_t] [AVISO] $1"
    echo "[$_t] [AVISO] $1" >> "$LOG_FILE" 2>/dev/null
}

log_error() {
    _t=$(_now_tag)
    echo "[$_t] [ERROR] $1"
    echo "[$_t] [ERROR] $1" >> "$LOG_FILE" 2>/dev/null
}

# ==============================================================================
# Detección Real de Privilegios (Root uid=0 vs ADB/Shell uid=2000)
# ==============================================================================
# Evita reportar éxito falso cuando un nodo de kernel (/sys, /proc) requiere Root.
has_root() {
    _uid=$(id -u 2>/dev/null)
    [ "$_uid" = "0" ] && return 0
    return 1
}

get_priv_mode() {
    if has_root; then
        echo "ROOT"
    else
        echo "ADB_SHELL"
    fi
}

# Escribe de forma segura en un nodo del kernel y verifica que la escritura tuvo éxito
safe_write_node() {
    _node="$1"
    _val="$2"
    if [ -w "$_node" ]; then
        if printf '%s\n' "$_val" > "$_node" 2>/dev/null; then
            return 0
        fi
    fi
    return 1
}

# ==============================================================================
# Detección de Arquitectura de CPU/Sistema (32-bit vs 64-bit)
# ==============================================================================
detect_architecture() {
    PRIMARY_ABI=$(getprop ro.product.cpu.abi 2>/dev/null)
    ABI_LIST=$(getprop ro.product.cpu.abilist 2>/dev/null)

    log_info "Detectando arquitectura de CPU..."
    log_info "ABI principal detectada: ${PRIMARY_ABI:-desconocida}"
    log_info "Lista de ABIs soportadas: ${ABI_LIST:-desconocida}"

    case "$PRIMARY_ABI" in
        arm64-v8a*)
            ARCH_TYPE="64-bit"
            ARCH_LABEL="AArch64"
            ;;
        armeabi-v7a*|armeabi*)
            ARCH_TYPE="32-bit"
            ARCH_LABEL="ARMv7"
            ;;
        x86_64*)
            ARCH_TYPE="64-bit"
            ARCH_LABEL="x86_64"
            ;;
        x86*)
            ARCH_TYPE="32-bit"
            ARCH_LABEL="x86"
            ;;
        *)
            ARCH_TYPE="desconocida"
            ARCH_LABEL="$PRIMARY_ABI"
            ;;
    esac

    log_info "Arquitectura clasificada como: $ARCH_TYPE ($ARCH_LABEL)"
    echo "$ARCH_TYPE"
}

# ==============================================================================
# Detección de Procesador Gráfico Mali
# ==============================================================================
detect_mali_gpu() {
    IS_MALI=0
    MALI_PATH=""

    POSSIBLE_PATHS="
        /sys/class/misc/mali0
        /sys/devices/platform/mali.0
        /sys/devices/platform/13040000.mali
        /sys/devices/platform/13000000.mali
        /sys/devices/platform/gpu
        /sys/kernel/gpu
    "

    for path in $POSSIBLE_PATHS; do
        if [ -d "$path" ] || [ -f "$path/device/uevent" ]; then
            IS_MALI=1
            MALI_PATH="$path"
            break
        fi
    done

    # Búsqueda dinámica en /sys/devices/platform/*mali*
    if [ "$IS_MALI" -eq 0 ]; then
        for dyn_mali in /sys/devices/platform/*mali* /sys/class/devfreq/*mali*; do
            if [ -d "$dyn_mali" ]; then
                IS_MALI=1
                MALI_PATH="$dyn_mali"
                break
            fi
        done
    fi

    EGL_HARDWARE=$(getprop ro.hardware.egl 2>/dev/null)
    VK_HARDWARE=$(getprop ro.hardware.vulkan 2>/dev/null)
    BOARD_PLATFORM=$(getprop ro.board.platform 2>/dev/null)

    log_info "Verificación Mali: Ruta=[${MALI_PATH:-ninguna}], EGL=[${EGL_HARDWARE:-na}], Vulkan=[${VK_HARDWARE:-na}], Plataforma=[${BOARD_PLATFORM:-na}]"

    if [ "$IS_MALI" -eq 1 ] || echo "$EGL_HARDWARE $VK_HARDWARE" | grep -iq "mali"; then
        log_info "Dispositivo confirmado con procesador gráfico Mali compatible."
        return 0
    else
        log_warn "No se detectó un nodo Mali directo; se aplicará modo compatibilidad universal."
        return 1
    fi
}
