import { useState } from "react";

export default function RecoveryCodeModal({ code, onClose, username }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
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
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 20000,
        padding: "20px",
      }}
    >
      <div
        style={{
          background: "#ffffff",
          borderRadius: "16px",
          padding: "32px 28px",
          maxWidth: "460px",
          width: "100%",
          boxShadow: "0 20px 40px rgba(0, 0, 0, 0.3)",
          textAlign: "center",
          position: "relative",
          animation: "fadeInUp 0.3s ease-out forwards",
        }}
      >
        <div
          style={{
            width: "60px",
            height: "60px",
            background: "#fef3c7",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "30px",
            margin: "0 auto 16px",
            boxShadow: "0 4px 12px rgba(245, 158, 11, 0.2)",
          }}
        >
          🔑
        </div>

        <h2
          style={{
            fontSize: "20px",
            fontWeight: "700",
            color: "var(--navy, #1e293b)",
            margin: "0 0 8px",
          }}
        >
          Registration Successful!
        </h2>

        <div
          style={{
            background: "#fef2f2",
            border: "1px solid #fecaca",
            color: "#991b1b",
            borderRadius: "10px",
            padding: "10px 14px",
            fontSize: "13px",
            fontWeight: "600",
            marginBottom: "20px",
            lineHeight: "1.4",
          }}
        >
          ⚠️ Please save the Code to be used to change the password
        </div>

        {username && (
          <p style={{ fontSize: "13px", color: "#64748b", margin: "0 0 12px" }}>
            Account for: <strong style={{ color: "#0f172a" }}>{username}</strong>
          </p>
        )}

        <div
          style={{
            background: "#0f172a",
            borderRadius: "12px",
            padding: "18px",
            marginBottom: "20px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <span
            style={{
              fontSize: "11px",
              color: "#94a3b8",
              textTransform: "uppercase",
              letterSpacing: "1px",
              fontWeight: "600",
            }}
          >
            Your 7-Character Security Recovery Code
          </span>
          <div
            style={{
              fontSize: "28px",
              fontWeight: "800",
              letterSpacing: "4px",
              color: "#38bdf8",
              fontFamily: "monospace",
              userSelect: "all",
              padding: "4px 12px",
              background: "rgba(255,255,255,0.05)",
              borderRadius: "8px",
              border: "1px dashed rgba(56, 189, 248, 0.4)",
            }}
          >
            {code}
          </div>
          <button
            type="button"
            onClick={handleCopy}
            style={{
              background: copied ? "#10b981" : "rgba(255, 255, 255, 0.12)",
              color: "#ffffff",
              border: "none",
              borderRadius: "6px",
              padding: "6px 14px",
              fontSize: "12px",
              fontWeight: "600",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            {copied ? "✓ Code Copied!" : "📋 Copy Code"}
          </button>
        </div>

        <p
          style={{
            fontSize: "12px",
            color: "#64748b",
            margin: "0 0 24px",
            lineHeight: "1.5",
          }}
        >
          Keep this code safe. You will need your <strong>Username</strong> and this <strong>7-character code</strong> if you ever need to change or reset your password.
        </p>

        <button
          type="button"
          onClick={onClose}
          style={{
            width: "100%",
            height: "44px",
            background: "var(--navy, #1e293b)",
            color: "#ffffff",
            border: "none",
            borderRadius: "10px",
            fontWeight: "700",
            fontSize: "14px",
            cursor: "pointer",
            boxShadow: "0 4px 12px rgba(15, 23, 42, 0.2)",
            transition: "all 0.2s ease",
          }}
        >
          I Have Saved My Code
        </button>
      </div>
    </div>
  );
}
