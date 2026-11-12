/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Navbar, ScreenTab } from './components/Navbar';
import { HomeScreen } from './components/HomeScreen';
import { FpsScreen } from './components/FpsScreen';
import { RamScreen } from './components/RamScreen';
import { GpuGovernorScreen } from './components/GpuGovernorScreen';
import { AngleScreen } from './components/AngleScreen';
import { GmsShieldScreen } from './components/GmsShieldScreen';
import { ScriptsExplorerScreen } from './components/ScriptsExplorerScreen';
import { ArchitectureScreen } from './components/ArchitectureScreen';
import { DeployScreen } from './components/DeployScreen';
import { GuideModal } from './components/GuideModal';

export default function App() {
  const [activeTab, setActiveTab] = useState<ScreenTab>('home');
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-cyan-500 selection:text-black">
      {/* Barra de navegación superior con soporte móvil y desktop */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenGuide={() => setIsGuideOpen(true)}
      />

      {/* Contenido principal según pantalla activa */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {activeTab === 'home' && (
          <HomeScreen
            onNavigate={(tab) => setActiveTab(tab)}
            onOpenGuide={() => setIsGuideOpen(true)}
          />
        )}

        {activeTab === 'fps' && <FpsScreen />}

        {activeTab === 'ram' && <RamScreen />}

        {activeTab === 'governor' && <GpuGovernorScreen />}

        {activeTab === 'angle' && <AngleScreen />}

        {activeTab === 'gms' && <GmsShieldScreen />}

        {activeTab === 'scripts' && <ScriptsExplorerScreen />}

        {activeTab === 'arch' && <ArchitectureScreen />}

        {activeTab === 'deploy' && <DeployScreen />}
      </main>

      {/* Pie de página con estado técnico */}
      <footer className="mt-auto border-t border-slate-900 bg-slate-950/80 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>AX Mali Core Engine • Optimización para AX Manager, KernelSU, APatch & Magisk</span>
          <div className="flex items-center gap-3">
            <span className="text-emerald-400 font-mono">React 19 ✓</span>
            <span className="text-cyan-400 font-mono">Ultra FPS ✓</span>
            <span className="text-amber-400 font-mono">32/64-bit ✓</span>
          </div>
        </div>
      </footer>

      {/* Modal de Guía Móvil */}
      <GuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />
    </div>
  );
}
