import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const navigate = useNavigate();
  const { login, register } = useAuth();

  const [isSignUp, setIsSignUp] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
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

    setLoading(true);
    try {
      if (isSignUp) {
        await register(cleanUsername, password);
        await login(cleanUsername, password, rememberMe);
      } else {
        await login(cleanUsername, password, rememberMe);
      }
      navigate("/", { replace: true });
    } catch (err) {
      let msg = err.message || "An error occurred.";
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
          <span className="brand-title">CA Quiz Platform</span>
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

      {/* Forgot Password Recovery Explanation Modal */}
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
            textAlign: "center"
          }}>
            <span style={{ fontSize: "36px" }}>🔑</span>
            <h3 style={{ margin: "14px 0 10px", fontSize: "18px", color: "var(--navy)", fontWeight: 700 }}>Password Recovery</h3>
            <p style={{ fontSize: "13px", color: "#555", lineHeight: "1.6", margin: "0 0 20px" }}>
              Since this platform uses <strong>username-only registration</strong> (without collecting your real email or phone number for security and privacy), automatic password recovery emails cannot be sent.
            </p>
            <div style={{ background: "#f8f9fa", border: "1px solid #e9ecef", borderRadius: "8px", padding: "14px", fontSize: "12.5px", color: "#444", textAlign: "left", marginBottom: "20px", lineHeight: "1.5" }}>
              <strong>To reset your password:</strong><br />
              Please contact the platform administrator directly at <strong>admin.caquiz@gmail.com</strong> with your registered username. The admin will verify your profile and update your password in the administrative dashboard.
            </div>
            <button
              type="button"
              className="btn"
              onClick={() => setShowForgotPopover(false)}
              style={{ width: "100%", height: "42px", fontWeight: 600 }}
            >
              I Understand
            </button>
          </div>
        </div>
      )}
    </>
  );
}
