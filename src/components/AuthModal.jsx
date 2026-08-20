import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../supabase/supabase";
import RecoveryCodeModal from "./RecoveryCodeModal";

export default function AuthModal({ isOpen, onClose, onSuccess, initialMode = "login", bannerNotice = null }) {
  const { login, register, resetPassword } = useAuth();
  const [isSignUp, setIsSignUp] = useState(initialMode === "register");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [favouritePlace, setFavouritePlace] = useState("");
  const [firstnameYob, setFirstnameYob] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForgotPopover, setShowForgotPopover] = useState(false);

  // Recovery Code Modal state after registration
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const [generatedCode, setGeneratedCode] = useState("");
  const [savedUser, setSavedUser] = useState(null);

  // Password Recovery Flow States
  const [recoveryUsername, setRecoveryUsername] = useState("");
  const [recoveryCodeInput, setRecoveryCodeInput] = useState("");
  const [recoveryNewPassword, setRecoveryNewPassword] = useState("");
  const [recoveryConfirmPassword, setRecoveryConfirmPassword] = useState("");
  const [isRecoveryVerified, setIsRecoveryVerified] = useState(false);
  const [recoveryError, setRecoveryError] = useState("");
  const [recoverySuccess, setRecoverySuccess] = useState("");
  const [recoveryLoading, setRecoveryLoading] = useState(false);

  useEffect(() => {
    setIsSignUp(initialMode === "register");
    setError("");
  }, [initialMode, isOpen]);

  if (!isOpen) return null;

  const handleToggle = (signUpMode) => {
    setIsSignUp(signUpMode);
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const cleanUsername = username.trim();
    if (!cleanUsername) {
      setError("Please enter your username.");
      return;
    }
    if (!password) {
      setError("Please enter your password.");
      return;
    }

    if (isSignUp && cleanUsername.toLowerCase() === "admin") {
      setError("Registration of administrative accounts is blocked.");
      return;
    }
    if (cleanUsername.length < 3) {
      setError("Username must be at least 3 characters.");
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(cleanUsername)) {
      setError("Username can only contain letters, numbers, and underscores.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (isSignUp && password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (isSignUp) {
      if (!favouritePlace.trim()) {
        setError("Please enter your Favourite Place (Recovery Word 1).");
        return;
      }
      if (!firstnameYob.trim()) {
        setError("Please enter your Firstname_Year of Birth (Recovery Word 2).");
        return;
      }
      if (!/^[a-zA-Z0-9]+_[0-9]{4}$/.test(firstnameYob.trim())) {
        setError("Firstname_Year of Birth must follow the format 'Firstname_YYYY' (e.g. John_1998).");
        return;
      }
    }

    setLoading(true);
    try {
      if (isSignUp) {
        const regRes = await register(cleanUsername, password, favouritePlace, firstnameYob);
        const loginRes = await login(cleanUsername, password, rememberMe);
        const loggedUser = loginRes?.user || regRes?.user;
        
        if (regRes?.recoveryCode) {
          setGeneratedCode(regRes.recoveryCode);
          setSavedUser(loggedUser);
          setShowRecoveryModal(true);
        } else {
          onSuccess(loggedUser);
        }
      } else {
        const loginRes = await login(cleanUsername, password, rememberMe);
        onSuccess(loginRes?.user);
      }
    } catch (err) {
      let msg = err?.message || "An error occurred.";
      if (msg.includes("already registered") || msg.includes("User already exists")) {
        msg = "This username is already taken. Please choose another one.";
      } else if (msg.includes("Invalid login credentials")) {
        msg = "Incorrect username or password.";
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyRecovery = async (e) => {
    e.preventDefault();
    setRecoveryError("");
    setRecoverySuccess("");
    setRecoveryLoading(true);

    try {
      if (!recoveryUsername.trim()) {
        setRecoveryError("Please enter your username.");
        return;
      }
      if (!recoveryCodeInput.trim()) {
        setRecoveryError("Please enter your 7-character security recovery code.");
        return;
      }
      setIsRecoveryVerified(true);
      setRecoverySuccess("Identity accepted. Please set your new password below.");
    } catch (err) {
      setRecoveryError(err.message || "Failed to proceed. Please try again.");
    } finally {
      setRecoveryLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setRecoveryError("");
    setRecoverySuccess("");
    setRecoveryLoading(true);

    try {
      if (!recoveryNewPassword) {
        setRecoveryError("Please enter a new password.");
        return;
      }
      if (recoveryNewPassword.length < 6) {
        setRecoveryError("New password must be at least 6 characters.");
        return;
      }
      if (recoveryNewPassword !== recoveryConfirmPassword) {
        setRecoveryError("Passwords do not match.");
        return;
      }

      await resetPassword(recoveryUsername.trim(), recoveryCodeInput.trim(), recoveryNewPassword);

      setRecoverySuccess("Password updated successfully! You can now sign in with your new password.");
      setTimeout(() => {
        setShowForgotPopover(false);
        setRecoveryUsername("");
        setRecoveryCodeInput("");
        setRecoveryNewPassword("");
        setRecoveryConfirmPassword("");
        setIsRecoveryVerified(false);
        setRecoverySuccess("");
        setRecoveryError("");
      }, 2500);
    } catch (err) {
      console.error(err);
      setRecoveryError(err.message || "Password reset failed. Make sure your recovery code is correct.");
    } finally {
      setRecoveryLoading(false);
    }
  };

  // Password Strength Meter Logic (for Registration)
  const getStrength = (val) => {
    if (!val) return 0;
    let score = 0;
    if (val.length >= 6) score++;
    if (val.length >= 10) score++;
    if (/[A-Z]/.test(val) && /[0-9]/.test(val)) score++;
    if (/[^A-Za-z0-9]/.test(val)) score++;
    return Math.max(1, Math.min(4, score));
  };

  const strengthScore = getStrength(password);
  const strengthColors = ["#c0564f", "#d99a4e", "#b8935a", "#10b981"];
  const strengthNames = ["Weak", "Fair", "Good", "Strong"];

  return (
    <>
      <div
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(10, 15, 29, 0.78)",
          backdropFilter: "blur(6px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 15000,
          padding: "16px",
          overflowY: "auto",
        }}
      >
        <div
          style={{
            position: "relative",
            maxWidth: "430px",
            width: "100%",
            background: "#ffffff",
            borderRadius: "16px",
            padding: "24px 26px",
            boxShadow: "0 20px 45px rgba(0, 0, 0, 0.25)",
            animation: "fadeInUp 0.25s ease-out forwards",
            maxHeight: "92vh",
            overflowY: "auto"
          }}
        >
          {/* Accessible Close / Cancel Modal Button */}
          <button
            type="button"
            onClick={onClose}
            style={{
              position: "absolute",
              top: "14px",
              right: "14px",
              background: "#f1f5f9",
              color: "#334155",
              border: "1px solid #e2e8f0",
              borderRadius: "50%",
              width: "32px",
              height: "32px",
              fontSize: "18px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: "700",
              zIndex: 10,
              boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
              transition: "all 0.15s ease"
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = "#e2e8f0";
              e.currentTarget.style.color = "#0f172a";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = "#f1f5f9";
              e.currentTarget.style.color = "#334155";
            }}
            aria-label="Close modal"
            title="Cancel & Close"
          >
            ✕
          </button>

          {bannerNotice && (
            <div style={{
              background: "linear-gradient(135deg, #0F3D3E 0%, #1e7145 100%)",
              color: "#ffffff",
              padding: "10px 14px",
              borderRadius: "8px",
              marginBottom: "14px",
              fontSize: "12.5px",
              lineHeight: "1.45",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              paddingRight: "36px"
            }}>
              <span style={{ fontSize: "16px" }}>🌟</span>
              <span style={{ flex: 1, fontWeight: "500" }}>{bannerNotice}</span>
            </div>
          )}

          {/* Header Title */}
          <div style={{ textAlign: "center", marginBottom: "16px", paddingRight: "28px" }}>
            <h2 style={{ fontSize: "20px", fontWeight: 700, color: "var(--navy, #0B2545)", margin: "0 0 4px", fontFamily: "Georgia, serif" }}>
              {isSignUp ? "Create Student Account" : "Welcome Back"}
            </h2>
            <p style={{ fontSize: "12.5px", color: "#64748b", margin: 0 }}>
              {isSignUp ? "Register to save your scores & track progress" : "Sign in to submit your test & view results"}
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            background: "#f1f5f9",
            borderRadius: "8px",
            padding: "4px",
            marginBottom: "16px"
          }}>
            <button
              type="button"
              onClick={() => handleToggle(false)}
              style={{
                padding: "8px 12px",
                border: "none",
                borderRadius: "6px",
                fontSize: "13px",
                fontWeight: "600",
                cursor: "pointer",
                background: !isSignUp ? "#ffffff" : "transparent",
                color: !isSignUp ? "var(--navy, #0B2545)" : "#64748b",
                boxShadow: !isSignUp ? "0 2px 4px rgba(0,0,0,0.08)" : "none",
                transition: "all 0.15s ease"
              }}
            >
              🔑 Sign In
            </button>
            <button
              type="button"
              onClick={() => handleToggle(true)}
              style={{
                padding: "8px 12px",
                border: "none",
                borderRadius: "6px",
                fontSize: "13px",
                fontWeight: "600",
                cursor: "pointer",
                background: isSignUp ? "#ffffff" : "transparent",
                color: isSignUp ? "var(--navy, #0B2545)" : "#64748b",
                boxShadow: isSignUp ? "0 2px 4px rgba(0,0,0,0.08)" : "none",
                transition: "all 0.15s ease"
              }}
            >
              📝 Register
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div style={{
              background: "#fef2f2",
              border: "1px solid #fecaca",
              color: "#dc2626",
              padding: "9px 12px",
              borderRadius: "8px",
              fontSize: "12.5px",
              marginBottom: "14px",
              display: "flex",
              alignItems: "center",
              gap: "6px"
            }}>
              <span>⚠️</span>
              <span style={{ flex: 1 }}>{error}</span>
            </div>
          )}

          {/* Auth Form */}
          <form onSubmit={handleSubmit} noValidate>
            {/* Username */}
            <div style={{ marginBottom: "12px" }}>
              <label style={{ display: "block", fontSize: "11.5px", fontWeight: "600", color: "#475569", marginBottom: "4px" }}>
                Username
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type="text"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={loading}
                  required
                  autoComplete="username"
                  style={{
                    width: "100%",
                    height: "38px",
                    padding: "8px 12px 8px 36px",
                    border: "1px solid #cbd5e1",
                    borderRadius: "8px",
                    fontSize: "13.5px",
                    outline: "none",
                    boxSizing: "border-box"
                  }}
                />
                <span style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", fontSize: "15px", color: "#94a3b8" }}>
                  👤
                </span>
              </div>
            </div>

            {/* Password */}
            <div style={{ marginBottom: "12px" }}>
              <label style={{ display: "block", fontSize: "11.5px", fontWeight: "600", color: "#475569", marginBottom: "4px" }}>
                Password
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder={isSignUp ? "Create password (min 6 chars)" : "Enter your password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  required
                  autoComplete={isSignUp ? "new-password" : "current-password"}
                  style={{
                    width: "100%",
                    height: "38px",
                    padding: "8px 36px 8px 36px",
                    border: "1px solid #cbd5e1",
                    borderRadius: "8px",
                    fontSize: "13.5px",
                    outline: "none",
                    boxSizing: "border-box"
                  }}
                />
                <span style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", fontSize: "15px", color: "#94a3b8" }}>
                  🔒
                </span>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute",
                    right: "8px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    fontSize: "14px",
                    cursor: "pointer",
                    padding: "4px"
                  }}
                >
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>

              {/* Password Strength Meter for Registration */}
              {isSignUp && password && (
                <div style={{ marginTop: "6px" }}>
                  <div style={{ display: "flex", gap: "4px", height: "4px", marginBottom: "3px" }}>
                    {[0, 1, 2, 3].map((i) => (
                      <div
                        key={i}
                        style={{
                          flex: 1,
                          borderRadius: "2px",
                          background: i < strengthScore ? strengthColors[strengthScore - 1] : "#e2e8f0",
                          transition: "background 0.2s ease"
                        }}
                      />
                    ))}
                  </div>
                  <span style={{ fontSize: "11px", fontWeight: "600", color: strengthColors[strengthScore - 1] }}>
                    Strength: {strengthNames[strengthScore - 1]}
                  </span>
                </div>
              )}
            </div>

            {/* Registration Extra Fields */}
            {isSignUp && (
              <>
                {/* Confirm Password */}
                <div style={{ marginBottom: "12px" }}>
                  <label style={{ display: "block", fontSize: "11.5px", fontWeight: "600", color: "#475569", marginBottom: "4px" }}>
                    Confirm Password
                  </label>
                  <div style={{ position: "relative" }}>
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Repeat your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={loading}
                      required
                      autoComplete="new-password"
                      style={{
                        width: "100%",
                        height: "38px",
                        padding: "8px 12px 8px 36px",
                        border: "1px solid #cbd5e1",
                        borderRadius: "8px",
                        fontSize: "13.5px",
                        outline: "none",
                        boxSizing: "border-box"
                      }}
                    />
                    <span style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", fontSize: "15px", color: "#94a3b8" }}>
                      🔒
                    </span>
                  </div>
                </div>

                {/* Security Recovery Section */}
                <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "12px", marginBottom: "14px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                    <span style={{ fontSize: "14px" }}>🔑</span>
                    <span style={{ fontSize: "12px", fontWeight: "700", color: "var(--navy, #0B2545)" }}>
                      Security Recovery Words
                    </span>
                  </div>
                  <p style={{ fontSize: "11px", color: "#64748b", margin: "0 0 10px", lineHeight: "1.4" }}>
                    Used to securely reset your password if you ever forget it.
                  </p>

                  {/* Word 1: Favourite Place */}
                  <div style={{ marginBottom: "8px" }}>
                    <label style={{ display: "block", fontSize: "11px", fontWeight: "600", color: "#475569", marginBottom: "3px" }}>
                      Recovery Word 1: Favourite Place
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. New Delhi"
                      value={favouritePlace}
                      onChange={(e) => setFavouritePlace(e.target.value)}
                      disabled={loading}
                      required
                      style={{
                        width: "100%",
                        height: "34px",
                        padding: "6px 10px",
                        border: "1px solid #cbd5e1",
                        borderRadius: "6px",
                        fontSize: "12.5px",
                        boxSizing: "border-box"
                      }}
                    />
                  </div>

                  {/* Word 2: Firstname_Year of Birth */}
                  <div>
                    <label style={{ display: "block", fontSize: "11px", fontWeight: "600", color: "#475569", marginBottom: "3px" }}>
                      Recovery Word 2: Firstname_Year of Birth
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. John_1998"
                      value={firstnameYob}
                      onChange={(e) => setFirstnameYob(e.target.value)}
                      disabled={loading}
                      required
                      style={{
                        width: "100%",
                        height: "34px",
                        padding: "6px 10px",
                        border: "1px solid #cbd5e1",
                        borderRadius: "6px",
                        fontSize: "12.5px",
                        boxSizing: "border-box"
                      }}
                    />
                  </div>
                </div>
              </>
            )}

            {/* Login Remember & Forgot Password */}
            {!isSignUp && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#475569", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    disabled={loading}
                  />
                  Remember me
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgotPopover(true)}
                  style={{
                    background: "none",
                    border: "none",
                    fontSize: "12px",
                    color: "var(--navy, #0B2545)",
                    cursor: "pointer",
                    fontWeight: "600",
                    padding: 0,
                    textDecoration: "underline"
                  }}
                >
                  Forgot Password?
                </button>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                height: "42px",
                background: "linear-gradient(135deg, var(--navy, #0B2545) 0%, #173d69 100%)",
                color: "#ffffff",
                border: "none",
                borderRadius: "8px",
                fontSize: "13.5px",
                fontWeight: "700",
                cursor: loading ? "not-allowed" : "pointer",
                boxShadow: "0 4px 12px rgba(11, 37, 69, 0.25)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                transition: "opacity 0.15s ease"
              }}
            >
              {loading ? "Processing..." : isSignUp ? "Register & Proceed" : "Sign In & Proceed"}
            </button>

            {/* Standalone Page Option */}
            <div style={{ marginTop: "14px", textAlign: "center", borderTop: "1px solid #f1f5f9", paddingTop: "10px" }}>
              <a
                href={`/login?returnUrl=${encodeURIComponent(typeof window !== "undefined" ? window.location.pathname + window.location.search + window.location.hash : "/")}&mode=${isSignUp ? "register" : "login"}`}
                style={{
                  fontSize: "11.5px",
                  color: "#64748b",
                  textDecoration: "none",
                  fontWeight: "600",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px"
                }}
              >
                Prefer full page? Open Standalone Login Page ↗
              </a>
            </div>
          </form>
        </div>
      </div>

      {/* Forgot Password Recovery Popover */}
      {showForgotPopover && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.65)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 25000,
          padding: "20px"
        }}>
          <div style={{
            background: "#fff",
            borderRadius: "14px",
            padding: "24px 26px",
            maxWidth: "420px",
            width: "100%",
            boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
            position: "relative",
            textAlign: "left"
          }}>
            <button 
              type="button"
              onClick={() => {
                setShowForgotPopover(false);
                setIsRecoveryVerified(false);
                setRecoveryUsername("");
                setRecoveryCodeInput("");
                setRecoveryNewPassword("");
                setRecoveryConfirmPassword("");
                setRecoveryError("");
                setRecoverySuccess("");
              }}
              style={{
                position: "absolute",
                top: "14px",
                right: "14px",
                background: "#f1f5f9",
                border: "none",
                borderRadius: "50%",
                width: "28px",
                height: "28px",
                fontSize: "18px",
                cursor: "pointer",
                color: "#64748b",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              &times;
            </button>

            <div style={{ textAlign: "center", marginBottom: "16px" }}>
              <span style={{ fontSize: "32px" }}>🔑</span>
              <h3 style={{ margin: "6px 0 3px", fontSize: "17px", color: "var(--navy, #0B2545)", fontWeight: 700 }}>
                Password Recovery
              </h3>
              <p style={{ fontSize: "12px", color: "#64748b", margin: 0 }}>
                Enter your username and 7-character recovery code to update your password.
              </p>
            </div>

            {recoveryError && (
              <div style={{ background: "#fdf2f2", border: "1px solid #fde2e2", color: "#b91c1c", fontSize: "12px", padding: "10px", borderRadius: "8px", marginBottom: "14px" }}>
                <div style={{ marginBottom: "6px", fontWeight: 500 }}>⚠️ {recoveryError}</div>
                <a
                  href="https://t.me/IsAIdangerous"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    color: "#ffffff",
                    background: "#24A1DE",
                    padding: "6px 12px",
                    borderRadius: "6px",
                    textDecoration: "none",
                    fontSize: "11.5px",
                    fontWeight: 600,
                    marginTop: "2px"
                  }}
                >
                  Contact Admin via Telegram
                </a>
              </div>
            )}

            {recoverySuccess && (
              <div style={{ background: "#f0fdf4", border: "1px solid #dcfce7", color: "#166534", fontSize: "12px", padding: "10px", borderRadius: "6px", marginBottom: "14px" }}>
                ✅ {recoverySuccess}
              </div>
            )}

            {!isRecoveryVerified ? (
              <form onSubmit={handleVerifyRecovery}>
                <div style={{ marginBottom: "12px" }}>
                  <label style={{ fontSize: "11.5px", fontWeight: 600, color: "#4b5563", display: "block", marginBottom: "4px" }}>
                    Username
                  </label>
                  <input
                    type="text"
                    placeholder="Enter your username"
                    value={recoveryUsername}
                    onChange={(e) => setRecoveryUsername(e.target.value)}
                    required
                    style={{
                      width: "100%",
                      height: "36px",
                      padding: "6px 10px",
                      border: "1px solid #d1d5db",
                      borderRadius: "6px",
                      fontSize: "13px",
                      boxSizing: "border-box"
                    }}
                  />
                </div>

                <div style={{ marginBottom: "16px" }}>
                  <label style={{ fontSize: "11.5px", fontWeight: 600, color: "#4b5563", display: "block", marginBottom: "4px" }}>
                    7-Character Recovery Code
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. K9#m$7p"
                    value={recoveryCodeInput}
                    onChange={(e) => setRecoveryCodeInput(e.target.value)}
                    required
                    maxLength={10}
                    style={{
                      width: "100%",
                      height: "36px",
                      padding: "6px 10px",
                      border: "1px solid #d1d5db",
                      borderRadius: "6px",
                      fontSize: "13px",
                      letterSpacing: "1.5px",
                      fontFamily: "monospace",
                      fontWeight: "700",
                      boxSizing: "border-box"
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={recoveryLoading}
                  style={{
                    width: "100%",
                    height: "38px",
                    background: "var(--navy, #0B2545)",
                    color: "#fff",
                    border: "none",
                    borderRadius: "6px",
                    fontWeight: 600,
                    cursor: "pointer",
                    fontSize: "13px"
                  }}
                >
                  {recoveryLoading ? "Verifying..." : "Verify Code & Proceed"}
                </button>
              </form>
            ) : (
              <form onSubmit={handleResetPassword}>
                <div style={{ marginBottom: "12px" }}>
                  <label style={{ fontSize: "11.5px", fontWeight: 600, color: "#4b5563", display: "block", marginBottom: "4px" }}>
                    New Password
                  </label>
                  <input
                    type="password"
                    placeholder="Enter new password (min 6 chars)"
                    value={recoveryNewPassword}
                    onChange={(e) => setRecoveryNewPassword(e.target.value)}
                    required
                    style={{
                      width: "100%",
                      height: "36px",
                      padding: "6px 10px",
                      border: "1px solid #d1d5db",
                      borderRadius: "6px",
                      fontSize: "13px",
                      boxSizing: "border-box"
                    }}
                  />
                </div>

                <div style={{ marginBottom: "16px" }}>
                  <label style={{ fontSize: "11.5px", fontWeight: 600, color: "#4b5563", display: "block", marginBottom: "4px" }}>
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    placeholder="Confirm new password"
                    value={recoveryConfirmPassword}
                    onChange={(e) => setRecoveryConfirmPassword(e.target.value)}
                    required
                    style={{
                      width: "100%",
                      height: "36px",
                      padding: "6px 10px",
                      border: "1px solid #d1d5db",
                      borderRadius: "6px",
                      fontSize: "13px",
                      boxSizing: "border-box"
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={recoveryLoading}
                  style={{
                    width: "100%",
                    height: "38px",
                    background: "#0f3d33",
                    color: "#fff",
                    border: "none",
                    borderRadius: "6px",
                    fontWeight: 600,
                    cursor: "pointer",
                    fontSize: "13px"
                  }}
                >
                  {recoveryLoading ? "Saving Password..." : "Save New Password"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

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
