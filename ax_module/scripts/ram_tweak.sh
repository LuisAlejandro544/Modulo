#!/system/bin/sh
# ==============================================================================
# Script: ram_tweak.sh
# Módulo: AX Mali Core Engine para AX Manager, KernelSU, APatch y Magisk
# Propósito: Módulo Anti-Stutter de Memoria RAM & ZRAM + Congelador de Procesos
# ==============================================================================
# MODOS DE OPERACIÓN:
# - vm [swappiness]: Aplica solo parámetros de kernel VM (/proc/sys/vm/*).
#   Seguro para ejecutar al arranque sin congelar apps de mensajería/sistema.
# - enable [swappiness]: Aplica parámetros VM + congela apps secundarias con SIGSTOP
#   (pensado para activarse bajo demanda antes de jugar).
# - freeze / thaw: Congela o reanuda apps de terceros con verificación real.
# - audit: Inspecciona /proc/meminfo, /proc/swaps y parámetros VM (Funciona en Root & ADB).
# ==============================================================================
# REGLAS DE INTEGRIDAD:
# - Cero propiedades permanentes de sistema.
# - Eliminado echo 0 > /proc/sys/vm/compact_memory (no tiene efecto).
# - Verifica Root real antes de escribir en /proc/sys/vm/ o enviar kill -STOP.
# - Whitelist estricta: nunca congela launcher, teclado, GMS, gestor ni app activa.
# ==============================================================================

SCRIPT_DIR=$(dirname "$0")
BACKUP_STATE="/data/local/tmp/mali_ram_backup.state"
STATUS_FILE="/data/local/tmp/mali_ram_status.state"
FROZEN_PIDS_FILE="/data/local/tmp/mali_ram_frozen.pids"
FROZEN_PKGS_FILE="/data/local/tmp/mali_ram_frozen.pkgs"

if [ -f "$SCRIPT_DIR/mali_common.sh" ]; then
    . "$SCRIPT_DIR/mali_common.sh"
else
    log_info() { echo "[INFO] $1"; }
    log_warn() { echo "[AVISO] $1"; }
    log_error() { echo "[ERROR] $1"; }
    has_root() { [ "$(id -u 2>/dev/null)" = "0" ]; }
fi

# ==============================================================================
# 1. Respaldo de Valores Previos del Kernel
# ==============================================================================
backup_ram_settings() {
    if [ ! -f "$BACKUP_STATE" ]; then
        log_info "Creando respaldo de parámetros de memoria virtual..."
        ORIG_SWAPPINESS=$(cat /proc/sys/vm/swappiness 2>/dev/null)
        ORIG_VFS_PRESSURE=$(cat /proc/sys/vm/vfs_cache_pressure 2>/dev/null)
        ORIG_PAGE_CLUSTER=$(cat /proc/sys/vm/page-cluster 2>/dev/null)
        ORIG_DIRTY_RATIO=$(cat /proc/sys/vm/dirty_ratio 2>/dev/null)
        ORIG_DIRTY_BG=$(cat /proc/sys/vm/dirty_background_ratio 2>/dev/null)

        cat <<EOF > "$BACKUP_STATE"
ORIG_SWAPPINESS=${ORIG_SWAPPINESS:-100}
ORIG_VFS_PRESSURE=${ORIG_VFS_PRESSURE:-100}
ORIG_PAGE_CLUSTER=${ORIG_PAGE_CLUSTER:-3}
ORIG_DIRTY_RATIO=${ORIG_DIRTY_RATIO:-20}
ORIG_DIRTY_BG=${ORIG_DIRTY_BG:-10}
TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")
EOF
    fi
}

# ==============================================================================
# 2. Ajuste de Parámetros de Memoria Virtual (/proc/sys/vm/* - Solo Root)
# ==============================================================================
apply_vm_tuning() {
    TARGET_SWAPPINESS="${1:-50}"
    VM_APPLIED=0

    if ! has_root; then
        log_warn "Ajustes de /proc/sys/vm/* requieren permisos Root."
        echo "0"
        return 1
    fi

    backup_ram_settings

    if [ -w /proc/sys/vm/swappiness ] && echo "$TARGET_SWAPPINESS" > /proc/sys/vm/swappiness 2>/dev/null; then
        VM_APPLIED=$((VM_APPLIED + 1))
    fi
    if [ -w /proc/sys/vm/vfs_cache_pressure ] && echo 50 > /proc/sys/vm/vfs_cache_pressure 2>/dev/null; then
        VM_APPLIED=$((VM_APPLIED + 1))
    fi
    if [ -w /proc/sys/vm/page-cluster ] && echo 0 > /proc/sys/vm/page-cluster 2>/dev/null; then
        VM_APPLIED=$((VM_APPLIED + 1))
    fi
    if [ -w /proc/sys/vm/dirty_ratio ] && echo 20 > /proc/sys/vm/dirty_ratio 2>/dev/null; then
        VM_APPLIED=$((VM_APPLIED + 1))
    fi
    if [ -w /proc/sys/vm/dirty_background_ratio ] && echo 10 > /proc/sys/vm/dirty_background_ratio 2>/dev/null; then
        VM_APPLIED=$((VM_APPLIED + 1))
    fi

    echo "$VM_APPLIED"
    return 0
}

