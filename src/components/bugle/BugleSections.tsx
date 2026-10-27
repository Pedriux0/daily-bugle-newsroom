import React from 'react';
import pressEngraving from '../../assets/photos/western-daily-press-printing-press-1908.jpg';
import bullPen from '../../assets/photos/newsroom-of-the-new-york-times-newspaper.jpg';

/** Two giant words compared: the same hero, two papers */
export const BugleCompare: React.FC = () => (
  <section className="compare" id="two-papers" aria-labelledby="compare-head">
    <div className="np-grid compare-top">
      <h2 id="compare-head" data-reveal>
        Same city, two papers.
      </h2>
      <p data-reveal style={{ '--i': 1 } as React.CSSProperties}>
        Every story here starts as a real wire headline. Then it lands on Jameson's desk, where a local AI editor rewrites
        it his way. New York saw a hero. The Bugle printed a menace.
      </p>
    </div>
    <div className="np-grid">
      <p className="compare-specimen" data-reveal>
        <strong>Hero</strong>
      </p>
      <p className="compare-specimen" data-reveal style={{ '--i': 1 } as React.CSSProperties}>
        <strong>Menace</strong>
      </p>
    </div>
  </section>
);

/** Statement tiles: Jameson's standing editorial */
export const BugleEditorial: React.FC = () => (
  <section className="tiles" id="editorial" aria-labelledby="editorial-head">
    <div className="tiles-slogan">
      <h2 id="editorial-head" data-reveal>
        Threat or menace?
      </h2>
    </div>
    <div className="tiles-word" aria-hidden="true">
      Opinion
    </div>
    <div className="tile tiles-photo">
      <img
        className="np-photo drift"
        src={pressEngraving}
        alt="Engraving of a rotary newspaper press, 1908"
        width={1920}
        height={978}
        loading="lazy"
      />
    </div>
    <div className="tiles-text">
      <p className="tiles-byline" data-reveal>
        It's time to unmask the menace.
        <br />
        <span className="np-soft">By J. Jonah Jameson, Publisher</span>
      </p>
      <div className="tiles-copy" data-reveal style={{ '--i': 1 } as React.CSSProperties}>
        <p>
          For months I have warned this city about the so-called Spider-Man. What kind of hero hides his face? What kind
          of hero answers to no one? No hero at all.
        </p>
        <p>
          New York has police officers, brave men and women who are trained and accountable. We do not need a
          wall-crawling vigilante swinging through our streets, leaving property damage behind him in the name of
          justice. This newspaper will keep digging until the mask comes off.
        </p>
      </div>
    </div>
  </section>
);

interface BugleTipLineProps {
  onCallJameson: () => void;
}

/** Closing band: the tip line, which opens the live chat with Jameson */
export const BugleTipLine: React.FC<BugleTipLineProps> = ({ onCallJameson }) => (
  <section className="np-section" id="tip-line" aria-labelledby="tip-head">
    <div className="np-grid tipline">
      <p className="tipline-sentence" data-reveal>
        Seen the wall-crawler swinging past your window? Call the tip line and tell Jameson yourself.
      </p>
      <div className="tipline-photo" data-reveal style={{ '--i': 1 } as React.CSSProperties}>
        <img
          className="np-photo"
          src={bullPen}
          alt="The editors' bull pen of a New York newspaper, 1942"
          width={160}
          height={160}
          loading="lazy"
        />
      </div>
      <div className="tipline-ask" data-reveal style={{ '--i': 2 } as React.CSSProperties}>
        <h2 id="tip-head">Got a tip for Jameson?</h2>
        <button type="button" className="np-button" onClick={onCallJameson}>
          Call Jameson now
        </button>
        <a className="np-link" href="#editorial">
          Read today's editorial
        </a>
        <p className="np-small np-soft">New York, NY. He answers in seconds, at full volume.</p>
      </div>
    </div>
  </section>
);
