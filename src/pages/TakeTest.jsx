import React, { useState, useEffect, useRef, useMemo } from "react";
import { useParams, useNavigate, useSearchParams, Link } from "react-router-dom";
import { supabase } from "../supabase/supabase";
import { buildTakeTestQuestions } from "../services/takeTestService";
import { saveToMistakeVault } from "../services/mistakeVaultService";
import { submitFeedback } from "../services/feedbackService";
import { useAuth } from "../context/AuthContext";
import AuthModal from "../components/AuthModal";

import CaseTableRenderer from "../components/CaseTableRenderer";

// Helper: format seconds to HH:MM:SS
function formatTime(sec) {
  const isNegative = sec < 0;
  const absSec = Math.abs(sec);
  const h = Math.floor(absSec / 3600);
  const m = Math.floor((absSec % 3600) / 60);
  const s = absSec % 60;
  const str = `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  return isNegative ? `-${str}` : str;
}

// Helper: format duration to human-readable
function formatDuration(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}m ${s}s`;
}

// Case Scenario Box Component (Matching Practice Case Scenario Format with Expanded Breadth)
function CaseBlock({ caseScenario, caseSubQNum, caseTotalQs, onOpenFullCase }) {
  if (!caseScenario) return null;

  const paragraphs = Array.isArray(caseScenario.paragraphs)
    ? caseScenario.paragraphs
    : (typeof caseScenario.paragraphs === "string" ? [caseScenario.paragraphs] : []);

  return (
    <div className="take-test-case-file" style={{
      background: "#ffffff",
      border: "1px solid #cbd5e1",
      borderLeft: "6px solid #0F3D3E",
      borderRadius: "12px",
      padding: "24px 28px",
      marginBottom: "24px",
      boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
      width: "100%",
      boxSizing: "border-box"
    }}>
      {/* Header Meta */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: "14px",
        paddingBottom: "12px",
        borderBottom: "1px solid #f1f5f9",
        flexWrap: "wrap",
        gap: "10px"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{
            fontSize: "11.5px",
            fontWeight: "800",
            letterSpacing: "1px",
            textTransform: "uppercase",
            color: "#0F3D3E",
            background: "rgba(15,61,62,0.08)",
            padding: "4px 10px",
            borderRadius: "6px"
          }}>
            ICAI CASE SCENARIO
          </span>
          {caseScenario.tag && (
            <span style={{
              fontSize: "12px",
              fontWeight: "700",
              background: "#0F3D3E",
              color: "#ffffff",
              padding: "3px 12px",
              borderRadius: "12px"
            }}>
              {caseScenario.tag}
            </span>
          )}
        </div>
        <span style={{
          fontSize: "12.5px",
          fontWeight: "700",
          color: "#0F3D3E",
          background: "#ecfdf5",
          border: "1px solid #a7f3d0",
          padding: "3px 12px",
          borderRadius: "12px"
        }}>
          Question {caseSubQNum} of {caseTotalQs} in this case
        </span>
      </div>

      {/* Case Title */}
      {caseScenario.title && (
        <h3 style={{
          margin: "0 0 14px",
          fontSize: "17px",
          fontWeight: "700",
          color: "#0f172a",
          lineHeight: "1.45"
        }}>
          {caseScenario.title}
        </h3>
      )}

      {/* Case Body Preview */}
      <div style={{ fontSize: "14.5px", lineHeight: "1.7", color: "#334155", marginBottom: "16px" }}>
        {paragraphs.slice(0, 2).map((p, i) => (
          <p key={i} style={{ margin: "0 0 12px" }}>
            {p}
          </p>
        ))}
      </div>

      {/* Case Table if present */}
      {caseScenario.case_table && (
        <CaseTableRenderer tableData={caseScenario.case_table} />
      )}

      {/* Case Actions Bar */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        paddingTop: "14px",
        borderTop: "1px solid #f1f5f9",
        flexWrap: "wrap",
        gap: "10px"
      }}>
        <button
          type="button"
          onClick={onOpenFullCase}
          style={{
            background: "#0F3D3E",
            color: "#ffffff",
            border: "none",
            borderRadius: "6px",
            padding: "9px 18px",
            fontSize: "13.5px",
            fontWeight: "700",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            transition: "all 0.15s ease",
            boxShadow: "0 2px 6px rgba(15,61,62,0.18)"
          }}
        >
          🔍 View Full Case Scenario
        </button>
        <span style={{ fontSize: "13px", color: "#64748b", fontWeight: "600" }}>
          {caseTotalQs} questions based on this scenario
        </span>
      </div>
    </div>
  );
}

