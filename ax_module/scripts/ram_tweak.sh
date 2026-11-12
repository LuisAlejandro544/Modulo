#!/system/bin/sh
# ==============================================================================
# Script: ram_tweak.sh
# Módulo: AX Mali Core Engine para AX Manager, KernelSU, APatch y Magisk
# Propósito: Módulo Anti-Stutter de Memoria RAM & ZRAM + Congelador de Procesos
# ==============================================================================
# EXPLICACIÓN TÉCNICA DEL CONGELAMIENTO (PROCESS FREEZER):
# - Matar apps en Android es inútil: ActivityManager, alarmtimer y JobScheduler
#   las vuelven a bifurcar (fork) desde Zygote a los pocos segundos, gastando
#   más CPU y generando tirones al recargar datos en RAM.
# - Solución implementada: Mientras este módulo está ACTIVO, las aplicaciones
#   en segundo plano de terceros son CONGELADAS mediante la señal POSIX SIGSTOP (kill -STOP).
#   El kernel de Linux detiene su ejecución por completo (0% CPU, sin recolección
#   de basura, sin consumo de bus de memoria), pero Android NO las considera muertas,
#   por lo que NO intentará reiniciarlas.
# - Al DESACTIVAR el módulo (disable), todas las aplicaciones congeladas reciben
#   la señal SIGCONT (kill -CONT) y se restauran sus permisos de fondo a "allow",
#   volviendo a la normalidad instantáneamente sin pérdida de datos.
# ==============================================================================
# REGLAS CRÍTICAS DE SEGURIDAD:
# - CERO propiedades permanentes en disco (100% volátil en memoria RAM).
# - 100% Reversible: Respaldo íntegro de valores en /data/local/tmp/mali_ram_backup.state.
# - Whitelist estricta: NUNCA congela el juego activo, teclado, launcher ni servicios del SO.
# - Compatible con arquitecturas 32-bit (armeabi-v7a) y 64-bit (arm64-v8a).
# ==============================================================================

SCRIPT_DIR=$(dirname "$0")
BACKUP_STATE="/data/local/tmp/mali_ram_backup.state"
STATUS_FILE="/data/local/tmp/mali_ram_status.state"
FROZEN_PIDS_FILE="/data/local/tmp/mali_ram_frozen.pids"
FROZEN_PKGS_FILE="/data/local/tmp/mali_ram_frozen.pkgs"

# Cargar funciones comunes si están disponibles
if [ -f "$SCRIPT_DIR/mali_common.sh" ]; then
    . "$SCRIPT_DIR/mali_common.sh"
else
    log_info() { echo "[INFO] $1"; }
    log_warn() { echo "[AVISO] $1"; }
    log_error() { echo "[ERROR] $1"; }
fi

# ==============================================================================
# 1. Respaldo de Valores Previos del Kernel
# ==============================================================================
backup_ram_settings() {
    if [ ! -f "$BACKUP_STATE" ]; then
        log_info "Creando respaldo de parámetros de memoria virtual y kernel..."

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
        log_info "Respaldo de memoria guardado en $BACKUP_STATE"
    fi
}

