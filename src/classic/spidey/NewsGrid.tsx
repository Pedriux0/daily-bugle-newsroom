import React from 'react';
import { TrendingUp, Users, Shield } from 'lucide-react';
import { ImageWithFallback } from '../shared/ImageWithFallback';
import { NewsApiArticle } from '../../types/news';

const CATEGORY_ICONS = [Users, TrendingUp, Shield];
const CATEGORY_LABELS = ['INTEL', 'ANALYSIS', 'ALERT'];

interface NewsGridProps {
  articles: NewsApiArticle[];
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return 'Just now';
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

const NewsGrid: React.FC<NewsGridProps> = ({ articles }) => {
  const stories = articles.slice(0, 3);

  if (stories.length === 0) return null;

  return (
    <div className="mb-6">
      <h2 className="text-2xl font-black mb-4 text-white tracking-wider">
        <span className="text-red-600">&gt;&gt;</span> RECENT UPDATES
      </h2>
      <div className="grid md:grid-cols-3 gap-6">
        {stories.map((story, i) => {
          const Icon = CATEGORY_ICONS[i % CATEGORY_ICONS.length];
          const label = CATEGORY_LABELS[i % CATEGORY_LABELS.length];
          return (
            <article
              key={story.url}
              className="bg-black border-2 border-red-600 rounded-lg shadow-[0_0_20px_rgba(239,68,68,0.2)] overflow-hidden hover:shadow-[0_0_40px_rgba(239,68,68,0.4)] transition cursor-pointer group"
            >
              <a href={story.url} target="_blank" rel="noopener noreferrer">
                <div className="relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent z-10"></div>
                  {story.urlToImage && (
                    <ImageWithFallback
                      src={story.urlToImage}
                      alt={story.title}
                      className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  )}
                  <div className="absolute top-3 left-3 bg-black/90 backdrop-blur border border-red-600 px-3 py-1 rounded flex items-center gap-1 z-20">
                    <Icon className="w-4 h-4 text-red-500" />
                    <span className="text-xs font-bold font-mono text-white">{label}</span>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-black text-lg mb-2 leading-tight text-white break-words">{story.title}</h3>
                  {story.description && (
                    <p className="text-gray-400 text-sm mb-3 line-clamp-2 break-words">{story.description}</p>
                  )}
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-red-400 font-mono">{timeAgo(story.publishedAt)}</span>
                    <span className="font-bold text-red-500 font-mono">{story.source.name}</span>
                  </div>
                </div>
              </a>
            </article>
          );
        })}
      </div>
    </div>
  );
};

export default NewsGrid;
