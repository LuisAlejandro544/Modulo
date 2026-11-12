import React, { useState } from 'react';
import { HardDrive, Zap, CheckCircle2, Copy, Check, Terminal, Play, RotateCcw, AlertTriangle, ShieldCheck, Flame, Cpu, FastForward } from 'lucide-react';

export const IoAotScreen: React.FC = () => {
  const [selectedGame, setSelectedGame] = useState('com.dts.freefireth');
  const [customPackage, setCustomPackage] = useState('');
  const [readaheadVal, setReadaheadVal] = useState<'512' | '1024' | '2048'>('1024');
  const [iostatsDisabled, setIostatsDisabled] = useState(true);
  const [aotMode, setAotMode] = useState<'speed' | 'speed-profile'>('speed');
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);
  const [isSimulatedActive, setIsSimulatedActive] = useState(false);

  const popularGames = [
    { name: 'Free Fire', pkg: 'com.dts.freefireth' },
    { name: 'Free Fire MAX', pkg: 'com.dts.freefiremax' },
    { name: 'Call of Duty Mobile', pkg: 'com.activision.callofduty.shooter' },
    { name: 'PUBG Mobile', pkg: 'com.tencent.ig' },
    { name: 'Blood Strike', pkg: 'com.netease.bloodstrike' },
    { name: 'Roblox', pkg: 'com.roblox.client' },
    { name: 'Genshin Impact', pkg: 'com.miHoYo.GenshinImpact' },
  ];

  const targetPkg = customPackage.trim() || selectedGame;

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(id);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  const getAotCommand = () => {
    return `su -c "cmd package compile -m ${aotMode} -f ${targetPkg}"`;
  };

  const getResetCommand = () => {
    return `su -c "cmd package compile --reset ${targetPkg}"`;
  };

  const getIoCommand = () => {
    return `su -c "/data/adb/modules/ax_mali_optimizer/scripts/io_aot_tweak.sh enable"`;
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Cabecera Técnica */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-950/80 text-amber-300 border border-amber-800/60 font-mono flex items-center gap-1.5">
                <FastForward className="w-3.5 h-3.5" />
                Zero Lag de Carga • dex2oat Engine
              </span>
              <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-950/60 text-emerald-400 border border-emerald-800/40 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                100% Reversible
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Carga Flash I/O & Pre-Compilación AOT
            </h1>
            <p className="text-slate-400 text-sm mt-1 max-w-3xl">
              Elimina los micro-congelamientos causados por compilación en tiempo de ejecución (JIT) y acelera la carga de texturas 3D en almacenamiento UFS/eMMC.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto">
            <button
              onClick={() => setIsSimulatedActive(!isSimulatedActive)}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition shadow-lg ${
                isSimulatedActive
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/20'
                  : 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-500/20'
              }`}
            >
              <Zap className="w-4 h-4" />
              <span>{isSimulatedActive ? 'I/O Flash Activo' : 'Simular Activación'}</span>
            </button>
          </div>
        </div>

        {/* Barra de métricas en tiempo real */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-800/80">
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <span className="text-xs text-slate-400 block font-medium">Readahead I/O</span>
            <span className="text-lg font-bold text-amber-400 font-mono">{readaheadVal} KB</span>
            <span className="text-[11px] text-slate-500 block">Stock: 128 KB (8x flujo)</span>
          </div>
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <span className="text-xs text-slate-400 block font-medium">Estadísticas I/O</span>
            <span className="text-lg font-bold text-emerald-400 font-mono">{iostatsDisabled ? 'OFF (0)' : 'ON (1)'}</span>
            <span className="text-[11px] text-slate-500 block">Cero telemetría kernel</span>
          </div>
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <span className="text-xs text-slate-400 block font-medium">Modo ART Bytecode</span>
            <span className="text-lg font-bold text-cyan-400 font-mono">AOT {aotMode.toUpperCase()}</span>
            <span className="text-[11px] text-slate-500 block">Código nativo directo</span>
          </div>
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <span className="text-xs text-slate-400 block font-medium">Cola Bloques</span>
            <span className="text-lg font-bold text-purple-400 font-mono">512 peticiones</span>
            <span className="text-[11px] text-slate-500 block">UFS 2.x/3.x optimizado</span>
          </div>
        </div>
      </div>

      {/* Grid de Dos Columnas: AOT & I/O Readahead */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Columna 1: Pre-Compilación AOT (dex2oat) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-cyan-950 border border-cyan-800/50 flex items-center justify-center text-cyan-400">
                  <Cpu className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Pre-Compilación AOT (dex2oat)</h2>
                  <p className="text-xs text-slate-400">Compilación Ahead-Of-Time a código máquina nativo</p>
                </div>
              </div>
              <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/40">
                Speed Mode
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              En Android convencional, los juegos se compilan parcialmente sobre la marcha usando <strong className="text-amber-300">JIT (Just-In-Time)</strong>. Cuando entras en una zona nueva o se cargan efectos de combate, el motor de ART interrumpe los hilos de CPU para compilar bytecode, generando <strong className="text-rose-400">tirones y caída abrupta de fotogramas</strong>. 
            </p>

            <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800/80 mb-4 space-y-2.5">
              <span className="text-xs font-semibold text-slate-200 block">Selecciona el juego o aplicación a compilar:</span>
              <div className="flex flex-wrap gap-1.5">
                {popularGames.map((game) => (
                  <button
                    key={game.pkg}
                    onClick={() => {
                      setSelectedGame(game.pkg);
                      setCustomPackage('');
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                      targetPkg === game.pkg
                        ? 'bg-cyan-600 text-white font-semibold shadow-sm'
                        : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700/80'
                    }`}
                  >
                    {game.name}
                  </button>
                ))}
              </div>

              <div className="mt-2">
                <label className="text-[11px] text-slate-400 block mb-1">O escribe el nombre de paquete exacto:</label>
                <input
                  type="text"
                  placeholder="ej. com.dts.freefireth"
                  value={customPackage}
                  onChange={(e) => setCustomPackage(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                <span className="text-xs text-slate-400">Modo de compilación:</span>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => setAotMode('speed')}
                    className={`px-2.5 py-1 rounded text-xs font-mono font-bold transition ${
                      aotMode === 'speed'
                        ? 'bg-cyan-600 text-white'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    speed (Máxima fluidez)
                  </button>
                  <button
                    onClick={() => setAotMode('speed-profile')}
                    className={`px-2.5 py-1 rounded text-xs font-mono font-medium transition ${
                      aotMode === 'speed-profile'
                        ? 'bg-cyan-600 text-white'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    speed-profile
                  </button>
                </div>
              </div>
            </div>

            {/* Comando AOT para Termux / Root */}
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-xs">
              <div className="flex items-center justify-between text-slate-400 mb-1.5">
                <span className="flex items-center gap-1.5 text-[11px]">
                  <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                  Comando Directo (Termux / Shizuku / Root):
                </span>
                <button
                  onClick={() => handleCopy(getAotCommand(), 'cmd_aot')}
                  className="flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-300 transition"
                >
                  {copiedCmd === 'cmd_aot' ? (
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
              <p className="text-cyan-300 break-all select-all font-mono py-1 px-2 rounded bg-slate-900 border border-slate-800/60">
                {getAotCommand()}
              </p>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>Para revertir a modo estándar:</span>
            <button
              onClick={() => handleCopy(getResetCommand(), 'cmd_reset')}
              className="text-amber-400 hover:text-amber-300 flex items-center gap-1 font-mono text-[11px]"
            >
              <RotateCcw className="w-3 h-3" />
              cmd package compile --reset
            </button>
          </div>
        </div>

        {/* Columna 2: I/O Readahead Flash & iostats=0 */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-950 border border-amber-800/50 flex items-center justify-center text-amber-400">
                  <HardDrive className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">I/O Readahead Flash (1024 KB)</h2>
                  <p className="text-xs text-slate-400">Aceleración masiva de texturas y assets en disco</p>
                </div>
              </div>
              <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800/40">
                UFS & eMMC
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              Por defecto, el kernel de Android lee bloques en ráfagas diminutas de <strong className="text-amber-400">128 KB</strong>. Cuando un juego como Call of Duty o Genshin carga mapas y modelos 3D de alta resolución, se producen miles de lecturas secuenciales fragmentadas. Al aumentar <code className="text-cyan-300 font-mono">read_ahead_kb</code> a <strong className="text-emerald-400">1024 KB</strong>, el controlador DMA absorbe texturas masivas de un solo tiro.
            </p>

            <div className="space-y-3 mb-4">
              <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-200">Tamaño de Readahead:</span>
                  <span className="text-xs font-mono font-bold text-amber-400">{readaheadVal} KB</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {(['512', '1024', '2048'] as const).map((val) => (
                    <button
                      key={val}
                      onClick={() => setReadaheadVal(val)}
                      className={`py-1.5 rounded-lg text-xs font-mono font-semibold transition border ${
                        readaheadVal === val
                          ? 'bg-amber-600 border-amber-500 text-white shadow-sm'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {val} KB {val === '1024' && '★'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-white block">Eliminación de Estadísticas I/O</span>
                  <span className="text-[11px] text-slate-400">Desactiva telemetría continua del kernel (iostats = 0)</span>
                </div>
                <button
                  onClick={() => setIostatsDisabled(!iostatsDisabled)}
                  className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                    iostatsDisabled ? 'bg-emerald-600' : 'bg-slate-700'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white transition-transform ${
                      iostatsDisabled ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Comando I/O Readahead */}
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-xs">
              <div className="flex items-center justify-between text-slate-400 mb-1.5">
                <span className="flex items-center gap-1.5 text-[11px]">
                  <Terminal className="w-3.5 h-3.5 text-amber-400" />
                  Script de Invocación Automática:
                </span>
                <button
                  onClick={() => handleCopy(getIoCommand(), 'cmd_io')}
                  className="flex items-center gap-1 text-[11px] text-amber-400 hover:text-amber-300 transition"
                >
                  {copiedCmd === 'cmd_io' ? (
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
              <p className="text-amber-300 break-all select-all font-mono py-1 px-2 rounded bg-slate-900 border border-slate-800/60">
                {getIoCommand()}
              </p>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>Ruta Sysfs:</span>
            <span className="font-mono text-slate-300 text-[11px]">/sys/block/*/queue/read_ahead_kb</span>
          </div>
        </div>

      </div>

      {/* Tarjeta de Seguridad y Explicación Técnica Profunda */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/40 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <h3 className="text-base font-bold text-white mb-3 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          Por qué esta combinación es superior y 100% segura
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800/80">
            <h4 className="font-bold text-amber-300 mb-1 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5" />
              1. Sin Stuttering en Batallas
            </h4>
            <p className="text-slate-400 leading-relaxed">
              Al pre-compilar a <code className="text-amber-300">speed</code>, todo el código Java/Kotlin del juego se convierte en instrucciones nativas ARM (32 o 64 bit). Ningún ciclo de CPU se pierde compilando en medio de un tiroteo.
            </p>
          </div>

          <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800/80">
            <h4 className="font-bold text-cyan-300 mb-1 flex items-center gap-1.5">
              <FastForward className="w-3.5 h-3.5" />
              2. Texturas en Ráfaga DMA
            </h4>
            <p className="text-slate-400 leading-relaxed">
              El buffer de 1024 KB permite al controlador de almacenamiento entregar los paquetes de texturas del mapa instantáneamente sin generar cola de espera en la GPU Mali.
            </p>
          </div>

          <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800/80">
            <h4 className="font-bold text-emerald-300 mb-1 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              3. Respaldo y Rollback Automático
            </h4>
            <p className="text-slate-400 leading-relaxed">
              El script guarda el estado original en <code className="text-emerald-300">/data/local/tmp/mali_io_backup.state</code>. Al desinstalar o ejecutar <code className="text-emerald-300">disable</code>, se restauran los valores de fábrica exactos.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
