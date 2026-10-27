import { useState, useCallback, useRef } from 'react';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const REQUEST_TIMEOUT_MS = 180000;

/** Streams replies from Jameson on the Bugle tip line. */
const useJamesonChat = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const send = useCallback(
    async (text: string) => {
      const content = text.trim();
      if (!content || isStreaming) return;

      const history: ChatMessage[] = [...messages, { role: 'user', content }];
      setMessages([...history, { role: 'assistant', content: '' }]);
      setIsStreaming(true);
      setError(null);

      const controller = new AbortController();
      abortRef.current = controller;
      const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

      try {
        const response = await fetch('/api/jameson/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: history }),
          signal: controller.signal,
        });
        if (!response.ok || !response.body) {
          const errBody = await response.json().catch(() => ({}));
          throw new Error(errBody?.error || `Server responded with status ${response.status}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let reply = '';
        for (;;) {
          const { value, done } = await reader.read();
          if (done) break;
          reply += decoder.decode(value, { stream: true });
          setMessages([...history, { role: 'assistant', content: reply }]);
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError' && controller !== abortRef.current) return;
        setError(err instanceof Error ? err.message : 'The line went dead');
        // Drop the empty reply bubble so the caller can try again
        setMessages((current) =>
          current[current.length - 1]?.content === '' ? current.slice(0, -1) : current
        );
      } finally {
        clearTimeout(timeout);
        if (controller === abortRef.current) setIsStreaming(false);
      }
    },
    [messages, isStreaming]
  );

  const hangUp = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setMessages([]);
    setIsStreaming(false);
    setError(null);
  }, []);

  return { messages, isStreaming, error, send, hangUp };
};

export default useJamesonChat;
