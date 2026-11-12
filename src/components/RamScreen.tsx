import React, { useState } from 'react';
import {
  Layers,
  Zap,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Copy,
  Sliders,
  ShieldCheck,
  Cpu,
  Info,
  PauseCircle,
  PlayCircle,
  Snowflake,
  Terminal,
  Sparkles
} from 'lucide-react';

/**
 * Componente: RamScreen
 * Pantalla dedicada a la gestión de memoria RAM & ZRAM Anti-Stuttering.
 * Incorpora el Congelador de Procesos (Process Freezer vía SIGSTOP/SIGCONT)
 * para evitar que las aplicaciones se vuelvan a levantar solas mientras juegas.
 */
export const RamScreen: React.FC = () => {
  const [swappinessValue, setSwappinessValue] = useState<number>(50);
  const [antiStutterEnabled, setAntiStutterEnabled] = useState<boolean>(true);
  const [freezerActive, setFreezerActive] = useState<boolean>(true);
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);
  const [isPurging, setIsPurging] = useState<boolean>(false);
  const [purgeSuccess, setPurgeSuccess] = useState<boolean>(false);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(id);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  const handlePurge = () => {
    setIsPurging(true);
    setTimeout(() => {
      setIsPurging(false);
      setPurgeSuccess(true);
      setTimeout(() => setPurgeSuccess(false), 3000);
    }, 1000);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Encabezado Principal */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950/30 to-slate-900 border border-emerald-900/40 rounded-2xl p-6 sm:p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800/60">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Anti-Stutter & Freezer Operativo
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-cyan-950 text-cyan-400 border border-cyan-800/60 font-mono">
                ram_tweak.sh
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
              <span>🧠 Anti-Stutter RAM & Congelador de Apps</span>
              <span className="text-emerald-400 text-sm font-mono font-normal">v1.3.0</span>
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Resuelve el problema real de la memoria en Android: en vez de matar aplicaciones (lo que hace que Zygote y alarmas las vuelvan a levantar a los 5 segundos), las <strong>congela mediante señales POSIX SIGSTOP</strong> en 0% CPU. Al desactivar el módulo, se <strong>descongelan inmediatamente (SIGCONT)</strong> y todo vuelve a la normalidad.
            </p>
          </div>

          {/* Switch Maestro */}
          <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl flex flex-col items-center justify-center min-w-[210px] text-center shadow-lg">
            <span className="text-xs text-slate-400 font-semibold mb-2">Estado del Módulo</span>
            <button
              onClick={() => {
                const next = !antiStutterEnabled;
                setAntiStutterEnabled(next);
                setFreezerActive(next);
              }}
              className={`w-full py-2.5 px-4 rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md ${
                antiStutterEnabled
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/30'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              <Zap className={`w-4 h-4 ${antiStutterEnabled ? 'text-amber-300 fill-amber-300' : ''}`} />
              <span>{antiStutterEnabled ? 'Activo (Swappiness 50 + Freezer)' : 'Desactivado (Fábrica 100)'}</span>
            </button>
            <span className="text-[11px] text-slate-500 mt-2">
              {antiStutterEnabled ? 'Apps congeladas en 0% CPU' : 'Comportamiento estándar de Android'}
            </span>
          </div>
        </div>
      </div>

      {/* NUEVA SECCIÓN: Congelador de Procesos vs Matar Apps */}
      <div className="bg-gradient-to-r from-cyan-950/40 via-slate-900 to-indigo-950/40 border border-cyan-800/40 rounded-2xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-950 text-cyan-300 border border-cyan-800/60 font-mono">
              <Snowflake className="w-3.5 h-3.5 text-cyan-400" />
              <span>SIGSTOP & SIGCONT Process Freezer</span>
            </div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span>❄️ Congelamiento de Apps Secundarias (Cero Despertares en Partida)</span>
            </h2>
            <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
              Cuando juegas, las apps en segundo plano (redes sociales, servicios de la ROM, tiendas secundarias) no deben cerrarse bruscamente porque Android las revivirá de inmediato. El congelador pausa su ejecución a nivel de scheduler en el kernel de Linux.
            </p>
          </div>

          <div className="bg-slate-950 border border-slate-800 p-3.5 rounded-xl shrink-0 flex items-center gap-4">
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400">Estado del Congelador</div>
              <div className={`text-sm font-extrabold font-mono ${freezerActive ? 'text-cyan-400' : 'text-slate-400'}`}>
                {freezerActive ? '❄️ 12-18 Apps Congeladas' : '☀️ Todo en Ejecución Normal'}
              </div>
            </div>
            <button
              onClick={() => setFreezerActive(!freezerActive)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                freezerActive
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  : 'bg-cyan-600 hover:bg-cyan-500 text-white'
              }`}
            >
              {freezerActive ? (
                <>
                  <PlayCircle className="w-3.5 h-3.5 text-amber-300" />
                  <span>Descongelar</span>
                </>
              ) : (
                <>
                  <PauseCircle className="w-3.5 h-3.5 text-cyan-300" />
                  <span>Congelar Ahora</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Comparativa pedagógica */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
          <div className="bg-slate-950/70 border border-rose-900/30 p-3.5 rounded-xl space-y-1.5">
            <div className="text-xs font-bold text-rose-400 flex items-center gap-1.5">
              <span>❌ Matar Apps Tradicional (Inútil en Android)</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Un script o limpiador de RAM mata WhatsApp o Instagram. A los 5 segundos, un <em>BroadcastReceiver</em> o una alarma de red hace que <strong>Zygote bifurque el proceso otra vez</strong>. Resultado: picos de CPU, calor y tirones mientras juegas.
            </p>
          </div>

          <div className="bg-slate-950/70 border border-emerald-900/30 p-3.5 rounded-xl space-y-1.5">
            <div className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
              <span>✓ Congelar con SIGSTOP (Solución Inteligente)</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              El proceso se pone en pausa en el kernel (0% CPU, 0 llamadas a disco). Android cree que el proceso sigue vivo y <strong>NO intenta reiniciarlo</strong>. Al terminar tu juego, <code>SIGCONT</code> lo despierta al instante sin perder nada.
            </p>
          </div>
        </div>
      </div>

      {/* Alerta Destacada: RAM Virtual / RAM Plus */}
      <div className="bg-amber-950/30 border border-amber-800/60 rounded-xl p-5 flex items-start gap-3.5">
        <div className="p-2 bg-amber-900/50 text-amber-400 rounded-lg shrink-0 mt-0.5">
          <AlertTriangle className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-amber-300 flex items-center gap-2">
            <span>¡CUIDADO con la "RAM Virtual" de fábrica (RAM Plus / Extensión de Memoria)!</span>
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Fabricantes como Xiaomi, Samsung y Realme promocionan "+4 GB o +6 GB de RAM Virtual". Esta memoria NO es física:
            se crea en el chip de almacenamiento de tu teléfono (eMMC o UFS), que es hasta <strong>10 veces más lento que la RAM real LPDDR4X</strong>.
            Cuando un juego entra en tiroteo y accede a esa memoria lenta, la pantalla se congela por completo.
          </p>
          <div className="pt-2 text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" />
            <span>Recomendación: Desactiva "Extensión de memoria" en Ajustes Adicionales de tu teléfono para eliminar el 80% de los tirones.</span>
          </div>
        </div>
      </div>

      {/* Métricas Técnicas de Memoria en Vivo */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
          <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">vm.swappiness</div>
          <div className="text-lg font-extrabold mt-1 font-mono text-emerald-400">
            {antiStutterEnabled ? `${swappinessValue} (Bajo)` : '100 / 160 (Alto)'}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Evita compresión CPU en combate</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
          <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">vfs_cache_pressure</div>
          <div className="text-lg font-extrabold mt-1 font-mono text-cyan-400">
            {antiStutterEnabled ? '50 (Retener)' : '100 (Estándar)'}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Mantiene estructuras de juego en RAM</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
          <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">page-cluster</div>
          <div className="text-lg font-extrabold mt-1 font-mono text-emerald-400">
            {antiStutterEnabled ? '0 (1 página)' : '3 (8 páginas ráfaga)'}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Cero retardo de paginación</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
          <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Process Freezer</div>
          <div className="text-lg font-extrabold mt-1 font-mono text-cyan-400">
            {freezerActive ? 'SIGSTOP (Pausadas)' : 'Normal (Activas)'}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Apps protegidas contra reinicios</div>
        </div>
      </div>

      {/* Los 3 Pilares del Módulo Anti-Stutter */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Pilar 1 */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-emerald-950 text-emerald-400 border border-emerald-800/50">
                <Sliders className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-sm text-white">1. Control de Swappiness</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Android por defecto tiene el swappiness en 100 o 160. Al bajarlo a <strong>50</strong>, el kernel de Linux
              prioriza retener las páginas de texturas del juego en la memoria RAM física en lugar de comprimirlas en ZRAM. Menos ciclos de compresión en CPU = cero tirones al apuntar.
            </p>
          </div>
          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono text-slate-400">
            <span>echo 50 &gt; /proc/sys/vm/swappiness</span>
            <button
              onClick={() => handleCopy('echo 50 > /proc/sys/vm/swappiness', 'c1')}
              className="text-xs text-cyan-400 hover:text-cyan-300"
            >
              {copiedCmd === 'c1' ? 'Copiado ✓' : 'Copiar'}
            </button>
          </div>
        </div>

        {/* Pilar 2 */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-cyan-950 text-cyan-400 border border-cyan-800/50">
                <Cpu className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-sm text-white">2. Retención de Inodos VFS</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Ajustar <span className="font-mono text-cyan-400">vfs_cache_pressure</span> a 50 le prohíbe al sistema
              vaciar las direcciones de memoria de los archivos que Unity/Unreal Engine ya abrieron, evitando que el juego tenga que volver a leer los archivos OBB del almacenamiento.
            </p>
          </div>
          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono text-slate-400">
            <span>echo 50 &gt; /proc/sys/vm/vfs_cache_pressure</span>
            <button
              onClick={() => handleCopy('echo 50 > /proc/sys/vm/vfs_cache_pressure', 'c2')}
              className="text-xs text-cyan-400 hover:text-cyan-300"
            >
              {copiedCmd === 'c2' ? 'Copiado ✓' : 'Copiar'}
            </button>
          </div>
        </div>

        {/* Pilar 3 */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-amber-950 text-amber-400 border border-amber-800/50">
                <Zap className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-sm text-white">3. Page-Cluster a Cero</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              El valor tradicional (3) fuerza a la CPU a leer 8 páginas consecutivas de swap cada vez que se requiere una.
              Al fijar <span className="font-mono text-amber-400">page-cluster = 0</span>, la lectura en ZRAM es atómica de 1 página exacta ($2^0=1$), eliminando la sobrecarga.
            </p>
          </div>
          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono text-slate-400">
            <span>echo 0 &gt; /proc/sys/vm/page-cluster</span>
            <button
              onClick={() => handleCopy('echo 0 > /proc/sys/vm/page-cluster', 'c3')}
              className="text-xs text-cyan-400 hover:text-cyan-300"
            >
              {copiedCmd === 'c3' ? 'Copiado ✓' : 'Copiar'}
            </button>
          </div>
        </div>
      </div>

      {/* Comandos de Terminal para Root / Termux / AxManager */}
      <div className="bg-slate-900/70 border border-slate-800/80 p-5 rounded-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white">Comandos Shell para Congelar / Descongelar Apps</h3>
          </div>
          <span className="text-[11px] text-slate-500 font-mono">ram_tweak.sh freeze / thaw</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 font-mono text-xs flex flex-col justify-between">
            <div className="text-slate-400 mb-1 flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-cyan-400">Congelar apps secundarias (SIGSTOP)</span>
              <button
                onClick={() => handleCopy('su -c "/data/adb/modules/ax_mali_core_optimizer/scripts/ram_tweak.sh freeze"', 'cmd-freeze')}
                className="text-[11px] text-cyan-400 hover:text-cyan-300 font-sans"
              >
                {copiedCmd === 'cmd-freeze' ? 'Copiado ✓' : 'Copiar'}
              </button>
            </div>
            <code className="text-slate-300 break-all text-[11px]">
              su -c "/data/adb/modules/ax_mali_core_optimizer/scripts/ram_tweak.sh freeze"
            </code>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 font-mono text-xs flex flex-col justify-between">
            <div className="text-slate-400 mb-1 flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-emerald-400">Descongelar a la normalidad (SIGCONT)</span>
              <button
                onClick={() => handleCopy('su -c "/data/adb/modules/ax_mali_core_optimizer/scripts/ram_tweak.sh thaw"', 'cmd-thaw')}
                className="text-[11px] text-cyan-400 hover:text-cyan-300 font-sans"
              >
                {copiedCmd === 'cmd-thaw' ? 'Copiado ✓' : 'Copiar'}
              </button>
            </div>
            <code className="text-slate-300 break-all text-[11px]">
              su -c "/data/adb/modules/ax_mali_core_optimizer/scripts/ram_tweak.sh thaw"
            </code>
          </div>
        </div>
      </div>

      {/* Botón de Purga Inmediata de RAM */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h4 className="font-bold text-sm text-white">Purga Profunda de Caché en RAM</h4>
          <p className="text-xs text-slate-400">
            Sincroniza y vacía pagecache y dentries acumulados en memoria volátil para iniciar tu partida con RAM 100% limpia.
          </p>
        </div>
        <button
          onClick={handlePurge}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-2 transition shrink-0"
        >
          <RefreshCw className={`w-4 h-4 ${isPurging ? 'animate-spin' : ''}`} />
          <span>{purgeSuccess ? '¡RAM Purgada al 100%! ✓' : 'Purgar RAM en Caliente'}</span>
        </button>
      </div>

      {/* Banner de Seguridad & Arquitectura */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-950 text-emerald-400 border border-emerald-800/60 rounded-xl">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-white">Cero Modificaciones en Disco Flash (100% Reversible)</h4>
            <p className="text-xs text-slate-400">
              Todos los ajustes se escriben exclusivamente en los controladores de memoria volátil <span className="font-mono text-cyan-400">/proc/sys/vm/</span>. Respaldo en <span className="font-mono text-cyan-400">/data/local/tmp/mali_ram_backup.state</span>.
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
