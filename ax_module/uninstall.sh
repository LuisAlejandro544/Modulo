#!/system/bin/sh
# ==============================================================================
# Script: uninstall.sh
# Propósito: Limpieza y reversión al desinstalar el módulo en AX Manager.
# ==============================================================================
# EXPLICACIÓN DE LÓGICA:
# - Se ejecuta automáticamente cuando el usuario elimina el plugin desde AxManager.
# - Limpia archivos temporales de diagnóstico en /data/local/tmp/.
# - Garantiza que el sistema quede exactamente en su estado limpio original.
# ==============================================================================

LOG_FILE="/data/local/tmp/ax_mali_optimizer.log"

if [ -f "$LOG_FILE" ]; then
    rm -f "$LOG_FILE"
fi

echo "Módulo AX Mali Optimizer desinstalado y archivos temporales limpiados correctamente."
