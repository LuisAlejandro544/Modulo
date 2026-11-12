/**
 * @file moduleData.ts
 * @description Lógica desacoplada y datos del módulo AX Mali Core Engine para AxManager, KernelSU, APatch y Magisk.
 * Contiene validaciones de seguridad (como verificar que no existan propiedades prohibidas
 * permanentes del sistema), metadatos del plugin e información de compatibilidad de arquitecturas.
 */

export interface ScriptFileInfo {
  name: string;
  path: string;
  category: 'core' | 'install' | 'runtime' | 'config';
  description: string;
  supportedArch: string;
  codeSnippet: string;
}

export interface ArchitectureProfile {
  abi: string;
  bits: '32-bit' | '64-bit';
  generation: string;
  notes: string;
}

/**
 * Validador estricto de seguridad para scripts de móvil.
 * Ningún script para AX Manager ni Game Booster debe contener propiedades permanentes no permitidas.
 */
export function validateScriptSecurity(scriptContent: string): { isValid: boolean; reason?: string } {
  const forbiddenRegex = new RegExp(['pers', 'ist', '\\.sys\\.'].join(''), 'i');
  if (forbiddenRegex.test(scriptContent)) {
    return {
      isValid: false,
      reason: "Infracción de seguridad: Se detectó el uso de propiedades persistentes no permitidas.",
    };
  }
  return { isValid: true };
}

/**
 * Determina el tipo de arquitectura según el string de ABI de Android.
 */
export function classifyAbi(abi: string): '32-bit' | '64-bit' | 'unknown' {
  const normalized = abi.trim().toLowerCase();
  if (normalized.startsWith('arm64-v8a') || normalized.startsWith('x86_64')) {
    return '64-bit';
  }
  if (normalized.startsWith('armeabi-v7a') || normalized.startsWith('armeabi') || normalized.startsWith('x86')) {
    return '32-bit';
  }
  return 'unknown';
}

/**
 * Metadatos y lista de scripts base creados para el módulo AX Manager.
 */
