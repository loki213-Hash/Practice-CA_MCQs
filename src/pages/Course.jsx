import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { getCourseBySlug } from "../services/courseService";
import Loading from "../components/Loading";

function Course() {
  const { courseSlug } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [error, setError] = useState("");

  // 'mode_selection' | 'select_set_take_test' | 'select_set_practice'
  const [currentStep, setCurrentStep] = useState("mode_selection");

  useEffect(() => {
    async function loadCourse() {
      try {
        const loadedCourse = await getCourseBySlug(courseSlug);
        if (!loadedCourse) {
          setError(`Course "${courseSlug}" was not found.`);
          return;
        }
        setCourse(loadedCourse);
      } catch (loadError) {
        setError("This course could not be loaded.");
        console.error(loadError);
      }
    }
    loadCourse();
  }, [courseSlug, navigate]);

  if (error) {
    return (
      <>
        <nav className="inner-navbar">
          <Link className="brand" to="/">
            <img src="/ca-logo.png" alt="CA" />
            <span className="brand-title">CAmcqs-Practice</span>
          </Link>
        </nav>
        <div className="page-shell">
          <p className="error-message">{error}</p>
          <Link className="btn primary" to="/" style={{ marginTop: 16 }}>Back to Home</Link>
        </div>
      </>
    );
  }

  if (!course) {
    return (
      <div className="loader-container">
        <Loading text="Loading course…" />
      </div>
    );
  }

  const isSpom = (courseSlug || "").toLowerCase().includes("spom") ||
                 (course.course_slug || "").toLowerCase().includes("spom") ||
                 (course.course_name || "").toLowerCase().includes("spom");

  const isAdvItt = course && (
    course.course_slug?.toLowerCase().includes("advitt") ||
    course.course_slug?.toLowerCase().includes("itt") ||
    course.course_name?.toLowerCase().includes("adv") ||
    course.course_name?.toLowerCase().includes("itt")
  );

  const isFinal = course && (
    course.course_slug?.toLowerCase().includes("final") ||
    course.course_name?.toLowerCase().includes("final")
  );

  const isAvailable = course.available !== false;

  // Handle Mode Actions
  const handlePracticeClick = () => {
    if (isSpom) {
      setCurrentStep("select_set_practice");
    } else {
      navigate(`/course/${courseSlug}/chapters`);
    }
  };

  const handleTakeTestClick = () => {
    if (isSpom || isAdvItt) {
      setCurrentStep("select_set_take_test");
    } else {
      navigate(`/take-test/${courseSlug}`);
    }
  };

  return (
    <div className="quiz-theme-wrapper" data-theme={isAdvItt ? "advitt" : "default"}>
      {isAdvItt ? (
        <div className="masthead">
          <div className="brand">
            <div className="seal">ADV<br />ITT</div>
            <div className="title-block">
              <h1>{course.course_name} — Live Quiz Bank</h1>
              <p>Advanced Information Technology Training · ICAI Format</p>
            </div>
          </div>
        </div>
      ) : (
        <nav className="inner-navbar">
          <Link className="brand" to="/">
            <img src="/ca-logo.png" alt="CA" />
            <span className="brand-title">CAmcqs-Practice</span>
          </Link>
        </nav>
      )}

      <div className="page-shell">
        <Link className="back-link" to="/" style={{ marginBottom: 8, display: "inline-block" }}>
          ← All courses
        </Link>

        {/* STEP 1: MODE SELECTION (Practice vs Take Test) */}
        {currentStep === "mode_selection" && (
          <>
            <header className="course-mode-header">
              <span className="course-mode-eyebrow">
                {isAdvItt
                  ? "ADVANCED INFORMATION TECHNOLOGY TRAINING"
                  : course.course_name.toUpperCase()}
              </span>
              <h1>Choose your mode</h1>
              <p>How would you like to prepare today?</p>
            </header>

            <div className="course-mode-grid">

              {/* ── Practice Test Card ── */}
              <div className="course-mode-card practice-mode-card">
                <div className="mode-card-icon">📖</div>
                <div className="mode-card-badge practice-badge">Chapter-wise</div>
                <h2 className="mode-card-title">Practice Test</h2>
                <p className="mode-card-desc">
                  Select a chapter or topic and practice with <strong>instant feedback</strong> and
                  explanations after each question. Perfect for concept revision.
                </p>
                <ul className="mode-card-features">
                  <li>✓ Instant explanation on every question</li>
                  <li>✓ Select specific topics to practice</li>
                  <li>✓ Progress tracked per chapter</li>
                  <li>✓ Resume interrupted sessions</li>
                </ul>
                {isAvailable ? (
                  <button
                    type="button"
                    onClick={handlePracticeClick}
                    className="mode-card-cta practice-cta"
                    style={{ cursor: "pointer", border: "none", width: "100%" }}
                  >
                    Select Chapter →
                  </button>
                ) : (
                  <span className="mode-card-cta disabled-cta">Coming Soon 🕐</span>
                )}
              </div>

              {/* ── Take Test Card ── */}
              <div className="course-mode-card take-test-mode-card">
                <div className="mode-card-icon">🎯</div>
                <div className="mode-card-badge exam-badge">Exam Simulation</div>
                <h2 className="mode-card-title">Take Test</h2>
                <p className="mode-card-desc">
                  Full <strong>100-question exam simulation</strong> covering all subjects and
                  chapters. No instant feedback — just like the real ICAI exam.
                </p>
                <ul className="mode-card-features">
                  <li>✓ 100 questions from all chapters</li>
                  <li>✓ 2-hour strict timer</li>
                  <li>✓ ICAI Pattern Case Scenarios</li>
                  <li>✓ High-Weightage &amp; Priority Questions</li>
                  <li>✓ Review &amp; retry after submission</li>
                </ul>
                {isFinal ? (
                  <span className="mode-card-cta disabled-cta">Coming Soon 🕐</span>
                ) : isAvailable ? (
                  <button
                    type="button"
                    onClick={handleTakeTestClick}
                    className="mode-card-cta exam-cta"
                    style={{ cursor: "pointer", border: "none", width: "100%" }}
                  >
                    Start Exam →
                  </button>
                ) : (
                  <span className="mode-card-cta disabled-cta">Coming Soon 🕐</span>
                )}
              </div>

            </div>
          </>
        )}

        {/* STEP 2: SET SELECTION FOR TAKE TEST */}
        {currentStep === "select_set_take_test" && (
          <div style={{ maxWidth: "800px", margin: "0 auto", animation: "fadeIn 0.25s ease-out" }}>
            <button
              type="button"
              onClick={() => setCurrentStep("mode_selection")}
              className="back-link"
              style={{ border: "none", background: "transparent", cursor: "pointer", padding: "0 0 16px 0", fontSize: "14px", fontWeight: "600", color: "#0F3D3E" }}
            >
              ← Back to Mode Selection
            </button>

            <header className="course-mode-header" style={{ padding: "0 0 24px" }}>
              <span className="course-mode-eyebrow">EXAM SIMULATION</span>
              <h1>Select your Exam Set</h1>
              <p>Choose the paper or module for your 100-question timed mock test:</p>
            </header>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px" }}>
              
              {/* SPOM SET A */}
              {isSpom && (
                <>
                  <div className="course-mode-card" style={{ border: "2px solid #0F3D3E", background: "#fff", display: "flex", flexDirection: "column" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                      <span className="mode-card-badge exam-badge" style={{ margin: 0 }}>Active Set</span>
                      <span style={{ fontSize: "12px", fontWeight: "700", color: "#0F3D3E" }}>100 Questions · 2 Hrs</span>
                    </div>
                    <h3 style={{ margin: "0 0 8px 0", color: "#0F3D3E", fontSize: "20px" }}>SET A — Corporate &amp; Economic Laws</h3>
                    <p style={{ fontSize: "13.5px", color: "#475569", lineHeight: "1.6", flex: 1, margin: "0 0 16px" }}>
                      Covers Companies Act 2013, SEBI Act &amp; Regulations, FEMA, FCRA, and IBC 2016 with 6 Case Scenarios.
                    </p>
                    <Link
                      to={`/take-test/${courseSlug}?set=SET%20A`}
                      className="mode-card-cta exam-cta"
                      style={{ textAlign: "center", textDecoration: "none", display: "block" }}
                    >
                      Start SET A Exam →
                    </Link>
                  </div>

                  <div className="course-mode-card" style={{ border: "2px solid #0F3D3E", background: "#fff", display: "flex", flexDirection: "column" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                      <span className="mode-card-badge exam-badge" style={{ margin: 0 }}>Active Set</span>
                      <span style={{ fontSize: "12px", fontWeight: "700", color: "#0F3D3E" }}>100 Questions · 2 Hrs</span>
                    </div>
                    <h3 style={{ margin: "0 0 8px 0", color: "#0F3D3E", fontSize: "20px" }}>SET B — Strategic Cost &amp; Performance Mgmt</h3>
                    <p style={{ fontSize: "13.5px", color: "#475569", lineHeight: "1.6", flex: 1, margin: "0 0 16px" }}>
                      Covers SCMPE syllabus, Standard Costing, Decision Making, and Transfer Pricing with Case Scenarios.
                    </p>
                    <Link
                      to={`/take-test/${courseSlug}?set=SET%20B`}
                      className="mode-card-cta exam-cta"
                      style={{ textAlign: "center", textDecoration: "none", display: "block" }}
                    >
                      Start SET B Exam →
                    </Link>
                  </div>
                </>
              )}

              {/* ADV ITT MODULES */}
              {isAdvItt && (
                <>
                  <div className="course-mode-card" style={{ border: "2px solid #0B2545", background: "#fff", display: "flex", flexDirection: "column" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                      <span className="mode-card-badge exam-badge" style={{ margin: 0 }}>Full Exam</span>
                      <span style={{ fontSize: "12px", fontWeight: "700", color: "#0B2545" }}>100 Qs · 2 Hrs</span>
                    </div>
                    <h3 style={{ margin: "0 0 8px 0", color: "#0B2545", fontSize: "20px" }}>Full Syllabus Comprehensive Exam</h3>
                    <p style={{ fontSize: "13.5px", color: "#475569", lineHeight: "1.6", flex: 1, margin: "0 0 16px" }}>
                      Full 100-question timed exam combining Module-1 (Forensics, RPA, ERP) and Module-2 (Power BI, Python, KNIME).
                    </p>
                    <Link
                      to={`/take-test/${courseSlug}`}
                      className="mode-card-cta exam-cta"
                      style={{ textAlign: "center", textDecoration: "none", display: "block" }}
                    >
                      Start Full Exam →
                    </Link>
                  </div>

                  <div className="course-mode-card" style={{ border: "1px solid #cbd5e1", background: "#fff", display: "flex", flexDirection: "column" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                      <span className="mode-card-badge practice-badge" style={{ margin: 0 }}>Module 1</span>
                      <span style={{ fontSize: "12px", fontWeight: "600", color: "#475569" }}>Forensics &amp; RPA</span>
                    </div>
                    <h3 style={{ margin: "0 0 8px 0", color: "#1e293b", fontSize: "19px" }}>Module 1: Forensic &amp; Cyber Audit</h3>
                    <p style={{ fontSize: "13.5px", color: "#475569", lineHeight: "1.6", flex: 1, margin: "0 0 16px" }}>
                      Forensic Accounting, Cyber Forensics, RPA &amp; ERP Audit questions only.
                    </p>
                    <Link
                      to={`/take-test/${courseSlug}?set=Module-1`}
                      className="mode-card-cta practice-cta"
                      style={{ textAlign: "center", textDecoration: "none", display: "block" }}
                    >
                      Start Module 1 Exam →
                    </Link>
                  </div>

                  <div className="course-mode-card" style={{ border: "1px solid #cbd5e1", background: "#fff", display: "flex", flexDirection: "column" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                      <span className="mode-card-badge practice-badge" style={{ margin: 0 }}>Module 2</span>
                      <span style={{ fontSize: "12px", fontWeight: "600", color: "#475569" }}>Data Analytics</span>
                    </div>
                    <h3 style={{ margin: "0 0 8px 0", color: "#1e293b", fontSize: "19px" }}>Module 2: Power BI, Python &amp; KNIME</h3>
                    <p style={{ fontSize: "13.5px", color: "#475569", lineHeight: "1.6", flex: 1, margin: "0 0 16px" }}>
                      Power BI dashboards, Python scripting &amp; KNIME workflows questions only.
                    </p>
                    <Link
                      to={`/take-test/${courseSlug}?set=Module-2`}
                      className="mode-card-cta practice-cta"
                      style={{ textAlign: "center", textDecoration: "none", display: "block" }}
                    >
                      Start Module 2 Exam →
                    </Link>
                  </div>
                </>
              )}

            </div>
          </div>
        )}

        {/* STEP 3: SET SELECTION FOR PRACTICE */}
        {currentStep === "select_set_practice" && (
          <div style={{ maxWidth: "800px", margin: "0 auto", animation: "fadeIn 0.25s ease-out" }}>
            <button
              type="button"
              onClick={() => setCurrentStep("mode_selection")}
              className="back-link"
              style={{ border: "none", background: "transparent", cursor: "pointer", padding: "0 0 16px 0", fontSize: "14px", fontWeight: "600", color: "#0F3D3E" }}
            >
              ← Back to Mode Selection
            </button>

            <header className="course-mode-header" style={{ padding: "0 0 24px" }}>
              <span className="course-mode-eyebrow">CHAPTER-WISE PRACTICE</span>
              <h1>Select your Practice Set</h1>
              <p>Choose the subject set to practice with instant explanations:</p>
            </header>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px" }}>
              
              <div className="course-mode-card" style={{ border: "2px solid #1E7145", background: "#fff", display: "flex", flexDirection: "column" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                  <span className="mode-card-badge practice-badge" style={{ margin: 0 }}>Available</span>
                  <span style={{ fontSize: "12px", fontWeight: "700", color: "#1E7145" }}>All Chapters + Cases</span>
                </div>
                <h3 style={{ margin: "0 0 8px 0", color: "#1E7145", fontSize: "20px" }}>SET A — Corporate &amp; Economic Laws</h3>
                <p style={{ fontSize: "13.5px", color: "#475569", lineHeight: "1.6", flex: 1, margin: "0 0 16px" }}>
                  Companies Act 2013, SEBI Act &amp; Regulations, FEMA, FCRA, and IBC 2016 chapter-wise practice sets.
                </p>
                <Link
                  to={`/course/${courseSlug}/SET%20A`}
                  className="mode-card-cta practice-cta"
                  style={{ textAlign: "center", textDecoration: "none", display: "block" }}
                >
                  Select Chapters (SET A) →
                </Link>
              </div>

              <div className="course-mode-card" style={{ border: "2px solid #1E7145", background: "#fff", display: "flex", flexDirection: "column" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                  <span className="mode-card-badge practice-badge" style={{ margin: 0 }}>Available</span>
                  <span style={{ fontSize: "12px", fontWeight: "700", color: "#1E7145" }}>All Chapters + Cases</span>
                </div>
                <h3 style={{ margin: "0 0 8px 0", color: "#1E7145", fontSize: "20px" }}>SET B — Strategic Cost &amp; Performance Mgmt</h3>
                <p style={{ fontSize: "13.5px", color: "#475569", lineHeight: "1.6", flex: 1, margin: "0 0 16px" }}>
                  SCMPE chapter-wise practice sets and integrated Case Scenarios with instant explanations.
                </p>
                <Link
                  to={`/course/${courseSlug}/SET%20B`}
                  className="mode-card-cta practice-cta"
                  style={{ textAlign: "center", textDecoration: "none", display: "block" }}
                >
                  Select Chapters (SET B) →
                </Link>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default Course;
