import React from 'react';
import useJobSearch from '../../hooks/useJobSearch';

/** Day jobs: pick a line of work, the AI drafts NYC listings Peter could apply for */
const JobBoard: React.FC = () => {
  const { jobs, isLoading, error, activeCategory, searchJobs, categories } = useJobSearch();

  return (
    <section className="np-section" id="jobs" aria-labelledby="jobs-head">
      <div className="np-grid">
        <h2 className="wire-head" id="jobs-head" data-reveal>
          Day jobs for Peter Parker.
        </h2>

        <div className="np-side" data-reveal>
          <p>
            Rent is due and the Bugle pays per photo. Pick a line of work and the AI drafts New York listings that suit a
            kid with spider-sense. Each one opens a real search on Indeed.
          </p>
          <div className="chip-row">
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                className="chip"
                onClick={() => searchJobs(category)}
                disabled={isLoading}
                aria-pressed={activeCategory === category}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="jobs-results">
          {isLoading && (
            <p className="story-dek">
              Drafting listings for {activeCategory}
              <span className="caret" aria-hidden="true" />
            </p>
          )}
          {error && !isLoading && <p className="notice notice--error">{error}</p>}
          {!isLoading && !error && jobs.length === 0 && (
            <p className="story-dek np-soft">Choose a line of work to see what's hiring.</p>
          )}
          {!isLoading && jobs.length > 0 && (
            <ul className="wire-table" style={{ gridColumn: 'auto' }}>
              {jobs.map((job, i) => (
                <li
                  key={`${job.title}-${i}`}
                  className="wire-row"
                  style={{ gridTemplateColumns: '1fr auto', '--i': i } as React.CSSProperties}
                  data-reveal
                >
                  <div>
                    <a className="wire-title" href={job.url} target="_blank" rel="noopener noreferrer">
                      <strong>{job.title}</strong>
                    </a>
                    <div className="np-soft">
                      {job.company}, {job.location}
                    </div>
                    <div style={{ marginTop: 4 }}>{job.description}</div>
                  </div>
                  {job.salary && <span className="wire-time">{job.salary}</span>}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
};

export default JobBoard;
