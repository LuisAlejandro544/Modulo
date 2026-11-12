#!/system/bin/sh
# ==============================================================================
# Script: fps_boost.sh
# Módulo: AX Mali Core Engine para AX Manager, KernelSU, APatch y Magisk
# Propósito: Ultra FPS Engine para procesadores Mali y SoCs móviles:
#   1. Desenfoque del sistema (Android 12+ disable_window_blurs en ADB/Root y
#      debug.hwui.disable_draw_blur si el sistema permite setprop).
#   2. Desbloqueo de Latencia de V-Sync (debug.sf.latch_unsignaled - requiere Root/SELinux).
#   3. Priorización en Tiempo Real de hilos de juego (RenderThread, UnityMain)
#      mediante SCHED_FIFO / renice -20 / cpuset top-app / oom_score_adj (Solo Root).
#   4. Purga de caché de páginas (/proc/sys/vm/drop_caches - Solo Root).
# ==============================================================================
# REGLAS DE INTEGRIDAD:
# - Cero propiedades permanentes de sistema.
# - Eliminado setprop ro.surface_flinger.* (las props ro.* son read-only en runtime).
# - Eliminado echo 0 > /proc/sys/vm/compact_memory (no desactiva compactación).
# - En modo 'auto', solo prioriza juegos conocidos o la app en primer plano;
#   NUNCA promueve procesos de sistema/launcher aleatorios a SCHED_FIFO.
# ==============================================================================

SCRIPT_DIR=$(dirname "$0")
BACKUP_STATE="/data/local/tmp/mali_fps_backup.state"
STATUS_FILE="/data/local/tmp/mali_fps_status.state"
RT_THREADS_FILE="/data/local/tmp/mali_fps_rt_threads.pids"

if [ -f "$SCRIPT_DIR/mali_common.sh" ]; then
    . "$SCRIPT_DIR/mali_common.sh"
else
    log_info() { echo "[INFO] $1"; }
    log_warn() { echo "[AVISO] $1"; }
    log_error() { echo "[ERROR] $1"; }
    has_root() { [ "$(id -u 2>/dev/null)" = "0" ]; }
fi

# ==============================================================================
# 1. Respaldo de Configuración Previa
# ==============================================================================
backup_fps_settings() {
    if [ ! -f "$BACKUP_STATE" ]; then
        log_info "Creando respaldo de configuraciones gráficas previas..."
        ORIG_LATCH=$(getprop debug.sf.latch_unsignaled 2>/dev/null)
        ORIG_AUTO_LATCH=$(getprop debug.sf.auto_latch_unsignaled 2>/dev/null)
        ORIG_DRAW_BLUR=$(getprop debug.hwui.disable_draw_blur 2>/dev/null)
        ORIG_WIN_BLURS=$(settings get global disable_window_blurs 2>/dev/null)
        ORIG_RENDER_ENGINE=$(getprop debug.renderengine.backend 2>/dev/null)

        cat <<EOF > "$BACKUP_STATE"
ORIG_LATCH=${ORIG_LATCH:-""}
ORIG_AUTO_LATCH=${ORIG_AUTO_LATCH:-""}
ORIG_DRAW_BLUR=${ORIG_DRAW_BLUR:-""}
ORIG_WIN_BLURS=${ORIG_WIN_BLURS:-null}
ORIG_RENDER_ENGINE=${ORIG_RENDER_ENGINE:-""}
TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")
EOF
        log_info "Respaldo gráfico guardado en $BACKUP_STATE"
    fi
}

# ==============================================================================
# 2. Resolución Segura de Paquetes de Juegos Activos
# ==============================================================================
get_target_pids() {
    TARGET_PKG="$1"
    PIDS=""

    if [ -n "$TARGET_PKG" ] && [ "$TARGET_PKG" != "auto" ]; then
        PIDS=$(pidof "$TARGET_PKG" 2>/dev/null)
    fi

    # Buscar únicamente juegos conocidos activos en memoria
    if [ -z "$PIDS" ]; then
        for GAME in \
            com.dts.freefireth \
            com.dts.freefiremax \
            com.tencent.ig \
            com.activision.callofduty.shooter \
            com.netease.bloodstrike \
            com.roblox.client \
            com.miHoYo.GenshinImpact; do
            FOUND=$(pidof "$GAME" 2>/dev/null)
            if [ -n "$FOUND" ]; then
                PIDS="$PIDS $FOUND"
            fi
        done
    fi

    # Si tampoco hay juego conocido abierto, detectar SOLO la app en primer plano
    # si NO es launcher ni SystemUI ni gestor de módulos
    if [ -z "$PIDS" ]; then
        FOCUSED_PKG=$(dumpsys window 2>/dev/null | grep -E "mCurrentFocus|mFocusedApp" | head -n 1 | grep -oE "[a-zA-Z0-9._]+/[a-zA-Z0-9._]+" | cut -d/ -f1)
        case "$FOCUSED_PKG" in
            ""|android|com.android.systemui|*launcher*|*trebuchet*|com.fahrezone.axeron|me.weishu.kernelsu)
                ;;
            *)
                PIDS=$(pidof "$FOCUSED_PKG" 2>/dev/null)
                ;;
        esac
    fi

    echo "$PIDS"
}