# ==============================================================================
# 3. Congelador Inteligente de Apps en Segundo Plano (SIGSTOP - Solo Root)
# ==============================================================================
freeze_background_apps() {
    log_info "Iniciando congelador de aplicaciones secundarias..."

    LAUNCHER_PKG=$(cmd package resolve-activity --brief -a android.intent.action.MAIN -c android.intent.category.HOME 2>/dev/null | tail -n 1 | cut -d/ -f1)
    IME_PKGS=$(ime list -s 2>/dev/null | cut -d/ -f1)
    FOCUSED_PKG=$(dumpsys window 2>/dev/null | grep -E "mCurrentFocus|mFocusedApp" | head -n 1 | grep -oE "[a-zA-Z0-9._]+/[a-zA-Z0-9._]+" | cut -d/ -f1)

    WHITELIST="
        android
        com.android.systemui
        com.google.android.webview
        com.google.android.inputmethod.latin
        com.touchtype.swiftkey
        com.google.android.gms
        com.google.android.gsf
        com.google.android.play.games
        com.android.vending
        io.github.a13e300.ksu
        me.weishu.kernelsu
        top.canyie.magisk
        io.github.vvb2060.magisk
        me.bmax.apatch
        com.fahrezone.axeron
        com.dts.freefireth
        com.dts.freefiremax
        com.tencent.ig
        com.activision.callofduty.shooter
        com.netease.bloodstrike
        com.roblox.client
        com.miHoYo.GenshinImpact
        $LAUNCHER_PKG
        $IME_PKGS
        $FOCUSED_PKG
    "

    > "$FROZEN_PIDS_FILE"
    > "$FROZEN_PKGS_FILE"

    USER_PKGS=$(pm list packages -3 2>/dev/null | sed 's/package://' | sort)
    FROZEN_PIDS_COUNT=0
    APPOPS_COUNT=0

    for PKG in $USER_PKGS; do
        [ -z "$PKG" ] && continue

        IS_PROTECTED=0
        for W in $WHITELIST; do
            if [ "$PKG" = "$W" ]; then
                IS_PROTECTED=1
                break
            fi
        done
        [ "$IS_PROTECTED" -eq 1 ] && continue

        # Restricción de ejecución en segundo plano (funciona en ADB y Root)
        if cmd appops set "$PKG" RUN_IN_BACKGROUND ignore >/dev/null 2>&1; then
            echo "$PKG" >> "$FROZEN_PKGS_FILE"
            APPOPS_COUNT=$((APPOPS_COUNT + 1))
        fi

        # SIGSTOP requiere Root real (uid=0) para señalizar procesos ajenos
        if has_root; then
            APP_PIDS=$(pidof "$PKG" 2>/dev/null)
            if [ -n "$APP_PIDS" ]; then
                for PID in $APP_PIDS; do
                    if [ "$PID" -gt 500 ] && [ -d "/proc/$PID" ]; then
                        if kill -STOP "$PID" 2>/dev/null; then
                            echo "$PID" >> "$FROZEN_PIDS_FILE"
                            FROZEN_PIDS_COUNT=$((FROZEN_PIDS_COUNT + 1))
                        fi
                    fi
                done
            fi
        fi
    done

    if has_root; then
        log_info "Congelamiento completo: $FROZEN_PIDS_COUNT procesos pausados con SIGSTOP y $APPOPS_COUNT apps restringidas en fondo."
    else
        log_warn "Sin Root: kill -STOP no permitido por el kernel. Solo se aplicó appops RUN_IN_BACKGROUND a $APPOPS_COUNT apps."
    fi
    echo "$FROZEN_PIDS_COUNT"
}

