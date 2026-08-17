import { useEffect, useState, useMemo, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getCourses } from "../services/courseService";
import { useAuth } from "../context/AuthContext";
import { getUserProgressStats, initializeUserProgress, getTotalAttemptsCount, getSatisfactionRate } from "../services/progressService";
import { getNotificationsForUser, markAsRead } from "../services/notificationService";
import { getVaultCount } from "../services/mistakeVaultService";
import { supabase } from "../supabase/supabase";
import Loading from "../components/Loading";

function ChakraDial({ isGuest = true, masteredCount = 0, totalChapters = 5, accuracy = 0 }) {
  const [revealed, setRevealed] = useState(0);
  const [pct, setPct] = useState(0);
  const dialRef = useRef(null);

  const total = Math.max(1, totalChapters);
  const mastered = isGuest ? 0 : Math.min(masteredCount, total);
  const targetPct = isGuest ? 0 : accuracy;

  useEffect(() => {
    if (isGuest) {
      setRevealed(0);
      return;
    }
    setRevealed(0);
    const interval = setInterval(() => {
      setRevealed((prev) => {
        if (prev >= total) {
          clearInterval(interval);
          return prev;
        }
        return prev + 1;
      });
    }, Math.max(15, Math.floor(1200 / total)));

    return () => clearInterval(interval);
  }, [total, isGuest]);

  useEffect(() => {
    setPct(0);
    if (isGuest || targetPct === 0) return;
    let currentPct = 0;
    const interval = setInterval(() => {
      currentPct += 1;
      if (currentPct >= targetPct) {
        setPct(targetPct);
        clearInterval(interval);
      } else {
        setPct(currentPct);
      }
    }, Math.max(10, Math.floor(1400 / targetPct)));

    return () => clearInterval(interval);
  }, [targetPct, isGuest]);

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
    const spokeWidth = Math.max(2, Math.min(5, Math.floor(120 / total)));
    for (let i = 0; i < total; i++) {
      const angle = (i / total) * 2 * Math.PI - Math.PI / 2;
      const x1 = cx + rInner * Math.cos(angle);
      const y1 = cy + rInner * Math.sin(angle);
      const x2 = cx + rOuter * Math.cos(angle);
      const y2 = cy + rOuter * Math.sin(angle);
      const isMastered = !isGuest && i < mastered;
      const isRevealed = isGuest || i < revealed;

      arr.push(
        <line
          key={i}
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          strokeWidth={spokeWidth}
          strokeLinecap="round"
          stroke={isMastered ? "#1F6E43" : "rgba(11, 37, 69, 0.14)"}
          strokeDasharray={rOuter - rInner}
          strokeDashoffset={isRevealed ? 0 : rOuter - rInner}
          style={{
            transition: "stroke-dashoffset 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        />
      );
    }
    return arr;
  }, [revealed, total, mastered, isGuest]);

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
          {isGuest ? (
            <>
              <div className="pct" style={{ fontSize: "42px", letterSpacing: "2px" }}>--</div>
              <div className="sub">Accuracy this week</div>
              <div className="score">-- / {total} chapters mastered</div>
            </>
          ) : (
            <>
              <div className="pct">{pct > 0 ? `${pct}%` : `${accuracy}%`}</div>
              <div className="sub">Accuracy this week</div>
              <div className="score">{mastered} / {total} chapters mastered</div>
            </>
          )}
        </div>
        <div className="dial-caption">Live progress &mdash; {total} chapters, {total} spokes</div>
      </div>
    </div>
  );
}

