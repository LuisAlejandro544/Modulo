#!/system/bin/sh
# ==============================================================================
# Script: surface_tweak.sh
# Módulo: AX Mali Core Engine para AX Manager (Root & No-Root)
# Propósito: Modo Batata / Reducción de Escala de Renderizado (25%, 50%, 70%)
#            vía Game Mode / Game Overlay oficial de Android 12+ (SDK >= 31).
# ==============================================================================
# REGLAS DE INTEGRIDAD:
# - Funciona al 100% tanto con Root como sin Root (ADB Shell / AX Manager).
# - Exclusivo Android 12+ (SDK >= 31). Bloqueado en versiones inferiores.
# - Eliminado setprop placebo debug.mali.render_scale.
# - Respalda cualquier game_overlay previo antes de modificarlo y preserva
#   useAngle=true si el usuario ya tenía ANGLE activado.
# ==============================================================================

SCRIPT_DIR=$(dirname "$0")
POTATO_STATUS="/data/local/tmp/mali_potato_status.state"
POTATO_BACKUP="/data/local/tmp/mali_potato_backup.state"

if [ -f "$SCRIPT_DIR/mali_common.sh" ]; then
    . "$SCRIPT_DIR/mali_common.sh"
else
    log_info() { echo "[INFO] $1"; }
    log_warn() { echo "[AVISO] $1"; }
    log_error() { echo "[ERROR] $1"; }
    has_root() { [ "$(id -u 2>/dev/null)" = "0" ]; }
fi

# ==============================================================================
# 1. Comprobación Estricta de Versión de Android (SDK >= 31 / Android 12+)
# ==============================================================================
check_android_version() {
    SDK_VER=$(getprop ro.build.version.sdk 2>/dev/null)
    RELEASE_VER=$(getprop ro.build.version.release 2>/dev/null)
    SDK_NUM=${SDK_VER:-0}

    log_info "Comprobando versión del sistema: Android $RELEASE_VER (API SDK $SDK_NUM)"

    if [ "$SDK_NUM" -lt 31 ] 2>/dev/null; then
        log_error "BLOQUEO DE SEGURIDAD ACTIVO: El Modo Batata requiere Android 12 (API 31) o superior."
        return 1
    fi

    return 0
}

# ==============================================================================
# 2. Validación de Paquete y Factor de Escala
# ==============================================================================
sanitize_pkg() {
    echo "$1" | tr -cd 'a-zA-Z0-9._'
}

resolve_package() {
    INPUT_PKG=$(sanitize_pkg "$1")
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
        com.roblox.client; do
        if pm path "$PKG" >/dev/null 2>&1; then
            echo "$PKG"
            return
        fi
    done
    echo "com.dts.freefireth"
}

# ==============================================================================
# 3. Activación del Modo Batata (25%, 50%, 70%)
# ==============================================================================
enable_potato_mode() {
    SCALE_FACTOR="${1:-0.5}"
    TARGET_PKG="${2:-auto}"
    FORCE_RESTART="${3:-0}"

    if ! check_android_version; then
        echo "ERROR_SECURITY_BLOCKED: Requiere Android 12 o superior."
        exit 2
    fi

    PKG=$(resolve_package "$TARGET_PKG")
    if ! pm path "$PKG" >/dev/null 2>&1; then
        log_error "El paquete $PKG no está instalado en el dispositivo."
        echo "ERROR_PACKAGE_NOT_FOUND: $PKG no está instalado."
        return 1
    fi

    case "$SCALE_FACTOR" in
        0.25|25|extreme|ultra)
            FACTOR="0.25"
            LABEL="Modo Batata Extremo Ultra (25%)"
            ;;
        0.5|50|potato|batata)
            FACTOR="0.5"
            LABEL="Modo Batata Clásico (50%)"
            ;;
        0.7|70|comp|competitivo)
            FACTOR="0.7"
            LABEL="Modo Competitivo (70%)"
            ;;
        0.3|0.4|0.6|0.75|0.8|0.9)
            FACTOR="$SCALE_FACTOR"
            LABEL="Modo Batata Personalizado ($SCALE_FACTOR)"
            ;;
        *)
            FACTOR="0.5"
            LABEL="Modo Batata Clásico (50%)"
            ;;
    esac

    # Respaldar overlay previo si existía
    if [ ! -f "$POTATO_BACKUP" ]; then
        PREV_OVERLAY=$(device_config get game_overlay "$PKG" 2>/dev/null)
        cat <<EOF > "$POTATO_BACKUP"
