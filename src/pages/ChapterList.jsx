import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getCourseBySlug } from "../services/courseService";
import { getSubjects } from "../services/subjectService";
import { getChapters } from "../services/chapterService";
import { getTopicCountsForChapters } from "../services/topicService";
import { getUserProgressStats } from "../services/progressService";
import { supabase } from "../supabase/supabase";

function ChapterList() {
  const { courseSlug, setType } = useParams();

  const [course, setCourse] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [activeSubjectId, setActiveSubjectId] = useState(null);
  const [questionCounts, setQuestionCounts] = useState({});
  const [topicCounts, setTopicCounts] = useState({});
  const [userProgress, setUserProgress] = useState({});
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadChapters() {
      setError("");

      try {
        const loadedCourse = await getCourseBySlug(courseSlug);
        setCourse(loadedCourse);

        const selectedSet = setType === "chapters" ? null : setType;

        // Fetch subjects, chapters, and progress in parallel
        const [loadedSubjects, loadedChapters, progressData] = await Promise.all([
          getSubjects(loadedCourse.id, selectedSet),
          getChapters(loadedCourse.id, selectedSet),
          getUserProgressStats().catch(() => null),
        ]);

        const validSubjects = loadedSubjects || [];
        const validChapters = loadedChapters || [];

        setSubjects(validSubjects);
        setChapters(validChapters);

        // Auto-select the first subject with chapters or first available subject
        const firstAvailableSubject = validSubjects.find((s) =>
          validChapters.some((c) => String(c.subject_id) === String(s.id))
        ) || validSubjects[0];

        if (firstAvailableSubject) {
          setActiveSubjectId(firstAvailableSubject.id);
        }

        const chapterIds = validChapters.map((c) => c.id);
        const qCounts = {};
        chapterIds.forEach((id) => { qCounts[id] = 0; });

        // Fetch question counts and topic counts in parallel
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

        // Map user progress by chapter_id
        if (progressData && Array.isArray(progressData.attempts)) {
          const progMap = {};
          progressData.attempts.forEach((att) => {
            if (att.chapter_id) {
              const prevMax = progMap[att.chapter_id]?.score || 0;
              progMap[att.chapter_id] = {
                score: Math.max(prevMax, att.score || 0),
                total: att.total_questions || 0,
              };
            }
          });
          setUserProgress(progMap);
        }
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
      <div className="loader-container">
        <div className="loader-spinner"></div>
        <p className="loader-text">Loading subjects & chapters…</p>
      </div>
    );
  }

  const isAdvItt = course && (
    course.course_slug?.toLowerCase().includes("advitt") ||
    course.course_slug?.toLowerCase().includes("itt") ||
    course.course_name?.toLowerCase().includes("adv") ||
    course.course_name?.toLowerCase().includes("itt")
  );

  const activeSubject = subjects.find((s) => String(s.id) === String(activeSubjectId)) || subjects[0];

  const activeChapters = activeSubject
    ? chapters.filter((ch) => String(ch.subject_id) === String(activeSubject.id))
    : chapters;

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

      <div className="page-shell subject-page-shell">
        <Link className="back-link" to={setType === "chapters" ? "/" : `/course/${courseSlug}`}>
          ← {setType === "chapters" ? "Back to Home" : `Back to ${course.course_name}`}
        </Link>

        {/* Top Filter Pill */}
        {subjects.length > 0 && (
          <div className="subject-filter-container">
            <button
              type="button"
              className="subject-pill active"
            >
              All subjects ({subjects.length})
            </button>
          </div>
        )}

        {/* Uniform Height Subject Cards Grid */}
        {subjects.length > 0 ? (
          <>
            <div className="subject-grid-uniform">
              {subjects.map((subject) => {
                const subChapters = chapters.filter(
                  (ch) => String(ch.subject_id) === String(subject.id)
                );
                const count = subChapters.length;
                const isSelected = String(subject.id) === String(activeSubjectId);

                return (
                  <div
                    key={subject.id}
                    className={`subject-card-uniform ${isSelected ? "selected-accent" : ""} ${count === 0 ? "disabled-card" : ""}`}
                    onClick={() => setActiveSubjectId(subject.id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setActiveSubjectId(subject.id);
                      }
                    }}
                  >
                    <h3 className="subject-card-name" title={subject.subject_name}>
                      {subject.subject_name}
                    </h3>
                    <p className="subject-card-count">
                      {count} {count === 1 ? "chapter" : "chapters"}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Sub-Chapters Full-Width Container Below Grid */}
            <div className="subchapters-container-panel">
              {activeChapters.length === 0 ? (
                <div className="subchapter-empty-state">
                  <p>No chapters available for <strong>{activeSubject?.subject_name}</strong> yet.</p>
                </div>
              ) : (
                <div className="subchapter-rows-list">
                  {activeChapters.map((chapter) => {
                    const qCount = questionCounts[chapter.id] ?? 0;
                    const tCount = topicCounts[chapter.id] ?? 0;
                    const prog = userProgress[chapter.id];

                    let countLabel;
                    if (prog && prog.score > 0) {
                      countLabel = `${prog.score} of ${qCount || prog.total} answered`;
                    } else if (tCount > 0 && qCount > 0) {
                      countLabel = `${tCount} ${tCount === 1 ? "topic" : "topics"} · ${qCount} questions`;
                    } else if (tCount > 0) {
                      countLabel = `${tCount} ${tCount === 1 ? "topic" : "topics"} · ${qCount} questions`;
                    } else if (qCount > 0) {
                      countLabel = `${qCount} questions`;
                    } else {
                      countLabel = `1 topic · ${qCount} questions`;
                    }

                    return (
                      <div className="subchapter-row" key={chapter.id}>
                        <div className="subchapter-row-info">
                          <h4 className="subchapter-row-title">{chapter.chapter_name.trim()}</h4>
                          <p className="subchapter-row-meta">{countLabel}</p>
                        </div>
                        <Link className="subchapter-start-btn" to={`/quiz/${chapter.id}`}>
                          Start →
                        </Link>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        ) : (
          /* Direct Chapter List Fallback for Courses without Subjects */
          chapters.length === 0 ? (
            <p style={{ margin: "20px 0", fontStyle: "italic", color: "var(--ink-soft)" }}>No chapters are available yet.</p>
          ) : (
            <div className="subchapters-container-panel">
              <div className="subchapter-rows-list">
                {chapters.map((chapter) => {
                  const qCount = questionCounts[chapter.id] ?? 0;
                  const tCount = topicCounts[chapter.id] ?? 0;

                  return (
                    <div className="subchapter-row" key={chapter.id}>
                      <div className="subchapter-row-info">
                        <h4 className="subchapter-row-title">{chapter.chapter_name.trim()}</h4>
                        <p className="subchapter-row-meta">
                          {tCount > 0 ? `${tCount} topics · ` : ""}{qCount} questions
                        </p>
                      </div>
                      <Link className="subchapter-start-btn" to={`/quiz/${chapter.id}`}>
                        Start →
                      </Link>
                    </div>
                  );
                })}
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}

export default ChapterList;