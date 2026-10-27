import { useState, useCallback } from 'react';

export interface JobListing {
  title: string;
  company: string;
  location: string;
  description: string;
  url: string;
  salary?: string;
}

const SPIDEY_JOB_CATEGORIES = [
  'cybersecurity analyst',
  'structural engineer',
  'emergency medical technician',
  'private investigator',
  'stunt performer',
  'rock climbing instructor',
  'pest control technician',
  'forensic scientist',
];

const useJobSearch = () => {
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const searchJobs = useCallback(async (category: string) => {
    setIsLoading(true);
    setError(null);
    setActiveCategory(category);

    try {
      const response = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category }),
        signal: AbortSignal.timeout(150000),
      });

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}));
        throw new Error(errBody?.error || `Server responded with status ${response.status}`);
      }

      const data = (await response.json()) as { jobs?: JobListing[] };
      if (!Array.isArray(data.jobs)) {
        throw new Error('Could not parse job listings');
      }
      setJobs(data.jobs);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to search jobs';
      setError(message);
      setJobs([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    jobs,
    isLoading,
    error,
    activeCategory,
    searchJobs,
    categories: SPIDEY_JOB_CATEGORIES,
  };
};

export default useJobSearch;
