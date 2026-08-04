import { Component } from "react";

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("ErrorBoundary caught a render error:", error, info?.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: "100vh",
          background: "#eef2ec",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          padding: "40px 20px",
        }}>
          <div style={{
            background: "#ffffff",
            border: "1px solid #e0e2dc",
            borderRadius: 14,
            padding: "40px 32px",
            maxWidth: 480,
            width: "100%",
            textAlign: "center",
            boxShadow: "0 4px 24px rgba(0,0,0,0.07)",
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
            <h2 style={{ color: "#1a1f1c", marginBottom: 10, fontSize: 20 }}>
              Something went wrong
            </h2>
            <p style={{ color: "#6b7268", fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
              The page encountered an unexpected error. Please try refreshing or go back to the home page.
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={() => window.location.reload()}
                style={{
                  background: "#0f3d33",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  padding: "10px 20px",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Refresh Page
              </button>
              <a
                href="/"
                style={{
                  background: "transparent",
                  color: "#0f3d33",
                  border: "2px solid #0f3d33",
                  borderRadius: 8,
                  padding: "10px 20px",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                  textDecoration: "none",
                  display: "inline-block",
                }}
              >
                Go to Home
              </a>
            </div>
            {this.state.error && (
              <details style={{ marginTop: 24, textAlign: "left" }} open>
                <summary style={{ cursor: "pointer", color: "#888", fontSize: 12 }}>Error details</summary>
                <pre style={{ fontSize: 11, color: "#cc0000", marginTop: 8, overflow: "auto", maxHeight: 250, whiteSpace: "pre-wrap", background: "#f8f8f8", padding: 10, borderRadius: 6 }}>
                  {this.state.error.toString()}
                  {"\n\n"}
                  {this.state.error.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
