export interface ArticleData {
  headline: string;
  subheadline: string;
  body: string;
  jamesons_take: string;
}

export interface ThreatData {
  threat_level: 'Green' | 'Yellow' | 'Red';
  summary: string;
  analysis: string;
  recommended_actions: string[];
}

/** A news article from the News API */
export interface NewsApiArticle {
  title: string;
  description: string | null;
  url: string;
  urlToImage: string | null;
  source: { id: string | null; name: string };
  publishedAt: string;
  author: string | null;
  content: string | null;
}
