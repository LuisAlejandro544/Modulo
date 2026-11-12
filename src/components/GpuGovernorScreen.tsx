import React, { useState } from 'react';
import {
  Flame,
  Zap,
  Activity,
  SlidersHorizontal,
  CheckCircle2,
  ShieldCheck,
  Cpu,
  Layers,
  Thermometer,
  RotateCcw
} from 'lucide-react';

/**
 * Componente: GpuGovernorScreen
 * Pantalla dedicada al control de DVFS y Piso de Frecuencia (Floor Frequency)
 * para procesadores gráficos ARM Mali en dispositivos móviles.
 */
export const GpuGovernorScreen: React.FC = () => {
  const [selectedProfile, setSelectedProfile] = useState<'floor' | 'performance' | 'powersave' | 'stock'>('floor');
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(id);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Encabezado Principal */}
      <div className="bg-gradient-to-r from-slate-900 via-cyan-950/40 to-slate-900 border border-cyan-900/40 rounded-2xl p-6 sm:p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-cyan-950 text-cyan-400 border border-cyan-800/60">
                <CheckCircle2 className="w-3.5 h-3.5" />
                DVFS Anti-Drop
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800/60 font-mono">
                governor_tweak.sh
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
              <span>⚡ Piso de Frecuencia GPU Mali</span>
              <span className="text-cyan-400 text-sm font-mono font-normal">v1.3.0</span>
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              El secreto para una fluidez constante con Gráficos Batata. Al reducir la calidad visual, la GPU Mali se relaja
              y el gobernador baja el reloj a 150 MHz para ahorrar energía. Al aparecer un enemigo o explosión, tarda varios fotogramas
              en volver a subir, causando un tirón visible. Fijar un <strong>Piso de Frecuencia (400-500 MHz)</strong> elimina la caída sin calentar el teléfono.
            </p>
          </div>

          {/* Selector de Perfil Actual */}
          <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl flex flex-col items-center justify-center min-w-[210px] text-center shadow-lg">
            <span className="text-xs text-slate-400 font-semibold mb-2">Perfil Activo</span>
            <div className="px-3.5 py-1.5 rounded-lg bg-cyan-950 text-cyan-300 border border-cyan-800/60 font-mono font-bold text-xs flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
              <span>
                {selectedProfile === 'floor' && 'Piso 400-500 MHz (Anti-Drop)'}
                {selectedProfile === 'performance' && 'Rendimiento Máximo (Frec. Top)'}
                {selectedProfile === 'powersave' && 'Ahorro Batería (Min)'}
                {selectedProfile === 'stock' && 'Gobernador de Fábrica'}
              </span>
            </div>
            <span className="text-[11px] text-slate-500 mt-2">
              {selectedProfile === 'floor' ? '60 FPS estables sin sobrecalentar' : 'Escalado manual'}
            </span>
          </div>
        </div>
      </div>

      {/* Explicación Técnica: Por qué el Modo Batata deja tibia la GPU */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-cyan-950 text-cyan-400 border border-cyan-800/60 rounded-xl">
            <Thermometer className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-white">¿Por qué el teléfono solo se pone tibio con Gráficos Batata?</h4>
            <p className="text-xs text-slate-300 leading-relaxed mt-1">
              Al bajar la resolución al 50%, la superficie de píxeles se reduce al 25% ($0.5 \times 0.5$). La GPU Mali calcula un 75% menos de fragment shaders,
              evitando el sobrecalentamiento. Sin embargo, al tener tan poca carga, el gobernador baja la velocidad a 150 MHz creyendo que estás en la pantalla de inicio.
              ¡Fijar el piso a 400-500 MHz garantiza reacción inmediata en cada disparo!
            </p>
          </div>
        </div>
      </div>

      {/* Selector de Perfiles de Frecuencia */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Perfil 1: Piso Anti-Drop (Recomendado) */}
        <div
          onClick={() => setSelectedProfile('floor')}
          className={`cursor-pointer border p-4 rounded-xl transition-all flex flex-col justify-between ${
            selectedProfile === 'floor'
              ? 'bg-cyan-950/40 border-cyan-500 shadow-lg shadow-cyan-950/50'
              : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-950 text-cyan-400 border border-cyan-800/60">
                RECOMENDADO
              </span>
              <Zap className="w-4 h-4 text-cyan-400" />
            </div>
            <h3 className="font-bold text-sm text-white">Piso Anti-Drop (Floor)</h3>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              Fija la frecuencia mínima entre <strong>400 y 500 MHz</strong>. La GPU jamás baja a 150 MHz en mitad de la partida. Cero tirones al apuntar.
            </p>
          </div>
          <div className="mt-4 pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] font-mono text-cyan-400">
            <span>min_freq = 400 MHz</span>
            <span>{selectedProfile === 'floor' ? 'Activo ✓' : 'Seleccionar'}</span>
          </div>
        </div>

        {/* Perfil 2: Rendimiento Máximo */}
        <div
          onClick={() => setSelectedProfile('performance')}
          className={`cursor-pointer border p-4 rounded-xl transition-all flex flex-col justify-between ${
            selectedProfile === 'performance'
              ? 'bg-amber-950/40 border-amber-500 shadow-lg shadow-amber-950/50'
              : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950 text-amber-400 border border-amber-800/60">
                MÁXIMO
              </span>
              <Flame className="w-4 h-4 text-amber-400" />
            </div>
            <h3 className="font-bold text-sm text-white">Rendimiento Top</h3>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              Fuerza el gobernador <span className="font-mono text-amber-400">performance</span> o fija el reloj en la frecuencia tope del chip.
            </p>
          </div>
          <div className="mt-4 pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] font-mono text-amber-400">
            <span>min_freq = max_freq</span>
            <span>{selectedProfile === 'performance' ? 'Activo ✓' : 'Seleccionar'}</span>
          </div>
        </div>

        {/* Perfil 3: Ahorro de Batería */}
        <div
          onClick={() => setSelectedProfile('powersave')}
          className={`cursor-pointer border p-4 rounded-xl transition-all flex flex-col justify-between ${
            selectedProfile === 'powersave'
              ? 'bg-emerald-950/40 border-emerald-500 shadow-lg shadow-emerald-950/50'
              : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800/60">
                ECO
              </span>
              <Cpu className="w-4 h-4 text-emerald-400" />
            </div>
            <h3 className="font-bold text-sm text-white">Ahorro de Batería</h3>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              Ideal para ver videos o jugar títulos 2D sencillos reduciendo el consumo eléctrico al mínimo posible.
            </p>
          </div>
          <div className="mt-4 pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] font-mono text-emerald-400">
            <span>governor = powersave</span>
            <span>{selectedProfile === 'powersave' ? 'Activo ✓' : 'Seleccionar'}</span>
          </div>
        </div>

        {/* Perfil 4: Restaurar Fábrica */}
        <div
          onClick={() => setSelectedProfile('stock')}
          className={`cursor-pointer border p-4 rounded-xl transition-all flex flex-col justify-between ${
            selectedProfile === 'stock'
              ? 'bg-slate-800/80 border-slate-500'
              : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                ORIGINAL
              </span>
              <RotateCcw className="w-4 h-4 text-slate-400" />
            </div>
            <h3 className="font-bold text-sm text-white">Valores de Fábrica</h3>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              Restaura exactamente el gobernador dinámico y el escalado original con el que venía tu teléfono.
            </p>
          </div>
          <div className="mt-4 pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span>restore_backup()</span>
            <span>{selectedProfile === 'stock' ? 'Activo ✓' : 'Seleccionar'}</span>
          </div>
        </div>
      </div>

      {/* Comandos Shell para el Teléfono */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-3">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <span>Comando Shell para AX Manager / Terminal</span>
        </h3>
        <p className="text-xs text-slate-400 leading-relaxed">
          Puedes ejecutar este script directamente desde la pestaña de empaquetado o en el WebUI de AxManager:
        </p>
        <div className="bg-slate-950 border border-slate-800 p-3 rounded-lg flex items-center justify-between font-mono text-xs text-cyan-400">
          <span>sh governor_tweak.sh floor 400000000</span>
          <button
            onClick={() => handleCopy('sh governor_tweak.sh floor 400000000', 'cg1')}
            className="text-xs text-slate-300 hover:text-white"
          >
            {copiedCmd === 'cg1' ? 'Copiado ✓' : 'Copiar'}
          </button>
        </div>
      </div>

      {/* Banner de Auditoría & Respaldo */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-cyan-950 text-cyan-400 border border-cyan-800/60 rounded-xl">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-white">Auditoría de Nodos y Cero Riesgo</h4>
            <p className="text-xs text-slate-400">
              Compatible con SoCs MediaTek (Helio G / Dimensity) y Samsung Exynos Mali. Respaldo en <span className="font-mono text-cyan-400">/data/local/tmp/mali_governor_backup.state</span>.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 bg-slate-950 text-cyan-400 border border-slate-800 rounded-md text-xs font-mono">
            devfreq sysfs ✓
          </span>
          <span className="px-2.5 py-1 bg-slate-950 text-cyan-400 border border-slate-800 rounded-md text-xs font-mono">
            32 & 64 bit ✓
          </span>
        </div>
      </div>
    </div>
  );
};
