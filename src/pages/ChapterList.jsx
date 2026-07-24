import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getCourseBySlug } from "../services/courseService";
import { getSubjects } from "../services/subjectService";
import { getChapters } from "../services/chapterService";
import { getTopicCountsForChapters } from "../services/topicService";
import { supabase } from "../supabase/supabase";

function getSubjectIcon(name) {
  const n = (name || "").toLowerCase();
  if (n.includes("company") || n.includes("companies")) return "🏛️";
  if (n.includes("sebi") || n.includes("regulation")) return "📈";
  if (n.includes("fema") || n.includes("foreign exchange")) return "💱";
  if (n.includes("fcra") || n.includes("foreign contribution")) return "🌍";
  if (n.includes("ibc") || n.includes("insolvency") || n.includes("bankruptcy")) return "⚖️";
  return "📑";
}

function ChapterList() {
  const { courseSlug, setType } = useParams();

  const [course, setCourse] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(null);
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

        const [loadedSubjects, loadedChapters] = await Promise.all([
          getSubjects(loadedCourse.id, selectedSet),
          getChapters(loadedCourse.id, selectedSet),
        ]);

        const validSubjects = loadedSubjects || [];
        const validChapters = loadedChapters || [];

        setSubjects(validSubjects);
        setChapters(validChapters);

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
      } catch (loadError) {
        console.error("Chapter loading error:", loadError);
        setError("Chapters could not be loaded.");
      }
    }

    loadChapters();
  }, [courseSlug, setType]);

  if (error) {
    return (
      <div className="proto-wrap">
        <p className="error-message">{error}</p>
        <Link className="start-btn" to="/" style={{ display: "inline-block", marginTop: 16 }}>Back to Home</Link>
      </div>
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

  const totalCourseQuestions = Object.values(questionCounts).reduce((sum, c) => sum + c, 0);

  const selectedSubject = selectedIndex !== null ? subjects[selectedIndex] : null;

  const selectedSubjectChapters = selectedSubject
    ? chapters.filter((ch) => String(ch.subject_id) === String(selectedSubject.id))
    : [];

  const getSubjectTotalQuestions = (subId) => {
    const subChs = chapters.filter((ch) => String(ch.subject_id) === String(subId));
    return subChs.reduce((sum, ch) => sum + (questionCounts[ch.id] || 0), 0);
  };

  const handleCardClick = (index) => {
    setSelectedIndex((prev) => (prev === index ? null : index));
  };

  return (
    <div className="proto-body">
      <div className="proto-wrap">
        <Link className="back-link" to={setType === "chapters" ? "/" : `/course/${courseSlug}`} style={{ marginBottom: 12, display: "inline-block" }}>
          ← Back to {course.course_name}
        </Link>

        <div className="eyebrow">
          {course.course_name} &middot; {setType !== "chapters" ? setType : "PRACTICE"} &middot; {totalCourseQuestions} MCQS
        </div>

        <h1>Select subject &amp; chapter</h1>
        <p className="sub">Tap a subject to flip it and reveal its chapters below.</p>

        <div className="pills">
          <button type="button" className="pill active">
            All subjects ({subjects.length})
          </button>
        </div>

        {/* 3D Flip Cards Grid */}
        <div className="grid">
          {subjects.map((s, i) => {
            const isSelected = i === selectedIndex;
            const subChs = chapters.filter((ch) => String(ch.subject_id) === String(s.id));
            const chCount = subChs.length;
            const subQCount = getSubjectTotalQuestions(s.id);
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
                    <span className="icon">{icon}</span>
                    <div>
                      <div className="subj-name" title={s.subject_name}>{s.subject_name}</div>
                      <div className="subj-meta">
                        {chCount} {chCount === 1 ? "chapter" : "chapters"}
                      </div>
                    </div>
                  </div>

                  {/* Card Back */}
                  <div className="card-face card-back">
                    <span className="icon">✓</span>
                    <div>
                      <div className="subj-name">Selected</div>
                      <div className="subj-meta">{subQCount} questions</div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Expandable Chapter / Test Panel */}
        <div className={`panel ${selectedIndex !== null ? "open" : ""}`}>
          {selectedSubject && (
            selectedSubjectChapters.length === 0 ? (
              <div className="panel-empty">
                No chapters added yet for {selectedSubject.subject_name}.
              </div>
            ) : (
              <div className="panel-inner">
                {selectedSubjectChapters.map((c) => {
                  const qCount = questionCounts[c.id] ?? 0;
                  const tCount = topicCounts[c.id] ?? 0;

                  return (
                    <div className="chapter-row" key={c.id}>
                      <div>
                        <p className="chapter-title">{c.chapter_name.trim()}</p>
                        <p className="chapter-meta">
                          {tCount > 0 ? `${tCount} topic` : "1 topic"} &middot; {qCount} questions
                        </p>
                      </div>
                      <Link className="start-btn" to={`/quiz/${c.id}`}>
                        Start test &rarr;
                      </Link>
                    </div>
                  );
                })}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}

export default ChapterList;