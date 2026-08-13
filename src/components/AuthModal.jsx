import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import RecoveryCodeModal from "./RecoveryCodeModal";

export default function AuthModal({ isOpen, onClose, onSuccess, initialMode = "login" }) {
  const { login, register } = useAuth();
  const [isSignUp, setIsSignUp] = useState(initialMode === "register");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [favouritePlace, setFavouritePlace] = useState("");
  const [firstnameYob, setFirstnameYob] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Recovery Code Modal state after registration inside quiz submission
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const [generatedCode, setGeneratedCode] = useState("");
  const [savedUser, setSavedUser] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const cleanUsername = username.trim();
    if (!cleanUsername) {
      setError("Please enter a username.");
      return;
    }
    if (!password) {
      setError("Please enter a password.");
      return;
    }

    if (isSignUp) {
      if (cleanUsername.length < 3) {
        setError("Username must be at least 3 characters.");
        return;
      }
      if (password.length < 6) {
        setError("Password must be at least 6 characters.");
        return;
      }
      if (password !== confirmPassword) {
        setError("Passwords do not match.");
        return;
      }
    }

    setLoading(true);
    try {
      if (isSignUp) {
        const regRes = await register(cleanUsername, password, favouritePlace, firstnameYob);
        const loginRes = await login(cleanUsername, password, true);
        const loggedUser = loginRes?.user || regRes?.user;
        
        if (regRes?.recoveryCode) {
          setGeneratedCode(regRes.recoveryCode);
          setSavedUser(loggedUser);
          setShowRecoveryModal(true);
        } else {
          onSuccess(loggedUser);
        }
      } else {
        const loginRes = await login(cleanUsername, password, true);
        onSuccess(loginRes?.user);
      }
    } catch (err) {
      let msg = err?.message || "An error occurred during authentication.";
      if (msg.includes("already registered") || msg.includes("User already exists")) {
        msg = "This username is already taken. Please choose another one or sign in.";
      } else if (msg.includes("Invalid login credentials")) {
        msg = "Incorrect username or password.";
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
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
          zIndex: 15000,
          padding: "20px",
        }}
      >
        <div
          style={{
            background: "#ffffff",
            borderRadius: "16px",
            padding: "32px 28px",
            maxWidth: "440px",
            width: "100%",
            boxShadow: "0 20px 40px rgba(0, 0, 0, 0.3)",
            position: "relative",
            textAlign: "left",
            animation: "fadeInUp 0.3s ease-out forwards",
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              position: "absolute",
              top: "16px",
              right: "18px",
              background: "transparent",
              border: "none",
              fontSize: "22px",
              cursor: "pointer",
              color: "#94a3b8",
              lineHeight: 1,
            }}
          >
            &times;
          </button>

          <div style={{ textAlign: "center", marginBottom: "20px" }}>
            <span style={{ fontSize: "36px" }}>🎯</span>
            <h3
              style={{
                fontSize: "20px",
                fontWeight: "700",
                color: "var(--navy, #1e293b)",
                margin: "8px 0 4px",
              }}
            >
              Submit Test &amp; View Results
            </h3>
            <p style={{ fontSize: "12.5px", color: "#64748b", margin: 0, lineHeight: 1.4 }}>
              Please sign in or create an account to save your progress in the database and view your score.
            </p>
          </div>

          {/* Mode Switch Tabs */}
          <div
            style={{
              display: "flex",
              background: "#f1f5f9",
              borderRadius: "8px",
              padding: "4px",
              marginBottom: "20px",
            }}
          >
            <button
              type="button"
              onClick={() => { setIsSignUp(false); setError(""); }}
              style={{
                flex: 1,
                padding: "8px",
                borderRadius: "6px",
                border: "none",
                background: !isSignUp ? "#ffffff" : "transparent",
                color: !isSignUp ? "var(--navy, #1e293b)" : "#64748b",
                fontWeight: !isSignUp ? "700" : "500",
                fontSize: "13px",
                cursor: "pointer",
                boxShadow: !isSignUp ? "0 2px 4px rgba(0,0,0,0.05)" : "none",
                transition: "all 0.2s ease",
              }}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setIsSignUp(true); setError(""); }}
              style={{
                flex: 1,
                padding: "8px",
                borderRadius: "6px",
                border: "none",
                background: isSignUp ? "#ffffff" : "transparent",
                color: isSignUp ? "var(--navy, #1e293b)" : "#64748b",
                fontWeight: isSignUp ? "700" : "500",
                fontSize: "13px",
                cursor: "pointer",
                boxShadow: isSignUp ? "0 2px 4px rgba(0,0,0,0.05)" : "none",
                transition: "all 0.2s ease",
              }}
            >
              Create Account
            </button>
          </div>

          {error && (
            <div
              style={{
                background: "#fdf2f2",
                border: "1px solid #fde2e2",
                color: "#b91c1c",
                fontSize: "12.5px",
                padding: "10px 14px",
                borderRadius: "8px",
                marginBottom: "16px",
              }}
            >
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: "14px" }}>
              <label style={{ fontSize: "12px", fontWeight: "600", color: "#475569", display: "block", marginBottom: "4px" }}>
                Username
              </label>
              <input
                type="text"
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={loading}
                style={{
                  width: "100%",
                  height: "40px",
                  padding: "8px 12px",
                  border: "1px solid #cbd5e1",
                  borderRadius: "8px",
                  fontSize: "14px",
                  outline: "none",
                }}
              />
            </div>

            <div style={{ marginBottom: isSignUp ? "14px" : "20px" }}>
              <label style={{ fontSize: "12px", fontWeight: "600", color: "#475569", display: "block", marginBottom: "4px" }}>
                Password
              </label>
              <input
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                style={{
                  width: "100%",
                  height: "40px",
                  padding: "8px 12px",
                  border: "1px solid #cbd5e1",
                  borderRadius: "8px",
                  fontSize: "14px",
                  outline: "none",
                }}
              />
            </div>

            {isSignUp && (
              <div style={{ marginBottom: "20px" }}>
                <label style={{ fontSize: "12px", fontWeight: "600", color: "#475569", display: "block", marginBottom: "4px" }}>
                  Confirm Password
                </label>
                <input
                  type="password"
                  placeholder="Confirm password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={loading}
                  style={{
                    width: "100%",
                    height: "40px",
                    padding: "8px 12px",
                    border: "1px solid #cbd5e1",
                    borderRadius: "8px",
                    fontSize: "14px",
                    outline: "none",
                  }}
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                height: "44px",
                background: "var(--navy, #1e293b)",
                color: "#ffffff",
                border: "none",
                borderRadius: "8px",
                fontWeight: "700",
                fontSize: "14px",
                cursor: "pointer",
                boxShadow: "0 4px 12px rgba(15, 23, 42, 0.15)",
                transition: "all 0.2s ease",
              }}
            >
              {loading
                ? "Processing..."
                : isSignUp
                ? "Register & Submit Test"
                : "Sign In & Submit Test"}
            </button>
          </form>
        </div>
      </div>

      {showRecoveryModal && (
        <RecoveryCodeModal
          code={generatedCode}
          username={username}
          onClose={() => {
            setShowRecoveryModal(false);
            onSuccess(savedUser);
          }}
        />
      )}
    </>
  );
}
