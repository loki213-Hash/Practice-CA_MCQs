import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="page-shell" style={{ textAlign: "center", paddingTop: "80px" }}>
      <h1 style={{ fontFamily: "var(--ff-serif)", fontSize: "72px", color: "var(--brass)", margin: "0 0 8px" }}>404</h1>
      <p style={{ fontSize: "18px", color: "var(--ink-soft)", marginBottom: "28px" }}>
        The page you&rsquo;re looking for doesn&rsquo;t exist.
      </p>
      <Link className="btn primary" to="/" style={{ display: "inline-block" }}>
        ← Back to Home
      </Link>
    </div>
  );
}