# ==============================================================================
# 4. Descongelador de Apps (SIGCONT + Restaurar appops)
# ==============================================================================
thaw_background_apps() {
    log_info "Descongelando aplicaciones secundarias..."

    THAWED_PIDS=0
    if [ -f "$FROZEN_PIDS_FILE" ]; then
        for PID in $(cat "$FROZEN_PIDS_FILE" 2>/dev/null); do
            if [ -d "/proc/$PID" ]; then
                kill -CONT "$PID" 2>/dev/null && THAWED_PIDS=$((THAWED_PIDS + 1))
            fi
        done
        rm -f "$FROZEN_PIDS_FILE" 2>/dev/null
    fi

    THAWED_PKGS=0
    if [ -f "$FROZEN_PKGS_FILE" ]; then
        for PKG in $(cat "$FROZEN_PKGS_FILE" 2>/dev/null); do
            cmd appops set "$PKG" RUN_IN_BACKGROUND allow >/dev/null 2>&1 && THAWED_PKGS=$((THAWED_PKGS + 1))
        done
        rm -f "$FROZEN_PKGS_FILE" 2>/dev/null
    fi

    log_info "Descongelamiento completado: $THAWED_PIDS procesos SIGCONT y $THAWED_PKGS apps restauradas."
}

# ==============================================================================
# 5. Activación (vm-only seguro para boot, o completo bajo demanda)
# ==============================================================================
enable_ram_vm_only() {
    TARGET_SWAPPINESS="${1:-50}"
    VM_APPLIED=$(apply_vm_tuning "$TARGET_SWAPPINESS")

    if [ "$VM_APPLIED" -gt 0 ]; then
        cat <<EOF > "$STATUS_FILE"
STATUS=1
MODE=VM_ONLY
SWAPPINESS=$TARGET_SWAPPINESS
VM_NODES=$VM_APPLIED
FROZEN_PIDS=0
TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")
EOF
        echo "SUCCESS: Parámetros VM Anti-Stutter aplicados ($VM_APPLIED nodos, swappiness=$TARGET_SWAPPINESS)."
    else
        echo "NO_ROOT: Los parámetros /proc/sys/vm/* requieren acceso Root."
        return 1
    fi
}

enable_ram_tweak() {
    TARGET_SWAPPINESS="${1:-50}"
    log_info "Activando Módulo Anti-Stutter de Memoria RAM & ZRAM..."

    VM_APPLIED=$(apply_vm_tuning "$TARGET_SWAPPINESS")
    FROZEN_NUM=$(freeze_background_apps)

    PURGED=0
    if has_root && [ -w /proc/sys/vm/drop_caches ]; then
        sync
        echo 3 > /proc/sys/vm/drop_caches 2>/dev/null && PURGED=1
    fi

    cat <<EOF > "$STATUS_FILE"
STATUS=1
MODE=FULL
SWAPPINESS=$TARGET_SWAPPINESS
VM_NODES=$VM_APPLIED
FROZEN_PIDS=${FROZEN_NUM:-0}
RAM_PURGED=$PURGED
TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")
EOF

    if has_root; then
        echo "SUCCESS: Anti-Stutter RAM activo ($VM_APPLIED nodos VM, swappiness=$TARGET_SWAPPINESS, $FROZEN_NUM PIDs congelados con SIGSTOP)."
    else
        echo "PARTIAL_ADB: Sin Root no se puede escribir /proc/sys/vm/* ni usar SIGSTOP; solo se restringió ejecución en fondo vía appops."
    fi
}

# ==============================================================================
# 6. Desactivación y Restauración Completa
# ==============================================================================
disable_ram_tweak() {
    log_info "Desactivando Módulo Anti-Stutter RAM y restaurando valores..."
    thaw_background_apps

    if has_root && [ -f "$BACKUP_STATE" ]; then
        . "$BACKUP_STATE"
        [ -w /proc/sys/vm/swappiness ] && echo "${ORIG_SWAPPINESS:-100}" > /proc/sys/vm/swappiness 2>/dev/null
        [ -w /proc/sys/vm/vfs_cache_pressure ] && echo "${ORIG_VFS_PRESSURE:-100}" > /proc/sys/vm/vfs_cache_pressure 2>/dev/null
        [ -w /proc/sys/vm/page-cluster ] && echo "${ORIG_PAGE_CLUSTER:-3}" > /proc/sys/vm/page-cluster 2>/dev/null
        [ -w /proc/sys/vm/dirty_ratio ] && echo "${ORIG_DIRTY_RATIO:-20}" > /proc/sys/vm/dirty_ratio 2>/dev/null
        [ -w /proc/sys/vm/dirty_background_ratio ] && echo "${ORIG_DIRTY_BG:-10}" > /proc/sys/vm/dirty_background_ratio 2>/dev/null
        rm -f "$BACKUP_STATE" 2>/dev/null
    fi

    rm -f "$STATUS_FILE" 2>/dev/null
    echo "SUCCESS: Módulo Anti-Stutter RAM desactivado y procesos restaurados."
}

