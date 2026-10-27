import React from 'react';

interface BugleHeaderProps {
  isPlaying: boolean;
  onToggleMusic: () => void;
}

const BugleHeader: React.FC<BugleHeaderProps> = ({ isPlaying, onToggleMusic }) => {
  return (
    <header className="border-b-4 border-black bg-white">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="text-center">
          <div className="text-xs uppercase tracking-wider mb-2 text-black">New York's Finest Daily Newspaper</div>
          <h1 className="text-7xl font-black uppercase tracking-tight mb-2 text-black" style={{ fontFamily: 'Georgia, serif' }}>
            The Daily Bugle
          </h1>
          <div className="flex items-center justify-center gap-8 text-xs mt-4 text-black">
            <span>Thursday, March 19, 2026</span>
            <span className="text-red-600 font-bold">BREAKING NEWS</span>
            <span>Price: $2.50</span>
            <button
              className="bg-gray-200 hover:bg-gray-300 border border-black px-3 py-1 cursor-pointer transition-colors text-black"
              onClick={onToggleMusic}
              aria-label={isPlaying ? 'Pause theme music' : 'Play theme music'}
            >
              {isPlaying ? '♫ ON' : '♫ OFF'}
            </button>
          </div>
        </div>
      </div>
      <nav className="bg-black text-white">
        <div className="max-w-7xl mx-auto px-4">
          <ul className="flex items-center justify-center gap-8 py-2 text-sm uppercase tracking-wide">
            <li className="hover:text-red-500 cursor-pointer">Home</li>
            <li className="hover:text-red-500 cursor-pointer">City</li>
            <li className="hover:text-red-500 cursor-pointer">Crime</li>
            <li className="hover:text-red-500 cursor-pointer">Sports</li>
            <li className="hover:text-red-500 cursor-pointer">Opinion</li>
            <li className="hover:text-red-500 cursor-pointer">Weather</li>
          </ul>
        </div>
      </nav>
    </header>
  );
};

export default BugleHeader;
