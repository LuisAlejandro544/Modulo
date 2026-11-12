import React, { useState } from 'react';
import {
  Zap,
  Cpu,
  Layers,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Trash2,
  Activity,
  Flame,
  Terminal,
  RefreshCw,
  SlidersHorizontal,
  Info
} from 'lucide-react';

export const FpsScreen: React.FC = () => {
  // Estado local interactivo en la web para demostrar la configuración activa por defecto
  const [engineEnabled, setEngineEnabled] = useState(true);
  const [latchEnabled, setLatchEnabled] = useState(true);
  const [affinityEnabled, setAffinityEnabled] = useState(true);
  const [blurDisabled, setBlurDisabled] = useState(true);
  const [ramPurged, setRamPurged] = useState(false);
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(id);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  const handlePurgeRam = () => {
    setRamPurged(true);
    setTimeout(() => setRamPurged(false), 2500);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Encabezado Principal */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-900/50 rounded-2xl p-6 sm:p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Activado por Defecto
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-cyan-950/80 text-cyan-400 border border-cyan-800/60 font-mono">
                fps_boost.sh
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
              <span>🚀 Ultra FPS Engine</span>
              <span className="text-cyan-400 text-sm font-mono font-normal">v1.3.0</span>
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Sistema de optimización profunda para procesadores gráficos Mali. Ataca los 4 cuellos de botella
              críticos que provocan caídas bruscas de frames en shooters y juegos competitivos: sincronización rígida de V-Sync,
              asignación de hilos a núcleos lentos, sobrecarga de Gaussian Blur en capas personalizadas y micro-tirones por compactación de RAM.
            </p>
          </div>

          {/* Switch Maestro */}
          <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl flex flex-col items-center justify-center min-w-[200px] text-center shadow-lg">
            <span className="text-xs text-slate-400 font-semibold mb-2">Estado del Motor</span>
            <button
              onClick={() => {
                const next = !engineEnabled;
                setEngineEnabled(next);
                setLatchEnabled(next);
                setAffinityEnabled(next);
                setBlurDisabled(next);
              }}
              className={`w-full py-2.5 px-4 rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md ${
                engineEnabled
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-900/30'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              <Zap className={`w-4 h-4 ${engineEnabled ? 'text-amber-300 fill-amber-300' : ''}`} />
              <span>{engineEnabled ? 'Motor Activo (Ultra FPS)' : 'Motor Desactivado'}</span>
            </button>
            <span className="text-[11px] text-slate-500 mt-2">
              {engineEnabled ? 'Parámetros inyectados en RAM' : 'Valores estándar del sistema'}
            </span>
          </div>
        </div>
      </div>

      {/* Métricas en tiempo de ejecución */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900/70 border border-slate-800/80 p-3.5 rounded-xl">
          <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">V-Sync Latency</div>
          <div className={`text-sm font-extrabold mt-1 font-mono ${engineEnabled && latchEnabled ? 'text-emerald-400' : 'text-slate-400'}`}>
            {engineEnabled && latchEnabled ? 'Latch Unsignaled ✓' : 'Estándar (Buffer rígido)'}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Elimina drops de 60 a 30 FPS</div>
        </div>

        <div className="bg-slate-900/70 border border-slate-800/80 p-3.5 rounded-xl">
          <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Prioridad CPU</div>
          <div className={`text-sm font-extrabold mt-1 font-mono ${engineEnabled && affinityEnabled ? 'text-cyan-400' : 'text-slate-400'}`}>
            {engineEnabled && affinityEnabled ? 'Renice -20 (Big Cores)' : 'Prioridad Normal (0)'}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Anclado a Cortex-A76/A78</div>
        </div>

        <div className="bg-slate-900/70 border border-slate-800/80 p-3.5 rounded-xl">
          <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">HWUI DrawBlur</div>
          <div className={`text-sm font-extrabold mt-1 font-mono ${engineEnabled && blurDisabled ? 'text-emerald-400' : 'text-slate-400'}`}>
            {engineEnabled && blurDisabled ? 'Desactivado (+20% GPU)' : 'Activo (Gasto ROM)'}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Sin blur en MIUI/HyperOS</div>
        </div>

        <div className="bg-slate-900/70 border border-slate-800/80 p-3.5 rounded-xl">
          <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Caché en RAM</div>
          <div className="text-sm font-extrabold mt-1 font-mono text-amber-400">
            {ramPurged ? '¡Purgada Ahora! ✓' : 'Limpia / Zero LMKD'}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Sin tirones de ZRAM</div>
        </div>
      </div>

      {/* Los 4 Pilares Técnicos Detallados */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Pilar 1 */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-emerald-950 text-emerald-400 border border-emerald-800/50">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">1. Desbloqueo de Latencia V-Sync</h3>
                  <span className="text-[11px] text-emerald-400 font-mono">debug.sf.latch_unsignaled = 1</span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={latchEnabled}
                onChange={(e) => setLatchEnabled(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-500 bg-slate-800 border-slate-700"
              />
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              En Android convencional, SurfaceFlinger retiene el búfer del juego hasta el pulso del reloj de la pantalla. Si la GPU Mali
              tarda una fracción de milisegundo extra, el fotograma se pierde y la tasa cae a la mitad. Con <span className="text-emerald-400 font-mono">latch_unsignaled</span>,
              SurfaceFlinger compone el fotograma de inmediato en cuanto la GPU lo termina.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono text-slate-400">
            <span>setprop debug.sf.latch_unsignaled 1</span>
            <button
              onClick={() => handleCopy('setprop debug.sf.latch_unsignaled 1', 'p1')}
              className="text-xs text-cyan-400 hover:text-cyan-300"
            >
              {copiedCmd === 'p1' ? 'Copiado ✓' : 'Copiar'}
            </button>
          </div>
        </div>

        {/* Pilar 2 */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-cyan-950 text-cyan-400 border border-cyan-800/50">
                  <Cpu className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">2. Afinidad CPU & Prioridad Real</h3>
                  <span className="text-[11px] text-cyan-400 font-mono">renice -n -20 & top-app cpuset</span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={affinityEnabled}
                onChange={(e) => setAffinityEnabled(e.target.checked)}
                className="w-4 h-4 rounded text-cyan-500 bg-slate-800 border-slate-700"
              />
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              En SoCs MediaTek (Helio G y Dimensity), el programador del kernel a menudo envía el hilo de renderizado
              a los núcleos eficientes Cortex-A55 para no calentar la batería. Este script asigna máxima prioridad <span className="text-cyan-400 font-mono">-20</span> y
              ancla el juego al cpuset <span className="text-cyan-400 font-mono">top-app</span> (núcleos Big Cortex-A76/A77/A78).
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono text-slate-400">
            <span>renice -n -20 -p $(pidof juego)</span>
            <button
              onClick={() => handleCopy('renice -n -20 -p $(pidof com.dts.freefireth)', 'p2')}
              className="text-xs text-cyan-400 hover:text-cyan-300"
            >
              {copiedCmd === 'p2' ? 'Copiado ✓' : 'Copiar'}
            </button>
          </div>
        </div>

        {/* Pilar 3 */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-indigo-950 text-indigo-400 border border-indigo-800/50">
                  <Flame className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">3. Supresión de Desenfoque ROM</h3>
                  <span className="text-[11px] text-indigo-400 font-mono">debug.hwui.disable_draw_blur = 1</span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={blurDisabled}
                onChange={(e) => setBlurDisabled(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-500 bg-slate-800 border-slate-700"
              />
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Capas pesadas como MIUI, HyperOS, Realme UI y One UI mantienen activos shaders de Gaussian Blur para ventanas flotantes
              y menús. Esto satura los pipelines de las GPUs Mali. Desactivar este cómputo libera entre un 15% y 25% de la GPU Mali para tus juegos.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono text-slate-400">
            <span>setprop debug.hwui.disable_draw_blur 1</span>
            <button
              onClick={() => handleCopy('setprop debug.hwui.disable_draw_blur 1', 'p3')}
              className="text-xs text-cyan-400 hover:text-cyan-300"
            >
              {copiedCmd === 'p3' ? 'Copiado ✓' : 'Copiar'}
            </button>
          </div>
        </div>

        {/* Pilar 4 */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-amber-950 text-amber-400 border border-amber-800/50">
                  <Trash2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">4. Limpiador RAM & Zero LMKD</h3>
                  <span className="text-[11px] text-amber-400 font-mono">drop_caches & compact_memory 0</span>
                </div>
              </div>
              <button
                onClick={handlePurgeRam}
                className="px-2.5 py-1 bg-amber-600/30 hover:bg-amber-600/50 text-amber-300 border border-amber-500/40 rounded-lg text-[11px] font-bold flex items-center gap-1 transition"
              >
                <RefreshCw className={`w-3 h-3 ${ramPurged ? 'animate-spin' : ''}`} />
                <span>Purgar RAM</span>
              </button>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              En teléfonos de 3GB, 4GB o 6GB de RAM, la compresión de ZRAM congela el juego por 100-300ms cuando la RAM se satura.
              Al sincronizar y vaciar <span className="text-amber-400 font-mono">drop_caches</span>, el kernel inicia la partida con páginas limpias,
              evitando los micro-congelamientos en plenos enfrentamientos.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono text-slate-400">
            <span>sync; echo 3 &gt; /proc/sys/vm/drop_caches</span>
            <button
              onClick={() => handleCopy('sync; echo 3 > /proc/sys/vm/drop_caches', 'p4')}
              className="text-xs text-cyan-400 hover:text-cyan-300"
            >
              {copiedCmd === 'p4' ? 'Copiado ✓' : 'Copiar'}
            </button>
          </div>
        </div>
      </div>

      {/* Banner de Seguridad & Arquitectura */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-950 text-emerald-400 border border-emerald-800/60 rounded-xl">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-white">Auditoría de Seguridad y Compatibilidad</h4>
            <p className="text-xs text-slate-400">
              Operación 100% en memoria volátil RAM (sin persist.sys). Respaldo en <span className="font-mono text-cyan-400">/data/local/tmp/mali_fps_backup.state</span>.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 bg-slate-950 text-cyan-400 border border-slate-800 rounded-md text-xs font-mono">
            32-bit (armeabi-v7a) ✓
          </span>
          <span className="px-2.5 py-1 bg-slate-950 text-cyan-400 border border-slate-800 rounded-md text-xs font-mono">
            64-bit (arm64-v8a) ✓
          </span>
        </div>
      </div>
    </div>
  );
};
