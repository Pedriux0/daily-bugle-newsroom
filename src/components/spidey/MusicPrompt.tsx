import React from 'react';

interface MusicPromptProps {
  onChoose: (play: boolean) => void;
}

/** Asks before playing the theme song when entering Spider-Man mode */
const MusicPrompt: React.FC<MusicPromptProps> = ({ onChoose }) => {
  return (
    <div
      role="dialog"
      aria-label="Play theme music?"
      className="fixed bottom-28 left-1/2 -translate-x-1/2 z-[100] w-[calc(100%-2rem)] max-w-sm bg-black/90 border-2 border-red-600 rounded-lg shadow-[0_0_30px_rgba(239,68,68,0.4)] p-4 text-white font-mono"
    >
      <p className="text-sm mb-3 tracking-wide">
        <span className="text-red-500">♫</span> Play the Spider-Man theme while you patrol?
      </p>
      <div className="flex gap-2">
        <button
          onClick={() => onChoose(true)}
          className="flex-1 py-2 bg-red-600 text-white text-xs font-bold uppercase tracking-wider rounded hover:shadow-[0_0_15px_rgba(226,54,54,0.4)] transition cursor-pointer"
          autoFocus
        >
          Play music
        </button>
        <button
          onClick={() => onChoose(false)}
          className="flex-1 py-2 border border-red-600/60 text-gray-300 text-xs font-bold uppercase tracking-wider rounded hover:bg-red-600/20 transition cursor-pointer"
        >
          No thanks
        </button>
      </div>
      <p className="text-[10px] text-gray-500 mt-2">You can change this anytime with the ♫ button in the header.</p>
    </div>
  );
};

export default MusicPrompt;
