import { useEffect, useRef } from "react";

export default function SpaceBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animationFrameId;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    // Create Starfield
    const STAR_COUNT = 160;
    const stars = Array.from({ length: STAR_COUNT }).map(() => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 1.8 + 0.4,
      alpha: Math.random(),
      speed: Math.random() * 0.02 + 0.005,
      color: ["#ffffff", "#c084fc", "#60a5fa", "#34d399", "#fb7185", "#fde047"][
        Math.floor(Math.random() * 6)
      ],
      twinkleSpeed: (Math.random() * 0.02 + 0.008) * (Math.random() > 0.5 ? 1 : -1),
    }));

    // Floating Cosmic Dust Particles
    const DUST_COUNT = 35;
    const dust = Array.from({ length: DUST_COUNT }).map(() => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.25,
      vy: (Math.random() - 0.5) * 0.25,
      radius: Math.random() * 2.5 + 0.8,
      alpha: Math.random() * 0.4 + 0.15,
      color: "rgba(167, 139, 250, 0.4)",
    }));

    // Shooting Star
    let shootingStar = null;
    const createShootingStar = () => {
      shootingStar = {
        x: Math.random() * width * 0.7,
        y: Math.random() * height * 0.4,
        len: Math.random() * 90 + 50,
        speed: Math.random() * 9 + 7,
        size: Math.random() * 1.5 + 1,
        life: 0,
        maxLife: 35,
      };
    };

    let frameCount = 0;

    const render = () => {
      frameCount++;
      ctx.clearRect(0, 0, width, height);

      // Deep Cosmic Space Gradient Background
      const bgGrad = ctx.createLinearGradient(0, 0, width, height);
      bgGrad.addColorStop(0, "#070913");
      bgGrad.addColorStop(0.5, "#0b1021");
      bgGrad.addColorStop(1, "#04060d");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Render Moving Cosmic Nebulae (Glowing Orbs)
      const t = frameCount * 0.004;
      const neb1X = width * 0.25 + Math.sin(t) * 60;
      const neb1Y = height * 0.3 + Math.cos(t * 0.7) * 45;
      const neb1Grad = ctx.createRadialGradient(neb1X, neb1Y, 10, neb1X, neb1Y, 450);
      neb1Grad.addColorStop(0, "rgba(99, 102, 241, 0.14)");
      neb1Grad.addColorStop(0.5, "rgba(168, 85, 247, 0.07)");
      neb1Grad.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = neb1Grad;
      ctx.fillRect(0, 0, width, height);

      const neb2X = width * 0.78 - Math.cos(t * 0.8) * 70;
      const neb2Y = height * 0.65 + Math.sin(t * 0.5) * 55;
      const neb2Grad = ctx.createRadialGradient(neb2X, neb2Y, 10, neb2X, neb2Y, 500);
      neb2Grad.addColorStop(0, "rgba(16, 185, 129, 0.10)");
      neb2Grad.addColorStop(0.5, "rgba(59, 130, 246, 0.06)");
      neb2Grad.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = neb2Grad;
      ctx.fillRect(0, 0, width, height);

      // Render Twinkling Stars
      stars.forEach((star) => {
        star.alpha += star.twinkleSpeed;
        if (star.alpha > 1) {
          star.alpha = 1;
          star.twinkleSpeed = -Math.abs(star.twinkleSpeed);
        } else if (star.alpha < 0.15) {
          star.alpha = 0.15;
          star.twinkleSpeed = Math.abs(star.twinkleSpeed);
        }

        ctx.save();
        ctx.globalAlpha = star.alpha;
        ctx.fillStyle = star.color;
        if (star.size > 1.2) {
          ctx.shadowBlur = 6;
          ctx.shadowColor = star.color;
        }
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // Render Dust Particles
      dust.forEach((d) => {
        d.x += d.vx;
        d.y += d.vy;
        if (d.x < 0) d.x = width;
        if (d.x > width) d.x = 0;
        if (d.y < 0) d.y = height;
        if (d.y > height) d.y = 0;

        ctx.save();
        ctx.globalAlpha = d.alpha;
        ctx.fillStyle = d.color;
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // Trigger Shooting Stars occasionally
      if (!shootingStar && Math.random() < 0.009) {
        createShootingStar();
      }

      if (shootingStar) {
        shootingStar.x += shootingStar.speed;
        shootingStar.y += shootingStar.speed * 0.5;
        shootingStar.life++;

        const alpha = 1 - shootingStar.life / shootingStar.maxLife;
        ctx.save();
        ctx.globalAlpha = Math.max(0, alpha);
        const grad = ctx.createLinearGradient(
          shootingStar.x,
          shootingStar.y,
          shootingStar.x - shootingStar.len,
          shootingStar.y - shootingStar.len * 0.5
        );
        grad.addColorStop(0, "#ffffff");
        grad.addColorStop(0.3, "#c084fc");
        grad.addColorStop(1, "transparent");
        ctx.strokeStyle = grad;
        ctx.lineWidth = shootingStar.size;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(shootingStar.x, shootingStar.y);
        ctx.lineTo(
          shootingStar.x - shootingStar.len,
          shootingStar.y - shootingStar.len * 0.5
        );
        ctx.stroke();
        ctx.restore();

        if (shootingStar.life >= shootingStar.maxLife) {
          shootingStar = null;
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        pointerEvents: "none",
        zIndex: 0,
      }}
    />
  );
}
