import { useEffect, useState, useMemo, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getCourses } from "../services/courseService";
import { useAuth } from "../context/AuthContext";
import { getUserProgressStats, initializeUserProgress, getTotalAttemptsCount } from "../services/progressService";
import { getNotificationsForUser, markAsRead } from "../services/notificationService";
import { supabase } from "../supabase/supabase";

function ChakraDial({ masteredCount = 15, totalChapters = 24, accuracy = 63 }) {
  const [revealed, setRevealed] = useState(0);
  const [pct, setPct] = useState(0);
  const dialRef = useRef(null);

  const total = totalChapters;
  const mastered = masteredCount;
  const targetPct = accuracy;

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
  }, [total]);

  useEffect(() => {
    // Reset pct and animate up when targetPct changes
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPct(0);
    if (targetPct === 0) return;
    let currentPct = 0;
    const interval = setInterval(() => {
      currentPct += 1;
      if (currentPct >= targetPct) {
        setPct(targetPct);
        clearInterval(interval);
      } else {
        setPct(currentPct);
      }
    }, Math.max(10, 1400 / targetPct));

    return () => clearInterval(interval);
  }, [targetPct]);

  const handleMouseMove = (e) => {
    const svgEl = dialRef.current;
    if (!svgEl) return;
    const rect = svgEl.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = e.clientX - cx;
    const dy = e.clientY - cy;
    const angleRad = Math.atan2(dy, dx);
    const angleDeg = angleRad * (180 / Math.PI);
    
    svgEl.style.animation = "none";
    svgEl.style.transform = `rotate(${angleDeg + 90}deg)`;
  };

  const handleMouseLeave = () => {
    const svgEl = dialRef.current;
    if (!svgEl) return;
    svgEl.style.transform = "";
    svgEl.style.animation = "spinChakra 100s linear infinite";
  };

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
  }, [revealed, total, mastered]);

  return (
    <div 
      className="dial-wrap"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div className="dial-card">
        <svg 
          id="chakraDial" 
          viewBox="0 0 300 300"
          ref={dialRef}
        >
          <circle cx="150" cy="150" r="132" fill="#fff" stroke="var(--hairline)" strokeWidth="1" />
          <g id="spokeGroup">{spokes}</g>
          <circle cx="150" cy="150" r="96" fill="#fff" stroke="var(--hairline)" strokeWidth="1" />
          <circle cx="150" cy="150" r="3.5" fill="var(--navy)" />
        </svg>
        <div className="dial-center">
          <div className="pct">{pct}%</div>
          <div className="sub">Accuracy this week</div>
          <div className="score">{mastered} / {total} chapters mastered</div>
        </div>
        <div className="dial-caption">Live progress — {total} chapters, {total} spokes</div>
      </div>
    </div>
  );
}

