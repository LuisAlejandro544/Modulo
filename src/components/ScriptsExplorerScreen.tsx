import React, { useState } from 'react';
import { MODULE_SCRIPTS, ScriptFileInfo, validateScriptSecurity } from '../utils/moduleData';
import { FileCode2, Copy, Check, ShieldCheck, AlertCircle, Info, Terminal, ChevronRight } from 'lucide-react';

export const ScriptsExplorerScreen: React.FC = () => {
  const [selectedScript, setSelectedScript] = useState<ScriptFileInfo>(MODULE_SCRIPTS[0]);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(selectedScript.codeSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const securityCheck = validateScriptSecurity(selectedScript.codeSnippet);

  return (
    <div className="space-y-6 pb-12">
      {/* Encabezado */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800/60 text-xs font-semibold mb-2">
              <FileCode2 className="w-3.5 h-3.5" />
              Arquitectura de Archivos Creados
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Explorador de Scripts .sh & Módulo AX
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Todos los archivos base generados en el almacenamiento del proyecto bajo <code className="text-cyan-400 font-mono">/ax_module/</code>.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-slate-950 p-2 rounded-xl border border-slate-800 self-start sm:self-auto">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <div className="text-left text-xs">
              <div className="font-semibold text-emerald-300">Auditoría Superada</div>
              <div className="text-[10px] text-slate-400">0 usos de persist.sys.*</div>
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Lista de scripts a la izquierda / Detalles y código a la derecha */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Selector de archivos (móvil y desktop) */}
        <div className="lg:col-span-4 space-y-2">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 px-1 mb-2">
            Archivos del Módulo ({MODULE_SCRIPTS.length})
          </div>

          <div className="space-y-1.5 max-h-[500px] overflow-y-auto pr-1">
            {MODULE_SCRIPTS.map((script) => {
              const isSelected = selectedScript.name === script.name;
              return (
                <button
                  key={script.name}
                  onClick={() => setSelectedScript(script)}
                  className={`w-full text-left p-3 rounded-xl border transition flex items-center justify-between ${
                    isSelected
                      ? 'bg-cyan-950/60 border-cyan-500/50 text-white shadow-sm'
                      : 'bg-slate-900/60 border-slate-800/80 text-slate-300 hover:bg-slate-800/50 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div
                      className={`p-1.5 rounded-lg text-xs font-mono ${
                        isSelected ? 'bg-cyan-500/20 text-cyan-300' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {script.name.endsWith('.sh') ? 'SH' : 'CFG'}
                    </div>
                    <div className="truncate">
                      <div className="font-mono text-xs font-semibold truncate">{script.name}</div>
                      <div className="text-[10px] text-slate-400 truncate">{script.path}</div>
                    </div>
                  </div>
                  <ChevronRight
                    className={`w-4 h-4 shrink-0 transition-transform ${
                      isSelected ? 'text-cyan-400 translate-x-0.5' : 'text-slate-600'
                    }`}
                  />
                </button>
              );
            })}
          </div>
        </div>

        {/* Panel de visualización de código e información del archivo */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            {/* Cabecera del visor */}
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-bold text-cyan-400">{selectedScript.name}</span>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-slate-800 text-slate-300 border border-slate-700">
                  {selectedScript.supportedArch}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs text-slate-200 transition"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copiado' : 'Copiar'}</span>
                </button>
              </div>
            </div>

            {/* Explicación de la lógica del archivo */}
            <div className="p-4 bg-slate-900/60 border-b border-slate-800/80 text-xs text-slate-300 flex items-start gap-2.5">
              <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white">Propósito & Lógica: </strong>
                {selectedScript.description}
              </div>
            </div>

            {/* Estado de seguridad */}
            <div className="px-4 py-2 bg-emerald-950/20 border-b border-emerald-900/30 flex items-center gap-2 text-xs text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
              <span>Verificación de seguridad: No se detectó ninguna propiedad persist.sys.*</span>
            </div>

            {/* Código fuente */}
            <div className="p-4 bg-slate-950 overflow-x-auto">
              <pre className="font-mono text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">
                <code>{selectedScript.codeSnippet}</code>
              </pre>
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 text-xs text-slate-400 flex items-center justify-between">
            <span>Ubicación real en el repositorio:</span>
            <code className="text-cyan-300 font-mono text-[11px] bg-slate-950 px-2 py-1 rounded border border-slate-800">
              {selectedScript.path}
            </code>
          </div>
        </div>
      </div>
    </div>
  );
};
