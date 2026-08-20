import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { submitFeedback } from "../services/feedbackService";

export default function FeedbackModal({ isOpen, onClose, onSuccess }) {
  const { user, username } = useAuth();

  const [guestName, setGuestName] = useState("");
  const [category, setCategory] = useState("General Feedback");
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const resolvedUsername = user ? (username || user.email?.split("@")[0] || "Student") : (guestName.trim() || "Guest");

  const categories = [
    { label: "💡 General Feedback", value: "General Feedback" },
    { label: "⚠️ Question Error / Issue", value: "Question Error" },
    { label: "🚀 Feature Suggestion", value: "Feature Suggestion" },
    { label: "🎨 UI & Experience", value: "UI & Experience" },
    { label: "📚 Syllabus Content", value: "Syllabus Content" },
    { label: "💬 Other", value: "Other" },
  ];

  const ratingLabels = ["", "Poor", "Fair", "Good", "Very Good", "Excellent!"];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!message.trim()) {
      setError("Please enter your feedback message.");
      return;
    }

    if (message.trim().length < 5) {
      setError("Feedback message should be at least 5 characters long.");
      return;
    }

    setLoading(true);
    try {
      await submitFeedback({
        userId: user?.id || null,
        username: resolvedUsername,
        category,
        rating,
        message: message.trim(),
        testType: "platform_feedback",
      });

      setSubmitted(true);
      if (typeof onSuccess === "function") {
        onSuccess();
      }
      setTimeout(() => {
        // Auto-close after 2.5 seconds if still open
        handleClose();
      }, 2500);
    } catch (err) {
      console.error("Feedback submit error:", err);
      setError("Could not submit feedback. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSubmitted(false);
    setMessage("");
    setError("");
    setGuestName("");
    setRating(5);
    setCategory("General Feedback");
    onClose();
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(10, 15, 29, 0.75)",
        backdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 20000,
        padding: "20px",
        overflowY: "auto",
      }}
      onClick={handleClose}
    >
      <div
        style={{
          background: "#ffffff",
          borderRadius: "16px",
          padding: "30px 28px",
          maxWidth: "480px",
          width: "100%",
          boxShadow: "0 20px 50px rgba(0, 0, 0, 0.35)",
          position: "relative",
          textAlign: "left",
          animation: "fadeInUp 0.25s ease-out forwards",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={handleClose}
          style={{
            position: "absolute",
            top: "16px",
            right: "16px",
            background: "none",
            border: "none",
            fontSize: "24px",
            color: "#94a3b8",
            cursor: "pointer",
            lineHeight: 1,
            padding: "4px",
          }}
          aria-label="Close"
        >
          &times;
        </button>

        {submitted ? (
          <div style={{ textAlign: "center", padding: "20px 10px" }}>
            <div
              style={{
                width: "60px",
                height: "60px",
                background: "#ecfdf5",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "30px",
                margin: "0 auto 16px",
                border: "1px solid #a7f3d0",
              }}
            >
              🎉
            </div>
            <h3 style={{ margin: "0 0 8px", fontSize: "20px", color: "#065f46", fontWeight: 700 }}>
              Thank You for Your Feedback!
            </h3>
            <p style={{ fontSize: "13.5px", color: "#475569", margin: "0 0 20px", lineHeight: 1.5 }}>
              Your feedback has been sent directly to the Admin dashboard. We truly appreciate your time in helping us improve the platform!
            </p>
            <button
              type="button"
              onClick={handleClose}
              style={{
                background: "var(--navy, #0B2545)",
                color: "#ffffff",
                border: "none",
                borderRadius: "8px",
                padding: "10px 24px",
                fontSize: "14px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {/* Header */}
            <div style={{ marginBottom: "18px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                <span style={{ fontSize: "22px" }}>💬</span>
                <h3 style={{ margin: 0, fontSize: "19px", color: "var(--navy, #0B2545)", fontWeight: 700 }}>
                  Share Your Feedback
                </h3>
              </div>
              <p style={{ margin: 0, fontSize: "12.5px", color: "#64748b", lineHeight: 1.45 }}>
                Found a typo, have a question suggestion, or want to share your experience? We read every feedback!
              </p>
            </div>

            {/* User Identity Indicator */}
            <div
              style={{
                background: user ? "rgba(11, 37, 69, 0.05)" : "#f8fafc",
                border: "1px solid",
                borderColor: user ? "rgba(11, 37, 69, 0.15)" : "#e2e8f0",
                borderRadius: "8px",
                padding: "10px 14px",
                marginBottom: "16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                fontSize: "12.5px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span>{user ? "🎓" : "👤"}</span>
                <span style={{ color: "#334155" }}>
                  Feedback as: <strong style={{ color: "var(--navy, #0B2545)" }}>{resolvedUsername}</strong>
                </span>
              </div>
              {user ? (
                <span
                  style={{
                    fontSize: "11px",
                    background: "rgba(16, 185, 129, 0.15)",
                    color: "#059669",
                    padding: "2px 8px",
                    borderRadius: "10px",
                    fontWeight: 600,
                  }}
                >
                  Verified Student
                </span>
              ) : (
                <span
                  style={{
                    fontSize: "11px",
                    background: "rgba(100, 116, 139, 0.12)",
                    color: "#475569",
                    padding: "2px 8px",
                    borderRadius: "10px",
                    fontWeight: 600,
                  }}
                >
                  Guest Visitor
                </span>
              )}
            </div>

            {!user && (
              <div style={{ marginBottom: "14px" }}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#334155", marginBottom: "4px" }}>
                  Your Name / Username (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Rahul Sharma"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: "6px",
                    border: "1px solid #cbd5e1",
                    fontSize: "13px",
                    boxSizing: "border-box",
                  }}
                />
              </div>
            )}

            {/* Category Selection */}
            <div style={{ marginBottom: "14px" }}>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                Feedback Category
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
                {categories.map((cat) => {
                  const isSelected = category === cat.value;
                  return (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => setCategory(cat.value)}
                      style={{
                        padding: "7px 10px",
                        fontSize: "12px",
                        fontWeight: isSelected ? 700 : 500,
                        color: isSelected ? "#0B2545" : "#475569",
                        background: isSelected ? "rgba(201, 166, 103, 0.18)" : "#f8fafc",
                        border: "1px solid",
                        borderColor: isSelected ? "var(--gold, #c9a667)" : "#e2e8f0",
                        borderRadius: "6px",
                        cursor: "pointer",
                        textAlign: "left",
                        transition: "all 0.15s ease",
                      }}
                    >
                      {cat.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Rating Stars */}
            <div style={{ marginBottom: "14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "#334155" }}>
                  Platform Rating
                </label>
                <span style={{ fontSize: "11.5px", color: "#b45309", fontWeight: 600 }}>
                  {ratingLabels[hoverRating || rating]}
                </span>
              </div>
              <div style={{ display: "flex", gap: "6px" }}>
                {[1, 2, 3, 4, 5].map((star) => {
                  const isFilled = (hoverRating || rating) >= star;
                  return (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      style={{
                        background: "none",
                        border: "none",
                        fontSize: "24px",
                        cursor: "pointer",
                        padding: "2px",
                        lineHeight: 1,
                        filter: isFilled ? "none" : "grayscale(100%) opacity(40%)",
                        transition: "transform 0.1s ease",
                      }}
                      title={`${star} Star`}
                    >
                      ⭐
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Feedback Message */}
            <div style={{ marginBottom: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "#334155" }}>
                  Your Message <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <span style={{ fontSize: "11px", color: "#94a3b8" }}>
                  {message.length}/1000
                </span>
              </div>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your suggestions, comments, or report any issue..."
                rows={4}
                maxLength={1000}
                required
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  fontSize: "13px",
                  lineHeight: 1.5,
                  resize: "vertical",
                  boxSizing: "border-box",
                  fontFamily: "inherit",
                }}
              />
            </div>

            {error && (
              <div
                style={{
                  background: "#fef2f2",
                  border: "1px solid #fecaca",
                  color: "#b91c1c",
                  fontSize: "12px",
                  padding: "8px 12px",
                  borderRadius: "6px",
                  marginBottom: "14px",
                }}
              >
                ⚠️ {error}
              </div>
            )}

            {/* Actions */}
            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                style={{
                  background: "#f1f5f9",
                  color: "#475569",
                  border: "1px solid #cbd5e1",
                  borderRadius: "8px",
                  padding: "9px 18px",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                style={{
                  background: "var(--navy, #0B2545)",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "8px",
                  padding: "9px 20px",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: loading ? "not-allowed" : "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  opacity: loading ? 0.7 : 1,
                  boxShadow: "0 4px 12px rgba(11, 37, 69, 0.2)",
                }}
              >
                {loading ? "Sending..." : "🚀 Submit Feedback"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
