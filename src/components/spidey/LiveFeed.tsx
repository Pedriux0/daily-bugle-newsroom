import React from 'react';
import useYouTubeNews from '../../hooks/useYouTubeNews';
import { timeAgo } from '../../utils/time';
import queens from '../../assets/photos/queens-boulevard-west-of-yellowstone-boulevard.jpg';

function decodeHtml(html: string): string {
  const el = document.createElement('textarea');
  el.innerHTML = html;
  return el.value;
}

/** Tonight's news clips; the player takes the left, the list hangs from the axis */
const LiveFeed: React.FC = () => {
  const { videos, isLoading, error, activeVideo, setActiveVideo } = useYouTubeNews('NYC crime police breaking news');

  return (
    <section className="np-section" id="tonight" aria-labelledby="tonight-head">
      <div className="np-grid desk">
        <figure className="np-side desk-figure--after" style={{ margin: 0 }} data-reveal>
          {activeVideo ? (
            <div className="video-player">
              <iframe
                src={`https://www.youtube.com/embed/${activeVideo}?autoplay=1&rel=0`}
                title="News clip"
                allow="autoplay; encrypted-media"
                allowFullScreen
              />
            </div>
          ) : (
            <img
              className="np-photo"
              src={queens}
              alt="Queens Boulevard in Forest Hills, Queens, on a summer afternoon"
              width={1920}
              height={2560}
              loading="lazy"
              style={{ aspectRatio: '4 / 5' }}
            />
          )}
          <figcaption className="np-small np-soft" style={{ marginTop: 12 }}>
            {activeVideo ? (
              <button type="button" className="np-link" onClick={() => setActiveVideo(null)}>
                Close the clip
              </button>
            ) : (
              'Queens Boulevard, Forest Hills. Home turf.'
            )}
          </figcaption>
        </figure>

        <div className="np-axis">
          <h2 className="desk-head" id="tonight-head" data-reveal>
            On the news tonight.
          </h2>
          {isLoading && <p>Tuning in to the evening news…</p>}
          {error && !isLoading && (
            <p className="notice">The video feed is offline: {error}. Add a YouTube key to bring the clips back.</p>
          )}
          {videos.map((video, i) => (
            <button
              key={video.videoId}
              type="button"
              className="video-row"
              onClick={() => setActiveVideo(video.videoId)}
              aria-pressed={activeVideo === video.videoId}
              data-reveal
              style={{ '--i': i } as React.CSSProperties}
            >
              {video.thumbnail && <img src={video.thumbnail} alt="" width={160} height={90} loading="lazy" />}
              <span>
                <strong style={{ display: 'block', lineHeight: 1.35 }}>{decodeHtml(video.title)}</strong>
                <span className="np-small np-soft">
                  {video.channelTitle}, {timeAgo(video.publishedAt)}
                </span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};

export default LiveFeed;
