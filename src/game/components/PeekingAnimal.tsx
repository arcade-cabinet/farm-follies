/**
 * Peeking Animal Component
 * An animated animal that peeks out from the sides of the screen
 */

import { animate } from "animejs";
import { useCallback, useEffect, useRef, useState } from "react";
import { GAME_CONFIG } from "../config";

interface PeekingAnimalProps {
  scale?: number;
}

export function PeekingAnimal({ scale = 1 }: PeekingAnimalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [side, setSide] = useState<"left" | "right">("left");
  const [isBlinking, setIsBlinking] = useState(false);
  const blinkTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const peekTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const animationRef = useRef<ReturnType<typeof animate> | null>(null);

  const baseWidth = 120 * scale;
  const baseHeight = 140 * scale;

  // Draw the peeking animal
  const drawPeekingAnimal = useCallback(
    (ctx: CanvasRenderingContext2D, blinking: boolean) => {
      const w = baseWidth;
      const h = baseHeight;

      ctx.clearRect(0, 0, w * 2, h * 2);
      ctx.save();

      // Center the duck
      const centerX = side === "left" ? w * 0.7 : w * 0.3;
      const centerY = h * 0.55;
      ctx.translate(centerX, centerY);

      // Flip if on right side
      if (side === "right") {
        ctx.scale(-1, 1);
      }

      const dw = w * 0.8;
      const dh = h * 0.7;

      // Shadow
      ctx.fillStyle = "rgba(0,0,0,0.15)";
      ctx.beginPath();
      ctx.ellipse(0, dh * 0.4, dw * 0.35, dh * 0.12, 0, 0, Math.PI * 2);
      ctx.fill();

      // Body
      ctx.fillStyle = GAME_CONFIG.colors.duck.body;
      ctx.strokeStyle = GAME_CONFIG.colors.duck.outline;
      ctx.lineWidth = 2.5 * scale;
      ctx.beginPath();
      ctx.ellipse(0, 0, dw * 0.4, dh * 0.4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Arm (peeking pose - one arm visible holding edge)
      ctx.fillStyle = GAME_CONFIG.colors.duck.body;
      ctx.beginPath();
      ctx.ellipse(-dw * 0.35, -dh * 0.05, dw * 0.12, dh * 0.2, 0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Head
      ctx.fillStyle = GAME_CONFIG.colors.duck.body;
      ctx.beginPath();
      ctx.ellipse(0, -dh * 0.35, dw * 0.35, dh * 0.35, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Hair tufts
      ctx.beginPath();
      ctx.moveTo(0, -dh * 0.65);
      ctx.lineTo(0, -dh * 0.75);
      ctx.moveTo(-5 * scale, -dh * 0.63);
      ctx.lineTo(-10 * scale, -dh * 0.73);
      ctx.moveTo(5 * scale, -dh * 0.63);
      ctx.lineTo(10 * scale, -dh * 0.73);
      ctx.stroke();

      // Beak
      ctx.fillStyle = GAME_CONFIG.colors.duck.beak;
      ctx.beginPath();
      ctx.ellipse(0, -dh * 0.28, dw * 0.22, dh * 0.1, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Nostrils
      ctx.fillStyle = GAME_CONFIG.colors.duck.outline;
      ctx.beginPath();
      ctx.arc(-4 * scale, -dh * 0.32, 1.5 * scale, 0, Math.PI * 2);
      ctx.arc(4 * scale, -dh * 0.32, 1.5 * scale, 0, Math.PI * 2);
      ctx.fill();

      // Eyes
      if (blinking) {
        // Closed eyes (happy squint)
        ctx.strokeStyle = GAME_CONFIG.colors.duck.outline;
        ctx.lineWidth = 2 * scale;
        ctx.beginPath();
        ctx.arc(-dw * 0.12, -dh * 0.42, 6 * scale, 0.2, Math.PI - 0.2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(dw * 0.12, -dh * 0.42, 6 * scale, 0.2, Math.PI - 0.2);
        ctx.stroke();
      } else {
        // Open eyes
        ctx.fillStyle = "#FFF";
        ctx.strokeStyle = GAME_CONFIG.colors.duck.outline;
        ctx.lineWidth = 2 * scale;

        // Left eye
        ctx.beginPath();
        ctx.ellipse(-dw * 0.12, -dh * 0.42, dw * 0.1, dh * 0.09, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Right eye
        ctx.beginPath();
        ctx.ellipse(dw * 0.12, -dh * 0.42, dw * 0.1, dh * 0.09, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Pupils (looking curiously)
        ctx.fillStyle = "#000";
        ctx.beginPath();
        ctx.arc(-dw * 0.1, -dh * 0.42, 3 * scale, 0, Math.PI * 2);
        ctx.arc(dw * 0.14, -dh * 0.42, 3 * scale, 0, Math.PI * 2);
        ctx.fill();

        // Eye shine
        ctx.fillStyle = "#FFF";
        ctx.beginPath();
        ctx.arc(-dw * 0.08, -dh * 0.44, 1.5 * scale, 0, Math.PI * 2);
        ctx.arc(dw * 0.16, -dh * 0.44, 1.5 * scale, 0, Math.PI * 2);
        ctx.fill();
      }

      // Blush marks (cute!)
      ctx.fillStyle = "rgba(255, 150, 150, 0.4)";
      ctx.beginPath();
      ctx.ellipse(-dw * 0.22, -dh * 0.32, dw * 0.06, dh * 0.03, 0, 0, Math.PI * 2);
      ctx.ellipse(dw * 0.22, -dh * 0.32, dw * 0.06, dh * 0.03, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    },
    [baseWidth, baseHeight, side, scale]
  );

  // Render loop for canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = baseWidth * 2;
    canvas.height = baseHeight * 2;

    drawPeekingAnimal(ctx, isBlinking);
  }, [drawPeekingAnimal, isBlinking, baseWidth, baseHeight]);

  // Random blinking
  useEffect(() => {
    const scheduleBlink = () => {
      const delay = 2000 + Math.random() * 3000;
      blinkTimeoutRef.current = setTimeout(() => {
        setIsBlinking(true);
        setTimeout(
          () => {
            setIsBlinking(false);
            scheduleBlink();
          },
          150 + Math.random() * 100
        );
      }, delay);
    };

    scheduleBlink();

    return () => {
      if (blinkTimeoutRef.current) clearTimeout(blinkTimeoutRef.current);
    };
  }, []);

  // Peek animation cycle
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const doPeek = () => {
      // Randomly choose side
      const newSide = Math.random() > 0.5 ? "left" : "right";
      setSide(newSide);

      // Reset position
      container.style.transform = newSide === "left" ? `translateX(-100%)` : `translateX(100%)`;

      // Peek in animation
      animationRef.current = animate(container, {
        translateX: newSide === "left" ? "-30%" : "30%",
        duration: 800,
        ease: "outBack",
        onComplete: () => {
          // Hold for a bit, maybe do extra blinks
          setTimeout(
            () => {
              // Peek out animation
              animationRef.current = animate(container, {
                translateX: newSide === "left" ? "-100%" : "100%",
                duration: 600,
                ease: "inBack",
                onComplete: () => {
                  // Schedule next peek
                  peekTimeoutRef.current = setTimeout(doPeek, 3000 + Math.random() * 4000);
                },
              });
            },
            2000 + Math.random() * 2000
          );
        },
      });
    };

    // Initial peek after a short delay
    peekTimeoutRef.current = setTimeout(doPeek, 1000);

    return () => {
      if (peekTimeoutRef.current) clearTimeout(peekTimeoutRef.current);
      if (animationRef.current) animationRef.current.pause();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed z-10 pointer-events-none"
      style={{
        [side]: 0,
        bottom: "10%",
        transform: side === "left" ? "translateX(-100%)" : "translateX(100%)",
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          width: baseWidth,
          height: baseHeight,
        }}
      />
    </div>
  );
}