// Full Case Scenario Modal Component (Wide Breadth)
function FullCaseModal({ caseScenario, onClose }) {
  if (!caseScenario) return null;

  const paragraphs = Array.isArray(caseScenario.paragraphs)
    ? caseScenario.paragraphs
    : (typeof caseScenario.paragraphs === "string" ? [caseScenario.paragraphs] : []);
  const outroParagraphs = Array.isArray(caseScenario.outro_paragraphs)
    ? caseScenario.outro_paragraphs
    : (typeof caseScenario.outro_paragraphs === "string" ? [caseScenario.outro_paragraphs] : []);

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      background: "rgba(15, 23, 42, 0.75)",
      backdropFilter: "blur(4px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 10000,
      padding: "24px"
    }}>
      <div style={{
        background: "#ffffff",
        borderRadius: "14px",
        maxWidth: "1100px",
        width: "100%",
        maxHeight: "88vh",
        display: "flex",
        flexDirection: "column",
        boxShadow: "0 25px 50px rgba(0,0,0,0.3)",
        overflow: "hidden"
      }}>
        {/* Modal Header */}
        <div style={{
          padding: "20px 28px",
          background: "#0F3D3E",
          color: "#ffffff",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between"
        }}>
          <div>
            <span style={{ fontSize: "11px", fontWeight: "700", letterSpacing: "1px", textTransform: "uppercase", opacity: 0.85 }}>
              FULL ICAI CASE SCENARIO
            </span>
            <h3 style={{ margin: "4px 0 0", fontSize: "18px", fontWeight: "700" }}>
              {caseScenario.title || caseScenario.tag || "Case Scenario Details"}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "rgba(255,255,255,0.15)",
              border: "none",
              color: "#ffffff",
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              fontSize: "22px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              lineHeight: 1
            }}
          >
            &times;
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: "28px 32px", overflowY: "auto", fontSize: "15px", lineHeight: "1.75", color: "#334155" }}>
          {paragraphs.map((p, i) => (
            <p key={i} style={{ margin: "0 0 16px" }}>{p}</p>
          ))}

          {/* Formatted Case Table */}
          {caseScenario.case_table && (
            <CaseTableRenderer tableData={caseScenario.case_table} />
          )}

          {outroParagraphs.map((p, i) => (
            <p key={i} style={{ margin: "0 0 16px", color: "#475569" }}>{p}</p>
          ))}
        </div>

        {/* Modal Footer */}
        <div style={{
          padding: "16px 28px",
          background: "#f8fafc",
          borderTop: "1px solid #e2e8f0",
          display: "flex",
          justifyContent: "flex-end"
        }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "#0F3D3E",
              color: "#ffffff",
              border: "none",
              padding: "10px 24px",
              borderRadius: "6px",
              fontWeight: "700",
              fontSize: "14px",
              cursor: "pointer"
            }}
          >
            Close &amp; Return to Questions
          </button>
        </div>
      </div>
    </div>
  );
}

