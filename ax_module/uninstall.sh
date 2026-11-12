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

if [ -f "$MODDIR/scripts/ram_tweak.sh" ]; then
    sh "$MODDIR/scripts/ram_tweak.sh" disable 2>/dev/null
fi

if [ -f "$MODDIR/scripts/governor_tweak.sh" ]; then
    sh "$MODDIR/scripts/governor_tweak.sh" restore 2>/dev/null
fi

if [ -f "$MODDIR/scripts/gms_shield.sh" ]; then
    sh "$MODDIR/scripts/gms_shield.sh" disable 2>/dev/null
fi

if [ -f "$MODDIR/scripts/angle_tweak.sh" ]; then
    sh "$MODDIR/scripts/angle_tweak.sh" disable 2>/dev/null
fi

if [ -f "$MODDIR/scripts/io_aot_tweak.sh" ]; then
    sh "$MODDIR/scripts/io_aot_tweak.sh" disable 2>/dev/null
fi

if [ -f "$MODDIR/scripts/thermal_tweak.sh" ]; then
    sh "$MODDIR/scripts/thermal_tweak.sh" disable 2>/dev/null
fi

rm -f /data/local/tmp/ax_mali_optimizer.log
rm -f /data/local/tmp/mali_touch_*.state 2>/dev/null
rm -f /data/local/tmp/mali_fps_*.state 2>/dev/null
rm -f /data/local/tmp/mali_fps_rt_threads.pids 2>/dev/null
rm -f /data/local/tmp/mali_potato_status.state 2>/dev/null
rm -f /data/local/tmp/mali_ram_*.state 2>/dev/null
rm -f /data/local/tmp/mali_ram_frozen.* 2>/dev/null
rm -f /data/local/tmp/mali_governor_*.state 2>/dev/null
rm -f /data/local/tmp/mali_gms_*.state 2>/dev/null
rm -f /data/local/tmp/mali_angle_*.state 2>/dev/null
rm -f /data/local/tmp/mali_io_*.state 2>/dev/null
rm -f /data/local/tmp/mali_thermal_*.state 2>/dev/null
rm -f /data/local/tmp/mali_thermal_frozen.* 2>/dev/null
rm -rf /data/local/tmp/ax_module_tmp 2>/dev/null

echo "Módulo AX Mali Core Engine desinstalado y sistema restaurado limpiamente."
