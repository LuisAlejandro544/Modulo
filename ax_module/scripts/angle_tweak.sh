#!/system/bin/sh
# ==============================================================================
# Script: angle_tweak.sh
# Módulo: AX Mali Core Engine para AX Manager, KernelSU, APatch y Magisk
# Propósito: Forzar Backend Gráfico ANGLE (OpenGL ES traducido a Vulkan) para juegos.
# REQUISITO OBLIGATORIO DE HARDWARE:
#   - El dispositivo DEBE soportar Vulkan 1.1 o superior (versión >= 4198400 / 0x401000).
#   - Si el teléfono solo tiene Vulkan 1.0 o no tiene Vulkan, este modo SE BLOQUEA
#     AUTOMÁTICAMENTE por defecto para evitar pantallas negras o cierres forzados.
# ==============================================================================
# REGLAS CRÍTICAS DE SEGURIDAD:
# - CERO propiedades permanentes en disco (100% volátil en memoria y global settings).
# - 100% Reversible: Respaldo en /data/local/tmp/mali_angle_backup.state.
# - Compatible con arquitecturas 32-bit (armeabi-v7a) y 64-bit (arm64-v8a).
# ==============================================================================

SCRIPT_DIR=$(dirname "$0")
BACKUP_STATE="/data/local/tmp/mali_angle_backup.state"
STATUS_FILE="/data/local/tmp/mali_angle_status.state"

# Cargar funciones comunes si están disponibles
if [ -f "$SCRIPT_DIR/mali_common.sh" ]; then
    . "$SCRIPT_DIR/mali_common.sh"
else
    log_info() { echo "[INFO] $1"; }
    log_warn() { echo "[AVISO] $1"; }
    log_error() { echo "[ERROR] $1"; }
fi

# ==============================================================================
# 1. Comprobación Estricta de Versión de Vulkan (Mínimo Vulkan 1.1 requerido)
# ==============================================================================
check_vulkan_support() {
    # 1. Consultar el feature oficial de Android: android.hardware.vulkan.version
    RAW_FEAT=$(pm list features 2>/dev/null | grep -i "android.hardware.vulkan.version")
    VK_VER_INT=$(echo "$RAW_FEAT" | cut -d= -f2 | tr -dc '0-9')

    # Si no se detectó o está vacío, verificar driver ro.hardware.vulkan
    if [ -z "$VK_VER_INT" ]; then
        VK_DRIVER=$(getprop ro.hardware.vulkan 2>/dev/null)
        if [ -z "$VK_DRIVER" ]; then
            log_error "BLOQUEO DE SEGURIDAD: No se detectó soporte de Vulkan en este dispositivo."
            return 1
        fi
        VK_VER_INT=0
    fi

    # Decodificación de versión empaquetada de Android / Khronos:
    # Major: version >> 22
    # Minor: (version >> 12) & 0x3FF
    # Vulkan 1.0 = 4194304 (0x400000)
    # Vulkan 1.1 = 4198400 (0x401000) o superior
    MIN_VK_1_1=4198400

    MAJOR=$(( VK_VER_INT / 4194304 ))
    REMAINDER=$(( VK_VER_INT % 4194304 ))
    MINOR=$(( REMAINDER / 4096 ))
    PATCH=$(( REMAINDER % 4096 ))

    log_info "Versión Vulkan detectada: $MAJOR.$MINOR.$PATCH (Código numérico: $VK_VER_INT)"

    if [ "$VK_VER_INT" -lt "$MIN_VK_1_1" ]; then
        log_error "BLOQUEO DE SEGURIDAD: Se requiere como mínimo Vulkan 1.1 para activar ANGLE sin errores."
        log_warn "Tu teléfono reporta Vulkan $MAJOR.$MINOR.$PATCH (inferior a 1.1). ANGLE desactivado por defecto para proteger tu juego."
        return 2
    fi

    log_info "Verificación superada: El dispositivo cuenta con Vulkan $MAJOR.$MINOR.$PATCH (>= 1.1)."
    return 0
}

# ==============================================================================
# 2. Resolución de Paquete de Juego
# ==============================================================================
resolve_package() {
    INPUT_PKG="$1"
    if [ -n "$INPUT_PKG" ] && [ "$INPUT_PKG" != "auto" ]; then
        echo "$INPUT_PKG"
        return
    fi
    if pm path com.dts.freefireth >/dev/null 2>&1; then
        echo "com.dts.freefireth"
    elif pm path com.dts.freefiremax >/dev/null 2>&1; then
        echo "com.dts.freefiremax"
    elif pm path com.tencent.ig >/dev/null 2>&1; then
        echo "com.tencent.ig"
    elif pm path com.activision.callofduty.shooter >/dev/null 2>&1; then
        echo "com.activision.callofduty.shooter"
    else
        echo "com.dts.freefireth"
    fi
}

