#!/system/bin/sh
# ==============================================================================
# Script: detect_gpu.sh
# Propósito: Diagnostica privilegios (Root vs ADB), arquitectura (32/64-bit),
#            GPU Mali, frecuencia actual y versión de Android/Vulkan.
# ==============================================================================

SCRIPT_DIR=$(dirname "$0")
if [ -f "$SCRIPT_DIR/mali_common.sh" ]; then
    . "$SCRIPT_DIR/mali_common.sh"
fi

echo "====================================================="
echo "   REPORTE DE DIAGNÓSTICO GPU MALI - AX MANAGER      "
echo "====================================================="

if type get_priv_mode >/dev/null 2>&1; then
    PRIV=$(get_priv_mode)
else
    PRIV="DESCONOCIDO"
fi
echo "• Modo de Privilegios: $PRIV (uid=$(id -u 2>/dev/null))"

SDK_VER=$(getprop ro.build.version.sdk 2>/dev/null)
REL_VER=$(getprop ro.build.version.release 2>/dev/null)
echo "• Sistema: Android ${REL_VER:-?} (API SDK ${SDK_VER:-?})"

if type detect_architecture >/dev/null 2>&1; then
    CURRENT_ARCH=$(detect_architecture)
else
    CURRENT_ARCH=$(getprop ro.product.cpu.abi 2>/dev/null)
fi
echo "• Arquitectura del Sistema: $CURRENT_ARCH"

if type detect_mali_gpu >/dev/null 2>&1 && detect_mali_gpu; then
    echo "• Estado de la GPU: Compatible (Familia Mali detectada)"
else
    echo "• Estado de la GPU: Genérica / Modo compatibilidad activa"
fi

FREQ_FOUND=0
for freq_file in \
    /sys/class/misc/mali0/device/devfreq/*/cur_freq \
    /sys/class/devfreq/*mali*/cur_freq \
    /sys/class/misc/mali0/device/cur_freq \
    /sys/class/misc/mali0/device/clock \
    /sys/devices/platform/13040000.mali/cur_freq \
    /sys/kernel/gpu/gpu_clock; do
    if [ -r "$freq_file" ]; then
        VAL=$(cat "$freq_file" 2>/dev/null)
        echo "• Frecuencia GPU actual ($freq_file): $VAL"
        FREQ_FOUND=1
        break
    fi
done

if [ "$FREQ_FOUND" -eq 0 ]; then
    echo "• Frecuencia GPU en tiempo real: No legible en este kernel/permisos"
fi

echo "====================================================="
echo "Diagnóstico completado."
