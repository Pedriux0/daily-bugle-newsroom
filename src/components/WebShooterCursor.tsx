import React from 'react';
import useWebShooter, { CursorMode } from '../hooks/useWebShooter';

interface WebShooterCursorProps {
  mode: CursorMode;
  enabled: boolean;
}

const WebShooterCursor: React.FC<WebShooterCursorProps> = ({ mode, enabled }) => {
  const canvasRef = useWebShooter(mode, enabled);

  if (!enabled) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-[9999] pointer-events-none"
      aria-hidden="true"
    />
  );
};

export default WebShooterCursor;
