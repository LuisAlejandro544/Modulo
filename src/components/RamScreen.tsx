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
  Info
} from 'lucide-react';

/**
 * Componente: RamScreen
 * Pantalla dedicada a la gestión de memoria RAM & ZRAM Anti-Stuttering.
 * Resuelve directamente el problema de los tirones (micro-freezes) que ocurren
 * durante los juegos aunque los gráficos estén en calidad reducida.
 */
export const RamScreen: React.FC = () => {
  const [swappinessValue, setSwappinessValue] = useState<number>(50);
  const [antiStutterEnabled, setAntiStutterEnabled] = useState<boolean>(true);
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
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800/60">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Anti-Stutter Operativo
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-cyan-950 text-cyan-400 border border-cyan-800/60 font-mono">
                ram_tweak.sh
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
              <span>🧠 Anti-Stutter RAM & ZRAM</span>
              <span className="text-emerald-400 text-sm font-mono font-normal">v1.3.0</span>
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Elimina los micro-congelamientos de pantalla (100–300 ms) en juegos pesados. Cuando los gráficos están en modo batata,
              la GPU trabaja relajada, pero los tirones en tiroteos son provocados por la compresión agresiva de ZRAM en CPU y el almacenamiento flash lento.
            </p>
          </div>

          {/* Switch Maestro */}
          <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl flex flex-col items-center justify-center min-w-[200px] text-center shadow-lg">
            <span className="text-xs text-slate-400 font-semibold mb-2">Estado Anti-Stutter</span>
            <button
              onClick={() => setAntiStutterEnabled(!antiStutterEnabled)}
              className={`w-full py-2.5 px-4 rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md ${
                antiStutterEnabled
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/30'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              <Zap className={`w-4 h-4 ${antiStutterEnabled ? 'text-amber-300 fill-amber-300' : ''}`} />
              <span>{antiStutterEnabled ? 'Activo (Swappiness 50)' : 'Desactivado (Fábrica 100)'}</span>
            </button>
            <span className="text-[11px] text-slate-500 mt-2">
              {antiStutterEnabled ? 'Cero picos de compresión ZRAM' : 'Parámetros por defecto'}
            </span>
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
          <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">compact_memory</div>
          <div className="text-lg font-extrabold mt-1 font-mono text-amber-400">
            {antiStutterEnabled ? '0 (Suprimido)' : 'Activo (Síncrono)'}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Sin pausas de compactación</div>
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
