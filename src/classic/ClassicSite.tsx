import React, { useEffect } from 'react';
import { ArticleData, NewsApiArticle, ThreatData } from '../types/news';

// The original design, exactly as the site looked before the redesign
import BugleHeader from './bugle/BugleHeader';
import BugleMainStory from './bugle/BugleMainStory';
import BugleSecondaryStories from './bugle/BugleSecondaryStories';
import BugleOpinionSection from './bugle/BugleOpinionSection';
import BugleFooter from './bugle/BugleFooter';
import SpideyHeader from './spidey/SpideyHeader';
import StatsPanel from './spidey/StatsPanel';
import SpideyFeaturedStory from './spidey/SpideyFeaturedStory';
import NewsGrid from './spidey/NewsGrid';
import LiveFeed from './spidey/LiveFeed';
import CommunitySection from './spidey/CommunitySection';
import SpideyFooter from './spidey/SpideyFooter';
import JobBoard from './spidey/JobBoard';
import UncleBenReminder from './spidey/UncleBenReminder';
import spidermanBg from '../assets/background.jpg';

const CLASSIC_FONTS_ID = 'classic-fonts';
const CLASSIC_FONTS_URL =
  'https://fonts.googleapis.com/css2?family=Bangers&family=Courier+Prime:ital,wght@0,400;0,700;1,400&family=Space+Mono:ital,wght@0,400;0,700;1,400&display=swap';

/** The original typefaces load only when someone visits the classic site */
function useClassicFonts() {
  useEffect(() => {
    if (document.getElementById(CLASSIC_FONTS_ID)) return;
    const link = document.createElement('link');
    link.id = CLASSIC_FONTS_ID;
    link.rel = 'stylesheet';
    link.href = CLASSIC_FONTS_URL;
    document.head.appendChild(link);
  }, []);
}

interface ClassicSiteProps {
  mode: 'peter' | 'spiderman';
  articleData: ArticleData | null;
  threatData: ThreatData | null;
  isLoading: boolean;
  error: string | null;
  onSearch: (query: string) => void;
  bugleHeadlines: NewsApiArticle[];
  spideyHeadlines: NewsApiArticle[];
  headlinesLoading: boolean;
  onRetryHeadlines: () => void;
  isPlaying: boolean;
  onToggleMusic: () => void;
  cursorEnabled: boolean;
  onToggleCursor: () => void;
}

const ClassicSite: React.FC<ClassicSiteProps> = ({
  mode,
  articleData,
  threatData,
  isLoading,
  error,
  onSearch,
  bugleHeadlines,
  spideyHeadlines,
  headlinesLoading,
  onRetryHeadlines,
  isPlaying,
  onToggleMusic,
  cursorEnabled,
  onToggleCursor,
}) => {
  useClassicFonts();

  // Split headlines per mode: first is featured, rest are secondary
  const bugleTop = bugleHeadlines.length > 0 ? bugleHeadlines[0] : null;
  const bugleSecondary = bugleHeadlines.slice(1);
  const spideyTop = spideyHeadlines.length > 0 ? spideyHeadlines[0] : null;
  const spideySecondary = spideyHeadlines.slice(1);

  return (
    <div className="classic-site">
      {mode === 'peter' ? (
        /* ===== DAILY BUGLE MODE ===== */
        <div className="min-h-screen bg-white">
          <BugleHeader isPlaying={isPlaying} onToggleMusic={onToggleMusic} />
          <main className="max-w-7xl mx-auto px-4 py-8">
            <BugleMainStory
              articleData={articleData}
              isLoading={isLoading}
              error={error}
              onSearch={onSearch}
              topHeadline={bugleTop}
              headlinesLoading={headlinesLoading}
              onRetryHeadlines={onRetryHeadlines}
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
            <SpideyHeader isPlaying={isPlaying} onToggleMusic={onToggleMusic} />
            <main className="max-w-screen-2xl mx-auto px-4 py-6">
              <StatsPanel />
              <div className="grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <SpideyFeaturedStory
                    threatData={threatData}
                    isLoading={isLoading}
                    error={error}
                    onSearch={onSearch}
                    topHeadline={spideyTop}
                    headlinesLoading={headlinesLoading}
                    onRetryHeadlines={onRetryHeadlines}
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

      {/* Cursor FX toggle, as it was */}
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
        onClick={onToggleCursor}
        aria-label={cursorEnabled ? 'Disable cursor effect' : 'Enable cursor effect'}
      >
        {cursorEnabled ? '✦ FX ON' : '✦ FX OFF'}
      </button>
    </div>
  );
};

export default ClassicSite;