# ==============================================================================
# 7. Auditoría Real de Memoria RAM & ZRAM
# ==============================================================================
audit_ram() {
    echo "====================================================="
    echo "  AUDITORÍA DE MEMORIA RAM & ZRAM (ANTI-STUTTER)     "
    echo "====================================================="

    MEM_TOTAL_KB=$(grep "MemTotal:" /proc/meminfo 2>/dev/null | awk '{print $2}')
    MEM_AVAIL_KB=$(grep "MemAvailable:" /proc/meminfo 2>/dev/null | awk '{print $2}')
    SWAP_TOTAL_KB=$(grep "SwapTotal:" /proc/meminfo 2>/dev/null | awk '{print $2}')
    SWAP_FREE_KB=$(grep "SwapFree:" /proc/meminfo 2>/dev/null | awk '{print $2}')

    echo "• Modo de Privilegios: $(has_root && echo ROOT || echo ADB_SHELL)"
    echo "• Memoria RAM Total Física: $(( ${MEM_TOTAL_KB:-0} / 1024 )) MB"
    echo "• Memoria RAM Disponible: $(( ${MEM_AVAIL_KB:-0} / 1024 )) MB"
    echo "• ZRAM / Swap Total: $(( ${SWAP_TOTAL_KB:-0} / 1024 )) MB"
    echo "• ZRAM / Swap Libre: $(( ${SWAP_FREE_KB:-0} / 1024 )) MB"
    echo "-----------------------------------------------------"
    echo "• vm.swappiness actual: $(cat /proc/sys/vm/swappiness 2>/dev/null || echo 'no legible')"
    echo "• vm.vfs_cache_pressure actual: $(cat /proc/sys/vm/vfs_cache_pressure 2>/dev/null || echo 'no legible')"
    echo "• vm.page-cluster actual: $(cat /proc/sys/vm/page-cluster 2>/dev/null || echo 'no legible')"

    FROZEN_NOW=0
    [ -f "$FROZEN_PIDS_FILE" ] && FROZEN_NOW=$(wc -l < "$FROZEN_PIDS_FILE" 2>/dev/null)
    echo "• Procesos congelados (SIGSTOP): ${FROZEN_NOW}"

    if [ -r /proc/swaps ] && grep -qE "data|sdcard|loop|block" /proc/swaps 2>/dev/null; then
        echo "⚠️ ALERTA: Se detectó swap/RAM virtual sobre almacenamiento flash."
    else
        echo "✓ ESTADO SWAP: ZRAM en RAM sin archivo swap en disco flash."
    fi
    echo "====================================================="
}

get_status() {
    STATUS="0"
    [ -f "$STATUS_FILE" ] && STATUS="1"
    CUR_SWAP=$(cat /proc/sys/vm/swappiness 2>/dev/null)
    CUR_VFS=$(cat /proc/sys/vm/vfs_cache_pressure 2>/dev/null)
    CUR_CLUSTER=$(cat /proc/sys/vm/page-cluster 2>/dev/null)
    FROZEN_NOW=0
    [ -f "$FROZEN_PIDS_FILE" ] && FROZEN_NOW=$(wc -l < "$FROZEN_PIDS_FILE" 2>/dev/null)

    echo "RAM_STUTTER_STATUS=$STATUS"
    echo "PRIV_MODE=$(has_root && echo ROOT || echo ADB_SHELL)"
    echo "CURRENT_SWAPPINESS=${CUR_SWAP:-unknown}"
    echo "CURRENT_VFS_PRESSURE=${CUR_VFS:-unknown}"
    echo "CURRENT_PAGE_CLUSTER=${CUR_CLUSTER:-unknown}"
    echo "FROZEN_PROCESSES=${FROZEN_NOW:-0}"
    echo "SECURITY_RULE=CERO_PERSIST_SYS"
}

ACTION="${1:-status}"
case "$ACTION" in
    enable|1|on) enable_ram_tweak "$2" ;;
    vm|boot) enable_ram_vm_only "$2" ;;
    disable|0|off|restore) disable_ram_tweak ;;
    freeze) freeze_background_apps ;;
    thaw|unfreeze) thaw_background_apps ;;
    audit|check|info) audit_ram ;;
    purge|clean)
        if has_root && [ -w /proc/sys/vm/drop_caches ]; then
            sync; echo 3 > /proc/sys/vm/drop_caches 2>/dev/null
            echo "SUCCESS: Memoria RAM purgada correctamente."
        else
            echo "NO_ROOT: drop_caches requiere acceso Root."
            exit 1
        fi
        ;;
    status) get_status ;;
    *) echo "Uso: $0 {enable [swappiness]|vm [swappiness]|disable|freeze|thaw|audit|purge|status}"; exit 1 ;;
esac
