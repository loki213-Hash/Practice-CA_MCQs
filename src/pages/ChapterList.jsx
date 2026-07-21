import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getCourseBySlug } from "../services/courseService";
import { getChapters } from "../services/chapterService";
import { getQuestionCount } from "../services/questionService";

function ChapterList() {
  const { courseSlug, setType } = useParams();

  const [course, setCourse] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [questionCounts, setQuestionCounts] = useState({});
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadChapters() {
      setError("");

      try {
        const loadedCourse = await getCourseBySlug(courseSlug);
        setCourse(loadedCourse);

        const selectedSet = setType === "chapters" ? null : setType;

        const loadedChapters = await getChapters(
          loadedCourse.id,
          selectedSet
        );

        setChapters(loadedChapters);

        // Fetch actual question counts for each chapter
        const counts = {};
        await Promise.all(
          loadedChapters.map(async (chapter) => {
            counts[chapter.id] = await getQuestionCount(chapter.id);
          })
        );
        setQuestionCounts(counts);
      } catch (loadError) {
        console.error("Chapter loading error:", loadError);
        setError("Chapters could not be loaded.");
      }
    }

    loadChapters();
  }, [courseSlug, setType]);

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
      <>
        <nav className="inner-navbar">
          <Link className="brand" to="/">
            <img src="/ca-logo.png" alt="CA" />
            <span className="brand-title">CA Quiz Platform</span>
          </Link>
        </nav>
        <div className="page-shell">
          <p className="loading-text">Loading chapters…</p>
        </div>
      </>
    );
  }

  const totalQuestions = Object.values(questionCounts).reduce((sum, c) => sum + c, 0);

  return (
    <>
      <nav className="inner-navbar">
        <Link className="brand" to="/">
          <img src="/ca-logo.png" alt="CA" />
          <span className="brand-title">CA Quiz Platform</span>
        </Link>
      </nav>
      <div className="page-shell">
        <Link className="back-link" to={setType === "chapters" ? "/" : `/course/${courseSlug}`}>
          ← {setType === "chapters" ? "Back to Home" : `Back to ${course.course_name}`}
        </Link>

        <header className="hero-copy compact-copy">
          <p className="eyebrow">
            {course.course_name}
            {setType !== "chapters" ? ` · ${setType}` : ""}
            {totalQuestions > 0 ? ` · ${totalQuestions.toLocaleString()} MCQs` : ""}
          </p>
          <h1>Choose a chapter</h1>
        </header>

        {chapters.length === 0 ? (
          <p>No chapters are available yet.</p>
        ) : (
          <section className="chapter-list">


            {chapters.map((chapter) => {
              const count = questionCounts[chapter.id] ?? 0;
              const hasQuestions = count > 0;

              return (
                <article className="chapter-card" key={chapter.id}>
                  <div>
                    <h2>{chapter.chapter_name}</h2>
                    <p className="q-count">
                      {count} {count === 1 ? "question" : "questions"}
                    </p>
                  </div>

                  {hasQuestions ? (
                    <Link
                      className="btn primary"
                      to={`/quiz/${chapter.id}`}
                    >
                      Start Quiz →
                    </Link>
                  ) : (
                    <span className="btn" style={{ opacity: 0.4, cursor: "default" }}>
                      No questions yet
                    </span>
                  )}
                </article>
              );
            })}
          </section>
        )}
      </div>
    </>
  );
}

export default ChapterList;