import React, { useState } from 'react';
import { NewsApiArticle } from '../../types/news';

interface NewsPhotoProps {
  article: NewsApiArticle;
  className?: string;
  eager?: boolean;
}

/** A story's own photo, credited to its publisher and linked to the original article */
const NewsPhoto: React.FC<NewsPhotoProps> = ({ article, className = '', eager = false }) => {
  const [failed, setFailed] = useState(false);
  if (!article.urlToImage || failed) return null;

  return (
    <figure className={`news-photo ${className}`}>
      <a href={article.url} target="_blank" rel="noopener noreferrer" className="news-photo-frame" tabIndex={-1}>
        <img
          src={article.urlToImage}
          alt={article.title}
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
        />
      </a>
      <figcaption className="news-credit">
        Photo:{' '}
        <a href={article.url} target="_blank" rel="noopener noreferrer">
          {article.source.name}
        </a>
      </figcaption>
    </figure>
  );
};

export default NewsPhoto;
