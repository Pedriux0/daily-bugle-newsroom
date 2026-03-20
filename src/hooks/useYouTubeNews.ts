import { useState, useEffect, useCallback } from 'react';

export interface VideoItem {
  videoId: string;
  title: string;
  description: string;
  thumbnail: string;
  channelTitle: string;
  publishedAt: string;
}

const useYouTubeNews = (query: string = 'NYC crime news today') => {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeVideo, setActiveVideo] = useState<string | null>(null);

  const fetchVideos = useCallback(async (q: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        q,
        maxResults: '4',
      });
      const response = await fetch(`/api/youtube/search?${params}`);

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to fetch videos');
      }

      const data = await response.json();
      setVideos(data.videos || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load videos';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVideos(query);
  }, [query, fetchVideos]);

  return { videos, isLoading, error, activeVideo, setActiveVideo };
};

export default useYouTubeNews;
