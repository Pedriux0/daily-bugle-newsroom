import React, { useEffect, useState } from 'react';

interface SplashScreenProps {
  onComplete: () => void;
}

type Phase = 'enter' | 'header' | 'slam' | 'exit';

const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const [phase, setPhase] = useState<Phase>('enter');

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('header'), 300);
    const t2 = setTimeout(() => setPhase('slam'), 900);
    const t3 = setTimeout(() => setPhase('exit'), 3500);
    const t4 = setTimeout(onComplete, 4000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [onComplete]);

  const showHeader = phase !== 'enter';
  const showSlam = phase === 'slam' || phase === 'exit';
  const isExiting = phase === 'exit';
  const isShaking = phase === 'slam';

  return (
    <div
      className={[
        'splash-screen',
        isExiting && 'splash-exit',
        isShaking && 'splash-shake',
      ].filter(Boolean).join(' ')}
    >
      {/* Spider-web radial lines */}
      <div className="splash-web-lines" />

      {/* Concentric web rings */}
      <div className="splash-web-rings" />

      {/* Main content */}
      <div className="splash-content">
        <div className={`splash-bugle ${showHeader ? 'splash-bugle-visible' : ''}`}>
          <span className="splash-bugle-the">THE</span>
          <h1 className="splash-bugle-title">DAILY BUGLE</h1>
          <div className="splash-bugle-line" />
        </div>

        <h2 className={`splash-main-text ${showSlam ? 'splash-main-text-visible' : ''}`}>
          COME ON<br />SPIDER-MAN!
        </h2>
      </div>

      {/* Impact flash on text slam */}
      <div className={`splash-flash ${showSlam ? 'splash-flash-active' : ''}`} />
    </div>
  );
};

export default SplashScreen;
