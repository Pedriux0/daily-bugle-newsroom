import React from 'react';
import { ImageWithFallback } from '../shared/ImageWithFallback';
import { ArticleData, NewsApiArticle } from '../../types/news';
import glassesImg from '../../assets/glasses.png';

interface BugleMainStoryProps {
  articleData: ArticleData | null;
  isLoading: boolean;
  error: string | null;
  onSearch: (query: string) => void;
  topHeadline: NewsApiArticle | null;
}

/** Split body into paragraphs — handles \n\n, literal \\n\\n, or long single blocks */
function splitBody(body: string): string[] {
  let parts = body.split(/\n\n+/).map((p) => p.trim()).filter(Boolean);
  if (parts.length >= 2) return parts;

  parts = body.split(/\\n\\n/).map((p) => p.trim()).filter(Boolean);
  if (parts.length >= 2) return parts;

  const sentences = body.match(/[^.!?]+[.!?]+/g);
  if (sentences && sentences.length > 4) {
    const chunkSize = Math.ceil(sentences.length / 3);
    const chunks: string[] = [];
    for (let i = 0; i < sentences.length; i += chunkSize) {
      chunks.push(sentences.slice(i, i + chunkSize).join(' ').trim());
    }
    return chunks;
  }

  return [body];
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return 'Just now';
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

const BUGLE_SUGGESTIONS = [
  'Latest Spider-Man sighting',
  'NYC crime wave update',
  'Oscorp stock scandal',
  'Mayor\'s press conference today',
  'Avengers tower construction',
];

const BugleMainStory: React.FC<BugleMainStoryProps> = ({ articleData, isLoading, error, onSearch, topHeadline }) => {
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
    <article className="border-b-2 border-black pb-8 mb-8">
      {/* Search bar */}
      <div className="mb-6">
        <form className="flex flex-col sm:flex-row gap-3" onSubmit={handleSubmit}>
          <div className="flex-1 relative">
            <input
              type="text"
              className="w-full py-3 px-4 pr-12 text-base border-2 border-black bg-white text-black rounded-none"
              style={{ fontFamily: 'Georgia, serif' }}
              placeholder="Ask Jameson anything — news, events, Spider-Man..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              disabled={isLoading}
            />
            <button
              type="button"
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition cursor-pointer"
              onClick={() => setShowInfo((v) => !v)}
              aria-label="Show topic suggestions"
            >
              <img src={glassesImg} alt="Info" className="w-6 h-6 object-contain" />
            </button>
          </div>
          <button
            type="submit"
            className="py-3 px-6 bg-red-700 text-white font-black uppercase tracking-wider border-none cursor-pointer hover:bg-red-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-bangers text-lg whitespace-nowrap"
            disabled={isLoading || !query.trim()}
          >
            {isLoading ? 'PRINTING...' : 'GET THE SCOOP!'}
          </button>
        </form>

        {/* Info tooltip with suggestions */}
        {showInfo && (
          <div className="mt-3 p-4 bg-yellow-50 border-2 border-yellow-400 relative">
            <div className="flex items-start gap-3 mb-3">
              <img src={glassesImg} alt="" className="w-8 h-8 object-contain flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-black text-sm" style={{ fontFamily: 'Georgia, serif' }}>
                  Welcome to the Daily Bugle Editorial Desk!
                </p>
                <p className="text-gray-600 text-xs mt-1" style={{ fontFamily: 'Georgia, serif' }}>
                  Ask our AI editor J. Jonah Jameson about any topic — he'll give you the news with his... unique perspective. Try these:
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {BUGLE_SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => handleSuggestion(s)}
                  className="px-3 py-1.5 bg-white border border-gray-300 text-xs text-black font-bold hover:bg-red-700 hover:text-white hover:border-red-700 transition-colors cursor-pointer"
                  style={{ fontFamily: 'Georgia, serif' }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="p-4 mb-4 bg-red-50 border border-red-700 text-red-700 text-sm">
          {error}
        </div>
      )}

      {isLoading && (
        <div className="text-center py-12">
          <p className="font-bangers text-yellow-500 text-2xl mb-2 animate-pulse">JAMESON IS WRITING...</p>
          <p className="text-gray-500 italic text-sm" style={{ fontFamily: 'Georgia, serif' }}>
            "PARKER! GET ME MORE PHOTOS OF SPIDER-MAN!"
          </p>
        </div>
      )}

      {/* Claude-generated article */}
      {articleData && !isLoading && (
        <>
          <h2
            className="text-4xl md:text-6xl font-black uppercase leading-tight mb-4 text-black break-words"
            style={{ fontFamily: 'Georgia, serif' }}
          >
            {articleData.headline}
          </h2>
          {articleData.subheadline && (
            <div className="text-base md:text-lg font-bold mb-4 text-red-600 break-words">
              {articleData.subheadline}
            </div>
          )}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="text-base md:text-lg leading-relaxed text-black break-words" style={{ fontFamily: 'Georgia, serif' }}>
                {splitBody(articleData.body).map((paragraph, i) => (
                  <p key={i} className="mb-4">
                    {i === 0 ? (
                      <>
                        <span className="text-5xl float-left mr-2 leading-none font-bold">
                          {paragraph.charAt(0)}
                        </span>
                        {paragraph.slice(1)}
                      </>
                    ) : (
                      paragraph
                    )}
                  </p>
                ))}
              </div>
            </div>
            <div>
              <div className="bg-gray-100 p-4 mb-6">
                <h3 className="font-black text-xl uppercase mb-3 border-b-2 border-black pb-2 text-black">Inside This Issue</h3>
                <ul className="space-y-3 text-sm text-black">
                  <li className="border-b border-gray-300 pb-2">
                    <div className="font-bold">Editorial: Unmask Spider-Man</div>
                    <div className="text-gray-600">Page A6</div>
                  </li>
                  <li className="border-b border-gray-300 pb-2">
                    <div className="font-bold">Damage Estimates Top $500K</div>
                    <div className="text-gray-600">Page A8</div>
                  </li>
                  <li className="border-b border-gray-300 pb-2">
                    <div className="font-bold">Who Pays for Spider-Man's Mess?</div>
                    <div className="text-gray-600">Page A12</div>
                  </li>
                  <li>
                    <div className="font-bold">Weather: Sunny, High 72°F</div>
                    <div className="text-gray-600">Page C4</div>
                  </li>
                </ul>
              </div>
              {articleData.jamesons_take && (
                <div className="bg-red-600 text-white p-4">
                  <h3 className="font-black text-lg uppercase mb-2">JAMESON'S TAKE</h3>
                  <p className="text-sm italic break-words">{articleData.jamesons_take}</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Default: show top headline from News API */}
      {!articleData && !isLoading && !error && topHeadline && (
        <>
          <h2
            className="text-4xl md:text-6xl font-black uppercase leading-tight mb-4 text-black"
            style={{ fontFamily: 'Georgia, serif' }}
          >
            <a href={topHeadline.url} target="_blank" rel="noopener noreferrer" className="hover:text-red-700 transition-colors">
              {topHeadline.title}
            </a>
          </h2>
          <div className="text-base md:text-lg font-bold mb-4 text-red-600">
            {topHeadline.source.name} &bull; {timeAgo(topHeadline.publishedAt)}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              {topHeadline.urlToImage && (
                <ImageWithFallback
                  src={topHeadline.urlToImage}
                  alt={topHeadline.title}
                  className="w-full h-64 md:h-96 object-cover mb-4"
                />
              )}
              {topHeadline.author && (
                <p className="text-sm italic mb-4 text-gray-600">By {topHeadline.author}</p>
              )}
              <div className="text-base md:text-lg leading-relaxed text-black" style={{ fontFamily: 'Georgia, serif' }}>
                {topHeadline.description && (
                  <p className="mb-4">
                    <span className="text-5xl float-left mr-2 leading-none font-bold">
                      {topHeadline.description.charAt(0)}
                    </span>
                    {topHeadline.description.slice(1)}
                  </p>
                )}
                {topHeadline.content && (
                  <p className="mb-4">{topHeadline.content.replace(/\[\+\d+ chars\]/, '')}</p>
                )}
              </div>
            </div>
            <div>
              <div className="bg-gray-100 p-4 mb-6">
                <h3 className="font-black text-xl uppercase mb-3 border-b-2 border-black pb-2 text-black">Inside This Issue</h3>
                <ul className="space-y-3 text-sm text-black">
                  <li className="border-b border-gray-300 pb-2">
                    <div className="font-bold">Editorial: Unmask Spider-Man</div>
                    <div className="text-gray-600">Page A6</div>
                  </li>
                  <li className="border-b border-gray-300 pb-2">
                    <div className="font-bold">Damage Estimates Top $500K</div>
                    <div className="text-gray-600">Page A8</div>
                  </li>
                  <li className="border-b border-gray-300 pb-2">
                    <div className="font-bold">Who Pays for Spider-Man's Mess?</div>
                    <div className="text-gray-600">Page A12</div>
                  </li>
                  <li>
                    <div className="font-bold">Weather: Sunny, High 72°F</div>
                    <div className="text-gray-600">Page C4</div>
                  </li>
                </ul>
              </div>
              <div className="bg-red-600 text-white p-4">
                <h3 className="font-black text-lg uppercase mb-2">Call to Action</h3>
                <p className="text-sm mb-3">Have you seen Spider-Man? Report sightings to our tip line!</p>
                <div className="bg-white text-black p-2 text-center font-bold">1-800-BUGLE-TIP</div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Fallback: no news, no article, no error */}
      {!articleData && !isLoading && !error && !topHeadline && (
        <div className="text-center py-12 text-gray-500" style={{ fontFamily: 'Georgia, serif' }}>
          <p className="text-lg">Loading today's headlines...</p>
        </div>
      )}
    </article>
  );
};

export default BugleMainStory;