PREV_PKG=$PKG
PREV_OVERLAY=${PREV_OVERLAY:-null}
EOF
    fi

    # Preservar useAngle=true si ya estaba habilitado en el overlay
    USE_ANGLE="false"
    EXISTING_OVERLAY=$(device_config get game_overlay "$PKG" 2>/dev/null)
    if echo "$EXISTING_OVERLAY" | grep -q "useAngle=true"; then
        USE_ANGLE="true"
    fi

    cmd game reset-mode "$PKG" >/dev/null 2>&1
    cmd game mode performance "$PKG" >/dev/null 2>&1
    device_config set_sync_disabled_for_tests persistent >/dev/null 2>&1

    if ! device_config put game_overlay "$PKG" "mode=2,downscaleFactor=${FACTOR}:fps=60:useAngle=${USE_ANGLE}" >/dev/null 2>&1; then
        echo "ERROR: No se pudo escribir device_config game_overlay para $PKG."
        return 1
    fi

    if has_root; then
        setprop debug.egl.force_msaa 0 2>/dev/null
    fi

    if [ "$FORCE_RESTART" = "1" ] || [ "$FORCE_RESTART" = "restart" ]; then
        am force-stop "$PKG" >/dev/null 2>&1
        log_info "Proceso de $PKG cerrado para aplicar escala $FACTOR al próximo inicio."
    fi

    cat <<EOF > "$POTATO_STATUS"
STATUS=1
FACTOR=$FACTOR
PACKAGE=$PKG
LABEL=$LABEL
USE_ANGLE=$USE_ANGLE
TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")
EOF

    echo "SUCCESS: $LABEL activado en $PKG (game_overlay downscaleFactor=$FACTOR)."
}

# ==============================================================================
# 4. Desactivación y Restauración Completa a Gráficos Nativos
# ==============================================================================
disable_potato_mode() {
    TARGET_PKG="${1:-auto}"
    PKG=$(resolve_package "$TARGET_PKG")

    cmd game mode standard "$PKG" >/dev/null 2>&1
    device_config delete game_overlay "$PKG" >/dev/null 2>&1

    if [ -f "$POTATO_STATUS" ]; then
        OLD_PKG=$(grep "^PACKAGE=" "$POTATO_STATUS" | cut -d= -f2)
        if [ -n "$OLD_PKG" ] && [ "$OLD_PKG" != "$PKG" ]; then
            cmd game mode standard "$OLD_PKG" >/dev/null 2>&1
            device_config delete game_overlay "$OLD_PKG" >/dev/null 2>&1
        fi
        rm -f "$POTATO_STATUS" 2>/dev/null
    fi

    if [ -f "$POTATO_BACKUP" ]; then
        . "$POTATO_BACKUP"
        if [ -n "$PREV_OVERLAY" ] && [ "$PREV_OVERLAY" != "null" ]; then
            device_config put game_overlay "$PREV_PKG" "$PREV_OVERLAY" >/dev/null 2>&1
        fi
        rm -f "$POTATO_BACKUP" 2>/dev/null
    fi

    device_config set_sync_disabled_for_tests none >/dev/null 2>&1
    if has_root; then
        setprop debug.egl.force_msaa "" 2>/dev/null
    fi

    echo "SUCCESS: Modo Batata desactivado. Gráficos nativos restaurados al 100%."
}

# ==============================================================================
# 5. Consulta de Estado
# ==============================================================================
get_status() {
    SDK_VER=$(getprop ro.build.version.sdk 2>/dev/null)
    SDK_NUM=${SDK_VER:-0}

    if [ "$SDK_NUM" -ge 31 ] 2>/dev/null; then
        COMPAT="COMPATIBLE_ANDROID_12_PLUS"
    else
        COMPAT="INCOMPATIBLE_BELOW_ANDROID_12"
    fi

    STATUS="0"
    FACTOR="1.0"
    PKG="ninguno"
    LABEL="Inactivo"

    if [ -f "$POTATO_STATUS" ]; then
        STATUS=$(grep "^STATUS=" "$POTATO_STATUS" | cut -d= -f2)
        FACTOR=$(grep "^FACTOR=" "$POTATO_STATUS" | cut -d= -f2)
        PKG=$(grep "^PACKAGE=" "$POTATO_STATUS" | cut -d= -f2)
        LABEL=$(grep "^LABEL=" "$POTATO_STATUS" | cut -d= -f2)
    fi

    echo "POTATO_STATUS=${STATUS:-0}"
    echo "POTATO_COMPAT=$COMPAT"
    echo "POTATO_SDK=$SDK_NUM"
    echo "POTATO_FACTOR=$FACTOR"
    echo "POTATO_PACKAGE=$PKG"
    echo "POTATO_LABEL=$LABEL"
    echo "GAMEBOOSTER_OVERRIDE=ACTIVE"
    echo "SECURITY_RULE=CERO_PERSIST_SYS"
}

list_user_packages() {
    pm list packages -3 2>/dev/null | sed 's/package://' | sort
}

ACTION="${1:-status}"
case "$ACTION" in
    enable|1|on|potato) enable_potato_mode "$2" "$3" "$4" ;;
    disable|0|off|restore) disable_potato_mode "$2" ;;
    status|info) get_status ;;
    list|packages) list_user_packages ;;
    check) check_android_version ;;
    *) echo "Uso: $0 {enable [0.25|0.5|0.7] [pkg] [restart]|disable [pkg]|status|list|check}"; exit 1 ;;
esac
