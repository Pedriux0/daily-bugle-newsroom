import React, { useState, useCallback, lazy, Suspense } from 'react';
import SplashScreen from './components/SplashScreen';
import ModeToggle from './components/ModeToggle';
import NoirToggle from './components/NoirToggle';

import useYouTubePlayer from './hooks/useYouTubePlayer';
import useNewsroomAI from './hooks/useNewsroomAI';
import useNewsAPI from './hooks/useNewsAPI';

import BuglePage from './components/bugle/BuglePage';
import SpideyPage from './components/spidey/SpideyPage';
import MusicPrompt from './components/spidey/MusicPrompt';
import JamesonChat from './components/shared/JamesonChat';

import WebShooterCursor from './components/WebShooterCursor';
import './App.css';
import './styles/newsroom.css';

// The original design only downloads when someone goes back to it
const ClassicSite = lazy(() => import('./classic/ClassicSite'));

export type Mode = 'peter' | 'spiderman';

const THEME_SONG_ID = 'JNA6pzYpwH0';
const SPLASH_SEEN_KEY = 'bugle-splash-seen';

const urlParams = new URLSearchParams(window.location.search);
// ?mode=spiderman opens the HUD directly
const initialMode: Mode = urlParams.get('mode') === 'spiderman' ? 'spiderman' : 'peter';
// ?classic=1 opens the original design from before the redesign
const initialClassic = urlParams.get('classic') === '1';

/** The splash plays once per browser session; ?splash=0 skips it */
function shouldShowSplash(): boolean {
  if (urlParams.get('splash') === '0') return false;
  try {
    return sessionStorage.getItem(SPLASH_SEEN_KEY) !== '1';
  } catch {
    return true;
  }
}

function App() {
  const [showSplash, setShowSplash] = useState(shouldShowSplash);
  const [mode, setMode] = useState<Mode>(initialMode);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [classic, setClassic] = useState(initialClassic);
  // The old-film title card shown while switching between the two designs
  const [intertitle, setIntertitle] = useState<string | null>(null);
  const { play, stop, toggle, isPlaying } = useYouTubePlayer(THEME_SONG_ID);
  const { articleData, threatData, isLoading, error, draft, engine, fetchNews } = useNewsroomAI();
  const {
    bugleHeadlines,
    spideyHeadlines,
    isLoading: headlinesLoading,
    retry: retryHeadlines,
  } = useNewsAPI();
  const [cursorEnabled, setCursorEnabled] = useState(true);
  // null = not asked yet this session; otherwise the user's answer
  const [musicChoice, setMusicChoice] = useState<boolean | null>(null);
  const [showMusicPrompt, setShowMusicPrompt] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const openChat = useCallback(() => setChatOpen(true), []);
  const closeChat = useCallback(() => setChatOpen(false), []);

  const handleSplashComplete = useCallback(() => {
    try {
      sessionStorage.setItem(SPLASH_SEEN_KEY, '1');
    } catch {
      // Storage blocked — the splash just plays again next visit
    }
    setShowSplash(false);
  }, []);

  const handleModeToggle = useCallback(() => {
    if (isTransitioning) return;
    setIsTransitioning(true);

    const next: Mode = mode === 'peter' ? 'spiderman' : 'peter';

    if (next === 'spiderman') {
      if (musicChoice === null) {
        setShowMusicPrompt(true);
      } else if (musicChoice) {
        play();
      }
    } else {
      setShowMusicPrompt(false);
      stop();
    }

    setTimeout(() => setMode(next), 500);
    setTimeout(() => setIsTransitioning(false), 1000);
  }, [mode, isTransitioning, musicChoice, play, stop]);

  const handleClassicToggle = useCallback(() => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setIntertitle(classic ? 'Forward to today' : 'Back to the good old days');
    setTimeout(() => {
      setClassic((c) => !c);
      window.scrollTo(0, 0);
    }, 700);
    setTimeout(() => {
      setIntertitle(null);
      setIsTransitioning(false);
    }, 1500);
  }, [classic, isTransitioning]);

  const handleMusicChoice = useCallback(
    (shouldPlay: boolean) => {
      setMusicChoice(shouldPlay);
      setShowMusicPrompt(false);
      if (shouldPlay) play();
    },
    [play]
  );

  const handleToggleMusic = useCallback(() => {
    setShowMusicPrompt(false);
    setMusicChoice(!isPlaying);
    toggle();
  }, [isPlaying, toggle]);

  const handleSearch = useCallback(
    (query: string) => {
      fetchNews(query, mode);
    },
    [fetchNews, mode]
  );

  if (showSplash) {
    return <SplashScreen onComplete={handleSplashComplete} />;
  }

  const shared = {
    isLoading,
    error,
    draft,
    engine,
    onSearch: handleSearch,
    headlinesLoading,
    onRetryHeadlines: retryHeadlines,
    isPlaying,
    onToggleMusic: handleToggleMusic,
    cursorEnabled,
    onToggleCursor: () => setCursorEnabled((v) => !v),
    onCallJameson: openChat,
  };

  return (
    <div className={`${classic ? '' : 'np '}${mode === 'peter' ? 'peter-mode' : 'spiderman-mode'}`}>
      {intertitle && (
        <div className="intertitle" role="status">
          <p>{intertitle}…</p>
        </div>
      )}

      {isTransitioning && !intertitle && (
        <div
          className={`transition-overlay ${
            mode === 'peter' ? 'transition-suit-up' : 'transition-mask-off'
          }`}
        />
      )}

      {classic ? (
        <Suspense fallback={null}>
          <ClassicSite
          mode={mode}
          articleData={articleData}
          threatData={threatData}
          isLoading={isLoading}
          error={error}
          onSearch={handleSearch}
          bugleHeadlines={bugleHeadlines}
          spideyHeadlines={spideyHeadlines}
          headlinesLoading={headlinesLoading}
          onRetryHeadlines={retryHeadlines}
          isPlaying={isPlaying}
          onToggleMusic={handleToggleMusic}
          cursorEnabled={cursorEnabled}
          onToggleCursor={() => setCursorEnabled((v) => !v)}
          />
        </Suspense>
      ) : mode === 'peter' ? (
        <BuglePage {...shared} articleData={articleData} headlines={bugleHeadlines} />
      ) : (
        <SpideyPage {...shared} threatData={threatData} headlines={spideyHeadlines} />
      )}

      {chatOpen && <JamesonChat onClose={closeChat} />}

      {mode === 'spiderman' && showMusicPrompt && <MusicPrompt onChoose={handleMusicChoice} />}

      <ModeToggle
        mode={mode}
        onToggle={handleModeToggle}
        isTransitioning={isTransitioning}
      />

      <NoirToggle classic={classic} onToggle={handleClassicToggle} isTransitioning={isTransitioning} />

      <WebShooterCursor mode={mode} enabled={cursorEnabled} />

    </div>
  );
}

export default App;
