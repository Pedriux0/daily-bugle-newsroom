import React, { useRef, useState } from 'react';
import BugleFront from './BugleFront';
import BuglePress from './BuglePress';
import { BugleCompare, BugleEditorial, BugleTipLine } from './BugleSections';
import WireTable from '../shared/WireTable';
import Footer from '../shared/Footer';
import useReveal from '../../hooks/useReveal';
import { ArticleData, NewsApiArticle } from '../../types/news';
import { Engine } from '../../hooks/useNewsroomAI';

const LINKS = [
  { href: '#press', label: 'The press' },
  { href: '#wire', label: 'Headlines' },
  { href: '#editorial', label: 'Editorial' },
  { href: '#tip-line', label: 'Tip line' },
];

interface BuglePageProps {
  articleData: ArticleData | null;
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

const BuglePage: React.FC<BuglePageProps> = ({
  articleData,
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
  const [query, setQuery] = useState('');
  // The wire story Jameson is rewriting, so its photo and credit stay with it
  const [sourceArticle, setSourceArticle] = useState<NewsApiArticle | null>(null);
  useReveal(mainRef);

  /** A wire row sends its headline to the press and scrolls up to watch it print */
  const rewrite = (title: string) => {
    setSourceArticle(headlines.find((a) => a.title === title) ?? null);
    setQuery(title);
    onSearch(title);
    document.getElementById('press')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <>
      <main className="np-main" ref={mainRef}>
        <BugleFront links={LINKS} isPlaying={isPlaying} onToggleMusic={onToggleMusic} cursorEnabled={cursorEnabled} onToggleCursor={onToggleCursor} onCallJameson={onCallJameson} />
        <BuglePress
          query={query}
          onQueryChange={setQuery}
          onSearch={(topic) => {
            setSourceArticle(null);
            onSearch(topic);
          }}
          onRewrite={rewrite}
          sourceArticle={sourceArticle}
          articleData={articleData}
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
          heading="Today's real headlines."
          articles={headlines.slice(1)}
          isLoading={headlinesLoading}
          onRetry={onRetryHeadlines}
          rewriteLabel="Give it to Jameson"
          onRewrite={rewrite}
        />
        <BugleCompare />
        <BugleEditorial />
        <BugleTipLine onCallJameson={onCallJameson} />
      </main>
      <Footer
        wordmark="DAILY BUGLE"
        links={LINKS}
        columns={[
          { heading: 'The Daily Bugle', lines: ['39th Street and Second Avenue', 'New York, NY'] },
          {
            heading: 'Tip line',
            lines: [
              <button type="button" className="np-link" onClick={onCallJameson}>
                Call Jameson
              </button>,
              'Open day and night',
            ],
          },
          {
            heading: 'How it works',
            lines: ['Real headlines from the NYT, The Guardian and BBC', 'Rewritten by a free, local AI editor'],
          },
        ]}
      />
    </>
  );
};

export default BuglePage;
