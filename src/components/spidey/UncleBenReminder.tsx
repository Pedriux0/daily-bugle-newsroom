import React from 'react';
import useCandles from '../../hooks/useCandles';
import uncleBen from '../../assets/uncleben.jpeg';

function candleLine(count: number): string {
  if (count === 0) return 'Be the first to light a candle for Ben.';
  return count === 1 ? '1 person has lit a candle for Ben.' : `${count.toLocaleString('en-US')} people have lit a candle for Ben.`;
}

/** A quiet memorial set like a framed portrait, with a candle every visitor adds to */
const UncleBenReminder: React.FC = () => {
  const { count, lit, justLit, light } = useCandles();

  return (
    <section className="memorial" id="why" aria-labelledby="memorial-head">
      <div className="memorial-frame" data-reveal>
        <div className="memorial-mat">
          <figure className="memorial-photo">
            <img src={uncleBen} alt="Ben Parker, saying: with great power comes great responsibility" loading="lazy" />
          </figure>

          <h2 id="memorial-head">
            <span>In loving memory of</span>
            Ben Parker
          </h2>

          <blockquote className="memorial-quote">“With great power comes great responsibility.”</blockquote>

          <p className="memorial-copy">
            He said it in a kitchen in Forest Hills, to a nephew who wasn't listening yet. Every swing across this city is
            still an answer to him.
          </p>

          <div className="memorial-vigil">
            <span className={`candle${lit ? ' candle--lit' : ''}`} aria-hidden="true">
              <span className="candle-flame" />
              {justLit && <span className="candle-plus">+1</span>}
            </span>

            <div className="memorial-vigil-text" aria-live="polite">
              {count !== null && <p className="memorial-count">{candleLine(count)}</p>}
              {lit ? (
                <p>Your candle is lit. Thank you for remembering him.</p>
              ) : (
                <button type="button" className="memorial-button" onClick={light}>
                  Light a candle for Ben
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default UncleBenReminder;