# ==============================================================================
# 3. Respaldo de Configuración Previa de ANGLE
# ==============================================================================
backup_angle_settings() {
    if [ ! -f "$BACKUP_STATE" ]; then
        log_info "Creando respaldo de configuración previa de ANGLE en el sistema..."
        ORIG_PKGS=$(settings get global angle_gl_driver_selection_pkgs 2>/dev/null)
        ORIG_VALS=$(settings get global angle_gl_driver_selection_values 2>/dev/null)
        ORIG_ALL=$(settings get global angle_gl_driver_all_angle 2>/dev/null)

        cat <<EOF > "$BACKUP_STATE"
ORIG_PKGS=${ORIG_PKGS:-""}
ORIG_VALS=${ORIG_VALS:-""}
ORIG_ALL=${ORIG_ALL:-0}
TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")
EOF
        log_info "Respaldo ANGLE guardado en $BACKUP_STATE"
    fi
}

# ==============================================================================
# 4. Activación de ANGLE (Vulkan Backend)
# ==============================================================================
enable_angle() {
    TARGET_PKG="${1:-auto}"
    FORCE_RESTART="${2:-0}"

    if ! check_vulkan_support; then
        echo "ERROR_VULKAN_1_1_REQUIRED: Tu dispositivo no cuenta con soporte mínimo para Vulkan 1.1. Modo bloqueado por seguridad."
        exit 2
    fi

    PKG=$(resolve_package "$TARGET_PKG")
    log_info "Configurando ANGLE (Vulkan Layer) para el paquete: $PKG..."

    backup_angle_settings

    # Paso A: Configurar el controlador ANGLE de Google para el paquete especificado
    settings put global angle_gl_driver_selection_pkgs "$PKG" 2>/dev/null
    settings put global angle_gl_driver_selection_values "angle" 2>/dev/null

    # Paso B: Habilitar opciones de desarrollador para ANGLE si están ocultas
    setprop debug.graphics.angle.developeroption.enable true 2>/dev/null

    # Paso C: Si existe un overlay de game_overlay activo, actualizar useAngle=true
    CURRENT_OVERLAY=$(device_config get game_overlay "$PKG" 2>/dev/null)
    if [ -n "$CURRENT_OVERLAY" ] && [ "$CURRENT_OVERLAY" != "null" ]; then
        UPDATED_OVERLAY=$(echo "$CURRENT_OVERLAY" | sed 's/useAngle=false/useAngle=true/g')
        device_config put game_overlay "$PKG" "$UPDATED_OVERLAY" 2>/dev/null
    fi

    # Paso D: Si se solicita reinicio del juego
    if [ "$FORCE_RESTART" = "1" ] || [ "$FORCE_RESTART" = "restart" ]; then
        am force-stop "$PKG" 2>/dev/null
        log_info "Proceso de $PKG reiniciado para que cargue la biblioteca libGLESv2_angle.so (Vulkan)."
    fi

    cat <<EOF > "$STATUS_FILE"
STATUS=1
PACKAGE=$PKG
DRIVER=ANGLE_VULKAN
VULKAN_MIN_1_1=PASSED
TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")
EOF

    echo "SUCCESS: Capa ANGLE (Vulkan) activada con éxito para $PKG. Vulkan 1.1 verificado."
}

