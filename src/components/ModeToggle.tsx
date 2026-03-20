import React from 'react';
import logo from '../assets/logo.png';

type Mode = 'peter' | 'spiderman';

interface ModeToggleProps {
  mode: Mode;
  onToggle: () => void;
  isTransitioning: boolean;
}

const ModeToggle: React.FC<ModeToggleProps> = ({ mode, onToggle, isTransitioning }) => {
  return (
    <button
      className="mode-toggle"
      onClick={onToggle}
      disabled={isTransitioning}
      aria-label={mode === 'peter' ? 'Suit Up as Spider-Man' : 'Take off the mask'}
    >
      <img
        src={logo}
        alt="Toggle mode"
        className="mode-toggle-logo"
      />
      <div className="mode-toggle-pulse" />
    </button>
  );
};

export default ModeToggle;
