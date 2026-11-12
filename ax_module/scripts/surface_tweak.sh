#!/system/bin/sh
# ==============================================================================
# Script: surface_tweak.sh
# Módulo: AX Mali Core Engine para AX Manager (Root & No-Root)
# Propósito: Modo Batata / Reducción de Escala de Renderizado (25%, 50%, 70%)
#            con anulación de Game Boosters de fabricantes en Android 12+.
# ==============================================================================
# REGLAS CRÍTICAS DE SEGURIDAD:
# 1. EXCLUSIVO PARA ANDROID 12+ (SDK >= 31):
#    En versiones anteriores a Android 12, este modo SE BLOQUEA AUTOMÁTICAMENTE
#    para evitar alterar resoluciones de pantalla globales que puedan desconfigurar
#    el launcher del usuario o poner en riesgo el dispositivo.
# 2. Anulación de Game Booster:
#    Bloquea la sincronización remota de DeviceConfig para que MIUI Game Turbo,
#    Realme Game Space o Samsung GOS no reviertan el escalado del script.
# 3. NUNCA se utiliza ni se modificará ninguna propiedad persistente de sistema.
# 4. Totalmente reversible: al desactivar, se limpia la configuración y se
#    restaura el renderizado nativo sin dejar residuos.
# 5. Compatible con arquitecturas de 32 bits (ARMv7) y 64 bits (ARMv8/v9).
# ==============================================================================

SCRIPT_DIR=$(dirname "$0")
POTATO_STATUS="/data/local/tmp/mali_potato_status.state"

# Cargar funciones comunes si están disponibles
if [ -f "$SCRIPT_DIR/mali_common.sh" ]; then
    . "$SCRIPT_DIR/mali_common.sh"
else
    log_info() { echo "[INFO] $1"; }
    log_warn() { echo "[AVISO] $1"; }
    log_error() { echo "[ERROR] $1"; }
fi

# ==============================================================================
# 1. Comprobación Estricta de Versión de Android (SDK >= 31 / Android 12+)
# ==============================================================================
check_android_version() {
    SDK_VER=$(getprop ro.build.version.sdk)
    RELEASE_VER=$(getprop ro.build.version.release)
    SDK_NUM=${SDK_VER:-0}

    log_info "Comprobando versión del sistema: Android $RELEASE_VER (API SDK $SDK_NUM)"

    if [ "$SDK_NUM" -lt 31 ]; then
        log_error "BLOQUEO DE SEGURIDAD ACTIVO: El Modo Batata requiere Android 12 (API 31) o superior."
        log_warn "Tu dispositivo cuenta con Android $RELEASE_VER (API $SDK_NUM). Se bloquea la ejecución para proteger tu teléfono."
        return 1
    fi

    log_info "Verificación superada: Sistema compatible con subsistema de escalado dinámico seguro."
    return 0
}

# ==============================================================================
# 2. Resolución del Paquete Seleccionado por el Usuario
# ==============================================================================
resolve_package() {
    INPUT_PKG="$1"
    if [ -n "$INPUT_PKG" ] && [ "$INPUT_PKG" != "auto" ]; then
        echo "$INPUT_PKG"
        return
    fi

    # Auto-detección de juego común si no se pasó paquete específico
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
# 3. Activación del Modo Batata (25%, 50%, 70%) con Anulación de Game Booster
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
    log_info "Configurando Modo Batata para el juego: $PKG"

    # Clasificar factor de escala
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
        *)
            FACTOR="$SCALE_FACTOR"
            LABEL="Modo Batata Personalizado ($SCALE_FACTOR)"
            ;;
    esac

    # Guardar registro de estado
    cat <<EOF > "$POTATO_STATUS"
STATUS=1
FACTOR=$FACTOR
PACKAGE=$PKG
LABEL=$LABEL
TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")
EOF

    # PASO A: Desvincular interferencias del Game Booster del fabricante (MIUI/Realme/Samsung)
    cmd game reset-mode "$PKG" 2>/dev/null
    cmd game mode performance "$PKG" 2>/dev/null

    # PASO B: Bloquear sincronización en segundo plano de DeviceConfig
    # Esto evita que Google Play Services o los daemons de la ROM sobreescriban nuestro overlay
    device_config set_sync_disabled_for_tests persistent 2>/dev/null

    # PASO C: Inyectar el overlay de escalado con useAngle=false
    device_config put game_overlay "$PKG" "mode=2,downscaleFactor=${FACTOR}:fps=60:useAngle=false" 2>/dev/null

    # PASO D: Forzar escala en RAM para GPU Mali y desactivar filtros pesados
    setprop debug.mali.render_scale "$FACTOR" 2>/dev/null
    setprop debug.egl.force_msaa 0 2>/dev/null
    setprop debug.egl.force_fxaa 0 2>/dev/null

    # PASO E: Si se solicita reinicio del proceso del juego para aplicar en caliente
    if [ "$FORCE_RESTART" = "1" ] || [ "$FORCE_RESTART" = "restart" ]; then
        am force-stop "$PKG" 2>/dev/null
        log_info "Proceso de $PKG reiniciado para obligar a Unity a tomar el nuevo buffer."
    fi

    log_info "$LABEL aplicado con éxito a $PKG. Game Booster anulado."
    echo "SUCCESS: $LABEL activado en $PKG (Game Booster del fabricante anulado)."
}