# ==============================================================================
# 5. Desactivación y Restauración a OpenGL ES Nativo
# ==============================================================================
disable_angle() {
    TARGET_PKG="${1:-auto}"
    PKG=$(resolve_package "$TARGET_PKG")

    log_info "Desactivando ANGLE y restaurando controlador nativo OpenGL ES para $PKG..."

    if [ -f "$BACKUP_STATE" ]; then
        . "$BACKUP_STATE"
        if [ -n "$ORIG_PKGS" ]; then
            settings put global angle_gl_driver_selection_pkgs "$ORIG_PKGS" 2>/dev/null
            settings put global angle_gl_driver_selection_values "$ORIG_VALS" 2>/dev/null
        else
            settings delete global angle_gl_driver_selection_pkgs 2>/dev/null
            settings delete global angle_gl_driver_selection_values 2>/dev/null
        fi
    else
        settings delete global angle_gl_driver_selection_pkgs 2>/dev/null
        settings delete global angle_gl_driver_selection_values 2>/dev/null
    fi

    # Restaurar useAngle=false en game_overlay si existe
    CURRENT_OVERLAY=$(device_config get game_overlay "$PKG" 2>/dev/null)
    if [ -n "$CURRENT_OVERLAY" ] && [ "$CURRENT_OVERLAY" != "null" ]; then
        UPDATED_OVERLAY=$(echo "$CURRENT_OVERLAY" | sed 's/useAngle=true/useAngle=false/g')
        device_config put game_overlay "$PKG" "$UPDATED_OVERLAY" 2>/dev/null
    fi

    setprop debug.graphics.angle.developeroption.enable "" 2>/dev/null

    rm -f "$STATUS_FILE" 2>/dev/null
    echo "SUCCESS: ANGLE desactivado. Controlador de gráficos restaurado al OpenGL ES nativo."
}

# ==============================================================================
# 6. Diagnóstico y Estado en Tiempo Real
# ==============================================================================
diagnose_angle() {
    echo "====================================================="
    echo "  DIAGNÓSTICO VULKAN & CAPA ANGLE (OPENGL -> VULKAN) "
    echo "====================================================="

    RAW_FEAT=$(pm list features 2>/dev/null | grep -i "android.hardware.vulkan.version")
    VK_VER_INT=$(echo "$RAW_FEAT" | cut -d= -f2 | tr -dc '0-9')
    VK_VER_INT=${VK_VER_INT:-0}

    MAJOR=$(( VK_VER_INT / 4194304 ))
    REMAINDER=$(( VK_VER_INT % 4194304 ))
    MINOR=$(( REMAINDER / 4096 ))
    PATCH=$(( REMAINDER % 4096 ))

    echo "• Soporte Vulkan Hardware: $MAJOR.$MINOR.$PATCH (Código: $VK_VER_INT)"
    if [ "$VK_VER_INT" -ge 4198400 ]; then
        echo "• Estado Vulkan 1.1+: COMPATIBLE ✓ (Cumple requisito mínimo)"
    else
        echo "• Estado Vulkan 1.1+: NO COMPATIBLE ✗ (Requiere Vulkan 1.1+ para ANGLE)"
    fi

    EGL_HW=$(getprop ro.hardware.egl 2>/dev/null)
    VK_HW=$(getprop ro.hardware.vulkan 2>/dev/null)
    echo "• Controlador EGL: ${EGL_HW:-desconocido}"
    echo "• Controlador Vulkan: ${VK_HW:-mali}"

    CUR_PKGS=$(settings get global angle_gl_driver_selection_pkgs 2>/dev/null)
    CUR_VALS=$(settings get global angle_gl_driver_selection_values 2>/dev/null)
    echo "• Apps con ANGLE: ${CUR_PKGS:-'Ninguna (OpenGL nativo)'}"
    echo "• Modo de Driver: ${CUR_VALS:-'default'}"
    echo "====================================================="
}

get_status() {
    RAW_FEAT=$(pm list features 2>/dev/null | grep -i "android.hardware.vulkan.version")
    VK_VER_INT=$(echo "$RAW_FEAT" | cut -d= -f2 | tr -dc '0-9')
    VK_VER_INT=${VK_VER_INT:-0}

    VULKAN_1_1="0"
    [ "$VK_VER_INT" -ge 4198400 ] && VULKAN_1_1="1"

    STATUS="0"
    [ -f "$STATUS_FILE" ] && STATUS="1"

    CUR_PKGS=$(settings get global angle_gl_driver_selection_pkgs 2>/dev/null)

    echo "ANGLE_STATUS=$STATUS"
    echo "VULKAN_1_1_SUPPORTED=$VULKAN_1_1"
    echo "VULKAN_VERSION_CODE=$VK_VER_INT"
    echo "TARGET_PACKAGE=${CUR_PKGS:-none}"
    echo "SECURITY_RULE=CERO_PERSIST_SYS"
}

ACTION="${1:-status}"
case "$ACTION" in
    enable|1|on|angle)
        enable_angle "$2" "$3"
        ;;
    disable|0|off|restore)
        disable_angle "$2"
        ;;
    check|vulkan)
        check_vulkan_support
        ;;
    diag|info)
        diagnose_angle
        ;;
    status)
        get_status
        ;;
    *)
        echo "Uso: $0 {enable [pkg] [restart]|disable [pkg]|check|diag|status}"
        exit 1
        ;;
esac
