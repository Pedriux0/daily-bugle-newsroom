import { useState, useEffect, useCallback } from 'react';
import { NewsApiArticle } from '../types/news';

interface NewsAPIResponse {
  status: string;
  totalResults: number;
  articles: NewsApiArticle[];
}

type Feed = 'bugle' | 'spidey';

const REQUEST_TIMEOUT_MS = 15000;
const CACHE_KEY = 'bugle-headlines-v2';
const CACHE_MAX_AGE_MS = 24 * 60 * 60 * 1000;

// Publisher feeds that carry each story's own photo (see server/lib/routes.js)
const FEED_URLS: Record<Feed, string> = {
  bugle: '/api/news/feed/bugle',
  spidey: '/api/news/feed/spidey',
};

function filterValid(articles: NewsApiArticle[]): NewsApiArticle[] {
  return articles.filter((a) => a.title && a.title !== '[Removed]');
}

/** Last good headlines, so the page renders instantly while fresh ones load */
function readCache(feed: Feed): NewsApiArticle[] {
  try {
    const raw = localStorage.getItem(`${CACHE_KEY}:${feed}`);
    if (!raw) return [];
    const { savedAt, articles } = JSON.parse(raw);
    return Date.now() - savedAt < CACHE_MAX_AGE_MS && Array.isArray(articles) ? articles : [];
  } catch {
    return [];
  }
}

function writeCache(feed: Feed, articles: NewsApiArticle[]) {
  try {
    localStorage.setItem(`${CACHE_KEY}:${feed}`, JSON.stringify({ savedAt: Date.now(), articles }));
  } catch {
    // Storage full or blocked — caching is optional
  }
}

async function fetchFeed(feed: Feed): Promise<NewsApiArticle[]> {
  const res = await fetch(FEED_URLS[feed], { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
  if (!res.ok) throw new Error(`News feed responded with status ${res.status}`);
  const data: NewsAPIResponse = await res.json();
  if (data.status !== 'ok') throw new Error('News feed returned an error');
  return filterValid(data.articles);
}

const useNewsAPI = () => {
  const [bugleHeadlines, setBugleHeadlines] = useState<NewsApiArticle[]>(() => readCache('bugle'));
  const [spideyHeadlines, setSpideyHeadlines] = useState<NewsApiArticle[]>(() => readCache('spidey'));
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAllNews = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    // Each feed updates as soon as it arrives — a slow one doesn't block the other
    const load = (feed: Feed, setter: (articles: NewsApiArticle[]) => void) =>
      fetchFeed(feed).then((articles) => {
        if (articles.length > 0) {
          setter(articles);
          writeCache(feed, articles);
        }
      });

    const results = await Promise.allSettled([
      load('bugle', setBugleHeadlines),
      load('spidey', setSpideyHeadlines),
    ]);

    const failed = results.find((r): r is PromiseRejectedResult => r.status === 'rejected');
    if (failed) {
      setError(failed.reason instanceof Error ? failed.reason.message : 'Failed to fetch news');
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchAllNews();
  }, [fetchAllNews]);

  return { bugleHeadlines, spideyHeadlines, isLoading, error, retry: fetchAllNews };
};

export default useNewsAPI;
