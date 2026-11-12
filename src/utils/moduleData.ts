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
 * Metadatos y lista de scripts reales incluidos en /ax_module/ para el módulo AX Manager.
 */
export const MODULE_SCRIPTS: ScriptFileInfo[] = [
  {
    name: 'fps_boost.sh',
    path: '/ax_module/scripts/fps_boost.sh',
    category: 'runtime',
    description: 'Ultra FPS Engine (Root / Parcial ADB): Desactiva Window Blurs por Settings, configura Latch Unsignaled y HWUI DrawBlur, prioriza RenderThread con SCHED_FIFO 99 + renice -20 + cgroups v1/v2 y libera page cache (drop_caches).',
    supportedArch: '32-bit & 64-bit',
    codeSnippet: `enable_fps_boost() {\n  backup_fps_settings\n  settings put global disable_window_blurs 1\n  if has_root; then\n    setprop debug.sf.latch_unsignaled 1\n    setprop debug.sf.auto_latch_unsignaled 0\n    setprop debug.hwui.disable_draw_blur 1\n    chrt -f -p 99 "$RENDER_TID" && renice -n -20 -p "$PID"\n    sync; echo 3 > /proc/sys/vm/drop_caches\n  fi\n}`,
  },
  {
    name: 'touch_boost.sh',
    path: '/ax_module/scripts/touch_boost.sh',
    category: 'runtime',
    description: 'Touch Boost Real (ADB & Root): Ajusta long_press_timeout y pointer_speed mediante settings put (con respaldo exacto incluyendo estado null). En modo Root habilita nodos sysfs de sensibilidad táctil, MediaTek GED/FPSGO y Zero Backpressure.',
    supportedArch: '32-bit & 64-bit',
    codeSnippet: `enable_touch_boost() {\n  backup_original_settings\n  settings put secure long_press_timeout 250\n  settings put system pointer_speed 7\n  if has_root; then\n    setprop debug.sf.disable_backpressure 1\n    safe_write_node /sys/module/ged/parameters/gx_force_cpu_boost 1\n    safe_write_node /sys/kernel/fpsgo/fbt/boost_ta 1\n  fi\n}`,
  },
  {
    name: 'module.prop',
    path: '/ax_module/module.prop',
    category: 'config',
    description: 'Descriptor de propiedades del módulo para AxManager, KernelSU y Magisk (inicia en línea 1 con id=, versión v1.4.0, API axeronPlugin=30000).',
    supportedArch: '32-bit & 64-bit',
    codeSnippet: `id=ax_mali_core_optimizer\nname=Mali GPU Core Engine\nversion=v1.4.0\nversionCode=140\nauthor=AX Mobile Community\naxeronPlugin=30000\nminApi=26`,
  },
  {
    name: 'customize.sh',
    path: '/ax_module/customize.sh',
    category: 'install',
    description: 'Instalador universal v1.4.0: otorga permisos de ejecución (0755), configura puente update-binary, registra uid de instalación y detecta arquitectura 32/64-bit.',
    supportedArch: '32-bit & 64-bit',
    codeSnippet: `ui_print "- Asignando permisos de ejecución a scripts internos..."\nchmod -R 0755 "$MODPATH/scripts"\nABI=$(getprop ro.product.cpu.abi)\nui_print "- Arquitectura de dispositivo: $ABI (uid=$(id -u))"`,
  },
  {
    name: 'service.sh',
    path: '/ax_module/service.sh',
    category: 'runtime',
    description: 'Servicio post-arranque: espera boot_completed, activa Ultra FPS Engine y aplica únicamente parámetros VM de RAM (modo vm sin congelar apps de usuario en el arranque).',
    supportedArch: '32-bit & 64-bit',
    codeSnippet: `while [ "$(getprop sys.boot_completed)" != "1" ]; do sleep 2; done\n. "$MODDIR/scripts/mali_common.sh"\nsh "$MODDIR/scripts/fps_boost.sh" enable auto\nsh "$MODDIR/scripts/ram_tweak.sh" vm 50`,
  },
  {
    name: 'mali_common.sh',
    path: '/ax_module/scripts/mali_common.sh',
    category: 'core',
    description: 'Librería común: detección de privilegios reales (ROOT vs ADB_SHELL), escritura segura de nodos sysfs, logs con timestamp dinámico y búsqueda dinámica de nodos GPU Mali.',
    supportedArch: '32-bit & 64-bit',
    codeSnippet: `has_root() { [ "$(id -u 2>/dev/null || echo 2000)" -eq 0 ]; }\nget_priv_mode() { has_root && echo "ROOT" || echo "ADB_SHELL"; }\nsafe_write_node() { [ -w "$1" ] && printf '%s' "$2" > "$1" 2>/dev/null; }`,
  },
  {
    name: 'detect_gpu.sh',
    path: '/ax_module/scripts/detect_gpu.sh',
    category: 'core',
    description: 'Diagnóstico en tiempo real: reporta modo de privilegio (ROOT/ADB), SDK Android, arquitectura ABI (32/64-bit), controlador EGL, presencia de Mali y frecuencia actual legible.',
    supportedArch: '32-bit & 64-bit',
    codeSnippet: `echo "PRIV_MODE=$(get_priv_mode) (uid=$(id -u))"\nCURRENT_ARCH=$(detect_architecture)\necho "• Arquitectura del Sistema: $CURRENT_ARCH"\ndetect_mali_gpu`,
  },
  {
    name: 'governor_tweak.sh',
    path: '/ax_module/scripts/governor_tweak.sh',
    category: 'runtime',
    description: 'Piso de Frecuencia GPU Mali (Root): ordena numéricamente available_frequencies y fija min_freq + gobernador devfreq, con respaldo real en nodos de piso MediaTek GED/gpufreq.',
    supportedArch: '32-bit & 64-bit',
    codeSnippet: `apply_floor_frequency() {\n  has_root || return 2\n  NODE_PATH=$(find_mali_devfreq_node)\n  echo "$TARGET_FREQ" > "$NODE_PATH/min_freq"\n  echo "simple_ondemand" > "$NODE_PATH/governor"\n}`,
  },
  {
    name: 'ram_tweak.sh',
    path: '/ax_module/scripts/ram_tweak.sh',
    category: 'runtime',
    description: 'Anti-Stutter RAM & App Freezer (Root / Parcial ADB): separa el ajuste VM del arranque (vm) del congelado bajo demanda (enable) con SIGSTOP/SIGCONT sobre lista blanca protegida.',
    supportedArch: '32-bit & 64-bit',
    codeSnippet: `enable_ram_tweak() {\n  backup_ram_settings\n  has_root || { echo "PARTIAL_ADB"; return 0; }\n  echo 50 > /proc/sys/vm/swappiness\n  echo 50 > /proc/sys/vm/vfs_cache_pressure\n  freeze_background_apps\n}`,
  },
  {
    name: 'gms_shield.sh',
    path: '/ax_module/scripts/gms_shield.sh',
    category: 'runtime',
    description: 'GMS Shield (ADB & Root): valida paquetes exactos con grep -qx, aplica appops ignore a telemetría de GMS y solo deshabilita/restaura paquetes y componentes rastreados por el módulo.',
    supportedArch: '32-bit & 64-bit',
    codeSnippet: `enable_gms_shield() {\n  cmd appops set com.google.android.gms RUN_IN_BACKGROUND ignore\n  if pm list packages -e | grep -qx "package:com.google.android.feedback"; then\n    pm disable-user --user 0 com.google.android.feedback\n  fi\n}`,
  },
  {
    name: 'angle_tweak.sh',
    path: '/ax_module/scripts/angle_tweak.sh',
    category: 'runtime',
    description: 'Capa ANGLE (OpenGL ES sobre Vulkan 1.1+): soporta lectura hexadecimal (0x401000) y decimal (4198400) de Vulkan, verifica presencia de librería/paquete ANGLE y respalda configuraciones previas.',
    supportedArch: '32-bit & 64-bit',
    codeSnippet: `enable_angle() {\n  check_vulkan_support || return 2\n  check_angle_binary_present || log_warn "Sin APK ANGLE"\n  settings put global angle_gl_driver_selection_pkgs "$NEW_PKGS"\n  settings put global angle_gl_driver_selection_values "$NEW_VALS"\n}`,
  },
  {
    name: 'io_aot_tweak.sh',
    path: '/ax_module/scripts/io_aot_tweak.sh',
    category: 'runtime',
    description: 'Carga Instantánea e I/O Flash: respalda y ajusta read_ahead_kb / nr_requests / iostats en bloques (Root) y ejecuta compilación AOT real mediante cmd package compile -m speed (ADB & Root).',
    supportedArch: '32-bit & 64-bit',
    codeSnippet: `enable_io_boost() {\n  has_root || { echo "NO_ROOT"; return 2; }\n  echo 1024 > "$dev/read_ahead_kb"\n  echo 0 > "$dev/iostats"\n}\ncompile_aot_speed() { cmd package compile -m speed -f "$PKG"; }`,
  },
  {
    name: 'thermal_tweak.sh',
    path: '/ax_module/scripts/thermal_tweak.sh',
    category: 'runtime',
    description: 'Thermal Userspace Shield: restringe en segundo plano Joyose/GOS/Cosa vía appops (ADB & Root), suspende únicamente daemons térmicos activos en Root y calibra MediaTek GED.',
    supportedArch: '32-bit & 64-bit',
    codeSnippet: `enable_thermal_shield() {\n  cmd appops set com.xiaomi.joyose RUN_IN_BACKGROUND ignore\n  if has_root; then\n    safe_write_node /sys/module/ged/parameters/dvfs_margin_value 50\n    safe_write_node /sys/module/ged/parameters/gpu_idle 0\n  fi\n}`,
  },
  {
    name: 'surface_tweak.sh',
    path: '/ax_module/scripts/surface_tweak.sh',
    category: 'runtime',
    description: 'Modo Batata Android 12+ (ADB & Root): valida paquete instalado y factor (0.25/0.50/0.70), respalda game_overlay previo, preserva useAngle=true y aplica downscaleFactor vía device_config.',
    supportedArch: '32-bit & 64-bit',
    codeSnippet: `enable_potato_mode() {\n  [ "$SDK_NUM" -ge 31 ] || return 2\n  cmd game mode performance "$PKG"\n  device_config set_sync_disabled_for_tests persistent\n  device_config put game_overlay "$PKG" "mode=2,downscaleFactor=$FACTOR:fps=60:useAngle=$USE_ANGLE"\n}`,
  },
  {
    name: 'uninstall.sh',
    path: '/ax_module/uninstall.sh',
    category: 'install',
    description: 'Script de limpieza al desinstalar: revierte todos los módulos activos y elimina archivos temporales y de respaldo en /data/local/tmp/.',
    supportedArch: '32-bit & 64-bit',
    codeSnippet: `rm -f /data/local/tmp/ax_mali_optimizer.log /data/local/tmp/mali_*.state /data/local/tmp/mali_gms_disabled.*\necho "Módulo AX Mali Optimizer desinstalado correctamente."`,
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
