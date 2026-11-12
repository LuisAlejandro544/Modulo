#!/system/bin/sh
# ==============================================================================
# Script: angle_tweak.sh
# Módulo: AX Mali Core Engine para AX Manager, KernelSU, APatch y Magisk
# Propósito: Forzar Backend Gráfico ANGLE (OpenGL ES traducido a Vulkan) para juegos.
# REQUISITO OBLIGATORIO DE HARDWARE:
#   - El dispositivo DEBE soportar Vulkan 1.1 o superior (versión >= 4198400 / 0x401000).
#   - Funciona tanto con Root como sin Root (ADB Shell) vía settings global.
# ==============================================================================
# REGLAS DE INTEGRIDAD:
# - Corrige el parseo de versión Vulkan cuando pm list features devuelve formato
#   hexadecimal (ej. 0x401000) o decimal (4198400).
# - Verifica si la ROM incluye soporte/paquete ANGLE antes de activarlo.
# - Respalda valores previos de forma fiel y valida que settings put tuvo éxito.
# ==============================================================================

SCRIPT_DIR=$(dirname "$0")
BACKUP_STATE="/data/local/tmp/mali_angle_backup.state"
STATUS_FILE="/data/local/tmp/mali_angle_status.state"

if [ -f "$SCRIPT_DIR/mali_common.sh" ]; then
    . "$SCRIPT_DIR/mali_common.sh"
else
    log_info() { echo "[INFO] $1"; }
    log_warn() { echo "[AVISO] $1"; }
    log_error() { echo "[ERROR] $1"; }
    has_root() { [ "$(id -u 2>/dev/null)" = "0" ]; }
fi

# ==============================================================================
# 1. Parseo Seguro (Hexadecimal y Decimal) de Versión Vulkan (Mínimo 1.1)
# ==============================================================================
read_vulkan_version_int() {
    RAW_FEAT=$(pm list features 2>/dev/null | grep -i "android.hardware.vulkan.version" | head -n 1)
    RAW_VAL=$(echo "$RAW_FEAT" | cut -d= -f2 | tr -d ' \r\n')

    if [ -z "$RAW_VAL" ]; then
        echo "0"
        return
    fi

    case "$RAW_VAL" in
        0x*|0X*)
            # Aritmética POSIX/mksh convierte hex a decimal de forma nativa
            echo "$(( RAW_VAL ))" 2>/dev/null || echo "0"
            ;;
        *)
            echo "$RAW_VAL" | tr -dc '0-9'
            ;;
    esac
}

check_angle_binary_present() {
    if pm list packages 2>/dev/null | grep -qiE "angle"; then
        return 0
    fi
    if [ "$(getprop ro.gfx.angle.supported 2>/dev/null)" = "true" ]; then
        return 0
    fi
    if [ -f /system/lib64/libGLESv2_angle.so ] || [ -f /system/lib/libGLESv2_angle.so ] || [ -f /vendor/lib64/egl/libGLES_angle.so ]; then
        return 0
    fi
    return 1
}

check_vulkan_support() {
    VK_VER_INT=$(read_vulkan_version_int)
    VK_VER_INT=${VK_VER_INT:-0}

    if [ "$VK_VER_INT" -eq 0 ] 2>/dev/null; then
        VK_DRIVER=$(getprop ro.hardware.vulkan 2>/dev/null)
        if [ -z "$VK_DRIVER" ]; then
            log_error "BLOQUEO DE SEGURIDAD: No se detectó soporte de Vulkan en este dispositivo."
            return 1
        fi
    fi

    # Vulkan 1.1 = 4198400 (0x401000)
    MIN_VK_1_1=4198400

    MAJOR=$(( VK_VER_INT / 4194304 ))
    REMAINDER=$(( VK_VER_INT % 4194304 ))
    MINOR=$(( REMAINDER / 4096 ))
    PATCH=$(( REMAINDER % 4096 ))

    log_info "Versión Vulkan detectada: $MAJOR.$MINOR.$PATCH (Código numérico: $VK_VER_INT)"

    if [ "$VK_VER_INT" -lt "$MIN_VK_1_1" ] 2>/dev/null; then
        log_error "BLOQUEO DE SEGURIDAD: Se requiere como mínimo Vulkan 1.1 (4198400) para ANGLE."
        return 2
    fi

    return 0
}

