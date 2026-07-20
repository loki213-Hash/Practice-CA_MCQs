import React, { useEffect, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getCourses } from "../services/courseService";

function ChakraDial() {
  const [revealed, setRevealed] = useState(0);
  const [pct, setPct] = useState(0);

  const total = 24;
  const mastered = 15; // Demo master value
  const targetPct = Math.round((mastered / total) * 100);

  useEffect(() => {
    const interval = setInterval(() => {
      setRevealed((prev) => {
        if (prev >= total) {
          clearInterval(interval);
          return prev;
        }
        return prev + 1;
      });
    }, 55);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (targetPct === 0) return;
    const interval = setInterval(() => {
      setPct((prev) => {
        if (prev >= targetPct) {
          clearInterval(interval);
          return prev;
        }
        return prev + 1;
      });
    }, 1400 / targetPct);

    return () => clearInterval(interval);
  }, [targetPct]);

  const cx = 150, cy = 150, rInner = 98, rOuter = 130;

  const spokes = useMemo(() => {
    const arr = [];
    for (let i = 0; i < total; i++) {
      const angle = (i / total) * 2 * Math.PI - Math.PI / 2;
      const x1 = cx + rInner * Math.cos(angle);
      const y1 = cy + rInner * Math.sin(angle);
      const x2 = cx + rOuter * Math.cos(angle);
      const y2 = cy + rOuter * Math.sin(angle);
      const isMastered = i < mastered;
      const isRevealed = i < revealed;

      arr.push(
        <line
          key={i}
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          strokeWidth="5"
          strokeLinecap="round"
          stroke={isMastered ? "#1F6E43" : "rgba(11, 37, 69, 0.14)"}
          strokeDasharray={rOuter - rInner}
          strokeDashoffset={isRevealed ? 0 : rOuter - rInner}
          style={{
            transition: "stroke-dashoffset 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        />
      );
    }
    return arr;
  }, [revealed]);

  return (
    <div className="dial-wrap">
      <div className="dial-card">
        <svg id="chakraDial" viewBox="0 0 300 300">
          <circle cx="150" cy="150" r="132" fill="#fff" stroke="var(--hairline)" strokeWidth="1" />
          <g id="spokeGroup">{spokes}</g>
          <circle cx="150" cy="150" r="96" fill="#fff" stroke="var(--hairline)" strokeWidth="1" />
          <circle cx="150" cy="150" r="6" fill="var(--navy)" />
        </svg>
        <div className="dial-center">
          <div className="pct">{pct}%</div>
          <div className="sub">Accuracy this week</div>
          <div className="score">{mastered} / {total} chapters mastered</div>
        </div>
        <div className="dial-caption">Live progress — 24 chapters, 24 spokes</div>
      </div>
    </div>
  );
}

function Home() {
  const [courses, setCourses] = useState([]);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    async function loadCourses() {
      try {
        setCourses(await getCourses());
      } catch (loadError) {
        setError("Courses could not be loaded. Please refresh the page.");
        console.error(loadError);
      }
    }
    loadCourses();
  }, []);

  const cardData = useMemo(() => {
    return courses.map((course) => {
      const slug = course.course_slug.toLowerCase();
      let themeClass = "foundation";
      let tag = "Entry level";
      let desc = course.course_name;
      let papers = "4";
      let mcqs = "6,400";
      let mocks = "120";
      let ctaText = `Practice ${course.course_name}`;

      if (slug.includes("spom")) {
        themeClass = "foundation";
        tag = "Self Paced Module";
        desc = "FEMA, FCRA, and corporate laws — practice Set A and Set B chapters individually with instant explanations.";
        papers = "2 Sets";
        mcqs = "1,200+";
        mocks = "24";
        ctaText = "Practice SPOM";
      } else if (slug.includes("advitt") || slug.includes("itt")) {
        themeClass = "inter";
        tag = "IT stage";
        desc = "Advanced Integrated IT Training & Testing MCQ preparation based on the latest pattern.";
        papers = "2 Papers";
        mcqs = "2,400+";
        mocks = "48";
        ctaText = "Practice Adv ITT";
      } else if (slug.includes("final")) {
        themeClass = "final";
        tag = "Final stage";
        desc = "Advanced Auditing, Strategic Financial Management, Direct & Indirect Tax - timed mock papers.";
        papers = "8 Papers";
        mcqs = "15,900+";
        mocks = "180";
        ctaText = "CA Final";
      }

      return {
        ...course,
        themeClass,
        tag,
        desc,
        papers,
        mcqs,
        mocks,
        ctaText,
      };
    });
  }, [courses]);

  return (
    <div className="home-page">
      <div className="ambient"></div>
      <div className="hairline-strip"></div>

      {/* ---------- Nav ---------- */}
      <header>
        <Link className="brand" to="/">
          <div className="emblem">
            <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
              <circle cx="50" cy="50" r="45" fill="none" stroke="#0B2545" strokeWidth="3" strokeDasharray="2.2 3.7" opacity="0.6" />
              <circle cx="50" cy="50" r="33" fill="#0B2545" />
              <text x="50" y="60" textAnchor="middle" fontFamily="Fraunces, serif" fontWeight="700" fontSize="30" fill="#F7F4EC">CA</text>
              <path d="M 62 78 C 74 70, 84 62, 92 50 C 82 56, 72 60, 63 62 Z" fill="#E08D3C" />
              <path d="M 60 84 C 73 78, 84 70, 93 58 C 82 66, 71 70, 61 71 Z" fill="#1F6E43" />
            </svg>
          </div>
          <div className="brand-name">
            <span className="top">CA MCQ Practice</span>
            <span className="bottom">Made preparation Easy</span>
          </div>
        </Link>

        <nav className="links">
          <a href="https://www.icai.org/" target="_blank" rel="noopener noreferrer">ICAI Official Site</a>
          <a href="https://boslive.icai.org/" target="_blank" rel="noopener noreferrer">ICAI BOS Site</a>
          <a href="https://eservices.icai.org/" target="_blank" rel="noopener noreferrer">ICAI SSP Site</a>
        </nav>

        <div className="nav-actions">
          <button type="button" className="btn-ghost">Login</button>
          <button type="button" className="btn-solid">Continue as Guest</button>
        </div>
      </header>

      {/* ---------- Hero ---------- */}
      <main className="hero">
        <div className="hero-copy">
          <span className="eyebrow">
            <span className="dot"></span>18,400 aspirants practising right now
          </span>
          <h1>
            CA MCQ Practice — <em>Made preparation Easy.</em>
          </h1>
          <p className="lede">
            Chapter-wise and full-length MCQ tests for SPOM, Adv ITT and CA Final — built on the latest ICAI pattern, with instant explanations and a dashboard that tells you exactly which chapter is costing you marks.
          </p>
          <div className="hero-ctas">
            <a href="#levels" className="btn-primary">
              Begin a free mock test <span>→</span>
            </a>
            <a href="#how" className="btn-secondary">See how scoring works</a>
          </div>

          <div className="trust-row">
            <div className="trust-item">
              <span className="num">42,000+</span>
              <span className="lbl">MCQs across all 3 levels</span>
            </div>
            <div className="trust-item">
              <span className="num">6.2 L</span>
              <span className="lbl">Tests attempted to date</span>
            </div>
            <div className="trust-item">
              <span className="num">92%</span>
              <span className="lbl">Say weak-chapter finder helped</span>
            </div>
          </div>
        </div>

        <ChakraDial />
      </main>

      {/* ---------- Levels ---------- */}
      <section id="levels">
        <div className="section-head">
          <div>
            <span className="kicker">Choose your level</span>
            <h2>One platform, all three stages of the CA journey.</h2>
          </div>
          <p>
            Every level is mapped chapter-by-chapter to the current ICAI syllabus, updated after each amendment.
          </p>
        </div>

        {error && <p style={{ color: "red", gridColumn: "1/-1", marginBottom: 20 }}>{error}</p>}

        <div className="levels">
          {cardData.map((course) => {
            const isAvailable = course.available;
            return (
              <div className={`level-card ${course.themeClass}`} key={course.id}>
                <div className="stripe"></div>
                <span className="tag">{course.tag}</span>
                <h3>{course.course_name === "CA Final" ? "CA Final" : course.course_name}</h3>
                <p>{course.desc}</p>
                <div className="level-meta">
                  <div>
                    <span className="n">{course.papers}</span>
                    <span className="l">Papers</span>
                  </div>
                  <div>
                    <span className="n">{course.mcqs}</span>
                    <span className="l">MCQs</span>
                  </div>
                  <div>
                    <span className="n">{course.mocks}</span>
                    <span className="l">Mock sets</span>
                  </div>
                </div>

                {isAvailable ? (
                  <Link
                    to={`/course/${course.course_slug}`}
                    className="cta"
                    style={{ cursor: "pointer" }}
                  >
                    {course.ctaText} <span className="arrow">→</span>
                  </Link>
                ) : (
                  <span className="cta" style={{ opacity: 0.5 }}>
                    Coming Soon 🕐
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ---------- How it works ---------- */}
      <section id="how">
        <div className="section-head">
          <div>
            <span className="kicker">How it works</span>
            <h2>From first MCQ to exam-day confidence.</h2>
          </div>
        </div>
        <div className="how">
          <div className="how-step">
            <span className="idx">01</span>
            <h4>Pick a chapter</h4>
            <p>
              Jump into any chapter across SPOM, Adv ITT or CA Final, or let us suggest one from your weak list.
            </p>
          </div>
          <div className="how-step">
            <span className="idx">02</span>
            <h4>Attempt timed sets</h4>
            <p>
              Sets of 20–100 MCQs, timed to match actual paper pacing, with negative-marking toggle.
            </p>
          </div>
          <div className="how-step">
            <span className="idx">03</span>
            <h4>Read the explanation</h4>
            <p>
              Every question links back to the exact ICAI module page and standard/section it tests.
            </p>
          </div>
          <div className="how-step">
            <span className="idx">04</span>
            <h4>Track the dial</h4>
            <p>
              Your chapter-mastery dial fills in as your accuracy holds above 80% across three attempts.
            </p>
          </div>
        </div>
      </section>

      {/* ---------- CTA Banner ---------- */}
      <section id="pricing">
        <div className="cta-banner">
          <div>
            <h3>Your next mock test is two taps away.</h3>
            <p>
              Free chapter tests forever. Unlock full-length timed papers and rank analysis with the Plus plan.
            </p>
          </div>
          <a href="#levels" className="btn-primary">
            Start practising free →
          </a>
        </div>
      </section>

      {/* ---------- Footer ---------- */}
      <footer>
        <div className="foot-grid">
          <div className="foot-brand">
            <div className="brand">
              <div className="emblem" style={{ width: 34, height: 34 }}>
                <svg viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="45" fill="none" stroke="#0B2545" strokeWidth="3" strokeDasharray="2.2 3.7" opacity="0.6" />
                  <circle cx="50" cy="50" r="33" fill="#0B2545" />
                  <text x="50" y="60" textAnchor="middle" fontFamily="Fraunces, serif" fontWeight="700" fontSize="30" fill="#F7F4EC">CA</text>
                </svg>
              </div>
              <div className="brand-name">
                <span className="top">CA MCQ Practice</span>
              </div>
            </div>
            <p>
              An independent MCQ practice platform for CA aspirants. Not affiliated with or endorsed by ICAI.
            </p>
          </div>
          <div className="foot-cols">
            <div className="foot-col">
              <h5>Practice</h5>
              <a href="#levels">SPOM</a>
              <a href="#levels">Adv ITT</a>
              <a href="#levels">CA Final</a>
            </div>
            <div className="foot-col">
              <h5>Platform</h5>
              <a href="#levels">Mock tests</a>
              <a href="#levels">Progress dashboard</a>
              <a href="#pricing">Pricing</a>
            </div>
            <div className="foot-col">
              <h5>Company</h5>
              <a href="#levels">About</a>
              <a href="#levels">Support</a>
            </div>
          </div>
        </div>
        <div className="foot-bottom">
          <span>© 2026 CA MCQ Practice.</span>
          <span>Made for aspirants, chapter by chapter.</span>
        </div>
      </footer>
    </div>
  );
}

export default Home;
