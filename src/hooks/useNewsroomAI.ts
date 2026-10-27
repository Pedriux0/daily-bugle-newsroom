import { useState, useCallback } from 'react';
import { ArticleData, ThreatData } from '../types/news';
import { parseArticleResponse, parseThreatResponse } from '../utils/parseArticle';

type Mode = 'peter' | 'spiderman';

// The local model can be slow on the first request while it loads into memory
const REQUEST_TIMEOUT_MS = 150000;

const useNewsroomAI = () => {
  const [articleData, setArticleData] = useState<ArticleData | null>(null);
  const [threatData, setThreatData] = useState<ThreatData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNews = useCallback(async (query: string, mode: Mode) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/newsroom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, mode }),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}));
        throw new Error(errBody?.error || `Server responded with status ${response.status}`);
      }

      const { text } = (await response.json()) as { text?: string };
      if (!text) {
        throw new Error('Empty response from the newsroom');
      }

      if (mode === 'peter') {
        setArticleData(parseArticleResponse(text));
        setThreatData(null);
      } else {
        setThreatData(parseThreatResponse(text));
        setArticleData(null);
      }
    } catch (err) {
      const message =
        err instanceof DOMException && err.name === 'TimeoutError'
          ? 'The newsroom took too long to respond. Try again.'
          : err instanceof Error
            ? err.message
            : 'An unexpected error occurred';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { articleData, threatData, isLoading, error, fetchNews };
};

export default useNewsroomAI;
