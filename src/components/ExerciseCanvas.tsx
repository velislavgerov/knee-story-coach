import { useRef, useEffect } from 'react';

interface ExerciseCanvasProps {
  exerciseId: string;
  isActive: boolean;
  reducedMotion: boolean;
}

// Cinematic canvas — slow breathing pulse, gentle parallax drift, soft glow
export default function ExerciseCanvas({ exerciseId, isActive, reducedMotion }: ExerciseCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const timeRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const w = 300;
    const h = 300;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);

    const primaryColor = 'hsl(174, 50%, 42%)';
    const primaryRgba = 'rgba(60, 180, 160,';
    const accentColor = 'hsl(38, 60%, 52%)';
    const accentRgba = 'rgba(200, 160, 90,';
    const bodyColor = 'hsl(220, 12%, 60%)';

    function drawStickFigure(ctx: CanvasRenderingContext2D, cx: number, cy: number, scale: number, pose: any) {
      ctx.strokeStyle = bodyColor;
      ctx.lineWidth = 2.5 * scale;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // Head
      ctx.beginPath();
      ctx.arc(cx + (pose.headX || 0), cy - 60 * scale + (pose.headY || 0), 11 * scale, 0, Math.PI * 2);
      ctx.stroke();

      // Body
      ctx.beginPath();
      ctx.moveTo(cx + (pose.headX || 0), cy - 48 * scale + (pose.headY || 0));
      ctx.lineTo(cx + (pose.hipX || 0), cy + (pose.hipY || 0));
      ctx.stroke();

      // Arms
      ctx.beginPath();
      ctx.moveTo(cx + (pose.lArmX1 || -25 * scale), cy + (pose.lArmY1 || -30 * scale));
      ctx.lineTo(cx + (pose.headX || 0), cy - 35 * scale + (pose.headY || 0));
      ctx.lineTo(cx + (pose.rArmX1 || 25 * scale), cy + (pose.rArmY1 || -30 * scale));
      ctx.stroke();

      // Highlight muscle group with soft glow
      if (pose.highlightQuads) {
        ctx.strokeStyle = primaryColor;
        ctx.lineWidth = 4 * scale;
        ctx.shadowColor = `${primaryRgba} 0.25)`;
        ctx.shadowBlur = 18;
      }

      if (pose.highlightAdductors) {
        ctx.strokeStyle = accentColor;
        ctx.lineWidth = 4 * scale;
        ctx.shadowColor = `${accentRgba} 0.25)`;
        ctx.shadowBlur = 18;
      }

      // Left leg
      ctx.beginPath();
      ctx.moveTo(cx + (pose.hipX || 0), cy + (pose.hipY || 0));
      ctx.lineTo(cx + (pose.lKneeX || -12 * scale), cy + (pose.lKneeY || 35 * scale));
      ctx.lineTo(cx + (pose.lFootX || -12 * scale), cy + (pose.lFootY || 70 * scale));
      ctx.stroke();

      // Right leg
      ctx.beginPath();
      ctx.moveTo(cx + (pose.hipX || 0), cy + (pose.hipY || 0));
      ctx.lineTo(cx + (pose.rKneeX || 12 * scale), cy + (pose.rKneeY || 35 * scale));
      ctx.lineTo(cx + (pose.rFootX || 12 * scale), cy + (pose.rFootY || 70 * scale));
      ctx.stroke();

      ctx.shadowBlur = 0;
      ctx.shadowColor = 'transparent';
    }

    function draw(t: number) {
      // Slower speed for cinematic feel
      const speed = reducedMotion ? 0.15 : 0.5;
      timeRef.current += 0.016 * speed;
      const time = timeRef.current;

      ctx.clearRect(0, 0, w, h);

      // Subtle parallax drift
      const driftX = Math.sin(time * 0.3) * 2;
      const driftY = Math.cos(time * 0.2) * 1.5;

      const cx = w / 2 + driftX;
      const cy = h / 2 + 20 + driftY;
      const s = 1.2;
      const sin = Math.sin(time * 1.5);
      const cos = Math.cos(time * 1.5);

      switch (exerciseId) {
        case 'bike': {
          const pedalAngle = time * 2;
          const legR = 25;
          drawStickFigure(ctx, cx, cy, s, {
            headY: -10,
            hipY: 10,
            lKneeX: -15 + Math.cos(pedalAngle) * legR * 0.3,
            lKneeY: 30 + Math.sin(pedalAngle) * legR * 0.5,
            lFootX: -20 + Math.cos(pedalAngle) * legR * 0.5,
            lFootY: 60 + Math.sin(pedalAngle) * legR * 0.6,
            rKneeX: 15 + Math.cos(pedalAngle + Math.PI) * legR * 0.3,
            rKneeY: 30 + Math.sin(pedalAngle + Math.PI) * legR * 0.5,
            rFootX: 20 + Math.cos(pedalAngle + Math.PI) * legR * 0.5,
            rFootY: 60 + Math.sin(pedalAngle + Math.PI) * legR * 0.6,
            lArmX1: -30 * s, lArmY1: -15 * s,
            rArmX1: 30 * s, rArmY1: -15 * s,
            highlightQuads: true,
          });
          ctx.strokeStyle = 'hsl(220, 10%, 28%)';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.ellipse(cx, cy + 75 * s, 30 * s, 8 * s, 0, 0, Math.PI * 2);
          ctx.stroke();
          break;
        }
        case 'extension': {
          const ext = Math.abs(sin) * 0.8;
          drawStickFigure(ctx, cx, cy, s, {
            hipY: 10,
            rKneeX: 18 * s,
            rKneeY: 35 * s,
            rFootX: 18 * s + ext * 40,
            rFootY: 35 * s + (1 - ext) * 35,
            lKneeX: -12 * s,
            lKneeY: 35 * s,
            lFootX: -12 * s,
            lFootY: 70 * s,
            highlightQuads: true,
          });
          ctx.strokeStyle = accentColor;
          ctx.lineWidth = 1.5;
          ctx.globalAlpha = 0.5;
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          ctx.moveTo(cx + 18 * s + ext * 40, cy + 35 * s + (1 - ext) * 35);
          ctx.lineTo(cx, cy + 70 * s);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.globalAlpha = 1;
          break;
        }
        case 'slr': {
          const lift = Math.abs(sin) * 0.6;
          const figCy = cy + 40;
          ctx.save();
          ctx.strokeStyle = bodyColor;
          ctx.lineWidth = 2.5 * s;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(cx - 60, figCy);
          ctx.lineTo(cx + 20, figCy);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(cx - 70, figCy, 10 * s, 0, Math.PI * 2);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(cx + 20, figCy);
          ctx.lineTo(cx + 80, figCy);
          ctx.stroke();
          ctx.strokeStyle = primaryColor;
          ctx.lineWidth = 4 * s;
          ctx.shadowColor = `${primaryRgba} 0.2)`;
          ctx.shadowBlur = 18;
          ctx.beginPath();
          ctx.moveTo(cx + 20, figCy);
          ctx.lineTo(cx + 80, figCy - lift * 60);
          ctx.stroke();
          ctx.shadowBlur = 0;
          // Gentle arrow
          if (!reducedMotion) {
            ctx.strokeStyle = primaryColor;
            ctx.lineWidth = 1;
            ctx.globalAlpha = 0.4;
            const ax = cx + 60;
            const ay = figCy - lift * 40 - 10;
            ctx.beginPath();
            ctx.moveTo(ax, ay);
            ctx.lineTo(ax, ay - 12);
            ctx.moveTo(ax - 4, ay - 8);
            ctx.lineTo(ax, ay - 12);
            ctx.lineTo(ax + 4, ay - 8);
            ctx.stroke();
            ctx.globalAlpha = 1;
          }
          ctx.restore();
          break;
        }
        case 'stepups': {
          const phase = (Math.sin(time * 1) + 1) / 2;
          const stepH = 25;
          drawStickFigure(ctx, cx, cy - phase * stepH, s, {
            headY: -phase * 5,
            rKneeX: 12 * s,
            rKneeY: 20 * s + phase * 15,
            rFootX: 15 * s,
            rFootY: 65 * s - phase * 20,
            lKneeX: -12 * s,
            lKneeY: 30 * s + (1 - phase) * 10,
            lFootX: -15 * s,
            lFootY: 70 * s,
            highlightQuads: true,
          });
          ctx.fillStyle = 'hsl(225, 14%, 14%)';
          ctx.fillRect(cx - 30, cy + 65, 60, 15);
          ctx.strokeStyle = 'hsl(220, 10%, 28%)';
          ctx.lineWidth = 1;
          ctx.strokeRect(cx - 30, cy + 65, 60, 15);
          break;
        }
        case 'adductors': {
          const lift = Math.abs(sin) * 0.5;
          const figCy = cy + 30;
          ctx.save();
          ctx.strokeStyle = bodyColor;
          ctx.lineWidth = 2.5 * s;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(cx - 50, figCy);
          ctx.lineTo(cx + 20, figCy);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(cx - 60, figCy - 5, 10 * s, 0, Math.PI * 2);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(cx + 20, figCy);
          ctx.lineTo(cx + 70, figCy + 5);
          ctx.stroke();
          ctx.strokeStyle = accentColor;
          ctx.lineWidth = 4 * s;
          ctx.shadowColor = `${accentRgba} 0.3)`;
          ctx.shadowBlur = 18;
          ctx.beginPath();
          ctx.moveTo(cx + 20, figCy);
          ctx.lineTo(cx + 70, figCy - lift * 50);
          ctx.stroke();
          ctx.shadowBlur = 0;
          ctx.restore();
          break;
        }
        case 'isometric': {
          // Slow breathing pulse
          const pulse = reducedMotion ? 0.5 : (Math.sin(time * 2) + 1) / 2;
          const figCy = cy + 30;
          ctx.save();
          ctx.strokeStyle = bodyColor;
          ctx.lineWidth = 2.5 * s;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(cx - 50, figCy);
          ctx.lineTo(cx + 20, figCy);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(cx - 60, figCy, 10 * s, 0, Math.PI * 2);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(cx + 20, figCy);
          ctx.lineTo(cx + 80, figCy);
          ctx.stroke();
          ctx.strokeStyle = primaryColor;
          ctx.lineWidth = 5 * s;
          ctx.shadowColor = `${primaryRgba} ${0.15 + pulse * 0.25})`;
          ctx.shadowBlur = 20 + pulse * 10;
          ctx.beginPath();
          ctx.moveTo(cx + 20, figCy);
          ctx.lineTo(cx + 55, figCy);
          ctx.stroke();
          ctx.shadowBlur = 0;
          ctx.fillStyle = `${primaryRgba} ${0.3 + pulse * 0.4})`;
          ctx.font = `${10 * s}px Inter`;
          ctx.textAlign = 'center';
          ctx.fillText('HOLD', cx + 38, figCy - 15);
          ctx.restore();
          break;
        }
      }

      if (isActive) {
        animRef.current = requestAnimationFrame(draw);
      }
    }

    if (isActive) {
      animRef.current = requestAnimationFrame(draw);
    } else {
      draw(0);
    }

    return () => {
      cancelAnimationFrame(animRef.current);
    };
  }, [exerciseId, isActive, reducedMotion]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full max-w-[300px] h-[300px] mx-auto"
      style={{ imageRendering: 'auto' }}
      aria-label={`Animated illustration of ${exerciseId} exercise`}
      role="img"
    />
  );
}
