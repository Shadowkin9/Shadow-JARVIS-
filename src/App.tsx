/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { JARVISContainer } from './components/JARVISContainer';

export default function App() {
  const [installPrompt, setInstallPrompt] = useState<any>(null);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      setInstallPrompt(null);
    }
  };

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;

  return (
    <div className="min-h-screen bg-[#020617] relative">
      <JARVISContainer />
      
      {/* Hidden triggered prompt or debug info if needed */}
      {installPrompt && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
          <button 
            onClick={handleInstall}
            className="px-4 py-2 bg-cyan-500 text-black text-[10px] font-bold uppercase tracking-widest rounded-none border border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.5)] animate-pulse"
          >
            Installer JARVIS sur le système
          </button>
        </div>
      )}

      {isIOS && !((window as any).navigator.standalone) && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-slate-900/90 border border-cyan-500/30 text-cyan-400 text-[10px] text-center backdrop-blur-sm">
          Pour installer JARVIS sur iPhone : appuyez sur <span className="font-bold">Partager</span> puis <span className="font-bold">Sur l'écran d'accueil</span>.
        </div>
      )}
    </div>
  );
}



