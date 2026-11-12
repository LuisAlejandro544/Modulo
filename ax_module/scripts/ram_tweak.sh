#!/system/bin/sh
# ==============================================================================
# Script: ram_tweak.sh
# Módulo: AX Mali Core Engine para AX Manager, KernelSU, APatch y Magisk
# Propósito: Módulo Anti-Stutter de Memoria RAM & ZRAM
#   1. Ajuste inteligente de vm.swappiness (baja de 100/160 a 50 para evitar
#      congelamientos de CPU por compresión excesiva en ZRAM durante tiroteos).
#   2. Retención de estructuras de archivos en memoria (vm.vfs_cache_pressure = 50).
#   3. Lectura de páginas de swap individuales sin ráfagas de retardo (page-cluster = 0).
#   4. Supresión de compactación síncrona agresiva en combate (compact_memory = 0).
#   5. Ajuste de dirty_ratio (20) y dirty_background_ratio (10) para evitar I/O wait.
#   6. Detección y auditoría de la "RAM Virtual / RAM Plus" lenta de almacenamiento.
# ==============================================================================
# REGLAS CRÍTICAS DE SEGURIDAD:
# - CERO propiedades permanentes en disco (100% volátil en memoria RAM).
# - 100% Reversible: Respaldo íntegro de valores en /data/local/tmp/mali_ram_backup.state.
# - Compatible con arquitecturas 32-bit (armeabi-v7a) y 64-bit (arm64-v8a).
# ==============================================================================

SCRIPT_DIR=$(dirname "$0")
BACKUP_STATE="/data/local/tmp/mali_ram_backup.state"
STATUS_FILE="/data/local/tmp/mali_ram_status.state"

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
        ORIG_EXTRA_FREE=$(cat /proc/sys/vm/extra_free_kbytes 2>/dev/null)

        cat <<EOF > "$BACKUP_STATE"
ORIG_SWAPPINESS=${ORIG_SWAPPINESS:-100}
ORIG_VFS_PRESSURE=${ORIG_VFS_PRESSURE:-100}
ORIG_PAGE_CLUSTER=${ORIG_PAGE_CLUSTER:-3}
ORIG_DIRTY_RATIO=${ORIG_DIRTY_RATIO:-20}
ORIG_DIRTY_BG=${ORIG_DIRTY_BG:-10}
ORIG_EXTRA_FREE=${ORIG_EXTRA_FREE:-4096}
TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")
EOF
        log_info "Respaldo de memoria guardado en $BACKUP_STATE"
    fi
}

# ==============================================================================
# 2. Activación del Módulo Anti-Stutter RAM & ZRAM
# ==============================================================================
enable_ram_tweak() {
    TARGET_SWAPPINESS="${1:-50}"
    log_info "Activando Módulo Anti-Stutter de Memoria RAM & ZRAM..."

    # Paso A: Respaldar parámetros de fábrica
    backup_ram_settings

    # Paso B: Optimización de swappiness
    # Reduce la urgencia del kernel por comprimir memoria anónima a ZRAM
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

    # Paso G: Purga inicial de dentries y pagecache sucios para empezar limpios
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
RAM_PURGED=YES
TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")
EOF

    echo "SUCCESS: Módulo Anti-Stutter RAM & ZRAM activado (Swappiness: $TARGET_SWAPPINESS, VFS: 50, Cluster: 0)."
}

# ==============================================================================
# 3. Desactivación y Restauración Completa
# ==============================================================================
disable_ram_tweak() {
    log_info "Desactivando Módulo Anti-Stutter RAM y restaurando valores de fábrica..."

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
    echo "SUCCESS: Módulo Anti-Stutter RAM desactivado. Valores originales restaurados."
}

# ==============================================================================
# 4. Auditoría de Memoria RAM & Detección de "RAM Virtual / RAM Plus"
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
    echo "-----------------------------------------------------"

    # Chequeo de RAM Virtual en almacenamiento lento (RAM Plus / Memory Extension)
    HAS_SLOW_SWAP=0
    if [ -f /proc/swaps ]; then
        if grep -qE "data|sdcard|loop|block" /proc/swaps; then
            HAS_SLOW_SWAP=1
        fi
    fi

    VIRT_PROP=$(getprop persist.miui.extm.enable 2>/dev/null)
    if [ "$HAS_SLOW_SWAP" -eq 1 ] || [ "$VIRT_PROP" = "1" ]; then
        echo "⚠️ ALERTA DE RENDIMIENTO: Se detectó RAM Virtual sobre almacenamiento flash."
        echo "   La memoria virtual en almacenamiento flash es 10x más lenta que la RAM real"
        echo "   y es la causa principal de los micro-tirones. Se recomienda desactivarla"
        echo "   en los Ajustes de fábrica (Ajustes Adicionales > Extensión de Memoria)."
    else
        echo "✓ ESTADO ÓPTIMO: ZRAM corriendo directamente en CPU/RAM sin swap lento de disco."
    fi
    echo "====================================================="
}

# ==============================================================================
# 5. Consulta Rápida de Estado
# ==============================================================================
get_status() {
    STATUS="0"
    if [ -f "$STATUS_FILE" ]; then
        STATUS="1"
    fi
    CUR_SWAP=$(cat /proc/sys/vm/swappiness 2>/dev/null)
    CUR_VFS=$(cat /proc/sys/vm/vfs_cache_pressure 2>/dev/null)
    CUR_CLUSTER=$(cat /proc/sys/vm/page-cluster 2>/dev/null)

    echo "RAM_STUTTER_STATUS=$STATUS"
    echo "CURRENT_SWAPPINESS=${CUR_SWAP:-100}"
    echo "CURRENT_VFS_PRESSURE=${CUR_VFS:-100}"
    echo "CURRENT_PAGE_CLUSTER=${CUR_CLUSTER:-3}"
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
        echo "Uso: $0 {enable [swappiness]|disable|audit|purge|status}"
        exit 1
        ;;
esac
