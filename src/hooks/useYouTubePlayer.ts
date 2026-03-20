import { useEffect, useRef, useState, useCallback } from 'react';

let apiLoaded = false;
let apiLoadPromise: Promise<void> | null = null;

function loadYouTubeAPI(): Promise<void> {
  if (apiLoaded) return Promise.resolve();
  if (apiLoadPromise) return apiLoadPromise;

  apiLoadPromise = new Promise<void>((resolve) => {
    // Check if script already exists
    const existing = document.querySelector('script[src*="youtube.com/iframe_api"]');
    if (existing) {
      if (window.YT?.Player) {
        apiLoaded = true;
        resolve();
      } else {
        const prev = window.onYouTubeIframeAPIReady;
        window.onYouTubeIframeAPIReady = () => {
          prev?.();
          apiLoaded = true;
          resolve();
        };
      }
      return;
    }

    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(tag);

    window.onYouTubeIframeAPIReady = () => {
      apiLoaded = true;
      resolve();
    };
  });

  return apiLoadPromise;
}

const useYouTubePlayer = (videoId: string) => {
  const playerRef = useRef<YTPlayer | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      await loadYouTubeAPI();
      if (cancelled) return;

      // Create hidden container for audio-only playback
      if (!containerRef.current) {
        const container = document.createElement('div');
        container.style.cssText =
          'position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;overflow:hidden;';
        document.body.appendChild(container);
        containerRef.current = container;
      }

      const el = document.createElement('div');
      containerRef.current.appendChild(el);

      playerRef.current = new window.YT.Player(el, {
        height: '1',
        width: '1',
        videoId,
        playerVars: {
          autoplay: 0,
          controls: 0,
          disablekb: 1,
          fs: 0,
          modestbranding: 1,
        },
        events: {
          onReady: () => {
            if (!cancelled) setIsReady(true);
          },
          onStateChange: (event) => {
            if (!cancelled) setIsPlaying(event.data === 1); // 1 = PLAYING
          },
          onError: (event) => {
            console.warn('YouTube player error:', event.data);
          },
        },
      });
    }

    init();

    return () => {
      cancelled = true;
      playerRef.current?.destroy();
      playerRef.current = null;
    };
  }, [videoId]);

  const play = useCallback(() => playerRef.current?.playVideo(), []);
  const pause = useCallback(() => playerRef.current?.pauseVideo(), []);
  const stop = useCallback(() => {
    playerRef.current?.stopVideo();
    setIsPlaying(false);
  }, []);
  const toggle = useCallback(() => {
    if (isPlaying) {
      playerRef.current?.pauseVideo();
    } else {
      playerRef.current?.playVideo();
    }
  }, [isPlaying]);

  return { isPlaying, isReady, play, pause, stop, toggle };
};

export default useYouTubePlayer;