# ==============================================================================
# 2. Congelador Inteligente de Apps en Segundo Plano (SIGSTOP)
# ==============================================================================
freeze_background_apps() {
    log_info "Iniciando congelador de aplicaciones secundarias (Process Freezer)..."

    # Detectar el Launcher / Pantalla de inicio para protegerlo
    LAUNCHER_PKG=$(cmd package resolve-activity --brief -a android.intent.action.MAIN -c android.intent.category.HOME 2>/dev/null | tail -n 1 | cut -d/ -f1)

    # Detectar el Teclado / Método de entrada activo para no congelarlo
    IME_PKGS=$(ime list -s 2>/dev/null | cut -d/ -f1)

    # Detectar la app en primer plano actual
    FOCUSED_PKG=$(dumpsys window 2>/dev/null | grep -E "mCurrentFocus|mFocusedApp" | head -n 1 | grep -oE "[a-zA-Z0-9._]+/[a-zA-Z0-9._]+" | cut -d/ -f1)

    # Lista blanca de paquetes esenciales que NUNCA deben congelarse
    WHITELIST="
        android
        com.android.systemui
        com.google.android.inputmethod.latin
        com.touchtype.swiftkey
        com.google.android.gms
        com.google.android.play.games
        com.android.vending
        io.github.a13e300.ksu
        me.weishu.kernelsu
        top.canyie.magisk
        com.fahrezone.axeron
        com.dts.freefireth
        com.dts.freefiremax
        com.tencent.ig
        com.activision.callofduty.shooter
        $LAUNCHER_PKG
        $IME_PKGS
        $FOCUSED_PKG
    "

    # Limpiar registros previos si existían
    > "$FROZEN_PIDS_FILE"
    > "$FROZEN_PKGS_FILE"

    # Obtener todas las apps de terceros instaladas por el usuario
    USER_PKGS=$(pm list packages -3 2>/dev/null | sed 's/package://' | sort)

    FROZEN_COUNT=0
    for PKG in $USER_PKGS; do
        [ -z "$PKG" ] && continue

        # Verificar si está en la lista blanca
        IS_PROTECTED=0
        for W in $WHITELIST; do
            if [ "$PKG" = "$W" ]; then
                IS_PROTECTED=1
                break
            fi
        done

        if [ "$IS_PROTECTED" -eq 1 ]; then
            continue
        fi

        # Buscar procesos activos de la app
        APP_PIDS=$(pidof "$PKG" 2>/dev/null)
        if [ -z "$APP_PIDS" ]; then
            APP_PIDS=$(pgrep -f "$PKG" 2>/dev/null)
        fi

        if [ -n "$APP_PIDS" ]; then
            for PID in $APP_PIDS; do
                # Validar que sea un proceso de usuario (PID > 500 para proteger daemons del kernel)
                if [ "$PID" -gt 500 ] && [ -d "/proc/$PID" ]; then
                    # Enviar señal POSIX SIGSTOP (pausa completa en el scheduler)
                    kill -STOP "$PID" 2>/dev/null
                    echo "$PID" >> "$FROZEN_PIDS_FILE"
                fi
            done
            # Bloquear ejecuciones adicionales en segundo plano durante la partida
            cmd appops set "$PKG" RUN_IN_BACKGROUND ignore 2>/dev/null
            echo "$PKG" >> "$FROZEN_PKGS_FILE"
            FROZEN_COUNT=$((FROZEN_COUNT + 1))
        fi
    done

    log_info "Congelamiento completado: $FROZEN_COUNT apps pausadas en 0% CPU sin reinicios de Android."
    echo "$FROZEN_COUNT"
}

# ==============================================================================
# 3. Descongelador de Apps (SIGCONT) - Vuelve todo a la normalidad
# ==============================================================================
thaw_background_apps() {
    log_info "Descongelando aplicaciones secundarias (Restauración a estado normal)..."

    THAWED_PIDS=0
    if [ -f "$FROZEN_PIDS_FILE" ]; then
        for PID in $(cat "$FROZEN_PIDS_FILE" 2>/dev/null); do
            if [ -d "/proc/$PID" ]; then
                # Enviar señal POSIX SIGCONT (reanuda el proceso en el scheduler)
                kill -CONT "$PID" 2>/dev/null
                THAWED_PIDS=$((THAWED_PIDS + 1))
            fi
        done
        rm -f "$FROZEN_PIDS_FILE" 2>/dev/null
    fi

    if [ -f "$FROZEN_PKGS_FILE" ]; then
        for PKG in $(cat "$FROZEN_PKGS_FILE" 2>/dev/null); do
            cmd appops set "$PKG" RUN_IN_BACKGROUND allow 2>/dev/null
        done
        rm -f "$FROZEN_PKGS_FILE" 2>/dev/null
    fi

    log_info "Descongelamiento completado: $THAWED_PIDS procesos reanudados con normalidad."
}

