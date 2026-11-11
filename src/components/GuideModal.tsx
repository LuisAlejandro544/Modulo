import React from 'react';
import { X, BookOpen, Smartphone, ShieldCheck, CheckCircle2, Terminal } from 'lucide-react';

interface GuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GuideModal: React.FC<GuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto shadow-2xl p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 mb-4">
          <div className="p-2 bg-cyan-500/10 text-cyan-400 rounded-xl border border-cyan-500/20">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Guía de Uso en Teléfono (AX Manager)</h3>
            <p className="text-xs text-slate-400">Sin necesidad de PC, usando depuración inalámbrica</p>
          </div>
        </div>

        <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
            <div className="font-semibold text-cyan-300 flex items-center gap-1.5">
              <Smartphone className="w-4 h-4" />
              1. Activar AX Manager en el teléfono sin PC
            </div>
            <p className="text-slate-400">
              En Ajustes de Desarrollador de Android, activa <strong>Depuración Inalámbrica</strong>. Conecta AxManager
              usando el código de vinculación o mediante Shizuku directamente desde el móvil.
            </p>
          </div>

          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
            <div className="font-semibold text-cyan-300 flex items-center gap-1.5">
              <Terminal className="w-4 h-4" />
              2. Estructura del Módulo Mali
            </div>
            <p className="text-slate-400">
              El módulo se encuentra en <code className="text-cyan-400 font-mono">/ax_module/</code> listo para ser
              comprimido en un ZIP o ejecutado directamente mediante la terminal ADB del gestor.
            </p>
          </div>

          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
            <div className="font-semibold text-emerald-300 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" />
              3. Cumplimiento Estricto de Seguridad
            </div>
            <p className="text-slate-400">
              Este módulo <strong>jamás utiliza propiedades <code className="text-amber-400 font-mono">persist.sys.*</code></strong>,
              evitando fallos de arranque o corrupción en el sistema operativo del teléfono.
            </p>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-xl text-xs transition"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
