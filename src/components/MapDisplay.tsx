import React, { useMemo } from 'react';
import { motion } from 'motion/react';

interface MapDisplayProps {
  accentColor: string;
  zoom?: number;
  location?: string;
}

export const MapDisplay: React.FC<MapDisplayProps> = ({ accentColor, zoom = 2, location = "0,0" }) => {
  // Use a map type that looks more "tactical"
  const mapUrl = useMemo(() => {
    const baseUrl = "https://www.google.com/maps/embed?pb=";
    // We'll use a more generic search embed if a location name is provided, 
    // or coordinates if we can. Since the embed pb code is complex, 
    // we'll try a simpler approach or use the place search embed.
    if (location && location !== "0,0") {
      return `https://www.google.com/maps?q=${encodeURIComponent(location)}&z=${zoom}&output=embed&t=k&gestureHandling=greedy`;
    }
    return `https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d100000000!2d0!3d0!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1sen!2sus!4v1620000000000!5m2!1sen!2sus&t=k&gestureHandling=greedy`;
  }, [location, zoom]);

  return (
    <div className="relative w-full h-full bg-black border border-white/5 overflow-hidden rounded-sm group flex flex-col">
      <div className="absolute inset-0 z-10 pointer-events-none border border-cyan-500/20 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] group-active:border-cyan-400/40 transition-colors" />
      
      {/* Real Google Maps Embed with JARVIS Overlay */}
      <div className="flex-1 relative filter grayscale invert contrast-[1.2] brightness-[0.8] opacity-60 transition-all duration-1000">
        <motion.div 
          className="absolute inset-0 z-10 pointer-events-none"
          animate={{ background: ["rgba(6, 182, 212, 0)", "rgba(6, 182, 212, 0.05)", "rgba(6, 182, 212, 0)"] }}
          transition={{ duration: 4, repeat: Infinity }}
        />
        <iframe
          width="100%"
          height="100%"
          frameBorder="0"
          style={{ border: 0 }}
          src={mapUrl}
          allowFullScreen
          key={mapUrl} // Force re-render of iframe when URL changes
        ></iframe>
        <div className="absolute inset-0 bg-cyan-900/10 pointer-events-none mix-blend-color" />
      </div>

      {/* Grid Overlay */}
      <div className="absolute inset-0 opacity-10 pointer-events-none z-20" 
           style={{ 
             backgroundImage: `linear-gradient(${accentColor} 1px, transparent 1px), linear-gradient(90deg, ${accentColor} 1px, transparent 1px)`,
             backgroundSize: '40px 40px'
           }} 
      />

      {/* Scanning lines */}
      <motion.div 
        className="absolute inset-x-0 h-[2px] z-30 opacity-50 bg-gradient-to-r from-transparent via-cyan-400 to-transparent"
        animate={{ top: ['0%', '100%'] }}
        transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
      />

      <div className="absolute bottom-2 left-2 flex flex-col gap-1">
        <span className="text-[8px] font-mono uppercase tracking-tighter opacity-70" style={{ color: accentColor }}>
          Global Surveillance Active
        </span>
        <div className="flex gap-2">
            <div className="w-12 h-1 bg-white/10 overflow-hidden">
                <motion.div 
                   className="h-full" 
                   style={{ backgroundColor: accentColor }}
                   animate={{ x: ["-100%", "100%"] }}
                   transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                />
            </div>
            <span className="text-[6px] font-mono opacity-40">UPLINK: SECURE</span>
        </div>
      </div>

      <div className="absolute top-2 right-2 flex items-center gap-2">
        <div className="w-2 h-2 rounded-full animate-ping" style={{ backgroundColor: accentColor }} />
        <span className="text-[8px] font-mono uppercase" style={{ color: accentColor }}>Live</span>
      </div>
    </div>
  );
};
