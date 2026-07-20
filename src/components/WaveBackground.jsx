import React, { useEffect, useRef } from "react";

export default function WaveBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Wave properties
    const waves = [
      {
        y: height * 0.8,
        length: 0.002,
        amplitude: 60,
        frequency: 0.015,
        color: "rgba(59, 130, 246, 0.15)", // Blue
      },
      {
        y: height * 0.82,
        length: 0.0015,
        amplitude: 45,
        frequency: 0.01,
        color: "rgba(16, 185, 129, 0.12)", // Teal
      },
      {
        y: height * 0.78,
        length: 0.0025,
        amplitude: 30,
        frequency: 0.02,
        color: "rgba(139, 92, 246, 0.08)", // Purple
      },
    ];

    // Ripple wave droplets triggered by mouse movement
    let ripples = [];
    let mouse = { x: null, y: null, active: false };

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      waves[0].y = height * 0.8;
      waves[1].y = height * 0.82;
      waves[2].y = height * 0.78;
    };

    const handleMouseMove = (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      mouse.active = true;

      // Spawn a ripple on mouse move (throttle it slightly by limiting active count)
      if (ripples.length < 35 && Math.random() < 0.25) {
        ripples.push({
          x: e.clientX,
          y: e.clientY,
          radius: 1,
          maxRadius: Math.random() * 80 + 40,
          opacity: 0.8,
          speed: Math.random() * 2 + 1.5,
        });
      }
    };

    const handleMouseLeave = () => {
      mouse.active = false;
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseleave", handleMouseLeave);

    let increment = 0;

    // Draw animation loop
    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      // 1. Draw flowing sine waves at the bottom of screen
      increment += 0.5;
      waves.forEach((wave) => {
        ctx.beginPath();
        ctx.moveTo(0, height);
        ctx.lineTo(0, wave.y);

        for (let i = 0; i < width; i++) {
          // Add a sine function + slightly modulate based on mouse x positioning
          const mouseFactor = mouse.active ? (mouse.x - i) * 0.0001 : 0;
          ctx.lineTo(
            i,
            wave.y +
              Math.sin(i * wave.length + increment * wave.frequency + mouseFactor) *
                wave.amplitude
          );
        }

        ctx.lineTo(width, height);
        ctx.fillStyle = wave.color;
        ctx.fill();
        ctx.closePath();
      });

      // 2. Draw interactive ripple waves following mouse
      ripples.forEach((ripple, index) => {
        ripple.radius += ripple.speed;
        ripple.opacity -= 0.015;

        if (ripple.opacity <= 0 || ripple.radius >= ripple.maxRadius) {
          ripples.splice(index, 1);
          return;
        }

        // Draw concentric circle ripples (water waves)
        ctx.beginPath();
        ctx.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(147, 197, 253, ${ripple.opacity * 0.25})`; // Soft light blue
        ctx.lineWidth = 2.5;
        ctx.stroke();
        ctx.closePath();

        ctx.beginPath();
        ctx.arc(ripple.x, ripple.y, ripple.radius * 0.6, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(52, 211, 153, ${ripple.opacity * 0.15})`; // Soft light green/teal
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.closePath();
      });

      // 3. Draw a glowing cursor particle
      if (mouse.active && mouse.x !== null) {
        const gradient = ctx.createRadialGradient(
          mouse.x,
          mouse.y,
          0,
          mouse.x,
          mouse.y,
          100
        );
        gradient.addColorStop(0, "rgba(59, 130, 246, 0.08)");
        gradient.addColorStop(1, "rgba(59, 130, 246, 0)");
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, 100, 0, Math.PI * 2);
        ctx.fill();
      }

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 0,
      }}
    />
  );
}
