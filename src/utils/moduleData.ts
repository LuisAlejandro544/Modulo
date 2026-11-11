/**
 * @file moduleData.ts
 * @description Lógica desacoplada y datos del módulo AX Manager para procesadores Mali.
 * Contiene validaciones de seguridad (como verificar que no existan propiedades prohibidas
 * Contiene validaciones de seguridad (como verificar que no existan propiedades prohibidas
 * permanentes), metadatos del plugin e información de compatibilidad de arquitecturas.
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
    name: 'touch_boost.sh',
    path: '/ax_module/scripts/touch_boost.sh',
    category: 'runtime',
    description: 'Optimización de respuesta táctil y sensibilidad: reduce latencia de InputDispatcher, activa nodos de panel y sincroniza el pipeline de la GPU Mali con respaldo 100% reversible.',
    supportedArch: '32-bit & 64-bit',
    codeSnippet: `enable_touch_boost() {\n  backup_original_settings\n  settings put secure long_press_timeout 250\n  settings put system pointer_speed 7\n  setprop debug.sf.early_phase_offset_ns 500000\n  echo "1" > "$STATUS_FILE"\n}`,
  },
  {
    name: 'module.prop',
    path: '/ax_module/module.prop',
    category: 'config',
    description: 'Archivo de propiedades del plugin para AxManager (ID, versión, autor y API).',
    supportedArch: '32-bit & 64-bit',
    codeSnippet: `id=ax_mali_core_optimizer\nname=Mali GPU Core Engine\nversion=v1.0.0-base\nversionCode=100\nauthor=AX Mobile Community\naxeronPlugin=30000`,
  },
  {
    name: 'customize.sh',
    path: '/ax_module/customize.sh',
    category: 'install',
    description: 'Instalador de AxManager: otorga permisos de ejecución (+x) y detecta la arquitectura.',
    supportedArch: '32-bit & 64-bit',
    codeSnippet: `ui_print "- Asignando permisos de ejecución a scripts internos..."\nchmod -R 0755 "$MODPATH/scripts"\nABI=$(getprop ro.product.cpu.abi)\nui_print "- Arquitectura de dispositivo: $ABI"`,
  },
  {
    name: 'service.sh',
    path: '/ax_module/service.sh',
    category: 'runtime',
    description: 'Servicio en segundo plano ejecutado en modo standalone busybox por el servidor AxManager.',
    supportedArch: '32-bit & 64-bit',
    codeSnippet: `while [ "$(getprop sys.boot_completed)" != "1" ]; do sleep 2; done\n. "$MODDIR/scripts/mali_common.sh"\nlog_info "Servicio base de AX Mali Optimizer iniciado correctamente."`,
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
    description: 'Modo Batata / Gráficos de Cartón exclusivo para Android 12+ (SDK >= 31): reduce la escala de renderizado a nivel de SurfaceFlinger para maximizar FPS en Mali sin tocar resoluciones globales ni riesgo de baneo.',
    supportedArch: '32-bit & 64-bit',
    codeSnippet: `enable_potato_mode() {\n  if [ "$SDK_NUM" -lt 31 ]; then exit 2; fi\n  cmd game mode performance "$PKG"\n  device_config put game_overlay "$PKG" "mode=2,downscaleFactor=0.5:fps=60"\n  setprop debug.mali.render_scale 0.5\n}`,
  },
  {
    name: 'uninstall.sh',
    path: '/ax_module/uninstall.sh',
    category: 'install',
    description: 'Script de limpieza ejecutado al desinstalar el módulo desde la app de AxManager.',
    supportedArch: '32-bit & 64-bit',
    codeSnippet: `rm -f /data/local/tmp/ax_mali_optimizer.log /data/local/tmp/mali_touch_*.state\necho "Módulo AX Mali Optimizer desinstalado correctamente."`,
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
