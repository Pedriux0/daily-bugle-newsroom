import React from 'react';
import { ImageWithFallback } from '../shared/ImageWithFallback';
import { NewsApiArticle } from '../../types/news';

interface BugleSecondaryStoriesProps {
  articles: NewsApiArticle[];
}

const BugleSecondaryStories: React.FC<BugleSecondaryStoriesProps> = ({ articles }) => {
  // Show up to 3 secondary stories
  const stories = articles.slice(0, 3);

  if (stories.length === 0) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
      {stories.map((story, i) => (
        <article
          key={story.url}
          className={i < stories.length - 1 ? 'md:border-r-2 md:border-black md:pr-8' : ''}
        >
          <h3
            className="text-2xl md:text-3xl font-black uppercase leading-tight mb-3 text-black"
            style={{ fontFamily: 'Georgia, serif' }}
          >
            <a href={story.url} target="_blank" rel="noopener noreferrer" className="hover:text-red-700 transition-colors">
              {story.title}
            </a>
          </h3>
          {story.urlToImage && (
            <ImageWithFallback
              src={story.urlToImage}
              alt={story.title}
              className="w-full h-48 object-cover mb-3"
            />
          )}
          <p className="text-sm mb-2 text-black" style={{ fontFamily: 'Georgia, serif' }}>
            {story.description}
          </p>
          <div className="flex items-center justify-between text-xs text-gray-500 mt-2">
            <span className="font-bold">{story.source.name}</span>
            <span>{new Date(story.publishedAt).toLocaleDateString()}</span>
          </div>
        </article>
      ))}
    </div>
  );
};

export default BugleSecondaryStories;
