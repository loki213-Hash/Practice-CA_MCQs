import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getCourseBySlug } from "../services/courseService";
import { getSubjects } from "../services/subjectService";
import { getChapters } from "../services/chapterService";
import { getTopicCountsForChapters } from "../services/topicService";
import { getCasesForCourse } from "../services/caseService";
import { saveQuizAttempt } from "../services/progressService";
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
  const [casesList, setCasesList] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(null); // number | 'cases' | null
  const [questionCounts, setQuestionCounts] = useState({});
  const [topicCounts, setTopicCounts] = useState({});
  const [error, setError] = useState("");

  // Case Scenario Views & State
  const [viewMode, setViewMode] = useState("grid"); // 'grid' | 'case_detail'
  const [activeCaseIndex, setActiveCaseIndex] = useState(0);
  const [caseCurrentQIndex, setCaseCurrentQIndex] = useState(0);
  const [caseCorrectCount, setCaseCorrectCount] = useState(0);
  const [caseAnswers, setCaseAnswers] = useState({}); // { [qIdx]: chosenLetter }
  const [caseTestFinished, setCaseTestFinished] = useState(false);
  const [showFullCaseModal, setShowFullCaseModal] = useState(false);

  useEffect(() => {
    async function loadChaptersAndCases() {
      setError("");

      try {
        const loadedCourse = await getCourseBySlug(courseSlug);
        setCourse(loadedCourse);

        const selectedSet = setType === "chapters" ? null : setType;

        const [loadedSubjects, loadedChapters, loadedCases] = await Promise.all([
          getSubjects(loadedCourse.id, selectedSet),
          getChapters(loadedCourse.id, selectedSet),
          getCasesForCourse(loadedCourse.id).catch(() => []),
        ]);

        const validSubjects = loadedSubjects || [];
        const validChapters = loadedChapters || [];
        const validCases = loadedCases || [];

        setSubjects(validSubjects);
        setChapters(validChapters);
        setCasesList(validCases);

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
        setError("Chapters and Case Scenarios could not be loaded.");
      }
    }

    loadChaptersAndCases();
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
        <p className="loader-text">Loading subjects & case scenarios…</p>
      </div>
    );
  }

  const totalCourseQuestions = Object.values(questionCounts).reduce((sum, c) => sum + c, 0);
  const totalCaseQuestions = casesList.reduce((sum, c) => sum + (c.questions?.length || 0), 0);

  const selectedSubject = typeof selectedIndex === "number" ? subjects[selectedIndex] : null;
  const isSelectedCases = selectedIndex === "cases";

  const selectedSubjectChapters = selectedSubject
    ? chapters.filter((ch) => String(ch.subject_id) === String(selectedSubject.id))
    : [];

  const getSubjectTotalQuestions = (subId) => {
    const subChs = chapters.filter((ch) => String(ch.subject_id) === String(subId));
    return subChs.reduce((sum, ch) => sum + (questionCounts[ch.id] || 0), 0);
  };

  const handleCardClick = (index) => {
    if (selectedIndex === index) {
      setSelectedIndex(null);
    } else {
      setSelectedIndex(index);
    }
  };

  const openCaseDetail = (idx) => {
    setActiveCaseIndex(idx);
    setCaseCurrentQIndex(0);
    setCaseCorrectCount(0);
    setCaseAnswers({});
    setCaseTestFinished(false);
    setViewMode("case_detail");
    window.scrollTo(0, 0);
  };

  const handleCaseAnswer = (qIndex, chosenLetter, correctLetter) => {
    if (caseAnswers[qIndex] !== undefined) return;

    const isCorrect = chosenLetter === correctLetter;
    setCaseAnswers((prev) => ({ ...prev, [qIndex]: chosenLetter }));
    if (isCorrect) {
      setCaseCorrectCount((prev) => prev + 1);
    }
  };

  const activeCase = casesList[activeCaseIndex] || casesList[0];
  const activeCaseQuestions = activeCase?.questions || [];
  const currentQ = activeCaseQuestions[caseCurrentQIndex];
  const isLastQuestion = caseCurrentQIndex === activeCaseQuestions.length - 1;

  const handleNextOrSubmit = () => {
    if (isLastQuestion) {
      setCaseTestFinished(true);
      const totalQ = activeCaseQuestions.length;
      const finalScore = caseCorrectCount;
      saveQuizAttempt({
        chapterId: `case_${activeCase?.id || activeCaseIndex}`,
        score: finalScore,
        totalQuestions: totalQ,
      });
    } else {
      setCaseCurrentQIndex((prev) => prev + 1);
    }
  };

  return (
    <div className="proto-body">
      <div className="proto-wrap">
        <Link className="back-link" to={setType === "chapters" ? "/" : `/course/${courseSlug}`} style={{ marginBottom: 12, display: "inline-block" }}>
          ← Back to {course.course_name}
        </Link>

        {viewMode === "grid" ? (
          <>
            <div className="eyebrow">
              {course.course_name} &middot; {setType !== "chapters" ? setType : "PRACTICE"} &middot; {totalCourseQuestions + totalCaseQuestions} MCQS
            </div>

            <h1>Select subject &amp; chapter</h1>
            <p className="sub">Tap a subject or Case Scenarios card to view options below.</p>

            <div className="pills">
              <button type="button" className="pill active">
                All subjects ({subjects.length + (casesList.length > 0 ? 1 : 0)})
              </button>
            </div>

            {/* Slightly Enlarged 3D Flip Cards Grid with Case Scenario Card */}
            <div className="grid grid-enlarged">
              {subjects.map((s, i) => {
                const isSelected = selectedIndex === i;
                const subChs = chapters.filter((ch) => String(ch.subject_id) === String(s.id));
                const chCount = subChs.length;
                const subQCount = getSubjectTotalQuestions(s.id);
                const icon = getSubjectIcon(s.subject_name);

                return (
                  <div
                    key={s.id}
                    className={`card-outer card-enlarged ${isSelected ? "selected" : ""}`}
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

              {/* Case Scenarios Card (Gold Border Accent as in Image 2) */}
              {casesList.length > 0 && (
                <div
                  className={`card-outer card-enlarged case-card-outer ${isSelectedCases ? "selected" : ""}`}
                  onClick={() => handleCardClick("cases")}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleCardClick("cases");
                    }
                  }}
                >
                  <div className="card-inner">
                    <div className="card-face card-front case-card-front-gold">
                      <span className="icon" style={{ color: "#A8762C" }}>📄</span>
                      <div>
                        <div className="subj-name" style={{ color: "#16241A", fontSize: "16px", fontWeight: "700" }}>
                          Case scenarios
                        </div>
                        <div className="subj-meta" style={{ color: "#A8762C", fontWeight: "600" }}>
                          {casesList.length} {casesList.length === 1 ? "case" : "cases"} &middot; {totalCaseQuestions} questions
                        </div>
                      </div>
                    </div>

                    <div className="card-face card-back case-card-back-gold">
                      <span className="icon">✓</span>
                      <div>
                        <div className="subj-name">Case Scenarios</div>
                        <div className="subj-meta">{totalCaseQuestions} case questions</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Expandable Chapter Panel or Case Scenarios List Panel */}
            <div className={`panel ${selectedIndex !== null ? "open" : ""}`}>
              {isSelectedCases ? (
                <div className="panel-inner case-panel-inner">
                  <div className="case-grid-list">
                    {casesList.map((c, idx) => (
                      <div
                        key={c.id || idx}
                        className="case-list-card"
                        onClick={() => openCaseDetail(idx)}
                      >
                        <span className="case-list-icon">📄</span>
                        <div className="case-list-info">
                          <h4 className="case-list-title">{c.title}</h4>
                          <p className="case-list-meta">{c.questions?.length || 0} questions based on case</p>
                        </div>
                        <button type="button" className="start-btn case-start-btn">
                          Open Case &rarr;
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : selectedSubject ? (
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
              ) : null}
            </div>
          </>
        ) : (
          /* Case Scenario Detail View */
          <div id="detailView">
            <button type="button" className="back-link" onClick={() => setViewMode("grid")} style={{ border: "none", background: "transparent", padding: 0 }}>
              ← Back to subjects
            </button>

            <div className="case-file">
              <div className="case-meta">
                <span className="case-tag">{activeCase.tag || "CASE SCENARIO"}</span>
              </div>
              <h2 className="case-title">{activeCase.title}</h2>
              <div className="case-body collapsed">
                {activeCase.paragraphs?.slice(0, 2).map((p, idx) => (
                  <p key={idx}>{p}</p>
                ))}
              </div>
              <div className="case-actions">
                <button type="button" className="btn-view-case" onClick={() => setShowFullCaseModal(true)}>
                  View full case
                </button>
                <span className="case-note">
                  {activeCaseQuestions.length} questions based on this case
                </span>
              </div>
            </div>

            <div className="section-label">
              <span>Related questions</span>
            </div>

            {/* Test Completed Summary & Percentage Calculation */}
            {caseTestFinished ? (
              <div className="case-complete-card">
                <div className="complete-badge">🎉 CASE COMPLETE</div>
                <h3>Case Scenario Submitted Successfully</h3>
                <div className="score-percentage-block">
                  <span className="score-number">{caseCorrectCount} / {activeCaseQuestions.length} Correct</span>
                  <span className="score-percentage">
                    {Math.round((caseCorrectCount / Math.max(activeCaseQuestions.length, 1)) * 100)}% Score
                  </span>
                </div>
                <p className="score-status-msg">
                  {Math.round((caseCorrectCount / Math.max(activeCaseQuestions.length, 1)) * 100) >= 60
                    ? "Great performance! You passed this case scenario practice."
                    : "Keep practicing to strengthen your concept mastery."}
                </p>
                <div className="complete-actions">
                  <button
                    type="button"
                    className="start-btn"
                    onClick={() => openCaseDetail(activeCaseIndex)}
                  >
                    Retake Case Scenario
                  </button>
                  <button
                    type="button"
                    className="btn-view-case"
                    onClick={() => setViewMode("grid")}
                  >
                    Back to Subjects
                  </button>
                </div>
              </div>
            ) : currentQ ? (
              <div className="question-card">
                {/* Question Progress Dots */}
                <div className="q-progress">
                  {activeCaseQuestions.map((_, i) => {
                    let cls = "q-dot";
                    if (i < caseCurrentQIndex) cls += " done";
                    if (i === caseCurrentQIndex) cls += " active";
                    return <span key={i} className={cls}></span>;
                  })}
                  <span className="q-progress-label">
                    Question {caseCurrentQIndex + 1} of {activeCaseQuestions.length}
                  </span>
                </div>

                <div className="q-head">
                  <span className="q-number">Q{caseCurrentQIndex + 1}.</span>
                  <span className="q-text">{currentQ.text}</span>
                </div>

                {/* Options List */}
                <div className="options">
                  {currentQ.options?.map((o) => {
                    const chosen = caseAnswers[caseCurrentQIndex];
                    const isAnswered = chosen !== undefined;
                    const isCorrect = o.letter === currentQ.correctLetter;
                    const isChosen = o.letter === chosen;

                    let optCls = "option";
                    if (isAnswered) {
                      if (isCorrect) optCls += " correct";
                      if (isChosen && !isCorrect) optCls += " incorrect";
                    }

                    return (
                      <button
                        key={o.letter}
                        type="button"
                        className={optCls}
                        disabled={isAnswered}
                        onClick={() => handleCaseAnswer(caseCurrentQIndex, o.letter, currentQ.correctLetter)}
                      >
                        <span className="opt-letter">{o.letter}</span>
                        <span>{o.text}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Result Tag & Explanation */}
                {caseAnswers[caseCurrentQIndex] !== undefined && (
                  <>
                    <div className={`result-tag show ${caseAnswers[caseCurrentQIndex] === currentQ.correctLetter ? "correct-tag" : "incorrect-tag"}`}>
                      {caseAnswers[caseCurrentQIndex] === currentQ.correctLetter
                        ? "✓ Correct"
                        : `✕ Incorrect — Correct answer is ${currentQ.correctLetter}`}
                    </div>

                    {currentQ.explanation && (
                      <div className="explanation show">
                        <strong>Explanation:</strong> {currentQ.explanation}
                      </div>
                    )}

                    {/* Next / Submit Button */}
                    <div style={{ marginTop: 18, marginLeft: 29 }}>
                      <button
                        type="button"
                        className="btn-next show"
                        onClick={handleNextOrSubmit}
                      >
                        <span>{isLastQuestion ? "Submit Test & View Results" : "Next Question →"}</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : null}
          </div>
        )}

        {/* Modal Document Overlay for Full Case Reading */}
        {showFullCaseModal && activeCase && (
          <div className="modal-overlay open" onClick={() => setShowFullCaseModal(false)}>
            <div className="modal-doc" onClick={(e) => e.stopPropagation()}>
              <div className="modal-head">
                <span className="lbl">{activeCase.tag || "CASE FILE"}</span>
                <button
                  type="button"
                  className="modal-close"
                  onClick={() => setShowFullCaseModal(false)}
                  aria-label="Close"
                >
                  &times;
                </button>
              </div>
              <div className="modal-body">
                <h3>{activeCase.title}</h3>
                {activeCase.paragraphs?.map((p, idx) => (
                  <p key={idx}>{p}</p>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ChapterList;