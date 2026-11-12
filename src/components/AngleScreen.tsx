import React, { useState } from 'react';
import {
  Layers,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Terminal,
  Cpu,
  RefreshCw,
  Gamepad2,
  Zap,
  Info,
  Lock,
  Flame,
  ArrowRight
} from 'lucide-react';

interface GamePreset {
  id: string;
  name: string;
  pkg: string;
  genre: string;
  recommended: boolean;
}

const POPULAR_GAMES: GamePreset[] = [
  { id: 'ff', name: 'Free Fire (Estándar)', pkg: 'com.dts.freefireth', genre: 'Battle Royale', recommended: true },
  { id: 'ffmax', name: 'Free Fire MAX', pkg: 'com.dts.freefiremax', genre: 'Battle Royale HD', recommended: true },
  { id: 'codm', name: 'Call of Duty: Mobile', pkg: 'com.activision.callofduty.shooter', genre: 'FPS Táctico', recommended: true },
  { id: 'pubg', name: 'PUBG Mobile', pkg: 'com.tencent.ig', genre: 'Battle Royale', recommended: false },
  { id: 'roblox', name: 'Roblox', pkg: 'com.roblox.client', genre: 'Sandbox 3D', recommended: false },
];

export const AngleScreen: React.FC = () => {
  // Simulador de hardware en UI interactiva
  const [vulkanVersionMode, setVulkanVersionMode] = useState<'v1_1' | 'v1_2' | 'v1_0' | 'none'>('v1_1');
  const [selectedGamePkg, setSelectedGamePkg] = useState<string>('com.dts.freefireth');
  const [customPkg, setCustomPkg] = useState<string>('');
  const [angleActive, setAngleActive] = useState<boolean>(false);
  const [forceRestart, setForceRestart] = useState<boolean>(true);
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  const isVulkan11Supported = vulkanVersionMode === 'v1_1' || vulkanVersionMode === 'v1_2';
  const activePackage = customPkg.trim() ? customPkg.trim() : selectedGamePkg;

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(id);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  const getVulkanLabel = () => {
    switch (vulkanVersionMode) {
      case 'v1_2': return { ver: 'Vulkan 1.2 (4198402)', status: 'COMPATIBLE', ok: true };
      case 'v1_1': return { ver: 'Vulkan 1.1 (4198400)', status: 'COMPATIBLE', ok: true };
      case 'v1_0': return { ver: 'Vulkan 1.0 (4194304)', status: 'INCOMPATIBLE', ok: false };
      case 'none': return { ver: 'Sin Vulkan (0)', status: 'INCOMPATIBLE', ok: false };
    }
  };

  const vkInfo = getVulkanLabel();

  return (
    <div className="space-y-6 pb-12">
      {/* Encabezado Principal */}
      <div className="bg-gradient-to-r from-slate-900 via-purple-950/40 to-slate-900 border border-purple-900/50 rounded-2xl p-6 sm:p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                isVulkan11Supported
                  ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/60'
                  : 'bg-rose-950/80 text-rose-400 border border-rose-800/60'
              }`}>
                {isVulkan11Supported ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Requisito Vulkan 1.1+ Superado
                  </>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5" />
                    Bloqueado por Defecto (Requiere Vulkan 1.1)
                  </>
                )}
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-950/80 text-purple-300 border border-purple-800/60 font-mono">
                angle_tweak.sh
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
              <span>🎯 Traductor Gráfico ANGLE (OpenGL → Vulkan)</span>
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Google ANGLE (<em>Almost Native Graphics Layer Engine</em>) traduce en tiempo real las llamadas de OpenGL ES de juegos como Free Fire al backend de bajo nivel de <strong>Vulkan</strong>. Reduce los ciclos de CPU y el overhead del driver en GPUs Mali, logrando cuadros más estables durante combates intensos.
            </p>
          </div>

          {/* Tarjeta de Requisito de Hardware */}
          <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl flex flex-col items-center justify-center min-w-[220px] text-center shadow-lg">
            <span className="text-xs text-slate-400 font-semibold mb-1">Hardware Vulkan Detectado</span>
            <div className={`font-mono text-sm font-extrabold ${isVulkan11Supported ? 'text-emerald-400' : 'text-rose-400'}`}>
              {vkInfo.ver}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Código numérico: {vulkanVersionMode === 'v1_1' ? '4198400' : vulkanVersionMode === 'v1_2' ? '4198402' : '4194304'}
            </div>
            <div className={`mt-2 px-2.5 py-0.5 rounded text-[10px] font-bold ${
              isVulkan11Supported ? 'bg-emerald-900/40 text-emerald-300 border border-emerald-800/50' : 'bg-rose-900/40 text-rose-300 border border-rose-800/50'
            }`}>
              {isVulkan11Supported ? 'HABILITADO PARA ANGLE' : 'BLOQUEO AUTOMÁTICO ACTIVO'}
            </div>
          </div>
        </div>
      </div>

      {/* Selector de Simulación de Hardware (para comprobar que el bloqueo funciona) */}
      <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-purple-400" />
              <span>Simulación de Versión de Vulkan del Teléfono</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Comprueba cómo responde el script en caso de que el teléfono tenga Vulkan 1.1 o versión antigua:
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setVulkanVersionMode('v1_1'); setAngleActive(false); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                vulkanVersionMode === 'v1_1'
                  ? 'bg-purple-600/30 text-purple-300 border-purple-500'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
              }`}
            >
              Vulkan 1.1 (Recomendado)
            </button>
            <button
              onClick={() => { setVulkanVersionMode('v1_2'); setAngleActive(false); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                vulkanVersionMode === 'v1_2'
                  ? 'bg-purple-600/30 text-purple-300 border-purple-500'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
              }`}
            >
              Vulkan 1.2+
            </button>
            <button
              onClick={() => { setVulkanVersionMode('v1_0'); setAngleActive(false); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                vulkanVersionMode === 'v1_0'
                  ? 'bg-rose-950/60 text-rose-300 border-rose-600'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
              }`}
            >
              Vulkan 1.0 (Bloquea)
            </button>
          </div>
        </div>
      </div>

      {/* Advertencia si no soporta Vulkan 1.1 */}
      {!isVulkan11Supported && (
        <div className="bg-rose-950/40 border border-rose-800/80 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs">
            <strong className="text-rose-200 block text-sm">Bloqueo de Seguridad Activado</strong>
            <p className="text-rose-300">
              ANGLE requiere al menos <strong>Vulkan 1.1</strong> para traducir shaders y pipelines sin corromper el renderizado. Debido a que el hardware reporta versión inferior, ANGLE queda <strong>desactivado por defecto</strong> para evitar pantallas negras o cierres forzados en tu juego. Tu juego seguirá funcionando en OpenGL ES nativo seguro.
            </p>
          </div>
        </div>
      )}

      {/* Configuración de Juegos y Activación */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna Izquierda: Selección de Juego */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-slate-900/70 border border-slate-800/80 p-5 rounded-xl space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Gamepad2 className="w-4 h-4 text-cyan-400" />
                <span>1. Selecciona el Juego a Optimizar con ANGLE</span>
              </h2>
              <span className="text-[11px] text-slate-400 font-mono">Driver: angle_gl_driver_selection</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {POPULAR_GAMES.map((game) => {
                const isSelected = selectedGamePkg === game.pkg && !customPkg;
                return (
                  <button
                    key={game.id}
                    onClick={() => {
                      setSelectedGamePkg(game.pkg);
                      setCustomPkg('');
                    }}
                    className={`p-3 rounded-lg border text-left transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'bg-purple-950/40 border-purple-500 shadow-md shadow-purple-950/50'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <strong className={`text-xs ${isSelected ? 'text-purple-300' : 'text-slate-200'}`}>
                        {game.name}
                      </strong>
                      {game.recommended && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/50 font-bold">
                          PROBADO
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] font-mono text-slate-500 truncate mt-1">
                      {game.pkg}
                    </span>
                    <span className="text-[10px] text-slate-400 mt-1">
                      {game.genre}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Paquete personalizado */}
            <div className="pt-2 border-t border-slate-800/80">
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                O introduce el paquete de otro juego instalado:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="ej: com.mobile.legends o com.miHoYo.GenshinImpact"
                  value={customPkg}
                  onChange={(e) => setCustomPkg(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-purple-500 font-mono"
                />
                {customPkg && (
                  <button
                    onClick={() => setCustomPkg('')}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold"
                  >
                    Limpiar
                  </button>
                )}
              </div>
            </div>

            {/* Opción de reinicio de la app */}
            <div className="flex items-center justify-between p-3 bg-slate-950/60 border border-slate-800 rounded-lg text-xs">
              <div className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-purple-400" />
                <div>
                  <span className="font-semibold text-slate-200">Reiniciar juego al aplicar</span>
                  <div className="text-[11px] text-slate-500">
                    Ejecuta <code>am force-stop</code> para que el proceso cargue las librerías ANGLE inmediatamente.
                  </div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={forceRestart}
                onChange={(e) => setForceRestart(e.target.checked)}
                className="w-4 h-4 accent-purple-500 rounded cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Columna Derecha: Acciones y Estado */}
        <div className="space-y-4">
          <div className="bg-slate-900/70 border border-slate-800/80 p-5 rounded-xl space-y-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>2. Panel de Control ANGLE</span>
            </h2>

            <div className="bg-slate-950/80 border border-slate-800/80 p-3.5 rounded-lg space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Objetivo:</span>
                <span className="font-mono text-purple-300 font-bold truncate max-w-[140px]">{activePackage}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Driver Actual:</span>
                <span className="font-mono text-slate-200 font-semibold">
                  {angleActive ? 'ANGLE (Vulkan)' : 'Nativo (OpenGL ES)'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Verificación Vulkan 1.1:</span>
                <span className={`font-semibold ${isVulkan11Supported ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {isVulkan11Supported ? 'Superada ✓' : 'Fallida ✗'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Persistencia:</span>
                <span className="text-emerald-400 font-mono">100% Volátil / 0 persist.sys</span>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <button
                disabled={!isVulkan11Supported}
                onClick={() => setAngleActive(true)}
                className={`w-full py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md ${
                  !isVulkan11Supported
                    ? 'bg-slate-800/50 text-slate-600 border border-slate-800 cursor-not-allowed'
                    : angleActive
                    ? 'bg-purple-900/50 text-purple-200 border border-purple-500 shadow-purple-950/50'
                    : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-purple-900/30'
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>{angleActive ? 'ANGLE Activo en ' + activePackage : 'Activar ANGLE (Vulkan Layer)'}</span>
              </button>

              <button
                onClick={() => setAngleActive(false)}
                className="w-full py-2.5 px-4 rounded-xl font-bold text-xs bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-all flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
                <span>Restaurar OpenGL ES Nativo</span>
              </button>
            </div>

            <p className="text-[11px] text-slate-500 text-center">
              Reversible al instante. El respaldo se almacena en <code>/data/local/tmp/mali_angle_backup.state</code>.
            </p>
          </div>
        </div>
      </div>

      {/* Comandos de Terminal para Root / Termux / AxManager */}
      <div className="bg-slate-900/70 border border-slate-800/80 p-5 rounded-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white">Comandos Shell Ejecutables (Root / AxManager)</h3>
          </div>
          <span className="text-[11px] text-slate-500">Copia y pega en Termux o tu terminal favorita</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Comando Activar */}
          <div className="bg-slate-950 border border-slate-800/90 rounded-lg p-3 font-mono text-xs flex flex-col justify-between">
            <div className="text-slate-400 mb-1 flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-purple-400">Activar ANGLE para {activePackage}</span>
              <button
                onClick={() => handleCopy(`su -c "/data/adb/modules/ax_mali_core_optimizer/scripts/angle_tweak.sh enable ${activePackage} ${forceRestart ? 'restart' : '0'}"`, 'cmd-enable')}
                className="text-[11px] text-cyan-400 hover:text-cyan-300 font-sans"
              >
                {copiedCmd === 'cmd-enable' ? 'Copiado ✓' : 'Copiar'}
              </button>
            </div>
            <code className="text-slate-300 break-all text-[11px]">
              su -c "/data/adb/modules/ax_mali_core_optimizer/scripts/angle_tweak.sh enable {activePackage} {forceRestart ? 'restart' : '0'}"
            </code>
          </div>

          {/* Comando Diagnóstico */}
          <div className="bg-slate-950 border border-slate-800/90 rounded-lg p-3 font-mono text-xs flex flex-col justify-between">
            <div className="text-slate-400 mb-1 flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-cyan-400">Diagnóstico Vulkan y ANGLE</span>
              <button
                onClick={() => handleCopy(`su -c "/data/adb/modules/ax_mali_core_optimizer/scripts/angle_tweak.sh diag"`, 'cmd-diag')}
                className="text-[11px] text-cyan-400 hover:text-cyan-300 font-sans"
              >
                {copiedCmd === 'cmd-diag' ? 'Copiado ✓' : 'Copiar'}
              </button>
            </div>
            <code className="text-slate-300 break-all text-[11px]">
              su -c "/data/adb/modules/ax_mali_core_optimizer/scripts/angle_tweak.sh diag"
            </code>
          </div>
        </div>
      </div>

      {/* Explicación Técnica Detallada */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900/50 border border-slate-800/70 p-4 rounded-xl space-y-1.5">
          <div className="flex items-center gap-2 text-purple-400 font-bold text-xs">
            <Layers className="w-4 h-4" />
            <span>¿Cómo funciona ANGLE?</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Interpola una capa de traducción entre las llamadas OpenGL ES de la aplicación y la biblioteca de Vulkan de Android (<code>libvulkan.so</code>). En GPUs Mali, el pipeline multihilo de Vulkan evita atascos en el render thread.
          </p>
        </div>

        <div className="bg-slate-900/50 border border-slate-800/70 p-4 rounded-xl space-y-1.5">
          <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs">
            <ShieldCheck className="w-4 h-4" />
            <span>¿Por qué mínimo Vulkan 1.1?</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Vulkan 1.0 carece de extensiones críticas para la memoria compartida de texturas (<code>VK_KHR_external_memory</code> y subgrupos). Si se fuerza en Vulkan 1.0, el juego se cierra al abrir o muestra pantallas negras.
          </p>
        </div>

        <div className="bg-slate-900/50 border border-slate-800/70 p-4 rounded-xl space-y-1.5">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
            <CheckCircle2 className="w-4 h-4" />
            <span>Cero Riesgo de Brick</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            No toca particiones de solo lectura ni almacena configuraciones permanentes en disco. Los ajustes se configuran únicamente vía <code>settings put global angle_gl_driver_selection_*</code> y se limpian al desinstalar.
          </p>
        </div>
      </div>
    </div>
  );
};
