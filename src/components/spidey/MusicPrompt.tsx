import React from 'react';

interface MusicPromptProps {
  onChoose: (play: boolean) => void;
}

/** Asks before playing the theme song when entering Spider-Man mode */
const MusicPrompt: React.FC<MusicPromptProps> = ({ onChoose }) => {
  return (
    <div role="dialog" aria-label="Play theme music?" className="music-prompt">
      <p>Play the Spider-Man theme while you patrol?</p>
      <div className="music-prompt-actions">
        <button type="button" className="np-button" onClick={() => onChoose(true)} autoFocus>
          Play music
        </button>
        <button type="button" className="np-button np-button--ghost" onClick={() => onChoose(false)}>
          No thanks
        </button>
      </div>
      <p className="np-small">You can change this any time from the top bar.</p>
    </div>
  );
};

export default MusicPrompt;