resolve_package() {
    INPUT_PKG=$(echo "$1" | tr -cd 'a-zA-Z0-9._')
    if [ -n "$INPUT_PKG" ] && [ "$INPUT_PKG" != "auto" ]; then
        echo "$INPUT_PKG"
        return
    fi
    for PKG in \
        com.dts.freefireth \
        com.dts.freefiremax \
        com.tencent.ig \
        com.activision.callofduty.shooter; do
        if pm path "$PKG" >/dev/null 2>&1; then
            echo "$PKG"
            return
        fi
    done
    echo "com.dts.freefireth"
}

backup_angle_settings() {
    if [ ! -f "$BACKUP_STATE" ]; then
        ORIG_PKGS=$(settings get global angle_gl_driver_selection_pkgs 2>/dev/null)
        ORIG_VALS=$(settings get global angle_gl_driver_selection_values 2>/dev/null)

        cat <<EOF > "$BACKUP_STATE"
ORIG_PKGS=${ORIG_PKGS:-null}
ORIG_VALS=${ORIG_VALS:-null}
TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")
EOF
    fi
}

enable_angle() {
    TARGET_PKG="${1:-auto}"
    FORCE_RESTART="${2:-0}"

    if ! check_vulkan_support; then
        echo "ERROR_VULKAN_1_1_REQUIRED: Tu dispositivo no cuenta con soporte mínimo para Vulkan 1.1. Modo bloqueado por seguridad."
        exit 2
    fi

    PKG=$(resolve_package "$TARGET_PKG")
    if ! pm path "$PKG" >/dev/null 2>&1; then
        echo "ERROR_PACKAGE_NOT_FOUND: $PKG no está instalado."
        return 1
    fi

    ANGLE_WARNING=""
    if ! check_angle_binary_present; then
        ANGLE_WARNING=" (Aviso: tu ROM no reportó paquete/driver ANGLE explícito; si el juego cierra, restaura OpenGL ES nativo)."
        log_warn "No se detectó paquete ANGLE preinstalado; se aplicará la configuración global igualmente."
    fi

    backup_angle_settings

    if ! settings put global angle_gl_driver_selection_pkgs "$PKG" >/dev/null 2>&1 || \
       ! settings put global angle_gl_driver_selection_values "angle" >/dev/null 2>&1; then
        echo "ERROR: No se pudo escribir angle_gl_driver_selection en settings global."
        return 1
    fi

    if has_root; then
        setprop debug.graphics.angle.developeroption.enable true 2>/dev/null
    fi

    CURRENT_OVERLAY=$(device_config get game_overlay "$PKG" 2>/dev/null)
    if [ -n "$CURRENT_OVERLAY" ] && [ "$CURRENT_OVERLAY" != "null" ]; then
        UPDATED_OVERLAY=$(echo "$CURRENT_OVERLAY" | sed 's/useAngle=false/useAngle=true/g')
        device_config put game_overlay "$PKG" "$UPDATED_OVERLAY" >/dev/null 2>&1
    fi

    if [ "$FORCE_RESTART" = "1" ] || [ "$FORCE_RESTART" = "restart" ]; then
        am force-stop "$PKG" >/dev/null 2>&1
    fi

    cat <<EOF > "$STATUS_FILE"
STATUS=1
PACKAGE=$PKG
DRIVER=ANGLE_VULKAN
VULKAN_MIN_1_1=PASSED
TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")
EOF

    echo "SUCCESS: Capa ANGLE (Vulkan) activada para $PKG.${ANGLE_WARNING}"
}

