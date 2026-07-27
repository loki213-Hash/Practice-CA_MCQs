import { useEffect, useState } from "react";

function Loading({ text = "Loading...", compact = false }) {
  const [isShut, setIsShut] = useState(false);
  const [isThud, setIsThud] = useState(false);

  useEffect(() => {
    let timeout1, timeout2, timeout3;

    const FLUTTER_MS = 3000;
    const THUD_MS = 180;
    const CLOSED_HOLD = 650;

    function runCycle() {
      timeout1 = setTimeout(() => {
        setIsShut(true);
        setIsThud(true);

        timeout2 = setTimeout(() => {
          setIsThud(false);
        }, THUD_MS);

        timeout3 = setTimeout(() => {
          setIsShut(false);
          runCycle();
        }, CLOSED_HOLD);
      }, FLUTTER_MS);
    }

    runCycle();

    return () => {
      clearTimeout(timeout1);
      clearTimeout(timeout2);
      clearTimeout(timeout3);
    };
  }, []);

  const motes = Array.from({ length: 12 }, (_, i) => {
    const left = (i * 8.3 + (i % 3) * 3).toFixed(1) + "%";
    const delay = ((i * 0.5) % 5).toFixed(1) + "s";
    const duration = (4.5 + (i % 4) * 0.7).toFixed(1) + "s";
    const drift = ((i % 5) * 6 - 12) + "px";
    return { id: i, left, delay, duration, drift };
  });

  return (
    <div className={`athenaeum-stage ${compact ? "small" : ""}`}>
      <div className="athenaeum-glow"></div>
      <div className="athenaeum-motes">
        {motes.map((m) => (
          <div
            key={m.id}
            className="athenaeum-mote"
            style={{
              left: m.left,
              bottom: "0px",
              animationDelay: m.delay,
              animationDuration: m.duration,
              "--drift": m.drift,
            }}
          />
        ))}
      </div>

      <div className="athenaeum-book-scene">
        <div
          className={`athenaeum-book ${isShut ? "shut" : ""} ${isThud ? "thud" : ""}`}
        >
          <div className="athenaeum-back-rim"></div>

          <div className="athenaeum-stack-left">
            <div className="athenaeum-page"></div>
            <div className="athenaeum-page flip athenaeum-d5"></div>
            <div className="athenaeum-page flip athenaeum-d4"></div>
            <div className="athenaeum-page flip athenaeum-d3"></div>
            <div className="athenaeum-page flip athenaeum-d2"></div>
            <div className="athenaeum-page flip athenaeum-d1"></div>
            <div className="athenaeum-page flip athenaeum-d0"></div>
          </div>

          <div className="athenaeum-stack-right">
            <div className="athenaeum-page"></div>
            <div className="athenaeum-page flip athenaeum-d0"></div>
            <div className="athenaeum-page flip athenaeum-d1"></div>
            <div className="athenaeum-page flip athenaeum-d2"></div>
            <div className="athenaeum-page flip athenaeum-d3"></div>
            <div className="athenaeum-page flip athenaeum-d4"></div>
            <div className="athenaeum-page flip athenaeum-d5"></div>
          </div>

          <div className="athenaeum-spine"></div>

          <div className="athenaeum-cover-front">
            <div className="athenaeum-emblem">&#10022;</div>
          </div>

          <div className="athenaeum-bookmark"></div>
        </div>
        <div className="athenaeum-reflection"></div>
      </div>

      {text && <p className="athenaeum-loader-text">{text}</p>}
    </div>
  );
}

export default Loading;
