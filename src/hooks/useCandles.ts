import { useState, useEffect, useCallback } from 'react';

const LIT_KEY = 'ben-parker-candle';

function readLit(): boolean {
  try {
    return localStorage.getItem(LIT_KEY) === 'lit';
  } catch {
    return false;
  }
}

/** The shared count of candles lit for Ben, and whether this visitor lit one */
const useCandles = () => {
  const [count, setCount] = useState<number | null>(null);
  const [lit, setLit] = useState(readLit);
  const [justLit, setJustLit] = useState(false);

  useEffect(() => {
    fetch('/api/candles', { signal: AbortSignal.timeout(10000) })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && typeof data.count === 'number') setCount(data.count);
      })
      .catch(() => {
        // The count is a nice extra; the candle still works without it
      });
  }, []);

  const light = useCallback(async () => {
    setLit(true);
    setJustLit(true);
    try {
      localStorage.setItem(LIT_KEY, 'lit');
    } catch {
      // Storage blocked: the candle still burns for this visit
    }
    try {
      const res = await fetch('/api/candles', { method: 'POST', signal: AbortSignal.timeout(10000) });
      const data = await res.json();
      if (typeof data.count === 'number') setCount(data.count);
    } catch {
      setCount((c) => (c === null ? c : c + 1));
    }
  }, []);

  return { count, lit, justLit, light };
};

export default useCandles;
