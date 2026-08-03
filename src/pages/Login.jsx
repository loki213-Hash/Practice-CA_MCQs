import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../supabase/supabase";

export default function Login() {
  const navigate = useNavigate();
  const { login, register } = useAuth();

  const [isSignUp, setIsSignUp] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [favouritePlace, setFavouritePlace] = useState("");
  const [firstnameYob, setFirstnameYob] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const [loaded, setLoaded] = useState(false);
  const [isFluttering, setIsFluttering] = useState(false);
  const [isConfirmFluttering, setIsConfirmFluttering] = useState(false);
  const [shakeUsername, setShakeUsername] = useState(false);
  const [shakePassword, setShakePassword] = useState(false);
  
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForgotPopover, setShowForgotPopover] = useState(false);

  // Password Recovery Flow States
  const [recoveryUsername, setRecoveryUsername] = useState("");
  const [recoveryWord1, setRecoveryWord1] = useState("");
  const [recoveryWord2, setRecoveryWord2] = useState("");
  const [recoveryNewPassword, setRecoveryNewPassword] = useState("");
  const [recoveryConfirmPassword, setRecoveryConfirmPassword] = useState("");
  const [isRecoveryVerified, setIsRecoveryVerified] = useState(false);
  const [recoveryError, setRecoveryError] = useState("");
  const [recoverySuccess, setRecoverySuccess] = useState("");
  const [recoveryLoading, setRecoveryLoading] = useState(false);

  const birdLayerRef = useRef(null);

  useEffect(() => {
    // Fade in animation on mount
    requestAnimationFrame(() => setLoaded(true));
  }, []);

  const birdSVG = `<svg viewBox="0 0 100 60" xmlns="http://www.w3.org/2000/svg">
    <g class="wing wing-l" fill="#c9a667"><path d="M48 30 C 30 14, 4 14, 0 26 C 16 26, 34 32, 48 34 Z"/></g>
    <g class="wing wing-r" fill="#e7c9a9"><path d="M52 30 C 70 14, 96 14, 100 26 C 84 26, 66 32, 52 34 Z"/></g>
    <ellipse cx="50" cy="32" rx="14" ry="7" fill="#c9a667"/>
    <path d="M60 30 L 70 32 L 60 35 Z" fill="#e7c9a9"/>
  </svg>`;

  const spawnFeathers = (bird) => {
    const layer = birdLayerRef.current;
    if (!layer) return null;
    const interval = setInterval(() => {
      const rect = bird.getBoundingClientRect();
      const layerRect = layer.getBoundingClientRect();
      const f = document.createElement("div");
      f.className = "feather";
      f.style.left = (rect.left - layerRect.left + rect.width * 0.15) + "px";
      f.style.top = (rect.top - layerRect.top + rect.height * 0.5) + "px";
      layer.appendChild(f);
      f.addEventListener("animationend", () => f.remove());
    }, 90);
    return interval;
  };

  const flyBird = (direction) => {
    const layer = birdLayerRef.current;
    if (!layer) return;
    const bird = document.createElement("div");
    bird.className = "bird";
    bird.innerHTML = birdSVG;
    layer.appendChild(bird);

    requestAnimationFrame(() => {
      bird.classList.add(direction === "rtl" ? "flying-rtl" : "flying-ltr");
    });

    const featherInterval = spawnFeathers(bird);

    bird.addEventListener("animationend", () => {
      if (featherInterval) clearInterval(featherInterval);
      bird.remove();
    }, { once: true });
  };

  const handleToggle = (signUpMode) => {
    setIsSignUp(signUpMode);
    setError("");
    setFavouritePlace("");
    setFirstnameYob("");
    flyBird(signUpMode ? "rtl" : "ltr");
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    setIsFluttering(true);
    setTimeout(() => setIsFluttering(false), 550);
  };

  const handleConfirmPasswordChange = (e) => {
    setConfirmPassword(e.target.value);
    setIsConfirmFluttering(true);
    setTimeout(() => setIsConfirmFluttering(false), 550);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Trigger validation shakes
    let hasValidationError = false;
    if (!username.trim()) {
      setShakeUsername(true);
      setTimeout(() => setShakeUsername(false), 400);
      hasValidationError = true;
    }
    if (!password) {
      setShakePassword(true);
      setTimeout(() => setShakePassword(false), 400);
      hasValidationError = true;
    }

    if (hasValidationError) return;

    const cleanUsername = username.trim();
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
        await register(cleanUsername, password, favouritePlace, firstnameYob);
        await login(cleanUsername, password, rememberMe);
      } else {
        await login(cleanUsername, password, rememberMe);
      }
      navigate("/", { replace: true });
    } catch (err) {
      let msg;
      if (err && typeof err === "object") {
        msg = err.message || err.error_description || "An error occurred.";
      } else if (typeof err === "string") {
        msg = err;
      } else {
        msg = "An error occurred.";
      }
      if (msg === "{}" || msg.includes("AuthRetryableFetchError") || msg.includes("fetch")) {
        msg = "Unable to connect or complete registration. Please check your internet connection or verify your database trigger setup.";
      } else if (msg.includes("already registered") || msg.includes("User already exists")) {
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
      if (!recoveryWord1.trim()) {
        setRecoveryError("Please enter Recovery Word 1 (Favourite Place).");
        return;
      }
      if (!recoveryWord2.trim()) {
        setRecoveryError("Please enter Recovery Word 2 (Firstname_Year of Birth).");
        return;
      }

      // Check registered_users for matching username & recovery answers
      const { data, error: fetchErr } = await supabase
        .from("registered_users")
        .select("id")
        .ilike("username", recoveryUsername.trim())
        .ilike("favourite_place", recoveryWord1.trim())
        .ilike("firstname_yob", recoveryWord2.trim())
        .maybeSingle();

      if (fetchErr) throw fetchErr;

      if (!data) {
        setRecoveryError("Security recovery words or username do not match. Please verify your details.");
      } else {
        setIsRecoveryVerified(true);
        setRecoverySuccess("Identity verified! Please set your new password below.");
      }
    } catch (err) {
      console.error(err);
      setRecoveryError(err.message || "Failed to verify details. Please try again.");
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

      // Invoke reset_student_password secure RPC definition
      const { data: isSuccess, error: rpcErr } = await supabase.rpc("reset_student_password", {
        target_username: recoveryUsername.trim(),
        recovery_word1: recoveryWord1.trim(),
        recovery_word2: recoveryWord2.trim(),
        new_password: recoveryNewPassword
      });

      if (rpcErr) throw rpcErr;

      if (isSuccess) {
        setRecoverySuccess("Password updated successfully! You can now sign in with your new password.");
        // Reset states after brief delay
        setTimeout(() => {
          setShowForgotPopover(false);
          // Clear all states
          setRecoveryUsername("");
          setRecoveryWord1("");
          setRecoveryWord2("");
          setRecoveryNewPassword("");
          setRecoveryConfirmPassword("");
          setIsRecoveryVerified(false);
          setRecoverySuccess("");
          setRecoveryError("");
        }, 3000);
      } else {
        setRecoveryError("Password reset failed. Please ensure recovery details are correct.");
      }
    } catch (err) {
      console.error(err);
      setRecoveryError(err.message || "Password reset failed. Make sure database function is deployed.");
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
  const strengthColors = ["#c0564f", "#d99a4e", "#b8935a", "#c9a667"];
  const strengthNames = ["Blank page", "Short story", "Full chapter", "Complete novel"];

  // Book Toggle Logic
  const isLoginBookClosed = password.length > 0 && !showPassword;
  const isConfirmBookClosed = confirmPassword.length > 0 && !showPassword;

  return (
    <>
      <nav className="inner-navbar auth-nav">
        <Link className="brand" to="/">
          <img src="/ca-logo.png" alt="CA" />
          <span className="brand-title">CAmcqs-Practice</span>
        </Link>
      </nav>

      <div className="login-page-wrapper">
        <div className={`stage ${loaded ? "loaded" : ""}`}>
          <div className={`container ${isSignUp ? "active" : ""}`}>
            
            {/* LOGIN FORM BOX */}
            <div className="form-box login">
              <form onSubmit={handleSubmit} noValidate>
                <h1>Welcome back</h1>
                <p>Sign in with your unique credentials to access your quiz progress.</p>
                
                {error && !isSignUp && <div className="form-error">{error}</div>}

                <div className={`input-box ${shakeUsername ? "shake" : ""}`}>
                  <input
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={loading}
                    required
                    autoComplete="username"
                  />
                  <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" stroke="#a3a09a">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>

                <div className={`input-box ${shakePassword ? "shake" : ""}`}>
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    value={password}
                    onChange={handlePasswordChange}
                    disabled={loading}
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className={`book-toggle ${isLoginBookClosed ? "is-closed" : ""} ${isFluttering ? "fluttering" : ""}`}
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    tabIndex="-1"
                  >
                    <div className="book-inner">
                      <div className="book-face open">📖</div>
                      <div className="book-face closed">📕</div>
                    </div>
                    <div className="book-pages">
                      <i></i>
                      <i></i>
                      <i></i>
                    </div>
                  </button>
                </div>

                <div className="checkbox-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <input
                      type="checkbox"
                      id="rememberMe"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      disabled={loading}
                    />
                    <label htmlFor="rememberMe" className="checkbox-box">
                      <svg viewBox="0 0 24 24" fill="none" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 12l5 5L20 6" />
                      </svg>
                    </label>
                    <label htmlFor="rememberMe" style={{ marginLeft: "4px" }}>Remember me</label>
                  </div>
                  <button
                    type="button"
                    style={{ background: "none", border: "none", fontSize: "12px", color: "var(--navy)", cursor: "pointer", textDecoration: "underline", padding: 0, fontWeight: 600 }}
                    onClick={() => setShowForgotPopover(true)}
                  >
                    Forgot Password?
                  </button>
                </div>

                <button type="submit" className={`btn ${loading ? "is-loading" : ""}`} disabled={loading}>
                  <span className="btn-label">Sign In</span>
                  <span className="btn-spinner">
                    <span></span>
                  </span>
                </button>
              </form>
            </div>

            {/* REGISTER FORM BOX */}
            <div className="form-box register">
              <form onSubmit={handleSubmit} noValidate>
                <h1>Create account</h1>
                <p>Register a unique username and password to start saving your progress.</p>
                
                {error && isSignUp && <div className="form-error">{error}</div>}

                <div className={`input-box ${shakeUsername ? "shake" : ""}`}>
                  <input
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={loading}
                    required
                    autoComplete="username"
                  />
                  <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" stroke="#a3a09a">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>

                <div className={`input-box ${shakePassword ? "shake" : ""}`}>
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    value={password}
                    onChange={handlePasswordChange}
                    disabled={loading}
                    required
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className={`book-toggle ${isLoginBookClosed ? "is-closed" : ""} ${isFluttering ? "fluttering" : ""}`}
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    tabIndex="-1"
                  >
                    <div className="book-inner">
                      <div className="book-face open">📖</div>
                      <div className="book-face closed">📕</div>
                    </div>
                    <div className="book-pages">
                      <i></i>
                      <i></i>
                      <i></i>
                    </div>
                  </button>
                </div>

                {isSignUp && password && (
                  <div className="strength-meter visible">
                    <div className="strength-bars">
                      {[0, 1, 2, 3].map((i) => (
                        <i
                          key={i}
                          style={{
                            background: i < strengthScore ? strengthColors[strengthScore - 1] : "#e6e1d6"
                          }}
                        />
                      ))}
                    </div>
                    <div
                      className="strength-label"
                      style={{ color: strengthColors[strengthScore - 1] }}
                    >
                      {strengthNames[strengthScore - 1]}
                    </div>
                  </div>
                )}

                <div className="input-box">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Confirm Password"
                    value={confirmPassword}
                    onChange={handleConfirmPasswordChange}
                    disabled={loading}
                    required
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className={`book-toggle ${isConfirmBookClosed ? "is-closed" : ""} ${isConfirmFluttering ? "fluttering" : ""}`}
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    tabIndex="-1"
                  >
                    <div className="book-inner">
                      <div className="book-face open">📖</div>
                      <div className="book-face closed">📕</div>
                    </div>
                    <div className="book-pages">
                      <i></i>
                      <i></i>
                      <i></i>
                    </div>
                  </button>
                </div>

                {/* Section Header for Recovery Words */}
                <div style={{ marginTop: "24px", marginBottom: "8px", borderTop: "1px dashed #e6e1d6", paddingTop: "16px", textAlign: "left" }}>
                  <h4 style={{ fontSize: "13px", color: "var(--navy)", fontWeight: 700, margin: "0 0 4px" }}>🔑 Security Recovery Words</h4>
                  <p style={{ fontSize: "11px", color: "#8a94a6", margin: 0, lineHeight: 1.4 }}>
                    Provide these to the admin to reset your password if you ever forget it.
                  </p>
                </div>

                {/* Recovery Phrase: Favourite Place */}
                <div style={{ textAlign: "left", marginBottom: "4px", paddingLeft: "4px" }}>
                  <label style={{ fontSize: "11.5px", fontWeight: 600, color: "#8a94a6" }}>Recovery Word 1: Favourite Place</label>
                </div>
                <div className="input-box" style={{ margin: "0 0 12px 0" }}>
                  <input
                    type="text"
                    placeholder="e.g. New Delhi"
                    value={favouritePlace}
                    onChange={(e) => setFavouritePlace(e.target.value)}
                    disabled={loading}
                    required
                  />
                  <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" stroke="#a3a09a">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                </div>

                {/* Recovery Phrase: Firstname_Year of Birth */}
                <div style={{ textAlign: "left", marginBottom: "4px", paddingLeft: "4px" }}>
                  <label style={{ fontSize: "11.5px", fontWeight: 600, color: "#8a94a6" }}>Recovery Word 2: Firstname_Year of Birth</label>
                </div>
                <div className="input-box" style={{ margin: "0 0 12px 0" }}>
                  <input
                    type="text"
                    placeholder="e.g. John_1998"
                    value={firstnameYob}
                    onChange={(e) => setFirstnameYob(e.target.value)}
                    disabled={loading}
                    required
                  />
                  <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" stroke="#a3a09a">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                </div>

                <button type="submit" className={`btn ${loading ? "is-loading" : ""}`} disabled={loading}>
                  <span className="btn-label">Register & Sign In</span>
                  <span className="btn-spinner">
                    <span></span>
                  </span>
                </button>
              </form>
            </div>

            {/* SLIDING PANEL OVERLAYS */}
            <div className="toggle-box">
              <div className="toggle-panel toggle-left">
                <h1>New here?</h1>
                <p>Register a unique account to track your chapter accuracy and master the syllabus.</p>
                <button type="button" className="btn register-btn" onClick={() => handleToggle(true)}>
                  Register
                </button>
              </div>
              <div className="toggle-panel toggle-right">
                <h1>One of us?</h1>
                <p>Sign in and pick up your exam preparation where you left off.</p>
                <button type="button" className="btn login-btn" onClick={() => handleToggle(false)}>
                  Sign In
                </button>
              </div>
            </div>

            <div className="bird-layer" id="birdLayer" ref={birdLayerRef}></div>

          </div>
        </div>
      </div>

      {/* Forgot Password Recovery Popover */}
      {showForgotPopover && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0,0,0,0.55)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 10000,
          padding: "20px"
        }}>
          <div style={{
            background: "#fff",
            borderRadius: "12px",
            padding: "28px",
            maxWidth: "440px",
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
                setRecoveryWord1("");
                setRecoveryWord2("");
                setRecoveryNewPassword("");
                setRecoveryConfirmPassword("");
                setRecoveryError("");
                setRecoverySuccess("");
              }}
              style={{
                position: "absolute",
                top: "14px",
                right: "16px",
                background: "transparent",
                border: "none",
                fontSize: "22px",
                cursor: "pointer",
                color: "#999",
                lineHeight: "1"
              }}
            >
              &times;
            </button>

            <div style={{ textAlign: "center", marginBottom: "16px" }}>
              <span style={{ fontSize: "36px" }}>🔑</span>
              <h3 style={{ margin: "8px 0 4px", fontSize: "18px", color: "var(--navy)", fontWeight: 700 }}>
                Password Recovery
              </h3>
              <p style={{ fontSize: "12px", color: "#6b7280", margin: 0 }}>
                Reset your password instantly using your security recovery words.
              </p>
            </div>

            {recoveryError && (
              <div style={{ background: "#fdf2f2", border: "1px solid #fde2e2", color: "#b91c1c", fontSize: "12.5px", padding: "12px", borderRadius: "8px", marginBottom: "16px" }}>
                <div style={{ marginBottom: "8px", fontWeight: 500 }}>⚠️ {recoveryError}</div>
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
                    padding: "8px 14px",
                    borderRadius: "6px",
                    textDecoration: "none",
                    fontSize: "12px",
                    fontWeight: 600,
                    marginTop: "4px",
                    boxShadow: "0 2px 4px rgba(36,161,222,0.2)",
                    transition: "opacity 0.15s ease"
                  }}
                  onMouseOver={(e) => e.currentTarget.style.opacity = 0.9}
                  onMouseOut={(e) => e.currentTarget.style.opacity = 1}
                >
                  <svg viewBox="0 0 24 24" style={{ width: "14px", height: "14px", fill: "currentColor" }}>
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.12.02-1.96 1.25-5.54 3.69-.52.36-1 .53-1.42.52-.47-.01-1.37-.26-2.03-.48-.82-.27-1.47-.42-1.42-.88.03-.24.35-.49.96-.75 3.78-1.65 6.31-2.74 7.58-3.27 3.61-1.5 4.36-1.76 4.85-1.77.11 0 .35.03.5.15.13.1.17.24.18.35-.01.08 0 .23-.02.34z"/>
                  </svg>
                  Contact Admin via Telegram
                </a>
              </div>
            )}

            {recoverySuccess && (
              <div style={{ background: "#f0fdf4", border: "1px solid #dcfce7", color: "#166534", fontSize: "12.5px", padding: "10px 12px", borderRadius: "6px", marginBottom: "16px" }}>
                ✅ {recoverySuccess}
              </div>
            )}

            {!isRecoveryVerified ? (
              <form onSubmit={handleVerifyRecovery}>
                <div style={{ marginBottom: "14px" }}>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: "#4b5563", display: "block", marginBottom: "4px" }}>
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
                      height: "38px",
                      padding: "8px 12px",
                      border: "1px solid #d1d5db",
                      borderRadius: "6px",
                      fontSize: "14px"
                    }}
                  />
                </div>

                <div style={{ marginBottom: "14px" }}>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: "#4b5563", display: "block", marginBottom: "4px" }}>
                    Recovery Word 1: Favourite Place
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. New Delhi"
                    value={recoveryWord1}
                    onChange={(e) => setRecoveryWord1(e.target.value)}
                    required
                    style={{
                      width: "100%",
                      height: "38px",
                      padding: "8px 12px",
                      border: "1px solid #d1d5db",
                      borderRadius: "6px",
                      fontSize: "14px"
                    }}
                  />
                </div>

                <div style={{ marginBottom: "20px" }}>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: "#4b5563", display: "block", marginBottom: "4px" }}>
                    Recovery Word 2: Firstname_Year of Birth
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. John_1998"
                    value={recoveryWord2}
                    onChange={(e) => setRecoveryWord2(e.target.value)}
                    required
                    style={{
                      width: "100%",
                      height: "38px",
                      padding: "8px 12px",
                      border: "1px solid #d1d5db",
                      borderRadius: "6px",
                      fontSize: "14px"
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={recoveryLoading}
                  style={{
                    width: "100%",
                    height: "40px",
                    background: "var(--navy)",
                    color: "#fff",
                    border: "none",
                    borderRadius: "6px",
                    fontWeight: 600,
                    cursor: "pointer",
                    fontSize: "13.5px"
                  }}
                >
                  {recoveryLoading ? "Verifying..." : "Verify Details"}
                </button>
              </form>
            ) : (
              <form onSubmit={handleResetPassword}>
                <div style={{ marginBottom: "14px" }}>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: "#4b5563", display: "block", marginBottom: "4px" }}>
                    New Password
                  </label>
                  <input
                    type="password"
                    placeholder="Enter new password (min. 6 characters)"
                    value={recoveryNewPassword}
                    onChange={(e) => setRecoveryNewPassword(e.target.value)}
                    required
                    style={{
                      width: "100%",
                      height: "38px",
                      padding: "8px 12px",
                      border: "1px solid #d1d5db",
                      borderRadius: "6px",
                      fontSize: "14px"
                    }}
                  />
                </div>

                <div style={{ marginBottom: "20px" }}>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: "#4b5563", display: "block", marginBottom: "4px" }}>
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
                      height: "38px",
                      padding: "8px 12px",
                      border: "1px solid #d1d5db",
                      borderRadius: "6px",
                      fontSize: "14px"
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={recoveryLoading}
                  style={{
                    width: "100%",
                    height: "40px",
                    background: "#0f3d33",
                    color: "#fff",
                    border: "none",
                    borderRadius: "6px",
                    fontWeight: 600,
                    cursor: "pointer",
                    fontSize: "13.5px"
                  }}
                >
                  {recoveryLoading ? "Saving Password..." : "Save New Password"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
