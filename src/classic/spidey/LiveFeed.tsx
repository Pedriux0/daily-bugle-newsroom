import React from 'react';
import { Play, X, Loader2, AlertTriangle } from 'lucide-react';
import WebPattern from './WebPattern';
import useYouTubeNews, { VideoItem } from '../../hooks/useYouTubeNews';

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return 'Just now';
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function decodeHtml(html: string): string {
  const el = document.createElement('textarea');
  el.innerHTML = html;
  return el.value;
}

const LiveFeed: React.FC = () => {
  const { videos, isLoading, error, activeVideo, setActiveVideo } = useYouTubeNews(
    'NYC crime police breaking news'
  );

  return (
    <div className="bg-black border-2 border-red-600 rounded-lg shadow-[0_0_30px_rgba(239,68,68,0.3)] p-6 mb-6 relative overflow-hidden">
      <WebPattern />

      <div className="flex items-center justify-between mb-4 relative z-10">
        <h2 className="text-2xl font-black text-white tracking-wider">
          <span className="text-red-600">&gt;&gt;</span> LIVE FEED
        </h2>
        <span className="px-3 py-1 bg-red-600 text-white text-xs font-bold font-mono rounded border border-white/20 animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.8)]">
          &#9679; LIVE
        </span>
      </div>

      {/* Embedded player */}
      {activeVideo && (
        <div className="relative z-10 mb-4">
          <div className="relative pt-[56.25%] bg-black rounded-lg overflow-hidden border border-red-600/50">
            <iframe
              className="absolute inset-0 w-full h-full"
              src={`https://www.youtube.com/embed/${activeVideo}?autoplay=1&rel=0`}
              title="Video player"
              allow="autoplay; encrypted-media"
              allowFullScreen
            />
          </div>
          <button
            onClick={() => setActiveVideo(null)}
            className="absolute top-2 right-2 z-20 bg-black/80 border border-red-600 rounded-full p-1.5 text-white hover:bg-red-600 transition cursor-pointer"
            aria-label="Close video"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-8 gap-3 relative z-10">
          <Loader2 className="w-5 h-5 text-red-500 animate-spin" />
          <span className="text-red-400 font-mono text-xs">LOADING FEEDS...</span>
        </div>
      )}

      {/* Error */}
      {error && !isLoading && (
        <div className="flex items-center gap-2 py-4 justify-center relative z-10">
          <AlertTriangle className="w-4 h-4 text-yellow-500" />
          <span className="text-yellow-400 font-mono text-xs">{error}</span>
        </div>
      )}

      {/* Video list */}
      {!isLoading && videos.length > 0 && (
        <div className="space-y-3 relative z-10">
          {videos.map((video) => (
            <VideoCard
              key={video.videoId}
              video={video}
              isActive={activeVideo === video.videoId}
              onPlay={() => setActiveVideo(video.videoId)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const VideoCard: React.FC<{
  video: VideoItem;
  isActive: boolean;
  onPlay: () => void;
}> = ({ video, isActive, onPlay }) => (
  <button
    onClick={onPlay}
    className={`w-full text-left border-l-4 ${
      isActive ? 'border-white bg-white/10' : 'border-red-600 bg-white/5'
    } backdrop-blur p-3 rounded-r hover:bg-white/10 transition hover:shadow-[0_0_20px_rgba(239,68,68,0.2)] flex gap-3 cursor-pointer`}
  >
    {/* Thumbnail */}
    <div className="relative flex-shrink-0 w-28 h-16 rounded overflow-hidden bg-gray-900">
      {video.thumbnail && (
        <img
          src={video.thumbnail}
          alt=""
          className="w-full h-full object-cover"
        />
      )}
      <div className="absolute inset-0 flex items-center justify-center bg-black/40">
        <Play className="w-6 h-6 text-white drop-shadow" />
      </div>
    </div>

    {/* Info */}
    <div className="flex-1 min-w-0">
      <h3 className="text-white text-xs font-bold leading-tight line-clamp-2 mb-1">
        {decodeHtml(video.title)}
      </h3>
      <div className="flex items-center gap-2 text-[10px] text-gray-400 font-mono">
        <span className="text-red-400">{video.channelTitle}</span>
        <span>&bull;</span>
        <span>{timeAgo(video.publishedAt)}</span>
      </div>
    </div>
  </button>
);

export default LiveFeed;
