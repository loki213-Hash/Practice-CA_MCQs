import { Link } from "react-router-dom";

export default function ResultPage({ chapter, questions, answers, onRestart }) {
  const correct = questions.filter((question) => answers[question.id] === question.correct_option).length;
  const attempted = Object.keys(answers).length;
  const wrong = attempted - correct;
  const skipped = questions.length - attempted;
  const percentage = questions.length ? Math.round((correct / questions.length) * 100) : 0;
  const stats = questions.reduce((all, question) => { if (!answers[question.id]) return all; const topic = question.topic || "General"; const current = all[topic] || { correct: 0, attempted: 0 }; current.attempted += 1; if (answers[question.id] === question.correct_option) current.correct += 1; all[topic] = current; return all; }, {});
  const weakTopics = Object.entries(stats).map(([topic, stat]) => ({ topic, score: Math.round((stat.correct / stat.attempted) * 100) })).filter((item) => item.score < 60).sort((a, b) => a.score - b.score);
  return <main className="quiz-shell result-shell"><Link className="back-link" to={-1}>← Back to chapters</Link><section className="result-hero"><p className="eyebrow">{chapter?.chapter_name || "Chapter"} result</p><div className="score-ring"><strong>{percentage}%</strong><span>Score</span></div><h1>{percentage >= 50 ? "Well done — keep practising." : "Keep going — every attempt helps."}</h1><p>You answered {correct} of {questions.length} questions correctly.</p></section><section className="result-grid"><article><strong>{correct}</strong><span>Correct</span></article><article><strong>{wrong}</strong><span>Wrong</span></article><article><strong>{skipped}</strong><span>Skipped</span></article><article><strong>{attempted}</strong><span>Attempted</span></article></section><section className="improvement-card"><p className="eyebrow">Topic analysis</p><h2>Topics needing improvement</h2>{weakTopics.length ? <ul>{weakTopics.map((item) => <li key={item.topic}><span>{item.topic}</span><strong>{item.score}%</strong></li>)}</ul> : <p>Great work. No attempted topic is below 60%.</p>}</section><div className="result-actions"><button className="primary-button" onClick={onRestart} type="button">Try again</button><Link className="secondary-link" to={-1}>Back to chapters</Link></div></main>;
}
