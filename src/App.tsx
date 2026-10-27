import React, { useState, useCallback } from 'react';
import SplashScreen from './components/SplashScreen';
import ModeToggle from './components/ModeToggle';
import useYouTubePlayer from './hooks/useYouTubePlayer';
import useNewsroomAI from './hooks/useNewsroomAI';
import useNewsAPI from './hooks/useNewsAPI';

// Bugle mode components
import BugleHeader from './components/bugle/BugleHeader';
import BugleMainStory from './components/bugle/BugleMainStory';
import BugleSecondaryStories from './components/bugle/BugleSecondaryStories';
import BugleOpinionSection from './components/bugle/BugleOpinionSection';
import BugleFooter from './components/bugle/BugleFooter';

// Spidey mode components
import SpideyHeader from './components/spidey/SpideyHeader';
import StatsPanel from './components/spidey/StatsPanel';
import SpideyFeaturedStory from './components/spidey/SpideyFeaturedStory';
import NewsGrid from './components/spidey/NewsGrid';
import LiveFeed from './components/spidey/LiveFeed';
import CommunitySection from './components/spidey/CommunitySection';
import SpideyFooter from './components/spidey/SpideyFooter';
import JobBoard from './components/spidey/JobBoard';
import UncleBenReminder from './components/spidey/UncleBenReminder';
import MusicPrompt from './components/spidey/MusicPrompt';

import WebShooterCursor from './components/WebShooterCursor';
import spidermanBg from './assets/background.jpg';
import './App.css';

export type Mode = 'peter' | 'spiderman';

const THEME_SONG_ID = 'JNA6pzYpwH0';

function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [mode, setMode] = useState<Mode>('peter');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const { play, stop, toggle, isPlaying } = useYouTubePlayer(THEME_SONG_ID);
  const { articleData, threatData, isLoading, error, fetchNews } = useNewsroomAI();
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

  const handleSplashComplete = useCallback(() => {
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

  // Split headlines per mode: first is featured, rest are secondary
  const bugleTop = bugleHeadlines.length > 0 ? bugleHeadlines[0] : null;
  const bugleSecondary = bugleHeadlines.slice(1);
  const spideyTop = spideyHeadlines.length > 0 ? spideyHeadlines[0] : null;
  const spideySecondary = spideyHeadlines.slice(1);

  return (
    <div className={mode === 'peter' ? 'peter-mode' : 'spiderman-mode'}>
      {isTransitioning && (
        <div
          className={`transition-overlay ${
            mode === 'peter' ? 'transition-suit-up' : 'transition-mask-off'
          }`}
        />
      )}

      {mode === 'peter' ? (
        /* ===== DAILY BUGLE MODE ===== */
        <div className="min-h-screen bg-white">
          <BugleHeader isPlaying={isPlaying} onToggleMusic={handleToggleMusic} />
          <main className="max-w-7xl mx-auto px-4 py-8">
            <BugleMainStory
              articleData={articleData}
              isLoading={isLoading}
              error={error}
              onSearch={handleSearch}
              topHeadline={bugleTop}
              headlinesLoading={headlinesLoading}
              onRetryHeadlines={retryHeadlines}
            />
            <BugleSecondaryStories articles={bugleSecondary} />
            <BugleOpinionSection />
          </main>
          <BugleFooter />
        </div>
      ) : (
        /* ===== SPIDER-MAN MODE ===== */
        <div className="min-h-screen bg-black relative overflow-hidden">
          {/* Background image */}
          <div
            className="fixed inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${spidermanBg})` }}
          ></div>
          {/* Dark overlay so content stays readable */}
          <div className="fixed inset-0 bg-black/75"></div>
          {/* Grid lines overlay */}
          <div
            className="fixed inset-0"
            style={{
              backgroundImage: `
                repeating-linear-gradient(0deg, rgba(239, 68, 68, 0.03) 0px, transparent 1px, transparent 2px, rgba(239, 68, 68, 0.03) 3px),
                repeating-linear-gradient(90deg, rgba(239, 68, 68, 0.03) 0px, transparent 1px, transparent 2px, rgba(239, 68, 68, 0.03) 3px)
              `,
              backgroundSize: '50px 50px',
            }}
          ></div>

          <div className="relative z-10">
            <SpideyHeader isPlaying={isPlaying} onToggleMusic={handleToggleMusic} />
            <main className="max-w-screen-2xl mx-auto px-4 py-6">
              <StatsPanel />
              <div className="grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <SpideyFeaturedStory
                    threatData={threatData}
                    isLoading={isLoading}
                    error={error}
                    onSearch={handleSearch}
                    topHeadline={spideyTop}
                    headlinesLoading={headlinesLoading}
                    onRetryHeadlines={retryHeadlines}
                  />
                  <NewsGrid articles={spideySecondary} />
                  <JobBoard />
                </div>
                <div className="lg:col-span-1">
                  <LiveFeed />
                  <CommunitySection />
                  <UncleBenReminder />
                </div>
              </div>
            </main>
            <SpideyFooter />
          </div>
        </div>
      )}

      {mode === 'spiderman' && showMusicPrompt && <MusicPrompt onChoose={handleMusicChoice} />}

      <ModeToggle
        mode={mode}
        onToggle={handleModeToggle}
        isTransitioning={isTransitioning}
      />

      <WebShooterCursor mode={mode} enabled={cursorEnabled} />

      {/* Cursor FX toggle */}
      <button
        className="fixed bottom-2 left-2 z-[100] px-3 py-1.5 rounded-full text-xs font-mono cursor-pointer transition-all border"
        style={{
          background: cursorEnabled
            ? mode === 'peter' ? 'rgba(26,26,26,0.8)' : 'rgba(226,54,54,0.8)'
            : 'rgba(100,100,100,0.5)',
          color: '#fff',
          borderColor: cursorEnabled
            ? mode === 'peter' ? '#1A1A1A' : '#E23636'
            : '#666',
        }}
        onClick={() => setCursorEnabled((v) => !v)}
        aria-label={cursorEnabled ? 'Disable cursor effect' : 'Enable cursor effect'}
      >
        {cursorEnabled ? '✦ FX ON' : '✦ FX OFF'}
      </button>
    </div>
  );
}

export default App;
