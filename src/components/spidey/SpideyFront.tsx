import React from 'react';
import BoardBar, { BarLink } from '../shared/BoardBar';
import { NYC311Report } from '../../hooks/useNYC311';
import { timeAgo } from '../../utils/time';
import logo from '../../assets/logo.png';
import maskArt from '../../assets/background.jpg';
import bridge from '../../assets/photos/brooklyn-bridge-at-night.jpg';

interface SpideyFrontProps {
  links: BarLink[];
  isPlaying: boolean;
  onToggleMusic: () => void;
  cursorEnabled: boolean;
  onToggleCursor: () => void;
  onScan: () => void;
  latestReport: NYC311Report | null;
}

/** The mask follows the pointer: sets --px/--py from -0.5 to 0.5 */
function followPointer(e: React.PointerEvent<HTMLDivElement>) {
  if (e.pointerType !== 'mouse') return;
  const box = e.currentTarget.getBoundingClientRect();
  e.currentTarget.style.setProperty('--px', String((e.clientX - box.left) / box.width - 0.5));
  e.currentTarget.style.setProperty('--py', String((e.clientY - box.top) / box.height - 0.5));
}

function resetPointer(e: React.PointerEvent<HTMLDivElement>) {
  e.currentTarget.style.setProperty('--px', '0');
  e.currentTarget.style.setProperty('--py', '0');
}

function titleCase(text: string): string {
  return text.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

/** First screen: the board seen through the mask, with the latest live 311 call */
const SpideyFront: React.FC<SpideyFrontProps> = ({
  links,
  isPlaying,
  onToggleMusic,
  cursorEnabled,
  onToggleCursor,
  onScan,
  latestReport,
}) => (
  <>
    <BoardBar
      mark={<img src={logo} alt="" width={40} height={40} />}
      markLabel="Spidey, top of the page"
      links={links}
      isPlaying={isPlaying}
      onToggleMusic={onToggleMusic}
      cursorEnabled={cursorEnabled}
      onToggleCursor={onToggleCursor}
      action={{ label: 'Scan a threat', onClick: onScan }}
    />
    <header className="board" id="top">
      <div className="tile board-name">
        <h1 className="spidey-name" aria-label="Spidey">
          {'Spidey'.split('').map((letter, i) => (
            <span key={i} aria-hidden="true" style={{ '--i': i } as React.CSSProperties}>
              {letter}
            </span>
          ))}
        </h1>
      </div>

      <div
        className="tile board-photo board-photo--first shutter mask-tile"
        onPointerMove={followPointer}
        onPointerLeave={resetPointer}
      >
        <img className="np-photo" src={maskArt} alt="Spider-Man's mask lenses on a red web" width={736} height={1308} />
      </div>

      <div className="tile board-photo board-photo--second">
        <img
          className="np-photo"
          src={bridge}
          alt="The Brooklyn Bridge and lower Manhattan lit up at night"
          width={1920}
          height={1280}
        />
      </div>

      <div className="board-pair">
        <p className="tile tile--dark board-statement">
          New York through the mask: live threat scans, crime news and 311 calls.
        </p>
        <p className="tile tile--field board-statement">
          {latestReport
            ? `Latest 311 call: ${titleCase(latestReport.complaint_type)} in ${titleCase(latestReport.borough)}, ${timeAgo(
                latestReport.created_date,
              ).toLowerCase()}.`
            : 'Forest Hills, Queens. Patrol starts now.'}
        </p>
      </div>
    </header>
  </>
);

export default SpideyFront;
