import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getCourseBySlug } from "../services/courseService";
import { getSubjects } from "../services/subjectService";
import { getChapters } from "../services/chapterService";
import { getTopicCountsForChapters } from "../services/topicService";
import { getCasesForCourse } from "../services/caseService";
import { saveQuizAttempt } from "../services/progressService";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../supabase/supabase";
import Loading from "../components/Loading";
import CaseTableRenderer from "../components/CaseTableRenderer";

function getSubjectIcon(name) {
  const n = (name || "").toLowerCase();
  if (n.includes("company") || n.includes("companies")) return "🏛️";
  if (n.includes("sebi") || n.includes("regulation")) return "📈";
  if (n.includes("fema") || n.includes("foreign exchange")) return "💱";
  if (n.includes("fcra") || n.includes("foreign contribution")) return "🌍";
  if (n.includes("ibc") || n.includes("insolvency") || n.includes("bankruptcy")) return "⚖️";
  return "📑";
}

function safeDecodeURI(str) {
  if (!str) return "";
  try {
    return decodeURIComponent(str);
  } catch (e) {
    return str;
  }
}

function getParagraphsArray(paragraphs) {
  if (Array.isArray(paragraphs)) return paragraphs;
  if (typeof paragraphs === "string" && paragraphs.trim()) {
    return paragraphs.split(/\n\s*\n/).filter((p) => p.trim().length > 0);
  }
  return [];
}

