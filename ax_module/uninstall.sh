#!/system/bin/sh
# ==============================================================================
# Script: uninstall.sh
# Propósito: Limpieza y reversión al desinstalar el módulo en AX Manager o KernelSU.
# ==============================================================================
# EXPLICACIÓN DE LÓGICA:
# - Se ejecuta automáticamente al eliminar el plugin desde el gestor.
# - Restaura configuraciones gráficas y táctiles originales.
# - Limpia archivos temporales y de estado en /data/local/tmp/.
# ==============================================================================

MODDIR="$(dirname "$0")"

# Revertir optimizaciones activas
if [ -f "$MODDIR/scripts/fps_boost.sh" ]; then
    sh "$MODDIR/scripts/fps_boost.sh" disable 2>/dev/null
fi

if [ -f "$MODDIR/scripts/touch_boost.sh" ]; then
    sh "$MODDIR/scripts/touch_boost.sh" disable 2>/dev/null
fi

if [ -f "$MODDIR/scripts/surface_tweak.sh" ]; then
    sh "$MODDIR/scripts/surface_tweak.sh" disable 2>/dev/null
fi

rm -f /data/local/tmp/ax_mali_optimizer.log
rm -f /data/local/tmp/mali_touch_*.state 2>/dev/null
rm -f /data/local/tmp/mali_fps_*.state 2>/dev/null
rm -f /data/local/tmp/mali_potato_status.state 2>/dev/null
rm -rf /data/local/tmp/ax_module_tmp 2>/dev/null

echo "Módulo AX Mali Core Engine desinstalado y sistema restaurado limpiamente."
