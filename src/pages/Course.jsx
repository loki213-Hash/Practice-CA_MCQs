import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { getCourseBySlug } from "../services/courseService";
import Loading from "../components/Loading";

function Course() {
  const { courseSlug } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [error, setError] = useState("");

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
        <Link className="back-link" to="/">← All courses</Link>

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
              <Link
                to={`/course/${courseSlug}/chapters`}
                className="mode-card-cta practice-cta"
              >
                Select Chapter →
              </Link>
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
              <li>✓ Case scenarios included (≥5)</li>
              <li>✓ Priority exam questions (≥30%)</li>
              <li>✓ Review & retry after submission</li>
            </ul>
            {isFinal ? (
              <span className="mode-card-cta disabled-cta">Coming Soon 🕐</span>
            ) : isAvailable ? (
              <Link
                to={`/take-test/${courseSlug}`}
                className="mode-card-cta exam-cta"
              >
                Start Exam →
              </Link>
            ) : (
              <span className="mode-card-cta disabled-cta">Coming Soon 🕐</span>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

export default Course;