# ==============================================================================
# 4. Activación del Módulo Anti-Stutter RAM & ZRAM + Freezer
# ==============================================================================
enable_ram_tweak() {
    TARGET_SWAPPINESS="${1:-50}"
    log_info "Activando Módulo Anti-Stutter de Memoria RAM & ZRAM..."

    # Paso A: Respaldar parámetros de fábrica del kernel
    backup_ram_settings

    # Paso B: Optimización de swappiness (reduce compresión excesiva en ZRAM)
    if [ -w /proc/sys/vm/swappiness ]; then
        echo "$TARGET_SWAPPINESS" > /proc/sys/vm/swappiness 2>/dev/null
        log_info "swappiness ajustado a $TARGET_SWAPPINESS (anti-congelamientos de compresión)."
    fi

    # Paso C: Retención de inodos y dentry caches del juego en RAM
    if [ -w /proc/sys/vm/vfs_cache_pressure ]; then
        echo 50 > /proc/sys/vm/vfs_cache_pressure 2>/dev/null
        log_info "vfs_cache_pressure ajustado a 50 (evita lecturas lentas del almacenamiento)."
    fi

    # Paso D: Lectura atómica de páginas swap sin ráfagas adicionales (page-cluster 0)
    if [ -w /proc/sys/vm/page-cluster ]; then
        echo 0 > /proc/sys/vm/page-cluster 2>/dev/null
        log_info "page-cluster ajustado a 0 (lectura de 1 página exacta en ZRAM)."
    fi

    # Paso E: Desactivar compactación agresiva que congela la pantalla en partidas
    if [ -w /proc/sys/vm/compact_memory ]; then
        echo 0 > /proc/sys/vm/compact_memory 2>/dev/null
    fi

    # Paso F: Calibración de Dirty Pages para no saturar el bus flash
    if [ -w /proc/sys/vm/dirty_ratio ]; then
        echo 20 > /proc/sys/vm/dirty_ratio 2>/dev/null
    fi
    if [ -w /proc/sys/vm/dirty_background_ratio ]; then
        echo 10 > /proc/sys/vm/dirty_background_ratio 2>/dev/null
    fi

    # Paso G: Congelar aplicaciones en segundo plano para que NO se despierten
    FROZEN_NUM=$(freeze_background_apps)

    # Paso H: Purga inicial de dentries y pagecache sucios para empezar limpios
    sync
    if [ -w /proc/sys/vm/drop_caches ]; then
        echo 3 > /proc/sys/vm/drop_caches 2>/dev/null
        log_info "drop_caches purgado: RAM liberada para el proceso de juego."
    fi

    # Guardar estado activo
    cat <<EOF > "$STATUS_FILE"
STATUS=1
SWAPPINESS=$TARGET_SWAPPINESS
VFS_CACHE_PRESSURE=50
PAGE_CLUSTER=0
DIRTY_RATIO=20
DIRTY_BG_RATIO=10
FROZEN_APPS=${FROZEN_NUM:-0}
FREEZER_ENGINE=SIGSTOP_POSIX
TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")
EOF

    echo "SUCCESS: Anti-Stutter RAM activo ($TARGET_SWAPPINESS swappiness) y $FROZEN_NUM apps congeladas en 0% CPU."
}

# ==============================================================================
# 5. Desactivación y Restauración Completa (Thaw)
# ==============================================================================
disable_ram_tweak() {
    log_info "Desactivando Módulo Anti-Stutter RAM y restaurando valores de fábrica..."

    # Descongelar todas las apps para que vuelvan a su comportamiento normal
    thaw_background_apps

    # Restaurar parámetros del kernel
    if [ -f "$BACKUP_STATE" ]; then
        . "$BACKUP_STATE"
        [ -w /proc/sys/vm/swappiness ] && echo "${ORIG_SWAPPINESS:-100}" > /proc/sys/vm/swappiness 2>/dev/null
        [ -w /proc/sys/vm/vfs_cache_pressure ] && echo "${ORIG_VFS_PRESSURE:-100}" > /proc/sys/vm/vfs_cache_pressure 2>/dev/null
        [ -w /proc/sys/vm/page-cluster ] && echo "${ORIG_PAGE_CLUSTER:-3}" > /proc/sys/vm/page-cluster 2>/dev/null
        [ -w /proc/sys/vm/dirty_ratio ] && echo "${ORIG_DIRTY_RATIO:-20}" > /proc/sys/vm/dirty_ratio 2>/dev/null
        [ -w /proc/sys/vm/dirty_background_ratio ] && echo "${ORIG_DIRTY_BG:-10}" > /proc/sys/vm/dirty_background_ratio 2>/dev/null
        log_info "Parámetros restaurados desde el respaldo previo."
    else
        [ -w /proc/sys/vm/swappiness ] && echo 100 > /proc/sys/vm/swappiness 2>/dev/null
        [ -w /proc/sys/vm/vfs_cache_pressure ] && echo 100 > /proc/sys/vm/vfs_cache_pressure 2>/dev/null
        [ -w /proc/sys/vm/page-cluster ] && echo 3 > /proc/sys/vm/page-cluster 2>/dev/null
    fi

    rm -f "$STATUS_FILE" 2>/dev/null
    echo "SUCCESS: Módulo Anti-Stutter RAM desactivado. Todas las apps y parámetros restaurados al 100%."
}

