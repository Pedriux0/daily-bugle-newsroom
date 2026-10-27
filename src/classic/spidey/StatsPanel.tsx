import React, { useState, useEffect, useRef } from 'react';
import { Activity, Users, Award, MapPin } from 'lucide-react';

interface StatConfig {
  id: number;
  icon: React.FC<{ className?: string }>;
  label: string;
  baseValue: number;
  sublabel: string;
  color: string;
  glow: string;
  format: (v: number) => string;
  drift: { min: number; max: number; intervalMs: number };
}

const STATS: StatConfig[] = [
  {
    id: 1,
    icon: Activity,
    label: 'Active Today',
    baseValue: 47,
    sublabel: 'sightings',
    color: 'from-red-600 to-red-800',
    glow: 'shadow-[0_0_30px_rgba(239,68,68,0.5)]',
    format: (v) => String(v),
    drift: { min: -2, max: 3, intervalMs: 3000 },
  },
  {
    id: 2,
    icon: Users,
    label: 'Lives Saved',
    baseValue: 1284,
    sublabel: 'this year',
    color: 'from-white to-gray-300',
    glow: 'shadow-[0_0_30px_rgba(255,255,255,0.3)]',
    format: (v) => v.toLocaleString(),
    drift: { min: 1, max: 5, intervalMs: 4000 },
  },
  {
    id: 3,
    icon: Award,
    label: 'Crimes Stopped',
    baseValue: 532,
    sublabel: 'this month',
    color: 'from-red-500 to-white',
    glow: 'shadow-[0_0_30px_rgba(239,68,68,0.4)]',
    format: (v) => v.toLocaleString(),
    drift: { min: 0, max: 3, intervalMs: 5000 },
  },
  {
    id: 4,
    icon: MapPin,
    label: 'Coverage Area',
    baseValue: 100,
    sublabel: 'of NYC',
    color: 'from-red-600 to-red-800',
    glow: 'shadow-[0_0_30px_rgba(239,68,68,0.5)]',
    format: (v) => `${v}%`,
    drift: { min: -2, max: 0, intervalMs: 6000 },
  },
];

const AnimatedValue: React.FC<{ value: string; flashing: boolean }> = ({ value, flashing }) => (
  <div
    className={`text-3xl font-black mb-1 text-white font-mono relative z-10 transition-all duration-300 ${
      flashing ? 'text-red-400 scale-110' : ''
    }`}
  >
    {value}
  </div>
);

const StatsPanel: React.FC = () => {
  const [values, setValues] = useState<number[]>(STATS.map((s) => s.baseValue));
  const [flashing, setFlashing] = useState<boolean[]>(STATS.map(() => false));
  const intervalsRef = useRef<ReturnType<typeof setInterval>[]>([]);

  useEffect(() => {
    intervalsRef.current = STATS.map((stat, i) =>
      setInterval(() => {
        const delta = Math.floor(
          Math.random() * (stat.drift.max - stat.drift.min + 1) + stat.drift.min
        );
        if (delta === 0) return;

        setValues((prev) => {
          const next = [...prev];
          let newVal = next[i] + delta;
          // Keep coverage 94-100%, keep others above 0
          if (stat.id === 4) newVal = Math.max(94, Math.min(100, newVal));
          else newVal = Math.max(0, newVal);
          next[i] = newVal;
          return next;
        });

        // Flash effect
        setFlashing((prev) => {
          const next = [...prev];
          next[i] = true;
          return next;
        });
        setTimeout(() => {
          setFlashing((prev) => {
            const next = [...prev];
            next[i] = false;
            return next;
          });
        }, 400);
      }, stat.drift.intervalMs + Math.random() * 1000)
    );

    return () => {
      intervalsRef.current.forEach(clearInterval);
    };
  }, []);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {STATS.map((stat, i) => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.id}
            className="bg-black border-2 border-red-600 rounded-lg shadow-[0_0_20px_rgba(239,68,68,0.2)] p-6 hover:shadow-[0_0_40px_rgba(239,68,68,0.4)] transition relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-red-600/10 to-transparent animate-pulse"></div>
            <div className={`bg-gradient-to-br ${stat.color} w-12 h-12 rounded flex items-center justify-center mb-3 ${stat.glow} relative z-10`}>
              <Icon className="w-6 h-6 text-black" />
            </div>
            <AnimatedValue value={stat.format(values[i])} flashing={flashing[i]} />
            <div className="text-sm font-bold text-red-500 uppercase tracking-wider relative z-10">{stat.label}</div>
            <div className="text-xs text-gray-400 font-mono relative z-10">{stat.sublabel}</div>
          </div>
        );
      })}
    </div>
  );
};

export default StatsPanel;
