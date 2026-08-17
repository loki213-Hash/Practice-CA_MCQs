import { useState, useRef } from "react";

export default function CosmicSpotlightCard({
  theme = "cyan", // 'cyan' | 'emerald' | 'amber' | 'rose'
  icon = "👥",
  badgeText = "LIVE",
  value = "0",
  label = "Metric Label",
  subtext = "",
  trend = "",
  chartType = "line", // 'line' | 'equalizer' | 'progress'
  progressPct = 100,
}) {
  const cardRef = useRef(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 });

  const themeColors = {
    cyan: {
      spotlight: "rgba(56, 189, 248, 0.22)",
      border: "rgba(56, 189, 248, 0.45)",
      badgeBg: "rgba(56, 189, 248, 0.12)",
      badgeText: "#38bdf8",
      badgeBorder: "rgba(56, 189, 248, 0.3)",
      glow: "0 12px 35px rgba(56, 189, 248, 0.22)",
      iconBg: "linear-gradient(135deg, rgba(56, 189, 248, 0.2) 0%, rgba(99, 102, 241, 0.2) 100%)",
      chartStroke: "#38bdf8",
    },
    emerald: {
      spotlight: "rgba(52, 211, 153, 0.22)",
      border: "rgba(52, 211, 153, 0.45)",
      badgeBg: "rgba(52, 211, 153, 0.12)",
      badgeText: "#34d399",
      badgeBorder: "rgba(52, 211, 153, 0.3)",
      glow: "0 12px 35px rgba(52, 211, 153, 0.22)",
      iconBg: "linear-gradient(135deg, rgba(52, 211, 153, 0.2) 0%, rgba(16, 185, 129, 0.2) 100%)",
      chartStroke: "#34d399",
    },
    amber: {
      spotlight: "rgba(251, 191, 36, 0.22)",
      border: "rgba(251, 191, 36, 0.45)",
      badgeBg: "rgba(251, 191, 36, 0.12)",
      badgeText: "#fbbf24",
      badgeBorder: "rgba(251, 191, 36, 0.3)",
      glow: "0 12px 35px rgba(251, 191, 36, 0.22)",
      iconBg: "linear-gradient(135deg, rgba(251, 191, 36, 0.2) 0%, rgba(217, 119, 6, 0.2) 100%)",
      chartStroke: "#fbbf24",
    },
    rose: {
      spotlight: "rgba(244, 63, 94, 0.22)",
      border: "rgba(244, 63, 94, 0.45)",
      badgeBg: "rgba(244, 63, 94, 0.12)",
      badgeText: "#fb7185",
      badgeBorder: "rgba(244, 63, 94, 0.3)",
      glow: "0 12px 35px rgba(244, 63, 94, 0.22)",
      iconBg: "linear-gradient(135deg, rgba(244, 63, 94, 0.2) 0%, rgba(225, 29, 72, 0.2) 100%)",
      chartStroke: "#fb7185",
    },
    purple: {
      spotlight: "rgba(168, 85, 247, 0.22)",
      border: "rgba(168, 85, 247, 0.45)",
      badgeBg: "rgba(168, 85, 247, 0.12)",
      badgeText: "#c084fc",
      badgeBorder: "rgba(168, 85, 247, 0.3)",
      glow: "0 12px 35px rgba(168, 85, 247, 0.22)",
      iconBg: "linear-gradient(135deg, rgba(168, 85, 247, 0.2) 0%, rgba(139, 92, 246, 0.2) 100%)",
      chartStroke: "#c084fc",
    },
    indigo: {
      spotlight: "rgba(99, 102, 241, 0.22)",
      border: "rgba(99, 102, 241, 0.45)",
      badgeBg: "rgba(99, 102, 241, 0.12)",
      badgeText: "#818cf8",
      badgeBorder: "rgba(99, 102, 241, 0.3)",
      glow: "0 12px 35px rgba(99, 102, 241, 0.22)",
      iconBg: "linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(79, 70, 229, 0.2) 100%)",
      chartStroke: "#818cf8",
    },
  };

  const t = themeColors[theme] || themeColors.cyan;

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setMousePos({ x, y });

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rx = ((y - centerY) / centerY) * -4.5;
    const ry = ((x - centerX) / centerX) * 4.5;
    setTilt({ rx, ry });
  };

  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => {
    setIsHovered(false);
    setTilt({ rx: 0, ry: 0 });
  };

  return (
    <div
      ref={cardRef}
      className={`refined-cosmic-card ${theme}`}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: isHovered
          ? `perspective(1000px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg) translateZ(6px)`
          : "perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0px)",
        transition: isHovered ? "transform 0.08s ease-out" : "transform 0.5s ease-out",
        borderColor: isHovered ? t.border : "rgba(255, 255, 255, 0.12)",
        boxShadow: isHovered
          ? `0 20px 40px rgba(0, 0, 0, 0.6), ${t.glow}`
          : "0 10px 30px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
      }}
    >
      {/* Dynamic Cursor Light Spotlight Layer */}
      <div
        className="card-spotlight-beam"
        style={{
          opacity: isHovered ? 1 : 0,
          background: `radial-gradient(300px circle at ${mousePos.x}px ${mousePos.y}px, ${t.spotlight}, transparent 75%)`,
        }}
      />

      {/* Top Header Row */}
      <div className="card-top-row">
        <div
          className="card-icon-orb"
          style={{
            background: t.iconBg,
            borderColor: t.badgeBorder,
          }}
        >
          {icon}
        </div>
        <div
          className="card-badge-pill"
          style={{
            background: t.badgeBg,
            color: t.badgeText,
            borderColor: t.badgeBorder,
          }}
        >
          {badgeText}
        </div>
      </div>

      {/* Main Metric Section */}
      <div className="card-metric-section">
        <div className="card-stat-value">
          {value}
          {trend && <span className="card-trend-tag">{trend}</span>}
        </div>
        <div className="card-stat-label">{label}</div>
      </div>

      {/* Mini Dynamic Visual Chart / Visual Accent */}
      <div className="card-visual-footer">
        {chartType === "line" && (
          <svg className="mini-chart-svg" viewBox="0 0 120 30">
            <defs>
              <linearGradient id={`grad-${theme}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={t.chartStroke} stopOpacity="0.4" />
                <stop offset="100%" stopColor={t.chartStroke} stopOpacity="0" />
              </linearGradient>
            </defs>
            <path
              d="M0,22 Q20,12 40,18 T80,8 T120,14 L120,30 L0,30 Z"
              fill={`url(#grad-${theme})`}
            />
            <path
              d="M0,22 Q20,12 40,18 T80,8 T120,14"
              fill="none"
              stroke={t.chartStroke}
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </svg>
        )}

        {chartType === "equalizer" && (
          <div className="equalizer-bars-wrap">
            <div className="eq-bar eq1" style={{ background: t.chartStroke }}></div>
            <div className="eq-bar eq2" style={{ background: t.chartStroke }}></div>
            <div className="eq-bar eq3" style={{ background: t.chartStroke }}></div>
            <div className="eq-bar eq4" style={{ background: t.chartStroke }}></div>
            <div className="eq-bar eq5" style={{ background: t.chartStroke }}></div>
          </div>
        )}

        {chartType === "progress" && (
          <div className="card-progress-bar-track">
            <div
              className="card-progress-bar-fill"
              style={{
                width: `${Math.min(100, Math.max(5, progressPct))}%`,
                background: `linear-gradient(90deg, ${t.chartStroke}, #ffffff)`,
              }}
            />
          </div>
        )}

        {subtext && <span className="card-subtext">{subtext}</span>}
      </div>
    </div>
  );
}
