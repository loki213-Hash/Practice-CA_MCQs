import { useState, useEffect, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { getQuestionsForChapter } from "../services/questionService";
import { getChapterById } from "../services/chapterService";
import { useAuth } from "../context/AuthContext";
import { saveQuizAttempt } from "../services/progressService";
import { supabase } from "../supabase/supabase";

export default function Quiz() {
  const { chapterId } = useParams();
  const { user, username } = useAuth();
  const navigate = useNavigate();

  const [screen, setScreen] = useState("start"); // 'start' | 'quiz' | 'results'
  const [questions, setQuestions] = useState([]);
  const [chapter, setChapter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [activeQuestions, setActiveQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [marked, setMarked] = useState([]);
  const [visited, setVisited] = useState([]);

  // Timer states (3 hours = 10800 seconds)
  const [remainingSeconds, setRemainingSeconds] = useState(10800);
  const [showTimeoutModal, setShowTimeoutModal] = useState(false);
  const [hasConfirmedOvertime, setHasConfirmedOvertime] = useState(false);

  const [showConfirm, setShowConfirm] = useState(false);
  const [shuffleQuestions, setShuffleQuestions] = useState(true);
  const [reviewFilter, setReviewFilter] = useState("all");
  const [flaggedQuestions, setFlaggedQuestions] = useState({});
  const [selectedTopics, setSelectedTopics] = useState({});
  
  // Feedback states
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);

  const PASS_THRESHOLD = 55;
  const FOCUS_THRESHOLD = 60;

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const data = await getQuestionsForChapter(chapterId);
        setQuestions(data);

        // Initialize all unique topics to true (selected)
        const topics = Array.from(new Set(data.map((q) => q.topic))).filter(Boolean);
        const initialSelected = {};
        topics.forEach((t) => {
          initialSelected[t] = true;
        });
        setSelectedTopics(initialSelected);

        try {
          const chapterData = await getChapterById(chapterId);
          setChapter(chapterData);
        } catch (chapErr) {
          console.warn("Failed to load chapter info:", chapErr.message);
        }

        setError(null);
      } catch (err) {
        setError(err.message || "Failed to load questions.");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [chapterId]);

  // strict 3-hour timer ticking logic
  useEffect(() => {
    let interval = null;
    if (screen === "quiz") {
      interval = setInterval(() => {
        setRemainingSeconds((prev) => {
          if (prev === 1 && !hasConfirmedOvertime) {
            setShowTimeoutModal(true);
            return 0;
          }
          if (prev === 0 && !hasConfirmedOvertime) {
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [screen, hasConfirmedOvertime]);

  const formatRemainingTime = (sec) => {
    const isNegative = sec < 0;
    const absSec = Math.abs(sec);
    const h = Math.floor(absSec / 3600).toString().padStart(2, "0");
    const m = Math.floor((absSec % 3600) / 60).toString().padStart(2, "0");
    const s = (absSec % 60).toString().padStart(2, "0");
    return `${isNegative ? "-" : ""}${h}:${m}:${s}`;
  };

  const formatDuration = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    
    const parts = [];
    if (h > 0) parts.push(`${h} hr${h > 1 ? "s" : ""}`);
    if (m > 0) parts.push(`${m} min${m > 1 ? "s" : ""}`);
    if (s > 0 || parts.length === 0) parts.push(`${s} sec${s > 1 ? "s" : ""}`);
    return parts.join(" ");
  };

  const submitFeedback = async () => {
    if (!feedbackMessage.trim()) return;
    setFeedbackSubmitting(true);
    try {
      const { error } = await supabase
        .from("student_feedbacks")
        .insert([
          {
            username: username || "anonymous",
            message: feedbackMessage.trim(),
            created_at: new Date().toISOString()
          }
        ]);
      if (!error) {
        setFeedbackSuccess(true);
      } else {
        alert("Failed to submit feedback. Please try again.");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to submit feedback.");
    } finally {
      setFeedbackSubmitting(false);
    }
  };

  const startTest = () => {
    if (questions.length === 0) return;

    const filteredQuestions = questions.filter((q) => {
      const topic = q.topic;
      if (!topic) return true;
      return selectedTopics[topic] !== false;
    });

    if (filteredQuestions.length === 0) {
      alert("Please select at least one topic to start the test.");
      return;
    }

    let finalQuestions = [...filteredQuestions];
    if (shuffleQuestions) {
      for (let i = finalQuestions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [finalQuestions[i], finalQuestions[j]] = [finalQuestions[j], finalQuestions[i]];
      }
    }

    setActiveQuestions(finalQuestions);
    setCurrent(0);
    setAnswers(new Array(finalQuestions.length).fill(null));
    setMarked(new Array(finalQuestions.length).fill(false));

    const initialVisited = new Array(finalQuestions.length).fill(false);
    initialVisited[0] = true;
    setVisited(initialVisited);

    // Store start timestamp to prevent timer reset on page refresh
    const startKey = `ca_quiz_start_${chapterId}`;
    const existingStart = sessionStorage.getItem(startKey);
    if (!existingStart) {
      sessionStorage.setItem(startKey, Date.now().toString());
    }
    // Calculate remaining time from stored start, so refresh doesn't restart the clock
    const storedStart = parseInt(sessionStorage.getItem(startKey) || Date.now());
    const elapsed = Math.floor((Date.now() - storedStart) / 1000);
    const trueRemaining = Math.max(0, 10800 - elapsed);

    setRemainingSeconds(trueRemaining);
    setHasConfirmedOvertime(false);
    setShowTimeoutModal(false);
    setScreen("quiz");
  };

  const handleFlagQuestion = async (questionId) => {
    if (flaggedQuestions[questionId]) return;
    setFlaggedQuestions((prev) => ({ ...prev, [questionId]: true }));
    
    // Fallback cache: Save flag to localStorage first for admin panel sync if table is missing
    try {
      const localFlags = JSON.parse(localStorage.getItem("ca_quiz_local_flags") || "[]");
      if (!localFlags.some(f => f.question_id === questionId)) {
        localFlags.push({
          question_id: questionId,
          flag_type: "not_required",
          flagged_by: username || "student",
          created_at: new Date().toISOString()
        });
        localStorage.setItem("ca_quiz_local_flags", JSON.stringify(localFlags));
      }
    } catch (e) {
      console.warn("Failed to write local flag cache:", e);
    }

    try {
      const { error } = await supabase
        .from("question_flags")
        .insert([
          {
            question_id: questionId,
            flag_type: "not_required",
            flagged_by: username || "student",
            created_at: new Date().toISOString(),
          },
        ]);
      if (error) {
        console.warn("Failed to save flag to Supabase:", error.message);
      }
    } catch (err) {
      console.error("Flagging error:", err);
    }
  };

  const selectOption = (letter) => {
    if (answers[current] !== null) return;
    const newAnswers = [...answers];
    newAnswers[current] = letter;
    setAnswers(newAnswers);
  };

  const clearResponse = () => {
    // Don't allow clearing after answer has been revealed (prevents cheating)
    if (answers[current] !== null) return;
    const newAnswers = [...answers];
    newAnswers[current] = null;
    setAnswers(newAnswers);
  };

  const goToQuestion = (index) => {
    const newVisited = [...visited];
    newVisited[index] = true;
    setVisited(newVisited);
    setCurrent(index);
  };

  const goPrev = () => {
    if (current > 0) {
      goToQuestion(current - 1);
    } else {
      if (window.confirm("Are you sure you want to exit the quiz? Your current progress will not be saved.")) {
        sessionStorage.removeItem(`ca_quiz_start_${chapterId}`);
        setScreen("start");
      }
    }
  };

  const goNext = () => {
    if (current < activeQuestions.length - 1) {
      goToQuestion(current + 1);
    } else {
      setShowConfirm(true);
    }
  };

  const markAndNext = () => {
    const newMarked = [...marked];
    newMarked[current] = true;
    setMarked(newMarked);
    if (current < activeQuestions.length - 1) {
      goToQuestion(current + 1);
    }
  };

  const finishTest = () => {
    setShowConfirm(false);
    setScreen("results");
    window.scrollTo(0, 0);

    if (user) {
      saveQuizAttempt({
        chapterId: Number(chapterId),
        score: stats.correct,
        totalQuestions: TOTAL,
      }).catch((err) => {
        console.error("Failed to save progress to Supabase:", err);
      });
    }
  };

  const restartTest = () => {
    setScreen("start");
    setRemainingSeconds(10800);
    window.scrollTo(0, 0);
  };

  const TOTAL = screen === "start" ? questions.length : activeQuestions.length;
  
  const uniqueTopics = useMemo(() => {
    return Array.from(new Set(questions.map((q) => q.topic))).filter(Boolean);
  }, [questions]);

  const toggleTopicSelection = (topic) => {
    setSelectedTopics((prev) => ({
      ...prev,
      [topic]: prev[topic] === false ? true : false,
    }));
  };

  // Inline stats calculation
  const stats = (() => {
    let correct = 0;
    let incorrect = 0;
    let unattempted = 0;
    const topicStats = {};

    activeQuestions.forEach((q, i) => {
      const chosen = answers[i];
      const topic = q.topic || "General";
      if (!topicStats[topic]) topicStats[topic] = { correct: 0, total: 0 };
      topicStats[topic].total++;

      if (chosen === null) {
        unattempted++;
      } else if (chosen === q.correct_option) {
        correct++;
        topicStats[topic].correct++;
      } else {
        incorrect++;
      }
    });

    const pct = TOTAL > 0 ? Math.round((correct / TOTAL) * 100) : 0;
    return { correct, incorrect, unattempted, pct, topicStats };
  })();

  const hasPassed = stats.pct >= PASS_THRESHOLD;
  const headline = stats.pct >= 80
    ? "Expert Grip!"
    : stats.pct >= 60
    ? "Good Effort!"
    : stats.pct >= 55
    ? "Pass Mark Cleared"
    : "Review Recommended";

  const focusTopics = Object.keys(stats.topicStats)
    .map((topic) => {
      const st = stats.topicStats[topic];
      const acc = Math.round((st.correct / st.total) * 100);
      return { topic, acc, correct: st.correct, total: st.total };
    })
    .filter((t) => t.acc < FOCUS_THRESHOLD)
    .sort((a, b) => a.acc - b.acc);

  const sortedTopics = Object.keys(stats.topicStats).sort();

  const totalTimeTakenSeconds = remainingSeconds >= 0 
    ? 10800 - remainingSeconds 
    : 10800 + Math.abs(remainingSeconds);

  const extraTimeTakenSeconds = remainingSeconds < 0 
    ? Math.abs(remainingSeconds) 
    : 0;

  const q = activeQuestions[current];
  const isAnswered = q && answers[current] !== null;

  const theme = useMemo(() => {
    if (!chapter) return "default";
    const name = (chapter.chapter_name || "").trim().toLowerCase();
    // Currency / Regulation themes (banknote green)
    if (name.includes("foreign contribution") || name.includes("fcra")) return "fcra";
    if (name.includes("foreign exchange") || name.includes("fema")) return "fema";
    // Stock market themes (dark digital)
    if (name.includes("sebi") || name.includes("securities") || name.includes("stock exchange")) return "sebi";
    // Corporate themes (navy seal)
    if (name.includes("companies act") || name.includes("companies") || name.includes("llp") || name.includes("corporate")) return "companies";
    // Tax themes (ledger brown)
    if (name.includes("income tax") || name.includes("income-tax") || name.includes("gst") || name.includes("customs")) return "incometax";
    // Law / Act themes (fallback green for any remaining act/law chapter)
    if (name.includes("act") || name.includes("law") || name.includes("regulation")) return "fcra";
    return "default";
  }, [chapter]);

  return (
    <div className="quiz-theme-wrapper" data-theme={theme}>
      <div className="masthead">
        <div className="masthead-guilloche"></div>
        <div className="brand">
          <div className="seal">CA</div>
          <div className="title-block">
            <h1>{chapter ? `${chapter.chapter_name.trim()} - Practice` : "Practice Session"}</h1>
            <p>Chapter {chapterId} &mdash; Practice MCQ Session</p>
          </div>
        </div>
        <div className="status">
          {screen !== "start" && (
            <div className="chip">
              Question <b>{screen === "quiz" ? current + 1 : 0}</b> / {TOTAL}
            </div>
          )}
          <div className="chip">
            Time Left <b style={{ fontVariantNumeric: "tabular-nums" }}>{formatRemainingTime(remainingSeconds)}</b>
          </div>
        </div>
      </div>

      {screen === "start" && (
        <div className="screen active">
          <div className="wrap">
            <div className="cover">
              <div className="cover-head">
                <p className="eyebrow">Practice Session &middot; Objective Type</p>
                <h2>Interactive 3-Hour Practice Session</h2>
                <p className="sub">
                  Practice objective questions drawn from the study material. An active 3-hour timer helps you gauge your pace. You will receive instant feedback and detailed explanations as soon as you select an option.
                </p>
              </div>
              <div className="cover-body">
                {loading ? (
                  <p>Loading questions...</p>
                ) : error ? (
                  <p style={{ color: "var(--red)" }}>{error}</p>
                ) : (
                  <>
                    <div className="stat-row">
                      <div className="stat-card">
                        <div className="num">{TOTAL}</div>
                        <div className="lbl">Questions</div>
                      </div>
                      <div className="stat-card">
                        <div className="num">{uniqueTopics.length}</div>
                        <div className="lbl">Topics covered</div>
                      </div>
                      <div className="stat-card">
                        <div className="num">4</div>
                        <div className="lbl">Options each</div>
                      </div>
                      <div className="stat-card">
                        <div className="num">3 hrs</div>
                        <div className="lbl">Time limit</div>
                      </div>
                    </div>

                    <div className="legend-row">
                      <div className="legend-item">
                        <span className="legend-dot" style={{ background: "var(--green)" }}></span>
                        Answered
                      </div>
                      <div className="legend-item">
                        <span
                          className="legend-dot"
                          style={{ background: "var(--red-bg)", border: "1px solid var(--red)" }}
                        ></span>
                        Not answered
                      </div>
                      <div className="legend-item">
                        <span className="legend-dot" style={{ background: "var(--purple)" }}></span>
                        Marked for review
                      </div>
                      <div className="legend-item">
                        <span
                          className="legend-dot"
                          style={{ background: "#fff", border: "1px solid var(--line)" }}
                        ></span>
                        Not visited
                      </div>
                    </div>

                    <div className="instructions">
                      <h3>Instructions</h3>
                      <ol>
                        <li>Each question carries <b>one mark</b>; there is <b>no negative marking</b>.</li>
                        <li>Feedback and explanations are <b>displayed instantly</b> when you select an option.</li>
                        <li>Use <b>Mark for Review &amp; Next</b> to flag questions for later check, or <b>Clear Response</b> to deselect before confirming.</li>
                        <li>If the timer hits <b>00:00:00</b>, a popup will allow you to submit immediately or continue into overtime (which will be logged).</li>
                        <li>Click <b>Submit Test</b> once you are finished.</li>
                      </ol>

                      <div style={{ marginTop: "24px" }}>
                        <h3 style={{ fontFamily: "var(--ff-serif)", fontSize: "16px", color: "var(--navy)", margin: "0 0 8px" }}>
                          Select topics to include (all selected by default)
                        </h3>
                        <p style={{ margin: "0 0 14px", fontSize: "12px", color: "var(--ink-soft)" }}>
                          Tap a topic to select or deselect it from your practice session.
                        </p>
                        {uniqueTopics.length > 0 && (
                          <div className="topic-pills">
                            {uniqueTopics.map((topic) => {
                              const isSelected = selectedTopics[topic] !== false;
                              return (
                                <button
                                  type="button"
                                  key={topic}
                                  className={`topic-pill ${isSelected ? "" : "deselected"}`}
                                  onClick={() => toggleTopicSelection(topic)}
                                  style={{ cursor: "pointer" }}
                                >
                                  {topic} {isSelected ? "✓" : "✗"}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Shuffle Switch Toggle */}
                    <div className="shuffle-row" style={{ marginTop: "20px" }}>
                      <div>
                        <h4 style={{ margin: "0 0 2px", fontWeight: "600" }}>Shuffle Questions</h4>
                        <p style={{ margin: 0, fontSize: "12px", color: "var(--ink-soft)" }}>Randomize question sequence for this practice attempt</p>
                      </div>
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={shuffleQuestions}
                          onChange={(e) => setShuffleQuestions(e.target.checked)}
                        />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>

                    <div className="start-actions-row" style={{ display: "flex", gap: "12px", marginTop: "20px" }}>
                      <button
                        type="button"
                        className="btn start-back-btn"
                        onClick={() => navigate(-1)}
                        style={{
                          flex: 1,
                          padding: "12px",
                          borderRadius: "6px",
                          border: "1px solid var(--line)",
                          background: "var(--card)",
                          color: "var(--ink)",
                          fontWeight: "600",
                          fontSize: "13.5px",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center"
                        }}
                      >
                        &larr; Back to Chapters
                      </button>
                      <button
                        type="button"
                        className="start-btn"
                        style={{ flex: 1.5, marginTop: 0 }}
                        onClick={startTest}
                        disabled={TOTAL === 0}
                      >
                        Start Practice <span className="arrow">&rarr;</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {screen === "quiz" && q && (
        <div className="screen active">
          <div className="wrap">
            <div className="quiz-grid">
              <div className="qcard">
                <div className="qmeta">
                  <span className="qnum">
                    QUESTION {current + 1} OF {TOTAL}
                  </span>
                  <span className="qtopic">{q.topic ? q.topic.toUpperCase() : "GENERAL"}</span>
                </div>
                <p className="qtext">{q.question}</p>
                <div className="options">
                  {["A", "B", "C", "D"].map((letter) => {
                    const optKey = `option_${letter.toLowerCase()}`;
                    const text = q[optKey];
                    let cls = "option";
                    let tagHtml = null;

                    if (isAnswered) {
                      cls += " locked";
                      if (letter === q.correct_option) {
                        cls += " correct-fb";
                        tagHtml = <span className="tag">Correct answer</span>;
                      } else if (letter === answers[current]) {
                        cls += " wrong-fb";
                        tagHtml = <span className="tag">Your choice</span>;
                      }
                    } else if (answers[current] === letter) {
                      cls += " selected";
                    }

                    return (
                      <button
                        key={letter}
                        type="button"
                        className={cls}
                        onClick={() => selectOption(letter)}
                      >
                        <span className="bubble">{letter}</span>
                        <span className="otext">{text}</span>
                        {tagHtml}
                      </button>
                    );
                  })}
                </div>

                {isAnswered && (
                  <div id="qFeedback">
                    <div
                      className={`feedback-panel ${
                        answers[current] === q.correct_option ? "is-correct" : "is-wrong"
                      }`}
                    >
                      <div className="fb-head">
                        <span className="fb-icon">
                          {answers[current] === q.correct_option ? "✓" : "✕"}
                        </span>
                        {answers[current] === q.correct_option ? "Correct!" : "Wrong answer"}
                      </div>
                      <div className="fb-body">
                        <b>Explanation: </b>
                        {q.explanation}
                      </div>
                    </div>
                  </div>
                )}

                <div className="flag-basic-container" style={{ marginTop: isAnswered ? "20px" : "10px", display: "flex", alignItems: "center", gap: "14px" }}>
                  <button
                    type="button"
                    className={`flag-basic-btn ${flaggedQuestions[q.id] ? "flagged" : ""}`}
                    onClick={() => handleFlagQuestion(q.id)}
                    title="If you feel this question is too basic or unnecessary, click to flag it."
                  >
                    <span>🚩</span> {flaggedQuestions[q.id] ? "Flagged as Not Required" : "Not Required?"}
                  </button>
                  <span style={{ fontSize: "11px", color: "var(--ink-soft)", fontWeight: 500 }}>
                    [Ref ID: #{q.id}]
                  </span>
                </div>

                <div className="qnav">
                  <div className="nav-left">
                    <button type="button" className="btn" onClick={goPrev}>
                      {current === 0 ? "← Exit Practice" : "← Previous"}
                    </button>
                    <button type="button" className="btn mark" onClick={markAndNext}>
                      Mark for Review &amp; Next
                    </button>
                  </div>
                  <div className="nav-right">
                    <button type="button" className="btn ghost" onClick={clearResponse}>
                      Clear Response
                    </button>
                    <button type="button" className="btn primary" onClick={goNext}>
                      {current === TOTAL - 1 ? "Finish & Submit" : "Next Question \u2192"}
                    </button>
                  </div>
                </div>
              </div>

              <div className="palette-panel">
                <h4>Question Palette</h4>
                <p className="sub">{TOTAL} ITEMS &middot; TAP TO JUMP</p>
                <div className="palette-legend">
                  <div className="li">
                    <span className="pdot" style={{ background: "var(--green)" }}></span>Answered
                  </div>
                  <div className="li">
                    <span
                      className="pdot"
                      style={{ background: "var(--red-bg)", border: "1px solid var(--red)" }}
                    ></span>
                    Not answered
                  </div>
                  <div className="li">
                    <span className="pdot" style={{ background: "var(--purple)" }}></span>Marked
                  </div>
                  <div className="li">
                    <span
                      className="pdot"
                      style={{ background: "#fff", border: "1px solid var(--line)" }}
                    ></span>
                    Not visited
                  </div>
                </div>
                <div className="palette-grid">
                  {activeQuestions.map((_, i) => {
                    let cls = "pnum";
                    if (marked[i]) {
                      cls += " marked";
                    } else if (answers[i] !== null) {
                      cls += " answered";
                    } else if (visited[i]) {
                      cls += " notanswered";
                    } else {
                      cls += " notvisited";
                    }
                    if (i === current) cls += " current";

                    return (
                      <button
                        key={i}
                        type="button"
                        className={cls}
                        onClick={() => goToQuestion(i)}
                      >
                        {i + 1}
                      </button>
                    );
                  })}
                </div>
                <div className="submit-block">
                  <button type="button" className="btn submit" onClick={() => setShowConfirm(true)}>
                    Submit Test
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {screen === "results" && (
        <div className="screen active">
          <div className="wrap">
            <div className="results-head">
              <div className="score-ring">
                <div className="pct">{stats.pct}%</div>
                <div className="lbl">SCORE</div>
              </div>
              <div className="summary">
                <h3>
                  Test complete.{" "}
                  <span className={`pass-badge ${hasPassed ? "pass" : "fail"}`}>
                    {hasPassed ? "Passed" : "Better Luck Next Time"}
                  </span>
                </h3>
                <p style={{ margin: "-4px 0 16px", fontSize: "15px", color: "rgba(255, 255, 255, 0.8)", fontWeight: "500" }}>
                  {headline}
                </p>
                <div className="breakdown">
                  <div className="rbit correct">
                    <b>{stats.correct}</b>Correct
                  </div>
                  <div className="rbit incorrect">
                    <b>{stats.incorrect}</b>Incorrect
                  </div>
                  <div className="rbit unattempted">
                    <b>{stats.unattempted}</b>Unattempted
                  </div>
                  <div className="rbit">
                    <b>{formatDuration(totalTimeTakenSeconds)}</b>Time taken
                  </div>
                  {extraTimeTakenSeconds > 0 && (
                    <div className="rbit incorrect" style={{ borderColor: "var(--red)" }}>
                      <b style={{ color: "var(--red)" }}>{formatDuration(extraTimeTakenSeconds)}</b>Extra Time Taken
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="panel-title">
              Topics needing focus <span className="rule"></span>
            </div>
            <div className={`focus-panel ${focusTopics.length === 0 ? "is-empty" : ""}`}>
              {focusTopics.length === 0 ? (
                <>
                  <span className="fp-icon">✓</span>
                  <span>
                    No weak areas found &mdash; every topic is at or above {FOCUS_THRESHOLD}%
                    accuracy.
                  </span>
                </>
              ) : (
                <>
                  <p className="focus-intro">
                    Topics where your accuracy fell below {FOCUS_THRESHOLD}%, weakest first.
                  </p>
                  <div className="focus-chips">
                    {focusTopics.map((t) => {
                      const sev = t.acc < 40 ? "sev-high" : "sev-med";
                      return (
                        <div key={t.topic} className={`focus-chip ${sev}`}>
                          <span className="fc-name">{t.topic}</span>
                          <span className="mono" style={{ fontSize: "11px", color: "var(--ink-soft)" }}>
                            {t.correct}/{t.total}
                          </span>
                          <span className="fc-pct">{t.acc}%</span>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            <div style={{ display: "flex", gap: "12px", margin: "20px 0 32px", flexWrap: "wrap" }}>
              <Link to="/" style={{ textDecoration: 'none' }}>
                <button type="button" className="btn primary">
                  Back to Home
                </button>
              </Link>
              <button type="button" className="btn" onClick={restartTest}>
                Restart Test
              </button>
              <button
                type="button"
                className="btn"
                onClick={() => {
                  setShowFeedbackModal(true);
                  setFeedbackSuccess(false);
                  setFeedbackMessage("");
                }}
                style={{ border: "1px solid var(--brass)", color: "var(--brass)", background: "none" }}
              >
                📝 Send Feedback
              </button>
            </div>

            <div className="panel-title">
              Topic-wise performance <span className="rule"></span>
            </div>
            <table className="topic-table">
              <thead>
                <tr>
                  <th>Topic</th>
                  <th>Score</th>
                  <th style={{ width: "180px" }}>Accuracy</th>
                </tr>
              </thead>
              <tbody>
                {sortedTopics.map((topic) => {
                  const st = stats.topicStats[topic];
                  const acc = Math.round((st.correct / st.total) * 100);
                  return (
                    <tr key={topic}>
                      <td>{topic}</td>
                      <td className="mono">
                        {st.correct} / {st.total}
                      </td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <div className="bar-track">
                            <div className="bar-fill" style={{ width: `${acc}%` }}></div>
                          </div>
                          <span
                            className="mono"
                            style={{ fontSize: "12px", color: "var(--ink-soft)" }}
                          >
                            {acc}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div className="panel-title" style={{ marginTop: "38px" }}>
              Full answer review <span className="rule"></span>
            </div>
            <div className="filter-row">
              <button
                type="button"
                className={`filter-btn ${reviewFilter === "all" ? "active" : ""}`}
                onClick={() => setReviewFilter("all")}
              >
                All {TOTAL}
              </button>
              <button
                type="button"
                className={`filter-btn ${reviewFilter === "incorrect" ? "active" : ""}`}
                onClick={() => setReviewFilter("incorrect")}
              >
                Incorrect
              </button>
              <button
                type="button"
                className={`filter-btn ${reviewFilter === "correct" ? "active" : ""}`}
                onClick={() => setReviewFilter("correct")}
              >
                Correct
              </button>
              <button
                type="button"
                className={`filter-btn ${reviewFilter === "unattempted" ? "active" : ""}`}
                onClick={() => setReviewFilter("unattempted")}
              >
                Unattempted
              </button>
            </div>
            <div>
              {activeQuestions.map((q, i) => {
                const chosen = answers[i];
                const isCorrect = chosen === q.correct_option;
                const isUnattempted = chosen === null;
                const status = isUnattempted ? "unattempted" : isCorrect ? "correct" : "incorrect";

                if (reviewFilter !== "all" && reviewFilter !== status) return null;

                const statusLabel = isUnattempted ? "Unattempted" : isCorrect ? "Correct" : "Incorrect";

                return (
                  <div key={i} className="review-card">
                    <div className="rtop">
                      <span className="qnum mono" style={{ color: "var(--brass)" }}>
                        Q{i + 1} &middot; {q.topic || "General"}
                      </span>
                      <span className={`status-tag ${status}`}>{statusLabel}</span>
                    </div>
                    <p className="rq">{q.question}</p>
                    <div className="ropt-list">
                      {["A", "B", "C", "D"].map((letter) => {
                        let cls = "ropt";
                        if (letter === q.correct_option) cls += " correct-answer";
                        else if (letter === chosen) cls += " wrong-choice";
                        
                        return (
                          <div key={letter} className={cls}>
                            <span className="rb">{letter}</span>
                            <span>{q[`option_${letter.toLowerCase()}`]}</span>
                          </div>
                        );
                      })}
                    </div>
                    <div className="explain">
                      <b>Explanation: </b>
                      {q.explanation}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="restart-row">
              <button type="button" className="btn primary" onClick={restartTest}>
                Restart Test
              </button>
              <Link to="/" style={{ textDecoration: 'none' }}>
                <button type="button" className="btn" style={{ marginLeft: "10px" }}>
                  Back to Home
                </button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM SUBMIT OVERLAY */}
      <div className={`confirm-overlay ${showConfirm ? "open" : ""}`}>
        <div className="confirm-box">
          <p>Submit the test? You will not be able to change your answers after this.</p>
          <div className="confirm-actions">
            <button type="button" className="btn" onClick={() => setShowConfirm(false)}>
              Cancel
            </button>
            <button type="button" className="btn primary" onClick={finishTest}>
              Submit
            </button>
          </div>
        </div>
      </div>

      {/* TIMEOUT OVERLAY POPUP */}
      {showTimeoutModal && (
        <div className="confirm-overlay open" style={{ zIndex: 10000 }}>
          <div className="confirm-box" style={{ maxWidth: "450px" }}>
            <h3 style={{ fontFamily: "var(--ff-serif)", fontSize: "22px", color: "var(--navy)", margin: "0 0 10px" }}>
              ⏰ 3 Hours Completed!
            </h3>
            <p style={{ margin: "10px 0 20px", fontSize: "14px", color: "var(--ink-soft)", lineHeight: "1.5" }}>
              You have completed the strict 3-hour limit. You can submit the exam now or continue testing (overtime will be logged and displayed in your results).
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <button
                type="button"
                className="btn primary"
                style={{ width: "100%", height: "46px" }}
                onClick={() => {
                  setShowTimeoutModal(false);
                  finishTest();
                }}
              >
                Submit Test
              </button>
              <button
                type="button"
                className="btn ghost"
                style={{ width: "100%", height: "46px", background: "none", border: "1px solid var(--line)" }}
                onClick={() => {
                  setHasConfirmedOvertime(true);
                  setShowTimeoutModal(false);
                }}
              >
                Continue Test
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Feedback Modal Overlay */}
      {showFeedbackModal && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0,0,0,0.55)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 10000,
          padding: "20px"
        }}>
          <div style={{
            background: "#fff",
            borderRadius: "12px",
            padding: "28px",
            maxWidth: "480px",
            width: "100%",
            boxShadow: "0 10px 30px rgba(0,0,0,0.2)"
          }}>
            <h3 style={{ fontSize: "18px", color: "var(--navy)", fontWeight: 700, margin: "0 0 10px", textAlign: "left" }}>
              📝 Submit Student Feedback
            </h3>
            <p style={{ fontSize: "12.5px", color: "#6b7280", margin: "0 0 16px", textAlign: "left", lineHeight: "1.4" }}>
              Your feedback is sent directly to the administrators to improve question quality.
            </p>
            
            {feedbackSuccess ? (
              <div style={{ background: "#edfcf2", border: "1px solid #c3eccf", color: "#1e7e34", padding: "12px 14px", borderRadius: "8px", fontSize: "13px", marginBottom: "16px", textAlign: "left" }}>
                ✓ Feedback submitted successfully. Thank you for your contribution!
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <textarea
                  placeholder="Type your feedback message here (e.g. Chapter 3 Question 14 contains a spelling error in Option B)..."
                  rows="5"
                  value={feedbackMessage}
                  onChange={(e) => setFeedbackMessage(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px",
                    border: "1px solid #e1e4eb",
                    borderRadius: "8px",
                    outline: "none",
                    fontSize: "13px",
                    lineHeight: "1.5",
                    background: "#fff"
                  }}
                  disabled={feedbackSubmitting}
                />
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "18px" }}>
              {feedbackSuccess ? (
                <button
                  type="button"
                  className="btn"
                  onClick={() => {
                    setShowFeedbackModal(false);
                    setFeedbackSuccess(false);
                    setFeedbackMessage("");
                  }}
                  style={{ height: "36px", fontSize: "12.5px" }}
                >
                  Close
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    className="btn"
                    onClick={() => setShowFeedbackModal(false)}
                    style={{ background: "none", border: "1px solid #e1e4eb", color: "#555", height: "36px", fontSize: "12.5px" }}
                    disabled={feedbackSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn primary"
                    onClick={submitFeedback}
                    style={{ height: "36px", fontSize: "12.5px" }}
                    disabled={feedbackSubmitting || !feedbackMessage.trim()}
                  >
                    {feedbackSubmitting ? "Submitting..." : "Submit Feedback"}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
