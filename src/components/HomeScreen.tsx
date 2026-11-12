import React from 'react';
import { Cpu, ShieldCheck, CheckCircle2, FileCode2, ArrowRight, Zap, DownloadCloud, Sparkles, Sliders } from 'lucide-react';
import { ScreenTab } from './Navbar';

interface HomeScreenProps {
  onNavigate: (tab: ScreenTab) => void;
  onOpenGuide: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ onNavigate, onOpenGuide }) => {
  return (
    <div className="space-y-8 pb-12">
      {/* Banner Hero: Hello World */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-slate-800 p-6 sm:p-10 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-12 -ml-12 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold mb-4">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            React Compilado OK • Módulo Táctil Mali Listo
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Hello World! <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-400">
              AX Manager & Mali GPU Engine
            </span>
          </h1>

          <p className="mt-4 text-sm sm:text-base text-slate-300 leading-relaxed">
            Módulo funcional completo para <strong>AX Manager</strong> (Root y No-Root / ADB) enfocado en procesadores gráficos <strong>Mali</strong>.
            Incluye el nuevo script de <strong>sensibilidad táctil ultra rápida</strong> (<code className="text-cyan-300 font-mono text-xs bg-slate-800 px-1.5 py-0.5 rounded">touch_boost.sh</code>)
            con control desde la interfaz gráfica WebUI nativa y respaldo 100% reversible.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={() => onNavigate('fps')}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-semibold rounded-xl text-xs sm:text-sm shadow-lg shadow-emerald-500/25 transition active:scale-95"
            >
              <Zap className="w-4 h-4 text-amber-300" />
              <span>Explorar Ultra FPS Engine</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>

            <button
              onClick={() => onNavigate('scripts')}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium rounded-xl text-xs sm:text-sm border border-slate-700 transition"
            >
              <FileCode2 className="w-4 h-4 text-cyan-400" />
              <span>Ver Scripts .sh</span>
            </button>

            <button
              onClick={() => onNavigate('deploy')}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium rounded-xl text-xs sm:text-sm border border-slate-700 transition"
            >
              <DownloadCloud className="w-4 h-4 text-cyan-400" />
              <span>Estructura ZIP & WebUI Móvil</span>
            </button>
          </div>
        </div>
      </section>

      {/* Tarjeta Destacada: Función de Sensibilidad Táctil */}
      <section className="bg-gradient-to-r from-cyan-950/40 via-slate-900 to-indigo-950/40 border border-cyan-800/40 rounded-2xl p-6 sm:p-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              Función de Entrada
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white">
              Optimización de Sensibilidad y Respuesta Táctil
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Ejecutado a través de <code className="text-cyan-300 font-mono">touch_boost.sh</code> y controlado con un switch en el WebUI
              de AxManager. Reduce drásticamente la latencia touch-to-display sincronizando InputDispatcher, nodos del panel y el pipeline de la GPU Mali.
            </p>
          </div>

          <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 shrink-0 text-xs space-y-1.5">
            <div className="flex items-center justify-between gap-4 text-slate-400">
              <span>Input Timeout:</span>
              <span className="text-emerald-400 font-bold font-mono">250 ms (vs 400ms)</span>
            </div>
            <div className="flex items-center justify-between gap-4 text-slate-400">
              <span>Velocidad Puntero:</span>
              <span className="text-cyan-400 font-bold font-mono">Nivel 7 (Máximo)</span>
            </div>
            <div className="flex items-center justify-between gap-4 text-slate-400">
              <span>Respaldo Automático:</span>
              <span className="text-emerald-400 font-bold font-mono">100% Reversible</span>
            </div>
          </div>
        </div>
      </section>

      {/* Tarjeta Destacada 2: Modo Batata / Gráficos de Cartón (Exclusivo Android 12+) */}
      <section className="bg-gradient-to-r from-amber-950/30 via-slate-900 to-emerald-950/30 border border-amber-800/40 rounded-2xl p-6 sm:p-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 text-xs font-semibold">
              <span>🥔</span>
              Nuevo: Modo Batata / Gráficos de Cartón (Android 12+)
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white">
              Reducción de Renderizado para Free Fire (+30 FPS en Mali)
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Ejecutado con <code className="text-amber-300 font-mono">surface_tweak.sh</code>. Aplica escalado dinámico (<code className="text-amber-300 font-mono">downscaleFactor=0.5</code>)
              vía el subsistema nativo <code className="text-amber-300 font-mono">cmd game</code> de Google. Libera el 70% de carga en los fragment shaders de Mali sin alterar la pantalla global del teléfono y sin riesgo de baneo.
            </p>
          </div>

          <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 shrink-0 text-xs space-y-1.5">
            <div className="flex items-center justify-between gap-4 text-slate-400">
              <span>Compatibilidad:</span>
              <span className="text-emerald-400 font-bold font-mono">Android 12+ (SDK 31+)</span>
            </div>
            <div className="flex items-center justify-between gap-4 text-slate-400">
              <span>Bloqueo de Seguridad:</span>
              <span className="text-amber-400 font-bold font-mono">&lt; Android 12 Protegido</span>
            </div>
            <div className="flex items-center justify-between gap-4 text-slate-400">
              <span>Juegos Compatibles:</span>
              <span className="text-cyan-400 font-bold font-mono">Free Fire, FF Max, CoD</span>
            </div>
          </div>
        </div>
      </section>

      {/* Tarjetas de Estado del Proyecto (4 pilares clave) */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Pilar 1: Entorno React */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition flex flex-col justify-between">
          <div>
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-3">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-white text-sm">Entorno Frontend</h3>
            <p className="text-xs text-slate-400 mt-1">
              React 19 + TypeScript + Vite compilando sin errores. Interfaz responsiva para pantalla móvil.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span>Estado:</span>
            <span className="text-emerald-400 font-mono font-medium">Activo y Listo</span>
          </div>
        </div>

        {/* Pilar 2: Módulo AX Manager */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition flex flex-col justify-between">
          <div>
            <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-3">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-white text-sm">Módulo AX Manager</h3>
            <p className="text-xs text-slate-400 mt-1">
              Estructura estándar AxManager (module.prop, customize.sh, service.sh, webroot con ksu.exec).
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span>Versión API:</span>
            <span className="text-cyan-400 font-mono font-medium">axeronPlugin=30000</span>
          </div>
        </div>

        {/* Pilar 3: Arquitectura 32 y 64 bits */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition flex flex-col justify-between">
          <div>
            <div className="w-9 h-9 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-3">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-white text-sm">Soporte Arquitecturas</h3>
            <p className="text-xs text-slate-400 mt-1">
              Detección de ABI dinámica (arm64-v8a y armeabi-v7a) en scripts shell sin configuraciones forzadas.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span>Compatibilidad:</span>
            <span className="text-indigo-400 font-mono font-medium">ARMv7 & ARMv8/v9</span>
          </div>
        </div>

        {/* Pilar 4: Reglas de Seguridad */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition flex flex-col justify-between">
          <div>
            <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-3">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-white text-sm">Seguridad Estricta</h3>
            <p className="text-xs text-slate-400 mt-1">
              Auditoría activa: 0 propiedades permanentes modificadas. Protección total contra bootloops en Android.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span>Propiedades críticas:</span>
            <span className="text-amber-400 font-mono font-medium">0 modificadas (Seguro)</span>
          </div>
        </div>
      </section>

      {/* Qué es AX Manager y los procesadores Mali */}
      <section className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-white">¿Qué es AX Manager y por qué un módulo para Mali?</h2>
            <p className="text-xs sm:text-sm text-slate-400">Investigación técnica y contexto del ecosistema móvil</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4 text-xs sm:text-sm text-slate-300">
          <div className="space-y-3 bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
            <h4 className="font-semibold text-cyan-300 flex items-center gap-2">
              <Sliders className="w-4 h-4" />
              1. ¿Qué es AX Manager (Axeron)?
            </h4>
            <p className="text-slate-400 leading-relaxed">
              Es un gestor de módulos y ajustes avanzados para Android diseñado para funcionar <strong>sin necesidad de root</strong> mediante
              depuración inalámbrica (ADB) o con permisos root si están disponibles.
            </p>
            <p className="text-slate-400 leading-relaxed">
              Permite cargar plugins con estructura similar a Magisk (<code className="text-cyan-400">service.sh</code>, <code className="text-cyan-400">module.prop</code>)
              y ofrece una interfaz WebUI embebida con API de comandos shell (<code className="text-cyan-400">ksu.exec</code> / <code className="text-cyan-400">Axeron</code>).
            </p>
          </div>

          <div className="space-y-3 bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
            <h4 className="font-semibold text-cyan-300 flex items-center gap-2">
              <Zap className="w-4 h-4" />
              2. GPU Mali & Respuesta Táctil
            </h4>
            <p className="text-slate-400 leading-relaxed">
              Las GPUs Mali potencian procesadores MediaTek (Dimensity, Helio), Exynos y Kirin.
            </p>
            <p className="text-slate-400 leading-relaxed">
              Al interactuar con la pantalla, el InputDispatcher de Android notifica a SurfaceFlinger; el módulo asegura
              que la GPU Mali despierte sus frecuencias inmediatamente, eliminando la sensación de retardo en juegos y navegación.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
