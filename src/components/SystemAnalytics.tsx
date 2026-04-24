import { motion } from 'motion/react';
import { useEffect, useState } from 'react';

export const SystemAnalytics = () => {
  const [data, setData] = useState<number[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setData(prev => {
        const next = [...prev, Math.floor(Math.random() * 40) + 10];
        if (next.length > 20) return next.slice(1);
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-end gap-0.5 h-12">
      {data.map((val, i) => (
        <motion.div
          key={i}
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          className="w-1 bg-cyan-500/30"
          style={{ height: `${val}%` }}
        />
      ))}
    </div>
  );
};

export const RandomLogs = () => {
  const [logs, setLogs] = useState<string[]>([]);
  const logPool = [
    "RE-ROUTING_POWER_TO_THRUSTERS",
    "DECRYPTING_STARK_SERVER_B2",
    "UPDATING_OPERATING_SYSTEM_v12.4",
    "SCAN_COMPLETE: NO_THREATS_DETECTED",
    "OPTIMIZING_NEURAL_PATHWAYS",
    "BACKUP_SUCCESSFUL: ARCHIVE_C_001",
    "THERMAL_REGULATION: STABLE",
    "BUFFER_OVERFLOW_PREVENTED",
    "QUANTUM_SYNC: INITIALIZED"
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      const randomLog = logPool[Math.floor(Math.random() * logPool.length)];
      setLogs(prev => [randomLog, ...prev].slice(0, 5));
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col gap-1 font-mono text-[7px] text-cyan-500/30 uppercase">
      {logs.map((log, i) => (
        <motion.div
          key={log + i}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
        >
          {`> ${log}`}
        </motion.div>
      ))}
    </div>
  );
};
