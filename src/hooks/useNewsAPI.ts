import { useState, useEffect, useCallback } from 'react';
import { NewsApiArticle } from '../types/news';

interface NewsAPIResponse {
  status: string;
  totalResults: number;
  articles: NewsApiArticle[];
}

function filterValid(articles: NewsApiArticle[]): NewsApiArticle[] {
  return articles.filter(
    (a) => a.title && a.title !== '[Removed]' && a.description
  );
}

const useNewsAPI = () => {
  const [bugleHeadlines, setBugleHeadlines] = useState<NewsApiArticle[]>([]);
  const [spideyHeadlines, setSpideyHeadlines] = useState<NewsApiArticle[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** Fetch both feeds on mount */
  const fetchAllNews = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch general headlines for Bugle mode
      const bugleParams = new URLSearchParams({
        country: 'us',
        pageSize: '10',
        category: 'general',
      });

      // Fetch crime/security news for Spider-Man mode
      const spideyParams = new URLSearchParams({
        q: 'crime OR robbery OR arrest OR shooting OR cybercrime OR security threat OR police OR emergency',
        pageSize: '10',
        sortBy: 'publishedAt',
        language: 'en',
      });

      const [bugleRes, spideyRes] = await Promise.all([
        fetch(`/api/news/top-headlines?${bugleParams}`),
        fetch(`/api/news/search?${spideyParams}`),
      ]);

      if (bugleRes.ok) {
        const bugleData: NewsAPIResponse = await bugleRes.json();
        if (bugleData.status === 'ok') {
          setBugleHeadlines(filterValid(bugleData.articles));
        }
      }

      if (spideyRes.ok) {
        const spideyData: NewsAPIResponse = await spideyRes.json();
        if (spideyData.status === 'ok') {
          setSpideyHeadlines(filterValid(spideyData.articles));
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch news';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllNews();
  }, [fetchAllNews]);

  return { bugleHeadlines, spideyHeadlines, isLoading, error };
};

export default useNewsAPI;
