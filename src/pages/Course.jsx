import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { getCourseBySlug } from "../services/courseService";
import { getSetTypes } from "../services/chapterService";

function Course() {
  const { courseSlug } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [setTypes, setSetTypes] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadCourse() {
      try {
        const loadedCourse = await getCourseBySlug(courseSlug);
        setCourse(loadedCourse);
        const types = await getSetTypes(loadedCourse.id);
        setSetTypes(types);
        // If no set types, go directly to chapter list
        if (types.length === 0) {
          navigate(`/course/${courseSlug}/chapters`, { replace: true });
        }
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
            <span className="brand-title">CA Quiz Platform</span>
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
        <div className="loader-spinner"></div>
        <p className="loader-text">Loading course…</p>
      </div>
    );
  }

  const isAdvItt = course && (
    course.course_slug?.toLowerCase().includes("advitt") ||
    course.course_slug?.toLowerCase().includes("itt") ||
    course.course_name?.toLowerCase().includes("adv") ||
    course.course_name?.toLowerCase().includes("itt")
  );

  return (
    <div className="quiz-theme-wrapper" data-theme={isAdvItt ? "advitt" : "default"}>
      {isAdvItt ? (
        <div className="masthead">
          <div className="brand">
            <div className="seal">
              ADV<br />ITT
            </div>
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
            <span className="brand-title">CA Quiz Platform</span>
          </Link>
        </nav>
      )}
      <div className="page-shell">
        <Link className="back-link" to="/">← All courses</Link>

        <header className="hero-copy compact-copy">
          <p className="eyebrow">
            {isAdvItt ? "ADVANCED INFORMATION TECHNOLOGY TRAINING · ICAI FORMAT" : course.course_name}
          </p>
          <h1>Select a set</h1>
          <p>Choose a question set to view its chapters and start practising.</p>
        </header>

        <section className="set-grid">
          {setTypes.map((setType) => (
            <article className="set-card" key={setType}>
              <div className="set-card-head">
                <p className="set-eyebrow">{course.course_name}</p>
                <h2>{setType}</h2>
              </div>
              <div className="set-card-body">
                <p>Choose a chapter and begin practising.</p>
                <Link
                  className="btn primary"
                  to={`/course/${courseSlug}/${encodeURIComponent(setType)}`}
                >
                  View Chapters →
                </Link>
              </div>
            </article>
          ))}
        </section>
      </div>
    </div>
  );
}

export default Course;
