import React, { forwardRef } from 'react';
import { NewsApiArticle, ThreatData } from '../../types/news';
import { Engine } from '../../hooks/useNewsroomAI';
import { readPartialField } from '../../utils/parseArticle';
import { timeAgo } from '../../utils/time';
import NewsPhoto from '../shared/NewsPhoto';

interface ThreatScannerProps {
  query: string;
  onQueryChange: (query: string) => void;
  onSearch: (query: string) => void;
  onScanStory: (title: string) => void;
  sourceArticle: NewsApiArticle | null;
  threatData: ThreatData | null;
  isLoading: boolean;
  error: string | null;
  draft: string;
  engine: Engine | null;
  topHeadline: NewsApiArticle | null;
  headlinesLoading: boolean;
  onRetryHeadlines: () => void;
}

const SUGGESTIONS = ['Cybercrime in NYC', 'Bank robbery', 'Subway safety', 'Weapons trafficking'];

const LEVEL_WORDS: Record<ThreatData['threat_level'], string> = {
  Green: 'Low risk. Keep patrolling.',
  Yellow: 'Moderate. Monitor the sector.',
  Red: 'Critical. Act now.',
};

function splitParagraphs(text: string): string[] {
  const parts = text.split(/\n+|\\n/).map((p) => p.trim()).filter(Boolean);
  return parts.length > 0 ? parts : [text];
}

/** The live thing: scan a topic; the threat level fills the side tile as a field of colour */
const ThreatScanner = forwardRef<HTMLInputElement, ThreatScannerProps>(
  (
    { query, onQueryChange, onSearch, onScanStory, sourceArticle, threatData, isLoading, error, draft, engine, topHeadline, headlinesLoading, onRetryHeadlines },
    inputRef
  ) => {
    const submit = (e: React.FormEvent) => {
      e.preventDefault();
      if (query.trim()) onSearch(query.trim());
    };

    const choose = (topic: string) => {
      onQueryChange(topic);
      onSearch(topic);
    };

    const live = isLoading
      ? {
          level: readPartialField(draft, 'threat_level'),
          summary: readPartialField(draft, 'summary'),
          analysis: readPartialField(draft, 'analysis'),
        }
      : null;

    const liveLevel = ['Green', 'Yellow', 'Red'].includes(live?.level ?? '')
      ? (live?.level as ThreatData['threat_level'])
      : null;
    const level = live ? liveLevel : threatData?.threat_level ?? null;

    return (
      <section className="np-section" id="scan" aria-labelledby="scan-head">
        <div className="np-grid desk">
          <div className="np-side desk-figure" data-reveal>
            <div
              className={`threat-field threat-field--${level ?? 'idle'}${isLoading ? ' is-scanning' : ''}`}
              aria-live="polite"
            >
              <span>{level ? 'Threat level' : isLoading ? 'Scanning…' : 'No scan yet'}</span>
              <strong className="threat-word" key={level ?? (isLoading ? 'wait' : 'ready')}>
                {level ?? (isLoading ? 'Wait' : 'Ready')}
              </strong>
              <span>
                {level
                  ? LEVEL_WORDS[level]
                  : isLoading
                    ? 'Spider-sense tingling. Reading the wire…'
                    : 'Pick a topic and the spider-sense reads the real wire on it.'}
              </span>
            </div>
          </div>

          <div className="np-axis">
            <h2 className="desk-head" id="scan-head" data-reveal>
              Scan for threats.
            </h2>
            <p className="np-measure" data-reveal style={{ '--i': 1 } as React.CSSProperties}>
              The tactical AI reads today's real news on any topic and rates it green, yellow or red, with what to do next.
            </p>

            <form className="desk-form" onSubmit={submit} data-reveal style={{ '--i': 2 } as React.CSSProperties}>
              <label htmlFor="scan-topic" className="visually-hidden">
                Topic to scan
              </label>
              <input
                id="scan-topic"
                ref={inputRef}
                className="desk-input"
                value={query}
                onChange={(e) => onQueryChange(e.target.value)}
                placeholder="Crimes, villains, events…"
                disabled={isLoading}
                autoComplete="off"
              />
              <button type="submit" className="np-button" disabled={isLoading || !query.trim()}>
                {isLoading ? 'Scanning…' : 'Scan'}
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

            {sourceArticle && (isLoading || threatData) && (
              <NewsPhoto article={sourceArticle} className="lead-photo" eager />
            )}

            {live && (
              <article className="story" aria-busy="true">
                <p className="story-headline">
                  {live.summary || 'Spider-sense tingling'}
                  {!live.analysis && <span className="caret" aria-hidden="true" />}
                </p>
                {live.analysis && (
                  <div className="story-body">
                    {splitParagraphs(live.analysis).map((p, i, all) => (
                      <p key={i}>
                        {p}
                        {i === all.length - 1 && <span className="caret" aria-hidden="true" />}
                      </p>
                    ))}
                  </div>
                )}
              </article>
            )}

            {threatData && !isLoading && (
              <article className="story">
                <p className="story-headline">{threatData.summary}</p>
                <div className="story-body">
                  {splitParagraphs(threatData.analysis).map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                </div>
                {threatData.recommended_actions.length > 0 && (
                  <>
                    <h3 style={{ fontSize: 'var(--step-lead)', marginTop: 32 }}>Recommended actions</h3>
                    <ol className="actions-list">
                      {threatData.recommended_actions.map((action, i) => (
                        <li key={i}>{action}</li>
                      ))}
                    </ol>
                  </>
                )}
                {engine === 'template' && (
                  <p className="notice">Quick scan: threat level read from keywords in today's real headlines.</p>
                )}
              </article>
            )}

            {!threatData && !isLoading && (
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
                      Top of the crime wire: {topHeadline.source.name}, {timeAgo(topHeadline.publishedAt)}
                    </p>
                    <p style={{ marginTop: 28 }}>
                      <button type="button" className="np-button" onClick={() => onScanStory(topHeadline.title)}>
                        Scan this story
                      </button>
                    </p>
                  </>
                ) : headlinesLoading ? (
                  <p className="story-dek">
                    Connecting to the crime wire<span className="caret" aria-hidden="true" />
                  </p>
                ) : (
                  <>
                    <p className="story-dek">The crime wire is offline. Signal lost.</p>
                    <button type="button" className="np-button" onClick={onRetryHeadlines}>
                      Reconnect
                    </button>
                  </>
                )}
              </article>
            )}
          </div>
        </div>
      </section>
    );
  }
);

ThreatScanner.displayName = 'ThreatScanner';

export default ThreatScanner;
