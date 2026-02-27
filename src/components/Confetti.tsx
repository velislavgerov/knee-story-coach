import { useEffect, useRef } from 'react';

interface ConfettiProps {
  active: boolean;
  reducedMotion: boolean;
}

// "Stardust" — gentle glowing particles that drift and fade
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

    const particles: Array<{
      x: number; y: number; r: number;
      color: string; alpha: number; speed: number;
      drift: number; driftSpeed: number; fadeRate: number;
    }> = [];

    const colors = [
      'rgba(80, 200, 180,',   // teal
      'rgba(140, 160, 220,',  // soft blue
      'rgba(200, 180, 140,',  // warm
      'rgba(180, 200, 220,',  // ice
      'rgba(160, 140, 200,',  // lavender
    ];

    for (let i = 0; i < 80; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 2.5 + 0.5,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: Math.random() * 0.6 + 0.2,
        speed: Math.random() * 0.4 + 0.1,
        drift: Math.random() * 20,
        driftSpeed: Math.random() * 0.008 + 0.003,
        fadeRate: Math.random() * 0.001 + 0.0005,
      });
    }

    let frame = 0;
    function animate() {
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height);
      frame++;
      let anyVisible = false;

      particles.forEach(p => {
        p.y -= p.speed;
        p.x += Math.sin(frame * p.driftSpeed) * p.drift * 0.02;
        p.alpha -= p.fadeRate;

        if (p.alpha > 0.01) {
          anyVisible = true;
          ctx!.beginPath();
          ctx!.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx!.fillStyle = `${p.color} ${p.alpha})`;
          ctx!.shadowColor = `${p.color} ${Math.min(p.alpha * 1.5, 0.6)})`;
          ctx!.shadowBlur = 12 + p.r * 4;
          ctx!.fill();
          ctx!.shadowBlur = 0;
        }
      });

      if (anyVisible && frame < 600) {
        animRef.current = requestAnimationFrame(animate);
      }
    }

    // Initial soft glow burst
    const gradient = ctx.createRadialGradient(
      canvas.width / 2, canvas.height / 2, 0,
      canvas.width / 2, canvas.height / 2, canvas.width * 0.4
    );
    gradient.addColorStop(0, 'rgba(80, 200, 180, 0.12)');
    gradient.addColorStop(1, 'rgba(80, 200, 180, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    setTimeout(() => {
      animRef.current = requestAnimationFrame(animate);
    }, 200);

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
