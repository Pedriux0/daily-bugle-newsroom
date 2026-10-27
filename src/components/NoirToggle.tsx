import React from 'react';
import noirPhoto from '../assets/photos/spider-man-noir-cosplay.jpg';

interface NoirToggleProps {
  classic: boolean;
  onToggle: () => void;
  isTransitioning: boolean;
}

/** Floating switch between today's design and the original site, worn by Spider-Man Noir */
const NoirToggle: React.FC<NoirToggleProps> = ({ classic, onToggle, isTransitioning }) => {
  const label = classic ? 'Back to the new Bugle' : 'Go back to the good old days';

  return (
    <button type="button" className="noir-toggle" onClick={onToggle} disabled={isTransitioning} aria-label={label}>
      <span className="noir-toggle-label" aria-hidden="true">
        {label}
      </span>
      {/* NYCC 2023 cosplay of Spider-Man Noir by LostplanetKD73, CC0, via Wikimedia Commons */}
      <img className="noir-toggle-badge" src={noirPhoto} alt="" width={240} height={240} />
    </button>
  );
};

export default NoirToggle;
