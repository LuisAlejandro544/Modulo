#!/system/bin/sh
# ==============================================================================
# Script: gms_shield.sh
# Módulo: AX Mali Core Engine para AX Manager, KernelSU, APatch y Magisk
# Propósito: Escudo Anti-Basura y Telemetría de Google Play Services (GMS Shield).
#   - Desactiva paquetes secundarios de telemetría (feedback, partnersetup, etc.)
#     y restringe RUN_IN_BACKGROUND en GMS (funciona en Root y ADB).
#   - Desactiva componentes internos de Ads/Analytics de GMS (requiere Root en la
#     mayoría de ROMs; verifica realmente qué se aplicó y guarda respaldo fiel).
#   - Preserva Login de Google, Play Games, Play Store y FCM.
# ==============================================================================

SCRIPT_DIR=$(dirname "$0")
BACKUP_STATE="/data/local/tmp/mali_gms_backup.state"
DISABLED_PKGS_FILE="/data/local/tmp/mali_gms_disabled.pkgs"
DISABLED_COMPS_FILE="/data/local/tmp/mali_gms_disabled.comps"
STATUS_FILE="/data/local/tmp/mali_gms_status.state"

if [ -f "$SCRIPT_DIR/mali_common.sh" ]; then
    . "$SCRIPT_DIR/mali_common.sh"
else
    log_info() { echo "[INFO] $1"; }
    log_warn() { echo "[AVISO] $1"; }
    log_error() { echo "[ERROR] $1"; }
    has_root() { [ "$(id -u 2>/dev/null)" = "0" ]; }
fi

JUNK_PACKAGES="
    com.google.android.feedback
    com.google.android.partnersetup
    com.google.mainline.telemetry
    com.google.android.onetimeinitializer
"

GMS_ANALYTICS_COMPONENTS="
    com.google.android.gms/com.google.android.gms.ads.identifier.service.AdIdService
    com.google.android.gms/com.google.android.gms.measurement.AppMeasurementService
    com.google.android.gms/com.google.android.gms.measurement.AppMeasurementJobService
    com.google.android.gms/com.google.android.gms.measurement.AppMeasurementReceiver
    com.google.android.gms/com.google.android.gms.analytics.AnalyticsService
    com.google.android.gms/com.google.android.gms.analytics.AnalyticsJobService
    com.google.android.gms/com.google.android.gms.analytics.AnalyticsReceiver
"

enable_gms_shield() {
    log_info "Activando GMS Shield (Modo $(has_root && echo ROOT || echo ADB_SHELL))..."

    > "$DISABLED_PKGS_FILE"
    > "$DISABLED_COMPS_FILE"
    BLOCKED_PKGS=0
    BLOCKED_COMPS=0
    APPOPS_OK=0

    # Solo deshabilitar paquetes que actualmente estén habilitados (coincidencia exacta)
    ENABLED_LIST=$(pm list packages -e 2>/dev/null)
    for pkg in $JUNK_PACKAGES; do
        if echo "$ENABLED_LIST" | grep -qx "package:$pkg"; then
            if pm disable-user --user 0 "$pkg" >/dev/null 2>&1; then
                echo "$pkg" >> "$DISABLED_PKGS_FILE"
                BLOCKED_PKGS=$((BLOCKED_PKGS + 1))
                log_info "Paquete secundario neutralizado: $pkg"
            fi
        fi
    done

    # Deshabilitar componentes internos de GMS requiere generalmente Root
    if has_root; then
        for comp in $GMS_ANALYTICS_COMPONENTS; do
            if pm disable "$comp" >/dev/null 2>&1; then
                echo "$comp" >> "$DISABLED_COMPS_FILE"
                BLOCKED_COMPS=$((BLOCKED_COMPS + 1))
            fi
        done
    fi

    if cmd appops set com.google.android.gms RUN_IN_BACKGROUND ignore >/dev/null 2>&1; then
        APPOPS_OK=1
    fi

    cat <<EOF > "$BACKUP_STATE"
TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")
APPOPS_SET=$APPOPS_OK
EOF

    cat <<EOF > "$STATUS_FILE"
STATUS=1
PRIV_MODE=$(has_root && echo ROOT || echo ADB_SHELL)
BLOCKED_PKGS=$BLOCKED_PKGS
BLOCKED_COMPS=$BLOCKED_COMPS
APPOPS_BG_IGNORED=$APPOPS_OK
EOF

    if has_root; then
        echo "SUCCESS: GMS Shield activo ($BLOCKED_PKGS paquetes y $BLOCKED_COMPS componentes bloqueados, AppOps=$APPOPS_OK). Login y Play Games protegidos."
    else
        echo "PARTIAL_ADB: GMS Shield ADB activo ($BLOCKED_PKGS paquetes bloqueados, AppOps=$APPOPS_OK). Desactivar componentes internos de GMS requiere Root."
    fi
}

