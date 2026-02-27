import { useEffect, useRef } from 'react';

interface ExerciseCanvasProps {
  exerciseId: string;
  isActive: boolean;
  reducedMotion: boolean;
}

type Point = { x: number; y: number };

const toRad = (deg: number) => (deg * Math.PI) / 180;

const polar = (origin: Point, length: number, angleRad: number): Point => ({
  x: origin.x + Math.cos(angleRad) * length,
  y: origin.y + Math.sin(angleRad) * length,
});

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

const lerpPoint = (a: Point, b: Point, t: number): Point => ({
  x: lerp(a.x, b.x, t),
  y: lerp(a.y, b.y, t),
});

const solveJoint = (root: Point, end: Point, lenA: number, lenB: number, bendDirection: 1 | -1): Point => {
  const dx = end.x - root.x;
  const dy = end.y - root.y;
  const d = Math.max(0.001, Math.hypot(dx, dy));
  const reach = Math.min(Math.max(d, Math.abs(lenA - lenB) + 0.001), lenA + lenB - 0.001);
  const a = (lenA * lenA - lenB * lenB + reach * reach) / (2 * reach);
  const h = Math.sqrt(Math.max(lenA * lenA - a * a, 0));
  const ux = dx / d;
  const uy = dy / d;
  const midX = root.x + ux * a;
  const midY = root.y + uy * a;
  return {
    x: midX + -uy * h * bendDirection,
    y: midY + ux * h * bendDirection,
  };
};

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
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const bodyColor = 'hsl(221, 18%, 72%)';
    const jointColor = 'rgba(170, 182, 206, 0.75)';
    const equipmentColor = 'hsl(218, 16%, 42%)';
    const quadColor = 'hsl(177, 52%, 48%)';
    const adductorColor = 'hsl(36, 72%, 58%)';

    const line = (a: Point, b: Point, color = bodyColor, width = 2.4) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    };

    const circle = (center: Point, radius: number, color = bodyColor, width = 1.6) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.beginPath();
      ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
      ctx.stroke();
    };

    const joint = (p: Point) => {
      ctx.fillStyle = jointColor;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2.4, 0, Math.PI * 2);
      ctx.fill();
    };

    const glowSegment = (a: Point, b: Point, color: string, alpha = 0.28) => {
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = color;
      ctx.lineWidth = 4.6;
      ctx.shadowColor = color;
      ctx.shadowBlur = 14;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
      ctx.restore();
    };

    const arrow = (from: Point, to: Point, color = equipmentColor) => {
      line(from, to, color, 1.5);
      const angle = Math.atan2(to.y - from.y, to.x - from.x);
      const left = polar(to, 7, angle + Math.PI - toRad(28));
      const right = polar(to, 7, angle + Math.PI + toRad(28));
      line(to, left, color, 1.5);
      line(to, right, color, 1.5);
    };

    const pose = (parts: {
      head: Point;
      neck: Point;
      shoulder: Point;
      hip: Point;
      elbowA: Point;
      handA: Point;
      elbowB: Point;
      handB: Point;
      kneeLead: Point;
      ankleLead: Point;
      kneeTrail: Point;
      ankleTrail: Point;
    }) => {
      circle(parts.head, 8);

      line(parts.head, parts.neck);
      line(parts.neck, parts.shoulder);
      line(parts.shoulder, parts.hip);

      line(parts.shoulder, parts.elbowA);
      line(parts.elbowA, parts.handA);
      line(parts.shoulder, parts.elbowB);
      line(parts.elbowB, parts.handB);

      line(parts.hip, parts.kneeLead);
      line(parts.kneeLead, parts.ankleLead);
      line(parts.hip, parts.kneeTrail);
      line(parts.kneeTrail, parts.ankleTrail);

      [parts.hip, parts.kneeLead, parts.ankleLead, parts.kneeTrail, parts.ankleTrail].forEach(joint);
    };

    const drawFrame = () => {
      const freeze = reducedMotion || !isActive;
      const speed = freeze ? 0 : 1;
      timeRef.current += 0.016 * speed;
      const t = timeRef.current;
      const cycle = (1 - Math.cos((t * 2 * Math.PI) / 4.8)) / 2;
      const pulse = freeze ? 0.6 : (1 + Math.sin((t * 2 * Math.PI) / 1.9)) / 2;

      ctx.clearRect(0, 0, w, h);

      switch (exerciseId) {
        case 'bike': {
          const floorY = 236;
          const crank = { x: 194, y: 176 };
          const pedalRadius = 30;
          const pedalAngle = freeze ? toRad(24) : (t * 2 * Math.PI) / 4.8;
          const pedalLead = polar(crank, pedalRadius, pedalAngle);
          const pedalTrail = polar(crank, pedalRadius, pedalAngle + Math.PI);
          const hip = { x: 130, y: 214 };
          const shoulder = { x: 92, y: 204 };
          const neck = { x: 79, y: 199 };
          const head = { x: 65, y: 194 };
          const handTop = { x: 101, y: 220 };
          const handLow = { x: 121, y: 222 };
          const elbowTop = { x: 90, y: 214 };
          const elbowLow = { x: 109, y: 216 };
          const kneeLead = solveJoint(hip, pedalLead, 48, 46, -1);
          const kneeTrail = solveJoint(hip, pedalTrail, 48, 46, 1);

          line({ x: 36, y: floorY }, { x: 262, y: floorY }, equipmentColor, 1.4);
          circle(crank, pedalRadius, 'rgba(107, 118, 143, 0.45)', 1.2);
          line(crank, pedalLead, equipmentColor, 1.3);
          line(crank, pedalTrail, equipmentColor, 1.3);
          arrow({ x: crank.x + 34, y: crank.y + 2 }, { x: crank.x + 42, y: crank.y + 10 }, equipmentColor);

          pose({
            head,
            neck,
            shoulder,
            hip,
            elbowA: elbowTop,
            handA: handTop,
            elbowB: elbowLow,
            handB: handLow,
            kneeLead,
            ankleLead: pedalLead,
            kneeTrail,
            ankleTrail: pedalTrail,
          });
          break;
        }

        case 'extension': {
          const pull = freeze ? 0.8 : cycle;
          const floorY = 238;
          const hip = { x: 130, y: 214 };
          const shoulder = { x: 111, y: 170 };
          const neck = { x: 103, y: 158 };
          const head = { x: 95, y: 145 };
          const activeKnee = { x: 186, y: 218 };
          const activeAnkle = { x: 234, y: 224 };
          const supportKnee = { x: 157, y: 196 };
          const supportAnkle = { x: 171, y: floorY };

          line({ x: 44, y: floorY }, { x: 258, y: floorY }, equipmentColor, 1.4);

          const handPullA = { x: 121, y: 184 };
          const handPullB = { x: 130, y: 191 };
          const handReleaseA = { x: 166, y: 196 };
          const handReleaseB = { x: 173, y: 202 };
          const handA = lerpPoint(handReleaseA, handPullA, pull);
          const handB = lerpPoint(handReleaseB, handPullB, pull);
          const elbowA = solveJoint(shoulder, handA, 27, 25, -1);
          const elbowB = solveJoint(shoulder, handB, 28, 24, 1);

          pose({
            head,
            neck,
            shoulder,
            hip,
            elbowA,
            handA,
            elbowB,
            handB,
            kneeLead: activeKnee,
            ankleLead: activeAnkle,
            kneeTrail: supportKnee,
            ankleTrail: supportAnkle,
          });

          line(activeAnkle, handA, adductorColor, 1.7);
          line(activeAnkle, handB, adductorColor, 1.7);
          line(activeAnkle, { x: activeAnkle.x + 9, y: activeAnkle.y + 4 }, adductorColor, 1.7);
          glowSegment(shoulder, handA, quadColor, 0.1 + pull * 0.16);
          glowSegment(shoulder, handB, quadColor, 0.1 + pull * 0.16);
          break;
        }

        case 'slr': {
          const floorY = 228;
          const raise = freeze ? 78 : 10 + cycle * 80;
          const raiseAngle = -toRad(raise);
          const hip = { x: 130, y: 213 };
          const shoulder = { x: 92, y: 203 };
          const neck = { x: 79, y: 198 };
          const head = { x: 65, y: 193 };
          const activeKnee = polar(hip, 45, raiseAngle);
          const activeAnkle = polar(hip, 92, raiseAngle);
          const supportKnee = { x: 164, y: 188 };
          const supportAnkle = { x: 186, y: floorY };

          line({ x: 40, y: floorY }, { x: 260, y: floorY }, equipmentColor, 1.4);

          pose({
            head,
            neck,
            shoulder,
            hip,
            elbowA: { x: 88, y: 212 },
            handA: { x: 104, y: 219 },
            elbowB: { x: 108, y: 214 },
            handB: { x: 127, y: 220 },
            kneeLead: activeKnee,
            ankleLead: activeAnkle,
            kneeTrail: supportKnee,
            ankleTrail: supportAnkle,
          });

          glowSegment(hip, activeKnee, quadColor, 0.28);
          break;
        }

        case 'stepups': {
          const drive = freeze ? 0.54 : cycle;
          const riseY = -18 * drive;
          const floorY = 232;
          const stepTopY = 198;
          const hip = { x: 148 + drive * 3, y: 178 + riseY };
          const shoulder = { x: 147 + drive * 4, y: 136 + riseY };
          const neck = { x: 147 + drive * 4, y: 124 + riseY };
          const head = { x: 147 + drive * 4, y: 111 + riseY };
          const stanceAnkle = { x: 196, y: stepTopY };
          const stanceKnee = { x: 181 + drive * 1.4, y: 167 + riseY };
          const trailAnkle = { x: 130, y: floorY };
          const trailKnee = { x: 142 + drive, y: 205 + riseY * 0.25 };

          line({ x: 38, y: floorY }, { x: 262, y: floorY }, equipmentColor, 1.4);
          ctx.fillStyle = 'rgba(66, 74, 87, 0.55)';
          ctx.fillRect(174, stepTopY, 82, 14);

          pose({
            head,
            neck,
            shoulder,
            hip,
            elbowA: { x: 162, y: 152 + riseY },
            handA: { x: 167, y: 176 + riseY },
            elbowB: { x: 132, y: 153 + riseY },
            handB: { x: 128, y: 177 + riseY },
            kneeLead: stanceKnee,
            ankleLead: stanceAnkle,
            kneeTrail: trailKnee,
            ankleTrail: trailAnkle,
          });

          glowSegment(hip, stanceKnee, quadColor, 0.22);
          arrow({ x: 227, y: 186 }, { x: 227, y: 150 }, equipmentColor);
          break;
        }

        case 'adductors': {
          const lift = freeze ? 0.62 : cycle;
          const floorY = 230;
          const hip = { x: 128, y: 196 };
          const shoulder = { x: 98, y: 184 };
          const neck = { x: 84, y: 179 };
          const head = { x: 70, y: 174 };
          const movingAngle = toRad(12 - lift * 30);
          const movingKnee = polar(hip, 44, movingAngle);
          const movingAnkle = polar(hip, 90, movingAngle);
          const topKnee = { x: 172, y: 191 };
          const topAnkle = { x: 154, y: floorY };

          line({ x: 38, y: floorY }, { x: 262, y: floorY }, equipmentColor, 1.4);

          pose({
            head,
            neck,
            shoulder,
            hip,
            elbowA: { x: 84, y: 195 },
            handA: { x: 97, y: 206 },
            elbowB: { x: 116, y: 207 },
            handB: { x: 138, y: 212 },
            kneeLead: movingKnee,
            ankleLead: movingAnkle,
            kneeTrail: topKnee,
            ankleTrail: topAnkle,
          });

          glowSegment(hip, movingKnee, adductorColor, 0.32);
          break;
        }

        case 'isometric': {
          const floorY = 228;
          const hip = { x: 128, y: 207 };
          const activeKnee = { x: 172, y: 207 };
          const activeAnkle = { x: 216, y: 207 };
          const supportKnee = { x: 158, y: 214 };
          const supportAnkle = { x: 190, y: 226 };

          line({ x: 38, y: floorY }, { x: 262, y: floorY }, equipmentColor, 1.4);

          pose({
            head: { x: 68, y: 186 },
            neck: { x: 80, y: 190 },
            shoulder: { x: 94, y: 194 },
            hip,
            elbowA: { x: 109, y: 208 },
            handA: { x: 128, y: 214 },
            elbowB: { x: 121, y: 206 },
            handB: { x: 141, y: 211 },
            kneeLead: activeKnee,
            ankleLead: activeAnkle,
            kneeTrail: supportKnee,
            ankleTrail: supportAnkle,
          });

          glowSegment(hip, activeKnee, quadColor, 0.14 + pulse * 0.22);
          break;
        }
      }

      if (!freeze) {
        animRef.current = requestAnimationFrame(drawFrame);
      }
    };

    drawFrame();
    return () => cancelAnimationFrame(animRef.current);
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
