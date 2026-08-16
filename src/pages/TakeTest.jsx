import React, { useState, useEffect, useRef, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "../supabase/supabase";
import { buildTakeTestQuestions } from "../services/takeTestService";
import { saveToMistakeVault } from "../services/mistakeVaultService";

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

// Case scenario block component
// isFirstInCase: true  = show full scenario text (entering new case)
// isFirstInCase: false = show compact reminder strip (continuing same case)
function CaseBlock({ caseScenario, isFirstInCase, caseSubQNum, caseTotalQs }) {
  if (!caseScenario) return null;

  if (!isFirstInCase) {
    // Compact sticky reminder for questions 2, 3, ... within the same case
    return (
      <div style={{
        background: '#fffbeb',
        border: '1px solid #fde68a',
        borderLeft: '4px solid #f59e0b',
        borderRadius: '8px',
        padding: '10px 14px',
        marginBottom: '16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '14px' }}>📋</span>
          <span style={{ fontSize: '12.5px', fontWeight: '700', color: '#92400e' }}>
            SAME CASE SCENARIO — {caseScenario.tag || caseScenario.title || 'Case'}
          </span>
          <span style={{ fontSize: '11.5px', color: '#b45309' }}>
            (Refer to the case introduced at Question {caseSubQNum - caseSubQNum + 1} of this case)
          </span>
        </div>
        {caseTotalQs > 1 && (
          <span style={{
            background: '#fde68a',
            color: '#78350f',
            borderRadius: '12px',
            fontSize: '11px',
            fontWeight: '700',
            padding: '2px 8px',
            whiteSpace: 'nowrap'
          }}>
            Q {caseSubQNum} / {caseTotalQs} in this case
          </span>
        )}
      </div>
    );
  }

  // Full case block for the first question of the case
  return (
    <div style={{
      background: '#f8fafc',
      border: '1px solid #cbd5e1',
      borderLeft: '4px solid #0F3D3E',
      borderRadius: '8px',
      padding: '16px 18px',
      marginBottom: '20px',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '10px',
        paddingBottom: '8px',
        borderBottom: '1px solid #e2e8f0'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '10px', fontWeight: '700', color: '#0F3D3E', textTransform: 'uppercase', letterSpacing: '1px' }}>
            CASE SCENARIO
          </span>
          {caseScenario.tag && (
            <span style={{ fontSize: '11px', background: '#0F3D3E', color: '#fff', padding: '2px 8px', borderRadius: '10px', fontWeight: '600' }}>
              {caseScenario.tag}
            </span>
          )}
        </div>
        {caseTotalQs > 1 && (
          <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>
            {caseTotalQs} questions follow
          </span>
        )}
      </div>

      {caseScenario.title && (
        <h4 style={{ margin: '0 0 10px', fontSize: '14px', fontWeight: '700', color: '#1e293b' }}>
          {caseScenario.title}
        </h4>
      )}

      {caseScenario.paragraphs && caseScenario.paragraphs.map((p, i) => (
        <p key={i} style={{ margin: '0 0 10px', fontSize: '13.5px', lineHeight: '1.65', color: '#334155' }}>{p}</p>
      ))}

      {caseScenario.case_table && (
        <div style={{ margin: '12px 0', overflowX: 'auto', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
          <pre style={{ margin: 0, padding: '12px', fontSize: '12px', color: '#334155' }}>
            {typeof caseScenario.case_table === 'string'
              ? caseScenario.case_table
              : JSON.stringify(caseScenario.case_table, null, 2)}
          </pre>
        </div>
      )}

      {caseScenario.outro_paragraphs && caseScenario.outro_paragraphs.map((p, i) => (
        <p key={i} style={{ margin: '0 0 6px', fontSize: '13.5px', lineHeight: '1.65', color: '#475569' }}>{p}</p>
      ))}
    </div>
  );
}


export default function TakeTest() {
  const { courseSlug } = useParams();
  const navigate = useNavigate();

  // Data state
  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState(null);
  const [questions, setQuestions] = useState([]);

  // Screens: 'instructions', 'test', 'results'
  const [screen, setScreen] = useState('instructions');

  // Test state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({}); // { index: selectedOption }
  const [marked, setMarked] = useState({}); // { index: boolean }
  const [timeLeft, setTimeLeft] = useState(7200); // 7200s = 2 hours
  const [timerRunning, setTimerRunning] = useState(false);
  const [showTimeUpModal, setShowTimeUpModal] = useState(false);
  
  // Question tracking
  const [questionTime, setQuestionTime] = useState({}); // { index: seconds }
  const [showWarningToast, setShowWarningToast] = useState(false);

  // Results state
  const [filter, setFilter] = useState('All');

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
          navigate('/');
          return;
        }
        setCourse(courseData);

        const qData = await buildTakeTestQuestions(courseData.id);
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
  }, [courseSlug, navigate]);

  // Timer interval
  useEffect(() => {
    let interval = null;
    if (timerRunning) {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          const next = prev - 1;
          if (next === 0) {
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
    if (timerRunning && screen === 'test') {
      interval = setInterval(() => {
        setQuestionTime(prev => {
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
    setScreen('test');
    setTimerRunning(true);
  };

  const handleOptionSelect = (opt) => {
    setAnswers(prev => ({ ...prev, [currentIndex]: opt }));
  };

  const handleClearResponse = () => {
    setAnswers(prev => {
      const next = { ...prev };
      delete next[currentIndex];
      return next;
    });
  };

  const handleMarkAndNext = () => {
    setMarked(prev => ({ ...prev, [currentIndex]: true }));
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

  const handleSubmit = async () => {
    setTimerRunning(false);
    setShowTimeUpModal(false);
    
    // Save to mistake vault (fire and forget)
    try {
      saveToMistakeVault(questions, answers);
    } catch (err) {
      console.error("Failed to save to mistake vault", err);
    }
    
    setScreen('results');
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f8fafc' }}>
        <h3>Loading test...</h3>
      </div>
    );
  }

  if (screen === 'instructions') {
    return (
      <div className="take-test-wrapper" style={{ background: '#f8fafc', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '60px' }}>
        <div style={{ background: '#fff', padding: '40px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', maxWidth: '600px', width: '100%' }}>
          <h1 style={{ margin: '0 0 16px 0', color: '#0F3D3E' }}>{course?.course_name}</h1>
          <h3 style={{ margin: '0 0 24px 0', color: '#475569', fontWeight: '500' }}>100 Questions | 2 Hours | All Subjects | No Instant Feedback</h3>
          
          <ul style={{ lineHeight: '1.8', color: '#334155', marginBottom: '32px', paddingLeft: '20px' }}>
            <li>The test contains {questions.length} questions.</li>
            <li>You have 2 hours to complete the test.</li>
            <li>No instant feedback will be provided; correct answers are shown at the end.</li>
            <li>You can navigate between questions and change your answers anytime before submitting.</li>
            <li>If you exceed the time limit, your extra time will be recorded.</li>
          </ul>

          <button 
            onClick={handleStart}
            style={{ width: '100%', padding: '14px', background: '#0F3D3E', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}
          >
            Start Test
          </button>
        </div>
      </div>
    );
  }

  if (screen === 'test') {
    const currentQ = questions[currentIndex];
    const isPriority = currentQ?.is_priority;
    const qType = currentQ?.type || 'regular';

    // Case boundary detection
    const prevQ = currentIndex > 0 ? questions[currentIndex - 1] : null;
    const isFirstInCase = qType === 'case' && (
      currentIndex === 0 ||
      !prevQ ||
      prevQ.case_id !== currentQ.case_id
    );

    // How many sub-questions belong to the same case?
    let caseSubQNum = 1;    // this question's index within its case (1-based)
    let caseTotalQs = 1;    // total questions in this case
    if (qType === 'case' && currentQ?.case_id) {
      const caseId = currentQ.case_id;
      const caseQsIndices = questions.reduce((acc, q, i) => {
        if (q.case_id === caseId) acc.push(i);
        return acc;
      }, []);
      caseTotalQs = caseQsIndices.length;
      caseSubQNum = caseQsIndices.indexOf(currentIndex) + 1;
    }

    return (
      <div className="take-test-wrapper" style={{ background: '#f8fafc', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        {/* Topbar */}
        <div className="take-test-topbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '12px 24px', height: '60px', position: 'sticky', top: 0, zIndex: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ fontWeight: 'bold', color: '#0F3D3E', fontSize: '18px' }}>CA Quiz</div>
            <div style={{ color: '#64748b', fontSize: '14px', borderLeft: '1px solid #e2e8f0', paddingLeft: '16px' }}>{course?.course_name}</div>
            {qType === 'case' && (
              <span style={{
                fontSize: '11px',
                fontWeight: '700',
                background: isFirstInCase ? '#0F3D3E' : '#fffbeb',
                color: isFirstInCase ? '#fff' : '#92400e',
                border: isFirstInCase ? 'none' : '1px solid #fde68a',
                padding: '3px 10px',
                borderRadius: '20px'
              }}>
                {isFirstInCase ? `📋 Case Scenario` : `📋 Continuing Case (Q ${caseSubQNum}/${caseTotalQs})`}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <div style={{ fontSize: '14px', fontWeight: '600' }}>Q {currentIndex + 1}/{questions.length}</div>
            <div style={{ fontSize: '18px', fontWeight: 'bold', fontFamily: 'monospace', color: timeLeft <= 600 ? '#dc2626' : '#0F3D3E' }}>
              ⏱ {formatTime(timeLeft)}
            </div>
            <button onClick={handleSubmit} style={{ background: '#0F3D3E', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>Submit</button>
          </div>
        </div>

        {/* Warning Toast */}
        {showWarningToast && (
          <div className="tt-time-warning-toast" style={{ position: 'fixed', top: '80px', left: '50%', transform: 'translateX(-50%)', background: '#fff3cd', color: '#856404', padding: '12px 24px', borderRadius: '8px', border: '1px solid #ffeeba', zIndex: 100, display: 'flex', alignItems: 'center', gap: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
            <span>⚠️ Taking more time on this question — consider moving on and returning later</span>
            <button onClick={() => setShowWarningToast(false)} style={{ background: 'transparent', border: 'none', fontSize: '16px', cursor: 'pointer', color: '#856404' }}>✕</button>
          </div>
        )}

        {/* Time Up Modal */}
        {showTimeUpModal && (
           <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
             <div style={{ background: '#fff', padding: '32px', borderRadius: '12px', width: '400px', textAlign: 'center' }}>
               <h2 style={{ margin: '0 0 16px 0', color: '#dc2626' }}>Time Up!</h2>
               <p style={{ marginBottom: '24px', color: '#475569' }}>The 2-hour time limit has been reached. You can submit now or continue testing (extra time will be recorded).</p>
               <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                 <button onClick={handleSubmit} style={{ background: '#0F3D3E', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>Submit Now</button>
                 <button onClick={() => { setShowTimeUpModal(false); setTimerRunning(true); }} style={{ background: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>Continue</button>
               </div>
             </div>
           </div>
        )}

        {/* Main Body */}
        <div className="take-test-body" style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          
          {/* Question Panel */}
          <div className="take-test-qpanel" style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
            <div className="take-test-qcard" style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', maxWidth: '800px', margin: '0 auto' }}>
              
              {/* Case scenario block - full on first Q, compact reminder strip on subsequent Qs */}
              {qType === 'case' && (
                <CaseBlock
                  caseScenario={currentQ?.case_scenario}
                  isFirstInCase={isFirstInCase}
                  caseSubQNum={caseSubQNum}
                  caseTotalQs={caseTotalQs}
                />
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                <span style={{ fontSize: '12px', background: '#f1f5f9', color: '#475569', padding: '4px 8px', borderRadius: '4px', fontWeight: '600', textTransform: 'uppercase' }}>
                  {currentQ?.topic || 'General'}
                </span>
                {isPriority && <span style={{ color: '#f59e0b', fontWeight: 'bold', fontSize: '14px' }}>(***) Priority</span>}
              </div>

              <div style={{ fontSize: '18px', fontWeight: '500', color: '#1e293b', marginBottom: '24px', lineHeight: '1.6' }}>
                <span style={{ fontWeight: 'bold', marginRight: '8px' }}>Q{currentIndex + 1}.</span>
                {currentQ?.question}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {['a', 'b', 'c', 'd'].map((optKey) => {
                  const optText = currentQ?.[`option_${optKey}`];
                  if (!optText) return null;
                  const isSelected = answers[currentIndex] === optKey;
                  return (
                    <div 
                      key={optKey} 
                      onClick={() => handleOptionSelect(optKey)}
                      className={`take-test-option ${isSelected ? 'selected' : ''}`}
                      style={{
                        border: isSelected ? '2px solid #0F3D3E' : '1px solid #e2e8f0',
                        background: isSelected ? 'rgba(15,61,62,0.06)' : '#fff',
                        padding: '16px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        fontWeight: isSelected ? '600' : '400',
                        transition: 'all 0.1s ease'
                      }}
                    >
                      <span style={{ display: 'inline-block', width: '28px', height: '28px', borderRadius: '50%', background: isSelected ? '#0F3D3E' : '#f1f5f9', color: isSelected ? '#fff' : '#64748b', textAlign: 'center', lineHeight: '28px', marginRight: '16px', fontSize: '14px', fontWeight: 'bold' }}>
                        {optKey.toUpperCase()}
                      </span>
                      <span style={{ color: '#334155' }}>{optText}</span>
                    </div>
                  );
                })}
              </div>

              {/* Navigation row */}
              <div className="take-test-qnav" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '32px', paddingTop: '24px', borderTop: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button onClick={handleClearResponse} style={{ padding: '10px 16px', background: '#fff', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', color: '#475569', fontWeight: '500' }}>Clear Response</button>
                  <button onClick={handleMarkAndNext} style={{ padding: '10px 16px', background: '#fff', border: '1px solid #f59e0b', borderRadius: '6px', cursor: 'pointer', color: '#d97706', fontWeight: '500' }}>Mark & Next</button>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button onClick={handlePrev} disabled={currentIndex === 0} style={{ padding: '10px 16px', background: currentIndex === 0 ? '#f1f5f9' : '#fff', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: currentIndex === 0 ? 'not-allowed' : 'pointer', color: '#475569', fontWeight: '500' }}>Previous</button>
                  <button onClick={handleNext} disabled={currentIndex === questions.length - 1} style={{ padding: '10px 24px', background: '#0F3D3E', border: 'none', borderRadius: '6px', cursor: currentIndex === questions.length - 1 ? 'not-allowed' : 'pointer', color: '#fff', fontWeight: '600' }}>Next</button>
                </div>
              </div>

            </div>
          </div>

          {/* Palette Panel */}
          <div className="take-test-palette-panel" style={{ width: '300px', background: '#fff', borderLeft: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', padding: '24px' }}>
            <h4 style={{ margin: '0 0 16px 0', color: '#0F3D3E' }}>Question Palette</h4>
            
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', overflowY: 'auto', alignContent: 'flex-start', flex: 1 }}>
              {questions.map((_, i) => {
                const isAnswered = !!answers[i];
                const isMarked = marked[i];
                const isCurrent = i === currentIndex;
                
                let bg = '#fff';
                let border = '1px solid #cbd5e1';
                let color = '#475569';

                if (isCurrent) {
                  border = '2px solid #0F3D3E';
                }
                
                if (isAnswered) {
                  bg = '#22c55e'; // Green for answered (to differentiate state, purely palette, not correctness)
                  color = '#fff';
                  border = '1px solid #22c55e';
                  if (isCurrent) border = '2px solid #0F3D3E';
                } else if (isMarked) {
                  bg = '#f59e0b';
                  color = '#fff';
                  border = '1px solid #f59e0b';
                  if (isCurrent) border = '2px solid #0F3D3E';
                }

                return (
                  <button 
                    key={i}
                    onClick={() => setCurrentIndex(i)}
                    className="tt-palette-btn"
                    style={{ width: '36px', height: '36px', borderRadius: '50%', background: bg, border: border, color: color, fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    {i + 1}
                  </button>
                )
              })}
            </div>

            <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #e2e8f0', fontSize: '13px', color: '#475569', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#22c55e' }}></div> Answered</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#f59e0b' }}></div> Marked for Review</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div style={{ width: '12px', height: '12px', borderRadius: '50%', border: '1px solid #cbd5e1' }}></div> Not Answered</div>
            </div>

          </div>

        </div>
      </div>
    );
  }

  // Results Screen
  if (screen === 'results') {
    const totalQuestions = questions.length;
    let correctCount = 0;
    let wrongCount = 0;
    let skippedCount = 0;

    questions.forEach((q, i) => {
      const ans = answers[i];
      if (!ans) {
        skippedCount++;
      } else if (ans === q.correct_option) {
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
      const isCorrect = ans === q.correct_option;
      const isSkipped = !ans;
      const isWrong = ans && !isCorrect;
      const isMarked = marked[i];

      if (filter === 'All') return true;
      if (filter === 'Correct') return isCorrect;
      if (filter === 'Wrong') return isWrong;
      if (filter === 'Skipped') return isSkipped;
      if (filter === 'Marked') return isMarked;
      return true;
    });

    return (
      <div className="take-test-results take-test-wrapper" style={{ background: '#f8fafc', minHeight: '100vh', padding: '40px 24px' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          
          {/* Summary Card */}
          <div style={{ background: '#fff', borderRadius: '12px', padding: '32px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', marginBottom: '32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
              <div className="take-test-score-ring" style={{ width: '120px', height: '120px', borderRadius: '50%', background: `conic-gradient(#22c55e ${scorePercent}%, #f1f5f9 0)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', fontWeight: 'bold', color: '#0F3D3E' }}>
                  {scorePercent}%
                </div>
              </div>
              <div>
                <h2 style={{ margin: '0 0 8px 0', color: '#0F3D3E' }}>Test Completed</h2>
                <div style={{ color: '#475569', fontSize: '16px', marginBottom: '4px' }}>Course: {course?.course_name}</div>
                <div style={{ color: '#64748b', fontSize: '14px' }}>
                  Correct: <span style={{ color: '#22c55e', fontWeight: 'bold' }}>{correctCount}</span> | 
                  Wrong: <span style={{ color: '#ef4444', fontWeight: 'bold', marginLeft: '6px' }}>{wrongCount}</span> | 
                  Skipped: <span style={{ color: '#94a3b8', fontWeight: 'bold', marginLeft: '6px' }}>{skippedCount}</span>
                </div>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ color: '#475569', fontSize: '14px', marginBottom: '4px' }}>Time Taken</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#0F3D3E' }}>{formatDuration(effectiveTimeTaken)}</div>
              {isOvertime && <div style={{ color: '#ef4444', fontSize: '14px', fontWeight: '600' }}>+ {formatDuration(extraTime)} extra</div>}
              
              <div style={{ marginTop: '16px', display: 'flex', gap: '12px' }}>
                <Link to="/" style={{ textDecoration: 'none', padding: '8px 16px', border: '1px solid #cbd5e1', borderRadius: '6px', color: '#475569', fontSize: '14px', fontWeight: '500' }}>Home</Link>
                <button onClick={() => window.location.reload()} style={{ background: '#0F3D3E', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '14px' }}>Restart</button>
              </div>
            </div>
          </div>

          {/* Filter Row */}
          <div className="take-test-filter-row" style={{ display: 'flex', gap: '12px', marginBottom: '24px', overflowX: 'auto', paddingBottom: '8px' }}>
            {['All', 'Correct', 'Wrong', 'Skipped', 'Marked'].map(f => (
              <button 
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '20px',
                  border: filter === f ? 'none' : '1px solid #cbd5e1',
                  background: filter === f ? '#0F3D3E' : '#fff',
                  color: filter === f ? '#fff' : '#475569',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Question Review Cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {filteredQuestions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>No questions match this filter.</div>
            ) : (
              filteredQuestions.map(({ q, i }) => {
                const ans = answers[i];
                const isCorrect = ans === q.correct_option;
                
                let statusColor = '#94a3b8';
                let statusText = 'Skipped';
                if (ans) {
                  if (isCorrect) {
                    statusColor = '#22c55e';
                    statusText = 'Correct';
                  } else {
                    statusColor = '#ef4444';
                    statusText = 'Wrong';
                  }
                }

                return (
                  <div key={i} className="take-test-review-card" style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontWeight: 'bold', color: '#0F3D3E', fontSize: '16px' }}>Question {i + 1}</span>
                        <span style={{ background: statusColor, color: '#fff', fontSize: '12px', padding: '2px 8px', borderRadius: '12px', fontWeight: 'bold' }}>{statusText}</span>
                        {marked[i] && <span style={{ background: '#f59e0b', color: '#fff', fontSize: '12px', padding: '2px 8px', borderRadius: '12px', fontWeight: 'bold' }}>Marked</span>}
                      </div>
                      <div style={{ fontSize: '13px', color: '#64748b' }}>Time spent: {formatDuration(questionTime[i] || 0)}</div>
                    </div>

                    {q.type === 'case' && <CaseBlock caseScenario={q.case_scenario} />}

                    <div style={{ fontSize: '16px', color: '#1e293b', marginBottom: '20px', fontWeight: '500' }}>
                      {q.question}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                      {['a', 'b', 'c', 'd'].map(optKey => {
                        const optText = q[`option_${optKey}`];
                        if (!optText) return null;
                        
                        const isThisCorrect = optKey === q.correct_option;
                        const isThisSelected = ans === optKey;
                        
                        let border = '1px solid #e2e8f0';
                        let bg = '#f8fafc';
                        let icon = null;

                        if (isThisCorrect) {
                          border = '2px solid #22c55e';
                          bg = 'rgba(34,197,94,0.05)';
                          icon = '✓';
                        } else if (isThisSelected && !isThisCorrect) {
                          border = '2px solid #ef4444';
                          bg = 'rgba(239,68,68,0.05)';
                          icon = '✗';
                        }

                        return (
                          <div key={optKey} style={{ border, background: bg, padding: '12px 16px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span style={{ display: 'inline-block', width: '24px', height: '24px', borderRadius: '50%', background: isThisCorrect ? '#22c55e' : (isThisSelected ? '#ef4444' : '#e2e8f0'), color: (isThisCorrect || isThisSelected) ? '#fff' : '#64748b', textAlign: 'center', lineHeight: '24px', fontSize: '12px', fontWeight: 'bold' }}>
                              {optKey.toUpperCase()}
                            </span>
                            <span style={{ flex: 1, color: '#334155' }}>{optText}</span>
                            {icon && <span style={{ fontWeight: 'bold', color: isThisCorrect ? '#22c55e' : '#ef4444' }}>{icon}</span>}
                          </div>
                        );
                      })}
                    </div>

                    <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '16px', borderRadius: '8px' }}>
                      <div style={{ fontWeight: 'bold', color: '#166534', marginBottom: '8px', fontSize: '14px' }}>Explanation</div>
                      <div style={{ color: '#15803d', fontSize: '14px', lineHeight: '1.6' }}>
                        {q.explanation || 'No explanation provided.'}
                      </div>
                    </div>

                  </div>
                )
              })
            )}
          </div>

        </div>
      </div>
    );
  }

  return null;
}