disable_angle() {
    TARGET_PKG="${1:-auto}"
    PKG=$(resolve_package "$TARGET_PKG")

    if [ -f "$BACKUP_STATE" ]; then
        . "$BACKUP_STATE"
        if [ -n "$ORIG_PKGS" ] && [ "$ORIG_PKGS" != "null" ]; then
            settings put global angle_gl_driver_selection_pkgs "$ORIG_PKGS" >/dev/null 2>&1
            settings put global angle_gl_driver_selection_values "$ORIG_VALS" >/dev/null 2>&1
        else
            settings delete global angle_gl_driver_selection_pkgs >/dev/null 2>&1
            settings delete global angle_gl_driver_selection_values >/dev/null 2>&1
        fi
        rm -f "$BACKUP_STATE" 2>/dev/null
    else
        settings delete global angle_gl_driver_selection_pkgs >/dev/null 2>&1
        settings delete global angle_gl_driver_selection_values >/dev/null 2>&1
    fi

    CURRENT_OVERLAY=$(device_config get game_overlay "$PKG" 2>/dev/null)
    if [ -n "$CURRENT_OVERLAY" ] && [ "$CURRENT_OVERLAY" != "null" ]; then
        UPDATED_OVERLAY=$(echo "$CURRENT_OVERLAY" | sed 's/useAngle=true/useAngle=false/g')
        device_config put game_overlay "$PKG" "$UPDATED_OVERLAY" >/dev/null 2>&1
    fi

    if has_root; then
        setprop debug.graphics.angle.developeroption.enable "" 2>/dev/null
    fi

    rm -f "$STATUS_FILE" 2>/dev/null
    echo "SUCCESS: ANGLE desactivado. Controlador restaurado a OpenGL ES nativo."
}

diagnose_angle() {
    echo "====================================================="
    echo "  DIAGNÓSTICO VULKAN & CAPA ANGLE (OPENGL -> VULKAN) "
    echo "====================================================="

    VK_VER_INT=$(read_vulkan_version_int)
    VK_VER_INT=${VK_VER_INT:-0}
    MAJOR=$(( VK_VER_INT / 4194304 ))
    REMAINDER=$(( VK_VER_INT % 4194304 ))
    MINOR=$(( REMAINDER / 4096 ))
    PATCH=$(( REMAINDER % 4096 ))

    echo "• Soporte Vulkan Hardware: $MAJOR.$MINOR.$PATCH (Código: $VK_VER_INT)"
    if [ "$VK_VER_INT" -ge 4198400 ] 2>/dev/null; then
        echo "• Estado Vulkan 1.1+: COMPATIBLE ✓"
    else
        echo "• Estado Vulkan 1.1+: NO COMPATIBLE ✗ (Requiere >= 1.1)"
    fi

    if check_angle_binary_present; then
        echo "• Driver/Paquete ANGLE en ROM: Detectado ✓"
    else
        echo "• Driver/Paquete ANGLE en ROM: No detectado explícitamente"
    fi

    CUR_PKGS=$(settings get global angle_gl_driver_selection_pkgs 2>/dev/null)
    CUR_VALS=$(settings get global angle_gl_driver_selection_values 2>/dev/null)
    echo "• Apps con ANGLE: ${CUR_PKGS:-Ninguna}"
    echo "• Modo de Driver: ${CUR_VALS:-default}"
    echo "====================================================="
}

get_status() {
    VK_VER_INT=$(read_vulkan_version_int)
    VK_VER_INT=${VK_VER_INT:-0}
    VULKAN_1_1="0"
    [ "$VK_VER_INT" -ge 4198400 ] 2>/dev/null && VULKAN_1_1="1"

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
    enable|1|on|angle) enable_angle "$2" "$3" ;;
    disable|0|off|restore) disable_angle "$2" ;;
    check|vulkan) check_vulkan_support ;;
    diag|info) diagnose_angle ;;
    status) get_status ;;
    *) echo "Uso: $0 {enable [pkg] [restart]|disable [pkg]|check|diag|status}"; exit 1 ;;
esac
