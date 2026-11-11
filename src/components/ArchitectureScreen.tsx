import React from 'react';
import { Smartphone, Zap, Shield, Cpu, Layers, CheckCircle2 } from 'lucide-react';
import { ARCHITECTURE_PROFILES } from '../utils/moduleData';

export const ArchitectureScreen: React.FC = () => {
  return (
    <div className="space-y-8 pb-12">
      {/* Cabecera */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-950 text-indigo-400 border border-indigo-800/60 text-xs font-semibold mb-2">
          <Smartphone className="w-3.5 h-3.5" />
          Compatibilidad Dual de Arquitectura
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
          Arquitecturas Móviles Soportadas (32-bit y 64-bit)
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Diseñado para funcionar tanto en terminales modernos de alto rendimiento como en dispositivos económicos con procesadores Mali.
        </p>
      </div>

      {/* Tarjetas de arquitectura 32 vs 64 bits */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {ARCHITECTURE_PROFILES.map((profile) => (
          <div
            key={profile.abi}
            className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between hover:border-slate-700 transition"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="px-3 py-1 rounded-lg bg-indigo-500/10 text-indigo-400 font-mono text-xs font-bold border border-indigo-500/20">
                  {profile.bits}
                </span>
                <span className="text-xs font-mono text-slate-400">{profile.abi}</span>
              </div>

              <h3 className="text-lg font-bold text-white">{profile.generation}</h3>
              <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">{profile.notes}</p>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800 text-xs text-slate-400 space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Compatibilidad verificada en script <code className="text-cyan-400">mali_common.sh</code></span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Gestión segura de memoria y búferes gráficos</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Familias de Procesadores Gráficos Mali */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 sm:p-8">
        <h3 className="text-base sm:text-lg font-bold text-white mb-2 flex items-center gap-2">
          <Cpu className="w-5 h-5 text-cyan-400" />
          Familias de GPU Mali en Teléfonos Android
        </h3>
        <p className="text-xs sm:text-sm text-slate-400 mb-6">
          Los scripts creados escanean dinámicamente los nodos del kernel sin forzar configuraciones que puedan provocar inestabilidad.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
            <div className="text-xs font-semibold text-cyan-400 uppercase tracking-wider mb-1">Valhall & 5th Gen</div>
            <div className="text-sm font-bold text-white">Mali-G77, G78, G710, G720</div>
            <p className="text-xs text-slate-400 mt-2">
              Arquitecturas modernas de ejecución de 64 bits en SoCs Dimensity de MediaTek y Exynos.
            </p>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
            <div className="text-xs font-semibold text-cyan-400 uppercase tracking-wider mb-1">Bifrost</div>
            <div className="text-sm font-bold text-white">Mali-G31, G51, G52, G76</div>
            <p className="text-xs text-slate-400 mt-2">
              Ampliamente extendido en dispositivos de gama media y de entrada en Android 9 hasta 14+.
            </p>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
            <div className="text-xs font-semibold text-cyan-400 uppercase tracking-wider mb-1">Midgard (Legacy)</div>
            <div className="text-sm font-bold text-white">Mali-T720, T760, T880</div>
            <p className="text-xs text-slate-400 mt-2">
              Dispositivos 32-bit legacy o antiguos con drivers EGL clásicos.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
