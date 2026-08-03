import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getCourseBySlug } from "../services/courseService";
import { getSubjects } from "../services/subjectService";
import { getChapters } from "../services/chapterService";
import { getTopicCountsForChapters } from "../services/topicService";
import { getCasesForCourse } from "../services/caseService";
import { saveQuizAttempt } from "../services/progressService";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../supabase/supabase";
import Loading from "../components/Loading";
import CaseTableRenderer from "../components/CaseTableRenderer";

function getSubjectIcon(name) {
  const n = (name || "").toLowerCase();
  if (n.includes("company") || n.includes("companies")) return "🏛️";
  if (n.includes("sebi") || n.includes("regulation")) return "📈";
  if (n.includes("fema") || n.includes("foreign exchange")) return "💱";
  if (n.includes("fcra") || n.includes("foreign contribution")) return "🌍";
  if (n.includes("ibc") || n.includes("insolvency") || n.includes("bankruptcy")) return "⚖️";
  return "📑";
}

function SubjectBgSvg({ name }) {
  const n = (name || "").toLowerCase();

  if (n.includes("company") || n.includes("companies")) {
    return (
      <div className="card-bg">
        <svg viewBox="0 0 200 170" preserveAspectRatio="xMidYMid slice">
          <rect x="0" y="0" width="200" height="170" fill="transparent"/>

          {/* Hammer — left side, swings down from top-left */}
          <g className="hammer-group">
            {/* Handle */}
            <rect x="30" y="30" width="8" height="58" rx="3"
              fill="var(--text-secondary)" opacity="0.45"
              transform="rotate(-20 34 30)"
            />
            {/* Head */}
            <rect x="14" y="20" width="28" height="16" rx="3"
              fill="var(--text-primary)" opacity="0.55"
              transform="rotate(-20 34 30)"
            />
            {/* Head shine */}
            <rect x="16" y="22" width="10" height="12" rx="1.5"
              fill="var(--text-quaternary)" opacity="0.3"
              transform="rotate(-20 34 30)"
            />
          </g>

          {/* Impact lines — appear near hammer strike point (bottom of swing arc) */}
          <g className="impact-lines">
            <line x1="42" y1="92" x2="22" y2="84" stroke="var(--text-quaternary)" strokeWidth="1.5" opacity="0.5"/>
            <line x1="40" y1="100" x2="18" y2="100" stroke="var(--text-quaternary)" strokeWidth="1.5" opacity="0.5"/>
            <line x1="42" y1="108" x2="22" y2="116" stroke="var(--text-quaternary)" strokeWidth="1.5" opacity="0.5"/>
          </g>

          {/* Bench / Sound-block — falls in from below at bottom-right */}
          <g className="bench-fall">
            {/* Sound block (rectangular plinth) */}
            <rect x="132" y="126" width="42" height="10" rx="2"
              fill="var(--text-primary)" opacity="0.22"
            />
            {/* Bench top surface */}
            <rect x="128" y="118" width="50" height="8" rx="2"
              fill="var(--text-secondary)" opacity="0.32"
            />
            {/* Bench left leg */}
            <rect x="132" y="136" width="6" height="14" rx="1.5"
              fill="var(--text-tertiary)" opacity="0.25"
            />
            {/* Bench right leg */}
            <rect x="170" y="136" width="6" height="14" rx="1.5"
              fill="var(--text-tertiary)" opacity="0.25"
            />
          </g>
        </svg>
      </div>
    );
  }

  if (n.includes("sebi") || n.includes("securities")) {
    return (
      <div className="card-bg">
        <svg viewBox="0 0 200 170" preserveAspectRatio="xMidYMid slice">
          <rect x="0" y="0" width="200" height="170" fill="transparent"/>
          <line x1="25" y1="35" x2="25" y2="130" stroke="var(--border)" strokeWidth="0.5" opacity="0.5"/>
          <line x1="60" y1="35" x2="60" y2="130" stroke="var(--border)" strokeWidth="0.5" opacity="0.5"/>
          <line x1="95" y1="35" x2="95" y2="130" stroke="var(--border)" strokeWidth="0.5" opacity="0.5"/>
          <line x1="130" y1="35" x2="130" y2="130" stroke="var(--border)" strokeWidth="0.5" opacity="0.5"/>
          <line x1="165" y1="35" x2="165" y2="130" stroke="var(--border)" strokeWidth="0.5" opacity="0.5"/>
          <line x1="25" y1="130" x2="175" y2="130" stroke="var(--border)" strokeWidth="0.5" opacity="0.5"/>
          <line x1="25" y1="98" x2="175" y2="98" stroke="var(--border)" strokeWidth="0.5" opacity="0.5"/>
          <line x1="25" y1="66" x2="175" y2="66" stroke="var(--border)" strokeWidth="0.5" opacity="0.5"/>
          <polyline className="graph-line" points="25,118 45,102 65,108 85,72 105,78 125,48 145,54 165,32 175,38"
            fill="none" stroke="var(--accent-blue)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          <circle className="graph-dot" cx="85" cy="72" r="3.5" fill="var(--accent-blue)"/>
          <circle className="graph-dot" cx="125" cy="48" r="3.5" fill="var(--accent-blue)" style={{ animationDelay: "0.35s" }}/>
          <circle className="graph-dot" cx="165" cy="32" r="3.5" fill="var(--accent-blue)" style={{ animationDelay: "0.7s" }}/>
          <rect x="38" y="112" width="5" height="14" fill="var(--accent-red)" opacity="0.35"/>
          <rect x="98" y="88" width="5" height="38" fill="var(--accent-red)" opacity="0.35"/>
          <rect x="158" y="55" width="5" height="71" fill="var(--accent-red)" opacity="0.35"/>
        </svg>
      </div>
    );
  }

  if (n.includes("fema") || n.includes("foreign exchange")) {
    return (
      <div className="card-bg">
        <svg viewBox="0 0 200 170" preserveAspectRatio="xMidYMid slice">
          <rect x="0" y="0" width="200" height="170" fill="transparent"/>
          <g className="curr-arrow">
            <path d="M65 52 L88 52 L83 47 M88 52 L83 57" stroke="var(--accent-green)" strokeWidth="2" fill="none" opacity="0.5"/>
            <path d="M112 72 L135 72 L130 67 M135 72 L130 77" stroke="var(--accent-red)" strokeWidth="2" fill="none" opacity="0.5"/>
          </g>
          <g className="curr-1">
            <text x="38" y="58" fontFamily="var(--font)" fontSize="20" fontWeight="600" fill="var(--text-primary)" opacity="0.7">$</text>
            <text x="100" y="58" fontFamily="var(--font)" fontSize="17" fontWeight="600" fill="var(--text-secondary)" opacity="0.7">₹</text>
            <text x="155" y="58" fontFamily="var(--font)" fontSize="17" fontWeight="600" fill="var(--text-tertiary)" opacity="0.7">¥</text>
          </g>
          <g className="curr-2">
            <text x="38" y="58" fontFamily="var(--font)" fontSize="17" fontWeight="600" fill="var(--text-secondary)" opacity="0.7">€</text>
            <text x="100" y="58" fontFamily="var(--font)" fontSize="20" fontWeight="600" fill="var(--text-primary)" opacity="0.7">£</text>
            <text x="155" y="58" fontFamily="var(--font)" fontSize="17" fontWeight="600" fill="var(--text-tertiary)" opacity="0.7">₩</text>
          </g>
          <text x="45" y="98" fontFamily="monospace" fontSize="10" fill="var(--text-quaternary)">1 USD = 83.24 INR</text>
          <text x="45" y="112" fontFamily="monospace" fontSize="10" fill="var(--text-quaternary)">1 INR = 1.78 JPY</text>
        </svg>
      </div>
    );
  }

  if (n.includes("fcra") || n.includes("foreign contribution")) {
    return (
      <div className="card-bg">
        <svg viewBox="0 0 200 170" preserveAspectRatio="xMidYMid slice">
          <rect x="0" y="0" width="200" height="170" fill="transparent"/>
          <defs>
            <clipPath id="globeClip-fcra"><circle cx="100" cy="58" r="30"/></clipPath>
            <g id="world-strip-fcra" fill="var(--accent-green)" stroke="var(--accent-green)" strokeWidth="0.6" opacity="0.42">
              <path d="M10 38 C14 33 22 33 26 37 C29 40 28 45 24 47 C20 49 13 48 10 44 Z"/>
              <path d="M20 52 C24 50 27 52 27 56 C27 62 25 68 22 73 C20 69 19 63 18 58 C18 55 18 53 20 52 Z"/>
              <path d="M52 36 C55 32 61 31 64 33 C66 35 65 38 62 39 C58 41 53 40 52 36 Z"/>
              <path d="M52 44 C57 41 64 41 68 44 C70 46 71 49 70 52 L73 55 C71 60 68 65 66 70 C64 75 63 77 62 79 C60 74 59 68 58 63 C56 60 53 57 53 54 C51 51 51 47 52 44 Z"/>
              <path d="M88 36 C95 31 105 31 111 35 C115 38 116 43 114 47 C112 50 108 51 105 50 L104 53 C103 57 102 60 100 63 C99 59 98 56 97 53 C94 51 92 47 92 44 C90 41 88 38 88 36 Z"/>
              <path d="M114 68 C116 65 122 64 125 67 C127 69 126 73 122 74 C118 75 113 72 114 68 Z"/>
              <circle cx="40" cy="60" r="1.3"/>
              <circle cx="83" cy="72" r="1.3"/>
              <circle cx="128" cy="52" r="1.2"/>
            </g>
          </defs>

          <circle cx="100" cy="58" r="30" fill="var(--accent-blue)" opacity="0.10"/>
          <g clipPath="url(#globeClip-fcra)">
            <g className="globe-scroll">
              <use href="#world-strip-fcra"/>
              <use href="#world-strip-fcra" transform="translate(-130,0)"/>
            </g>
          </g>
          <ellipse cx="100" cy="58" rx="30" ry="11" fill="none" stroke="var(--text-quaternary)" strokeWidth="0.7" opacity="0.28"/>
          <ellipse cx="100" cy="58" rx="12" ry="30" fill="none" stroke="var(--text-quaternary)" strokeWidth="0.7" opacity="0.18"/>
          <circle cx="100" cy="58" r="30" fill="none" stroke="var(--text-secondary)" strokeWidth="1.2" opacity="0.45"/>

          <circle cx="77" cy="42" r="2" fill="var(--accent-blue)" opacity="0.6"/>
          <path className="route-arc" d="M77 42 Q 94 30 112 55" stroke="var(--accent-blue)" fill="none" strokeWidth="1" opacity="0.55"/>
          <circle cx="80" cy="73" r="2" fill="var(--accent-purple)" opacity="0.6"/>
          <path className="route-arc" d="M80 73 Q 94 80 112 59" stroke="var(--accent-purple)" fill="none" strokeWidth="1" opacity="0.55" style={{ animationDelay: "-0.6s" }}/>
          <circle cx="101" cy="32" r="2" fill="var(--accent-green)" opacity="0.6"/>
          <path className="route-arc" d="M101 32 Q 110 40 113 54" stroke="var(--accent-green)" fill="none" strokeWidth="1" opacity="0.55" style={{ animationDelay: "-1.2s" }}/>
          <circle cx="122" cy="72" r="2" fill="var(--accent-red)" opacity="0.6"/>
          <path className="route-arc" d="M122 72 Q 121 64 114 59" stroke="var(--accent-red)" fill="none" strokeWidth="1" opacity="0.55" style={{ animationDelay: "-0.3s" }}/>

          <circle className="india-ping" cx="113" cy="57" r="4" fill="none" stroke="var(--accent-orange)" strokeWidth="1.5"/>
          <circle cx="113" cy="57" r="3" fill="var(--accent-orange)" opacity="0.9"/>

          <g className="money-1"><text x="155" y="26" fontSize="15" fill="var(--accent-green)">$</text></g>
          <g className="money-2"><text x="165" y="48" fontSize="13" fill="var(--accent-red)">€</text></g>
          <g className="money-3"><text x="148" y="70" fontSize="14" fill="var(--accent-purple)">£</text></g>
          <line x1="152" y1="29" x2="118" y2="54" stroke="var(--accent-green)" strokeWidth="0.6" strokeDasharray="3,3" opacity="0.3"/>
          <line x1="162" y1="51" x2="119" y2="56" stroke="var(--accent-red)" strokeWidth="0.6" strokeDasharray="3,3" opacity="0.3"/>
          <line x1="145" y1="72" x2="118" y2="60" stroke="var(--accent-purple)" strokeWidth="0.6" strokeDasharray="3,3" opacity="0.3"/>
        </svg>
      </div>
    );
  }

  if (n.includes("ibc") || n.includes("insolvency") || n.includes("bankruptcy")) {
    return (
      <div className="card-bg">
        <svg viewBox="0 0 200 170" preserveAspectRatio="xMidYMid slice">
          <rect x="0" y="0" width="200" height="170" fill="transparent"/>
          <ellipse cx="100" cy="106" rx="46" ry="3.5" fill="var(--text-quaternary)" opacity="0.25"/>
          <rect x="48" y="104" width="104" height="2.5" rx="1.25" fill="var(--text-quaternary)" opacity="0.3"/>
          <g className="block-top">
            <rect x="62" y="43" width="76" height="8" rx="2" fill="var(--text-secondary)" opacity="0.5"/>
            <line x1="80" y1="43" x2="80" y2="33" stroke="var(--text-secondary)" strokeWidth="1.5" opacity="0.5"/>
            <circle cx="80" cy="31.5" r="1.8" fill="var(--accent-red)" opacity="0.6"/>
            <rect x="115" y="36" width="9" height="7" rx="1" fill="var(--text-secondary)" opacity="0.45"/>
          </g>
          <g className="block-mid">
            <rect x="65" y="50" width="70" height="18" rx="1.5" fill="var(--card-bg)" opacity="0.48"/>
            <rect x="73" y="55" width="10" height="9" rx="1" fill="var(--card-bg)" opacity="0.8"/>
            <rect x="95" y="55" width="10" height="9" rx="1" fill="var(--card-bg)" opacity="0.8"/>
            <rect x="117" y="55" width="10" height="9" rx="1" fill="var(--card-bg)" opacity="0.8"/>
          </g>
          <g className="block-bot">
            <rect x="65" y="68" width="70" height="18" rx="1.5" fill="var(--text-secondary)" opacity="0.44"/>
            <rect x="73" y="73" width="10" height="9" rx="1" fill="var(--card-bg)" opacity="0.8"/>
            <rect x="95" y="73" width="10" height="9" rx="1" fill="var(--card-bg)" opacity="0.8"/>
            <rect x="117" y="73" width="10" height="9" rx="1" fill="var(--card-bg)" opacity="0.8"/>
          </g>
          <g className="block-base">
            <rect x="65" y="86" width="70" height="18" rx="1.5" fill="var(--text-secondary)" opacity="0.40"/>
            <rect x="73" y="91" width="10" height="9" rx="1" fill="var(--card-bg)" opacity="0.8"/>
            <rect x="117" y="91" width="10" height="9" rx="1" fill="var(--card-bg)" opacity="0.8"/>
            <rect x="95" y="90" width="10" height="14" rx="1" fill="var(--card-bg)" opacity="0.85"/>
            <path d="M88 88 L92 94 L89 99 L93 104" stroke="var(--accent-red)" strokeWidth="1" fill="none" opacity="0.5"/>
            <path d="M112 87 L108 93 L112 98 L109 104" stroke="var(--accent-red)" strokeWidth="1" fill="none" opacity="0.5"/>
          </g>
          <g className="dust">
            <circle cx="84" cy="102" r="2.5" fill="var(--text-quaternary)" opacity="0.3"/>
            <circle cx="112" cy="106" r="2" fill="var(--text-quaternary)" opacity="0.3"/>
            <circle cx="98" cy="104" r="3" fill="var(--text-quaternary)" opacity="0.2"/>
            <circle cx="70" cy="100" r="1.5" fill="var(--text-quaternary)" opacity="0.25"/>
            <circle cx="128" cy="101" r="1.5" fill="var(--text-quaternary)" opacity="0.25"/>
          </g>
        </svg>
      </div>
    );
  }

  // Fallback / Case Scenarios
  return (
    <div className="card-bg">
      <svg viewBox="0 0 200 170" preserveAspectRatio="xMidYMid slice">
        <rect x="0" y="0" width="200" height="170" fill="transparent"/>
        <rect x="68" y="42" width="56" height="68" rx="3" fill="var(--text-quaternary)" opacity="0.25"/>
        <rect x="71" y="39" width="56" height="68" rx="3" fill="var(--text-tertiary)" opacity="0.2"/>
        <rect x="74" y="36" width="56" height="68" rx="3" fill="var(--card-bg)" stroke="var(--border)" strokeWidth="1"/>
        <line className="doc-line" x1="84" y1="54" x2="120" y2="54" stroke="var(--text-tertiary)" strokeWidth="2.5" strokeLinecap="round"/>
        <line className="doc-line" x1="84" y1="66" x2="116" y2="66" stroke="var(--text-quaternary)" strokeWidth="2.5" strokeLinecap="round" style={{ animationDelay: "0.3s" }}/>
        <line className="doc-line" x1="84" y1="78" x2="120" y2="78" stroke="var(--text-quaternary)" strokeWidth="2.5" strokeLinecap="round" style={{ animationDelay: "0.6s" }}/>
        <line className="doc-line" x1="84" y1="90" x2="110" y2="90" stroke="var(--text-quaternary)" strokeWidth="2.5" strokeLinecap="round" style={{ animationDelay: "0.9s" }}/>
        <path d="M122 98 L126 102 L134 94" stroke="var(--accent-green)" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.7"/>
      </svg>
    </div>
  );
}

