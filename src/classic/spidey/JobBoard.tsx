import React from 'react';
import { Briefcase, MapPin, DollarSign, ExternalLink, Loader2, AlertTriangle } from 'lucide-react';
import useJobSearch, { JobListing } from '../../hooks/useJobSearch';

const JobBoard: React.FC = () => {
  const { jobs, isLoading, error, activeCategory, searchJobs, categories } = useJobSearch();

  return (
    <div className="mt-6">
      <h2 className="text-2xl font-black mb-4 text-white tracking-wider">
        <span className="text-red-600">&gt;&gt;</span> RECRUITMENT TERMINAL
      </h2>

      <div className="bg-black/80 border-2 border-red-600/50 rounded-lg p-4 backdrop-blur">
        {/* Category chips */}
        <div className="flex flex-wrap gap-2 mb-4">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => searchJobs(cat)}
              disabled={isLoading}
              className={`px-3 py-1.5 rounded-full text-xs font-mono font-bold uppercase tracking-wider border transition-all cursor-pointer ${
                activeCategory === cat
                  ? 'bg-red-600 border-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.4)]'
                  : 'bg-black/60 border-red-600/30 text-gray-400 hover:border-red-500 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="flex items-center justify-center py-12 gap-3">
            <Loader2 className="w-6 h-6 text-red-500 animate-spin" />
            <span className="text-red-400 font-mono text-sm">
              SCANNING INDEED DATABASE...
            </span>
          </div>
        )}

        {/* Error state */}
        {error && !isLoading && (
          <div className="flex items-center gap-2 py-6 justify-center">
            <AlertTriangle className="w-5 h-5 text-yellow-500" />
            <span className="text-yellow-400 font-mono text-sm">{error}</span>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !error && jobs.length === 0 && (
          <div className="text-center py-8">
            <Briefcase className="w-10 h-10 text-red-600/40 mx-auto mb-3" />
            <p className="text-gray-500 font-mono text-sm">
              SELECT A CATEGORY TO SCAN FOR MISSIONS
            </p>
          </div>
        )}

        {/* Job listings */}
        {!isLoading && jobs.length > 0 && (
          <div className="grid md:grid-cols-2 gap-3">
            {jobs.map((job, i) => (
              <JobCard key={`${job.title}-${i}`} job={job} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const JobCard: React.FC<{ job: JobListing }> = ({ job }) => (
  <a
    href={job.url}
    target="_blank"
    rel="noopener noreferrer"
    className="block bg-black/60 border border-red-600/30 rounded-lg p-4 hover:border-red-500 hover:shadow-[0_0_20px_rgba(239,68,68,0.2)] transition-all group"
  >
    <div className="flex items-start justify-between gap-2 mb-2">
      <h3 className="font-bold text-white text-sm leading-tight group-hover:text-red-400 transition-colors">
        {job.title}
      </h3>
      <ExternalLink className="w-4 h-4 text-red-600/40 group-hover:text-red-400 flex-shrink-0 mt-0.5" />
    </div>
    <p className="text-red-400 font-mono text-xs font-bold mb-1">{job.company}</p>
    <div className="flex items-center gap-3 text-xs text-gray-500 mb-2">
      <span className="flex items-center gap-1">
        <MapPin className="w-3 h-3" />
        {job.location}
      </span>
      {job.salary && (
        <span className="flex items-center gap-1">
          <DollarSign className="w-3 h-3" />
          {job.salary}
        </span>
      )}
    </div>
    <p className="text-gray-400 text-xs line-clamp-2">{job.description}</p>
  </a>
);

export default JobBoard;
