import React from 'react';
import { Bell, Search } from 'lucide-react';

interface SpideyHeaderProps {
  isPlaying: boolean;
  onToggleMusic: () => void;
}

const SpideyHeader: React.FC<SpideyHeaderProps> = ({ isPlaying, onToggleMusic }) => {
  return (
    <header className="sticky top-0 z-50 bg-red border-b-2 border-red-600 text-white shadow-[0_0_20px_rgba(239,68,68,0.5)]">
      <div className="max-w-6xl mx-auto px-4 py-4 relative">
        {/* Web pattern overlay */}
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: `radial-gradient(circle at 20% 50%, transparent 0%, transparent 50%, rgba(239, 68, 68, 0.3) 50%, rgba(239, 68, 68, 0.3) 100%),
                           radial-gradient(circle at 80% 80%, transparent 0%, transparent 50%, rgba(239, 68, 68, 0.3) 50%, rgba(239, 68, 68, 0.3) 100%)`
        }}></div>

        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-red-600 to-white rounded-lg flex items-center justify-center border-2 border-red-600 shadow-[0_0_15px_rgba(239,68,68,0.6)]">
                <span className="text-2xl" role="img" aria-label="spider">&#128375;</span>
              </div>
              <div>
                <h1 className="font-black text-2xl tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-white via-red-500 to-white">
                  SPIDEY.WATCH
                </h1>
                <p className="text-xs text-red-400 font-mono tracking-widest uppercase">NEURAL NETWORK ONLINE</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              className="hover:bg-red-600/20 p-2 rounded-lg transition border border-transparent hover:border-red-600 text-red-400 text-xs font-mono"
              onClick={onToggleMusic}
              aria-label={isPlaying ? 'Pause theme music' : 'Play theme music'}
            >
              {isPlaying ? '♫ ON' : '♫ OFF'}
            </button>
            <button className="hover:bg-red-600/20 p-2 rounded-lg transition border border-transparent hover:border-red-600">
              <Search className="w-5 h-5 text-red-500" />
            </button>
            <button className="hover:bg-red-600/20 p-2 rounded-lg transition relative border border-transparent hover:border-red-600">
              <Bell className="w-5 h-5 text-red-500" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-600 rounded-full animate-pulse shadow-[0_0_10px_rgba(239,68,68,1)]"></span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default SpideyHeader;