function Home() {
  const [courses, setCourses] = useState([]);
  const [stats, setStats] = useState({});
  const [error, setError] = useState("");
  const [attemptedCount, setAttemptedCount] = useState(0);
  const [realTarget, setRealTarget] = useState(0);
  const [finderRate, setFinderRate] = useState(0);
  const [userStats, setUserStats] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [showNotifInbox, setShowNotifInbox] = useState(false);

  const formatAttemptedCount = (val) => {
    if (val >= 100000) {
      return `${(val / 100000).toFixed(1)} L`;
    }
    return val.toLocaleString();
  };

  // Fetch real attempts count from database
  useEffect(() => {
    async function fetchRealCount() {
      const count = await getTotalAttemptsCount();
      setRealTarget(count);
    }
    fetchRealCount();
  }, []);

  const { user, username, logout } = useAuth();
  const navigate = useNavigate();

  // Load student notifications/inbox messages
  useEffect(() => {
    async function loadNotifications() {
      if (username && username !== "admin") {
        try {
          const data = await getNotificationsForUser(username);
          setNotifications(data);
        } catch (err) {
          console.error("Failed to load notifications:", err);
        }
      }
    }
    loadNotifications();
    // Poll notifications every 60 seconds (down from 8s) to reduce Supabase API usage
    let interval = null;
    if (username && username !== "admin") {
      interval = setInterval(loadNotifications, 60000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [username]);

  useEffect(() => {
    if (username === "admin") {
      navigate("/admin", { replace: true });
    }
  }, [username, navigate]);

  // Load user progress statistics from Supabase
  useEffect(() => {
    async function loadUserStats() {
      if (user) {
        try {
          // Only initialize once per browser session to avoid repeated DB calls
          if (!sessionStorage.getItem("progress_initialized")) {
            await initializeUserProgress();
            sessionStorage.setItem("progress_initialized", "1");
          }
          const progressData = await getUserProgressStats();
          setUserStats(progressData);
        } catch (err) {
          console.error("Error loading progress stats:", err);
        }
      } else {
        setUserStats(null);
      }
    }
    loadUserStats();
  }, [user]);

  // Load courses and dynamic stats from Supabase
  useEffect(() => {
    async function loadCoursesAndStats() {
      try {
        const fetchedCourses = await getCourses();
        setCourses(fetchedCourses);

        // Fetch all chapters and question counts in bulk (only 2 network requests total!)
        const { data: allChapters } = await supabase
          .from("chapters")
          .select("id, course_id");

        const { data: allQuestions } = await supabase
          .from("questions")
          .select("chapter_id")
          .range(0, 99999);

        const setTypesByCourse = {};
        const chaptersByCourse = {};
        if (allChapters) {
          allChapters.forEach((ch) => {
            if (!chaptersByCourse[ch.course_id]) {
              chaptersByCourse[ch.course_id] = [];
            }
            chaptersByCourse[ch.course_id].push(String(ch.id));

            if (ch.set_type) {
              if (!setTypesByCourse[ch.course_id]) {
                setTypesByCourse[ch.course_id] = new Set();
              }
              setTypesByCourse[ch.course_id].add(ch.set_type);
            }
          });
        }

        const questionCountByChapter = {};
        if (allQuestions) {
          allQuestions.forEach((q) => {
            questionCountByChapter[q.chapter_id] = (questionCountByChapter[q.chapter_id] || 0) + 1;
          });
        }

        const statsMap = {};
        fetchedCourses.forEach((course) => {
          const chapterIds = chaptersByCourse[course.id] || [];
          let questionCount = 0;
          chapterIds.forEach((cid) => {
            questionCount += (questionCountByChapter[cid] || 0);
          });
          const setSet = setTypesByCourse[course.id];
          const setCount = setSet && setSet.size > 0 ? setSet.size : chapterIds.length;

          statsMap[course.course_slug.toLowerCase()] = {
            chapterCount: chapterIds.length,
            questionCount: questionCount,
            setCount: setCount,
          };
        });
        setStats(statsMap);
      } catch (loadError) {
        setError("Courses could not be loaded. Please refresh the page.");
        console.error(loadError);
      }
    }
    loadCoursesAndStats();
  }, []);

  // Animate trust row counters
  useEffect(() => {
    let curAttempted = 0;
    const attemptedTarget = realTarget;
    const attemptedStep = Math.max(1, Math.round(attemptedTarget / 20));
    const attemptedInterval = setInterval(() => {
      curAttempted += attemptedStep;
      if (curAttempted >= attemptedTarget) {
        setAttemptedCount(attemptedTarget);
        clearInterval(attemptedInterval);
      } else {
        setAttemptedCount(curAttempted);
      }
    }, 40);

    let curRate = 0;
    const rateTarget = 92;
    const rateInterval = setInterval(() => {
      curRate += 3;
      if (curRate >= rateTarget) {
        setFinderRate(rateTarget);
        clearInterval(rateInterval);
      } else {
        setFinderRate(curRate);
      }
    }, 40);

    return () => {
      clearInterval(attemptedInterval);
      clearInterval(rateInterval);
    };
  }, [realTarget]);

  // Sum total MCQs dynamically from Supabase
  const totalMCQsString = useMemo(() => {
    let sum = 0;
    for (const val of Object.values(stats)) {
      sum += val.questionCount;
    }
    return sum > 0 ? `${sum.toLocaleString()} MCQs` : "Loading...";
  }, [stats]);

  const cardData = useMemo(() => {
    return courses.map((course) => {
      const slug = course.course_slug.toLowerCase();
      const courseStats = stats[slug] || { chapterCount: 0, questionCount: 0, setCount: 0 };
      
      let themeClass = "foundation";
      let tag = "Entry level";
      let desc = course.course_name;
      let papers = courseStats.chapterCount > 0 ? `${courseStats.chapterCount} Chapters` : "Loading...";
      let mcqs = courseStats.questionCount > 0 ? `${courseStats.questionCount.toLocaleString()} MCQs` : "Loading...";
      let mocks = courseStats.setCount > 0 ? `${courseStats.setCount} Practice Sets` : "Loading...";
      let ctaText = `Practice ${course.course_name}`;

      if (slug.includes("spom")) {
        themeClass = "foundation";
        tag = "Self Paced Module";
        desc = "FEMA, FCRA, and corporate laws — practice Set A and Set B chapters individually with instant explanations.";
        papers = courseStats.chapterCount > 0 ? `${courseStats.chapterCount} Chapters` : "...";
        mcqs = courseStats.questionCount > 0 ? `${courseStats.questionCount.toLocaleString()} MCQs` : "...";
        mocks = courseStats.setCount > 0 ? `${courseStats.setCount} Sets` : "...";
        ctaText = "Practice SPOM";
      } else if (slug.includes("advitt") || slug.includes("itt")) {
        themeClass = "inter";
        tag = "IT stage";
        desc = "Advanced Integrated IT Training & Testing MCQ preparation based on the latest pattern.";
        papers = courseStats.chapterCount > 0 ? `${courseStats.chapterCount} Chapters` : "...";
        mcqs = courseStats.questionCount > 0 ? `${courseStats.questionCount.toLocaleString()} MCQs` : "...";
        mocks = courseStats.setCount > 0 ? `${courseStats.setCount} Chapters` : "...";
        ctaText = "Practice Adv ITT";
      } else if (slug.includes("final")) {
        themeClass = "final";
        tag = "Final stage";
        desc = "Advanced Auditing, Strategic Financial Management, Direct & Indirect Tax - timed mock papers.";
        papers = "Coming Soon";
        mcqs = "Coming Soon";
        mocks = "Coming Soon";
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
  }, [courses, stats]);

  return (
    <div className="home-page">
      <div className="ambient"></div>
      <div className="hairline-strip"></div>

      {/* ---------- Nav ---------- */}
      <header>
        <Link className="brand" to="/">
          <div className="emblem">
            <svg viewBox="0 0 100 100" className="emblem-svg">
              <circle cx="50" cy="50" r="45" fill="none" stroke="#0B2545" strokeWidth="3" strokeDasharray="2.2 3.7" opacity="0.6" />
            </svg>
            <img src="/ca-logo.png" alt="CA Logo" className="emblem-img" />
          </div>
          <div className="brand-name">
            <span className="top">CA MCQ Practice</span>
            <span className="bottom">Made preparation Easy</span>
          </div>
        </Link>

        <nav className="links">
          <a href="https://www.icai.org/" target="_blank" rel="noopener noreferrer" className="portal-link link-icai">
            <img 
              src="https://www.icai.org/images/favicon.ico" 
              alt="ICAI Site" 
              className="portal-icon" 
              onError={(e) => { e.target.src = "/ca-logo.png"; }}
            />
            ICAI Site
          </a>
          <a href="https://boslive.icai.org/" target="_blank" rel="noopener noreferrer" className="portal-link link-bos">
            <img 
              src="https://www.icai.org/images/favicon.ico" 
              alt="ICAI BOS" 
              className="portal-icon" 
              onError={(e) => { e.target.src = "/ca-logo.png"; }}
            />
            ICAI BOS
          </a>
          <a href="https://eservices.icai.org/" target="_blank" rel="noopener noreferrer" className="portal-link link-ssp">
            <img 
              src="https://www.icai.org/images/favicon.ico" 
              alt="ICAI SSP" 
              className="portal-icon" 
              onError={(e) => { e.target.src = "/ca-logo.png"; }}
            />
            ICAI SSP
          </a>
        </nav>

        <div className="nav-actions" style={{ position: "relative" }}>
          {user ? (
            <>
              {/* Notification Bell */}
              <button
                type="button"
                className="bell-btn"
                onClick={() => setShowNotifInbox(!showNotifInbox)}
                style={{
                  position: "relative",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "18px",
                  padding: "6px",
                  marginRight: "14px",
                  display: "inline-flex",
                  alignItems: "center",
                  color: "var(--navy)"
                }}
                title="Notifications Inbox"
              >
                🔔
                {notifications.some(n => !n.is_read) && (
                  <span
                    className="bell-dot"
                    style={{
                      position: "absolute",
                      top: "2px",
                      right: "2px",
                      width: "8px",
                      height: "8px",
                      background: "var(--red)",
                      borderRadius: "50%",
                      border: "1.5px solid #fff"
                    }}
                  />
                )}
              </button>

              <span className="user-welcome" style={{ marginRight: "16px", fontSize: "14px", fontWeight: "600", color: "var(--navy)" }}>
                Welcome, <strong>{username}</strong>
              </span>
              <button type="button" className="btn-solid" onClick={logout}>Logout</button>

              {/* Notification Dropdown Box */}
              {showNotifInbox && (
                <div className="notif-dropdown" style={{
                  position: "absolute",
                  top: "46px",
                  right: "10px",
                  width: "320px",
                  background: "#fff",
                  border: "1px solid var(--line)",
                  borderRadius: "12px",
                  boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
                  zIndex: 1000,
                  padding: "16px",
                  textAlign: "left"
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--line)", paddingBottom: "10px", marginBottom: "10px" }}>
                    <h4 style={{ margin: 0, fontSize: "13px", color: "var(--navy)", fontWeight: 600 }}>Inbox Notifications</h4>
                    <button
                      type="button"
                      style={{ background: "none", border: "none", fontSize: "10.5px", color: "var(--brass)", cursor: "pointer", fontWeight: 600 }}
                      onClick={async () => {
                        for (const n of notifications) {
                          if (!n.is_read) await markAsRead(n.id, username);
                        }
                        const updated = await getNotificationsForUser(username);
                        setNotifications(updated);
                      }}
                    >
                      Mark all read
                    </button>
                  </div>
                  <div style={{ maxHeight: "240px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "8px" }}>
                    {notifications.length === 0 ? (
                      <p style={{ margin: 0, fontSize: "11.5px", color: "var(--ink-soft)", textAlign: "center", padding: "20px 0" }}>
                        No notifications yet.
                      </p>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          style={{
                            padding: "10px",
                            borderRadius: "8px",
                            background: n.is_read ? "rgba(0,0,0,0.01)" : "rgba(197, 166, 103, 0.06)",
                            border: "1px solid",
                            borderColor: n.is_read ? "var(--line)" : "rgba(197, 166, 103, 0.2)",
                          }}
                        >
                          <p style={{ margin: "0 0 6px", fontSize: "12px", color: "var(--ink)", lineHeight: "1.4" }}>
                            {n.message}
                          </p>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ fontSize: "9.5px", color: "var(--ink-soft)" }}>
                              {new Date(n.created_at).toLocaleDateString()}
                            </span>
                            {!n.is_read && (
                              <button
                                type="button"
                                style={{ background: "none", border: "none", fontSize: "9.5px", color: "var(--navy)", cursor: "pointer", fontWeight: 700 }}
                                onClick={async () => {
                                  await markAsRead(n.id, username);
                                  const updated = await getNotificationsForUser(username);
                                  setNotifications(updated);
                                }}
                              >
                                Mark as Read
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              <button type="button" className="btn-ghost" onClick={() => navigate("/login")}>Login</button>
              <a href="#levels" className="btn-solid" style={{ textDecoration: "none" }}>Continue as Guest</a>
            </>
          )}
        </div>
      </header>

      {/* ---------- Hero ---------- */}
      <main className="hero">
        <div className="hero-copy">
          <h1>
            CA MCQ Practice — <em>Made preparation Easy.</em>
          </h1>
          <p className="lede">
            Chapter-wise and full-length MCQ tests for SPOM, Adv ITT and CA Final — built on the latest ICAI pattern, with instant explanations and a dashboard that tells you exactly which chapter is costing you marks.
          </p>
          <div className="hero-ctas">
            <a href="#levels" className="btn-primary">
              Lets Practice MCQs <span>→</span>
            </a>
            <a href="#how" className="btn-secondary">See how scoring works</a>
          </div>

          <div className="trust-row">
            <div className="trust-item">
              <span className="num">{totalMCQsString}</span>
              <span className="lbl">MCQs across all 3 levels</span>
            </div>
            <div className="trust-item">
              <span className="num">{formatAttemptedCount(attemptedCount)}</span>
              <span className="lbl">Tests attempted to date</span>
            </div>
            <div className="trust-item">
              <span className="num">{finderRate}%</span>
              <span className="lbl">Say weak-chapter finder helped</span>
            </div>
          </div>
        </div>

        <ChakraDial
          masteredCount={userStats ? userStats.chapterCount : 15}
          totalChapters={24}
          accuracy={userStats ? userStats.averageAccuracy : 63}
        />
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
                  {course.mcqs && (
                    <div>
                      <span className="n">{course.mcqs}</span>
                      <span className="l">MCQs</span>
                    </div>
                  )}
                  {course.mocks && (
                    <div>
                      <span className="n">{course.mocks}</span>
                      <span className="l">Mock sets</span>
                    </div>
                  )}
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

      {/* ---------- Share Remembered Questions Banner ---------- */}
      <section className="share-banner" style={{ background: "#FAFAF8", border: "1px solid var(--line)", padding: "36px 24px", textAlign: "center", borderRadius: "16px", margin: "32px auto 60px", maxWidth: "1200px", width: "92%" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
          <h3 style={{ fontFamily: "var(--ff-serif)", fontSize: "22px", color: "var(--navy)", margin: 0, fontWeight: "600" }}>
            💡 Remembered Questions? Share!
          </h3>
          <p style={{ margin: 0, fontSize: "13.5px", color: "var(--ink-soft)", maxWidth: "600px", lineHeight: "1.5" }}>
            Help fellow aspirants expand their practice! If you remember any questions from your CA Final, SPOM, or Adv ITT exams, submit them via our Google Form.
          </p>
          <a
            href="https://docs.google.com/forms/d/e/1FAIpQLSeqh92WZ7LafRuOBV5tNen35yBoIakAJ9VpcTC74zIZDtxOpQ/viewform?usp=dialog"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary"
            style={{ textDecoration: "none", padding: "10px 24px", background: "var(--champagne)", color: "#111", borderRadius: "8px", fontWeight: "600", marginTop: "8px", fontSize: "13.5px", display: "inline-block" }}
          >
            Share Questions Now →
          </a>
        </div>
      </section>

      {/* ---------- Footer ---------- */}
      <footer>
        <div className="foot-grid">
          <div className="foot-brand">
            <div className="brand">
              <div className="emblem" style={{ width: 34, height: 34 }}>
                <svg viewBox="0 0 100 100" className="emblem-svg">
                  <circle cx="50" cy="50" r="45" fill="none" stroke="#0B2545" strokeWidth="3" strokeDasharray="2.2 3.7" opacity="0.6" />
                </svg>
                <img src="/ca-logo.png" alt="CA Logo" className="emblem-img" />
              </div>
              <div className="brand-name">
                <span className="top">CA MCQ Practice</span>
              </div>
            </div>
            <p>
              An independent MCQ practice platform for CA aspirants. Not affiliated with or endorsed by ICAI.
              <span style={{ display: "block", marginTop: "8px", fontWeight: "600", color: "var(--navy)" }}>
                By Lokesh Yerramsetty ( CA Aspirant)
              </span>
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
              <h5>Support</h5>
              <a
                href="https://t.me/IsAidangerous"
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
              >
                <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" style={{ verticalAlign: "middle" }}>
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.11.02-1.93 1.23-5.46 3.62-.51.35-.98.53-1.39.51-.46-.01-1.35-.26-2.01-.48-.81-.27-1.46-.42-1.4-.88.03-.24.37-.49 1.02-.75 3.99-1.74 6.66-2.88 7.99-3.43 3.8-1.57 4.59-1.85 5.1-.11v-.01z"/>
                </svg>
                Support Chat
              </a>
            </div>
          </div>
        </div>
        <div className="foot-bottom">
          <span>© 2026 CA MCQ Practice.</span>
          <span>Made by an &quot;Aspirant, for Aspirants&quot;</span>
        </div>
      </footer>
    </div>
  );
}

export default Home;
