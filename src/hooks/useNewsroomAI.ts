import { useState, useCallback, useRef } from 'react';
import { ArticleData, ThreatData } from '../types/news';
import { parseArticleResponse, parseThreatResponse } from '../utils/parseArticle';

type Mode = 'peter' | 'spiderman';
export type Engine = 'local-ai' | 'template' | 'cache';

interface StreamEvent {
  type: 'token' | 'done';
  text: string;
  engine?: Engine;
}

// A CPU-only server can take a while; the stream keeps the wait visible
const REQUEST_TIMEOUT_MS = 240000;

const useNewsroomAI = () => {
  const [articleData, setArticleData] = useState<ArticleData | null>(null);
  const [threatData, setThreatData] = useState<ThreatData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** Raw JSON text streamed so far — read fields with readPartialField */
  const [draft, setDraft] = useState('');
  const [engine, setEngine] = useState<Engine | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const fetchNews = useCallback(async (query: string, mode: Mode) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    setIsLoading(true);
    setError(null);
    setDraft('');

    try {
      const response = await fetch('/api/newsroom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, mode }),
        signal: controller.signal,
      });

      if (!response.ok || !response.body) {
        const errBody = await response.json().catch(() => ({}));
        throw new Error(errBody?.error || `Server responded with status ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let streamed = '';
      let final: StreamEvent | null = null;

      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';
        for (const line of lines) {
          if (!line.trim()) continue;
          const event = JSON.parse(line) as StreamEvent;
          if (event.type === 'token') {
            streamed += event.text;
            setDraft(streamed);
          } else {
            final = event;
          }
        }
      }

      if (!final?.text) {
        throw new Error('The newsroom hung up before finishing the story');
      }

      setEngine(final.engine ?? null);
      if (mode === 'peter') {
        setArticleData(parseArticleResponse(final.text));
        setThreatData(null);
      } else {
        setThreatData(parseThreatResponse(final.text));
        setArticleData(null);
      }
    } catch (err) {
      if (controller !== abortRef.current) return; // superseded by a newer search
      const message =
        err instanceof DOMException && err.name === 'AbortError'
          ? 'The newsroom took too long to respond. Try again.'
          : err instanceof Error
            ? err.message
            : 'An unexpected error occurred';
      setError(message);
    } finally {
      clearTimeout(timeout);
      if (controller === abortRef.current) {
        setIsLoading(false);
        setDraft('');
      }
    }
  }, []);

  return { articleData, threatData, isLoading, error, draft, engine, fetchNews };
};

export default useNewsroomAI;
