import React, { useState } from 'react';
import { DownloadCloud, Smartphone, Copy, Check, Terminal, ShieldCheck, FolderTree, FileCode, Sparkles, Loader2 } from 'lucide-react';
import { downloadModuleZip } from '../utils/zipGenerator';

export const DeployScreen: React.FC = () => {
  const [copiedZipCmd, setCopiedZipCmd] = useState(false);
  const [copiedAdbCmd, setCopiedAdbCmd] = useState(false);
  const [isGeneratingZip, setIsGeneratingZip] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const zipCommand = `cd /ax_module && zip -r ../ax_mali_core_optimizer.zip ./*`;
  const adbCommand = `adb shell sh /data/local/tmp/ax_module/scripts/touch_boost.sh enable`;

  const copyText = (text: string, type: 'zip' | 'adb') => {
    navigator.clipboard.writeText(text);
    if (type === 'zip') {
      setCopiedZipCmd(true);
      setTimeout(() => setCopiedZipCmd(false), 2000);
    } else {
      setCopiedAdbCmd(true);
      setTimeout(() => setCopiedAdbCmd(false), 2000);
    }
  };

  const handleDownloadZip = async () => {
    try {
      setIsGeneratingZip(true);
      await downloadModuleZip();
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 4000);
    } catch (err) {
      console.error('Error generando ZIP:', err);
    } finally {
      setIsGeneratingZip(false);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Cabecera */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800/60 text-xs font-semibold mb-2">
          <DownloadCloud className="w-3.5 h-3.5" />
          Empaquetado & Integración en AxManager
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
          Descarga y Despliegue del Módulo en Móvil
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Descarga el archivo <code className="text-cyan-400 font-mono">.zip</code> directo en tu teléfono para importarlo en AX Manager sin PC.
        </p>
      </div>

      {/* Botón de Descarga Directa ZIP para el teléfono */}
      <div className="bg-gradient-to-r from-cyan-950/50 via-slate-900 to-blue-950/50 border border-cyan-800/50 rounded-2xl p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                Listo para Instalar en Teléfono
              </span>
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-white">
              Generar y Descargar ax_mali_core_optimizer.zip
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Empaqueta en memoria todos los scripts (<code className="text-cyan-300 font-mono">touch_boost.sh</code>, etc.),
              propiedades y el WebUI garantizando que los archivos queden en la raíz del archivo ZIP para que AxManager lo reconozca de inmediato.
            </p>
          </div>

          <button
            onClick={handleDownloadZip}
            disabled={isGeneratingZip}
            className={`w-full sm:w-auto shrink-0 flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl font-bold text-xs sm:text-sm shadow-xl transition active:scale-95 ${
              downloadSuccess
                ? 'bg-emerald-600 text-white'
                : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-cyan-500/25'
            }`}
          >
            {isGeneratingZip ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Empaquetando...</span>
              </>
            ) : downloadSuccess ? (
              <>
                <Check className="w-5 h-5" />
                <span>¡Descargado en tu Móvil!</span>
              </>
            ) : (
              <>
                <DownloadCloud className="w-5 h-5" />
                <span>Descargar Módulo (.ZIP)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Árbol del Módulo */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6">
        <h3 className="text-sm sm:text-base font-bold text-white mb-4 flex items-center gap-2">
          <FolderTree className="w-4 h-4 text-cyan-400" />
          Estructura de Archivos del Módulo (/ax_module/)
        </h3>

        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs text-slate-300 leading-relaxed overflow-x-auto">
          <div>ax_mali_core_optimizer.zip</div>
          <div className="text-slate-400 pl-4">├── <span className="text-cyan-400 font-bold">module.prop</span> <span className="text-slate-600">// Metadatos y axeronPlugin=30000</span></div>
          <div className="text-slate-400 pl-4">├── <span className="text-cyan-400 font-bold">customize.sh</span> <span className="text-slate-600">// Asignación de permisos +x y validación</span></div>
          <div className="text-slate-400 pl-4">├── <span className="text-cyan-400 font-bold">service.sh</span> <span className="text-slate-600">// Servicio BusyBox en arranque</span></div>
          <div className="text-slate-400 pl-4">├── <span className="text-cyan-400 font-bold">uninstall.sh</span> <span className="text-slate-600">// Limpieza de archivos temporales</span></div>
          <div className="text-slate-400 pl-4">├── scripts/</div>
          <div className="text-slate-400 pl-8">├── <span className="text-emerald-400 font-bold">touch_boost.sh</span> <span className="text-slate-600">// Optimización táctil y latencia (Reversible)</span></div>
          <div className="text-slate-400 pl-8">├── <span className="text-cyan-300">mali_common.sh</span> <span className="text-slate-600">// Detección 32/64 bits y GPU Mali</span></div>
          <div className="text-slate-400 pl-8">├── <span className="text-cyan-300">detect_gpu.sh</span> <span className="text-slate-600">// Diagnóstico en tiempo real</span></div>
          <div className="text-slate-400 pl-8">├── <span className="text-cyan-300">governor_tweak.sh</span> <span className="text-slate-600">// Control de frecuencias DVFS</span></div>
          <div className="text-slate-400 pl-8">└── <span className="text-cyan-300">surface_tweak.sh</span> <span className="text-slate-600">// Sincronización SurfaceFlinger</span></div>
          <div className="text-slate-400 pl-4">└── webroot/</div>
          <div className="text-slate-400 pl-8">└── <span className="text-amber-300 font-bold">index.html</span> <span className="text-slate-600">// Interfaz WebUI interactiva con ksu.exec</span></div>
        </div>
      </div>

      {/* Cómo funciona el WebUI dentro de AX Manager */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6">
        <h3 className="text-sm sm:text-base font-bold text-white mb-2 flex items-center gap-2">
          <Smartphone className="w-4 h-4 text-cyan-400" />
          ¿Cómo funciona el WebUI dentro de la app móvil AxManager?
        </h3>
        <p className="text-xs sm:text-sm text-slate-400 mb-4">
          Cuando abres el plugin en AxManager, la app lee <code className="text-cyan-400 font-mono">webroot/index.html</code> en un WebView seguro con la API <code className="text-cyan-400 font-mono">ksu.exec</code> inyectada.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-300">
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="font-semibold text-cyan-400 flex items-center gap-1.5">
              <FileCode className="w-4 h-4" />
              Llamada desde JavaScript
            </div>
            <pre className="font-mono text-[11px] text-slate-300 bg-slate-900 p-2.5 rounded border border-slate-800 overflow-x-auto">
              <code>{`// Activación desde el interruptor táctil
await ksu.exec("sh .../touch_boost.sh enable");`}</code>
            </pre>
            <p className="text-slate-400">
              AxManager ejecuta la instrucción con los permisos del servidor (ADB o Root), aplicando los ajustes táctiles al instante.
            </p>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="font-semibold text-emerald-400 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" />
              Seguridad y Reversibilidad
            </div>
            <pre className="font-mono text-[11px] text-slate-300 bg-slate-900 p-2.5 rounded border border-slate-800 overflow-x-auto">
              <code>{`// Desactivación y restauración
await ksu.exec("sh .../touch_boost.sh disable");`}</code>
            </pre>
            <p className="text-slate-400">
              Al desactivarlo, el script lee el archivo de respaldo y devuelve la velocidad del puntero y los timeouts exactamente como estaban.
            </p>
          </div>
        </div>
      </div>

      {/* Comandos directos y GitHub Action Manual */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6">
        <h3 className="text-sm sm:text-base font-bold text-white mb-2">Automatización y GitHub Action Manual</h3>
        <p className="text-xs text-slate-400 mb-4">
          La GitHub Action en <code className="text-cyan-400 font-mono">.github/workflows/build_module_zip.yml</code> está configurada con <code className="text-cyan-400 font-mono">workflow_dispatch</code> para ejecutarse <strong>exclusivamente de forma manual</strong> (cero ejecuciones automáticas en commits o pull requests).
        </p>

        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
              <span>Empaquetar manualmente por terminal o script shell:</span>
              <button
                onClick={() => copyText(zipCommand, 'zip')}
                className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 text-xs"
              >
                {copiedZipCmd ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedZipCmd ? 'Copiado' : 'Copiar'}</span>
              </button>
            </div>
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-xs text-cyan-300">
              {zipCommand}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
              <span>Probar el script directamente por ADB Shell (sin PC, desde LADB o AxManager):</span>
              <button
                onClick={() => copyText(adbCommand, 'adb')}
                className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 text-xs"
              >
                {copiedAdbCmd ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedAdbCmd ? 'Copiado' : 'Copiar'}</span>
              </button>
            </div>
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-xs text-cyan-300">
              {adbCommand}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
