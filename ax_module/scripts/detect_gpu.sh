#!/system/bin/sh
# ==============================================================================
# Script: detect_gpu.sh
# Propósito: Diagnostica y extrae información sobre el procesador gráfico Mali
#            y el entorno de ejecución en Android (AX Manager).
# ==============================================================================
# EXPLICACIÓN DE LÓGICA:
# 1. Carga las utilidades compartidas desde mali_common.sh.
# 2. Identifica si el procesador es de 32 o 64 bits para adecuar los buffers.
# 3. Consulta la frecuencia actual de GPU en rutas sysfs estándar de Mali.
# 4. Imprime un reporte detallado para que el usuario o el WebUI lo visualice.
# ==============================================================================

SCRIPT_DIR=$(dirname "$0")
# Cargar librería común de funciones
if [ -f "$SCRIPT_DIR/mali_common.sh" ]; then
    . "$SCRIPT_DIR/mali_common.sh"
fi

echo "====================================================="
echo "   REPORTE DE DIAGNÓSTICO GPU MALI - AX MANAGER      "
echo "====================================================="

# Detección de Arquitectura
CURRENT_ARCH=$(detect_architecture)
echo "• Arquitectura del Sistema: $CURRENT_ARCH"

# Detección de GPU Mali
if detect_mali_gpu; then
    echo "• Estado de la GPU: Compatible (Familia Mali detectada)"
else
    echo "• Estado de la GPU: Genérica / Modo compatibilidad activa"
fi

# Detección de frecuencias disponibles (rutas sysfs Mali seguras de solo lectura)
FREQ_FOUND=0
for freq_file in \
    /sys/class/misc/mali0/device/cur_freq \
    /sys/class/misc/mali0/device/clock \
    /sys/devices/platform/13040000.mali/cur_freq \
    /sys/kernel/gpu/gpu_busy; do
    if [ -f "$freq_file" ]; then
        VAL=$(cat "$freq_file" 2>/dev/null)
        echo "• Nodo de Frecuencia detectado: $freq_file -> $VAL"
        FREQ_FOUND=1
        break
    fi
done

if [ "$FREQ_FOUND" -eq 0 ]; then
    echo "• Frecuencia en tiempo real: Dependiente del kernel / DVFS activo"
fi

echo "====================================================="
echo "Diagnóstico completado con éxito."
