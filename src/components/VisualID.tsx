import React, { useEffect, useRef, useState } from 'react';
import * as faceapi from '@vladmandic/face-api';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, UserCheck, AlertTriangle, Scan } from 'lucide-react';
import { soundManager } from '../lib/sounds';

interface VisualIDProps {
  onAuthenticated: () => void;
  accentColor: string;
}

export const VisualID: React.FC<VisualIDProps> = ({ onAuthenticated, accentColor }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState<'initializing' | 'scanning' | 'success' | 'error'>('initializing');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const loadModels = async () => {
      try {
        const MODEL_URL = 'https://justadudewhohacks.github.io/face-api.js/models';
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        ]);
        // Don't auto-start if scanning is already set? No, we need to try once
        startVideo();
      } catch (err) {
        console.error("Model load error:", err);
        setStatus('error');
        setErrorMsg("Échec du chargement des modèles biométriques.");
        soundManager.playError();
      }
    };
    loadModels();

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
         const stream = videoRef.current.srcObject as MediaStream;
         stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startVideo = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: {} });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setStatus('scanning');
      soundManager.playScan();
      setErrorMsg('');
    } catch (err) {
      console.error("Camera access error:", err);
      setStatus('error');
      soundManager.playError();
      if (err instanceof DOMException && err.name === 'NotAllowedError') {
        setErrorMsg("Accès caméra refusé. Veuillez autoriser l'accès dans les paramètres du navigateur.");
      } else {
        setErrorMsg("Erreur d'accès à la caméra. Vérifiez qu'aucun autre programme ne l'utilise.");
      }
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (status === 'scanning') {
      interval = setInterval(async () => {
        if (videoRef.current && canvasRef.current) {
          const detections = await faceapi.detectSingleFace(
            videoRef.current,
            new faceapi.TinyFaceDetectorOptions()
          );

          if (detections) {
            setStatus('success');
            soundManager.playSuccess();
            clearInterval(interval);
            // Stop video stream
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
            
            setTimeout(() => {
              onAuthenticated();
            }, 1500);
          }
        }
      }, 500);
    }
    return () => clearInterval(interval);
  }, [status, onAuthenticated]);

  return (
    <div className="fixed inset-0 z-[100] bg-[#020617] flex flex-col items-center justify-center p-6">
      <div className="absolute inset-0 opacity-20 pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, ' + accentColor + ' 0%, transparent 70%)' }} />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md aspect-square relative border border-cyan-400/20 bg-black/40 overflow-hidden"
        style={{ borderColor: accentColor + '33' }}
      >
        <video 
          ref={videoRef} 
          autoPlay 
          muted 
          playsInline 
          className="absolute inset-0 w-full h-full object-cover grayscale brightness-75" 
        />
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />
        
        {/* Scanner Overlay */}
        {status === 'scanning' && (
          <motion.div 
            animate={{ top: ['0%', '100%', '0%'] }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            className="absolute left-0 right-0 h-[2px] shadow-[0_0_15px_rgba(34,211,238,0.8)] z-10"
            style={{ backgroundColor: accentColor }}
          />
        )}

        {/* UI Overlay */}
        <div className="absolute inset-0 p-4 flex flex-col justify-between pointer-events-none">
          <div className="flex justify-between">
            <div className="w-8 h-8 border-t-2 border-l-2" style={{ borderColor: accentColor }} />
            <div className="w-8 h-8 border-t-2 border-r-2" style={{ borderColor: accentColor }} />
          </div>
          <div className="flex justify-between">
            <div className="w-8 h-8 border-b-2 border-l-2" style={{ borderColor: accentColor }} />
            <div className="w-8 h-8 border-b-2 border-r-2" style={{ borderColor: accentColor }} />
          </div>
        </div>

        {/* Status Text overlay in video */}
        <div className="absolute inset-x-0 bottom-8 flex flex-col items-center gap-2">
          <AnimatePresence mode="wait">
            {status === 'initializing' && (
              <motion.div 
                key="init"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] animate-pulse"
                style={{ color: accentColor }}
              >
                Initialisation des protocoles biométriques...
              </motion.div>
            )}
            {status === 'scanning' && (
              <motion.div 
                key="scan"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] font-bold"
                style={{ color: accentColor }}
              >
                <Scan size={14} className="animate-spin-slow" /> Analyse rétinienne en cours
              </motion.div>
            )}
            {status === 'success' && (
              <motion.div 
                key="success"
                initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center gap-2 text-green-400 font-bold uppercase tracking-[0.4em]"
              >
                <UserCheck size={32} />
                <span>Accès Autorisé</span>
              </motion.div>
            )}
            {status === 'error' && (
              <motion.div 
                key="error"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="flex flex-col items-center gap-2 text-red-400 font-bold uppercase text-[10px]"
              >
                <AlertTriangle size={24} />
                <span>{errorMsg}</span>
                <div className="flex flex-col gap-3">
                  <button 
                    onClick={() => startVideo()}
                    className="mt-2 px-4 py-1 border border-red-400/30 bg-red-400/5 hover:bg-red-400/10 pointer-events-auto text-[8px]"
                  >
                    Réessayer l'Accès Caméra
                  </button>
                  <button 
                    onClick={() => onAuthenticated()}
                    className="px-4 py-1 border border-cyan-400/30 bg-cyan-400/5 hover:bg-cyan-400/10 pointer-events-auto text-[8px] opacity-40 hover:opacity-100"
                  >
                    Outrepasser la Biométrie (Admin Override)
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      <div className="mt-8 flex flex-col items-center gap-1 opacity-40">
        <ShieldCheck size={20} style={{ color: accentColor }} />
        <span className="text-[9px] uppercase tracking-widest">Protocole de Sécurité Biométrique v2.4</span>
      </div>
    </div>
  );
};