// Student Feedback Modal Component
function FeedbackModal({ isOpen, onClose, course, scorePercent }) {
  const { user, username } = useAuth();
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [category, setCategory] = useState("Exam Experience");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const categories = [
    "Exam Experience",
    "Question Error / Typo",
    "ICAI Amendment Note",
    "Feature Suggestion",
    "General Praise"
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await submitFeedback({
        userId: user?.id || null,
        username: username || "Guest",
        courseId: course?.id || null,
        courseName: course?.course_name || "Exam",
        rating,
        category,
        message,
        testType: "take-test",
        scorePercent
      });
      setSubmitted(true);
      setTimeout(() => {
        onClose();
        setSubmitted(false);
        setMessage("");
      }, 2000);
    } catch (err) {
      console.error("Feedback error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      background: "rgba(15, 23, 42, 0.7)",
      backdropFilter: "blur(4px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 20000,
      padding: "20px"
    }}>
      <div style={{
        background: "#ffffff",
        borderRadius: "14px",
        maxWidth: "500px",
        width: "100%",
        boxShadow: "0 20px 40px rgba(0,0,0,0.25)",
        overflow: "hidden",
        position: "relative"
      }}>
        {/* Header */}
        <div style={{ padding: "18px 24px", background: "#0F3D3E", color: "#ffffff", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h3 style={{ margin: 0, fontSize: "17px", fontWeight: "700" }}>💬 Test Feedback &amp; Suggestions</h3>
            <span style={{ fontSize: "12px", opacity: 0.85 }}>Help us improve your CA MCQ practice experience</span>
          </div>
          <button type="button" onClick={onClose} style={{ background: "transparent", border: "none", color: "#fff", fontSize: "22px", cursor: "pointer" }}>&times;</button>
        </div>

        {submitted ? (
          <div style={{ padding: "40px 24px", textAlign: "center" }}>
            <div style={{ fontSize: "42px", marginBottom: "12px" }}>🎉</div>
            <h3 style={{ color: "#1E7145", margin: "0 0 8px 0" }}>Thank you for your feedback!</h3>
            <p style={{ color: "#475569", fontSize: "14px", margin: 0 }}>Your suggestions help us keep questions updated and exam-accurate.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ padding: "22px 24px" }}>
            {/* Star Rating */}
            <div style={{ marginBottom: "18px", textAlign: "center" }}>
              <label style={{ fontSize: "12.5px", fontWeight: "700", color: "#475569", display: "block", marginBottom: "6px" }}>
                How was your exam simulation experience?
              </label>
              <div style={{ display: "flex", justifyContent: "center", gap: "8px" }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    style={{
                      background: "none",
                      border: "none",
                      fontSize: "26px",
                      cursor: "pointer",
                      color: star <= (hoverRating || rating) ? "#f59e0b" : "#cbd5e1",
                      transition: "transform 0.1s ease",
                      padding: 0
                    }}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>

            {/* Category selection */}
            <div style={{ marginBottom: "16px" }}>
              <label style={{ fontSize: "12px", fontWeight: "700", color: "#475569", display: "block", marginBottom: "8px" }}>
                Feedback Category:
              </label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    style={{
                      padding: "6px 12px",
                      borderRadius: "16px",
                      fontSize: "12px",
                      fontWeight: "600",
                      cursor: "pointer",
                      border: category === cat ? "1.5px solid #0F3D3E" : "1px solid #cbd5e1",
                      background: category === cat ? "#0F3D3E" : "#f8fafc",
                      color: category === cat ? "#ffffff" : "#475569"
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Text message */}
            <div style={{ marginBottom: "20px" }}>
              <label style={{ fontSize: "12px", fontWeight: "700", color: "#475569", display: "block", marginBottom: "6px" }}>
                Your Message / Suggested Amendments:
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Share any thoughts, report question typos, or request features..."
                rows={4}
                required
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  fontSize: "13.5px",
                  fontFamily: "inherit",
                  boxSizing: "border-box",
                  resize: "vertical"
                }}
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              style={{
                width: "100%",
                padding: "12px",
                background: "#0F3D3E",
                color: "#ffffff",
                border: "none",
                borderRadius: "8px",
                fontWeight: "700",
                fontSize: "14px",
                cursor: "pointer",
                boxShadow: "0 2px 6px rgba(15,61,62,0.2)"
              }}
            >
              {submitting ? "Submitting..." : "Send Feedback"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function TakeTest() {
  const { courseSlug } = useParams();
  const [searchParams] = useSearchParams();
  const setParam = searchParams.get("set") || null;

  const sessionKey = `ca_take_test_active_${courseSlug || "course"}_${setParam || "all"}`;

  const navigate = useNavigate();
  const { user } = useAuth();

  // Data state
  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState(null);
  const [questions, setQuestions] = useState([]);

  // Screens: 'instructions', 'test', 'results'
  const [screen, setScreen] = useState("instructions");

  // Test state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({}); // { index: selectedOption }
  const [marked, setMarked] = useState({}); // { index: boolean }
  const [timeLeft, setTimeLeft] = useState(7200); // 7200s = 2 hours
  const [timerRunning, setTimerRunning] = useState(false);
  const [showTimeUpModal, setShowTimeUpModal] = useState(false);

  // Modals state
  const [showFullCaseModal, setShowFullCaseModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);

  // Question tracking
  const [questionTime, setQuestionTime] = useState({}); // { index: seconds }
  const [showWarningToast, setShowWarningToast] = useState(false);

  // Results state
  const [filter, setFilter] = useState("All");

  // Step 1: Load Course and Check for Active Persisted Test Session
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const { data: courseData, error: courseErr } = await supabase
          .from("courses")
          .select("*")
          .ilike("course_slug", courseSlug)
          .limit(1)
          .single();

        if (courseErr || !courseData) {
          console.error("Course not found", courseErr);
          navigate("/");
          return;
        }
        setCourse(courseData);

        // Check if there is an active session in sessionStorage
        const savedSessionRaw = sessionStorage.getItem(sessionKey);
        if (savedSessionRaw) {
          try {
            const savedSession = JSON.parse(savedSessionRaw);
            if (savedSession.screen === "test" && Array.isArray(savedSession.questions) && savedSession.questions.length > 0) {
              const elapsedSec = Math.floor((Date.now() - (savedSession.savedAt || Date.now())) / 1000);
              const newTimeLeft = Math.max(0, (savedSession.timeLeft || 7200) - elapsedSec);

              setQuestions(savedSession.questions);
              setCurrentIndex(savedSession.currentIndex || 0);
              setAnswers(savedSession.answers || {});
              setMarked(savedSession.marked || {});
              setTimeLeft(newTimeLeft);
              setQuestionTime(savedSession.questionTime || {});
              setScreen("test");
              setTimerRunning(true);
              setLoading(false);
              return;
            }
          } catch (e) {
            console.warn("Session restore parse error:", e);
          }
        }

        // Otherwise generate a fresh test set
        const qData = await buildTakeTestQuestions(courseData.id, setParam);
        setQuestions(qData || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    if (courseSlug) {
      loadData();
    }
  }, [courseSlug, setParam, navigate, sessionKey]);

  // Step 2: Persist active test state on every change
  useEffect(() => {
    if (screen === "test" && questions.length > 0) {
      const stateToSave = {
        screen: "test",
        currentIndex,
        answers,
        marked,
        timeLeft,
        questionTime,
        questions,
        savedAt: Date.now()
      };
      sessionStorage.setItem(sessionKey, JSON.stringify(stateToSave));
    }
  }, [screen, currentIndex, answers, marked, timeLeft, questionTime, questions, sessionKey]);

  // Timer interval
  useEffect(() => {
    let interval = null;
    if (timerRunning) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          const next = prev - 1;
          if (next <= 0) {
            setTimerRunning(false);
            setShowTimeUpModal(true);
          }
          return next;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerRunning]);

  // Question time tracking interval
  useEffect(() => {
    let interval = null;
    if (timerRunning && screen === "test") {
      interval = setInterval(() => {
        setQuestionTime((prev) => {
          const currentSpent = (prev[currentIndex] || 0) + 1;
          if (currentSpent === 120 && !showWarningToast) {
            setShowWarningToast(true);
          }
          return { ...prev, [currentIndex]: currentSpent };
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [currentIndex, timerRunning, screen, showWarningToast]);

  // Reset toast when moving questions
  useEffect(() => {
    setShowWarningToast(false);
  }, [currentIndex]);

  const handleStart = () => {
    setScreen("test");
    setTimerRunning(true);
  };

  const handleOptionSelect = (opt) => {
    setAnswers((prev) => ({ ...prev, [currentIndex]: opt }));
  };

  const handleClearResponse = () => {
    setAnswers((prev) => {
      const next = { ...prev };
      delete next[currentIndex];
      return next;
    });
  };

  const handleMarkAndNext = () => {
    setMarked((prev) => ({ ...prev, [currentIndex]: true }));
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  // Exit handlers
  const handlePauseAndExit = () => {
    setTimerRunning(false);
    navigate(`/course/${courseSlug}`);
  };

  const handleAbandonAndExit = () => {
    setTimerRunning(false);
    sessionStorage.removeItem(sessionKey);
    navigate(`/course/${courseSlug}`);
  };

  // Submit flow: requires login to view results
  const handleSubmitClick = () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    executeSubmit();
  };

  const executeSubmit = async () => {
    setTimerRunning(false);
    setShowTimeUpModal(false);
    setShowAuthModal(false);

    // Clear active session storage on final submit
    sessionStorage.removeItem(sessionKey);

    // Save to mistake vault
    try {
      saveToMistakeVault(questions, answers);
    } catch (err) {
      console.error("Failed to save to mistake vault", err);
    }

    setScreen("results");
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", background: "#f8fafc" }}>
        <div style={{ textAlign: "center" }}>
          <div className="tt-spinner" style={{ margin: "0 auto 16px" }}></div>
          <h3 style={{ color: "#0F3D3E", margin: 0 }}>Preparing 100-Question Exam Simulation...</h3>
        </div>
      </div>
    );
  }

  const setLabel = setParam ? ` (${setParam})` : "";

  // Screen 1: Instructions
  if (screen === "instructions") {
    return (
      <div className="take-test-wrapper" style={{ background: "#f8fafc", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", paddingTop: "50px", paddingBottom: "50px" }}>
        <div style={{ background: "#fff", padding: "36px 40px", borderRadius: "14px", boxShadow: "0 4px 16px rgba(0,0,0,0.06)", maxWidth: "640px", width: "100%", border: "1px solid #e2e8f0" }}>
          <span style={{ fontSize: "11px", fontWeight: "800", color: "#0F3D3E", letterSpacing: "1px", textTransform: "uppercase" }}>
            EXAM SIMULATION{setParam && ` · ${setParam.toUpperCase()}`}
          </span>
          <h1 style={{ margin: "6px 0 14px 0", color: "#0F3D3E", fontSize: "28px" }}>{course?.course_name}{setLabel}</h1>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "24px" }}>
            <span style={{ background: "#f1f5f9", color: "#334155", padding: "4px 10px", borderRadius: "14px", fontSize: "12px", fontWeight: "600" }}>📝 100 Questions</span>
            <span style={{ background: "#f1f5f9", color: "#334155", padding: "4px 10px", borderRadius: "14px", fontSize: "12px", fontWeight: "600" }}>⏱ 2 Hours (120 Mins)</span>
            <span style={{ background: "#f1f5f9", color: "#334155", padding: "4px 10px", borderRadius: "14px", fontSize: "12px", fontWeight: "600" }}>📋 ICAI Style Case Scenarios</span>
            <span style={{ background: "#f1f5f9", color: "#334155", padding: "4px 10px", borderRadius: "14px", fontSize: "12px", fontWeight: "600" }}>🔒 No Instant Hints</span>
          </div>

          <div style={{ background: "#f8fafc", borderRadius: "10px", padding: "18px 20px", marginBottom: "28px", border: "1px solid #e2e8f0" }}>
            <h4 style={{ margin: "0 0 10px 0", color: "#0F3D3E", fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Exam Rules &amp; Structure
            </h4>
            <ul style={{ lineHeight: "1.7", color: "#334155", margin: 0, paddingLeft: "18px", fontSize: "13.5px" }}>
              <li><strong>Case Scenarios:</strong> Integrated ICAI style case scenarios with related sub-questions presented consecutively.</li>
              <li><strong>No Instant Answers:</strong> Feedback and solutions will be revealed on the comprehensive scorecard upon submission.</li>
              <li><strong>Flexibility:</strong> You can navigate between questions, change selections, or clear responses anytime before submitting.</li>
              <li><strong>Results Access:</strong> Login is required to view your detailed scorecard and persist weak questions to your Mistake Vault.</li>
            </ul>
          </div>

          <button
            onClick={handleStart}
            style={{
              width: "100%",
              padding: "14px",
              background: "#0F3D3E",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              fontSize: "16px",
              fontWeight: "700",
              cursor: "pointer",
              boxShadow: "0 4px 12px rgba(15,61,62,0.2)"
            }}
          >
            Start Exam Now →
          </button>
        </div>
      </div>
    );
  }

  // Screen 2: Test Active
  if (screen === "test") {
    const currentQ = questions[currentIndex];
    const isPriority = currentQ?.is_priority;
    const qType = currentQ?.type || "regular";

    let caseSubQNum = 1;
    let caseTotalQs = 1;
    if (qType === "case" && currentQ?.case_id) {
      const caseId = currentQ.case_id;
      const caseQsIndices = questions.reduce((acc, q, i) => {
        if (q.case_id === caseId) acc.push(i);
        return acc;
      }, []);
      caseTotalQs = caseQsIndices.length;
      caseSubQNum = caseQsIndices.indexOf(currentIndex) + 1;
    }

    return (
      <div className="take-test-wrapper" style={{ background: "#f8fafc", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        {/* Topbar */}
        <div className="take-test-topbar" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#fff", borderBottom: "1px solid #e2e8f0", padding: "12px 28px", height: "60px", position: "sticky", top: 0, zIndex: 100 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <button
              type="button"
              onClick={() => setShowExitModal(true)}
              style={{
                background: "#f8fafc",
                border: "1.5px solid #cbd5e1",
                borderRadius: "6px",
                padding: "6px 12px",
                fontSize: "12.5px",
                fontWeight: "700",
                color: "#475569",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "5px"
              }}
            >
              ← Exit Test
            </button>
            <div style={{ fontWeight: "bold", color: "#0F3D3E", fontSize: "17px" }}>CA Quiz</div>
            <div style={{ color: "#64748b", fontSize: "13.5px", borderLeft: "1px solid #e2e8f0", paddingLeft: "14px" }}>
              {course?.course_name}{setLabel}
            </div>
            {qType === "case" && (
              <span style={{
                fontSize: "11.5px",
                fontWeight: "700",
                background: "rgba(15,61,62,0.1)",
                color: "#0F3D3E",
                padding: "3px 10px",
                borderRadius: "20px"
              }}>
                📋 Case Scenario (Q {caseSubQNum}/{caseTotalQs})
              </span>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
            <div style={{ fontSize: "14px", fontWeight: "600" }}>Q {currentIndex + 1}/{questions.length}</div>
            <div style={{ fontSize: "17px", fontWeight: "bold", fontFamily: "monospace", color: timeLeft <= 600 ? "#dc2626" : "#0F3D3E", background: "#f8fafc", padding: "4px 10px", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
              ⏱ {formatTime(timeLeft)}
            </div>
            <button onClick={handleSubmitClick} style={{ background: "#0F3D3E", color: "#fff", border: "none", padding: "8px 18px", borderRadius: "6px", cursor: "pointer", fontWeight: "700", fontSize: "13.5px" }}>Submit</button>
          </div>
        </div>

        {/* Warning Toast */}
        {showWarningToast && (
          <div className="tt-time-warning-toast" style={{ position: "fixed", top: "76px", left: "50%", transform: "translateX(-50%)", background: "#fffbeb", color: "#92400e", padding: "10px 20px", borderRadius: "8px", border: "1px solid #fde68a", zIndex: 500, display: "flex", alignItems: "center", gap: "14px", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}>
            <span style={{ fontSize: "13px", fontWeight: "600" }}>⚠️ Taking more time on this question — consider moving on and returning later</span>
            <button onClick={() => setShowWarningToast(false)} style={{ background: "transparent", border: "none", fontSize: "16px", cursor: "pointer", color: "#92400e" }}>✕</button>
          </div>
        )}

        {/* Full Case Modal */}
        {showFullCaseModal && (
          <FullCaseModal
            caseScenario={currentQ?.case_scenario}
            onClose={() => setShowFullCaseModal(false)}
          />
        )}

        {/* Auth Modal required for submit */}
        {showAuthModal && (
          <AuthModal
            isOpen={showAuthModal}
            onClose={() => setShowAuthModal(false)}
            onSuccess={() => executeSubmit()}
            initialMode="login"
          />
        )}

        {/* Exit Confirmation Modal */}
        {showExitModal && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.7)", backdropFilter: "blur(4px)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 25000, padding: "20px" }}>
            <div style={{ background: "#ffffff", padding: "28px 32px", borderRadius: "14px", width: "450px", textAlign: "center", boxShadow: "0 20px 40px rgba(0,0,0,0.25)" }}>
              <div style={{ fontSize: "36px", marginBottom: "10px" }}>🚪</div>
              <h3 style={{ margin: "0 0 10px 0", color: "#0F3D3E", fontSize: "20px" }}>Exit Exam Simulation?</h3>
              <p style={{ marginBottom: "24px", color: "#475569", fontSize: "14px", lineHeight: "1.6" }}>
                You can pause your exam to resume later, or discard your current session.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <button
                  type="button"
                  onClick={handlePauseAndExit}
                  style={{ background: "#0F3D3E", color: "#fff", border: "none", padding: "11px", borderRadius: "8px", cursor: "pointer", fontWeight: "700", fontSize: "14px" }}
                >
                  ⏸ Pause &amp; Save (Resume Later)
                </button>
                <button
                  type="button"
                  onClick={handleAbandonAndExit}
                  style={{ background: "#fff", color: "#dc2626", border: "1.5px solid #fca5a5", padding: "10px", borderRadius: "8px", cursor: "pointer", fontWeight: "700", fontSize: "13.5px" }}
                >
                  🗑 Abandon &amp; Discard Test
                </button>
                <button
                  type="button"
                  onClick={() => setShowExitModal(false)}
                  style={{ background: "#f1f5f9", color: "#475569", border: "1px solid #cbd5e1", padding: "10px", borderRadius: "8px", cursor: "pointer", fontWeight: "600", fontSize: "13.5px" }}
                >
                  Cancel &amp; Continue Exam
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Time Up Modal */}
        {showTimeUpModal && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 2000 }}>
            <div style={{ background: "#fff", padding: "32px", borderRadius: "12px", width: "420px", textAlign: "center", boxShadow: "0 10px 25px rgba(0,0,0,0.2)" }}>
              <h2 style={{ margin: "0 0 12px 0", color: "#dc2626" }}>⏰ Time Up!</h2>
              <p style={{ marginBottom: "24px", color: "#475569", fontSize: "14px", lineHeight: "1.6" }}>
                The 2-hour time limit has elapsed. Submit your test to generate your scorecard, or continue in overtime.
              </p>
              <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
                <button onClick={handleSubmitClick} style={{ background: "#0F3D3E", color: "#fff", border: "none", padding: "10px 22px", borderRadius: "6px", cursor: "pointer", fontWeight: "700" }}>Submit Now</button>
                <button onClick={() => { setShowTimeUpModal(false); setTimerRunning(true); }} style={{ background: "#f1f5f9", color: "#334155", border: "1px solid #cbd5e1", padding: "10px 20px", borderRadius: "6px", cursor: "pointer", fontWeight: "600" }}>Continue in Overtime</button>
              </div>
            </div>
          </div>
        )}

        {/* Main Body with Expanded Breadth */}
        <div className="take-test-body" style={{ display: "flex", flex: 1, overflow: "hidden", maxWidth: "1400px", width: "100%", margin: "0 auto" }}>
          
          {/* Question Panel (Wide Width) */}
          <div className="take-test-qpanel" style={{ flex: 1, padding: "28px 36px", overflowY: "auto" }}>
            <div className="take-test-qcard" style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "32px 36px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", maxWidth: "1050px", margin: "0 auto", width: "100%", boxSizing: "border-box" }}>
              
              {/* Case scenario block */}
              {qType === "case" && currentQ?.case_scenario && (
                <CaseBlock
                  caseScenario={currentQ.case_scenario}
                  caseSubQNum={caseSubQNum}
                  caseTotalQs={caseTotalQs}
                  onOpenFullCase={() => setShowFullCaseModal(true)}
                />
              )}

              {qType === "case" && (
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  margin: "18px 0 16px",
                  paddingBottom: "8px",
                  borderBottom: "1.5px solid #e2e8f0"
                }}>
                  <span style={{ fontSize: "12px", fontWeight: "800", color: "#0F3D3E", textTransform: "uppercase", letterSpacing: "1px" }}>
                    Related Question
                  </span>
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "14px", alignItems: "center" }}>
                <span style={{ fontSize: "11.5px", background: "#f1f5f9", color: "#475569", padding: "3px 9px", borderRadius: "4px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  {currentQ?.topic || "General"}
                </span>
                {isPriority && <span style={{ color: "#d97706", fontWeight: "700", fontSize: "12.5px", background: "rgba(217,119,6,0.1)", padding: "2px 8px", borderRadius: "4px" }}>(***) Priority Question</span>}
              </div>

              {/* Question Text */}
              <div style={{ fontSize: "17.5px", fontWeight: "600", color: "#0f172a", marginBottom: "24px", lineHeight: "1.68" }}>
                <span style={{ fontWeight: "800", color: "#0F3D3E", marginRight: "8px" }}>Q{currentIndex + 1}.</span>
                {currentQ?.question}
              </div>

              {/* Options List */}
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                {["a", "b", "c", "d"].map((optKey) => {
                  const optText = currentQ?.[`option_${optKey}`];
                  if (!optText) return null;
                  const isSelected = answers[currentIndex] === optKey;
                  return (
                    <div
                      key={optKey}
                      onClick={() => handleOptionSelect(optKey)}
                      className={`take-test-option ${isSelected ? "selected" : ""}`}
                      style={{
                        border: isSelected ? "2px solid #0F3D3E" : "1.5px solid #e2e8f0",
                        background: isSelected ? "rgba(15,61,62,0.05)" : "#ffffff",
                        padding: "15px 20px",
                        borderRadius: "10px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "14px",
                        fontWeight: isSelected ? "600" : "400",
                        transition: "all 0.15s ease",
                        boxSizing: "border-box"
                      }}
                    >
                      <span style={{
                        width: "30px",
                        height: "30px",
                        minWidth: "30px",
                        maxWidth: "30px",
                        borderRadius: "50%",
                        background: isSelected ? "#0F3D3E" : "#f1f5f9",
                        color: isSelected ? "#ffffff" : "#475569",
                        border: isSelected ? "1.5px solid #0F3D3E" : "1.5px solid #cbd5e1",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "13px",
                        fontWeight: "800",
                        flexShrink: 0,
                        marginTop: "1px"
                      }}>
                        {optKey.toUpperCase()}
                      </span>
                      <span style={{ color: "#1e293b", fontSize: "15px", lineHeight: "1.6", flex: 1, wordBreak: "break-word" }}>
                        {optText}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Navigation row */}
              <div className="take-test-qnav" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "36px", paddingTop: "22px", borderTop: "1px solid #e2e8f0", flexWrap: "wrap", gap: "10px" }}>
                <div style={{ display: "flex", gap: "10px" }}>
                  <button onClick={handleClearResponse} style={{ padding: "9px 16px", background: "#fff", border: "1px solid #cbd5e1", borderRadius: "6px", cursor: "pointer", color: "#475569", fontWeight: "600", fontSize: "13px" }}>Clear</button>
                  <button onClick={handleMarkAndNext} style={{ padding: "9px 16px", background: "#fff", border: "1px solid #f59e0b", borderRadius: "6px", cursor: "pointer", color: "#d97706", fontWeight: "600", fontSize: "13px" }}>Mark &amp; Next</button>
                </div>
                <div style={{ display: "flex", gap: "10px" }}>
                  <button onClick={handlePrev} disabled={currentIndex === 0} style={{ padding: "9px 18px", background: currentIndex === 0 ? "#f1f5f9" : "#fff", border: "1px solid #cbd5e1", borderRadius: "6px", cursor: currentIndex === 0 ? "not-allowed" : "pointer", color: "#475569", fontWeight: "600", fontSize: "13px" }}>Previous</button>
                  <button onClick={handleNext} disabled={currentIndex === questions.length - 1} style={{ padding: "9px 26px", background: "#0F3D3E", border: "none", borderRadius: "6px", cursor: currentIndex === questions.length - 1 ? "not-allowed" : "pointer", color: "#fff", fontWeight: "700", fontSize: "13.5px" }}>Next</button>
                </div>
              </div>

            </div>
          </div>

          {/* Palette Panel */}
          <div className="take-test-palette-panel" style={{ width: "310px", background: "#fff", borderLeft: "1px solid #e2e8f0", display: "flex", flexDirection: "column", padding: "22px" }}>
            <h4 style={{ margin: "0 0 14px 0", color: "#0F3D3E", fontSize: "14px", fontWeight: "700" }}>Question Palette</h4>
            
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", overflowY: "auto", alignContent: "flex-start", flex: 1, maxHeight: "calc(100vh - 240px)" }}>
              {questions.map((q, i) => {
                const isAnswered = !!answers[i];
                const isMarked = marked[i];
                const isCurrent = i === currentIndex;
                const isCase = q.type === "case";
                
                let bg = "#fff";
                let border = "1px solid #cbd5e1";
                let color = "#475569";

                if (isAnswered) {
                  bg = "#1E7145";
                  color = "#fff";
                  border = "1px solid #1E7145";
                } else if (isMarked) {
                  bg = "#f59e0b";
                  color = "#fff";
                  border = "1px solid #f59e0b";
                }

                return (
                  <button 
                    key={i}
                    onClick={() => setCurrentIndex(i)}
                    className="tt-palette-btn"
                    title={`Question ${i + 1}${isCase ? " (Case Scenario)" : ""}`}
                    style={{
                      width: "34px",
                      height: "34px",
                      borderRadius: isCase ? "6px" : "50%",
                      background: bg,
                      border: isCurrent ? "2.5px solid #0F3D3E" : border,
                      color: color,
                      fontSize: "12px",
                      fontWeight: "700",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      outline: isCurrent ? "2px solid #0F3D3E" : "none",
                      outlineOffset: "1px"
                    }}
                  >
                    {i + 1}
                  </button>
                );
              })}
            </div>

            <div style={{ marginTop: "18px", paddingTop: "14px", borderTop: "1px solid #e2e8f0", fontSize: "12px", color: "#475569", display: "flex", flexDirection: "column", gap: "6px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}><div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#1E7145" }}></div> Answered</div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}><div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#f59e0b" }}></div> Marked for Review</div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}><div style={{ width: "10px", height: "10px", borderRadius: "50%", border: "1px solid #cbd5e1" }}></div> Not Answered</div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}><div style={{ width: "10px", height: "10px", borderRadius: "3px", border: "1.5px solid #0F3D3E", background: "#f1f5f9" }}></div> Square = Case Scenario</div>
            </div>

          </div>

        </div>
      </div>
    );
  }

  // Screen 3: Results
  if (screen === "results") {
    const totalQuestions = questions.length;
    let correctCount = 0;
    let wrongCount = 0;
    let skippedCount = 0;

    questions.forEach((q, i) => {
      const ans = answers[i];
      if (!ans) {
        skippedCount++;
      } else if (ans === q.correct_option?.toLowerCase()) {
        correctCount++;
      } else {
        wrongCount++;
      }
    });

    const scorePercent = Math.round((correctCount / totalQuestions) * 100) || 0;
    const timeTakenSec = 7200 - timeLeft;
    const isOvertime = timeTakenSec > 7200;
    const extraTime = isOvertime ? timeTakenSec - 7200 : 0;
    const effectiveTimeTaken = isOvertime ? 7200 : timeTakenSec;

    // Filtered questions
    const filteredQuestions = questions.map((q, i) => ({ q, i })).filter(({ q, i }) => {
      const ans = answers[i];
      const isCorrect = ans === q.correct_option?.toLowerCase();
      const isSkipped = !ans;
      const isWrong = ans && !isCorrect;
      const isMarked = marked[i];

      if (filter === "All") return true;
      if (filter === "Correct") return isCorrect;
      if (filter === "Wrong") return isWrong;
      if (filter === "Skipped") return isSkipped;
      if (filter === "Marked") return isMarked;
      return true;
    });

    return (
      <div className="take-test-results take-test-wrapper" style={{ background: "#f8fafc", minHeight: "100vh", padding: "40px 24px" }}>
        
        {/* Feedback Modal */}
        <FeedbackModal
          isOpen={showFeedbackModal}
          onClose={() => setShowFeedbackModal(false)}
          course={course}
          scorePercent={scorePercent}
        />

        <div style={{ maxWidth: "960px", margin: "0 auto" }}>
          
          {/* Summary Card */}
          <div style={{ background: "#fff", borderRadius: "14px", padding: "32px", boxShadow: "0 2px 10px rgba(0,0,0,0.06)", marginBottom: "28px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "20px", border: "1px solid #e2e8f0" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "28px" }}>
              <div className="take-test-score-ring" style={{ width: "110px", height: "110px", borderRadius: "50%", background: `conic-gradient(#1E7145 ${scorePercent}%, #e2e8f0 0)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ width: "92px", height: "92px", borderRadius: "50%", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "26px", fontWeight: "800", color: "#0F3D3E" }}>
                  {scorePercent}%
                </div>
              </div>
              <div>
                <h2 style={{ margin: "0 0 6px 0", color: "#0F3D3E", fontSize: "24px" }}>Test Scorecard</h2>
                <div style={{ color: "#475569", fontSize: "15px", marginBottom: "6px" }}>Course: <strong>{course?.course_name}{setLabel}</strong></div>
                <div style={{ color: "#64748b", fontSize: "14px" }}>
                  Correct: <span style={{ color: "#1E7145", fontWeight: "bold" }}>{correctCount}</span> &bull; 
                  Wrong: <span style={{ color: "#dc2626", fontWeight: "bold", marginLeft: "4px" }}>{wrongCount}</span> &bull; 
                  Skipped: <span style={{ color: "#94a3b8", fontWeight: "bold", marginLeft: "4px" }}>{skippedCount}</span>
                </div>
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ color: "#64748b", fontSize: "13px", marginBottom: "2px" }}>Time Taken</div>
              <div style={{ fontSize: "22px", fontWeight: "800", color: "#0F3D3E" }}>{formatDuration(effectiveTimeTaken)}</div>
              {isOvertime && <div style={{ color: "#dc2626", fontSize: "13px", fontWeight: "700" }}>+ {formatDuration(extraTime)} overtime</div>}
              
              <div style={{ marginTop: "16px", display: "flex", gap: "8px", justifyContent: "flex-end", flexWrap: "wrap" }}>
                <button
                  type="button"
                  onClick={() => setShowFeedbackModal(true)}
                  style={{
                    padding: "8px 14px",
                    border: "1.5px solid #0F3D3E",
                    background: "#ffffff",
                    borderRadius: "6px",
                    color: "#0F3D3E",
                    fontSize: "13px",
                    fontWeight: "700",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "5px"
                  }}
                >
                  💬 Give Feedback
                </button>
                <Link to="/vault" style={{ textDecoration: "none", padding: "8px 14px", border: "1px solid #B08628", background: "rgba(176,134,40,0.08)", borderRadius: "6px", color: "#B08628", fontSize: "13px", fontWeight: "700" }}>📚 Vault</Link>
                <Link to={`/course/${courseSlug}`} style={{ textDecoration: "none", padding: "8px 14px", border: "1px solid #cbd5e1", borderRadius: "6px", color: "#475569", fontSize: "13px", fontWeight: "600" }}>Course</Link>
                <button onClick={() => window.location.reload()} style={{ background: "#0F3D3E", color: "#fff", border: "none", padding: "8px 14px", borderRadius: "6px", cursor: "pointer", fontWeight: "700", fontSize: "13px" }}>Restart</button>
              </div>
            </div>
          </div>

          {/* Filter Row */}
          <div className="take-test-filter-row" style={{ display: "flex", gap: "8px", marginBottom: "20px", overflowX: "auto", paddingBottom: "4px" }}>
            {["All", "Correct", "Wrong", "Skipped", "Marked"].map((f) => (
              <button 
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  padding: "7px 16px",
                  borderRadius: "20px",
                  border: filter === f ? "none" : "1px solid #cbd5e1",
                  background: filter === f ? "#0F3D3E" : "#fff",
                  color: filter === f ? "#fff" : "#475569",
                  fontWeight: "700",
                  cursor: "pointer",
                  fontSize: "13.5px"
                }}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Question Review Cards */}
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {filteredQuestions.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px", color: "#64748b", background: "#fff", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                No questions match the "{filter}" filter.
              </div>
            ) : (
              filteredQuestions.map(({ q, i }) => {
                const ans = answers[i];
                const isCorrect = ans === q.correct_option?.toLowerCase();
                
                let statusColor = "#94a3b8";
                let statusText = "Skipped";
                if (ans) {
                  if (isCorrect) {
                    statusColor = "#1E7145";
                    statusText = "Correct";
                  } else {
                    statusColor = "#dc2626";
                    statusText = "Wrong";
                  }
                }

                return (
                  <div key={i} className="take-test-review-card" style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "24px", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "14px", alignItems: "center" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <span style={{ fontWeight: "800", color: "#0F3D3E", fontSize: "16px" }}>Question {i + 1}</span>
                        <span style={{ background: statusColor, color: "#fff", fontSize: "11.5px", padding: "2px 8px", borderRadius: "12px", fontWeight: "700" }}>{statusText}</span>
                        {marked[i] && <span style={{ background: "#f59e0b", color: "#fff", fontSize: "11.5px", padding: "2px 8px", borderRadius: "12px", fontWeight: "700" }}>Marked</span>}
                      </div>
                      <div style={{ fontSize: "12.5px", color: "#64748b" }}>Time spent: {formatDuration(questionTime[i] || 0)}</div>
                    </div>

                    {q.type === "case" && q.case_scenario && (
                      <div style={{ background: "#f8fafc", borderLeft: "4px solid #0F3D3E", padding: "12px 16px", borderRadius: "6px", marginBottom: "14px", fontSize: "13px", color: "#475569" }}>
                        <strong>Case: {q.case_scenario.tag || q.case_scenario.title}</strong>
                      </div>
                    )}

                    <div style={{ fontSize: "16px", color: "#0f172a", marginBottom: "18px", fontWeight: "600", lineHeight: "1.6" }}>
                      {q.question}
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "18px" }}>
                      {["a", "b", "c", "d"].map((optKey) => {
                        const optText = q[`option_${optKey}`];
                        if (!optText) return null;
                        
                        const isThisCorrect = optKey === q.correct_option?.toLowerCase();
                        const isThisSelected = ans === optKey;
                        
                        let border = "1.5px solid #e2e8f0";
                        let bg = "#f8fafc";
                        let icon = null;

                        if (isThisCorrect) {
                          border = "2px solid #1E7145";
                          bg = "rgba(30,113,69,0.06)";
                          icon = "✓ Correct";
                        } else if (isThisSelected && !isThisCorrect) {
                          border = "2px solid #dc2626";
                          bg = "rgba(220,38,38,0.06)";
                          icon = "✗ Your choice";
                        }

                        return (
                          <div key={optKey} style={{ border, background: bg, padding: "12px 16px", borderRadius: "8px", display: "flex", alignItems: "flex-start", gap: "12px" }}>
                            <span style={{
                              width: "28px",
                              height: "28px",
                              minWidth: "28px",
                              maxWidth: "28px",
                              borderRadius: "50%",
                              background: isThisCorrect ? "#1E7145" : (isThisSelected ? "#dc2626" : "#e2e8f0"),
                              color: (isThisCorrect || isThisSelected) ? "#fff" : "#64748b",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "12.5px",
                              fontWeight: "800",
                              flexShrink: 0,
                              marginTop: "1px"
                            }}>
                              {optKey.toUpperCase()}
                            </span>
                            <span style={{ flex: 1, color: "#1e293b", fontSize: "14px", lineHeight: "1.5" }}>{optText}</span>
                            {icon && <span style={{ fontWeight: "700", fontSize: "12px", color: isThisCorrect ? "#1E7145" : "#dc2626", whiteSpace: "nowrap" }}>{icon}</span>}
                          </div>
                        );
                      })}
                    </div>

                    <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "14px 16px", borderRadius: "8px" }}>
                      <div style={{ fontWeight: "700", color: "#166534", marginBottom: "6px", fontSize: "13.5px" }}>Explanation:</div>
                      <div style={{ color: "#15803d", fontSize: "13.5px", lineHeight: "1.6" }}>
                        {q.explanation || "No explanation provided."}
                      </div>
                    </div>

                  </div>
                );
              })
            )}
          </div>

        </div>
      </div>
    );
  }

  return null;
}
