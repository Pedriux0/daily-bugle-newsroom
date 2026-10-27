import React from 'react';
import { NYC311Report } from '../../hooks/useNYC311';
import { timeAgo } from '../../utils/time';

interface CommunitySectionProps {
  reports: NYC311Report[];
  isLoading: boolean;
  error: string | null;
  onRefresh: () => void;
}

function titleCase(text: string): string {
  return text.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

/** A whole page of suit red: the city's live 311 calls */
const CommunitySection: React.FC<CommunitySectionProps> = ({ reports, isLoading, error, onRefresh }) => (
  <section className="field-page" id="reports" aria-labelledby="reports-head">
    <div className="np-grid">
      <h2 id="reports-head" data-reveal>
        311, right now.
      </h2>
      <div className="field-intro" data-reveal style={{ '--i': 1 } as React.CSSProperties}>
        <p>
          The latest calls to New York's 311 line, straight from NYC Open Data. Not every call needs a hero. Some do.
        </p>
        <button
          type="button"
          className="np-button"
          style={{ background: 'var(--dark)', color: 'var(--dark-ink)', marginTop: 24 }}
          onClick={onRefresh}
          disabled={isLoading}
        >
          {isLoading ? 'Listening…' : 'Refresh the calls'}
        </button>
      </div>

      <ul className="field-rows">
        {reports.length === 0 && isLoading && <li className="field-row">Tuning in to the 311 line…</li>}
        {reports.length === 0 && error && !isLoading && (
          <li className="field-row">The 311 feed is quiet right now: {error}</li>
        )}
        {reports.map((report, i) => (
          <li
            className="field-row"
            key={report.unique_key}
            data-reveal
            style={{ '--i': i, background: 'color-mix(in srgb, var(--dark) 14%, transparent)', paddingInline: 20 } as React.CSSProperties}
          >
            <strong>{titleCase(report.complaint_type)}</strong>
            <span className="when">{timeAgo(report.created_date)}</span>
            <span className="where">
              {[report.descriptor, report.incident_address && titleCase(report.incident_address), titleCase(report.borough)]
                .filter(Boolean)
                .join(' · ')}
              {report.status ? `. ${report.status}.` : ''}
            </span>
          </li>
        ))}
      </ul>
    </div>
  </section>
);

export default CommunitySection;
