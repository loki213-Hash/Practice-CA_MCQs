const options = ["A", "B", "C", "D"];

export default function QuestionCard({ question, selectedOption, onSelect }) {
  const locked = Boolean(selectedOption);
  return <article className="question-card">
    <p className="question-topic">{question.topic || "General"}</p>
    <h2 className="question-text">{question.question}</h2>
    <div className="option-list" role="radiogroup" aria-label="Answer options">
      {options.map((key) => {
        const correct = locked && key === question.correct_option;
        const wrong = locked && key === selectedOption && key !== question.correct_option;
        return <button className={`option-button ${correct ? "option-correct" : ""} ${wrong ? "option-wrong" : ""}`} disabled={locked} key={key} onClick={() => onSelect(key)} type="button"><span className="option-letter">{key}</span><span>{question[`option_${key.toLowerCase()}`]}</span>{correct && <b>✓</b>}{wrong && <b>✕</b>}</button>;
      })}
    </div>
    {locked && <section className="explanation-box"><p className="explanation-label">Explanation</p><p>{question.explanation || "No explanation has been added for this question yet."}</p></section>}
  </article>;
}
