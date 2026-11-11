#!/system/bin/sh
# ==============================================================================
# Script: mali_common.sh
# Propósito: Librería de funciones comunes, detección de arquitectura (32/64 bits)
#            y utilidades de registro para el módulo Mali en AX Manager.
# ==============================================================================
# REGLA ESTRICTA DE SEGURIDAD:
# NUNCA se utiliza ni se modificará ninguna propiedad persistente de sistema.
# ==============================================================================

# Directorios de trabajo y rutas de logs
MODDIR="${MODDIR:-$(dirname "$0")/..}"
LOG_FILE="/data/local/tmp/ax_mali_optimizer.log"
DATE_TAG=$(date +"%Y-%m-%d %H:%M:%S")

# Función para registrar mensajes en consola y archivo de registro temporal
log_info() {
    echo "[${DATE_TAG}] [INFO] $1"
    echo "[${DATE_TAG}] [INFO] $1" >> "$LOG_FILE" 2>/dev/null
}

log_warn() {
    echo "[${DATE_TAG}] [AVISO] $1"
    echo "[${DATE_TAG}] [AVISO] $1" >> "$LOG_FILE" 2>/dev/null
}

log_error() {
    echo "[${DATE_TAG}] [ERROR] $1"
    echo "[${DATE_TAG}] [ERROR] $1" >> "$LOG_FILE" 2>/dev/null
}

# ==============================================================================
# Detección de Arquitectura de CPU/Sistema (32-bit vs 64-bit)
# ==============================================================================
# Comprueba la ABI principal y secundaria del dispositivo Android para asegurar
# que cualquier instrucción o comando futuro se ejecute con total compatibilidad.
detect_architecture() {
    PRIMARY_ABI=$(getprop ro.product.cpu.abi)
    ABI_LIST=$(getprop ro.product.cpu.abilist)

    log_info "Detectando arquitectura de CPU..."
    log_info "ABI principal detectada: $PRIMARY_ABI"
    log_info "Lista de ABIs soportadas: $ABI_LIST"

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
# Inspecciona el hardware gráfico sin poner en riesgo el sistema.
# Busca nodos típicos de GPU Mali en /sys/class/ y propiedades públicas de EGL.
detect_mali_gpu() {
    IS_MALI=0
    MALI_PATH=""

    # 1. Comprobar nodos comunes del kernel para Mali (Midgard, Bifrost, Valhall)
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

    # 2. Comprobar propiedad de EGL o hardware de visualización
    EGL_HARDWARE=$(getprop ro.hardware.egl)
    BOARD_PLATFORM=$(getprop ro.board.platform)

    log_info "Verificación Mali: Ruta base=[$MALI_PATH], EGL=[$EGL_HARDWARE], Plataforma=[$BOARD_PLATFORM]"

    if [ "$IS_MALI" -eq 1 ] || echo "$EGL_HARDWARE" | grep -iq "mali"; then
        log_info "Dispositivo confirmado con procesador gráfico Mali compatible."
        return 0
    else
        log_warn "No se detectó un nodo Mali directo, pero el módulo se adaptará a compatibilidad universal."
        return 1
    fi
}
