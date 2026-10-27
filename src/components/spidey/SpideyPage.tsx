import React, { useRef, useState } from 'react';
import SpideyFront from './SpideyFront';
import ThreatScanner from './ThreatScanner';
import CommunitySection from './CommunitySection';
import LiveFeed from './LiveFeed';
import JobBoard from './JobBoard';
import UncleBenReminder from './UncleBenReminder';
import SpiderMen from './SpiderMen';
import WireTable from '../shared/WireTable';
import Footer from '../shared/Footer';
import useReveal from '../../hooks/useReveal';
import useNYC311 from '../../hooks/useNYC311';
import { NewsApiArticle, ThreatData } from '../../types/news';
import { Engine } from '../../hooks/useNewsroomAI';

const LINKS = [
  { href: '#scan', label: 'Threat scan' },
  { href: '#wire', label: 'Crime wire' },
  { href: '#reports', label: '311 calls' },
  { href: '#jobs', label: 'Day jobs' },
];

interface SpideyPageProps {
  threatData: ThreatData | null;
  isLoading: boolean;
  error: string | null;
  draft: string;
  engine: Engine | null;
  onSearch: (query: string) => void;
  headlines: NewsApiArticle[];
  headlinesLoading: boolean;
  onRetryHeadlines: () => void;
  isPlaying: boolean;
  onToggleMusic: () => void;
  cursorEnabled: boolean;
  onToggleCursor: () => void;
  onCallJameson: () => void;
}

const SpideyPage: React.FC<SpideyPageProps> = ({
  threatData,
  isLoading,
  error,
  draft,
  engine,
  onSearch,
  headlines,
  headlinesLoading,
  onRetryHeadlines,
  isPlaying,
  onToggleMusic,
  cursorEnabled,
  onToggleCursor,
  onCallJameson,
}) => {
  const mainRef = useRef<HTMLElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [sourceArticle, setSourceArticle] = useState<NewsApiArticle | null>(null);
  const { reports, isLoading: reportsLoading, error: reportsError, refetch } = useNYC311(6);
  useReveal(mainRef);

  const goToScanner = () => {
    document.getElementById('scan')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 400);
  };

  const scan = (title: string) => {
    setSourceArticle(headlines.find((a) => a.title === title) ?? null);
    setQuery(title);
    onSearch(title);
    document.getElementById('scan')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <>
      <main className="np-main" ref={mainRef}>
        <SpideyFront
          links={LINKS}
          isPlaying={isPlaying}
          onToggleMusic={onToggleMusic}
          cursorEnabled={cursorEnabled}
          onToggleCursor={onToggleCursor}
          onScan={goToScanner}
          latestReport={reports[0] ?? null}
        />
        <ThreatScanner
          ref={inputRef}
          query={query}
          onQueryChange={setQuery}
          onSearch={(topic) => {
            setSourceArticle(null);
            onSearch(topic);
          }}
          onScanStory={scan}
          sourceArticle={sourceArticle}
          threatData={threatData}
          isLoading={isLoading}
          error={error}
          draft={draft}
          engine={engine}
          topHeadline={headlines[0] ?? null}
          headlinesLoading={headlinesLoading}
          onRetryHeadlines={onRetryHeadlines}
        />
        <WireTable
          id="wire"
          heading="Tonight's crime wire."
          articles={headlines.slice(1)}
          isLoading={headlinesLoading}
          onRetry={onRetryHeadlines}
          rewriteLabel="Scan this story"
          onRewrite={scan}
        />
        <CommunitySection reports={reports} isLoading={reportsLoading} error={reportsError} onRefresh={refetch} />
        <LiveFeed />
        <JobBoard />
        <SpiderMen />
        <UncleBenReminder />
      </main>
      <Footer
        wordmark="SPIDER-MAN"
        links={LINKS}
        columns={[
          { heading: 'On patrol', lines: ['Forest Hills, Queens', 'New York, NY'] },
          {
            heading: 'Live data',
            lines: ['NYC 311 from NYC Open Data', 'Headlines from the NY Post, ABC7 and NYT', 'Threat scans by a local AI'],
          },
          {
            heading: 'The other side',
            lines: [
              <button type="button" className="np-link" onClick={onCallJameson}>
                Call Jameson at the Bugle
              </button>,
              'He will not be pleased',
            ],
          },
        ]}
      />
    </>
  );
};

export default SpideyPage;
