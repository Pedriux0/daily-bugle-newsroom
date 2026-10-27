import React, { useEffect, useState } from 'react';
import useWebShooter, { CursorMode } from '../hooks/useWebShooter';

interface WebShooterCursorProps {
  mode: CursorMode;
  enabled: boolean;
}

const WebShooterCursor: React.FC<WebShooterCursorProps> = ({ mode, enabled }) => {
  // Only mount the full-screen canvas once a real mouse moves — touch screens never need it
  const [hasMouse, setHasMouse] = useState(false);
  const canvasRef = useWebShooter(mode, enabled && hasMouse);

  useEffect(() => {
    if (hasMouse) return;
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === 'mouse') setHasMouse(true);
    };
    window.addEventListener('pointermove', onMove);
    return () => window.removeEventListener('pointermove', onMove);
  }, [hasMouse]);

  if (!enabled || !hasMouse) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-[9999] pointer-events-none"
      aria-hidden="true"
    />
  );
};

export default WebShooterCursor;