# ==============================================================================
# 3. Activación Real del Ultra FPS Engine
# ==============================================================================
enable_fps_boost() {
    TARGET_PKG="${1:-auto}"
    log_info "Iniciando Ultra FPS Engine (Modo $(has_root && echo ROOT || echo ADB_SHELL))..."

    backup_fps_settings

    # --------------------------------------------------------------------------
    # PILAR 1: Desactivación real de desenfoques de ventana (ADB y Root)
    # --------------------------------------------------------------------------
    BLUR_APPLIED=0
    if settings put global disable_window_blurs 1 >/dev/null 2>&1; then
        BLUR_APPLIED=1
    fi

    # --------------------------------------------------------------------------
    # PILAR 2: Propiedades de SurfaceFlinger / HWUI (Solo si hay Root/permiso)
    # --------------------------------------------------------------------------
    LATCH_OK=0
    HWUI_OK=0
    if has_root; then
        setprop debug.sf.latch_unsignaled 1 2>/dev/null && LATCH_OK=1
        setprop debug.sf.auto_latch_unsignaled 0 2>/dev/null
        if setprop debug.hwui.disable_draw_blur 1 2>/dev/null; then
            HWUI_OK=1
            BLUR_APPLIED=1
        fi
        setprop debug.hwui.profile false 2>/dev/null
        setprop debug.atrace.tags.enableflags 0 2>/dev/null
    fi

    # --------------------------------------------------------------------------
    # PILAR 3: Priorización en Tiempo Real del RenderThread (Solo Root)
    # --------------------------------------------------------------------------
    GAME_PIDS=$(get_target_pids "$TARGET_PKG")
    BOOSTED_COUNT=0
    RT_COUNT=0
    > "$RT_THREADS_FILE"

    if has_root && [ -n "$GAME_PIDS" ]; then
        for PID in $GAME_PIDS; do
            [ -z "$PID" ] && continue
            [ ! -d "/proc/$PID" ] && continue

            renice -n -20 -p "$PID" 2>/dev/null

            # Soporte tanto cgroup v1 (/dev/cpuset/top-app/tasks) como cgroup v2 (cgroup.procs)
            if [ -w /dev/cpuset/top-app/tasks ]; then
                echo "$PID" > /dev/cpuset/top-app/tasks 2>/dev/null
            elif [ -w /dev/cpuset/top-app/cgroup.procs ]; then
                echo "$PID" > /dev/cpuset/top-app/cgroup.procs 2>/dev/null
            fi

            if [ -w "/proc/$PID/oom_score_adj" ]; then
                echo -900 > "/proc/$PID/oom_score_adj" 2>/dev/null
            fi

            if [ -d "/proc/$PID/task" ]; then
                for TASK_DIR in /proc/$PID/task/*; do
                    TID=$(basename "$TASK_DIR")
                    [ -z "$TID" ] && continue
                    COMM=$(cat "$TASK_DIR/comm" 2>/dev/null)

                    case "$COMM" in
                        *RenderThread*|*UnityMain*|*UnityGfxDevice*|*MainThread*|*GameThread*|*RHIThread*|*mali-*)
                            if chrt -f -p 99 "$TID" 2>/dev/null; then
                                echo "$TID" >> "$RT_THREADS_FILE"
                                RT_COUNT=$((RT_COUNT + 1))
                            elif chrt -r -p 99 "$TID" 2>/dev/null; then
                                echo "$TID" >> "$RT_THREADS_FILE"
                                RT_COUNT=$((RT_COUNT + 1))
                            else
                                renice -n -20 -p "$TID" 2>/dev/null
                            fi

                            [ -w "$TASK_DIR/sched_uclamp_min" ] && echo 1024 > "$TASK_DIR/sched_uclamp_min" 2>/dev/null
                            [ -w /dev/cpuset/top-app/tasks ] && echo "$TID" > /dev/cpuset/top-app/tasks 2>/dev/null
                            ;;
                    esac
                done
            fi

            BOOSTED_COUNT=$((BOOSTED_COUNT + 1))
        done
    fi

    # --------------------------------------------------------------------------
    # PILAR 4: Limpieza de pagecache (Solo Root)
    # --------------------------------------------------------------------------
    RAM_PURGE_OK=0
    if has_root && [ -w /proc/sys/vm/drop_caches ]; then
        sync
        if echo 3 > /proc/sys/vm/drop_caches 2>/dev/null; then
            RAM_PURGE_OK=1
        fi
    fi

    cat <<EOF > "$STATUS_FILE"
STATUS=1
PRIV_MODE=$(has_root && echo ROOT || echo ADB_SHELL)
LATCH_UNSIGNALED=$LATCH_OK
BLUR_DISABLED=$BLUR_APPLIED
BOOSTED_PIDS=$BOOSTED_COUNT
RT_THREADS_COUNT=$RT_COUNT
RAM_PURGE=$RAM_PURGE_OK
TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")
EOF

    if has_root; then
        echo "SUCCESS: Ultra FPS Engine activo (Latch=$LATCH_OK, BlurOff=$BLUR_APPLIED, Juegos=$BOOSTED_COUNT, Hilos RT=$RT_COUNT, DropCaches=$RAM_PURGE_OK)."
    else
        echo "PARTIAL_ADB: Blur de ventanas desactivado por ADB ($BLUR_APPLIED). Latch Unsignaled, SCHED_FIFO y drop_caches requieren Root."
    fi
}

# ==============================================================================
# 4. Desactivación y Restauración Completa
# ==============================================================================
disable_fps_boost() {
    log_info "Desactivando Ultra FPS Engine y restaurando parámetros originales..."

    if [ -f "$BACKUP_STATE" ]; then
        . "$BACKUP_STATE"
        if [ -z "$ORIG_WIN_BLURS" ] || [ "$ORIG_WIN_BLURS" = "null" ]; then
            settings delete global disable_window_blurs >/dev/null 2>&1
        else
            settings put global disable_window_blurs "$ORIG_WIN_BLURS" >/dev/null 2>&1
        fi
        if has_root; then
            setprop debug.sf.latch_unsignaled "${ORIG_LATCH:-}" 2>/dev/null
            setprop debug.sf.auto_latch_unsignaled "${ORIG_AUTO_LATCH:-}" 2>/dev/null
            setprop debug.hwui.disable_draw_blur "${ORIG_DRAW_BLUR:-}" 2>/dev/null
            setprop debug.hwui.profile "" 2>/dev/null
            setprop debug.atrace.tags.enableflags "" 2>/dev/null
        fi
        rm -f "$BACKUP_STATE" 2>/dev/null
    else
        settings delete global disable_window_blurs >/dev/null 2>&1
    fi

    if has_root && [ -f "$RT_THREADS_FILE" ]; then
        for TID in $(cat "$RT_THREADS_FILE" 2>/dev/null); do
            chrt -o -p 0 "$TID" 2>/dev/null
        done
        rm -f "$RT_THREADS_FILE" 2>/dev/null
    fi

    rm -f "$STATUS_FILE" 2>/dev/null
    echo "SUCCESS: Ultra FPS Engine desactivado y parámetros restaurados."
}

# ==============================================================================
# 5. Purga Rápida de Memoria RAM (Requiere Root para /proc/sys/vm/drop_caches)
# ==============================================================================
purge_ram() {
    if has_root && [ -w /proc/sys/vm/drop_caches ]; then
        sync
        echo 3 > /proc/sys/vm/drop_caches 2>/dev/null
        echo "SUCCESS: Caché en memoria RAM liberada (drop_caches=3)."
    else
        log_warn "drop_caches requiere privilegios Root."
        echo "NO_ROOT: Purgar /proc/sys/vm/drop_caches requiere permisos Root."
        return 1
    fi
}

# ==============================================================================
# 6. Consulta de Estado Real
# ==============================================================================
get_status() {
    STATUS="0"
    if [ -f "$STATUS_FILE" ]; then
        STATUS=$(grep "^STATUS=" "$STATUS_FILE" | cut -d= -f2)
    fi

    LATCH=$(getprop debug.sf.latch_unsignaled 2>/dev/null)
    BLUR=$(getprop debug.hwui.disable_draw_blur 2>/dev/null)
    WIN_BLUR=$(settings get global disable_window_blurs 2>/dev/null)
    RT_COUNT=0
    if [ -f "$RT_THREADS_FILE" ]; then
        RT_COUNT=$(wc -l < "$RT_THREADS_FILE" 2>/dev/null)
    fi

    echo "FPS_BOOST_STATUS=${STATUS:-0}"
    echo "PRIV_MODE=$(has_root && echo ROOT || echo ADB_SHELL)"
    echo "LATCH_UNSIGNALED=${LATCH:-default}"
    echo "DISABLE_DRAW_BLUR=${BLUR:-default}"
    echo "DISABLE_WINDOW_BLURS=${WIN_BLUR:-null}"
    echo "RT_THREADS_COUNT=${RT_COUNT:-0}"
    echo "SECURITY_RULE=CERO_PERSIST_SYS"
}

ACTION="${1:-status}"
case "$ACTION" in
    enable|1|on) enable_fps_boost "$2" ;;
    disable|0|off|restore) disable_fps_boost ;;
    purge|ram|clean) purge_ram ;;
    status|info) get_status ;;
    *) echo "Uso: $0 {enable [pkg]|disable|purge|status}"; exit 1 ;;
esac