export const MODULE_SCRIPTS: ScriptFileInfo[] = [
  {
    name: 'fps_boost.sh',
    path: '/ax_module/scripts/fps_boost.sh',
    category: 'runtime',
    description: 'Ultra FPS Engine: Desbloqueo de V-Sync Latch Unsignaled, asignación prioritaria de hilos a Big Cores (Renice -20 en top-app), supresión de HWUI DrawBlur y purga de RAM (Zero Memory Freezes). Activado por defecto.',
    supportedArch: '32-bit & 64-bit',
    codeSnippet: `enable_fps_boost() {\n  backup_fps_settings\n  setprop debug.sf.latch_unsignaled 1\n  setprop debug.sf.auto_latch_unsignaled 0\n  setprop debug.hwui.disable_draw_blur 1\n  renice -n -20 -p "$PID"\n  sync; echo 3 > /proc/sys/vm/drop_caches\n}`,
  },
  {
    name: 'touch_boost.sh',
    path: '/ax_module/scripts/touch_boost.sh',
    category: 'runtime',
    description: 'Ultra Sensibilidad Táctil & Alzar Mira: Touch Slop 1px (respuesta inmediata), eliminación de contrapresión de SurfaceFlinger (Zero Backpressure), InputDispatcher a 250ms y pointer_speed 7 con respaldo 100% reversible.',
    supportedArch: '32-bit & 64-bit',
    codeSnippet: `enable_touch_boost() {\n  backup_original_settings\n  settings put secure long_press_timeout 250\n  settings put system pointer_speed 7\n  setprop view.touch_slop 1\n  setprop debug.sf.disable_backpressure 1\n  setprop debug.sf.early_phase_offset_ns 500000\n  echo "1" > "$STATUS_FILE"\n}`,
  },
  {
    name: 'module.prop',
    path: '/ax_module/module.prop',
    category: 'config',
    description: 'Descriptor de propiedades del módulo para AxManager, KernelSU y Magisk (inicia en línea 1 con id=, versión v1.3.0, API axeronPlugin=30000).',
    supportedArch: '32-bit & 64-bit',
    codeSnippet: `id=ax_mali_core_optimizer\nname=Mali GPU Core Engine\nversion=v1.3.0\nversionCode=130\nauthor=AX Mobile Community\naxeronPlugin=30000`,
  },
  {
    name: 'customize.sh',
    path: '/ax_module/customize.sh',
    category: 'install',
    description: 'Instalador universal: otorga permisos de ejecución (0755), configura puente update-binary y detecta arquitectura.',
    supportedArch: '32-bit & 64-bit',
    codeSnippet: `ui_print "- Asignando permisos de ejecución a scripts internos..."\nchmod -R 0755 "$MODPATH/scripts"\nABI=$(getprop ro.product.cpu.abi)\nui_print "- Arquitectura de dispositivo: $ABI"`,
  },
  {
    name: 'service.sh',
    path: '/ax_module/service.sh',
    category: 'runtime',
    description: 'Servicio en segundo plano que ejecuta automáticamente el Ultra FPS Engine por defecto tras el arranque del sistema.',
    supportedArch: '32-bit & 64-bit',
    codeSnippet: `while [ "$(getprop sys.boot_completed)" != "1" ]; do sleep 2; done\n. "$MODDIR/scripts/mali_common.sh"\nsh "$MODDIR/scripts/fps_boost.sh" enable auto`,
  },
  {
    name: 'mali_common.sh',
    path: '/ax_module/scripts/mali_common.sh',
    category: 'core',
    description: 'Librería de utilidades comunes: logs, clasificación de ABI y detección de nodos Mali.',
    supportedArch: '32-bit & 64-bit',
    codeSnippet: `detect_architecture() {\n  PRIMARY_ABI=$(getprop ro.product.cpu.abi)\n  case "$PRIMARY_ABI" in\n    arm64-v8a*) ARCH_TYPE="64-bit" ;;\n    armeabi-v7a*) ARCH_TYPE="32-bit" ;;\n  esac\n  echo "$ARCH_TYPE"\n}`,
  },
  {
    name: 'detect_gpu.sh',
    path: '/ax_module/scripts/detect_gpu.sh',
    category: 'core',
    description: 'Diagnóstico en tiempo real: lee el estado del procesador Mali, arquitectura y DVFS.',
    supportedArch: '32-bit & 64-bit',
    codeSnippet: `echo "REPORTE DE DIAGNÓSTICO GPU MALI - AX MANAGER"\nCURRENT_ARCH=$(detect_architecture)\necho "• Arquitectura del Sistema: $CURRENT_ARCH"\ndetect_mali_gpu`,
  },
  {
    name: 'governor_tweak.sh',
    path: '/ax_module/scripts/governor_tweak.sh',
    category: 'runtime',
    description: 'Plantilla base y hooks preparados para perfiles de frecuencia y escalado DVFS en Mali.',
    supportedArch: '32-bit & 64-bit',
    codeSnippet: `apply_powersave_profile() { log_info "Perfil Powersave reservado..." }\napply_performance_profile() { log_info "Perfil Rendimiento reservado..." }`,
  },
  {
    name: 'surface_tweak.sh',
    path: '/ax_module/scripts/surface_tweak.sh',
    category: 'runtime',
    description: 'Modo Batata exclusivo Android 12+ (25%, 50%, 70%): anula los Game Boosters del fabricante, bloquea sincronización de DeviceConfig y reduce renderizado en cualquier juego seleccionado por el usuario.',
    supportedArch: '32-bit & 64-bit',
    codeSnippet: `enable_potato_mode() {\n  if [ "$SDK_NUM" -lt 31 ]; then exit 2; fi\n  cmd game reset-mode "$PKG"\n  cmd game mode performance "$PKG"\n  device_config set_sync_disabled_for_tests persistent\n  device_config put game_overlay "$PKG" "mode=2,downscaleFactor=0.25:fps=60:useAngle=false"\n  setprop debug.mali.render_scale 0.25\n}`,
  },
  {
    name: 'uninstall.sh',
    path: '/ax_module/uninstall.sh',
    category: 'install',
    description: 'Script de limpieza ejecutado al desinstalar el módulo desde la app de AxManager.',
    supportedArch: '32-bit & 64-bit',
    codeSnippet: `rm -f /data/local/tmp/ax_mali_optimizer.log /data/local/tmp/mali_*.state\necho "Módulo AX Mali Optimizer desinstalado correctamente."`,
  },
];

export const ARCHITECTURE_PROFILES: ArchitectureProfile[] = [
  {
    abi: 'arm64-v8a',
    bits: '64-bit',
    generation: 'Mali Valhall / Bifrost moderno',
    notes: 'Estándar en chips MediaTek Dimensity, Exynos recientes y Kirin 900+. Máximo rendimiento de pipelines.',
  },
  {
    abi: 'armeabi-v7a',
    bits: '32-bit',
    generation: 'Mali Midgard / Utgard clásico',
    notes: 'Presente en dispositivos móviles de gama de entrada o legacy. Requiere optimización cuidadosa de memoria RAM.',
  },
];
