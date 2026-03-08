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
        /* ── Bike: upright seated posture on stationary bike ── */
        case 'bike': {
          const floorY = 240;
          const seatX = 130;
          const seatY = 168;
          const crank = { x: 180, y: 210 };
          const pedalRadius = 28;
          const pedalAngle = freeze ? toRad(30) : (t * 2 * Math.PI) / 4.8;
          const pedalLead = polar(crank, pedalRadius, pedalAngle);
          const pedalTrail = polar(crank, pedalRadius, pedalAngle + Math.PI);

          const hip = { x: seatX, y: seatY };
          const shoulder = { x: seatX - 4, y: seatY - 48 };
          const neck = { x: seatX - 2, y: seatY - 56 };
          const head = { x: seatX, y: seatY - 68 };

          // Handlebars
          const handlebarBase = { x: 178, y: 148 };
          const handleLeft = { x: 172, y: 142 };
          const handleRight = { x: 184, y: 142 };

          const kneeLead = solveJoint(hip, pedalLead, 46, 44, 1);
          const kneeTrail = solveJoint(hip, pedalTrail, 46, 44, 1);

          // Bike frame
          line({ x: 40, y: floorY }, { x: 260, y: floorY }, equipmentColor, 1.4);
          // Seat post
          line({ x: seatX, y: seatY }, { x: seatX + 4, y: floorY - 10 }, equipmentColor, 1.8);
          // Seat
          line({ x: seatX - 12, y: seatY }, { x: seatX + 12, y: seatY }, equipmentColor, 2.2);
          // Down tube to crank
          line({ x: seatX + 4, y: floorY - 10 }, crank, equipmentColor, 1.5);
          // Head tube to handlebars
          line(crank, { x: 185, y: floorY - 10 }, equipmentColor, 1.5);
          line({ x: 185, y: floorY - 10 }, handlebarBase, equipmentColor, 1.5);
          line(handleLeft, handleRight, equipmentColor, 2);
          // Wheels (simplified)
          circle({ x: 85, y: floorY - 14 }, 13, 'rgba(107,118,143,0.3)', 1.2);
          circle({ x: 220, y: floorY - 14 }, 13, 'rgba(107,118,143,0.3)', 1.2);
          // Crank circle
          circle(crank, pedalRadius, 'rgba(107, 118, 143, 0.35)', 1.0);
          line(crank, pedalLead, equipmentColor, 1.3);
          line(crank, pedalTrail, equipmentColor, 1.3);

          // Arms reach to handlebars
          const elbowA = solveJoint(shoulder, handleLeft, 24, 22, 1);
          const elbowB = solveJoint(shoulder, handleRight, 24, 22, 1);

          pose({
            head, neck, shoulder, hip,
            elbowA, handA: handleLeft,
            elbowB, handB: handleRight,
            kneeLead, ankleLead: pedalLead,
            kneeTrail, ankleTrail: pedalTrail,
          });

          // Quad glow on driving leg
          glowSegment(hip, kneeLead, quadColor, 0.18);
          break;
        }

        /* ── Extension: SEATED on bench, extending lower leg against band ── */
        case 'extension': {
          const ext = freeze ? 0.75 : cycle;
          const floorY = 242;
          const benchTopY = 188;

          // Draw bench
          ctx.fillStyle = 'rgba(66, 74, 87, 0.5)';
          ctx.fillRect(60, benchTopY, 80, 10);
          // Bench legs
          line({ x: 68, y: benchTopY + 10 }, { x: 68, y: floorY }, equipmentColor, 1.5);
          line({ x: 132, y: benchTopY + 10 }, { x: 132, y: floorY }, equipmentColor, 1.5);
          line({ x: 40, y: floorY }, { x: 260, y: floorY }, equipmentColor, 1.4);

          // Person seated on bench edge
          const hip = { x: 120, y: benchTopY - 4 };
          const shoulder = { x: 108, y: benchTopY - 52 };
          const neck = { x: 106, y: benchTopY - 60 };
          const head = { x: 104, y: benchTopY - 72 };

          // Thigh horizontal on bench, knee at edge
          const knee = { x: 156, y: benchTopY - 2 };
          // Lower leg swings: bent (hanging) → extended (horizontal)
          const ankleDown: Point = { x: 160, y: floorY - 8 };
          const ankleUp: Point = { x: 210, y: benchTopY - 4 };
          const ankle = lerpPoint(ankleDown, ankleUp, ext);

          // Non-active leg: foot on floor
          const supportKnee = { x: 95, y: benchTopY + 20 };
          const supportAnkle = { x: 90, y: floorY - 2 };

          // Arms resting on bench edge / thigh
          const elbowA = { x: 96, y: benchTopY - 22 };
          const handA = { x: 110, y: benchTopY - 6 };
          const elbowB = { x: 126, y: benchTopY - 22 };
          const handB = { x: 136, y: benchTopY - 6 };

          pose({
            head, neck, shoulder, hip,
            elbowA, handA,
            elbowB, handB,
            kneeLead: knee, ankleLead: ankle,
            kneeTrail: supportKnee, ankleTrail: supportAnkle,
          });

          // Resistance band: from ankle to anchor below bench
          const bandAnchor = { x: 70, y: floorY - 6 };
          line(ankle, bandAnchor, adductorColor, 1.6);
          // Small band loop at ankle
          circle(ankle, 4, adductorColor, 1.2);

          // Quad glow
          glowSegment(hip, knee, quadColor, 0.16 + ext * 0.2);
          glowSegment(knee, ankle, quadColor, 0.1 + ext * 0.14);
          break;
        }

        /* ── SLR: SUPINE (lying on back), raising straight leg ── */
        case 'slr': {
          const raise = freeze ? 55 : 5 + cycle * 60;
          const raiseAngle = -toRad(raise);
          const floorY = 208;
          const matY = floorY - 4;

          // Mat
          ctx.fillStyle = 'rgba(66, 74, 87, 0.35)';
          ctx.fillRect(30, matY, 240, 6);

          // Person lying on back (horizontal), head to left
          const hip = { x: 168, y: matY - 6 };
          const shoulder = { x: 100, y: matY - 8 };
          const neck = { x: 82, y: matY - 9 };
          const head = { x: 64, y: matY - 10 };

          // Support leg: knee slightly bent, foot flat
          const supportKnee = { x: 198, y: matY - 26 };
          const supportAnkle = { x: 210, y: matY - 2 };

          // Active leg: straight, raising from hip
          const thighLen = 46;
          const shinLen = 44;
          const activeKnee = polar(hip, thighLen, raiseAngle);
          const activeAnkle = polar(hip, thighLen + shinLen, raiseAngle);

          // Arms at sides
          const elbowA = { x: 88, y: matY + 6 };
          const handA = { x: 76, y: matY + 10 };
          const elbowB = { x: 130, y: matY + 5 };
          const handB = { x: 145, y: matY + 8 };

          pose({
            head, neck, shoulder, hip,
            elbowA, handA,
            elbowB, handB,
            kneeLead: activeKnee, ankleLead: activeAnkle,
            kneeTrail: supportKnee, ankleTrail: supportAnkle,
          });

          // Quad highlight on raising leg
          glowSegment(hip, activeKnee, quadColor, 0.28);
          glowSegment(activeKnee, activeAnkle, quadColor, 0.16);

          // Motion arrow
          const arrowStart = polar(hip, thighLen + shinLen + 8, raiseAngle - toRad(10));
          const arrowEnd = polar(hip, thighLen + shinLen + 8, raiseAngle + toRad(10));
          arrow(arrowEnd, arrowStart, equipmentColor);
          break;
        }

        /* ── Step-ups: stepping onto platform ── */
        case 'stepups': {
          const drive = freeze ? 0.5 : cycle;
          const riseY = -20 * drive;
          const floorY = 238;
          const stepTopY = 202;
          const stepH = floorY - stepTopY;

          // Platform / step
          line({ x: 38, y: floorY }, { x: 262, y: floorY }, equipmentColor, 1.4);
          ctx.fillStyle = 'rgba(66, 74, 87, 0.55)';
          ctx.fillRect(155, stepTopY, 100, stepH);
          ctx.strokeStyle = equipmentColor;
          ctx.lineWidth = 1.2;
          ctx.strokeRect(155, stepTopY, 100, stepH);

          const hip = { x: 165 + drive * 6, y: 170 + riseY };
          const shoulder = { x: 162 + drive * 5, y: 126 + riseY };
          const neck = { x: 161 + drive * 5, y: 114 + riseY };
          const head = { x: 160 + drive * 5, y: 101 + riseY };

          // Stance leg on step
          const stanceKnee = solveJoint(hip, { x: 192, y: stepTopY }, 46, 44, 1);
          const stanceAnkle = { x: 192, y: stepTopY };

          // Trail leg: lifts off ground as body rises
          const trailAnkleY = lerp(floorY - 2, stepTopY + 6, Math.max(0, drive * 1.4 - 0.2));
          const trailAnkle = { x: 140 + drive * 10, y: trailAnkleY };
          const trailKnee = solveJoint(hip, trailAnkle, 46, 44, -1);

          // Arms swing naturally
          const elbowA = { x: 175 + drive * 4, y: 145 + riseY };
          const handA = { x: 180 + drive * 3, y: 166 + riseY };
          const elbowB = { x: 148 + drive * 3, y: 144 + riseY };
          const handB = { x: 143 + drive * 2, y: 165 + riseY };

          pose({
            head, neck, shoulder, hip,
            elbowA, handA,
            elbowB, handB,
            kneeLead: stanceKnee, ankleLead: stanceAnkle,
            kneeTrail: trailKnee, ankleTrail: trailAnkle,
          });

          // Quad glow on stance (driving) leg
          glowSegment(hip, stanceKnee, quadColor, 0.18 + drive * 0.14);
          // Direction arrow
          arrow({ x: 230, y: stepTopY + 10 }, { x: 230, y: stepTopY - 24 }, equipmentColor);
          break;
        }

        /* ── Adductors: SIDE-LYING, lifting bottom leg ── */
        case 'adductors': {
          const lift = freeze ? 0.55 : cycle;
          const floorY = 232;
          const matY = floorY - 4;

          // Mat
          ctx.fillStyle = 'rgba(66, 74, 87, 0.35)';
          ctx.fillRect(30, matY, 240, 6);

          // Person lying on their side, head to left, facing viewer
          // Body is slightly elevated off mat (on their side)
          const bodyY = matY - 16;
          const hip = { x: 170, y: bodyY };
          const shoulder = { x: 95, y: bodyY - 6 };
          const neck = { x: 78, y: bodyY - 8 };
          const head = { x: 58, y: bodyY - 10 };

          // Bottom arm: propping head up
          const elbowA = { x: 72, y: bodyY + 8 };
          const handA = { x: 60, y: bodyY - 4 }; // under head
          // Top arm: resting on hip or floor in front
          const elbowB = { x: 130, y: bodyY - 14 };
          const handB = { x: 150, y: bodyY + 2 };

          // Top leg: bent, foot on floor in front for stability
          const topKnee = { x: 186, y: bodyY - 22 };
          const topAnkle = { x: 200, y: matY - 2 };

          // Bottom leg (working): straight, lifts upward
          const bottomLegAngle = toRad(5 - lift * 25); // lifts from ~5° to ~-20°
          const bottomKnee = polar(hip, 44, bottomLegAngle);
          const bottomAnkle = polar(hip, 88, bottomLegAngle);

          pose({
            head, neck, shoulder, hip,
            elbowA, handA,
            elbowB, handB,
            kneeLead: bottomKnee, ankleLead: bottomAnkle,
            kneeTrail: topKnee, ankleTrail: topAnkle,
          });

          // Ankle weight indicator
          circle(bottomAnkle, 5, adductorColor, 1.8);

          // Adductor glow on inner thigh of bottom leg
          glowSegment(hip, bottomKnee, adductorColor, 0.24 + lift * 0.16);
          glowSegment(bottomKnee, bottomAnkle, adductorColor, 0.12 + lift * 0.1);

          // Motion arrow
          const arrowBase = polar(hip, 95, bottomLegAngle + toRad(8));
          const arrowTip = polar(hip, 95, bottomLegAngle - toRad(8));
          arrow(arrowBase, arrowTip, equipmentColor);
          break;
        }

        /* ── Isometric: SEATED, leg extended, quad squeeze ── */
        case 'isometric': {
          const floorY = 242;
          const benchTopY = 192;

          // Bench / chair
          ctx.fillStyle = 'rgba(66, 74, 87, 0.5)';
          ctx.fillRect(55, benchTopY, 90, 10);
          line({ x: 63, y: benchTopY + 10 }, { x: 63, y: floorY }, equipmentColor, 1.5);
          line({ x: 137, y: benchTopY + 10 }, { x: 137, y: floorY }, equipmentColor, 1.5);
          // Back rest
          line({ x: 58, y: benchTopY }, { x: 55, y: benchTopY - 50 }, equipmentColor, 1.8);
          line({ x: 40, y: floorY }, { x: 260, y: floorY }, equipmentColor, 1.4);

          const hip = { x: 108, y: benchTopY - 4 };
          const shoulder = { x: 78, y: benchTopY - 50 };
          const neck = { x: 74, y: benchTopY - 58 };
          const head = { x: 72, y: benchTopY - 70 };

          // Active leg: fully extended straight out
          const knee = { x: 162, y: benchTopY - 2 };
          const ankle = { x: 218, y: benchTopY - 4 };

          // Support leg: foot on floor
          const supportKnee = { x: 92, y: benchTopY + 22 };
          const supportAnkle = { x: 86, y: floorY - 2 };

          // Arms on thigh / at sides
          const elbowA = { x: 72, y: benchTopY - 22 };
          const handA = { x: 90, y: benchTopY - 6 };
          const elbowB = { x: 120, y: benchTopY - 20 };
          const handB = { x: 132, y: benchTopY - 4 };

          pose({
            head, neck, shoulder, hip,
            elbowA, handA,
            elbowB, handB,
            kneeLead: knee, ankleLead: ankle,
            kneeTrail: supportKnee, ankleTrail: supportAnkle,
          });

          // Pulsing quad glow for isometric hold
          glowSegment(hip, knee, quadColor, 0.18 + pulse * 0.26);
          glowSegment(knee, ankle, quadColor, 0.1 + pulse * 0.14);

          // "Contract" indicator - tense lines around quad
          const midThigh = lerpPoint(hip, knee, 0.5);
          const glowR = 8 + pulse * 4;
          ctx.save();
          ctx.globalAlpha = 0.12 + pulse * 0.12;
          ctx.strokeStyle = quadColor;
          ctx.lineWidth = 1;
          ctx.setLineDash([3, 4]);
          ctx.beginPath();
          ctx.arc(midThigh.x, midThigh.y, glowR, 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.restore();
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
