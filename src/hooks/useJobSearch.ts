import { useState, useCallback } from 'react';

export interface JobListing {
  title: string;
  company: string;
  location: string;
  description: string;
  url: string;
  salary?: string;
}

const JOB_SYSTEM_PROMPT = `You are Spider-Man's job search assistant. Generate realistic job listings that Spider-Man (Peter Parker) would be qualified for given his abilities: superhuman agility, web-slinging, spider-sense, engineering genius, photography skills, and crime-fighting experience.

When given a job category, generate 6 realistic job listings in NYC. Return a JSON array in this exact format:

[
  {
    "title": "Job Title",
    "company": "Company Name",
    "location": "City, State",
    "description": "Brief 1-2 sentence description of why Spider-Man would be great at this job",
    "url": "https://www.indeed.com/viewjob?jk=example",
    "salary": "$XX,XXX - $XX,XXX"
  }
]

Use real company names based in NYC. Return ONLY the JSON array, no markdown, no extra text.`;

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
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 768,
          system: JOB_SYSTEM_PROMPT,
          messages: [
            {
              role: 'user',
              content: `Generate "${category}" job listings in New York City.`,
            },
          ],
        }),
      });

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}));
        throw new Error(
          errBody?.error?.message || `API responded with status ${response.status}`
        );
      }

      const data = await response.json();

      // Extract text content blocks
      const textContent =
        (data.content as { type: string; text?: string }[])
          ?.filter((block) => block.type === 'text')
          ?.map((block) => block.text || '')
          ?.join('') || '';

      if (!textContent) {
        throw new Error('No text content in API response');
      }

      // Parse JSON array from response
      const jsonMatch = textContent.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]) as JobListing[];
        setJobs(parsed);
      } else {
        throw new Error('Could not parse job listings');
      }
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