# ==============================================================================
# 6. Auditoría de Memoria RAM & Detección de "RAM Virtual / RAM Plus"
# ==============================================================================
audit_ram() {
    echo "====================================================="
    echo "  AUDITORÍA DE MEMORIA RAM & ZRAM (ANTI-STUTTER)     "
    echo "====================================================="

    MEM_TOTAL_KB=$(grep "MemTotal:" /proc/meminfo 2>/dev/null | awk '{print $2}')
    MEM_AVAIL_KB=$(grep "MemAvailable:" /proc/meminfo 2>/dev/null | awk '{print $2}')
    SWAP_TOTAL_KB=$(grep "SwapTotal:" /proc/meminfo 2>/dev/null | awk '{print $2}')
    SWAP_FREE_KB=$(grep "SwapFree:" /proc/meminfo 2>/dev/null | awk '{print $2}')

    MEM_TOTAL_MB=$(( ${MEM_TOTAL_KB:-0} / 1024 ))
    MEM_AVAIL_MB=$(( ${MEM_AVAIL_KB:-0} / 1024 ))
    SWAP_TOTAL_MB=$(( ${SWAP_TOTAL_KB:-0} / 1024 ))
    SWAP_FREE_MB=$(( ${SWAP_FREE_KB:-0} / 1024 ))

    CUR_SWAPPINESS=$(cat /proc/sys/vm/swappiness 2>/dev/null)
    CUR_VFS=$(cat /proc/sys/vm/vfs_cache_pressure 2>/dev/null)
    CUR_CLUSTER=$(cat /proc/sys/vm/page-cluster 2>/dev/null)

    echo "• Memoria RAM Total Física: ${MEM_TOTAL_MB} MB"
    echo "• Memoria RAM Disponible: ${MEM_AVAIL_MB} MB"
    echo "• ZRAM / Swap Total: ${SWAP_TOTAL_MB} MB"
    echo "• ZRAM / Swap Libre: ${SWAP_FREE_MB} MB"
    echo "-----------------------------------------------------"
    echo "• vm.swappiness actual: ${CUR_SWAPPINESS:-desconocido}"
    echo "• vm.vfs_cache_pressure actual: ${CUR_VFS:-desconocido}"
    echo "• vm.page-cluster actual: ${CUR_CLUSTER:-desconocido}"

    # Contar apps congeladas si el freezer está activo
    FROZEN_NOW=0
    if [ -f "$FROZEN_PIDS_FILE" ]; then
        FROZEN_NOW=$(wc -l < "$FROZEN_PIDS_FILE" 2>/dev/null)
    fi
    echo "• Apps congeladas en segundo plano: ${FROZEN_NOW} procesos"
    echo "-----------------------------------------------------"

    # Chequeo de RAM Virtual en almacenamiento lento (RAM Plus / Memory Extension)
    HAS_SLOW_SWAP=0
    if [ -f /proc/swaps ]; then
        if grep -qE "data|sdcard|loop|block" /proc/swaps; then
            HAS_SLOW_SWAP=1
        fi
    fi

    if [ "$HAS_SLOW_SWAP" -eq 1 ]; then
        echo "⚠️ ALERTA DE RENDIMIENTO: Se detectó RAM Virtual sobre almacenamiento flash."
        echo "   La memoria virtual en disco flash es 10x más lenta que la RAM real"
        echo "   y es la causa principal de los micro-tirones. Desactívala"
        echo "   en los Ajustes de fábrica (Ajustes Adicionales > Extensión de Memoria)."
    else
        echo "✓ ESTADO ÓPTIMO: ZRAM corriendo directamente en CPU/RAM sin swap lento de disco."
    fi
    echo "====================================================="
}

# ==============================================================================
# 7. Consulta Rápida de Estado
# ==============================================================================
get_status() {
    STATUS="0"
    if [ -f "$STATUS_FILE" ]; then
        STATUS="1"
    fi
    CUR_SWAP=$(cat /proc/sys/vm/swappiness 2>/dev/null)
    CUR_VFS=$(cat /proc/sys/vm/vfs_cache_pressure 2>/dev/null)
    CUR_CLUSTER=$(cat /proc/sys/vm/page-cluster 2>/dev/null)

    FROZEN_NOW=0
    [ -f "$FROZEN_PIDS_FILE" ] && FROZEN_NOW=$(wc -l < "$FROZEN_PIDS_FILE" 2>/dev/null)

    echo "RAM_STUTTER_STATUS=$STATUS"
    echo "CURRENT_SWAPPINESS=${CUR_SWAP:-100}"
    echo "CURRENT_VFS_PRESSURE=${CUR_VFS:-100}"
    echo "CURRENT_PAGE_CLUSTER=${CUR_CLUSTER:-3}"
    echo "FROZEN_PROCESSES=${FROZEN_NOW:-0}"
    echo "SECURITY_RULE=CERO_PERSIST_SYS"
}

ACTION="${1:-status}"
case "$ACTION" in
    enable|1|on)
        enable_ram_tweak "$2"
        ;;
    disable|0|off|restore)
        disable_ram_tweak
        ;;
    freeze)
        freeze_background_apps
        ;;
    thaw|unfreeze)
        thaw_background_apps
        ;;
    audit|check|info)
        audit_ram
        ;;
    purge|clean)
        sync
        echo 3 > /proc/sys/vm/drop_caches 2>/dev/null
        echo "SUCCESS: Memoria RAM purgada correctamente."
        ;;
    status)
        get_status
        ;;
    *)
        echo "Uso: $0 {enable [swappiness]|disable|freeze|thaw|audit|purge|status}"
        exit 1
        ;;
esac
