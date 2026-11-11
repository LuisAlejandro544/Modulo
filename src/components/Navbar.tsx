import React from 'react';
import { Cpu, Layers, FileCode2, BookOpen, Smartphone, DownloadCloud, Sparkles } from 'lucide-react';

export type ScreenTab = 'home' | 'scripts' | 'arch' | 'deploy';

interface NavbarProps {
  activeTab: ScreenTab;
  setActiveTab: (tab: ScreenTab) => void;
  onOpenGuide: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, onOpenGuide }) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo y título */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Cpu className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base sm:text-lg text-white tracking-tight">AX Mali Core</span>
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800/60">
                  v1.0.0
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">Módulo para AX Manager • Optimización Táctil & GPU Mali</p>
            </div>
          </div>

          {/* Navegación por pestañas (Desktop & Tablet) */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-950/60 p-1.5 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('home')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeTab === 'home'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Inicio (Hello World)</span>
            </button>

            <button
              onClick={() => setActiveTab('scripts')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeTab === 'scripts'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <FileCode2 className="w-4 h-4" />
              <span>Scripts .sh & Táctil</span>
            </button>

            <button
              onClick={() => setActiveTab('arch')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeTab === 'arch'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Smartphone className="w-4 h-4" />
              <span>Arquitectura 32/64 bit</span>
            </button>

            <button
              onClick={() => setActiveTab('deploy')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeTab === 'deploy'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <DownloadCloud className="w-4 h-4" />
              <span>Empaquetado & WebUI</span>
            </button>
          </nav>

          {/* Botón de acción / Guía */}
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenGuide}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium transition"
              title="Ver guía de instalación en AxManager"
            >
              <BookOpen className="w-4 h-4 text-cyan-400" />
              <span className="hidden sm:inline">Guía Móvil</span>
            </button>
          </div>
        </div>

        {/* Barra de pestañas móvil */}
        <div className="flex md:hidden items-center justify-around py-2 border-t border-slate-800/80 gap-1 overflow-x-auto">
          <button
            onClick={() => setActiveTab('home')}
            className={`flex flex-col items-center py-1 px-2.5 rounded-lg text-[11px] font-medium transition ${
              activeTab === 'home' ? 'text-cyan-400 font-semibold' : 'text-slate-400'
            }`}
          >
            <Layers className="w-4 h-4 mb-0.5" />
            <span>Inicio</span>
          </button>
          <button
            onClick={() => setActiveTab('scripts')}
            className={`flex flex-col items-center py-1 px-2.5 rounded-lg text-[11px] font-medium transition ${
              activeTab === 'scripts' ? 'text-cyan-400 font-semibold' : 'text-slate-400'
            }`}
          >
            <FileCode2 className="w-4 h-4 mb-0.5" />
            <span>Scripts .sh</span>
          </button>
          <button
            onClick={() => setActiveTab('arch')}
            className={`flex flex-col items-center py-1 px-2.5 rounded-lg text-[11px] font-medium transition ${
              activeTab === 'arch' ? 'text-cyan-400 font-semibold' : 'text-slate-400'
            }`}
          >
            <Smartphone className="w-4 h-4 mb-0.5" />
            <span>32/64 bit</span>
          </button>
          <button
            onClick={() => setActiveTab('deploy')}
            className={`flex flex-col items-center py-1 px-2.5 rounded-lg text-[11px] font-medium transition ${
              activeTab === 'deploy' ? 'text-cyan-400 font-semibold' : 'text-slate-400'
            }`}
          >
            <DownloadCloud className="w-4 h-4 mb-0.5" />
            <span>WebUI & ZIP</span>
          </button>
        </div>
      </div>
    </header>
  );
};