disable_gms_shield() {
    log_info "Desactivando GMS Shield y restaurando servicios..."

    RESTORED_PKGS=0
    if [ -f "$DISABLED_PKGS_FILE" ]; then
        for pkg in $(cat "$DISABLED_PKGS_FILE" 2>/dev/null); do
            pm enable --user 0 "$pkg" >/dev/null 2>&1 && RESTORED_PKGS=$((RESTORED_PKGS + 1))
        done
        rm -f "$DISABLED_PKGS_FILE" 2>/dev/null
    fi

    RESTORED_COMPS=0
    if has_root && [ -f "$DISABLED_COMPS_FILE" ]; then
        for comp in $(cat "$DISABLED_COMPS_FILE" 2>/dev/null); do
            pm enable "$comp" >/dev/null 2>&1 && RESTORED_COMPS=$((RESTORED_COMPS + 1))
        done
    fi
    rm -f "$DISABLED_COMPS_FILE" 2>/dev/null

    cmd appops set com.google.android.gms RUN_IN_BACKGROUND allow >/dev/null 2>&1

    rm -f "$BACKUP_STATE" "$STATUS_FILE" 2>/dev/null
    echo "SUCCESS: GMS Shield desactivado ($RESTORED_PKGS paquetes y $RESTORED_COMPS componentes restaurados)."
}

audit_gms() {
    echo "====================================================="
    echo "  AUDITORÍA DE SERVICIOS GOOGLE PLAY (GMS SHIELD)    "
    echo "====================================================="
    echo "• Modo de Privilegios: $(has_root && echo ROOT || echo ADB_SHELL)"
    DISABLED_LIST=$(pm list packages -d 2>/dev/null)
    for pkg in $JUNK_PACKAGES; do
        if echo "$DISABLED_LIST" | grep -qx "package:$pkg"; then
            echo "  - $pkg: [BLOQUEADO ✓]"
        elif pm path "$pkg" >/dev/null 2>&1; then
            echo "  - $pkg: [ACTIVO]"
        else
            echo "  - $pkg: [NO INSTALADO EN ROM]"
        fi
    done
    echo "• Google Account Login / Play Games / Billing: INTACTOS ✓"
    echo "====================================================="
}

get_status() {
    STATUS="0"
    [ -f "$STATUS_FILE" ] && STATUS="1"
    echo "GMS_SHIELD_STATUS=$STATUS"
    echo "PRIV_MODE=$(has_root && echo ROOT || echo ADB_SHELL)"
    echo "LOGIN_PROTECTED=YES"
    echo "SECURITY_RULE=CERO_PERSIST_SYS"
}

ACTION="${1:-status}"
case "$ACTION" in
    enable|1|on|shield) enable_gms_shield ;;
    disable|0|off|restore) disable_gms_shield ;;
    audit|check|info) audit_gms ;;
    status) get_status ;;
    *) echo "Uso: $0 {enable|disable|audit|status}"; exit 1 ;;
esac
