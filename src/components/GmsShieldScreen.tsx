import React, { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Zap,
  Activity,
  Layers,
  Sparkles,
  Info,
  Lock,
  Gamepad2
} from 'lucide-react';

/**
 * Componente: GmsShieldScreen
 * Pantalla dedicada a neutralizar servicios secundarios de Google Play Services
 * que generan telemetría, analíticas, registros de fallos y seguimiento publicitario en segundo plano,
 * sin perjudicar el inicio de sesión con Google ni los juegos de Google Play.
 */
export const GmsShieldScreen: React.FC = () => {
  const [shieldActive, setShieldActive] = useState<boolean>(true);
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(id);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Encabezado Principal */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-900/40 rounded-2xl p-6 sm:p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-950 text-indigo-300 border border-indigo-800/60">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Anti-Telemetría GMS
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-cyan-950 text-cyan-400 border border-cyan-800/60 font-mono">
                gms_shield.sh
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
              <span>🛡️ GMS Shield (Google Play Optimizer)</span>
              <span className="text-indigo-400 text-sm font-mono font-normal">v1.3.0</span>
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Google Play Services ejecuta decenas de hilos ocultos para recolectar analíticas, reportes de errores y seguimiento publicitario.
              Estos procesos despiertan núcleos de la CPU cada pocos minutos, roban memoria RAM y causan tirones en pleno tiroteo.
              GMS Shield neutraliza toda esa basura <strong>sin tocar tu inicio de sesión con Google ni tus juegos de Play Games</strong>.
            </p>
          </div>

          {/* Switch Maestro */}
          <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl flex flex-col items-center justify-center min-w-[210px] text-center shadow-lg">
            <span className="text-xs text-slate-400 font-semibold mb-2">Estado del Escudo</span>
            <button
              onClick={() => setShieldActive(!shieldActive)}
              className={`w-full py-2.5 px-4 rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md ${
                shieldActive
                  ? 'bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white shadow-indigo-900/30'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              <Zap className={`w-4 h-4 ${shieldActive ? 'text-amber-300 fill-amber-300' : ''}`} />
              <span>{shieldActive ? 'Escudo Activo (Telemetría Off)' : 'Escudo Desactivado'}</span>
            </button>
            <span className="text-[11px] text-slate-500 mt-2">
              {shieldActive ? 'Servicios basura neutralizados' : 'GMS consumiendo recursos'}
            </span>
          </div>
        </div>
      </div>

      {/* Cuadrícula Comparativa: Lo que SE PROTEGE vs Lo que SE BLOQUEA */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Lado Protegido */}
        <div className="bg-slate-900/90 border border-emerald-900/50 rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2.5 pb-2 border-b border-slate-800">
            <div className="p-2 rounded-lg bg-emerald-950 text-emerald-400 border border-emerald-800/60">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">100% Protegido y Operativo</h3>
              <span className="text-[11px] text-emerald-400">Tus partidas y cuentas están completamente seguras</span>
            </div>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex items-start gap-2 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white">Inicio de Sesión con Cuenta Google:</strong>
                <p className="text-slate-400">Podrás seguir iniciando sesión en Free Fire, CoD Mobile o cualquier juego vinculado con tu cuenta Gmail.</p>
              </div>
            </div>

            <div className="flex items-start gap-2 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
              <Gamepad2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white">Google Play Games & Logros:</strong>
                <p className="text-slate-400">La sincronización de nivel, guardado en la nube y logros continúa funcionando sin problemas.</p>
              </div>
            </div>

            <div className="flex items-start gap-2 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
              <Lock className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white">Google Play Billing (Compras):</strong>
                <p className="text-slate-400">La pasarela de pago para comprar diamantes, pases de batalla o monedas del juego sigue 100% activa.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Lado Neutralizado */}
        <div className="bg-slate-900/90 border border-rose-900/50 rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2.5 pb-2 border-b border-slate-800">
            <div className="p-2 rounded-lg bg-rose-950 text-rose-400 border border-rose-800/60">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">Servicios Basura Neutralizados</h3>
              <span className="text-[11px] text-rose-400">Cero consumo parásito de CPU y memoria RAM</span>
            </div>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex items-start gap-2 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
              <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white">AdIdService (Seguimiento de Publicidad):</strong>
                <p className="text-slate-400">Detiene el rastreador de anuncios que perfila tu dispositivo en segundo plano.</p>
              </div>
            </div>

            <div className="flex items-start gap-2 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
              <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white">AppMeasurement & AnalyticsService:</strong>
                <p className="text-slate-400">Cancela los trabajos del kernel que compilan métricas y las envían a servidores de telemetría.</p>
              </div>
            </div>

            <div className="flex items-start gap-2 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
              <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white">com.google.android.feedback & PartnerSetup:</strong>
                <p className="text-slate-400">Desactiva el recolector de crash logs y sincronizadores de operadoras que despiertan la CPU.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Comandos Shell para el Teléfono */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-3">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <span>Comando Shell para AX Manager / Terminal</span>
        </h3>
        <p className="text-xs text-slate-400 leading-relaxed">
          Ejecuta la activación de GMS Shield directamente desde AxManager o terminal de comandos en tu teléfono:
        </p>
        <div className="bg-slate-950 border border-slate-800 p-3 rounded-lg flex items-center justify-between font-mono text-xs text-cyan-400">
          <span>sh gms_shield.sh enable</span>
          <button
            onClick={() => handleCopy('sh gms_shield.sh enable', 'cgms')}
            className="text-xs text-slate-300 hover:text-white"
          >
            {copiedCmd === 'cgms' ? 'Copiado ✓' : 'Copiar'}
          </button>
        </div>
      </div>

      {/* Banner de Seguridad & Arquitectura */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-950 text-indigo-400 border border-indigo-800/60 rounded-xl">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-white">100% Reversible y Seguro para tu Teléfono</h4>
            <p className="text-xs text-slate-400">
              Nunca toca archivos de arranque ni altera el sistema operativo de forma permanente. Respaldo en <span className="font-mono text-cyan-400">/data/local/tmp/mali_gms_backup.state</span>.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 bg-slate-950 text-cyan-400 border border-slate-800 rounded-md text-xs font-mono">
            pm disable-user ✓
          </span>
          <span className="px-2.5 py-1 bg-slate-950 text-cyan-400 border border-slate-800 rounded-md text-xs font-mono">
            appops safe ✓
          </span>
        </div>
      </div>
    </div>
  );
};
