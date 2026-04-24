import { motion } from 'motion/react';
import { cn } from '../lib/utils';

interface HUDProps {
  isThinking: boolean;
  className?: string;
}

export const HUD = ({ isThinking, className }: HUDProps) => {
  return (
    <div className={cn("relative flex items-center justify-center w-64 h-64", className)}>
      {/* Outer Rotating Ring */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
        className="absolute inset-0 border-2 border-dashed border-cyan-400/20 rounded-full"
      />
      
      {/* Middle Pulsing Ring */}
      <motion.div
        animate={{ 
          scale: isThinking ? [1, 1.05, 1] : 1,
          opacity: isThinking ? [0.2, 0.5, 0.2] : 0.2,
          rotate: -360 
        }}
        transition={{ 
          scale: { duration: 3, repeat: Infinity, ease: "easeInOut" },
          opacity: { duration: 3, repeat: Infinity, ease: "easeInOut" },
          rotate: { duration: 30, repeat: Infinity, ease: "linear" }
        }}
        className="absolute inset-4 border border-cyan-400/40 rounded-full"
      >
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3 h-3 bg-cyan-400 rounded-full blur-[1px]" />
      </motion.div>

      {/* Inner HUD Elements */}
      <div className="absolute inset-10 border border-cyan-400/10 rounded-full overflow-hidden">
        <motion.div
          animate={{ height: isThinking ? ['10%', '90%', '10%'] : '30%' }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-0 left-0 right-0 bg-cyan-400/5"
        />
        <div className="absolute inset-0 flex items-center justify-center">
           <span className="text-cyan-400 text-3xl font-bold glow-cyan">100%</span>
        </div>
      </div>

      {/* Central Core */}
      <motion.div
        animate={{ 
          scale: isThinking ? [1, 1.1, 1] : 1,
          opacity: isThinking ? [0.6, 1, 0.6] : 0.8
        }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        className="z-10 w-12 h-12 rounded-full border-2 border-cyan-400 shadow-[0_0_40px_rgba(34,211,238,0.3)] bg-cyan-500/10"
      />

      {/* Orbitron Textures */}
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
        <div
          key={angle}
          className="absolute w-full h-[0.5px] bg-cyan-400/10"
          style={{ transform: `rotate(${angle}deg)` }}
        />
      ))}
    </div>
  );
};
