import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { getQuestionsForChapter } from "../services/questionService";
import { getChapterById } from "../services/chapterService";
import { supabase } from "../supabase/supabase";

export default function Quiz() {
  const { chapterId } = useParams();
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

  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const [showConfirm, setShowConfirm] = useState(false);
  const [reviewFilter, setReviewFilter] = useState("all"); // 'all' | 'correct' | 'incorrect' | 'unattempted'
  const [flaggedQuestions, setFlaggedQuestions] = useState({});
  const [selectedTopics, setSelectedTopics] = useState({});

  const PASS_THRESHOLD = 55;

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

  useEffect(() => {
    let interval = null;
    if (screen === "quiz") {
      interval = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (interval) clearInterval(interval);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [screen]);

  const formatTime = (sec) => {
    const m = Math.floor(sec / 60)
      .toString()
      .padStart(2, "0");
    const s = Math.floor(sec % 60)
      .toString()
      .padStart(2, "0");
    return `${m}:${s}`;
  };

  const startTest = () => {
    if (questions.length === 0) return;

    // Filter active questions based on selected topics
    const filteredQuestions = questions.filter((q) => {
      const topic = q.topic;
      if (!topic) return true; // Default general topics
      return selectedTopics[topic] !== false;
    });

    if (filteredQuestions.length === 0) {
      alert("Please select at least one topic to start the test.");
      return;
    }

    setActiveQuestions(filteredQuestions);
    setCurrent(0);
    setAnswers(new Array(filteredQuestions.length).fill(null));
    setMarked(new Array(filteredQuestions.length).fill(false));

    const initialVisited = new Array(filteredQuestions.length).fill(false);
    initialVisited[0] = true;
    setVisited(initialVisited);

    setElapsedSeconds(0);
    setScreen("quiz");
  };

  const handleFlagQuestion = async (questionId) => {
    if (flaggedQuestions[questionId]) return;
    setFlaggedQuestions((prev) => ({ ...prev, [questionId]: true }));
    try {
      const { error } = await supabase
        .from("question_flags")
        .insert([
          {
            question_id: questionId,
            flag_type: "not_required",
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
    if (answers[current] !== null) return; // locked
    const newAnswers = [...answers];
    newAnswers[current] = letter;
    setAnswers(newAnswers);
  };

  const clearResponse = () => {
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
  };

  const restartTest = () => {
    setScreen("start");
    setElapsedSeconds(0);
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

  const q = activeQuestions[current];
  const isAnswered = q && answers[current] !== null;

  // Results computations
  const stats = useMemo(() => {
    let correct = 0;
    let incorrect = 0;
    let unattempted = 0;
    const topicStats = {};

    activeQuestions.forEach((q, i) => {
      const topic = q.topic || "General";
      if (!topicStats[topic]) topicStats[topic] = { correct: 0, total: 0 };
      topicStats[topic].total++;

      if (answers[i] === null) {
        unattempted++;
      } else if (answers[i] === q.correct_option) {
        correct++;
        topicStats[topic].correct++;
      } else {
        incorrect++;
      }
    });

    const pct = TOTAL === 0 ? 0 : Math.round((correct / TOTAL) * 100);
    return { correct, incorrect, unattempted, pct, topicStats };
  }, [activeQuestions, answers, TOTAL]);

  let headline = "";
  if (stats.pct >= 80) headline = "Excellent work — exam-ready performance.";
  else if (stats.pct >= 60) headline = "Solid attempt — a bit more revision will seal it.";
  else if (stats.pct >= 55) headline = "Fair attempt — revisit the flagged topics below.";
  else headline = "Needs more preparation — review each explanation carefully.";

  const hasPassed = stats.pct >= PASS_THRESHOLD;

  const FOCUS_THRESHOLD = 60;
  const focusTopics = useMemo(() => {
    return Object.keys(stats.topicStats)
      .map((topic) => {
        const st = stats.topicStats[topic];
        return {
          topic,
          acc: Math.round((st.correct / st.total) * 100),
          correct: st.correct,
          total: st.total,
        };
      })
      .filter((t) => t.acc < FOCUS_THRESHOLD)
      .sort((a, b) => a.acc - b.acc);
  }, [stats.topicStats]);

  const sortedTopics = Object.keys(stats.topicStats).sort();

  return (
    <>
      <div className="masthead">
        <div className="brand">
          <div className="seal">CA</div>
          <div className="title-block">
            <h1>{chapter ? `${chapter.chapter_name.trim()} - Test` : "Practice Test"}</h1>
            <p>Chapter {chapterId} &mdash; Practice MCQ Test</p>
          </div>
        </div>
        <div className="status">
          {screen !== "start" && (
            <div className="chip">
              Question <b>{screen === "quiz" ? current + 1 : 0}</b> / {TOTAL}
            </div>
          )}
          <div className="chip">
            Time <b>{formatTime(elapsedSeconds)}</b>
          </div>
        </div>
      </div>

      {screen === "start" && (
        <div className="screen active">
          <div className="wrap">
            <div className="cover">
              <div className="cover-head">
                <p className="eyebrow">Practice Test &middot; Objective Type</p>
                <h2>Test your grip before it's tested in the exam hall.</h2>
                <p className="sub">
                  Objective questions drawn from the study material &mdash; covering all key sections and topics, with a sharp focus on limits, conditions and exceptions.
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
                        <div className="num">&infin;</div>
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
                        <li>Each question carries <b>one mark</b>; there is <b>no negative marking</b> in this practice test.</li>
                        <li>As soon as you tap an option, you'll instantly see whether it's <b>Correct</b> or <b>Wrong</b>, along with a full <b>explanation</b> &mdash; then move on with <b>Next</b>.</li>
                        <li>Use <b>Mark for Review &amp; Next</b> to flag a question, or <b>Clear Response</b> to unlock and re-attempt an answered question.</li>
                        <li>The <b>question palette</b> on the right lets you jump to any question directly, at any time.</li>
                        <li>Click <b>Submit Test</b> once you are done &mdash; you can submit even with questions left unanswered.</li>
                        <li>On submission, you'll see your overall <b>pass percentage</b>, a topic-wise performance breakdown, and a full explanation for every question.</li>
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

                    <button
                      type="button"
                      className="start-btn"
                      style={{ marginTop: "20px" }}
                      onClick={startTest}
                      disabled={TOTAL === 0}
                    >
                      Start Test <span className="arrow">&rarr;</span>
                    </button>
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

                <div className="flag-basic-container">
                  <button
                    type="button"
                    className={`flag-basic-btn ${flaggedQuestions[q.id] ? "flagged" : ""}`}
                    onClick={() => handleFlagQuestion(q.id)}
                    title="If you feel this question is too basic or unnecessary, click to flag it. Flagged questions will be reviewed by admin for potential removal."
                  >
                    <span>🚩</span> {flaggedQuestions[q.id] ? "Flagged as Not Required" : "Not Required?"}
                  </button>
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

                <div className="qnav">
                  <div className="nav-left">
                    <button type="button" className="btn" onClick={goPrev} disabled={current === 0}>
                      &larr; Previous
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
                    <b>{formatTime(elapsedSeconds)}</b>Time taken
                  </div>
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

            <div style={{ display: "flex", gap: "12px", margin: "20px 0 32px" }}>
              <Link to="/" style={{ textDecoration: 'none' }}>
                <button type="button" className="btn primary">
                  Back to Home
                </button>
              </Link>
              <button type="button" className="btn" onClick={restartTest}>
                Restart Test
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
    </>
  );
}
