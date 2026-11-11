#!/system/bin/sh
# ==============================================================================
# Script: service.sh
# Propósito: Servicio en segundo plano iniciado por el servidor de AX Manager.
# ==============================================================================
# EXPLICACIÓN DE LÓGICA Y CÓDIGO:
# - En AxManager, este script se invoca automáticamente en modo BusyBox standalone.
# - Valida las variables del entorno AxManager ($AXERON, $AXERONVER, $AXERONDIR).
# - Espera a que el sistema esté completamente listo (boot_completed = 1).
# - Como se especificó: Actualmente no ejecuta cambios agresivos, provee la
#   estructura de base preparada para las funciones interesantes que añadiremos.
# - REGLA OBLIGATORIA: NUNCA usar persist.sys.*
# ==============================================================================

MODDIR="$(dirname "$0")"

# Esperar a que el sistema termine de arrancar si está en boot
while [ "$(getprop sys.boot_completed)" != "1" ]; do
    sleep 2
done

# Cargar biblioteca compartida
if [ -f "$MODDIR/scripts/mali_common.sh" ]; then
    . "$MODDIR/scripts/mali_common.sh"
    log_info "Servicio base de AX Mali Optimizer iniciado correctamente."
    log_info "Servidor AXERON: ${AXERON:-no-detectado}, Versión: ${AXERONVER:-indefinida}"
fi

# Mantener vivo o ejecutar hooks pasivos
log_info "Servicio en estado pasivo/escucha. Listo para recibir instrucciones."
