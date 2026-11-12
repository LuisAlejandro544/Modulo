import React, { useState } from 'react';
import { Flame, ShieldAlert, ShieldCheck, Zap, AlertTriangle, Terminal, Copy, Check, RotateCcw, Cpu, CheckCircle2, Lock } from 'lucide-react';

export const ThermalScreen: React.FC = () => {
  const [shieldActive, setShieldActive] = useState(true);
  const [gedMargin, setGedMargin] = useState(50);
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  const daemons = [
    { brand: 'Xiaomi / HyperOS / POCO', pkg: 'com.xiaomi.joyose', name: 'Joyose Throttler', desc: 'Baja FPS de 60 a 30 a los 38°C en MIUI/HyperOS' },
    { brand: 'Samsung One UI', pkg: 'com.samsung.android.game.gos', name: 'Game Optimizing Service (GOS)', desc: 'Limita resolución y reloj GPU en juegos' },
    { brand: 'Realme / OPPO / OnePlus', pkg: 'com.oplus.cosa', name: 'ColorOS COSA Throttler', desc: 'Aplica perfil agresivo de batería en tiempo real' },
    { brand: 'OPPO Guard Elf', pkg: 'com.coloros.oppoguardelf', name: 'GuardElf Battery Limiter', desc: 'Frena el RenderThread en multitarea' },
    { brand: 'MediaTek GED', pkg: 'ged/hal/dvfs_margin_value', name: 'DVFS Margin Booster', desc: 'Asegura que el reloj GPU no baje bruscamente' },
  ];

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(id);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  const getRunCmd = () => {
    return `su -c "/data/adb/modules/ax_mali_optimizer/scripts/thermal_tweak.sh enable"`;
  };

  const getDisableCmd = () => {
    return `su -c "/data/adb/modules/ax_mali_optimizer/scripts/thermal_tweak.sh disable"`;
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Cabecera Principal */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-950/80 text-rose-300 border border-rose-800/60 font-mono flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5" />
                Thermal Userspace Shield
              </span>
              <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-950/60 text-emerald-400 border border-emerald-800/40 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                Hardware Safety 100% Intacto
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Anulación de Daemons de Throttling & GED Tuning
            </h1>
            <p className="text-slate-400 text-sm mt-1 max-w-3xl">
              Inhabilita los limitadores artificiales de fabricantes (Xiaomi Joyose, Samsung GOS, Realme Cosa) y calibra el margen DVFS en procesadores MediaTek sin apagar los sensores térmicos de emergencia del kernel.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto">
            <button
              onClick={() => setShieldActive(!shieldActive)}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition shadow-lg ${
                shieldActive
                  ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-500/20'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              }`}
            >
              <Flame className="w-4 h-4" />
              <span>{shieldActive ? 'Escudo Térmico Activo' : 'Escudo Desactivado'}</span>
            </button>
          </div>
        </div>

        {/* Tarjetas de Métricas de Protección */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-800/80">
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <span className="text-xs text-slate-400 block font-medium">Joyose / GOS Throttling</span>
            <span className="text-lg font-bold text-rose-400 font-mono">{shieldActive ? 'NEUTRALIZADO' : 'ACTIVO'}</span>
            <span className="text-[11px] text-slate-500 block">kill -STOP + appops</span>
          </div>
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <span className="text-xs text-slate-400 block font-medium">Margen DVFS MediaTek</span>
            <span className="text-lg font-bold text-amber-400 font-mono">+{gedMargin}%</span>
            <span className="text-[11px] text-slate-500 block">Anticipación de carga GPU</span>
          </div>
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <span className="text-xs text-slate-400 block font-medium">GPU Idle State</span>
            <span className="text-lg font-bold text-cyan-400 font-mono">gpu_idle = 0</span>
            <span className="text-[11px] text-slate-500 block">Cero caída entre frames</span>
          </div>
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <span className="text-xs text-slate-400 block font-medium">Trip Point Hardware</span>
            <span className="text-lg font-bold text-emerald-400 font-mono">PROTEGIDO</span>
            <span className="text-[11px] text-slate-500 block">Kernel thermal intacto</span>
          </div>
        </div>
      </div>

      {/* Grid: 2 Columnas de Explicación Detallada */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Columna 1: Daemons de Fabricantes Neutralizados */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-rose-950 border border-rose-800/50 flex items-center justify-center text-rose-400">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Daemons de Fabricante en Userspace</h2>
                  <p className="text-xs text-slate-400">Neutralización sin desinstalar ni romper el sistema</p>
                </div>
              </div>
              <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800/40">
                Safe Freezer
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              Muchos fabricantes programan aplicaciones de fondo en Android que monitorean la temperatura superficial de la batería. Apenas el teléfono roza los 38°C–40°C (temperatura habitual en una partida de Free Fire o CoD), estos servicios imponen un <strong className="text-rose-400">tope artificial de 30 o 45 FPS</strong>.
            </p>

            <div className="space-y-2 mb-4">
              {daemons.map((d) => (
                <div key={d.pkg} className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/80 flex items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">{d.name}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">{d.brand}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">{d.desc}</p>
                    <span className="text-[10px] text-slate-500 font-mono block mt-0.5">{d.pkg}</span>
                  </div>
                  <div className="shrink-0">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950 text-emerald-400 border border-emerald-800/40">
                      Bypassed
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Comando Shell */}
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-xs">
              <div className="flex items-center justify-between text-slate-400 mb-1.5">
                <span className="flex items-center gap-1.5 text-[11px]">
                  <Terminal className="w-3.5 h-3.5 text-rose-400" />
                  Ejecutar Shield en AxManager / Termux:
                </span>
                <button
                  onClick={() => handleCopy(getRunCmd(), 'cmd_thermal')}
                  className="flex items-center gap-1 text-[11px] text-rose-400 hover:text-rose-300 transition"
                >
                  {copiedCmd === 'cmd_thermal' ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400">Copiado</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copiar</span>
                    </>
                  )}
                </button>
              </div>
              <p className="text-rose-300 break-all select-all font-mono py-1 px-2 rounded bg-slate-900 border border-slate-800/60">
                {getRunCmd()}
              </p>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>Restaurar Daemons:</span>
            <button
              onClick={() => handleCopy(getDisableCmd(), 'cmd_disable_thermal')}
              className="text-amber-400 hover:text-amber-300 flex items-center gap-1 font-mono text-[11px]"
            >
              <RotateCcw className="w-3 h-3" />
              thermal_tweak.sh disable
            </button>
          </div>
        </div>

        {/* Columna 2: MediaTek GED (Graphics Engine Driver) & Hardware Safety */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-950 border border-amber-800/50 flex items-center justify-center text-amber-400">
                  <Cpu className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">MediaTek GED Margin Tuning</h2>
                  <p className="text-xs text-slate-400">Calibración precisa del controlador gráfico Mali</p>
                </div>
              </div>
              <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800/40">
                Helio & Dimensity
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              Los procesadores MediaTek utilizan un módulo del kernel llamado <strong className="text-amber-300">GED (Graphics Engine Driver)</strong>. Este módulo toma decisiones de subida y bajada de frecuencias (DVFS). Por defecto, GED es excesivamente conservador y reduce el reloj de la GPU Mali antes de que termine el renderizado del fotograma.
            </p>

            <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-3 mb-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold text-slate-200">Margen DVFS (Anticipación de Carga):</span>
                  <span className="text-xs font-mono font-bold text-amber-400">+{gedMargin}%</span>
                </div>
                <div className="flex gap-2">
                  {[25, 50, 75].map((val) => (
                    <button
                      key={val}
                      onClick={() => setGedMargin(val)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-mono font-bold transition border ${
                        gedMargin === val
                          ? 'bg-amber-600 border-amber-500 text-white shadow-sm'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      +{val}% {val === 50 && '★'}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5">
                  <strong className="text-amber-300">Valor 50 recomendado:</strong> Otorga a la GPU suficiente holgura de reloj sin generar consumo eléctrico innecesario.
                </p>
              </div>

              <div className="pt-3 border-t border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-mono">gpu_idle = 0</span>
                  <span className="text-emerald-400 font-semibold">Evita micro-pausas</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-mono">fpsgo/fbt/boost_ta = 1</span>
                  <span className="text-emerald-400 font-semibold">Prioridad a Target Frame</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-mono">fstb_soft_level = 0</span>
                  <span className="text-emerald-400 font-semibold">Cero capado artificial</span>
                </div>
              </div>
            </div>

            {/* Banner de Seguridad de Hardware */}
            <div className="bg-emerald-950/30 border border-emerald-800/40 p-3.5 rounded-xl flex items-start gap-3">
              <Lock className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-emerald-300">Garantía de Integridad Física</h4>
                <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
                  Este módulo <strong className="text-white">NO toca ni altera los Trip Points de apagado térmico del Kernel</strong> en <code className="text-emerald-300 font-mono">/sys/class/thermal</code>. Si el hardware llegase a una temperatura de riesgo físico (75°C-80°C), los mecanismos del silicio actuarán de inmediato.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>Ruta Sysfs MediaTek:</span>
            <span className="font-mono text-slate-300 text-[11px]">/sys/module/ged/parameters/</span>
          </div>
        </div>

      </div>

      {/* Tabla Resumen de Mitigación de Throttling */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          Comparativa: Teléfono de Fábrica vs AX Thermal Shield
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="pb-3 font-semibold">Escenario / Factor</th>
                <th className="pb-3 font-semibold text-rose-400">Comportamiento Stock (Fábrica)</th>
                <th className="pb-3 font-semibold text-emerald-400">Con AX Thermal Shield</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              <tr>
                <td className="py-2.5 font-medium text-white">Partida a los 5-10 minutos (39°C)</td>
                <td className="py-2.5 text-rose-300">Joyose o GOS limitan el juego a 30 o 45 FPS constantes</td>
                <td className="py-2.5 text-emerald-300 font-medium">Mantiene 60 o 90 FPS fluidos sin caída artificial</td>
              </tr>
              <tr>
                <td className="py-2.5 font-medium text-white">Carga gráfica pesada repentina (Explosiones)</td>
                <td className="py-2.5 text-rose-300">GED demora en subir reloj GPU; se produce tirón severo</td>
                <td className="py-2.5 text-emerald-300 font-medium">Margen DVFS +50% anticipa la demanda sin stuttering</td>
              </tr>
              <tr>
                <td className="py-2.5 font-medium text-white">Micro-pausa entre fotogramas sucesivos</td>
                <td className="py-2.5 text-rose-300">GPU entra en reposo profundo (idle) y tarda en despertar</td>
                <td className="py-2.5 text-emerald-300 font-medium"><code className="text-cyan-300">gpu_idle=0</code> mantiene el circuito listo para el siguiente cuadro</td>
              </tr>
              <tr>
                <td className="py-2.5 font-medium text-white">Protección contra sobrecalentamiento real</td>
                <td className="py-2.5 text-slate-400">Kernel trip points + limitador userspace</td>
                <td className="py-2.5 text-emerald-400 font-medium">Kernel trip points 100% operativos para máxima seguridad del silicio</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