function Home() {
  const { user, username, logout } = useAuth();
  const navigate = useNavigate();

  const [courses, setCourses] = useState([]);
  const [stats, setStats] = useState({});
  const [error, setError] = useState("");
  const [attemptedCount, setAttemptedCount] = useState(0);
  const [realTarget, setRealTarget] = useState(0);
  const [finderRate, setFinderRate] = useState(0);
  const [targetFinderRate, setTargetFinderRate] = useState(92);
  const [totalLiveMCQs, setTotalLiveMCQs] = useState(0);
  const [userStats, setUserStats] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [showNotifInbox, setShowNotifInbox] = useState(false);
  const [loading, setLoading] = useState(true);
  const [interruptedSession, setInterruptedSession] = useState(null);
  const [showInterruptedModal, setShowInterruptedModal] = useState(false);
  const [totalChaptersInDb, setTotalChaptersInDb] = useState(5);
  const [vaultCount, setVaultCount] = useState(0);

  const formatAttemptedCount = (val) => {
    if (val >= 100000) {
      return `${(val / 100000).toFixed(1)} L`;
    }
    return val.toLocaleString();
  };

  // Effect for loading mistake vault count
  useEffect(() => {
    async function fetchVaultCount() {
      try {
        const count = await getVaultCount();
        setVaultCount(count);
      } catch (e) {
        console.warn("Vault count fetch notice:", e);
      }
    }
    fetchVaultCount();
    // Refresh vault count whenever progress updates
    const handleUpdate = () => { fetchVaultCount(); };
    window.addEventListener("ca_quiz_progress_updated", handleUpdate);
    return () => window.removeEventListener("ca_quiz_progress_updated", handleUpdate);
  }, [user]);

  // Check for interrupted quiz session on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const savedStr = localStorage.getItem("ca_quiz_interrupted_session");
        if (savedStr) {
          const saved = JSON.parse(savedStr);
          if (
            saved &&
            saved.screen === "quiz" &&
            saved.chapterId &&
            Array.isArray(saved.activeQuestions) &&
            saved.activeQuestions.length > 0
          ) {
            const startTime = saved.startTime || Date.now();
            const elapsed = Math.floor((Date.now() - startTime) / 1000);
            if (elapsed < 10800) {
              setInterruptedSession(saved);
              setShowInterruptedModal(true);
            } else {
              localStorage.removeItem("ca_quiz_interrupted_session");
            }
          }
        }
      } catch (e) {
        console.warn("Failed to check interrupted session:", e);
      }
    }, 0);
    return () => clearTimeout(timer);
  }, []);

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
    // Poll notifications every 60 seconds to reduce Supabase API usage
    let interval = null;
    if (username && username !== "admin") {
      interval = setInterval(() => {
        loadNotifications();
      }, 60000);
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

  // Load & listen to real-time user progress statistics from Supabase for ChakraDial & Trust Row
  useEffect(() => {
    async function loadUserStats() {
      if (!user) {
        setUserStats({
          isGuest: true,
          submittedTestsCount: 0,
          averageAccuracy: 0,
          chapterCount: 0,
          masteredChapterCount: 0,
          masteredChapterIds: [],
        });
        setRealTarget(0);
        setTargetFinderRate(0);
        return;
      }

      try {
        if (!sessionStorage.getItem("progress_initialized")) {
          await initializeUserProgress();
          sessionStorage.setItem("progress_initialized", "1");
        }
        const progressData = await getUserProgressStats(user);
        setUserStats(progressData);
        setRealTarget(progressData.submittedTestsCount || 0);
        setTargetFinderRate(progressData.averageAccuracy || 0);
      } catch (err) {
        console.error("Error loading progress stats:", err);
      }
    }
    loadUserStats();

    // Listen for custom progress update events dispatched when a test completes
    const handleProgressUpdate = () => {
      loadUserStats();
    };
    window.addEventListener("ca_quiz_progress_updated", handleProgressUpdate);

    // Supabase Realtime channel for instant progress updates
    const channel = supabase
      .channel(`realtime-user-progress-${user?.id || "guest"}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "user_progress", filter: user ? `user_id=eq.${user.id}` : undefined }, loadUserStats)
      .subscribe();

    return () => {
      window.removeEventListener("ca_quiz_progress_updated", handleProgressUpdate);
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Load courses and dynamic stats from Supabase
  useEffect(() => {
    async function loadCoursesAndStats() {
      try {
        setLoading(true);
        const fetchedCourses = await getCourses();
        setCourses(fetchedCourses);

        // Fetch all chapters, subjects, and question counts in bulk
        const [{ data: allChapters }, { data: allSubjects }] = await Promise.all([
          supabase.from("chapters").select("id, course_id, subject_id, set_type"),
          supabase.from("subjects").select("id, course_id, set_type"),
        ]);

        if (allChapters) {
          setTotalChaptersInDb(allChapters.length);
        }

        const subjectCourseMap = {};
        const setTypesByCourse = {};

        if (allSubjects) {
          allSubjects.forEach((sub) => {
            if (sub.course_id) {
              subjectCourseMap[sub.id] = sub.course_id;
              if (sub.set_type) {
                if (!setTypesByCourse[sub.course_id]) {
                  setTypesByCourse[sub.course_id] = new Set();
                }
                const trimmed = sub.set_type.trim();
                if (trimmed) setTypesByCourse[sub.course_id].add(trimmed);
              }
            }
          });
        }

        // Fetch exact question counts in parallel for all chapters (avoids 1000-row cap completely!)
        const questionCountByChapter = {};
        if (allChapters) {
          await Promise.all(
            allChapters.map(async (ch) => {
              const { count, error: qErr } = await supabase
                .from("questions")
                .select("*", { count: "exact", head: true })
                .eq("chapter_id", ch.id);
              if (!qErr) {
                questionCountByChapter[ch.id] = count || 0;
              }
            })
          );
        }

        const chaptersByCourse = {};
        if (allChapters) {
          allChapters.forEach((ch) => {
            const courseId = ch.course_id || (ch.subject_id ? subjectCourseMap[ch.subject_id] : null);
            if (courseId) {
              if (!chaptersByCourse[courseId]) {
                chaptersByCourse[courseId] = [];
              }
              chaptersByCourse[courseId].push(String(ch.id));

              if (ch.set_type) {
                if (!setTypesByCourse[courseId]) {
                  setTypesByCourse[courseId] = new Set();
                }
                const trimmed = ch.set_type.trim();
                if (trimmed) {
                  setTypesByCourse[courseId].add(trimmed);
                }
              }
            }
          });
        }

        // Fetch exact total questions and case questions across entire database
        try {
          const [{ count: qCount }, { count: cqCount }] = await Promise.all([
            supabase.from("questions").select("*", { count: "exact", head: true }),
            supabase.from("case_questions").select("*", { count: "exact", head: true }),
          ]);
          const totalValid = (qCount || 0) + (cqCount || 0);
          if (totalValid > 0) {
            setTotalLiveMCQs(totalValid);
          }
        } catch (e) {
          console.warn("Direct live MCQ count notice:", e);
        }

        const statsMap = {};
        fetchedCourses.forEach((course) => {
          const chapterIds = chaptersByCourse[course.id] || [];
          let questionCount = 0;
          chapterIds.forEach((cid) => {
            questionCount += (questionCountByChapter[cid] || 0);
          });
          const setSet = setTypesByCourse[course.id];
          const setCount = setSet && setSet.size > 0 ? setSet.size : 0;

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
      } finally {
        setLoading(false);
      }
    }
    loadCoursesAndStats();
  }, []);

  // Animate trust row counters with live database values
  useEffect(() => {
    let curAttempted = 0;
    const attemptedTarget = realTarget;
    const attemptedStep = Math.max(1, Math.round(attemptedTarget / 25));
    const attemptedInterval = setInterval(() => {
      curAttempted += attemptedStep;
      if (curAttempted >= attemptedTarget) {
        setAttemptedCount(attemptedTarget);
        clearInterval(attemptedInterval);
      } else {
        setAttemptedCount(curAttempted);
      }
    }, 30);

    let curRate = 0;
    const rateTarget = targetFinderRate;
    const rateInterval = setInterval(() => {
      curRate += 2;
      if (curRate >= rateTarget) {
        setFinderRate(rateTarget);
        clearInterval(rateInterval);
      } else {
        setFinderRate(curRate);
      }
    }, 25);

    return () => {
      clearInterval(attemptedInterval);
      clearInterval(rateInterval);
    };
  }, [realTarget, targetFinderRate]);

  // Sum total MCQs dynamically from Supabase
  const totalMCQsString = useMemo(() => {
    if (totalLiveMCQs > 0) {
      return `${totalLiveMCQs.toLocaleString()} MCQs`;
    }
    let sum = 0;
    for (const val of Object.values(stats)) {
      sum += val.questionCount;
    }
    return sum > 0 ? `${sum.toLocaleString()} MCQs` : "3,699 MCQs";
  }, [totalLiveMCQs, stats]);

  const cardData = useMemo(() => {
    return courses.map((course) => {
      const slug = course.course_slug.toLowerCase();
      const courseStats = stats[slug] || { chapterCount: 0, questionCount: 0, setCount: 0 };
      
      let themeClass = "foundation";
      let tag = "Entry level";
      let desc = course.course_name;
      let papers = courseStats.chapterCount;
      let mcqs = courseStats.questionCount;
      let mocks = courseStats.setCount;
      let ctaText = `Practice ${course.course_name}`;

      if (slug.includes("spom")) {
        themeClass = "foundation";
        tag = "Self Paced Module";
        desc = "FEMA, FCRA, and corporate laws — practice Set A and Set B chapters individually with instant explanations.";
        ctaText = "Practice SPOM";
      } else if (slug.includes("advitt") || slug.includes("itt")) {
        themeClass = "inter";
        tag = "IT stage";
        desc = "Advanced Integrated IT Training & Testing MCQ preparation based on the latest pattern.";
        ctaText = "Practice Adv ITT";
      } else if (slug.includes("final")) {
        themeClass = "final";
        tag = "Final stage";
        desc = "Advanced Auditing, Strategic Financial Management, Direct & Indirect Tax - timed mock papers.";
        papers = "Coming Soon";
        mcqs = "";
        mocks = "";
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

  if (loading) {
    return (
      <div className="loader-container">
        <Loading text="Loading CAmcqs-Practice…" />
      </div>
    );
  }

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
            <span className="top">CAmcqs-Practice</span>
            <span className="bottom">Made preparation Easy</span>
          </div>
        </Link>


        <div className="nav-actions" style={{ position: "relative", display: "flex", alignItems: "center", gap: "10px" }}>
          
          {/* Mistake Vault Link (Leftmost of actions) */}
          <Link
            to="/vault"
            className="vault-nav-link"
            title={`Mistake Vault${vaultCount > 0 ? ` — ${vaultCount} questions need revision` : " — No pending revisions"}`}
            style={{
              position: "relative",
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
              textDecoration: "none",
              fontSize: "13px",
              fontWeight: "600",
              color: vaultCount > 0 ? "#B08628" : "var(--ink-soft)",
              padding: "5px 10px",
              borderRadius: "6px",
              border: "1px solid",
              borderColor: vaultCount > 0 ? "rgba(176,134,40,0.3)" : "var(--hairline)",
              background: vaultCount > 0 ? "rgba(176,134,40,0.06)" : "transparent",
              transition: "all 0.15s ease"
            }}
          >
            📚 Vault
            {vaultCount > 0 && (
              <span style={{
                background: "#B08628",
                color: "#fff",
                borderRadius: "10px",
                fontSize: "10px",
                fontWeight: "700",
                padding: "1px 6px",
                lineHeight: "1.4"
              }}>{vaultCount}</span>
            )}
          </Link>

          {/* Notification Bell (Right of Vault, Left of Login / Profile) */}
          <div style={{ position: "relative" }}>
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
                display: "inline-flex",
                alignItems: "center",
                color: "var(--navy)"
              }}
              title="Platform Announcements & Updates"
            >
              🔔
              {notifications.some((n) => !n.is_read) && (
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

            {/* Notification Dropdown Box */}
            {showNotifInbox && (
              <div className="notif-dropdown" style={{
                position: "absolute",
                top: "42px",
                right: user ? "-60px" : "-10px",
                width: "320px",
                background: "#fff",
                border: "1px solid var(--line)",
                borderRadius: "12px",
                boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
                zIndex: 1000,
                padding: "16px",
                textAlign: "left"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--line)", paddingBottom: "10px", marginBottom: "10px" }}>
                  <h4 style={{ margin: 0, fontSize: "13px", color: "var(--navy)", fontWeight: 700 }}>Platform Updates &amp; Replies</h4>
                  <button
                    type="button"
                    style={{ background: "none", border: "none", fontSize: "10.5px", color: "var(--brass)", cursor: "pointer", fontWeight: 600 }}
                    onClick={async () => {
                      for (const n of notifications) {
                        if (!n.is_read) await markAsRead(n.id, username || "guest");
                      }
                      const updated = await getNotificationsForUser(username || "guest");
                      setNotifications(updated);
                    }}
                  >
                    Mark all read
                  </button>
                </div>
                <div style={{ maxHeight: "260px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "8px" }}>
                  {notifications.length === 0 ? (
                    <p style={{ margin: 0, fontSize: "12px", color: "var(--ink-soft)", textAlign: "center", padding: "20px 0" }}>
                      No new announcements or replies yet.
                    </p>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id || Math.random()}
                        style={{
                          padding: "10px",
                          borderRadius: "8px",
                          background: n.is_read ? "rgba(0,0,0,0.01)" : "rgba(197, 166, 103, 0.08)",
                          border: "1px solid",
                          borderColor: n.is_read ? "var(--line)" : "rgba(197, 166, 103, 0.3)",
                        }}
                      >
                        <p style={{ margin: "0 0 6px", fontSize: "12px", color: "var(--ink)", lineHeight: "1.45", whiteSpace: "pre-wrap" }}>
                          {n.message}
                        </p>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontSize: "9.5px", color: "var(--ink-soft)" }}>
                            {n.created_at ? new Date(n.created_at).toLocaleDateString() : "Recent"}
                          </span>
                          {!n.is_read && (
                            <button
                              type="button"
                              style={{ background: "none", border: "none", fontSize: "9.5px", color: "var(--navy)", cursor: "pointer", fontWeight: 700 }}
                              onClick={async () => {
                                await markAsRead(n.id, username || "guest");
                                const updated = await getNotificationsForUser(username || "guest");
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
          </div>

          {/* Login / Profile / Logout (Rightmost) */}
          {user ? (
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginLeft: "4px" }}>
              <span className="user-welcome" style={{ fontSize: "13.5px", fontWeight: "600", color: "var(--navy)" }}>
                Welcome, <strong>{username}</strong>
              </span>
              <button type="button" className="btn-solid" onClick={logout}>Logout</button>
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginLeft: "4px" }}>
              <button type="button" className="btn-ghost" onClick={() => navigate("/login")}>Login</button>
              <a href="#levels" className="btn-solid" style={{ textDecoration: "none" }}>Continue as Guest</a>
            </div>
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
              <span className="num">{!user ? "--" : formatAttemptedCount(attemptedCount)}</span>
              <span className="lbl">Tests attempted to date</span>
            </div>
            <div className="trust-item">
              <span className="num">{!user ? "--" : `${finderRate}%`}</span>
              <span className="lbl">Average test accuracy</span>
            </div>
          </div>
        </div>

        <ChakraDial
          isGuest={!user}
          masteredCount={userStats ? userStats.masteredChapterCount : 0}
          totalChapters={totalChaptersInDb}
          accuracy={userStats ? userStats.averageAccuracy : 0}
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
            const isFinal = course.course_slug?.includes("final");
            return (
              <div className={`level-card ${course.themeClass}`} key={course.id}>
                <div className="stripe"></div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <span className="tag">{course.tag}</span>
                </div>
                <h3>
                  <Link to={`/course/${course.course_slug}`} style={{ color: "inherit", textDecoration: "none" }}>
                    {course.course_name === "CA Final" ? "CA Final" : course.course_name}
                  </Link>
                </h3>
                <p>{course.desc}</p>
                <div className="level-meta">
                  {course.papers === "Coming Soon" ? (
                    <div>
                      <span className="n">Coming Soon</span>
                      <span className="l">🕐</span>
                    </div>
                  ) : (
                    <>
                      <div>
                        <span className="n">{course.papers}</span>
                        <span className="l">{course.papers === 1 ? "Chapter" : "Chapters"}</span>
                      </div>
                      <div>
                        <span className="n">{Number(course.mcqs || 0).toLocaleString()}</span>
                        <span className="l">MCQs</span>
                      </div>
                      <div>
                        <span className="n">{course.mocks}</span>
                        <span className="l">{course.mocks === 1 ? "Set" : "Sets"}</span>
                      </div>
                    </>
                  )}
                </div>

                {isAvailable ? (
                  <Link
                    to={`/course/${course.course_slug}`}
                    className="cta"
                    style={{ cursor: "pointer" }}
                  >
                    Go <span className="arrow">→</span>
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

      {/* ---------- Official ICAI Student Utility Portals & Slot Trackers ---------- */}
      <section className="icai-portals-section" style={{ maxWidth: "1200px", margin: "48px auto 0", padding: "0 20px" }}>
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <span style={{ fontSize: "11px", fontWeight: "800", letterSpacing: "1px", textTransform: "uppercase", color: "var(--brass)" }}>
            OFFICIAL ICAI UTILITIES
          </span>
          <h2 style={{ margin: "6px 0 8px", fontSize: "26px", color: "var(--navy)", fontFamily: "var(--ff-serif)" }}>
            Exam Slots &amp; ICAI Portals
          </h2>
          <p style={{ color: "var(--ink-soft)", fontSize: "14.5px", margin: 0 }}>
            Quick access to live slot availability, training batches, and ICAI Self Service Portal.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "22px" }}>
          
          {/* Card 1: SPOM Slots (Vibrant Sage/Forest Green Theme) */}
          <div className="portal-utility-card" style={{ background: "linear-gradient(145deg, #f0fdf4 0%, #ffffff 100%)", border: "2px solid #86efac", borderRadius: "14px", padding: "24px", display: "flex", flexDirection: "column", boxShadow: "0 4px 14px rgba(22,101,52,0.08)", transition: "all 0.2s ease" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "14px" }}>
              <div style={{ width: "46px", height: "46px", borderRadius: "10px", background: "#0F3D3E", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px", boxShadow: "0 2px 8px rgba(15,61,62,0.2)" }}>
                🎯
              </div>
              <div>
                <span style={{ fontSize: "11px", fontWeight: "800", color: "#166534", textTransform: "uppercase", letterSpacing: "0.5px", background: "#dcfce7", padding: "2px 8px", borderRadius: "4px" }}>Self-Paced Module</span>
                <h3 style={{ margin: "4px 0 0", fontSize: "17.5px", color: "#0f172a", fontWeight: "700" }}>SPOM Exam Slot Booking</h3>
              </div>
            </div>
            <p style={{ fontSize: "14px", color: "#334155", lineHeight: "1.6", flex: 1, margin: "0 0 20px", fontWeight: "500" }}>
              Check real-time test center availability, exam dates, and book your SPOM Set A &amp; Set B assessment slots.
            </p>
            <a
              href="https://spmt.icai.org/ICAI/LoginAction_showSlotDetails.action"
              target="_blank"
              rel="noopener noreferrer"
              style={{ textDecoration: "none", background: "#0F3D3E", color: "#ffffff", padding: "11px 18px", borderRadius: "8px", fontWeight: "700", fontSize: "14px", textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", boxShadow: "0 2px 6px rgba(15,61,62,0.25)" }}
            >
              Check SPOM Slots ↗
            </a>
          </div>

          {/* Card 2: Adv MCS / ITT Slots (Vibrant Royal Navy Blue Theme) */}
          <div className="portal-utility-card" style={{ background: "linear-gradient(145deg, #eff6ff 0%, #ffffff 100%)", border: "2px solid #93c5fd", borderRadius: "14px", padding: "24px", display: "flex", flexDirection: "column", boxShadow: "0 4px 14px rgba(30,58,138,0.08)", transition: "all 0.2s ease" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "14px" }}>
              <div style={{ width: "46px", height: "46px", borderRadius: "10px", background: "#0B2545", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px", boxShadow: "0 2px 8px rgba(11,37,69,0.2)" }}>
                🎓
              </div>
              <div>
                <span style={{ fontSize: "11px", fontWeight: "800", color: "#1e40af", textTransform: "uppercase", letterSpacing: "0.5px", background: "#dbeafe", padding: "2px 8px", borderRadius: "4px" }}>ICAI Training</span>
                <h3 style={{ margin: "4px 0 0", fontSize: "17.5px", color: "#0f172a", fontWeight: "700" }}>Adv MCS &amp; ITT Batches</h3>
              </div>
            </div>
            <p style={{ fontSize: "14px", color: "#334155", lineHeight: "1.6", flex: 1, margin: "0 0 20px", fontWeight: "500" }}>
              Find and enroll in upcoming virtual &amp; physical batches across all regional ICAI branches and chapters.
            </p>
            <a
              href="https://www.icaionlineregistration.org/launchbatchdetail.aspx"
              target="_blank"
              rel="noopener noreferrer"
              style={{ textDecoration: "none", background: "#0B2545", color: "#ffffff", padding: "11px 18px", borderRadius: "8px", fontWeight: "700", fontSize: "14px", textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", boxShadow: "0 2px 6px rgba(11,37,69,0.25)" }}
            >
              Find ITT / MCS Batches ↗
            </a>
          </div>

          {/* Card 3: ICAI SSP Portal (Vibrant Crimson Red Theme) */}
          <div className="portal-utility-card" style={{ background: "linear-gradient(145deg, #fff1f2 0%, #ffffff 100%)", border: "2px solid #fca5a5", borderRadius: "14px", padding: "24px", display: "flex", flexDirection: "column", boxShadow: "0 4px 14px rgba(153,27,27,0.08)", transition: "all 0.2s ease" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "14px" }}>
              <div style={{ width: "46px", height: "46px", borderRadius: "10px", background: "#991b1b", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px", boxShadow: "0 2px 8px rgba(153,27,27,0.2)" }}>
                🏛️
              </div>
              <div>
                <span style={{ fontSize: "11px", fontWeight: "800", color: "#991b1b", textTransform: "uppercase", letterSpacing: "0.5px", background: "#ffe4e6", padding: "2px 8px", borderRadius: "4px" }}>Member &amp; Student</span>
                <h3 style={{ margin: "4px 0 0", fontSize: "17.5px", color: "#0f172a", fontWeight: "700" }}>ICAI Self Service Portal</h3>
              </div>
            </div>
            <p style={{ fontSize: "14px", color: "#334155", lineHeight: "1.6", flex: 1, margin: "0 0 20px", fontWeight: "500" }}>
              Access articleship forms (Form 102/103/108), exam application forms, transcript requests, and profile management.
            </p>
            <a
              href="https://eservices.icai.org/"
              target="_blank"
              rel="noopener noreferrer"
              style={{ textDecoration: "none", background: "#991b1b", color: "#fff", padding: "11px 18px", borderRadius: "8px", fontWeight: "700", fontSize: "14px", textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", boxShadow: "0 2px 6px rgba(153,27,27,0.25)" }}
            >
              Launch ICAI SSP ↗
            </a>
          </div>

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
                By <a href="https://www.linkedin.com/in/lokeshyerramsetty/" target="_blank" rel="noopener noreferrer" style={{ color: "inherit", textDecoration: "none" }}>Lokesh Yerramsetty ( CA Aspirant )</a>
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
                style={{ display: "flex", alignItems: "center", gap: "6px" }}
              >
                <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" style={{ verticalAlign: "middle" }}>
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.11.02-1.93 1.23-5.46 3.62-.51.35-.98.53-1.39.51-.46-.01-1.35-.26-2.01-.48-.81-.27-1.46-.42-1.4-.88.03-.24.37-.49 1.02-.75 3.99-1.74 6.66-2.88 7.99-3.43 3.8-1.57 4.59-1.85 5.1-.11v-.01z"/>
                </svg>
                Support Chat
              </a>
              <a
                href="https://www.linkedin.com/in/lokeshyerramsetty/"
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: "flex", alignItems: "center", gap: "6px" }}
              >
                <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" style={{ verticalAlign: "middle" }}>
                  <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/>
                </svg>
                Connect Us
              </a>
            </div>
          </div>
        </div>
        <div className="foot-bottom">
          <span>© 2026 CA MCQ Practice.</span>
          <span>Made by an &quot;Aspirant, for Aspirants&quot;</span>
        </div>
      </footer>

      {/* Interrupted Test Resume Modal Popup */}
      {showInterruptedModal && interruptedSession && (
        <div className="confirm-overlay open" style={{ zIndex: 10000 }}>
          <div className="confirm-box" style={{ maxWidth: "460px", background: "#ffffff", borderRadius: "14px", padding: "28px", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
            <h3 style={{ fontSize: "20px", color: "var(--navy)", fontWeight: 700, margin: "0 0 10px", textAlign: "left", fontFamily: "Georgia, serif" }}>
              📝 Unfinished Practice Test Detected
            </h3>
            <p style={{ margin: "10px 0 24px", fontSize: "14px", color: "var(--ink-soft)", lineHeight: "1.6", textAlign: "left" }}>
              You have an active session for <strong>{interruptedSession.chapterName || `Chapter ${interruptedSession.chapterId}`}</strong> at <strong>Question {(interruptedSession.current || 0) + 1}</strong> of {interruptedSession.activeQuestions ? interruptedSession.activeQuestions.length : 0}.
              <br /><br />
              Would you like to resume your test from where you left off?
            </p>
            <div className="confirm-actions" style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
              <button
                type="button"
                className="btn-secondary"
                style={{ cursor: "pointer", padding: "10px 18px", fontSize: "13.5px" }}
                onClick={() => {
                  localStorage.removeItem("ca_quiz_interrupted_session");
                  setShowInterruptedModal(false);
                }}
              >
                Discard & Disregard
              </button>
              <button
                type="button"
                className="btn-primary"
                style={{ cursor: "pointer", padding: "10px 22px", fontSize: "13.5px" }}
                onClick={() => {
                  setShowInterruptedModal(false);
                  navigate(`/quiz/${interruptedSession.chapterId}`);
                }}
              >
                Resume Test →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Home;
