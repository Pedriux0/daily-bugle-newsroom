import React from 'react';
import BoardBar, { BarLink } from '../shared/BoardBar';
import { editionDate } from '../../utils/time';
import flatiron from '../../assets/photos/flatiron-building-nyc-c1903.jpg';
import newsroom from '../../assets/photos/the-new-york-times-newsroom-1942.jpg';

interface BugleFrontProps {
  links: BarLink[];
  isPlaying: boolean;
  onToggleMusic: () => void;
  cursorEnabled: boolean;
  onToggleCursor: () => void;
  onCallJameson: () => void;
}

/** First screen: the two-by-two board — name, two archive photographs, two statements */
const BugleFront: React.FC<BugleFrontProps> = ({
  links,
  isPlaying,
  onToggleMusic,
  cursorEnabled,
  onToggleCursor,
  onCallJameson,
}) => (
  <>
    <BoardBar
      mark="DB"
      markLabel="The Daily Bugle, front page"
      links={links}
      isPlaying={isPlaying}
      onToggleMusic={onToggleMusic}
      cursorEnabled={cursorEnabled}
      onToggleCursor={onToggleCursor}
      action={{ label: 'Call Jameson', onClick: onCallJameson }}
    />
    <header className="board" id="top">
      <div className="tile board-name">
        <h1>
          <span className="visually-hidden">The Daily </span>Bugle
        </h1>
      </div>

      <div className="tile board-photo board-photo--first shutter">
        <img
          className="np-photo"
          src={flatiron}
          alt="The Flatiron Building on a wet Manhattan morning, around 1903"
          width={1830}
          height={2382}
        />
      </div>

      <div className="tile board-photo board-photo--second">
        <img
          className="np-photo"
          src={newsroom}
          alt="Reporters writing at their desks in a New York newsroom, 1942"
          width={1920}
          height={1455}
        />
      </div>

      <div className="board-pair">
        <p className="tile tile--dark board-statement">
          New York's loudest newspaper. Real headlines, rewritten by J. Jonah Jameson.
        </p>
        <p className="tile tile--field board-statement">{editionDate()}. Spider-Man is still at large.</p>
      </div>
    </header>
  </>
);

export default BugleFront;
