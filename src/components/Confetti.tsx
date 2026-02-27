import { useEffect, useRef } from 'react';

interface ConfettiProps {
  active: boolean;
  reducedMotion: boolean;
}

export default function Confetti({ active, reducedMotion }: ConfettiProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  useEffect(() => {
    if (!active || reducedMotion) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = ['#2dd4a8', '#e8923e', '#60a5fa', '#f472b6', '#a78bfa', '#34d399'];
    const particles: Array<{
      x: number; y: number; w: number; h: number;
      color: string; rotation: number; speed: number; rotSpeed: number;
      wobble: number; wobbleSpeed: number;
    }> = [];

    for (let i = 0; i < 120; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: -Math.random() * canvas.height,
        w: Math.random() * 8 + 4,
        h: Math.random() * 6 + 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        speed: Math.random() * 3 + 2,
        rotSpeed: (Math.random() - 0.5) * 10,
        wobble: Math.random() * 10,
        wobbleSpeed: Math.random() * 0.05 + 0.02,
      });
    }

    let frame = 0;
    function animate() {
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height);
      frame++;
      let allDone = true;

      particles.forEach(p => {
        p.y += p.speed;
        p.rotation += p.rotSpeed;
        p.x += Math.sin(frame * p.wobbleSpeed) * p.wobble * 0.1;

        if (p.y < canvas!.height + 20) allDone = false;

        ctx!.save();
        ctx!.translate(p.x, p.y);
        ctx!.rotate((p.rotation * Math.PI) / 180);
        ctx!.fillStyle = p.color;
        ctx!.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx!.restore();
      });

      if (!allDone && frame < 300) {
        animRef.current = requestAnimationFrame(animate);
      }
    }

    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [active, reducedMotion]);

  if (!active || reducedMotion) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-50"
      aria-hidden="true"
    />
  );
}
