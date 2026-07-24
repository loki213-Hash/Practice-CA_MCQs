import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getCourseBySlug } from "../services/courseService";
import { getSubjects } from "../services/subjectService";
import { getChapters } from "../services/chapterService";
import { getTopicCountsForChapters } from "../services/topicService";
import { supabase } from "../supabase/supabase";

function ChapterList() {
  const { courseSlug, setType } = useParams();

  const [course, setCourse] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState("all");
  const [expandedSubjectIds, setExpandedSubjectIds] = useState({});
  const [questionCounts, setQuestionCounts] = useState({});
  const [topicCounts, setTopicCounts] = useState({});
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadChapters() {
      setError("");

      try {
        const loadedCourse = await getCourseBySlug(courseSlug);
        setCourse(loadedCourse);

        const selectedSet = setType === "chapters" ? null : setType;

        // Fetch subjects and chapters in parallel
        const [loadedSubjects, loadedChapters] = await Promise.all([
          getSubjects(loadedCourse.id, selectedSet),
          getChapters(loadedCourse.id, selectedSet),
        ]);

        setSubjects(loadedSubjects || []);
        setChapters(loadedChapters || []);

        const chapterIds = (loadedChapters || []).map((c) => c.id);
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
      } catch (loadError) {
        console.error("Chapter loading error:", loadError);
        setError("Chapters could not be loaded.");
      }
    }

    loadChapters();
  }, [courseSlug, setType]);

  const toggleSubjectExpand = (subId) => {
    setExpandedSubjectIds((prev) => ({
      ...prev,
      [subId]: !prev[subId],
    }));
  };

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

  const totalQuestions = Object.values(questionCounts).reduce((sum, c) => sum + c, 0);

  const isAdvItt = course && (
    course.course_slug?.toLowerCase().includes("advitt") ||
    course.course_slug?.toLowerCase().includes("itt") ||
    course.course_name?.toLowerCase().includes("adv") ||
    course.course_name?.toLowerCase().includes("itt")
  );

  const visibleSubjects = selectedSubjectId === "all"
    ? subjects
    : subjects.filter((s) => String(s.id) === String(selectedSubjectId));

  const unassignedChapters = chapters.filter(
    (ch) => !ch.subject_id || !subjects.some((s) => String(s.id) === String(ch.subject_id))
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
        <Link className="back-link" to={setType === "chapters" ? "/" : `/course/${courseSlug}`}>
          ← {setType === "chapters" ? "Back to Home" : `Back to ${course.course_name}`}
        </Link>

        <header className="hero-copy compact-copy subject-page-header">
          <p className="eyebrow">
            {isAdvItt ? "ADVANCED INFORMATION TECHNOLOGY TRAINING · ICAI FORMAT" : course.course_name}
            {setType !== "chapters" ? ` · ${setType}` : ""}
            {totalQuestions > 0 ? ` · ${totalQuestions.toLocaleString()} MCQs` : ""}
          </p>
          <h1 className="subject-page-title">{subjects.length > 0 ? "Select a subject & chapter" : "Choose a chapter"}</h1>
          <p style={{ margin: "4px 0 0", fontSize: "13.5px", color: "var(--ink-soft)" }}>
            Select a subject to view chapters and start practising.
          </p>
        </header>

        {/* Subject Filter Pills */}
        {subjects.length > 0 && (
          <div className="subject-filter-container">
            <button
              type="button"
              className={`subject-pill ${selectedSubjectId === "all" ? "active" : ""}`}
              onClick={() => setSelectedSubjectId("all")}
            >
              All subjects ({subjects.length})
            </button>
            {subjects.map((sub) => (
              <button
                key={sub.id}
                type="button"
                className={`subject-pill ${String(selectedSubjectId) === String(sub.id) ? "active" : ""}`}
                onClick={() => setSelectedSubjectId(sub.id)}
              >
                {sub.subject_name}
              </button>
            ))}
          </div>
        )}

        {/* Responsive Subject Cards Grid */}
        {subjects.length > 0 ? (
          <div className="subject-grid">
            {visibleSubjects.map((subject) => {
              const subjectChapters = chapters.filter(
                (ch) => String(ch.subject_id) === String(subject.id)
              );
              const isZero = subjectChapters.length === 0;
              const isExpanded = !!expandedSubjectIds[subject.id];

              return (
                <article
                  key={subject.id}
                  className={`subject-card ${isZero ? "disabled-card" : ""} ${isExpanded ? "is-expanded" : ""}`}
                >
                  <div
                    className="subject-card-header"
                    onClick={() => !isZero && toggleSubjectExpand(subject.id)}
                    role={isZero ? undefined : "button"}
                    tabIndex={isZero ? undefined : 0}
                    onKeyDown={(e) => {
                      if (!isZero && (e.key === "Enter" || e.key === " ")) {
                        e.preventDefault();
                        toggleSubjectExpand(subject.id);
                      }
                    }}
                  >
                    <div className="subject-title-area">
                      <span className="subject-icon">📘</span>
                      <h3 className="subject-name" title={subject.subject_name}>
                        {subject.subject_name}
                      </h3>
                    </div>
                    <div className="subject-meta">
                      <span className={`subject-badge ${isZero ? "zero-badge" : ""}`}>
                        {subjectChapters.length} {subjectChapters.length === 1 ? "chapter" : "chapters"}
                      </span>
                      {!isZero && (
                        <svg
                          className={`chevron-icon ${isExpanded ? "rotated" : ""}`}
                          viewBox="0 0 24 24"
                          width="16"
                          height="16"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                      )}
                    </div>
                  </div>

                  {!isZero && (
                    <div className={`subject-card-body-wrapper ${isExpanded ? "expanded" : ""}`}>
                      <div className="subject-card-body-inner">
                        <div className="chapter-rows-list">
                          {subjectChapters.map((chapter) => {
                            const qCount = questionCounts[chapter.id] ?? 0;
                            const tCount = topicCounts[chapter.id] ?? 0;
                            let countLabel;
                            if (tCount > 0 && qCount > 0) {
                              countLabel = `${tCount} ${tCount === 1 ? "topic" : "topics"} · ${qCount} MCQs`;
                            } else if (tCount > 0) {
                              countLabel = `${tCount} ${tCount === 1 ? "topic" : "topics"}`;
                            } else if (qCount > 0) {
                              countLabel = `${qCount} ${qCount === 1 ? "question" : "questions"}`;
                            } else {
                              countLabel = "Topics available";
                            }

                            return (
                              <div className="chapter-row" key={chapter.id}>
                                <div className="chapter-info">
                                  <span className="chapter-title">{chapter.chapter_name}</span>
                                  <span className="chapter-count-meta">{countLabel}</span>
                                </div>
                                <Link className="chapter-start-btn" to={`/quiz/${chapter.id}`}>
                                  Start →
                                </Link>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </article>
              );
            })}

            {/* Unassigned Chapters Card if All Subjects is selected */}
            {selectedSubjectId === "all" && unassignedChapters.length > 0 && (
              <article className="subject-card">
                <div
                  className="subject-card-header"
                  onClick={() => toggleSubjectExpand("unassigned")}
                  role="button"
                  tabIndex={0}
                >
                  <div className="subject-title-area">
                    <span className="subject-icon">📑</span>
                    <h3 className="subject-name">Other Chapters</h3>
                  </div>
                  <div className="subject-meta">
                    <span className="subject-badge">
                      {unassignedChapters.length} {unassignedChapters.length === 1 ? "chapter" : "chapters"}
                    </span>
                    <svg
                      className={`chevron-icon ${expandedSubjectIds["unassigned"] ? "rotated" : ""}`}
                      viewBox="0 0 24 24"
                      width="16"
                      height="16"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </div>
                </div>

                <div className={`subject-card-body-wrapper ${expandedSubjectIds["unassigned"] ? "expanded" : ""}`}>
                  <div className="subject-card-body-inner">
                    <div className="chapter-rows-list">
                      {unassignedChapters.map((chapter) => {
                        const qCount = questionCounts[chapter.id] ?? 0;
                        const tCount = topicCounts[chapter.id] ?? 0;
                        let countLabel;
                        if (tCount > 0 && qCount > 0) {
                          countLabel = `${tCount} ${tCount === 1 ? "topic" : "topics"} · ${qCount} MCQs`;
                        } else if (tCount > 0) {
                          countLabel = `${tCount} ${tCount === 1 ? "topic" : "topics"}`;
                        } else if (qCount > 0) {
                          countLabel = `${qCount} ${qCount === 1 ? "question" : "questions"}`;
                        } else {
                          countLabel = "Topics available";
                        }

                        return (
                          <div className="chapter-row" key={chapter.id}>
                            <div className="chapter-info">
                              <span className="chapter-title">{chapter.chapter_name}</span>
                              <span className="chapter-count-meta">{countLabel}</span>
                            </div>
                            <Link className="chapter-start-btn" to={`/quiz/${chapter.id}`}>
                              Start →
                            </Link>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </article>
            )}
          </div>
        ) : (
          /* Direct Chapter List Fallback for Courses without Subjects */
          chapters.length === 0 ? (
            <p style={{ margin: "20px 0", fontStyle: "italic", color: "var(--ink-soft)" }}>No chapters are available yet.</p>
          ) : (
            <section className="chapter-list">
              {chapters.map((chapter) => {
                const qCount = questionCounts[chapter.id] ?? 0;
                const tCount = topicCounts[chapter.id] ?? 0;
                let countLabel;
                if (tCount > 0 && qCount > 0) {
                  countLabel = `${tCount} ${tCount === 1 ? "topic" : "topics"} · ${qCount} MCQs`;
                } else if (tCount > 0) {
                  countLabel = `${tCount} ${tCount === 1 ? "topic" : "topics"}`;
                } else if (qCount > 0) {
                  countLabel = `${qCount} ${qCount === 1 ? "question" : "questions"}`;
                } else {
                  countLabel = "Topics available";
                }

                return (
                  <article className="chapter-card" key={chapter.id}>
                    <div>
                      <h2>{chapter.chapter_name}</h2>
                      <p className="q-count">{countLabel}</p>
                    </div>
                    <Link className="btn primary" to={`/quiz/${chapter.id}`}>
                      Start →
                    </Link>
                  </article>
                );
              })}
            </section>
          )
        )}
      </div>
    </div>
  );
}

export default ChapterList;