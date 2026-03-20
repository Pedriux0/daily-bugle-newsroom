import { useEffect, useRef, useCallback } from 'react';

export type CursorMode = 'peter' | 'spiderman';

interface Point {
  x: number;
  y: number;
  age: number;
  size: number;
  vx: number;
  vy: number;
  opacity: number;
}

const MAX_POINTS = 50;
const POINT_LIFETIME_PETER = 40;   // frames
const POINT_LIFETIME_SPIDEY = 60;  // frames — web strands linger longer

/**
 * Hook that manages a canvas-based cursor trail effect.
 * Returns a ref to attach to a <canvas> element.
 */
const useWebShooter = (mode: CursorMode, enabled: boolean) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pointsRef = useRef<Point[]>([]);
  const mouseRef = useRef({ x: 0, y: 0 });
  const rafRef = useRef<number>(0);
  const prevMouseRef = useRef({ x: 0, y: 0 });

  const handleMouseMove = useCallback((e: MouseEvent) => {
    mouseRef.current = { x: e.clientX, y: e.clientY };
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Size canvas to window
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', handleMouseMove);

    const animate = () => {
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;
      const px = prevMouseRef.current.x;
      const py = prevMouseRef.current.y;

      // Only add points when mouse is moving
      const dist = Math.sqrt((mx - px) ** 2 + (my - py) ** 2);
      if (dist > 2) {
        const lifetime = mode === 'peter' ? POINT_LIFETIME_PETER : POINT_LIFETIME_SPIDEY;

        if (mode === 'peter') {
          // Ink splatter: random offset particles
          const count = Math.min(Math.floor(dist / 5), 4);
          for (let i = 0; i < count; i++) {
            pointsRef.current.push({
              x: mx + (Math.random() - 0.5) * 20,
              y: my + (Math.random() - 0.5) * 20,
              age: 0,
              size: Math.random() * 6 + 2,
              vx: (Math.random() - 0.5) * 2,
              vy: (Math.random() - 0.5) * 2 + 0.5, // slight gravity
              opacity: 1,
            });
          }
        } else {
          // Web strand: points along the path
          pointsRef.current.push({
            x: mx,
            y: my,
            age: 0,
            size: 2,
            vx: 0,
            vy: 0,
            opacity: 1,
          });
        }

        // Trim old points
        if (pointsRef.current.length > MAX_POINTS) {
          pointsRef.current = pointsRef.current.slice(-MAX_POINTS);
        }
      }

      prevMouseRef.current = { x: mx, y: my };

      // Update and draw points
      const lifetime = mode === 'peter' ? POINT_LIFETIME_PETER : POINT_LIFETIME_SPIDEY;

      if (mode === 'peter') {
        // === INK SPLATTER ===
        pointsRef.current.forEach((p) => {
          p.age++;
          p.x += p.vx;
          p.y += p.vy;
          p.vy += 0.05; // gravity
          p.opacity = Math.max(0, 1 - p.age / lifetime);

          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * p.opacity, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(26, 26, 26, ${p.opacity * 0.7})`;
          ctx.fill();

          // Smaller ink dots around main dot
          if (p.age < 5) {
            for (let j = 0; j < 2; j++) {
              const ox = p.x + (Math.random() - 0.5) * 12;
              const oy = p.y + (Math.random() - 0.5) * 12;
              ctx.beginPath();
              ctx.arc(ox, oy, p.size * 0.3 * p.opacity, 0, Math.PI * 2);
              ctx.fillStyle = `rgba(26, 26, 26, ${p.opacity * 0.4})`;
              ctx.fill();
            }
          }
        });
      } else {
        // === NEON WEB STRAND ===
        const points = pointsRef.current;

        if (points.length >= 2) {
          // Draw connected web strand
          ctx.beginPath();
          ctx.moveTo(points[0].x, points[0].y);

          for (let i = 1; i < points.length; i++) {
            const p = points[i];
            ctx.lineTo(p.x, p.y);
          }

          // Neon red glow
          ctx.strokeStyle = 'rgb(255, 255, 255)';
          ctx.lineWidth = 3;
          ctx.shadowColor = 'rgb(253, 253, 253)';
          ctx.shadowBlur = 15;
          ctx.stroke();

          // Thinner bright core
          ctx.beginPath();
          ctx.moveTo(points[0].x, points[0].y);
          for (let i = 1; i < points.length; i++) {
            ctx.lineTo(points[i].x, points[i].y);
          }
          ctx.strokeStyle = 'rgba(255, 100, 100, 0.9)';
          ctx.lineWidth = 1;
          ctx.shadowColor = 'rgba(255, 100, 100, 1)';
          ctx.shadowBlur = 8;
          ctx.stroke();

          // Reset shadow
          ctx.shadowBlur = 0;
        }

        // Draw glowing dots at each point
        points.forEach((p) => {
          p.age++;
          p.opacity = Math.max(0, 1 - p.age / lifetime);

          ctx.beginPath();
          ctx.arc(p.x, p.y, 3 * p.opacity, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(226, 54, 54, ${p.opacity * 0.8})`;
          ctx.shadowColor = 'rgba(226, 54, 54, 0.6)';
          ctx.shadowBlur = 10;
          ctx.fill();
          ctx.shadowBlur = 0;
        });
      }

      // Remove dead points
      pointsRef.current = pointsRef.current.filter((p) => p.age < lifetime);

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      pointsRef.current = [];
    };
  }, [mode, enabled, handleMouseMove]);

  // Clear points when mode changes
  useEffect(() => {
    pointsRef.current = [];
  }, [mode]);

  return canvasRef;
};

export default useWebShooter;
