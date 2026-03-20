import { useState, useCallback } from 'react';
import { ArticleData, ThreatData } from '../types/news';
import { JAMESON_PROMPT } from '../prompts/jameson';
import { THREAT_ANALYST_PROMPT } from '../prompts/threatAnalyst';
import { parseArticleResponse, parseThreatResponse } from '../utils/parseArticle';

type Mode = 'peter' | 'spiderman';

interface ContentBlock {
  type: string;
  text?: string;
}

const useClaudeAPI = () => {
  const [articleData, setArticleData] = useState<ArticleData | null>(null);
  const [threatData, setThreatData] = useState<ThreatData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNews = useCallback(async (query: string, mode: Mode) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 768,
          system: mode === 'peter' ? JAMESON_PROMPT : THREAT_ANALYST_PROMPT,
          tools: [{
            type: 'web_search_20250305',
            name: 'web_search',
            max_uses: 1,
          }],
          messages: [{ role: 'user', content: query }],
        }),
      });

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}));
        throw new Error(
          errBody?.error?.message || `API responded with status ${response.status}`
        );
      }

      const data = await response.json();

      // Extract all text content blocks from the response
      const textContent = (data.content as ContentBlock[])
        ?.filter((block) => block.type === 'text')
        ?.map((block) => block.text || '')
        ?.join('') || '';

      if (!textContent) {
        throw new Error('No text content in API response');
      }

      if (mode === 'peter') {
        setArticleData(parseArticleResponse(textContent));
        setThreatData(null);
      } else {
        setThreatData(parseThreatResponse(textContent));
        setArticleData(null);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { articleData, threatData, isLoading, error, fetchNews };
};

export default useClaudeAPI;
