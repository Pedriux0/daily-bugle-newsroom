import React from 'react';
import { ThumbsUp, MessageCircle, Share2 } from 'lucide-react';
import { ImageWithFallback } from '../shared/ImageWithFallback';
import WebPattern from './WebPattern';
import { ThreatData, NewsApiArticle } from '../../types/news';
import glassesImg from '../../assets/glasses.png';

interface SpideyFeaturedStoryProps {
  threatData: ThreatData | null;
  isLoading: boolean;
  error: string | null;
  onSearch: (query: string) => void;
  topHeadline: NewsApiArticle | null;
  headlinesLoading: boolean;
  onRetryHeadlines: () => void;
}

const THREAT_COLORS: Record<string, string> = {
  Green: 'bg-green-500',
  Yellow: 'bg-yellow-500',
  Red: 'bg-red-600',
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return 'Just now';
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

const SPIDEY_SUGGESTIONS = [
  'Cybercrime activity in NYC',
  'Green Goblin threat assessment',
  'Bank heist patterns this week',
  'Symbiote sightings report',
  'Underground weapons trafficking',
];

const SpideyFeaturedStory: React.FC<SpideyFeaturedStoryProps> = ({ threatData, isLoading, error, onSearch, topHeadline, headlinesLoading, onRetryHeadlines }) => {
  const [query, setQuery] = React.useState('');
  const [showInfo, setShowInfo] = React.useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) onSearch(query.trim());
  };

  const handleSuggestion = (suggestion: string) => {
    setQuery(suggestion);
    onSearch(suggestion);
    setShowInfo(false);
  };

  return (
    <article className="bg-black border-2 border-red-600 rounded-lg shadow-[0_0_30px_rgba(239,68,68,0.3)] overflow-hidden mb-6 relative">
      <WebPattern />

      {/* Search bar */}
      <div className="p-6 relative z-10 border-b-2 border-red-600/30">
        <form className="flex flex-col sm:flex-row gap-3" onSubmit={handleSubmit}>
          <div className="flex-1 relative">
            <input
              type="text"
              className="w-full py-3 px-4 pr-12 text-sm font-mono bg-white/5 border border-red-600/40 text-white rounded-lg focus:outline-none focus:border-red-500 focus:shadow-[0_0_12px_rgba(226,54,54,0.2)] placeholder-gray-500 transition"
              placeholder="Scan threats, crimes, villains, events..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              disabled={isLoading}
            />
            <button
              type="button"
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full hover:bg-red-600/20 transition cursor-pointer"
              onClick={() => setShowInfo((v) => !v)}
              aria-label="Show topic suggestions"
            >
              <img src={glassesImg} alt="Info" className="w-6 h-6 object-contain" />
            </button>
          </div>
          <button
            type="submit"
            className="py-3 px-6 bg-red-600 text-white font-bold font-mono text-sm uppercase tracking-wider rounded-lg hover:shadow-[0_0_15px_rgba(226,54,54,0.3)] transition disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            disabled={isLoading || !query.trim()}
          >
            {isLoading ? 'SCANNING...' : 'SCAN THREATS'}
          </button>
        </form>

        {/* Info tooltip with suggestions */}
        {showInfo && (
          <div className="mt-4 p-4 bg-black/80 border border-red-600/50 rounded-lg backdrop-blur">
            <div className="flex items-start gap-3 mb-3">
              <img src={glassesImg} alt="" className="w-8 h-8 object-contain flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-white text-sm font-mono">
                  SPIDER-SENSE THREAT SCANNER
                </p>
                <p className="text-gray-400 text-xs mt-1 font-mono">
                  Query the AI threat analyst about crimes, villains, security events, or any topic. Get tactical threat assessments with severity ratings.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {SPIDEY_SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => handleSuggestion(s)}
                  className="px-3 py-1.5 bg-black/60 border border-red-600/30 rounded text-xs text-gray-300 font-mono hover:bg-red-600 hover:text-white hover:border-red-500 transition-all cursor-pointer"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="mx-6 mt-4 p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-mono relative z-10">
          {error}
        </div>
      )}

      {isLoading && (
        <div className="text-center py-12 relative z-10">
          <div className="h-0.5 bg-gradient-to-r from-transparent via-red-500 to-transparent mb-6 animate-pulse"></div>
          <p className="text-red-500 font-mono tracking-widest text-sm">Spider-Sense scanning...</p>
        </div>
      )}

      {/* AI-generated threat report */}
      {threatData && !isLoading && (
        <div className="relative z-10">
          <div className="flex items-center gap-4 px-6 py-4 border-b border-red-600/20">
            <span className={`px-4 py-1.5 rounded text-black text-sm font-bold font-mono tracking-wider ${THREAT_COLORS[threatData.threat_level] || 'bg-yellow-500'}`}>
              {threatData.threat_level.toUpperCase()}
            </span>
            <span className="text-gray-500 text-xs font-mono tracking-widest uppercase">THREAT LEVEL</span>
          </div>

          <div className="px-6 py-4 border-b border-red-600/10">
            <h3 className="text-xs font-mono text-blue-400 tracking-widest mb-2 uppercase">SUMMARY</h3>
            <p className="text-gray-300 leading-relaxed break-words">{threatData.summary}</p>
          </div>

          <div className="px-6 py-4 border-b border-red-600/10">
            <h3 className="text-xs font-mono text-blue-400 tracking-widest mb-2 uppercase">ANALYSIS</h3>
            {threatData.analysis.split('\n\n').map(
              (paragraph, i) =>
                paragraph.trim() && (
                  <p key={i} className="text-gray-300 leading-relaxed mb-3 last:mb-0 break-words">{paragraph.trim()}</p>
                )
            )}
          </div>

          {threatData.recommended_actions.length > 0 && (
            <div className="px-6 py-4">
              <h3 className="text-xs font-mono text-blue-400 tracking-widest mb-2 uppercase">RECOMMENDED ACTIONS</h3>
              <ul className="space-y-2">
                {threatData.recommended_actions.map((action, i) => (
                  <li key={i} className="text-gray-300 pl-5 relative break-words">
                    <span className="absolute left-0 text-red-500 font-bold font-mono">&gt;</span>
                    {action}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Default: show top headline from News API */}
      {!threatData && !isLoading && !error && topHeadline && (
        <div className="relative z-10">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent z-10"></div>
            {topHeadline.urlToImage && (
              <ImageWithFallback
                src={topHeadline.urlToImage}
                alt={topHeadline.title}
                className="w-full h-80 object-cover border-b-2 border-red-600"
              />
            )}
            <div className="absolute top-4 left-4 z-20">
              <span className="bg-red-600 text-white px-4 py-2 font-mono text-sm font-bold border border-white/20 shadow-[0_0_20px_rgba(239,68,68,0.8)]">
                &#9888; BREAKING NEWS
              </span>
            </div>
          </div>
          <div className="p-6">
            <div className="text-xs text-red-400 mb-2 uppercase tracking-widest font-mono">
              {topHeadline.source.name} &bull; {timeAgo(topHeadline.publishedAt)}
            </div>
            <h2 className="text-2xl md:text-3xl font-black mb-4 leading-tight text-white tracking-tight break-words">
              <a href={topHeadline.url} target="_blank" rel="noopener noreferrer" className="hover:text-red-400 transition-colors">
                {topHeadline.title}
              </a>
            </h2>
            <div className="space-y-4 text-gray-300 leading-relaxed">
              {topHeadline.description && <p className="break-words">{topHeadline.description}</p>}
              {topHeadline.content && (
                <p className="break-words">{topHeadline.content.replace(/\[\+\d+ chars\]/, '')}</p>
              )}
            </div>
            <div className="flex items-center gap-6 pt-4 mt-6 border-t-2 border-red-600/30">
              <button className="flex items-center gap-2 text-gray-400 hover:text-red-500 transition">
                <ThumbsUp className="w-5 h-5" />
                <span className="font-bold font-mono">2.4K</span>
              </button>
              <button className="flex items-center gap-2 text-gray-400 hover:text-red-500 transition">
                <MessageCircle className="w-5 h-5" />
                <span className="font-bold font-mono">384</span>
              </button>
              <button className="flex items-center gap-2 text-gray-400 hover:text-red-500 transition">
                <Share2 className="w-5 h-5" />
                <span className="font-bold font-mono">SHARE</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fallback */}
      {!threatData && !isLoading && !error && !topHeadline && (
        <div className="text-center py-12 relative z-10">
          {headlinesLoading ? (
            <p className="text-red-500 font-mono tracking-widest text-sm animate-pulse">Initializing threat feeds...</p>
          ) : (
            <>
              <p className="text-red-500 font-mono tracking-widest text-sm mb-4">Threat feeds offline. Signal lost.</p>
              <button
                onClick={onRetryHeadlines}
                className="py-2 px-5 bg-red-600 text-white font-bold font-mono text-sm uppercase tracking-wider rounded-lg hover:shadow-[0_0_15px_rgba(226,54,54,0.3)] transition cursor-pointer"
              >
                Reconnect
              </button>
            </>
          )}
        </div>
      )}
    </article>
  );
};

export default SpideyFeaturedStory;
