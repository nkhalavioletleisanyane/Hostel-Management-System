import React, { useEffect, useRef } from 'react';
import { useTheme } from '../../context/ThemeContext';
import '../../styles/wave-background.css';

interface WaveBackgroundProps {
  className?: string;
  opacity?: number;
  speed?: number;
  interactive?: boolean;
  fixed?: boolean;
}

interface Point3D {
  x: number;
  y: number;
  z: number;
  baseX: number;
  baseZ: number;
}

const WaveBackground: React.FC<WaveBackgroundProps> = ({
  className = '',
  opacity = 1,
  speed = 1,
  interactive = true,
  fixed = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { isDark } = useTheme();

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animationFrameId: number;
    let width = 0;
    let height = 0;
    let dpr = 1;

    // Grid configuration
    const COLS = 85;
    const ROWS = 60;
    const points: Point3D[] = [];

    // Initialize 3D grid points
    const initGrid = (w: number) => {
      points.length = 0;
      const gridWidth = Math.max(w * 1.8, 2800);
      const nearZ = 40;
      const farZ = 3300;
      const spacingX = gridWidth / (COLS - 1);
      const spacingZ = (farZ - nearZ) / (ROWS - 1);

      for (let iz = 0; iz < ROWS; iz++) {
        const z = nearZ + iz * spacingZ;
        for (let ix = 0; ix < COLS; ix++) {
          const x = (ix - (COLS - 1) / 2) * spacingX;
          points.push({
            x,
            y: 0,
            z,
            baseX: x,
            baseZ: z,
          });
        }
      }
    };

    const handleResize = () => {
      const rect = container.getBoundingClientRect();
      width = Math.max(rect.width, 320);
      height = Math.max(rect.height, 320);
      dpr = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      initGrid(width);
    };

    handleResize();

    const resizeObserver = new ResizeObserver(() => handleResize());
    resizeObserver.observe(container);

    // Mouse tracking for subtle interactive parallax
    const mouse = {
      x: width / 2,
      y: height / 2,
      normX: 0,
      normY: 0,
      active: false,
    };

    let targetPitch = 0.70;
    let currentPitch = 0.70;
    let targetYaw = 0;
    let currentYaw = 0;

    const handleMouseMove = (e: MouseEvent) => {
      if (!interactive) return;
      const rect = container.getBoundingClientRect();
      const clientX = e.clientX - rect.left;
      const clientY = e.clientY - rect.top;

      mouse.x = clientX;
      mouse.y = clientY;
      mouse.normX = (clientX / width) - 0.5;
      mouse.normY = (clientY / height) - 0.5;
      mouse.active = true;

      targetYaw = mouse.normX * 0.08;
      targetPitch = 0.70 + mouse.normY * 0.06;
    };

    const handleMouseLeave = () => {
      mouse.active = false;
      targetYaw = 0;
      targetPitch = 0.70;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave);

    // Animation loop
    let startTime = performance.now();

    const render = (now: number) => {
      const elapsed = ((now - startTime) / 1000) * speed;

      // Smooth camera interpolation
      currentPitch += (targetPitch - currentPitch) * 0.04;
      currentYaw += (targetYaw - currentYaw) * 0.04;

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, width, height);

      // Center of projection
      const cx = width / 2;
      const cy = height * 0.36;
      const focal = 600;
      const camH = 580;

      const cosPitch = Math.cos(currentPitch);
      const sinPitch = Math.sin(currentPitch);
      const cosYaw = Math.cos(currentYaw);
      const sinYaw = Math.sin(currentYaw);

      // Pre-create 10 color buckets for batched rendering
      // Buckets 0 to 9 represent elevation from lowest trough to highest crest
      const BUCKET_COUNT = 10;
      const buckets: { x: number; y: number; r: number }[][] = Array.from(
        { length: BUCKET_COUNT },
        () => []
      );

      // Wave calculation and projection
      const ptCount = points.length;
      for (let i = 0; i < ptCount; i++) {
        const pt = points[i];
        const px = pt.baseX;
        const pz = pt.baseZ;

        // Composite harmonic wave function matching the topographical undulating waves
        const w1 = Math.sin(px * 0.0018 + pz * 0.0014 + elapsed * 0.92) * 58;
        const w2 = Math.cos(px * 0.0026 - pz * 0.0021 + elapsed * 0.72) * 44;
        const w3 = Math.sin((px * 0.0042 + pz * 0.0031) * 0.8 + elapsed * 1.15) * 22;
        const w4 = Math.cos(px * 0.0011 + elapsed * 0.42) * Math.sin(pz * 0.0013 + elapsed * 0.48) * 30;

        let y = w1 + w2 + w3 + w4;

        // Interactive mouse swell
        if (mouse.active) {
          const screenApproxX = cx + (px * focal) / pz;
          const dx = screenApproxX - mouse.x;
          const dy = (cy + (camH - y) * focal / pz) - mouse.y;
          const distSq = dx * dx + dy * dy;
          if (distSq < 45000) {
            const factor = 1 - Math.sqrt(distSq) / 212;
            y += factor * factor * 35;
          }
        }

        // Camera space transformation
        const camY = camH - y;

        // Yaw rotation
        const xRot = px * cosYaw - pz * sinYaw;
        const zMid = px * sinYaw + pz * cosYaw;

        // Pitch rotation
        const zCam = zMid * cosPitch + camY * sinPitch;
        const yCam = camY * cosPitch - zMid * sinPitch;

        if (zCam < 15) continue;

        const scale = focal / zCam;
        const sx = cx + xRot * scale;
        const sy = cy + yCam * scale;

        // Discard out of view points
        if (sx < -40 || sx > width + 40 || sy < -40 || sy > height + 40) continue;

        // Normalized elevation for styling (0 to 1)
        const normElev = Math.min(Math.max((y + 110) / 220, 0), 0.999);
        const bucketIdx = Math.floor(normElev * BUCKET_COUNT);

        // Dot size scales with perspective depth and crest elevation
        const radius = Math.max(0.65, (1.05 + normElev * 0.85) * (scale * 1.8));

        buckets[bucketIdx].push({ x: sx, y: sy, r: radius });
      }

      // Palette definition for Dark Mode vs Light Mode
      // Dark Mode: Glowing white ridges graduating into cyan, electric indigo and deep space violet
      // Light Mode: Vibrant deep royal indigo ridges graduating into periwinkle, sky blue and soft slate
      const darkPalette = [
        'rgba(90, 105, 140, 0.20)',   // 0: Deepest trough
        'rgba(99, 102, 241, 0.30)',   // 1
        'rgba(110, 120, 245, 0.40)',  // 2
        'rgba(129, 140, 248, 0.50)',  // 3
        'rgba(147, 160, 255, 0.60)',  // 4: Mid slope
        'rgba(165, 185, 255, 0.70)',  // 5
        'rgba(186, 210, 255, 0.80)',  // 6
        'rgba(215, 230, 255, 0.88)',  // 7: High crest
        'rgba(240, 246, 255, 0.94)',  // 8: Ridge
        'rgba(255, 255, 255, 0.98)',  // 9: Peak crest highlight
      ];

      const lightPalette = [
        'rgba(203, 213, 225, 0.30)',  // 0: Deepest trough
        'rgba(165, 180, 210, 0.40)',  // 1
        'rgba(148, 163, 184, 0.50)',  // 2
        'rgba(129, 140, 248, 0.58)',  // 3
        'rgba(99, 102, 241, 0.65)',   // 4: Mid slope
        'rgba(88, 92, 235, 0.72)',    // 5
        'rgba(79, 70, 229, 0.80)',    // 6
        'rgba(71, 62, 210, 0.86)',    // 7: High crest
        'rgba(67, 56, 202, 0.92)',    // 8: Ridge
        'rgba(49, 46, 129, 0.98)',    // 9: Peak crest
      ];

      const palette = isDark ? darkPalette : lightPalette;

      // Render dots in batched path calls (one per bucket)
      for (let b = 0; b < BUCKET_COUNT; b++) {
        const bucket = buckets[b];
        if (bucket.length === 0) continue;

        ctx.fillStyle = palette[b];

        // Add subtle bloom glow to top crest ridges in dark mode
        if (isDark && b >= 8) {
          ctx.shadowColor = 'rgba(255, 255, 255, 0.6)';
          ctx.shadowBlur = b === 9 ? 6 : 3;
        } else {
          ctx.shadowColor = 'transparent';
          ctx.shadowBlur = 0;
        }

        ctx.beginPath();
        for (let j = 0; j < bucket.length; j++) {
          const pt = bucket[j];
          ctx.moveTo(pt.x + pt.r, pt.y);
          ctx.arc(pt.x, pt.y, pt.r, 0, Math.PI * 2);
        }
        ctx.fill();
      }

      ctx.restore();
      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [isDark, speed, interactive]);

  return (
    <div
      ref={containerRef}
      className={`wave-canvas-container ${fixed ? 'wave-fixed' : ''} ${className}`}
      style={{ opacity }}
      aria-hidden="true"
    >
      <canvas ref={canvasRef} className="wave-canvas" />
      <div className="wave-ambient-vignette" />
    </div>
  );
};

export default WaveBackground;
