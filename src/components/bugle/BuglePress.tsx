import React from 'react';
import { ArticleData, NewsApiArticle } from '../../types/news';
import { Engine } from '../../hooks/useNewsroomAI';
import { readPartialField } from '../../utils/parseArticle';
import { timeAgo } from '../../utils/time';
import NewsPhoto from '../shared/NewsPhoto';
import pressClip from '../../assets/photos/the-910-ton-printing-presses-at-the.webm';
import pressPoster from '../../assets/photos/the-910-ton-printing-presses-at-the-poster.jpg';

interface BuglePressProps {
  query: string;
  onQueryChange: (query: string) => void;
  onSearch: (query: string) => void;
  onRewrite: (title: string) => void;
  sourceArticle: NewsApiArticle | null;
  articleData: ArticleData | null;
  isLoading: boolean;
  error: string | null;
  draft: string;
  engine: Engine | null;
  topHeadline: NewsApiArticle | null;
  headlinesLoading: boolean;
  onRetryHeadlines: () => void;
}

const SUGGESTIONS = [
  'Latest Spider-Man sighting',
  'NYC subway delays',
  'Oscorp stock',
  "Mayor's press conference",
];

/** Split body into paragraphs — handles \n\n, literal \\n\\n, or one long block */
function splitBody(body: string): string[] {
  const parts = body.split(/\n+|\\n/).map((p) => p.trim()).filter(Boolean);
  return parts.length > 0 ? parts : [body];
}

/** The live thing: type a topic and Jameson sets the story on the press, word by word */
const BuglePress: React.FC<BuglePressProps> = ({
  query,
  onQueryChange,
  onSearch,
  onRewrite,
  sourceArticle,
  articleData,
  isLoading,
  error,
  draft,
  engine,
  topHeadline,
  headlinesLoading,
  onRetryHeadlines,
}) => {
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) onSearch(query.trim());
  };

  const choose = (topic: string) => {
    onQueryChange(topic);
    onSearch(topic);
  };

  // While the press runs, show what has been typed so far
  const live = isLoading
    ? {
        headline: readPartialField(draft, 'headline'),
        subheadline: readPartialField(draft, 'subheadline'),
        body: readPartialField(draft, 'body'),
        take: readPartialField(draft, 'jamesons_take'),
      }
    : null;

  return (
    <section className="np-section" id="press" aria-labelledby="press-head">
      <div className="np-grid desk">
        <figure className="np-side desk-figure" style={{ margin: 0 }} data-reveal>
          <video
            src={pressClip}
            poster={pressPoster}
            autoPlay
            muted
            loop
            playsInline
            aria-label="Newspaper running through a printing press at full speed"
          />
          <figcaption className="np-small np-soft">The presses, running. Every story below comes off them.</figcaption>
          {(articleData?.jamesons_take || live?.take) && (
            <aside className="story-take">
              <h3>Jameson's take</h3>
              <p>{live ? live.take : articleData?.jamesons_take}</p>
            </aside>
          )}
        </figure>

        <div className="np-axis">
          <h2 className="desk-head" id="press-head" data-reveal>
            Stop the presses.
          </h2>
          <p className="np-measure" data-reveal style={{ '--i': 1 } as React.CSSProperties}>
            Give Jameson a topic. He reads the real wire on it, then writes the front page his way, live, while you watch.
          </p>

          <form className="desk-form" onSubmit={submit} data-reveal style={{ '--i': 2 } as React.CSSProperties}>
            <label htmlFor="press-topic" className="visually-hidden">
              Topic for Jameson
            </label>
            <input
              id="press-topic"
              className="desk-input"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              placeholder="What's the story, Parker?"
              disabled={isLoading}
              autoComplete="off"
            />
            <button type="submit" className="np-button" disabled={isLoading || !query.trim()}>
              {isLoading ? 'Printing…' : 'Print it'}
            </button>
          </form>

          <div className="chip-row" aria-label="Suggested topics">
            {SUGGESTIONS.map((topic) => (
              <button key={topic} type="button" className="chip" onClick={() => choose(topic)} disabled={isLoading}>
                {topic}
              </button>
            ))}
          </div>

          {error && <p className="notice notice--error">{error}</p>}

          {/* The wire story being rewritten keeps its own photo and credit */}
          {sourceArticle && (isLoading || articleData) && (
            <NewsPhoto article={sourceArticle} className="lead-photo" eager />
          )}

          {/* Live: the story as it comes off the press */}
          {live && (
            <article className="story" aria-busy="true">
              <p className="story-headline">
                {live.headline || 'Jameson is reading the wire'}
                {!live.subheadline && <span className="caret" aria-hidden="true" />}
              </p>
              {live.subheadline && (
                <p className="story-dek">
                  {live.subheadline}
                  {!live.body && <span className="caret" aria-hidden="true" />}
                </p>
              )}
              {live.body && (
                <div className="story-body">
                  {splitBody(live.body).map((paragraph, i, all) => (
                    <p key={i}>
                      {paragraph}
                      {i === all.length - 1 && <span className="caret" aria-hidden="true" />}
                    </p>
                  ))}
                </div>
              )}
            </article>
          )}

          {/* Printed: Jameson's finished story */}
          {articleData && !isLoading && (
            <article className="story">
              <p className="story-headline">{articleData.headline}</p>
              {articleData.subheadline && <p className="story-dek">{articleData.subheadline}</p>}
              <div className="story-body">
                {splitBody(articleData.body).map((paragraph, i) => (
                  <p key={i}>{paragraph}</p>
                ))}
              </div>
              {engine === 'template' && (
                <p className="notice">
                  Set by the Bugle's night desk from today's real headlines.
                </p>
              )}
            </article>
          )}

          {/* Before any search: today's real lead story */}
          {!articleData && !isLoading && (
            <article className="story">
              {topHeadline ? (
                <>
                  <NewsPhoto article={topHeadline} className="lead-photo" eager />
                  <p className="story-headline">
                    <a href={topHeadline.url} target="_blank" rel="noopener noreferrer" className="wire-title">
                      {topHeadline.title}
                    </a>
                  </p>
                  <p className="story-meta">
                    Today's lead from the wire: {topHeadline.source.name}, {timeAgo(topHeadline.publishedAt)}
                  </p>
                  {topHeadline.description && (
                    <p className="np-measure" style={{ marginTop: 20 }}>
                      {topHeadline.description}
                    </p>
                  )}
                  <p style={{ marginTop: 28 }}>
                    <button type="button" className="np-button np-button--field" onClick={() => onRewrite(topHeadline.title)}>
                      Have Jameson rewrite it
                    </button>
                  </p>
                </>
              ) : headlinesLoading ? (
                <p className="story-dek">
                  Pulling today's lead off the wire<span className="caret" aria-hidden="true" />
                </p>
              ) : (
                <>
                  <p className="story-dek">The presses are jammed. Today's headlines didn't come through.</p>
                  <button type="button" className="np-button" onClick={onRetryHeadlines}>
                    Run the presses again
                  </button>
                </>
              )}
            </article>
          )}
        </div>
      </div>
    </section>
  );
};

export default BuglePress;
