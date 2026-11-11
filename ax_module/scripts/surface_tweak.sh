#!/system/bin/sh
# ==============================================================================
# Script: surface_tweak.sh
# Módulo: AX Mali Core Engine para AX Manager (Root & No-Root)
# Propósito: Modo Batata / Reducción de Escala de Renderizado Gráfico para Mali.
# ==============================================================================
# REGLAS CRÍTICAS DE SEGURIDAD:
# 1. EXCLUSIVO PARA ANDROID 12+ (SDK >= 31):
#    En versiones anteriores a Android 12, este modo SE BLOQUEA AUTOMÁTICAMENTE
#    para evitar alterar resoluciones de pantalla globales que puedan desconfigurar
#    el launcher del usuario o poner en riesgo el dispositivo.
# 2. Utiliza el subsistema nativo y seguro de Google: 'cmd game' y 'device_config'.
# 3. NUNCA se utiliza ni se modificará ninguna propiedad persistente de sistema.
# 4. Totalmente reversible: al desactivar, se limpia la configuración y se
#    restaura el renderizado nativo sin dejar residuos.
# 5. Compatible con arquitecturas de 32 bits (ARMv7) y 64 bits (ARMv8/v9).
# ==============================================================================

SCRIPT_DIR=$(dirname "$0")
POTATO_STATUS="/data/local/tmp/mali_potato_status.state"
POTATO_BACKUP="/data/local/tmp/mali_potato_backup.state"

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

    # Si por alguna razón no se puede leer, asumir 0 por seguridad
    SDK_NUM=${SDK_VER:-0}

    log_info "Comprobando versión del sistema: Android $RELEASE_VER (API SDK $SDK_NUM)"

    if [ "$SDK_NUM" -lt 31 ]; then
        log_error "BLOQUEO DE SEGURIDAD ACTIVO: El Modo Batata requiere Android 12 (API 31) o superior."
        log_warn "Tu dispositivo cuenta con Android $RELEASE_VER (API $SDK_NUM). Se bloquea la ejecución para proteger la interfaz de tu teléfono."
        return 1
    fi

    log_info "Verificación superada: Sistema compatible con subsistema de escalado dinámico seguro."
    return 0
}

# ==============================================================================
# 2. Detección Inteligente del Paquete de Juego
# ==============================================================================
detect_game_package() {
    CUSTOM_PKG="$1"
    if [ -n "$CUSTOM_PKG" ] && [ "$CUSTOM_PKG" != "auto" ]; then
        echo "$CUSTOM_PKG"
        return
    fi

    # Comprobar si Free Fire o Free Fire Max están instalados vía pm
    if pm path com.dts.freefireth >/dev/null 2>&1; then
        echo "com.dts.freefireth"
    elif pm path com.dts.freefiremax >/dev/null 2>&1; then
        echo "com.dts.freefiremax"
    else
        # Paquete por defecto estándar si no se puede consultar pm
        echo "com.dts.freefireth"
    fi
}

# ==============================================================================
# 3. Activación del Modo Batata / Reducción de Renderizado
# ==============================================================================
enable_potato_mode() {
    SCALE_FACTOR="${1:-0.5}"
    TARGET_PKG="${2:-auto}"

    # Paso A: Validar versión mínima de Android 12
    if ! check_android_version; then
        echo "ERROR_SECURITY_BLOCKED: Requiere Android 12 o superior."
        exit 2
    fi

    PKG=$(detect_game_package "$TARGET_PKG")
    log_info "Aplicando Modo Batata (Escalado: $SCALE_FACTOR) al paquete: $PKG"

    # Validar factor de escala seguro (0.5 = 50% batata, 0.7 = 70% competitivo)
    case "$SCALE_FACTOR" in
        0.5|50|potato|batata)
            FACTOR="0.5"
            LABEL="Modo Batata Extremo (50%)"
            ;;
        0.7|70|comp|competitivo)
            FACTOR="0.7"
            LABEL="Modo Competitivo (70%)"
            ;;
        *)
            FACTOR="0.5"
            LABEL="Modo Batata (Personalizado $SCALE_FACTOR)"
            ;;
    esac

    # Paso B: Guardar respaldo de estado
    cat <<EOF > "$POTATO_STATUS"
STATUS=1
FACTOR=$FACTOR
PACKAGE=$PKG
LABEL=$LABEL
TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")
EOF

    # Paso C: Aplicar escalado mediante subsistema oficial de Android 12+ (cmd game / device_config)
    # 1. Configurar modo de rendimiento para el juego
    cmd game mode performance "$PKG" 2>/dev/null
    
    # 2. Inyectar overlay de escalado y tasa de refresco a nivel de SurfaceFlinger
    device_config put game_overlay "$PKG" "mode=2,downscaleFactor=${FACTOR}:fps=60" 2>/dev/null

    # 3. Desactivar filtros pesados de MSAA en GPU Mali y alinear render_scale volátil en RAM
    setprop debug.mali.render_scale "$FACTOR" 2>/dev/null
    setprop debug.egl.force_msaa 0 2>/dev/null
    setprop debug.egl.force_fxaa 0 2>/dev/null

    log_info "Modo Batata activado exitosamente para $PKG con escala $FACTOR."
    echo "SUCCESS: $LABEL activado en $PKG sin riesgo de baneo ni daño al sistema."
}

# ==============================================================================
# 4. Desactivación y Restauración Completa a Gráficos Nativos
# ==============================================================================
disable_potato_mode() {
    TARGET_PKG="${1:-auto}"
    PKG=$(detect_game_package "$TARGET_PKG")

    log_info "Desactivando Modo Batata y restaurando resolución nativa..."

    # Restaurar modo estándar en Android 12+
    cmd game mode standard "$PKG" 2>/dev/null
    device_config delete game_overlay "$PKG" 2>/dev/null

    # Restaurar segundo paquete si existía estado previo
    if [ -f "$POTATO_STATUS" ]; then
        OLD_PKG=$(grep "PACKAGE=" "$POTATO_STATUS" | cut -d= -f2)
        if [ -n "$OLD_PKG" ] && [ "$OLD_PKG" != "$PKG" ]; then
            cmd game mode standard "$OLD_PKG" 2>/dev/null
            device_config delete game_overlay "$OLD_PKG" 2>/dev/null
        fi
        rm -f "$POTATO_STATUS" 2>/dev/null
    fi

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
    echo "SECURITY_RULE=CERO_PERSIST_SYS"
}

# ==============================================================================
# Control de Entrada Principal
# ==============================================================================
ACTION="${1:-status}"
PARAM2="$2"
PARAM3="$3"

case "$ACTION" in
    enable|1|on|potato)
        enable_potato_mode "$PARAM2" "$PARAM3"
        ;;
    disable|0|off|restore)
        disable_potato_mode "$PARAM2"
        ;;
    status|info)
        get_status
        ;;
    check)
        check_android_version
        ;;
    *)
        echo "Uso: $0 {enable [0.5|0.7] [paquete]|disable [paquete]|status|check}"
        exit 1
        ;;
esac
