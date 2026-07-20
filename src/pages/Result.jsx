import { Link, useLocation } from "react-router-dom";

function Result() {
  const { state } = useLocation();
  if (!state) return <main className="page-shell"><p>No test result is available.</p><Link className="primary-button inline-button" to="/">Back to courses</Link></main>;

  const { chapterId, questions, answers } = state;
  const correct = questions.filter((question) => answers[question.id] === question.correct_option).length;
  const attempted = Object.keys(answers).length;
  const wrong = attempted - correct;
  const skipped = questions.length - attempted;
  const percentage = Math.round((correct / questions.length) * 100);
  const topics = {};

  questions.forEach((question) => {
    const topicName = question.topic || "General";
    if (!topics[topicName]) topics[topicName] = { total: 0, correct: 0 };
    topics[topicName].total += 1;
    if (answers[question.id] === question.correct_option) topics[topicName].correct += 1;
  });

  const weakTopics = Object.entries(topics).map(([name, value]) => ({ name, percentage: Math.round((value.correct / value.total) * 100) })).filter((topic) => topic.percentage < 50).sort((a, b) => a.percentage - b.percentage);

  return (
    <main className="page-shell result-page">
      <p className="eyebrow">Chapter {chapterId}</p><h1>Your result</h1>
      <section className="score-card"><p className="score-number">{percentage}%</p><p>{correct} correct out of {questions.length}</p></section>
      <section className="result-summary"><div><strong>{correct}</strong><span>Correct</span></div><div><strong>{wrong}</strong><span>Wrong</span></div><div><strong>{skipped}</strong><span>Skipped</span></div></section>
      <section className="improvement-card"><h2>Topics needing improvement</h2>{weakTopics.length === 0 ? <p>Excellent — no topic is below 50%.</p> : <ul>{weakTopics.map((topic) => <li key={topic.name}>{topic.name}<strong>{topic.percentage}%</strong></li>)}</ul>}</section>
      <Link className="primary-button inline-button" to="/">Back to courses</Link>
    </main>
  );
}

export default Result;
