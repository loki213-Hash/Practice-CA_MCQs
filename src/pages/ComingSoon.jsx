import { Link } from "react-router-dom";

function ComingSoon() {
  return (
    <>
      <nav className="inner-navbar">
        <Link className="brand" to="/">
          <img src="/ca-logo.png" alt="CA" />
          <span className="brand-title">CA Quiz Platform</span>
        </Link>
      </nav>
      <div className="page-shell">
        <div className="coming-soon-page">
          <div className="coming-soon-badge">Coming Soon</div>
          <h1>We are preparing this course.</h1>
          <p>
            Chapters and questions are being curated by our team.
            This course will appear here as soon as it's ready.
          </p>
          <Link className="btn primary" to="/" style={{ marginTop: 20 }}>
            ← Back to courses
          </Link>
        </div>
      </div>
    </>
  );
}

export default ComingSoon;