function ChapterList() {
  const { courseSlug, setType } = useParams();
  const { user, login, register } = useAuth();

  const [course, setCourse] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [casesList, setCasesList] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(null); // number | 'cases' | null
  const [questionCounts, setQuestionCounts] = useState({});
  const [topicCounts, setTopicCounts] = useState({});
  const [userProgressMap, setUserProgressMap] = useState({});
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Case Scenario Views & State
  const [viewMode, setViewMode] = useState("grid"); // 'grid' | 'case_detail'
  const [activeCaseIndex, setActiveCaseIndex] = useState(0);
  const [caseCurrentQIndex, setCaseCurrentQIndex] = useState(0);
  const [caseCorrectCount, setCaseCorrectCount] = useState(0);
  const [caseAnswers, setCaseAnswers] = useState({}); // { [qIdx]: chosenLetter }
  const [caseTestFinished, setCaseTestFinished] = useState(false);
  const [showFullCaseModal, setShowFullCaseModal] = useState(false);
  const [caseSearch, setCaseSearch] = useState("");
  const [casePage, setCasePage] = useState(1);
  const [showAllCases, setShowAllCases] = useState(false);
  const casesPerPage = 15;

  // Guest Auth Popup State
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authTab, setAuthTab] = useState("login"); // 'login' | 'register'
  const [authUsername, setAuthUsername] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authFavPlace, setAuthFavPlace] = useState("");
  const [authFirstnameYob, setAuthFirstnameYob] = useState("");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  async function loadUserProgress() {
    // Only load progress stats for logged in users
    if (!user) {
      setUserProgressMap({});
      return;
    }

    try {
      const progMap = {};

      const { data: dbAttempts } = await supabase
        .from("user_progress")
        .select("*")
        .eq("user_id", user.id);

      if (dbAttempts) {
        dbAttempts.forEach((att) => {
          if (att.chapter_id) {
            const cid = String(att.chapter_id);
            const prevScore = progMap[cid]?.score || 0;
            progMap[cid] = {
              score: Math.max(prevScore, att.score || 0),
              total: att.total_questions || 0,
              percentage: att.percentage || 0,
            };
          }
        });
      }

      setUserProgressMap(progMap);
    } catch (e) {
      console.warn("Failed to load user progress:", e);
    }
  }

  useEffect(() => {
    async function loadChaptersAndCases() {
      setError("");
      setIsLoading(true);

      try {
        const loadedCourse = await getCourseBySlug(courseSlug);
        setCourse(loadedCourse);

        const decodedSet = (!setType || setType === "chapters") ? null : safeDecodeURI(setType).trim();

        const isSpom = (courseSlug || "").toLowerCase().includes("spom") ||
                       (loadedCourse?.course_slug || "").toLowerCase().includes("spom") ||
                       (loadedCourse?.course_name || "").toLowerCase().includes("spom");

        if (!loadedCourse) {
          setError(`Course "${courseSlug}" was not found.`);
          setIsLoading(false);
          return;
        }

        const [loadedSubjects, loadedChapters, loadedCases] = await Promise.all([
          getSubjects(loadedCourse.id, decodedSet),
          getChapters(loadedCourse.id, decodedSet),
          isSpom ? getCasesForCourse(loadedCourse.id).catch(() => []) : Promise.resolve([]),
        ]);

        const validSubjects = loadedSubjects || [];
        const validChapters = loadedChapters || [];
        const validCases = isSpom ? (loadedCases || []) : [];

        setSubjects(validSubjects);
        setChapters(validChapters);
        setCasesList(validCases);

        const chapterIds = validChapters.map((c) => c.id);
        const qCounts = {};
        chapterIds.forEach((id) => { qCounts[id] = 0; });

        const [tCounts] = await Promise.all([
          getTopicCountsForChapters(chapterIds),
          Promise.all(
            chapterIds.map(async (cid) => {
              const { count, error: qError } = await supabase
                .from("questions")
                .select("*", { count: "exact", head: true })
                .eq("chapter_id", cid);
              if (!qError) {
                qCounts[cid] = count || 0;
              }
            })
          ),
        ]);

        setQuestionCounts(qCounts);
        setTopicCounts(tCounts || {});

        await loadUserProgress();

        // Restore active Case Scenario test progress if user refreshed during a test
        try {
          const decoded = safeDecodeURI(setType);
          const sessionKey = `ca_case_session_${courseSlug}_${decoded}`;
          const savedStr = sessionStorage.getItem(sessionKey) || localStorage.getItem(sessionKey);
          if (savedStr) {
            const saved = JSON.parse(savedStr);
            const savedIdx = typeof saved?.activeCaseIndex === "number" ? saved.activeCaseIndex : 0;
            // Only restore if we have cases loaded AND the saved index is valid
            if (
              saved &&
              saved.viewMode === "case_detail" &&
              validCases.length > 0 &&
              savedIdx < validCases.length
            ) {
              setActiveCaseIndex(savedIdx);
              setCaseCurrentQIndex(typeof saved.caseCurrentQIndex === "number" ? saved.caseCurrentQIndex : 0);
              setCaseAnswers(saved.caseAnswers || {});
              setCaseCorrectCount(typeof saved.caseCorrectCount === "number" ? saved.caseCorrectCount : 0);
              setCaseTestFinished(Boolean(saved.caseTestFinished));
              setSelectedIndex("cases");
              setViewMode("case_detail");
            }
          }
        } catch (e) {
          console.warn("Failed to restore case test session:", e);
        }
        setIsLoading(false);
      } catch (loadError) {
        console.error("Chapter loading error:", loadError);
        setError("Chapters and Case Scenarios could not be loaded.");
        setIsLoading(false);
      }
    }

    loadChaptersAndCases();

    const handleProgressUpdate = () => {
      loadUserProgress();
    };
    window.addEventListener("ca_quiz_progress_updated", handleProgressUpdate);
    return () => {
      window.removeEventListener("ca_quiz_progress_updated", handleProgressUpdate);
    };
  }, [courseSlug, setType, user]);

  const activeCase = casesList[activeCaseIndex] || casesList[0];
  const activeCaseQuestions = activeCase?.questions || [];
  const currentQ = activeCaseQuestions[caseCurrentQIndex];
  const isLastQuestion = caseCurrentQIndex === activeCaseQuestions.length - 1;

  // Auto-persist active Case Scenario test progress to sessionStorage and localStorage so browser refresh stays in the test
  useEffect(() => {
    if (isLoading) return; // Do NOT touch storage while data is still loading!

    const decoded = safeDecodeURI(setType);
    const sessionKey = `ca_case_session_${courseSlug}_${decoded}`;

    if (viewMode === "case_detail" && activeCase) {
      try {
        const sessionData = {
          viewMode: "case_detail",
          activeCaseIndex,
          caseCurrentQIndex,
          caseAnswers,
          caseCorrectCount,
          caseTestFinished,
        };
        const strData = JSON.stringify(sessionData);
        sessionStorage.setItem(sessionKey, strData);
        localStorage.setItem(sessionKey, strData);
      } catch (e) {
        console.warn("Failed to save case test session:", e);
      }
    } else if (viewMode === "grid") {
      try {
        sessionStorage.removeItem(sessionKey);
        localStorage.removeItem(sessionKey);
      } catch (e) {}
    }
  }, [isLoading, viewMode, activeCaseIndex, caseCurrentQIndex, caseAnswers, caseCorrectCount, caseTestFinished, courseSlug, setType, activeCase]);

  if (isLoading) {
    return (
      <div className="proto-body">
        <div className="proto-wrap">
          <Link className="back-link" to="/" style={{ marginBottom: 12, display: "inline-block" }}>
            ← Back to Home
          </Link>
          <div className="loader-container" style={{ paddingTop: 40 }}>
            <Loading text="Loading subjects & chapters…" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="proto-body">
        <div className="proto-wrap">
          <Link className="back-link" to="/" style={{ marginBottom: 12, display: "inline-block" }}>← Back to Home</Link>
          <p className="error-message" style={{ marginTop: 24 }}>{error}</p>
          <Link className="start-btn" to="/" style={{ display: "inline-block", marginTop: 16 }}>Back to Home</Link>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="proto-body">
        <div className="proto-wrap">
          <Link className="back-link" to="/" style={{ marginBottom: 12, display: "inline-block" }}>← Back to Home</Link>
          <h2 style={{ marginTop: 24, fontSize: 20 }}>Course Not Found</h2>
          <p style={{ marginTop: 8, color: "#6b7268" }}>We couldn't find the requested course "{courseSlug}".</p>
          <Link className="start-btn" to="/" style={{ display: "inline-block", marginTop: 16 }}>Back to Home</Link>
        </div>
      </div>
    );
  }

  const isSpomCourse = (courseSlug || "").toLowerCase().includes("spom") ||
                       (course?.course_slug || "").toLowerCase().includes("spom") ||
                       (course?.course_name || "").toLowerCase().includes("spom");

  const totalCourseQuestions = Object.values(questionCounts).reduce((sum, c) => sum + c, 0);
  const totalCaseQuestions = isSpomCourse ? casesList.reduce((sum, c) => sum + (c.questions?.length || 0), 0) : 0;

  const selectedSubject = typeof selectedIndex === "number" ? subjects[selectedIndex] : null;
  const isSelectedCases = selectedIndex === "cases";

  const getChaptersForSubject = (s) => {
    if (!s || !chapters) return [];
    return chapters.filter((ch) => {
      if (!ch) return false;
      if (ch.set_type && s.set_type) {
        if (ch.set_type.trim().toLowerCase() === s.set_type.trim().toLowerCase()) {
          return true;
        }
        const setBelongsToOther = subjects.some(
          (otherSub) =>
            otherSub.id !== s.id &&
            otherSub.set_type &&
            otherSub.set_type.trim().toLowerCase() === ch.set_type.trim().toLowerCase()
        );
        if (setBelongsToOther) return false;
      }
      return String(ch.subject_id) === String(s.id);
    });
  };

  const selectedSubjectChapters = selectedSubject ? getChaptersForSubject(selectedSubject) : [];

  const getSubjectMetrics = (s) => {
    if (!user || !s) {
      return { totalQ: 0, answeredQ: 0, progressPct: 0 };
    }

    const subChs = getChaptersForSubject(s);
    const totalQ = subChs.reduce((sum, ch) => sum + (questionCounts[ch.id] || 0), 0);
    
    const answeredQ = subChs.reduce((sum, ch) => {
      const prog = userProgressMap[String(ch.id)];
      return sum + (prog?.score || 0);
    }, 0);

    const progressPct = totalQ > 0 ? Math.min(Math.round((answeredQ / totalQ) * 100), 100) : 0;
    return { totalQ, answeredQ, progressPct };
  };

  const getCaseScenariosMetrics = () => {
    if (!user || !isSpomCourse) {
      return { totalQ: 0, answeredQ: 0, progressPct: 0 };
    }

    const totalQ = totalCaseQuestions;
    const answeredQ = casesList.reduce((sum, c) => {
      const prog = userProgressMap[`case_${c.id}`];
      return sum + (prog?.score || 0);
    }, 0);

    const progressPct = totalQ > 0 ? Math.min(Math.round((answeredQ / totalQ) * 100), 100) : 0;
    return { totalQ, answeredQ, progressPct };
  };

  const caseMetrics = getCaseScenariosMetrics();

  const handleCardClick = (index) => {
    setSelectedIndex((prev) => (prev === index ? null : index));
  };

  const openCaseDetail = (idx) => {
    setActiveCaseIndex(idx);
    setCaseCurrentQIndex(0);
    setCaseCorrectCount(0);
    setCaseAnswers({});
    setCaseTestFinished(false);
    setViewMode("case_detail");
    window.scrollTo(0, 0);
  };

  const handleCaseAnswer = (qIndex, chosenLetter, correctLetter) => {
    if (caseAnswers[qIndex] !== undefined) return;

    const isCorrect = chosenLetter === correctLetter;
    setCaseAnswers((prev) => ({ ...prev, [qIndex]: chosenLetter }));
    if (isCorrect) {
      setCaseCorrectCount((prev) => prev + 1);
    }
  };



  const handleNextOrSubmit = async () => {
    if (isLastQuestion) {
      // Save test attempt to local storage cache regardless
      const totalQ = activeCaseQuestions.length;
      const finalScore = caseCorrectCount;

      await saveQuizAttempt({
        chapterId: `case_${activeCase?.id || activeCaseIndex}`,
        score: finalScore,
        totalQuestions: totalQ,
      });

      if (!user) {
        // Guest user -> Open Auth Modal to register/login before displaying results
        setShowAuthModal(true);
      } else {
        // Logged-in user -> Reveal results
        setCaseTestFinished(true);
        await loadUserProgress();
      }
    } else {
      setCaseCurrentQIndex((prev) => prev + 1);
    }
  };

  const handleGuestAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError("");
    setAuthLoading(true);

    try {
      if (authTab === "login") {
        await login(authUsername, authPassword, true);
      } else {
        if (!authFavPlace.trim() || !authFirstnameYob.trim()) {
          setAuthError("Please fill in all recovery security questions.");
          setAuthLoading(false);
          return;
        }
        await register(authUsername, authPassword, authFavPlace, authFirstnameYob);
      }

      setShowAuthModal(false);
      setCaseTestFinished(true);
      await loadUserProgress();
    } catch (err) {
      console.error("Auth error:", err);
      setAuthError(err.message || "Authentication failed. Please check your credentials.");
    } finally {
      setAuthLoading(false);
    }
  };

  return (
    <div className="proto-body">
      <div className="proto-wrap">
        <Link className="back-link" to={setType === "chapters" ? "/" : `/course/${courseSlug}`} style={{ marginBottom: 12, display: "inline-block" }}>
          ← Back to {course.course_name}
        </Link>

        {viewMode === "grid" ? (
          <>
            <div className="eyebrow">
              {course.course_name} &middot; {setType && setType !== "chapters" ? safeDecodeURI(setType) : "PRACTICE"} &middot; {totalCourseQuestions + (isSpomCourse ? totalCaseQuestions : 0)} MCQS
            </div>

            <h1>Select subject &amp; chapter</h1>
            <p className="sub">Tap any subject card to reveal its sub-chapters in a full-width panel below.</p>

            <div className="pills">
              <button type="button" className="pill active">
                All subjects ({subjects.length + (isSpomCourse ? 1 : 0)})
              </button>
            </div>

            {/* 3D Flip Cards Grid */}
            <div className="grid">
              {subjects.map((s, i) => {
                const isSelected = selectedIndex === i;
                const subChs = getChaptersForSubject(s);
                const chCount = subChs.length;
                const { totalQ, answeredQ, progressPct } = getSubjectMetrics(s);
                const icon = getSubjectIcon(s.subject_name);

                return (
                  <div
                    key={s.id}
                    className={`card-outer ${isSelected ? "selected" : ""}`}
                    onClick={() => handleCardClick(i)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleCardClick(i);
                      }
                    }}
                  >
                    <div className="card-inner">
                      {/* Card Front */}
                      <div className="card-face card-front">
                        <span className="icon" style={{ zIndex: 2, position: "relative" }}>{icon}</span>
                        <div className="card-content-wrap">
                          <div className="subj-name" title={s.subject_name}>{s.subject_name}</div>
                          <div className="subj-meta">
                            {chCount} {chCount === 1 ? "chapter" : "chapters"} {user ? `· ${progressPct}%` : ""}
                          </div>
                          {user && (
                            <div className="subject-progress-track">
                              <div className="subject-progress-fill" style={{ width: `${progressPct}%` }}></div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Card Back */}
                      <div className="card-face card-back">
                        <span className="icon">✓</span>
                        <div>
                          <div className="subj-name">Selected</div>
                          <div className="subj-meta">{user ? `${answeredQ} of ${totalQ} answered` : "Tap to view chapters"}</div>
                          {user && (
                            <div className="subject-progress-track subject-progress-track-back">
                              <div className="subject-progress-fill subject-progress-fill-back" style={{ width: `${progressPct}%` }}></div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Case Scenarios Card (SPOM Courses Only) */}
              {isSpomCourse && (
                <div
                  className={`card-outer ${isSelectedCases ? "selected" : ""}`}
                  onClick={() => handleCardClick("cases")}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleCardClick("cases");
                    }
                  }}
                >
                  <div className="card-inner">
                    {/* Card Front */}
                    <div className="card-face card-front">
                      <span className="icon" style={{ zIndex: 2, position: "relative" }}>📄</span>
                      <div className="card-content-wrap">
                        <div className="subj-name" title="Case scenarios">Case scenarios</div>
                        <div className="subj-meta">
                          {casesList.length} {casesList.length === 1 ? "case" : "cases"} {user ? `· ${caseMetrics.progressPct}%` : ""}
                        </div>
                        {user && (
                          <div className="subject-progress-track">
                            <div className="subject-progress-fill" style={{ width: `${caseMetrics.progressPct}%` }}></div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Card Back */}
                    <div className="card-face card-back">
                      <span className="icon">✓</span>
                      <div>
                        <div className="subj-name">Selected</div>
                        <div className="subj-meta">{user ? `${caseMetrics.answeredQ} of ${caseMetrics.totalQ} answered` : "Tap to view cases"}</div>
                        {user && (
                          <div className="subject-progress-track subject-progress-track-back">
                            <div className="subject-progress-fill subject-progress-fill-back" style={{ width: `${caseMetrics.progressPct}%` }}></div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Clean Full-Width Container Panel Directly Below Grid */}
            <div className={`panel ${selectedIndex !== null ? "open" : ""}`}>
              {isSelectedCases ? (
                <div className="subchapters-container-panel">
                  <div className="panel-header" style={{ flexWrap: "wrap", gap: 12 }}>
                    <div>
                      <h3 className="panel-subject-title">Case Scenarios</h3>
                      <p style={{ margin: "4px 0 0", fontSize: 13, color: "#6b7268" }}>
                        All 65 ICAI SPOM Case Scenarios with questions &amp; full schedules.
                      </p>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                      <span className="panel-subject-badge">{casesList.length} cases total</span>
                      <button
                        type="button"
                        className="pill"
                        onClick={() => setShowAllCases(!showAllCases)}
                        style={{ fontSize: 12, padding: "4px 12px" }}
                      >
                        {showAllCases ? "Show Paginated" : "Show All 65 Cases"}
                      </button>
                    </div>
                  </div>

                  {/* Search Bar */}
                  <div style={{ margin: "10px 0 16px" }}>
                    <input
                      type="text"
                      placeholder="🔍 Search among all 65 case scenarios by title, number, or topic..."
                      value={caseSearch}
                      onChange={(e) => {
                        setCaseSearch(e.target.value);
                        setCasePage(1);
                      }}
                      style={{
                        width: "100%",
                        padding: "10px 14px",
                        borderRadius: 8,
                        border: "1px solid #e0e2dc",
                        fontSize: 14,
                        fontFamily: "Inter, sans-serif",
                      }}
                    />
                  </div>

                  {(() => {
                    const filteredCases = casesList.filter((c, originalIdx) => {
                      if (!caseSearch.trim()) return true;
                      const q = caseSearch.toLowerCase();
                      const num = originalIdx + 1;
                      return (
                        (c.title || "").toLowerCase().includes(q) ||
                        (c.tag || "").toLowerCase().includes(q) ||
                        (c.topic || "").toLowerCase().includes(q) ||
                        `case ${num}`.includes(q) ||
                        `case scenario ${num}`.includes(q)
                      );
                    });

                    if (filteredCases.length === 0) {
                      return (
                        <div className="subchapter-empty-state">
                          <p>No case scenarios found matching &quot;{caseSearch}&quot;.</p>
                        </div>
                      );
                    }

                    const totalPages = Math.ceil(filteredCases.length / casesPerPage);
                    const currentPage = Math.min(casePage, totalPages);
                    const startIndex = (currentPage - 1) * casesPerPage;
                    const displayedCases = showAllCases || caseSearch.trim()
                      ? filteredCases
                      : filteredCases.slice(startIndex, startIndex + casesPerPage);

                    return (
                      <>
                        <div className="subchapter-rows-list">
                          {displayedCases.map((c) => {
                            // Find original index in casesList
                            const originalIdx = casesList.findIndex((item) => item.id === c.id);
                            const caseNum = originalIdx >= 0 ? originalIdx + 1 : 1;
                            const caseProg = userProgressMap[`case_${c.id}`];
                            const qLength = c.questions && c.questions.length > 0 ? c.questions.length : 5;
                            let countLabel = `Topic: ${c.topic || "General"} · ${qLength} questions`;
                            if (user && caseProg && caseProg.score > 0) {
                              countLabel = `${caseProg.score} of ${c.questions?.length || caseProg.total || 5} answered (${caseProg.percentage}%)`;
                            }

                            return (
                              <div className="subchapter-row" key={c.id || originalIdx}>
                                <div className="subchapter-row-info">
                                  <h4 className="subchapter-row-title">
                                    <span style={{ color: "#A8762C", fontWeight: 700, marginRight: 8, fontFamily: "'IBM Plex Mono', monospace" }}>
                                      Case {caseNum}:
                                    </span>
                                    {c.title}
                                  </h4>
                                  <p className="subchapter-row-meta">{countLabel}</p>
                                </div>
                                <button
                                  type="button"
                                  className="subchapter-start-btn"
                                  onClick={() => openCaseDetail(originalIdx)}
                                >
                                  Start test &rarr;
                                </button>
                              </div>
                            );
                          })}
                        </div>

                        {/* Pagination Bar */}
                        {!showAllCases && !caseSearch.trim() && totalPages > 1 && (
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 20, paddingTop: 16, borderTop: "1px solid #f1f5f9" }}>
                            <span style={{ fontSize: 13, color: "#6b7268", fontFamily: "'IBM Plex Mono', monospace" }}>
                              Showing {startIndex + 1}–{Math.min(startIndex + casesPerPage, filteredCases.length)} of {filteredCases.length} cases
                            </span>
                            <div style={{ display: "flex", gap: 8 }}>
                              <button
                                type="button"
                                className="pill"
                                disabled={currentPage === 1}
                                onClick={() => setCasePage((prev) => Math.max(1, prev - 1))}
                                style={{ opacity: currentPage === 1 ? 0.5 : 1, cursor: currentPage === 1 ? "default" : "pointer" }}
                              >
                                &larr; Previous
                              </button>
                              <span style={{ padding: "6px 10px", fontSize: 13, fontWeight: 600, color: "#0f3d33" }}>
                                Page {currentPage} of {totalPages}
                              </span>
                              <button
                                type="button"
                                className="pill"
                                disabled={currentPage === totalPages}
                                onClick={() => setCasePage((prev) => Math.min(totalPages, prev + 1))}
                                style={{ opacity: currentPage === totalPages ? 0.5 : 1, cursor: currentPage === totalPages ? "default" : "pointer" }}
                              >
                                Next &rarr;
                              </button>
                            </div>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              ) : selectedSubject ? (
                <div className="subchapters-container-panel">
                  <div className="panel-header">
                    <h3 className="panel-subject-title">{selectedSubject.subject_name}</h3>
                    <span className="panel-subject-badge">{selectedSubjectChapters.length} sub-chapters</span>
                  </div>
                  {selectedSubjectChapters.length === 0 ? (
                    <div className="subchapter-empty-state">
                      <p>No sub-chapters available under <strong>{selectedSubject.subject_name}</strong> yet.</p>
                    </div>
                  ) : (
                    <div className="subchapter-rows-list">
                      {selectedSubjectChapters.map((c) => {
                        const qCount = questionCounts[c.id] ?? 0;
                        const tCount = topicCounts[c.id] ?? 0;
                        const prog = userProgressMap[String(c.id)];

                        let countLabel;
                        if (user && prog && prog.score > 0) {
                          countLabel = `${prog.score} of ${qCount || prog.total} answered (${prog.percentage}%)`;
                        } else if (tCount > 0 && qCount > 0) {
                          countLabel = `${tCount} ${tCount === 1 ? "topic" : "topics"} · ${qCount} questions`;
                        } else if (qCount > 0) {
                          countLabel = `${qCount} questions`;
                        } else {
                          countLabel = `1 topic · ${qCount} questions`;
                        }

                        return (
                          <div className="subchapter-row" key={c.id}>
                            <div className="subchapter-row-info">
                              <h4 className="subchapter-row-title">{(c.chapter_name || "").trim() || "Untitled Chapter"}</h4>
                              <p className="subchapter-row-meta">{countLabel}</p>
                            </div>
                            <Link className="subchapter-start-btn" to={`/quiz/${c.id}`}>
                              Start test &rarr;
                            </Link>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </>
        ) : (
          /* Case Scenario Detail View */
          <div id="detailView" style={{ display: "block" }}>
            <button type="button" className="back-link" onClick={() => setViewMode("grid")} style={{ border: "none", background: "transparent", padding: 0 }}>
              ← Back to case scenarios
            </button>

            {activeCase ? (
              <>
                <div className="case-file">
                  <div className="case-meta">
                    <span className="case-tag">{activeCase.tag || "CASE SCENARIO"}</span>
                  </div>
                  <h2 className="case-title">{activeCase.title}</h2>
                  <div className="case-body collapsed">
                    {getParagraphsArray(activeCase?.paragraphs).slice(0, 2).map((p, idx) => (
                      <p key={idx}>{p}</p>
                    ))}
                  </div>
                  <div className="case-actions">
                    <button type="button" className="btn-view-case" onClick={() => setShowFullCaseModal(true)}>
                      View full case
                    </button>
                    <span className="case-note">
                      {activeCaseQuestions.length} questions based on this case
                    </span>
                  </div>
                </div>

                <div className="section-label">
                  <span>Related questions</span>
                </div>

                {/* Test Completed Summary & Percentage Calculation */}
                {caseTestFinished ? (
                  <div className="case-complete-card">
                    <div className="complete-badge">🎉 CASE COMPLETE</div>
                    <h3>Case Scenario Submitted Successfully</h3>
                    <div className="score-percentage-block">
                      <span className="score-number">{caseCorrectCount} / {activeCaseQuestions.length} Correct</span>
                      <span className="score-percentage">
                        {Math.round((caseCorrectCount / Math.max(activeCaseQuestions.length, 1)) * 100)}% Score
                      </span>
                    </div>
                    <p className="score-status-msg">
                      {Math.round((caseCorrectCount / Math.max(activeCaseQuestions.length, 1)) * 100) >= 60
                        ? "Great performance! You passed this case scenario practice."
                        : "Keep practicing to strengthen your concept mastery."}
                    </p>
                    <div className="complete-actions">
                      <button
                        type="button"
                        className="start-btn"
                        onClick={() => openCaseDetail(activeCaseIndex)}
                      >
                        Retake Case Scenario
                      </button>
                      <button
                        type="button"
                        className="btn-view-case"
                        onClick={() => setViewMode("grid")}
                      >
                        Back to Case Scenarios
                      </button>
                    </div>
                  </div>
                ) : currentQ ? (
                  <div className="question-card">
                    {/* Question Progress Dots */}
                    <div className="q-progress">
                      {activeCaseQuestions.map((_, i) => {
                        let cls = "q-dot";
                        if (i < caseCurrentQIndex) cls += " done";
                        if (i === caseCurrentQIndex) cls += " active";
                        return <span key={i} className={cls}></span>;
                      })}
                      <span className="q-progress-label">
                        Question {caseCurrentQIndex + 1} of {activeCaseQuestions.length}
                      </span>
                    </div>

                    <div className="q-head">
                      <span className="q-number">Q{caseCurrentQIndex + 1}.</span>
                      <span className="q-text">{currentQ.text}</span>
                    </div>

                    {/* Options List — SPOM Visual Style */}
                    <div className="options">
                      {currentQ.options?.map((o) => {
                        const chosen = caseAnswers[caseCurrentQIndex];
                        const isAnswered = chosen !== undefined;
                        const letterUpper = (o.letter || "").toUpperCase();
                        const correctUpper = (currentQ.correctLetter || "").toUpperCase();
                        const chosenUpper = (chosen || "").toUpperCase();

                        const isCorrect = letterUpper === correctUpper;
                        const isChosen = letterUpper === chosenUpper;

                        let optCls = "option";
                        let tagHtml = null;

                        if (isAnswered) {
                          optCls += " locked";
                          if (isCorrect) {
                            optCls += " correct-fb";
                            tagHtml = <span className="tag">Correct answer</span>;
                          } else if (isChosen) {
                            optCls += " wrong-fb";
                            tagHtml = <span className="tag">Your choice</span>;
                          }
                        } else if (isChosen) {
                          optCls += " selected";
                        }

                        return (
                          <button
                            key={o.letter}
                            type="button"
                            className={optCls}
                            disabled={isAnswered}
                            onClick={() => handleCaseAnswer(caseCurrentQIndex, o.letter, currentQ.correctLetter)}
                          >
                            <span className="bubble">{o.letter}</span>
                            <span className="otext">{o.text}</span>
                            {tagHtml}
                          </button>
                        );
                      })}
                    </div>

                    {/* Result Tag & Explanation Feedback Panel — SPOM Visual Style */}
                    {caseAnswers[caseCurrentQIndex] !== undefined && (
                      <div id="qFeedback" style={{ marginTop: 22 }}>
                        <div
                          className={`feedback-panel ${
                            (caseAnswers[caseCurrentQIndex] || "").toUpperCase() === (currentQ.correctLetter || "").toUpperCase()
                              ? "is-correct"
                              : "is-wrong"
                          }`}
                        >
                          <div className="fb-head">
                            <span className="fb-icon">
                              {(caseAnswers[caseCurrentQIndex] || "").toUpperCase() === (currentQ.correctLetter || "").toUpperCase() ? "✓" : "✕"}
                            </span>
                            {(caseAnswers[caseCurrentQIndex] || "").toUpperCase() === (currentQ.correctLetter || "").toUpperCase()
                              ? "Correct!"
                              : `Wrong answer — Correct answer is (${currentQ.correctLetter})`}
                          </div>
                          <div className="fb-body">
                            {currentQ.explanation && (
                              <div style={{ marginBottom: currentQ.explanations ? 12 : 0 }}>
                                <b>Explanation: </b>{currentQ.explanation}
                              </div>
                            )}
                            {currentQ.explanations && (
                              <div className="explanation-table-box" style={{ marginTop: 10 }}>
                                <CaseTableRenderer tableData={currentQ.explanations} />
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Next / Submit Button */}
                        <div style={{ marginTop: 18, display: "flex", justifyContent: "flex-end" }}>
                          <button
                            type="button"
                            className="btn primary"
                            style={{ padding: "12px 26px", fontSize: 14, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 8 }}
                            onClick={handleNextOrSubmit}
                          >
                            <span>{isLastQuestion ? "Submit Test & View Results" : "Next Question →"}</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : null}
              </>
            ) : (
              <div className="subchapter-empty-state" style={{ background: "#fff", borderRadius: 14, padding: 32 }}>
                <p>No case scenarios published yet.</p>
              </div>
            )}
          </div>
        )}

        {/* Guest Auth Modal Popup */}
        {showAuthModal && (
          <div className="modal-overlay open" onClick={() => setShowAuthModal(false)}>
            <div className="modal-doc" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 440 }}>
              <div className="modal-head">
                <span className="lbl">🔒 UNLOCK RESULTS</span>
                <button
                  type="button"
                  className="modal-close"
                  onClick={() => setShowAuthModal(false)}
                >
                  &times;
                </button>
              </div>
              <div className="modal-body" style={{ padding: "24px 28px" }}>
                <h3 style={{ fontSize: 20, marginBottom: 8 }}>Unlock Performance Results</h3>
                <p style={{ fontSize: 14, color: "#6b7268", marginTop: 0, marginBottom: 20, lineHeight: 1.5 }}>
                  Your test answers have been saved! Please log in or create a free account to view your score percentage, detailed accuracy breakdown, and progress history.
                </p>

                <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
                  <button
                    type="button"
                    className={`pill ${authTab === "login" ? "active" : ""}`}
                    onClick={() => { setAuthTab("login"); setAuthError(""); }}
                    style={{ flex: 1 }}
                  >
                    Log In
                  </button>
                  <button
                    type="button"
                    className={`pill ${authTab === "register" ? "active" : ""}`}
                    onClick={() => { setAuthTab("register"); setAuthError(""); }}
                    style={{ flex: 1 }}
                  >
                    Register
                  </button>
                </div>

                {authError && (
                  <p style={{ color: "#A83A3A", fontSize: 13, margin: "0 0 16px", background: "#F7EAEA", padding: "8px 12px", borderRadius: 8 }}>
                    {authError}
                  </p>
                )}

                <form onSubmit={handleGuestAuthSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <div>
                    <label style={{ fontSize: 12.5, fontWeight: 600, color: "#1a1f1c", display: "block", marginBottom: 4 }}>
                      Username
                    </label>
                    <input
                      type="text"
                      required
                      value={authUsername}
                      onChange={(e) => setAuthUsername(e.target.value)}
                      placeholder="e.g. rahul123"
                      style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #e0e2dc", fontSize: 14 }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: 12.5, fontWeight: 600, color: "#1a1f1c", display: "block", marginBottom: 4 }}>
                      Password
                    </label>
                    <input
                      type="password"
                      required
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      placeholder="••••••••"
                      style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #e0e2dc", fontSize: 14 }}
                    />
                  </div>

                  {authTab === "register" && (
                    <>
                      <div>
                        <label style={{ fontSize: 12.5, fontWeight: 600, color: "#1a1f1c", display: "block", marginBottom: 4 }}>
                          Favourite Place (Recovery Q1)
                        </label>
                        <input
                          type="text"
                          required
                          value={authFavPlace}
                          onChange={(e) => setAuthFavPlace(e.target.value)}
                          placeholder="e.g. Mumbai"
                          style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #e0e2dc", fontSize: 14 }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: 12.5, fontWeight: 600, color: "#1a1f1c", display: "block", marginBottom: 4 }}>
                          First Name + Birth Year (Recovery Q2)
                        </label>
                        <input
                          type="text"
                          required
                          value={authFirstnameYob}
                          onChange={(e) => setAuthFirstnameYob(e.target.value)}
                          placeholder="e.g. Rahul1998"
                          style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #e0e2dc", fontSize: 14 }}
                        />
                      </div>
                    </>
                  )}

                  <button
                    type="submit"
                    className="start-btn"
                    disabled={authLoading}
                    style={{ marginTop: 8, width: "100%", textAlign: "center", justifyContent: "center" }}
                  >
                    {authLoading ? "Processing…" : authTab === "login" ? "Log In & View Score" : "Register & View Score"}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Modal Document Overlay for Full Case Reading */}
        {showFullCaseModal && activeCase && (
          <div className="modal-overlay open" onClick={() => setShowFullCaseModal(false)} style={{ alignItems: "center" }}>
            <div
              className="modal-doc"
              onClick={(e) => e.stopPropagation()}
              style={{
                maxWidth: 960,
                width: "94vw",
                maxHeight: "90vh",
                display: "flex",
                flexDirection: "column",
                borderRadius: 16,
                overflow: "hidden",
              }}
            >
              <div className="modal-head" style={{ padding: "20px 32px", background: "#173b2a" }}>
                <span className="lbl" style={{ color: "#f0d38a", fontSize: 13, letterSpacing: "1.2px", fontWeight: 600 }}>
                  {activeCase.tag || "CASE FILE"}
                </span>
                <button
                  type="button"
                  className="modal-close"
                  onClick={() => setShowFullCaseModal(false)}
                  aria-label="Close"
                  style={{ width: 36, height: 36, fontSize: 20 }}
                >
                  &times;
                </button>
              </div>
              <div className="modal-body" style={{ maxHeight: "calc(90vh - 76px)", overflowY: "auto", padding: "32px 36px 36px" }}>
                <h3 style={{ fontSize: 24, fontWeight: 700, marginTop: 0, marginBottom: 22, borderBottom: "1px solid #eef1ea", paddingBottom: 14 }}>
                  {activeCase.title}
                </h3>
                {getParagraphsArray(activeCase?.paragraphs).map((p, idx) => (
                  <p key={idx} style={{ fontSize: 16, lineHeight: 1.8, marginBottom: 18, color: "#1c2b20" }}>
                    {p}
                  </p>
                ))}
                <CaseTableRenderer tableData={activeCase.case_table} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ChapterList;