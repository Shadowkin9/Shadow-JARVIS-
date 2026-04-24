import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Terminal, Send, Bot, User, Mic, MicOff, CheckSquare, Square, Calendar, Volume2, Radio, Paperclip, Image as ImageIcon, MapPin, Search, Heart } from 'lucide-react';
import { HUD } from './HUD';
import { VisualID } from './VisualID';
import { MapDisplay } from './MapDisplay';
import { askJarvis } from '../services/geminiService';
import { jarvisVoice } from '../lib/voice';
import { soundManager } from '../lib/sounds';
import { cn } from '../lib/utils';

interface Message {
  role: 'user' | 'model';
  content: string;
  timestamp: Date;
}

interface Task {
  id: string;
  text: string;
  completed: boolean;
  deadline?: string;
}

export const JARVISContainer = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'model',
      content: "Systèmes initialisés. Prêt pour le transfert de contrôle, Monsieur.",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [accentColor, setAccentColor] = useState('#22d3ee');
  const [isLocked, setIsLocked] = useState(true);
  const [showMobileStats, setShowMobileStats] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBtn, setShowInstallBtn] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBtn(true);
      addLog("SYSTÈME PRÊT POUR INSTALLATION LOCALE (PWA)");
      addLog("BOUTON 'DOWNLOAD' DISPONIBLE DANS LE HEADER");
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      addLog("Installation de JARVIS acceptée.");
    }
    setDeferredPrompt(null);
    setShowInstallBtn(false);
  };

  const [mapState, setMapState] = useState({ location: '0,0', zoom: 2 });
  const [attachments, setAttachments] = useState<{ mimeType: string, data: string, name: string }[]>([]);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [protocols, setProtocols] = useState<Record<string, boolean>>({
    "Clean Slate": false,
    "House Party": false,
    "Iron Legion Admin": true,
    "Veronica Link": false
  });
  const [systemLogs, setSystemLogs] = useState<string[]>([
    "[10:41:02] Liaison satellite établie.",
    "[10:41:15] Analyse d'intégrité terminée.",
    "[10:41:30] Carburant optimisé pour le vol."
  ]);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const handleSubmitRef = useRef<any>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const addLog = (log: string) => {
    setSystemLogs(prev => [`[${new Date().toLocaleTimeString()}] ${log}`, ...prev].slice(0, 5));
  };

  const speakResponse = useCallback(async (text: string) => {
    if (isVoiceEnabled) {
      await jarvisVoice.speak(text);
    }
  }, [isVoiceEnabled]);

  const handleFunctionCall = useCallback((call: any) => {
    const { name, args } = call;
    addLog(`Appel système : ${name}`);
    soundManager.playBeep();

    // Haptic feedback for mobile devices
    if ('vibrate' in navigator) {
      navigator.vibrate([30, 50, 30]);
    }

    if (name === 'manage_tasks') {
      const { action, text, id, deadline } = args;
      if (action === 'add' && text) {
        const newTask: Task = {
          id: Math.random().toString(36).substr(2, 9),
          text,
          completed: false,
          deadline
        };
        setTasks(prev => [...prev, newTask]);
        addLog(`Tâche ajoutée : ${text}`);
      } else if (action === 'remove' && id) {
        setTasks(prev => prev.filter(t => t.id !== id));
        addLog(`Tâche supprimée : ${id}`);
      } else if (action === 'toggle' && id) {
        setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
        addLog(`Statut tâche modifié : ${id}`);
      }
    } else if (name === 'control_ui') {
      const { accentColor: color, protocolAction, protocolName } = args;
      if (color) {
        setAccentColor(color);
        addLog(`Thème mis à jour : ${color}`);
      }
      if (protocolAction && protocolName) {
        setProtocols(prev => ({ ...prev, [protocolName]: protocolAction === 'activate' }));
        addLog(`Protocole ${protocolName} : ${protocolAction.toUpperCase()}`);
      }
    } else if (name === 'search_map') {
      const { location, zoom } = args;
      addLog(`Scan satellite : ${location || 'Zone inconnue'}`);
      soundManager.playMapSearch();
      setMapState({ 
        location: location || '0,0', 
        zoom: zoom || (location ? 12 : 2) 
      });
    } else if (name === 'get_current_location') {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          addLog(`Coordonnées GPS acquises : ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
          setMapState({ location: `${lat},${lng}`, zoom: 15 });
          soundManager.playSuccess();
        }, () => {
          addLog("Erreur : Impossible d'accéder à la géolocalisation.");
          soundManager.playError();
        });
      }
    } else if (name === 'social_scan') {
      const { query } = args;
      addLog(`Scan social initié : ${query || 'Cible inconnue'}`);
      soundManager.playScan();
      setTimeout(() => {
        addLog("Plusieurs correspondances trouvées sur les réseaux.");
        soundManager.playNotification();
      }, 2000);
    } else if (name === 'get_app_link') {
      const url = window.location.href;
      addLog(`Lien de l'application GRID : ${url}`);
      addLog("Vous pouvez partager ce lien ou l'utiliser pour installer l'application sur vos appareils (PWA).");
      soundManager.playSuccess();
    }
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file: File) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        const data = base64.split(',')[1];
        setAttachments(prev => [...prev, { 
          mimeType: file.type, 
          data: data,
          name: file.name
        }]);
        addLog(`Fichier chargé : ${file.name}`);
        soundManager.playSuccess();
      };
      reader.readAsDataURL(file);
    });
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setAvatar(event.target?.result as string);
      addLog("Avatar mis à jour.");
      soundManager.playSuccess();
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = useCallback(async (e?: React.FormEvent, customInput?: string) => {
    if (e) e.preventDefault();
    const finalInput = customInput || input;
    if (!finalInput.trim() || isThinking) return;

    try {
      const userMessage: Message = {
        role: 'user',
        content: finalInput,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, userMessage]);
      setInput('');
      setIsThinking(true);
      soundManager.playMessageSent();

      const history = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.content }]
      }));

      const taskContext = tasks.length > 0 
        ? `\n[Context] Tasks: ${tasks.map(t => `${t.text} (ID: ${t.id}, ${t.completed ? 'DONE' : 'TODO'})`).join(', ')}`
        : '';
      const uiContext = `\n[Context] UI Accent: ${accentColor}, Protocols: ${Object.entries(protocols).map(([k, v]) => `${k}:${v}`).join(', ')}`;

      const response = await askJarvis(finalInput + taskContext + uiContext, history, attachments) as any;
      
      setIsThinking(false);
      setAttachments([]);
      soundManager.playSuccess();
      if (!response) {
        setMessages(prev => [...prev, { role: 'model', content: "Erreur réseau, Monsieur.", timestamp: new Date() }]);
        return;
      }

      const candidates = response.candidates?.[0];
      const parts = candidates?.content?.parts || [];
      
      let botText = "";
      parts.forEach((part: any) => {
        if (part.text) {
          botText += part.text;
        }
        if (part.functionCall) {
          handleFunctionCall(part.functionCall);
            if (part.functionCall.name === 'search_map') {
              soundManager.playMapSearch();
            }
          }
      });

      if (botText) {
        setMessages(prev => [...prev, {
          role: 'model',
          content: botText,
          timestamp: new Date()
        }]);
        
        if (isVoiceEnabled) {
          await jarvisVoice.speak(botText);
          
          // Automatic re-listen in Live Mode
          if (isLiveMode && !isListening) {
            // Small delay to ensure any echo is cleared or just to feel natural
            setTimeout(() => {
              toggleVoice();
            }, 500);
          }
        }
      }
    } catch (error) {
       console.error("Submit error:", error);
       setIsThinking(false);
    }
  }, [input, isThinking, messages, tasks, accentColor, protocols, isVoiceEnabled, isLiveMode, isListening, handleFunctionCall]);

  useEffect(() => {
    handleSubmitRef.current = handleSubmit;
  }, [handleSubmit]);

  const toggleTask = (id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
    soundManager.playBeep();
  };

  const toggleVoice = useCallback(() => {
    if (isListening) {
      jarvisVoice.stopListening();
      setIsListening(false);
      soundManager.playBeep();
    } else {
      setSpeechError(null);
      soundManager.playListening();
      jarvisVoice.startListening(
        (text) => {
          setIsListening(false);
          if (handleSubmitRef.current) {
            handleSubmitRef.current(undefined, text);
          }
        },
        (err) => {
          setIsListening(false);
          setSpeechError(err);
        }
      );
      setIsListening(true);
    }
  }, [isListening, isThinking]); // No circular dependency here, but handleSubmit needs it

  return (
    <>
      <AnimatePresence>
        {isLocked && (
          <VisualID 
            accentColor={accentColor} 
            onAuthenticated={() => {
              setIsLocked(false);
              addLog("Identité confirmée. Bienvenue, Monsieur.");
              soundManager.playJarvisStart();
              speakResponse("Identité confirmée. Système déverrouillé. Bienvenue, Monsieur.");
            }} 
          />
        )}
      </AnimatePresence>

      <div className="relative h-screen w-screen flex flex-col p-1 overflow-hidden" style={{'--accent-color': accentColor} as any}>
      <div className="scanline" />
      
      {/* Header Info */}
      <header className="flex justify-between items-center border-b border-cyan/20 px-4 h-12 z-20 shrink-0" style={{borderColor: accentColor}}>
        <div className="flex items-center gap-2 md:gap-4"> 
          <label className="relative cursor-pointer group">
            <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
            <div className="w-6 h-6 md:w-8 md:h-8 rounded-full border border-cyan-500/30 overflow-hidden bg-black/40 flex items-center justify-center group-hover:border-cyan-400 transition-colors">
              {avatar ? (
                <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <User size={14} className="md:size-[16px] opacity-40" />
              )}
            </div>
            <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
              <ImageIcon size={10} className="text-white" />
            </div>
          </label>
          <h1 className="text-sm md:text-xl font-bold tracking-tighter glow-cyan uppercase flex items-center gap-1 md:gap-2" style={{color: accentColor}}>
             <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full animate-pulse" style={{backgroundColor: accentColor}} />
             J.A.R.V.I.S.
          </h1>
          <span className="hidden sm:inline text-[8px] tracking-[0.3em] uppercase opacity-30">Système de Liaison Tactique</span>
        </div>
        <div className="flex gap-4 md:gap-8 text-[9px] md:text-[11px]">
          <div className="hidden xs:flex flex-col items-end">
            <span className="text-[7px] uppercase opacity-40">Horloge</span>
            <span className="font-mono text-white">{currentTime}</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[7px] uppercase opacity-40">Live</span>
            <button 
              onClick={() => setIsLiveMode(!isLiveMode)}
              className="flex items-center gap-1 font-bold h-5 md:h-auto"
              style={{color: isLiveMode ? accentColor : '#f8717150'}}
            >
              <Radio size={10} className={cn(isLiveMode && "animate-pulse")} /> 
              <span className="hidden xs:inline">{isLiveMode ? "MAINS LIBRES" : "OFF"}</span>
              <span className="xs:hidden">{isLiveMode ? "LIVE" : "OFF"}</span>
            </button>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[7px] uppercase opacity-40">Stats</span>
            <button 
              onClick={() => setShowMobileStats(!showMobileStats)}
              className="xl:hidden flex items-center gap-1 font-bold h-5 md:h-auto"
              style={{color: showMobileStats ? accentColor : '#f8717150'}}
            >
              <Terminal size={10} /> {showMobileStats ? "HIDE" : "SHOW"}
            </button>
          </div>
          {showInstallBtn && (
            <div className="flex flex-col items-end">
              <span className="text-[7px] uppercase opacity-40">Install</span>
              <button 
                onClick={handleInstallClick}
                className="flex items-center gap-1 font-bold h-5 md:h-auto text-green-400"
              >
                <Bot size={10} /> DOWNLOAD
              </button>
            </div>
          )}
          <div className="hidden xs:flex flex-col items-end">
            <span className="text-[7px] uppercase opacity-40">Audio</span>
            <button 
              onClick={() => setIsVoiceEnabled(!isVoiceEnabled)}
              className="flex items-center gap-1 font-bold"
              style={{color: isVoiceEnabled ? accentColor : '#f8717150'}}
            >
              <Volume2 size={10} /> {isVoiceEnabled ? "ON" : "OFF"}
            </button>
          </div>
        </div>
      </header>

      <main className="flex-grow grid grid-cols-12 gap-2 my-1 overflow-hidden">
        {/* Minimal Sidebars */}
        <section className="col-span-1 flex flex-col gap-2 h-full overflow-hidden">
          <div className="bg-cyan-soft border border-cyan/10 p-2 flex-1 overflow-auto custom-scrollbar" style={{borderColor: `${accentColor}22`}}>
            <h3 className="text-[8px] font-bold uppercase mb-2 opacity-50" style={{color: accentColor}}>Tâches</h3>
            <div className="space-y-1">
               {tasks.map(task => (
                <div key={task.id} className="text-[8px] flex items-center gap-1 opacity-60">
                   <div className="w-1 h-1 rounded-full" style={{backgroundColor: task.completed ? accentColor : '#666'}} />
                   <span className="truncate">{task.text}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-cyan-soft border border-cyan/10 p-2 h-24" style={{borderColor: `${accentColor}22`}}>
             <h3 className="text-[8px] font-bold uppercase mb-2 opacity-50" style={{color: accentColor}}>Bio</h3>
             <div className="text-[8px] space-y-1 opacity-60">
               <div>HR: 72 BPM</div>
               <div className="w-full h-0.5 bg-white/10 overflow-hidden"><div className="h-full bg-cyan-400" style={{width: '72%'}} /></div>
             </div>
          </div>
        </section>

        {/* Massive Center: Chat & Map */}
        <section className="col-span-10 flex flex-col gap-2 h-full overflow-hidden">
          <div className="flex-[3] flex flex-col glass-panel overflow-hidden border border-cyan/20" style={{borderColor: `${accentColor}33`}}>
            <div className="p-1 border-b border-cyan/10 bg-cyan-400/5 flex items-center justify-between">
              <span className="text-[9px] font-mono uppercase tracking-[0.3em] flex items-center gap-2" style={{color: accentColor}}>
                <Terminal size={10} /> Liaison Directive de Contrôle
              </span>
            </div>
            
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-6 font-sans text-[13px] custom-scrollbar">
              <AnimatePresence mode="popLayout">
                {messages.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={cn(
                      "flex flex-col gap-1 w-full",
                      msg.role === 'user' ? "items-end" : "items-start"
                    )}
                  >
                    <div className="text-[9px] opacity-20 uppercase font-mono tracking-tighter">
                      {msg.role === 'model' ? 'JARVIS_MAIN_FRAME' : 'AUTH_USER_ROOT'}
                    </div>
                    <div className={cn(
                      "px-4 py-2 border relative group min-w-[100px] max-w-[80%]",
                      msg.role === 'user' 
                        ? "bg-cyan-400/5 text-cyan-100 border-cyan-500/30" 
                        : "bg-white/5 text-slate-100 border-white/10"
                    )} style={{borderColor: msg.role === 'user' ? `${accentColor}44` : undefined}}>
                      <div className="absolute -left-1 top-0 w-1 h-2 bg-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                      {msg.content}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {attachments.length > 0 && (
              <div className="px-4 py-2 flex gap-2 overflow-x-auto bg-black/40 border-t border-cyan-500/10">
                {attachments.map((att, idx) => (
                  <div key={idx} className="relative group shrink-0">
                    <div className="w-12 h-12 border border-cyan-500/30 bg-cyan-900/20 rounded flex items-center justify-center overflow-hidden">
                      {att.mimeType.startsWith('image/') ? (
                        <img src={`data:${att.mimeType};base64,${att.data}`} className="w-full h-full object-cover" />
                      ) : att.mimeType.startsWith('video/') ? (
                        <div className="text-[8px] uppercase">Video</div>
                      ) : (
                        <Paperclip size={16} />
                      )}
                    </div>
                    <button 
                      onClick={() => setAttachments(prev => prev.filter((_, i) => i !== idx))}
                      className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-3 h-3 flex items-center justify-center text-[8px] opacity-0 group-hover:opacity-100 transition-opacity"
                    >×</button>
                  </div>
                ))}
              </div>
            )}

            <form onSubmit={handleSubmit} className="p-2 border-t border-cyan/10 bg-black/40">
              <div className="flex items-center gap-3">
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={toggleVoice}
                    className={cn(
                      "p-3 rounded-full transition-all duration-300 border",
                      isListening ? "bg-red-500/20 border-red-500 text-red-500" : "bg-cyan-500/5 border-cyan-500/20 text-cyan-400"
                    )}
                    style={{color: isListening ? undefined : accentColor, borderColor: isListening ? undefined : `${accentColor}44`}}
                  >
                    {isListening ? <MicOff size={18} /> : <Mic size={18} />}
                  </button>
                  <label className="p-3 rounded-full border border-cyan-500/20 text-cyan-400 bg-cyan-500/5 hover:bg-cyan-500/10 cursor-pointer transition-all" style={{borderColor: `${accentColor}44`, color: accentColor}}>
                    <input type="file" multiple className="hidden" onChange={handleFileUpload} />
                    <Paperclip size={18} />
                  </label>
                </div>
                <div className="flex-1 border-b border-cyan-500/20 flex items-center px-2 py-1 bg-cyan-900/10">
                  <span className="text-[10px] font-bold mr-2 tracking-tighter opacity-70" style={{color: accentColor}}>JARVIS_ID@{isListening ? "LSTN" : "IDLE"} :</span>
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => {
                      setInput(e.target.value);
                      soundManager.playTyping();
                    }}
                    placeholder={isListening ? "Écoute active..." : "Saisissez votre commande..."}
                    className="flex-1 bg-transparent border-none text-sm text-cyan-50 focus:outline-none placeholder:opacity-20"
                  />
                  <button type="submit" className="p-2 opacity-70 hover:opacity-100" style={{color: accentColor}}>
                    <Send size={16} />
                  </button>
                </div>
              </div>
            </form>
          </div>
          
          <div className="flex-[2] grid grid-cols-12 gap-2 overflow-hidden min-h-0">
            <div className="col-span-9 h-full">
               <MapDisplay accentColor={accentColor} location={mapState.location} zoom={mapState.zoom} />
            </div>
            <div className="col-span-3 flex items-center justify-center border bg-cyan-soft/50 relative overflow-hidden h-full" style={{borderColor: `${accentColor}22`}}>
               <HUD isThinking={isThinking || isListening} className="scale-[1.2]" />
               <div className="absolute bottom-2 right-2 text-[7px] uppercase font-mono opacity-20">CORE_R_77</div>
            </div>
          </div>
        </section>

        <section className="col-span-1 flex flex-col gap-2 h-full overflow-hidden">
           <div className="bg-cyan-soft border border-cyan/10 p-2 flex-1 flex flex-col gap-2 overflow-hidden" style={{borderColor: `${accentColor}22`}}>
              <h3 className="text-[8px] font-bold uppercase opacity-50" style={{color: accentColor}}>LOGS</h3>
              <div className="flex-1 text-[7px] font-mono space-y-1 overflow-hidden opacity-40">
                 {systemLogs.map((log, i) => <div key={i} className="truncate">{log}</div>)}
              </div>
           </div>
           <div className="bg-cyan-soft border border-cyan/10 p-2 h-24" style={{borderColor: `${accentColor}22`}}>
              <h3 className="text-[8px] font-bold uppercase mb-2 opacity-50" style={{color: accentColor}}>PRTCL</h3>
              <div className="space-y-1">
                 {Object.entries(protocols).map(([p, active]) => (
                   <div key={p} className="flex items-center gap-1 text-[7px]">
                      <div className={cn("w-1 h-1 rounded-full", active ? "bg-cyan-400 animate-pulse" : "bg-slate-700")} />
                      <span className={active ? "text-white" : "opacity-30"}>{p}</span>
                   </div>
                 ))}
              </div>
           </div>
        </section>
      </main>

      <footer className="h-8 md:h-12 border-t flex items-center px-4 bg-cyan-400/5 z-20 shrink-0" style={{borderColor: accentColor}}>
        <div className="text-[8px] md:text-[10px] flex items-center gap-2 md:gap-4 flex-1 truncate" style={{color: accentColor}}>
          <span className="font-bold opacity-60 hidden xs:inline">ÉTAT DU SYSTÈME :</span>
          <span>{isThinking ? "TRAITEMENT" : isListening ? "ÉCOUTE" : "VEILLE"}</span>
          <span className="text-white animate-pulse">|</span>
        </div>
        <div className="flex gap-4 md:gap-6 text-[8px] md:text-[9px] font-bold uppercase tracking-[0.1em] md:tracking-[0.2em]" style={{color: accentColor}}>
          <span className="hidden sm:flex items-center gap-1"><div className="w-0.5 h-0.5 md:w-1 md:h-1 rounded-full" style={{backgroundColor: accentColor}} /> CPU_0.24%</span>
          <span className="flex items-center gap-1"><div className="w-0.5 h-0.5 md:w-1 md:h-1 rounded-full" style={{backgroundColor: accentColor}} /> RAM_18.2GB</span>
          <span className="hidden xs:flex items-center gap-1"><div className="w-0.5 h-0.5 md:w-1 md:h-1 rounded-full" style={{backgroundColor: accentColor}} /> DISQUE_OK</span>
        </div>
      </footer>
    </div>
    </>
  );
};