function ChapterList() {
  const { courseSlug, setType } = useParams();
  const { user, login, register } = useAuth();

  const [course, setCourse] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [casesList, setCasesList] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(null); // number | 'cases' | null
  const [questionCounts, setQuestionCounts] = useState({});
  const [topicCounts, setTopicCounts] = useState({});
  const [userProgressMap, setUserProgressMap] = useState({});
  const [error, setError] = useState("");

  // Case Scenario Views & State
  const [viewMode, setViewMode] = useState("grid"); // 'grid' | 'case_detail'
  const [activeCaseIndex, setActiveCaseIndex] = useState(0);
  const [caseCurrentQIndex, setCaseCurrentQIndex] = useState(0);
  const [caseCorrectCount, setCaseCorrectCount] = useState(0);
  const [caseAnswers, setCaseAnswers] = useState({}); // { [qIdx]: chosenLetter }
  const [caseTestFinished, setCaseTestFinished] = useState(false);
  const [showFullCaseModal, setShowFullCaseModal] = useState(false);
  const [caseSearch, setCaseSearch] = useState("");
  const [casePage, setCasePage] = useState(1);
  const [showAllCases, setShowAllCases] = useState(false);
  const casesPerPage = 15;

  // Guest Auth Popup State
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authTab, setAuthTab] = useState("login"); // 'login' | 'register'
  const [authUsername, setAuthUsername] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authFavPlace, setAuthFavPlace] = useState("");
  const [authFirstnameYob, setAuthFirstnameYob] = useState("");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  async function loadUserProgress() {
    // Only load progress stats for logged in users
    if (!user) {
      setUserProgressMap({});
      return;
    }

    try {
      const progMap = {};

      const { data: dbAttempts } = await supabase
        .from("user_progress")
        .select("*")
        .eq("user_id", user.id);

      if (dbAttempts) {
        dbAttempts.forEach((att) => {
          if (att.chapter_id) {
            const cid = String(att.chapter_id);
            const prevScore = progMap[cid]?.score || 0;
            progMap[cid] = {
              score: Math.max(prevScore, att.score || 0),
              total: att.total_questions || 0,
              percentage: att.percentage || 0,
            };
          }
        });
      }

      setUserProgressMap(progMap);
    } catch (e) {
      console.warn("Failed to load user progress:", e);
    }
  }

  useEffect(() => {
    async function loadChaptersAndCases() {
      setError("");

      try {
        const loadedCourse = await getCourseBySlug(courseSlug);
        setCourse(loadedCourse);

        const isSpom = (courseSlug || "").toLowerCase().includes("spom") ||
                       (loadedCourse?.course_slug || "").toLowerCase().includes("spom") ||
                       (loadedCourse?.course_name || "").toLowerCase().includes("spom");

        const selectedSet = setType === "chapters" ? null : setType;

        const [loadedSubjects, loadedChapters, loadedCases] = await Promise.all([
          getSubjects(loadedCourse.id, selectedSet),
          getChapters(loadedCourse.id, selectedSet),
          isSpom ? getCasesForCourse(loadedCourse.id).catch(() => []) : Promise.resolve([]),
        ]);

        const validSubjects = loadedSubjects || [];
        const validChapters = loadedChapters || [];
        const validCases = isSpom ? (loadedCases || []) : [];

        setSubjects(validSubjects);
        setChapters(validChapters);
        setCasesList(validCases);

        const chapterIds = validChapters.map((c) => c.id);
        const qCounts = {};
        chapterIds.forEach((id) => { qCounts[id] = 0; });

        const [tCounts] = await Promise.all([
          getTopicCountsForChapters(chapterIds),
          Promise.all(
            chapterIds.map(async (cid) => {
              const { count, error: qError } = await supabase
                .from("questions")
                .select("*", { count: "exact", head: true })
                .eq("chapter_id", cid);
              if (!qError) {
                qCounts[cid] = count || 0;
              }
            })
          ),
        ]);

        setQuestionCounts(qCounts);
        setTopicCounts(tCounts || {});

        await loadUserProgress();
      } catch (loadError) {
        console.error("Chapter loading error:", loadError);
        setError("Chapters and Case Scenarios could not be loaded.");
      }
    }

    loadChaptersAndCases();

    const handleProgressUpdate = () => {
      loadUserProgress();
    };
    window.addEventListener("ca_quiz_progress_updated", handleProgressUpdate);
    return () => {
      window.removeEventListener("ca_quiz_progress_updated", handleProgressUpdate);
    };
  }, [courseSlug, setType, user]);

  if (error) {
    return (
      <div className="proto-wrap">
        <p className="error-message">{error}</p>
        <Link className="start-btn" to="/" style={{ display: "inline-block", marginTop: 16 }}>Back to Home</Link>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="loader-container">
        <Loading text="Loading subjects & chapters…" />
      </div>
    );
  }

  const isSpomCourse = (courseSlug || "").toLowerCase().includes("spom") ||
                       (course?.course_slug || "").toLowerCase().includes("spom") ||
                       (course?.course_name || "").toLowerCase().includes("spom");

  const totalCourseQuestions = Object.values(questionCounts).reduce((sum, c) => sum + c, 0);
  const totalCaseQuestions = isSpomCourse ? casesList.reduce((sum, c) => sum + (c.questions?.length || 0), 0) : 0;

  const selectedSubject = typeof selectedIndex === "number" ? subjects[selectedIndex] : null;
  const isSelectedCases = selectedIndex === "cases";

  const selectedSubjectChapters = selectedSubject
    ? chapters.filter((ch) => String(ch.subject_id) === String(selectedSubject.id))
    : [];

  const getSubjectMetrics = (subId) => {
    if (!user) {
      return { totalQ: 0, answeredQ: 0, progressPct: 0 };
    }

    const subChs = chapters.filter((ch) => String(ch.subject_id) === String(subId));
    const totalQ = subChs.reduce((sum, ch) => sum + (questionCounts[ch.id] || 0), 0);
    
    const answeredQ = subChs.reduce((sum, ch) => {
      const prog = userProgressMap[String(ch.id)];
      return sum + (prog?.score || 0);
    }, 0);

    const progressPct = totalQ > 0 ? Math.min(Math.round((answeredQ / totalQ) * 100), 100) : 0;
    return { totalQ, answeredQ, progressPct };
  };

  const getCaseScenariosMetrics = () => {
    if (!user || !isSpomCourse) {
      return { totalQ: 0, answeredQ: 0, progressPct: 0 };
    }

    const totalQ = totalCaseQuestions;
    const answeredQ = casesList.reduce((sum, c) => {
      const prog = userProgressMap[`case_${c.id}`];
      return sum + (prog?.score || 0);
    }, 0);

    const progressPct = totalQ > 0 ? Math.min(Math.round((answeredQ / totalQ) * 100), 100) : 0;
    return { totalQ, answeredQ, progressPct };
  };

  const caseMetrics = getCaseScenariosMetrics();

  const handleCardClick = (index) => {
    setSelectedIndex((prev) => (prev === index ? null : index));
  };

  const openCaseDetail = (idx) => {
    setActiveCaseIndex(idx);
    setCaseCurrentQIndex(0);
    setCaseCorrectCount(0);
    setCaseAnswers({});
    setCaseTestFinished(false);
    setViewMode("case_detail");
    window.scrollTo(0, 0);
  };

  const handleCaseAnswer = (qIndex, chosenLetter, correctLetter) => {
    if (caseAnswers[qIndex] !== undefined) return;

    const isCorrect = chosenLetter === correctLetter;
    setCaseAnswers((prev) => ({ ...prev, [qIndex]: chosenLetter }));
    if (isCorrect) {
      setCaseCorrectCount((prev) => prev + 1);
    }
  };

  const activeCase = casesList[activeCaseIndex] || casesList[0];
  const activeCaseQuestions = activeCase?.questions || [];
  const currentQ = activeCaseQuestions[caseCurrentQIndex];
  const isLastQuestion = caseCurrentQIndex === activeCaseQuestions.length - 1;

  const handleNextOrSubmit = async () => {
    if (isLastQuestion) {
      // Save test attempt to local storage cache regardless
      const totalQ = activeCaseQuestions.length;
      const finalScore = caseCorrectCount;

      await saveQuizAttempt({
        chapterId: `case_${activeCase?.id || activeCaseIndex}`,
        score: finalScore,
        totalQuestions: totalQ,
      });

      if (!user) {
        // Guest user -> Open Auth Modal to register/login before displaying results
        setShowAuthModal(true);
      } else {
        // Logged-in user -> Reveal results
        setCaseTestFinished(true);
        await loadUserProgress();
      }
    } else {
      setCaseCurrentQIndex((prev) => prev + 1);
    }
  };

  const handleGuestAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError("");
    setAuthLoading(true);

    try {
      if (authTab === "login") {
        await login(authUsername, authPassword, true);
      } else {
        if (!authFavPlace.trim() || !authFirstnameYob.trim()) {
          setAuthError("Please fill in all recovery security questions.");
          setAuthLoading(false);
          return;
        }
        await register(authUsername, authPassword, authFavPlace, authFirstnameYob);
      }

      setShowAuthModal(false);
      setCaseTestFinished(true);
      await loadUserProgress();
    } catch (err) {
      console.error("Auth error:", err);
      setAuthError(err.message || "Authentication failed. Please check your credentials.");
    } finally {
      setAuthLoading(false);
    }
  };

  return (
    <div className="proto-body">
      <div className="proto-wrap">
        <Link className="back-link" to={setType === "chapters" ? "/" : `/course/${courseSlug}`} style={{ marginBottom: 12, display: "inline-block" }}>
          ← Back to {course.course_name}
        </Link>

        {viewMode === "grid" ? (
          <>
            <div className="eyebrow">
              {course.course_name} &middot; {setType !== "chapters" ? setType : "PRACTICE"} &middot; {totalCourseQuestions + (isSpomCourse ? totalCaseQuestions : 0)} MCQS
            </div>

            <h1>Select subject &amp; chapter</h1>
            <p className="sub">Tap any subject card to reveal its sub-chapters in a full-width panel below.</p>

            <div className="pills">
              <button type="button" className="pill active">
                All subjects ({subjects.length + (isSpomCourse ? 1 : 0)})
              </button>
            </div>

            {/* 3D Flip Cards Grid */}
            <div className="grid">
              {subjects.map((s, i) => {
                const isSelected = selectedIndex === i;
                const subChs = chapters.filter((ch) => String(ch.subject_id) === String(s.id));
                const chCount = subChs.length;
                const { totalQ, answeredQ, progressPct } = getSubjectMetrics(s.id);
                const icon = getSubjectIcon(s.subject_name);

                return (
                  <div
                    key={s.id}
                    className={`card-outer ${isSelected ? "selected" : ""}`}
                    onClick={() => handleCardClick(i)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleCardClick(i);
                      }
                    }}
                  >
                    <div className="card-inner">
                      {/* Card Front */}
                      <div className="card-face card-front">
                        <SubjectBgSvg name={s.subject_name} />
                        <span className="icon" style={{ zIndex: 2, position: "relative" }}>{icon}</span>
                        <div className="card-content-wrap">
                          <div className="subj-name" title={s.subject_name}>{s.subject_name}</div>
                          <div className="subj-meta">
                            {chCount} {chCount === 1 ? "chapter" : "chapters"} {user ? `· ${progressPct}%` : ""}
                          </div>
                          {user && (
                            <div className="subject-progress-track">
                              <div className="subject-progress-fill" style={{ width: `${progressPct}%` }}></div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Card Back */}
                      <div className="card-face card-back">
                        <span className="icon">✓</span>
                        <div>
                          <div className="subj-name">Selected</div>
                          <div className="subj-meta">{user ? `${answeredQ} of ${totalQ} answered` : "Tap to view chapters"}</div>
                          {user && (
                            <div className="subject-progress-track subject-progress-track-back">
                              <div className="subject-progress-fill subject-progress-fill-back" style={{ width: `${progressPct}%` }}></div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Case Scenarios Card (SPOM Courses Only) */}
              {isSpomCourse && (
                <div
                  className={`card-outer ${isSelectedCases ? "selected" : ""}`}
                  onClick={() => handleCardClick("cases")}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleCardClick("cases");
                    }
                  }}
                >
                  <div className="card-inner">
                    {/* Card Front */}
                    <div className="card-face card-front">
                      <SubjectBgSvg name="case scenarios" />
                      <span className="icon" style={{ zIndex: 2, position: "relative" }}>📄</span>
                      <div className="card-content-wrap">
                        <div className="subj-name" title="Case scenarios">Case scenarios</div>
                        <div className="subj-meta">
                          {casesList.length} {casesList.length === 1 ? "case" : "cases"} {user ? `· ${caseMetrics.progressPct}%` : ""}
                        </div>
                        {user && (
                          <div className="subject-progress-track">
                            <div className="subject-progress-fill" style={{ width: `${caseMetrics.progressPct}%` }}></div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Card Back */}
                    <div className="card-face card-back">
                      <span className="icon">✓</span>
                      <div>
                        <div className="subj-name">Selected</div>
                        <div className="subj-meta">{user ? `${caseMetrics.answeredQ} of ${caseMetrics.totalQ} answered` : "Tap to view cases"}</div>
                        {user && (
                          <div className="subject-progress-track subject-progress-track-back">
                            <div className="subject-progress-fill subject-progress-fill-back" style={{ width: `${caseMetrics.progressPct}%` }}></div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Clean Full-Width Container Panel Directly Below Grid */}
            <div className={`panel ${selectedIndex !== null ? "open" : ""}`}>
              {isSelectedCases ? (
                <div className="subchapters-container-panel">
                  <div className="panel-header" style={{ flexWrap: "wrap", gap: 12 }}>
                    <div>
                      <h3 className="panel-subject-title">Case Scenarios</h3>
                      <p style={{ margin: "4px 0 0", fontSize: 13, color: "#6b7268" }}>
                        All 65 ICAI SPOM Case Scenarios with questions &amp; full schedules.
                      </p>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                      <span className="panel-subject-badge">{casesList.length} cases total</span>
                      <button
                        type="button"
                        className="pill"
                        onClick={() => setShowAllCases(!showAllCases)}
                        style={{ fontSize: 12, padding: "4px 12px" }}
                      >
                        {showAllCases ? "Show Paginated" : "Show All 65 Cases"}
                      </button>
                    </div>
                  </div>

                  {/* Search Bar */}
                  <div style={{ margin: "10px 0 16px" }}>
                    <input
                      type="text"
                      placeholder="🔍 Search among all 65 case scenarios by title, number, or topic..."
                      value={caseSearch}
                      onChange={(e) => {
                        setCaseSearch(e.target.value);
                        setCasePage(1);
                      }}
                      style={{
                        width: "100%",
                        padding: "10px 14px",
                        borderRadius: 8,
                        border: "1px solid #e0e2dc",
                        fontSize: 14,
                        fontFamily: "Inter, sans-serif",
                      }}
                    />
                  </div>

                  {(() => {
                    const filteredCases = casesList.filter((c, originalIdx) => {
                      if (!caseSearch.trim()) return true;
                      const q = caseSearch.toLowerCase();
                      const num = originalIdx + 1;
                      return (
                        (c.title || "").toLowerCase().includes(q) ||
                        (c.tag || "").toLowerCase().includes(q) ||
                        (c.topic || "").toLowerCase().includes(q) ||
                        `case ${num}`.includes(q) ||
                        `case scenario ${num}`.includes(q)
                      );
                    });

                    if (filteredCases.length === 0) {
                      return (
                        <div className="subchapter-empty-state">
                          <p>No case scenarios found matching &quot;{caseSearch}&quot;.</p>
                        </div>
                      );
                    }

                    const totalPages = Math.ceil(filteredCases.length / casesPerPage);
                    const currentPage = Math.min(casePage, totalPages);
                    const startIndex = (currentPage - 1) * casesPerPage;
                    const displayedCases = showAllCases || caseSearch.trim()
                      ? filteredCases
                      : filteredCases.slice(startIndex, startIndex + casesPerPage);

                    return (
                      <>
                        <div className="subchapter-rows-list">
                          {displayedCases.map((c) => {
                            // Find original index in casesList
                            const originalIdx = casesList.findIndex((item) => item.id === c.id);
                            const caseNum = originalIdx >= 0 ? originalIdx + 1 : 1;
                            const caseProg = userProgressMap[`case_${c.id}`];
                            const qLength = c.questions && c.questions.length > 0 ? c.questions.length : 5;
                            let countLabel = `Topic: ${c.topic || "General"} · ${qLength} questions`;
                            if (user && caseProg && caseProg.score > 0) {
                              countLabel = `${caseProg.score} of ${c.questions?.length || caseProg.total || 5} answered (${caseProg.percentage}%)`;
                            }

                            return (
                              <div className="subchapter-row" key={c.id || originalIdx}>
                                <div className="subchapter-row-info">
                                  <h4 className="subchapter-row-title">
                                    <span style={{ color: "#A8762C", fontWeight: 700, marginRight: 8, fontFamily: "'IBM Plex Mono', monospace" }}>
                                      Case {caseNum}:
                                    </span>
                                    {c.title}
                                  </h4>
                                  <p className="subchapter-row-meta">{countLabel}</p>
                                </div>
                                <button
                                  type="button"
                                  className="subchapter-start-btn"
                                  onClick={() => openCaseDetail(originalIdx)}
                                >
                                  Start test &rarr;
                                </button>
                              </div>
                            );
                          })}
                        </div>

                        {/* Pagination Bar */}
                        {!showAllCases && !caseSearch.trim() && totalPages > 1 && (
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 20, paddingTop: 16, borderTop: "1px solid #f1f5f9" }}>
                            <span style={{ fontSize: 13, color: "#6b7268", fontFamily: "'IBM Plex Mono', monospace" }}>
                              Showing {startIndex + 1}–{Math.min(startIndex + casesPerPage, filteredCases.length)} of {filteredCases.length} cases
                            </span>
                            <div style={{ display: "flex", gap: 8 }}>
                              <button
                                type="button"
                                className="pill"
                                disabled={currentPage === 1}
                                onClick={() => setCasePage((prev) => Math.max(1, prev - 1))}
                                style={{ opacity: currentPage === 1 ? 0.5 : 1, cursor: currentPage === 1 ? "default" : "pointer" }}
                              >
                                &larr; Previous
                              </button>
                              <span style={{ padding: "6px 10px", fontSize: 13, fontWeight: 600, color: "#0f3d33" }}>
                                Page {currentPage} of {totalPages}
                              </span>
                              <button
                                type="button"
                                className="pill"
                                disabled={currentPage === totalPages}
                                onClick={() => setCasePage((prev) => Math.min(totalPages, prev + 1))}
                                style={{ opacity: currentPage === totalPages ? 0.5 : 1, cursor: currentPage === totalPages ? "default" : "pointer" }}
                              >
                                Next &rarr;
                              </button>
                            </div>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              ) : selectedSubject ? (
                <div className="subchapters-container-panel">
                  <div className="panel-header">
                    <h3 className="panel-subject-title">{selectedSubject.subject_name}</h3>
                    <span className="panel-subject-badge">{selectedSubjectChapters.length} sub-chapters</span>
                  </div>
                  {selectedSubjectChapters.length === 0 ? (
                    <div className="subchapter-empty-state">
                      <p>No sub-chapters available under <strong>{selectedSubject.subject_name}</strong> yet.</p>
                    </div>
                  ) : (
                    <div className="subchapter-rows-list">
                      {selectedSubjectChapters.map((c) => {
                        const qCount = questionCounts[c.id] ?? 0;
                        const tCount = topicCounts[c.id] ?? 0;
                        const prog = userProgressMap[String(c.id)];

                        let countLabel;
                        if (user && prog && prog.score > 0) {
                          countLabel = `${prog.score} of ${qCount || prog.total} answered (${prog.percentage}%)`;
                        } else if (tCount > 0 && qCount > 0) {
                          countLabel = `${tCount} ${tCount === 1 ? "topic" : "topics"} · ${qCount} questions`;
                        } else if (qCount > 0) {
                          countLabel = `${qCount} questions`;
                        } else {
                          countLabel = `1 topic · ${qCount} questions`;
                        }

                        return (
                          <div className="subchapter-row" key={c.id}>
                            <div className="subchapter-row-info">
                              <h4 className="subchapter-row-title">{c.chapter_name.trim()}</h4>
                              <p className="subchapter-row-meta">{countLabel}</p>
                            </div>
                            <Link className="subchapter-start-btn" to={`/quiz/${c.id}`}>
                              Start test &rarr;
                            </Link>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </>
        ) : (
          /* Case Scenario Detail View */
          <div id="detailView" style={{ display: "block" }}>
            <button type="button" className="back-link" onClick={() => setViewMode("grid")} style={{ border: "none", background: "transparent", padding: 0 }}>
              ← Back to case scenarios
            </button>

            {activeCase ? (
              <>
                <div className="case-file">
                  <div className="case-meta">
                    <span className="case-tag">{activeCase.tag || "CASE SCENARIO"}</span>
                  </div>
                  <h2 className="case-title">{activeCase.title}</h2>
                  <div className="case-body collapsed">
                    {activeCase.paragraphs?.slice(0, 2).map((p, idx) => (
                      <p key={idx}>{p}</p>
                    ))}
                  </div>
                  <div className="case-actions">
                    <button type="button" className="btn-view-case" onClick={() => setShowFullCaseModal(true)}>
                      View full case
                    </button>
                    <span className="case-note">
                      {activeCaseQuestions.length} questions based on this case
                    </span>
                  </div>
                </div>

                <div className="section-label">
                  <span>Related questions</span>
                </div>

                {/* Test Completed Summary & Percentage Calculation */}
                {caseTestFinished ? (
                  <div className="case-complete-card">
                    <div className="complete-badge">🎉 CASE COMPLETE</div>
                    <h3>Case Scenario Submitted Successfully</h3>
                    <div className="score-percentage-block">
                      <span className="score-number">{caseCorrectCount} / {activeCaseQuestions.length} Correct</span>
                      <span className="score-percentage">
                        {Math.round((caseCorrectCount / Math.max(activeCaseQuestions.length, 1)) * 100)}% Score
                      </span>
                    </div>
                    <p className="score-status-msg">
                      {Math.round((caseCorrectCount / Math.max(activeCaseQuestions.length, 1)) * 100) >= 60
                        ? "Great performance! You passed this case scenario practice."
                        : "Keep practicing to strengthen your concept mastery."}
                    </p>
                    <div className="complete-actions">
                      <button
                        type="button"
                        className="start-btn"
                        onClick={() => openCaseDetail(activeCaseIndex)}
                      >
                        Retake Case Scenario
                      </button>
                      <button
                        type="button"
                        className="btn-view-case"
                        onClick={() => setViewMode("grid")}
                      >
                        Back to Case Scenarios
                      </button>
                    </div>
                  </div>
                ) : currentQ ? (
                  <div className="question-card">
                    {/* Question Progress Dots */}
                    <div className="q-progress">
                      {activeCaseQuestions.map((_, i) => {
                        let cls = "q-dot";
                        if (i < caseCurrentQIndex) cls += " done";
                        if (i === caseCurrentQIndex) cls += " active";
                        return <span key={i} className={cls}></span>;
                      })}
                      <span className="q-progress-label">
                        Question {caseCurrentQIndex + 1} of {activeCaseQuestions.length}
                      </span>
                    </div>

                    <div className="q-head">
                      <span className="q-number">Q{caseCurrentQIndex + 1}.</span>
                      <span className="q-text">{currentQ.text}</span>
                    </div>

                    {/* Options List */}
                    <div className="options">
                      {currentQ.options?.map((o) => {
                        const chosen = caseAnswers[caseCurrentQIndex];
                        const isAnswered = chosen !== undefined;
                        const isCorrect = o.letter === currentQ.correctLetter;
                        const isChosen = o.letter === chosen;

                        let optCls = "option";
                        if (isAnswered) {
                          if (isCorrect) optCls += " correct";
                          if (isChosen && !isCorrect) optCls += " incorrect";
                        }

                        return (
                          <button
                            key={o.letter}
                            type="button"
                            className={optCls}
                            disabled={isAnswered}
                            onClick={() => handleCaseAnswer(caseCurrentQIndex, o.letter, currentQ.correctLetter)}
                          >
                            <span className="opt-letter">{o.letter}</span>
                            <span>{o.text}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Result Tag & Explanation */}
                    {caseAnswers[caseCurrentQIndex] !== undefined && (
                      <>
                        <div className={`result-tag show ${caseAnswers[caseCurrentQIndex] === currentQ.correctLetter ? "correct-tag" : "incorrect-tag"}`}>
                          {caseAnswers[caseCurrentQIndex] === currentQ.correctLetter
                            ? "✓ Correct"
                            : `✕ Incorrect — Correct answer is ${currentQ.correctLetter}`}
                        </div>

                        {currentQ.explanation && (
                          <div className="explanation show">
                            <strong>Explanation:</strong> {currentQ.explanation}
                          </div>
                        )}

                        {/* Next / Submit Button */}
                        <div style={{ marginTop: 18, marginLeft: 29 }}>
                          <button
                            type="button"
                            className="btn-next show"
                            onClick={handleNextOrSubmit}
                          >
                            <span>{isLastQuestion ? "Submit Test & View Results" : "Next Question →"}</span>
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ) : null}
              </>
            ) : (
              <div className="subchapter-empty-state" style={{ background: "#fff", borderRadius: 14, padding: 32 }}>
                <p>No case scenarios published yet.</p>
              </div>
            )}
          </div>
        )}

        {/* Guest Auth Modal Popup */}
        {showAuthModal && (
          <div className="modal-overlay open" onClick={() => setShowAuthModal(false)}>
            <div className="modal-doc" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 440 }}>
              <div className="modal-head">
                <span className="lbl">🔒 UNLOCK RESULTS</span>
                <button
                  type="button"
                  className="modal-close"
                  onClick={() => setShowAuthModal(false)}
                >
                  &times;
                </button>
              </div>
              <div className="modal-body" style={{ padding: "24px 28px" }}>
                <h3 style={{ fontSize: 20, marginBottom: 8 }}>Unlock Performance Results</h3>
                <p style={{ fontSize: 14, color: "#6b7268", marginTop: 0, marginBottom: 20, lineHeight: 1.5 }}>
                  Your test answers have been saved! Please log in or create a free account to view your score percentage, detailed accuracy breakdown, and progress history.
                </p>

                <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
                  <button
                    type="button"
                    className={`pill ${authTab === "login" ? "active" : ""}`}
                    onClick={() => { setAuthTab("login"); setAuthError(""); }}
                    style={{ flex: 1 }}
                  >
                    Log In
                  </button>
                  <button
                    type="button"
                    className={`pill ${authTab === "register" ? "active" : ""}`}
                    onClick={() => { setAuthTab("register"); setAuthError(""); }}
                    style={{ flex: 1 }}
                  >
                    Register
                  </button>
                </div>

                {authError && (
                  <p style={{ color: "#A83A3A", fontSize: 13, margin: "0 0 16px", background: "#F7EAEA", padding: "8px 12px", borderRadius: 8 }}>
                    {authError}
                  </p>
                )}

                <form onSubmit={handleGuestAuthSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <div>
                    <label style={{ fontSize: 12.5, fontWeight: 600, color: "#1a1f1c", display: "block", marginBottom: 4 }}>
                      Username
                    </label>
                    <input
                      type="text"
                      required
                      value={authUsername}
                      onChange={(e) => setAuthUsername(e.target.value)}
                      placeholder="e.g. rahul123"
                      style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #e0e2dc", fontSize: 14 }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: 12.5, fontWeight: 600, color: "#1a1f1c", display: "block", marginBottom: 4 }}>
                      Password
                    </label>
                    <input
                      type="password"
                      required
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      placeholder="••••••••"
                      style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #e0e2dc", fontSize: 14 }}
                    />
                  </div>

                  {authTab === "register" && (
                    <>
                      <div>
                        <label style={{ fontSize: 12.5, fontWeight: 600, color: "#1a1f1c", display: "block", marginBottom: 4 }}>
                          Favourite Place (Recovery Q1)
                        </label>
                        <input
                          type="text"
                          required
                          value={authFavPlace}
                          onChange={(e) => setAuthFavPlace(e.target.value)}
                          placeholder="e.g. Mumbai"
                          style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #e0e2dc", fontSize: 14 }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: 12.5, fontWeight: 600, color: "#1a1f1c", display: "block", marginBottom: 4 }}>
                          First Name + Birth Year (Recovery Q2)
                        </label>
                        <input
                          type="text"
                          required
                          value={authFirstnameYob}
                          onChange={(e) => setAuthFirstnameYob(e.target.value)}
                          placeholder="e.g. Rahul1998"
                          style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #e0e2dc", fontSize: 14 }}
                        />
                      </div>
                    </>
                  )}

                  <button
                    type="submit"
                    className="start-btn"
                    disabled={authLoading}
                    style={{ marginTop: 8, width: "100%", textAlign: "center", justifyContent: "center" }}
                  >
                    {authLoading ? "Processing…" : authTab === "login" ? "Log In & View Score" : "Register & View Score"}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Modal Document Overlay for Full Case Reading */}
        {showFullCaseModal && activeCase && (
          <div className="modal-overlay open" onClick={() => setShowFullCaseModal(false)} style={{ alignItems: "center" }}>
            <div
              className="modal-doc"
              onClick={(e) => e.stopPropagation()}
              style={{
                maxWidth: 960,
                width: "94vw",
                maxHeight: "90vh",
                display: "flex",
                flexDirection: "column",
                borderRadius: 16,
                overflow: "hidden",
              }}
            >
              <div className="modal-head" style={{ padding: "20px 32px", background: "#173b2a" }}>
                <span className="lbl" style={{ color: "#f0d38a", fontSize: 13, letterSpacing: "1.2px", fontWeight: 600 }}>
                  {activeCase.tag || "CASE FILE"}
                </span>
                <button
                  type="button"
                  className="modal-close"
                  onClick={() => setShowFullCaseModal(false)}
                  aria-label="Close"
                  style={{ width: 36, height: 36, fontSize: 20 }}
                >
                  &times;
                </button>
              </div>
              <div className="modal-body" style={{ maxHeight: "calc(90vh - 76px)", overflowY: "auto", padding: "32px 36px 36px" }}>
                <h3 style={{ fontSize: 24, fontWeight: 700, marginTop: 0, marginBottom: 22, borderBottom: "1px solid #eef1ea", paddingBottom: 14 }}>
                  {activeCase.title}
                </h3>
                {activeCase.paragraphs?.map((p, idx) => (
                  <p key={idx} style={{ fontSize: 16, lineHeight: 1.8, marginBottom: 18, color: "#1c2b20" }}>
                    {p}
                  </p>
                ))}
                <CaseTableRenderer tableData={activeCase.case_table} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ChapterList;