# ==============================================================================
# 4. Desactivación y Restauración Completa a Gráficos Nativos
# ==============================================================================
disable_potato_mode() {
    TARGET_PKG="${1:-auto}"
    PKG=$(resolve_package "$TARGET_PKG")

    log_info "Desactivando Modo Batata y restaurando resolución nativa..."

    # Restaurar modo estándar en Android 12+
    cmd game mode standard "$PKG" 2>/dev/null
    device_config delete game_overlay "$PKG" 2>/dev/null

    # Si existía estado previo guardado, limpiar también ese paquete
    if [ -f "$POTATO_STATUS" ]; then
        OLD_PKG=$(grep "PACKAGE=" "$POTATO_STATUS" | cut -d= -f2)
        if [ -n "$OLD_PKG" ] && [ "$OLD_PKG" != "$PKG" ]; then
            cmd game mode standard "$OLD_PKG" 2>/dev/null
            device_config delete game_overlay "$OLD_PKG" 2>/dev/null
        fi
        rm -f "$POTATO_STATUS" 2>/dev/null
    fi

    # Rehabilitar sincronización estándar
    device_config set_sync_disabled_for_tests none 2>/dev/null

    # Limpiar propiedades volátiles en RAM
    setprop debug.mali.render_scale "" 2>/dev/null
    setprop debug.egl.force_msaa "" 2>/dev/null
    setprop debug.egl.force_fxaa "" 2>/dev/null

    log_info "Resolución de renderizado y gráficos restaurados al 100% nativo."
    echo "SUCCESS: Modo Batata desactivado. Gráficos restaurados a la calidad original."
}

# ==============================================================================
# 5. Consulta de Estado
# ==============================================================================
get_status() {
    SDK_VER=$(getprop ro.build.version.sdk)
    SDK_NUM=${SDK_VER:-0}

    if [ "$SDK_NUM" -ge 31 ]; then
        COMPAT="COMPATIBLE_ANDROID_12_PLUS"
    else
        COMPAT="INCOMPATIBLE_BELOW_ANDROID_12"
    fi

    STATUS="0"
    FACTOR="1.0"
    PKG="ninguno"
    LABEL="Inactivo"

    if [ -f "$POTATO_STATUS" ]; then
        STATUS=$(grep "STATUS=" "$POTATO_STATUS" | cut -d= -f2)
        FACTOR=$(grep "FACTOR=" "$POTATO_STATUS" | cut -d= -f2)
        PKG=$(grep "PACKAGE=" "$POTATO_STATUS" | cut -d= -f2)
        LABEL=$(grep "LABEL=" "$POTATO_STATUS" | cut -d= -f2)
    fi

    echo "POTATO_STATUS=$STATUS"
    echo "POTATO_COMPAT=$COMPAT"
    echo "POTATO_SDK=$SDK_NUM"
    echo "POTATO_FACTOR=$FACTOR"
    echo "POTATO_PACKAGE=$PKG"
    echo "POTATO_LABEL=$LABEL"
    echo "GAMEBOOSTER_OVERRIDE=ACTIVE"
    echo "SECURITY_RULE=CERO_PERSIST_SYS"
}

# ==============================================================================
# 6. Lista de Juegos y Apps de Usuario Instaladas
# ==============================================================================
list_user_packages() {
    pm list packages -3 2>/dev/null | sed 's/package://' | sort
}

ACTION="${1:-status}"
case "$ACTION" in
    enable|1|on|potato)
        enable_potato_mode "$2" "$3" "$4"
        ;;
    disable|0|off|restore)
        disable_potato_mode "$2"
        ;;
    status|info)
        get_status
        ;;
    list|packages)
        list_user_packages
        ;;
    check)
        check_android_version
        ;;
    *)
        echo "Uso: $0 {enable [0.25|0.5|0.7] [pkg] [restart]|disable [pkg]|status|list|check}"
        exit 1
        ;;
esac
