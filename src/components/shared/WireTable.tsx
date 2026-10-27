import React from 'react';
import NewsPhoto from './NewsPhoto';
import { NewsApiArticle } from '../../types/news';
import { timeAgo } from '../../utils/time';

interface WireTableProps {
  id: string;
  heading: string;
  articles: NewsApiArticle[];
  isLoading: boolean;
  onRetry: () => void;
  rewriteLabel: string;
  onRewrite: (title: string) => void;
}

/** The wire: one lead story with its photo across the page, then the rest as photo rows */
const WireTable: React.FC<WireTableProps> = ({ id, heading, articles, isLoading, onRetry, rewriteLabel, onRewrite }) => {
  const [lead, ...rest] = articles;
  const rows = rest.slice(0, 8);

  return (
    <section className="np-section" id={id} aria-labelledby={`${id}-head`}>
      <div className="np-grid">
        <h2 className="wire-head" id={`${id}-head`} data-reveal>
          {heading}
        </h2>
      </div>

      {lead ? (
        <>
          <article className="np-grid wire-lead" data-reveal>
            <NewsPhoto article={lead} className="wire-lead-photo" />
            <div className="wire-lead-text">
              <p className="story-headline">
                <a className="wire-title" href={lead.url} target="_blank" rel="noopener noreferrer">
                  {lead.title}
                </a>
              </p>
              <p className="np-small np-soft" style={{ marginTop: -8 }}>
                {lead.source.name}, {timeAgo(lead.publishedAt)}
              </p>
              {lead.description && <p className="np-measure">{lead.description}</p>}
              <p>
                <button type="button" className="np-button np-button--field" onClick={() => onRewrite(lead.title)}>
                  {rewriteLabel}
                </button>
              </p>
            </div>
          </article>

          <ol className="wire-list">
            {rows.map((article, i) => (
              <li className="wire-item" key={article.url} data-reveal style={{ '--i': i % 2 } as React.CSSProperties}>
                <NewsPhoto article={article} className="wire-item-photo" />
                <div className="wire-item-text">
                  <p className="np-small np-soft">
                    {article.source.name}, {timeAgo(article.publishedAt)}
                  </p>
                  <a className="wire-title wire-item-title" href={article.url} target="_blank" rel="noopener noreferrer">
                    {article.title}
                  </a>
                  <button type="button" className="np-link np-small" onClick={() => onRewrite(article.title)}>
                    {rewriteLabel}
                  </button>
                </div>
              </li>
            ))}
          </ol>
        </>
      ) : (
        <div className="np-grid">
          <div className="np-axis">
            {isLoading ? (
              <p className="story-dek">Pulling today's headlines off the wire…</p>
            ) : (
              <>
                <p className="story-dek">The wire is quiet. The headlines didn't come through.</p>
                <button type="button" className="np-button" onClick={onRetry}>
                  Try the wire again
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </section>
  );
};

export default WireTable;
