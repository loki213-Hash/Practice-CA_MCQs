import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../supabase/supabase";
import { sendAppreciationNotification, broadcastNotification, deleteNotification } from "../services/notificationService";
import { fetchAnalyticsMetrics, setupRealtimePresence } from "../services/analyticsService";
import { generate7CharRecoveryCode } from "../utils/recoveryCodeGenerator";
import SpaceBackground from "../components/SpaceBackground";
import CosmicSpotlightCard from "../components/CosmicSpotlightCard";

export default function Admin() {
  const { logout, username, user } = useAuth();

  const [activeTab, setActiveTab] = useState("dashboard"); // 'dashboard' | 'flags' | 'submissions' | 'import'
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Schema state alerts
  const [isFlagsTableMissing, setIsFlagsTableMissing] = useState(false);
  const [isAnalyticsTableMissing, setIsAnalyticsTableMissing] = useState(false);

  // Chapters and courses list from database
  const [dbChapters, setDbChapters] = useState([]);
  const [dbCourses, setDbCourses] = useState([]);

  // Stats / KPI states (Precise real-time counts)
  const [kpis, setKpis] = useState({
    totalUsersCount: 0,
    questionsCount: 0,
    flagsCount: 0,
  });

  // Real-Time Live Presence & 24h Analytics State
  const [analytics, setAnalytics] = useState({
    liveTotalCount: 1,
    liveLoggedInCount: 1,
    liveGuestCount: 0,
    activeVisitors: [],
    uniqueVisitors24h: 0,
    distinctLoggedIn24h: 0,
    allTimeUniqueVisitors: 0,
    peakLoggedIn24h: 0,
    peakTotal24h: 0,
    totalSessions24h: 0,
    desktopCount24h: 0,
    mobileCount24h: 0,
  });
  const [liveRosterFilter, setLiveRosterFilter] = useState("all"); // 'all' | 'students' | 'guests'

  const [flaggedItems, setFlaggedItems] = useState([]);
  const [flagsLoading, setFlagsLoading] = useState(false);
  const [flagSearch, setFlagSearch] = useState("");

  // Recovery phrase student registration list state
  const [registeredUsers, setRegisteredUsers] = useState([]);
  const [recoverySearch, setRecoverySearch] = useState("");
  const [isUsersLoading, setIsUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState(null);

  // Bulk Importer states
  const [chapterId, setChapterId] = useState("1");
  const [bulkText, setBulkText] = useState("");
  const [parsedQuestions, setParsedQuestions] = useState([]);
  const [importing, setImporting] = useState(false);

  // Appreciation states
  const [sentAppreciations, setSentAppreciations] = useState({});

  // Real student feedbacks from Supabase
  const [feedbacks, setFeedbacks] = useState([]);

  // Real Google Form suggested questions list from Supabase
  const [formSubmissions, setFormSubmissions] = useState([]);
  const [activeFeedbackDetails, setActiveFeedbackDetails] = useState(null);
  const [subSearch, setSubSearch] = useState("");

  // Broadcast updates state
  const [broadcastTitle, setBroadcastTitle] = useState("");
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [broadcastTarget, setBroadcastTarget] = useState("all");
  const [broadcastSending, setBroadcastSending] = useState(false);
  const [sentBroadcasts, setSentBroadcasts] = useState([]);

  const isAdmin = Boolean(
    user && (
      user.email === "admin.caquiz@gmail.com" ||
      user.app_metadata?.role === "admin" ||
      user.user_metadata?.is_admin === true ||
      username === "admin"
    ) && user.email === "admin.caquiz@gmail.com"
  );

  // Helper: Read flagged question local cache
  const getLocalFlags = () => {
    try {
      const data = localStorage.getItem("ca_quiz_local_flags");
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  };

  // Real-Time Live Presence Monitor (0s Latency Supabase Presence)
  useEffect(() => {
    if (!isAdmin) return;

    const presenceTracker = setupRealtimePresence({
      user: { id: "admin-session" },
      username: username || "Admin",
      pagePath: "/admin",
      onPresenceChange: ({ liveTotalCount, liveLoggedInCount, liveGuestCount, activeVisitors }) => {
        setAnalytics((prev) => ({
          ...prev,
          liveTotalCount: Math.max(1, liveTotalCount),
          liveLoggedInCount: Math.max(1, liveLoggedInCount),
          liveGuestCount,
          activeVisitors,
          peakLoggedIn24h: Math.max(prev.peakLoggedIn24h, liveLoggedInCount),
          peakTotal24h: Math.max(prev.peakTotal24h, liveTotalCount),
        }));
      },
    });

    return () => {
      if (presenceTracker?.unsubscribe) {
        presenceTracker.unsubscribe();
      }
    };
  }, [isAdmin, username]);

  const handleManualRefresh = () => {
    setError(null);
    setSuccess(null);
    loadChapters();
    loadKpisAndStats();
    loadFlags();
    loadRegisteredUsers();
    loadFeedbacks();
    loadFormSubmissions();
    setSuccess("Database statistics refreshed successfully!");
  };

  const loadChapters = async () => {
    try {
      // 1. Fetch courses to create mapping
      const { data: courseData } = await supabase
        .from("courses")
        .select("id, course_name, course_slug");
      
      const courseMap = {};
      if (courseData) {
        setDbCourses(courseData);
        courseData.forEach((c) => {
          courseMap[c.id] = c.course_name;
        });
      }

      // 2. Fetch chapters
      const { data: chapterData, error } = await supabase
        .from("chapters")
        .select("id, chapter_name, course_id")
        .order("id");

      if (!error && chapterData) {
        const mapped = chapterData.map((chap) => ({
          ...chap,
          course_name: courseMap[chap.course_id] || "Unknown Course"
        }));
        setDbChapters(mapped);
        if (mapped.length > 0) {
          setChapterId(String(mapped[0].id));
        }
      }
    } catch (err) {
      console.warn("Failed to load chapters:", err);
    }
  };

  const loadKpisAndStats = async () => {
    try {
      // 1. Fetch exactly how many students are registered in the registered_users table (excluding admin)
      let exactRegisteredStudents = 0;
      try {
        const { count, error: countErr } = await supabase
          .from("registered_users")
          .select("*", { count: "exact", head: true });
        
        if (!countErr) {
          exactRegisteredStudents = count || 0;
        } else {
          // Fallback to reading unique user progress attempts
          const { data: progressRows } = await supabase
            .from("user_progress")
            .select("user_id");
          const uniqueUserIds = Array.from(new Set(progressRows?.map((r) => r.user_id) || []));
          const { data: { user: curUser } } = await supabase.auth.getUser();
          const adminId = curUser?.id;
          const studentUserIds = uniqueUserIds.filter((id) => id !== adminId);
          exactRegisteredStudents = studentUserIds.length;
        }
      } catch {
        exactRegisteredStudents = 0;
      }

      // 2. Fetch total questions count
      const { count: qCount } = await supabase
        .from("questions")
        .select("*", { count: "exact", head: true });

      // 3. Fetch flagged reports count (failsafe check)
      let flaggedCount = 0;
      try {
        const { count: fCount, error: fError } = await supabase
          .from("question_flags")
          .select("*", { count: "exact", head: true });
        
        if (!fError) {
          flaggedCount = fCount || 0;
          setIsFlagsTableMissing(false);
        } else {
          flaggedCount = getLocalFlags().length;
          setIsFlagsTableMissing(true);
        }
      } catch {
        flaggedCount = getLocalFlags().length;
        setIsFlagsTableMissing(true);
      }

      setKpis((prev) => ({
        ...prev,
        totalUsersCount: exactRegisteredStudents,
        questionsCount: qCount || 0,
        flagsCount: flaggedCount,
      }));

      // 4. Fetch 24-hour and cumulative traffic analytics from database
      const analyticsData = await fetchAnalyticsMetrics();
      setIsAnalyticsTableMissing(Boolean(analyticsData.isTableMissing));
      setAnalytics((prev) => ({
        ...prev,
        uniqueVisitors24h: Math.max(analyticsData.uniqueVisitors24h, prev.liveTotalCount),
        distinctLoggedIn24h: Math.max(analyticsData.distinctLoggedIn24h, prev.liveLoggedInCount),
        allTimeUniqueVisitors: Math.max(analyticsData.allTimeUniqueVisitors, analyticsData.uniqueVisitors24h, prev.liveTotalCount),
        peakLoggedIn24h: Math.max(analyticsData.peakLoggedIn24h, prev.liveLoggedInCount),
        peakTotal24h: Math.max(analyticsData.peakTotal24h, prev.liveTotalCount),
        totalSessions24h: analyticsData.totalSessions24h,
        desktopCount24h: analyticsData.desktopCount24h,
        mobileCount24h: analyticsData.mobileCount24h,
      }));
    } catch (err) {
      console.warn("Failed to load statistics:", err.message);
    }
  };

  const loadFlags = async () => {
    setFlagsLoading(true);
    setError(null);
    try {
      // 1. Try querying Supabase
      const { data: flags, error: flagsError } = await supabase
        .from("question_flags")
        .select("*");

      if (flagsError) {
        throw flagsError;
      }

      setIsFlagsTableMissing(false);
      await fetchAndMapFlags(flags);
    } catch {
      // Fallback: If table is missing, use local storage flags cache
      console.warn("question_flags database table is missing in Supabase. Reading local cache.");
      setIsFlagsTableMissing(true);
      const localFlags = getLocalFlags();
      await fetchAndMapFlags(localFlags);
    } finally {
      setFlagsLoading(false);
    }
  };

  const fetchAndMapFlags = async (flags) => {
    if (!flags || flags.length === 0) {
      setFlaggedItems([]);
      return;
    }

    try {
      const questionIds = Array.from(new Set(flags.map((f) => f.question_id)));
      const { data: questions, error: qError } = await supabase
        .from("questions")
        .select("*")
        .in("id", questionIds);

      if (qError) throw qError;

      // Fetch user_progress attempts to count unique students
      const { data: progressRows } = await supabase
        .from("user_progress")
        .select("user_id, chapter_id, completed_at");

      // Group flags by question_id
      const flagsCountByQ = {};
      const flaggedByMap = {};
      flags.forEach((f) => {
        flagsCountByQ[f.question_id] = (flagsCountByQ[f.question_id] || 0) + 1;
        if (f.flagged_by) {
          flaggedByMap[f.question_id] = f.flagged_by;
        }
      });

      const fifteenDaysAgo = new Date();
      fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);

      // Map questions and inject attempt stats
      const mapped = questions.map((q) => {
        const flagCount = flagsCountByQ[q.id] || 1;
        
        // Filter attempts for this question's chapter
        const chapterAttempts = progressRows ? progressRows.filter(r => r.chapter_id === q.chapter_id) : [];
        
        // 1. Unique students who appeared for this chapter (question)
        const uniqueAttemptedStudents = Array.from(new Set(chapterAttempts.map(r => r.user_id)));
        const totalUniqueAttempted = uniqueAttemptedStudents.length;

        // 2. Count attempts in the last 15 days
        const attemptsLast15Days = chapterAttempts.filter(r => {
          if (!r.completed_at) return false;
          return new Date(r.completed_at) >= fifteenDaysAgo;
        }).length;

        // 3. Percent of students who flagged = unique flagged / unique appeared
        const percentNotRequired = totalUniqueAttempted > 0
          ? Math.min(100, Math.round((flagCount / totalUniqueAttempted) * 100))
          : 0;

        return {
          ...q,
          flagsCount: flagCount,
          flaggedBy: flaggedByMap[q.id] || "student",
          attemptsLast15Days,
          percentNotRequired
        };
      }).sort((a, b) => b.flagsCount - a.flagsCount);

      setFlaggedItems(mapped);
    } catch (err) {
      console.error("Mapping flags failed:", err);
    }
  };

  const loadRegisteredUsers = async () => {
    setIsUsersLoading(true);
    setUsersError(null);
    try {
      const { data, error } = await supabase
        .from("registered_users")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) {
        setUsersError(error.message);
        console.warn("Failed to load registered users:", error);
      } else if (data) {
        let updatedList = [...data];
        for (let i = 0; i < updatedList.length; i++) {
          const u = updatedList[i];
          if (!u.recovery_code) {
            const newCode = generate7CharRecoveryCode();
            updatedList[i] = { ...u, recovery_code: newCode };
            
            // Update Supabase database safely
            try {
              await supabase
                .from("registered_users")
                .update({ recovery_code: newCode })
                .eq("id", u.id);
            } catch (updErr) {
              console.warn("Notice updating recovery code for existing user:", updErr);
            }
          }
        }
        setRegisteredUsers(updatedList);
      }
    } catch (err) {
      setUsersError(err.message);
      console.warn("Failed to load registered users:", err);
    } finally {
      setIsUsersLoading(false);
    }
  };

  const handleAssignCodeForUser = async (userObj) => {
    try {
      const newCode = generate7CharRecoveryCode();
      const { error } = await supabase
        .from("registered_users")
        .update({ recovery_code: newCode })
        .eq("id", userObj.id);

      if (error) throw error;

      setSuccess(`Generated 7-character recovery code '${newCode}' for ${userObj.username}!`);
      loadRegisteredUsers();
    } catch (err) {
      console.error(err);
      setError("Failed to generate code: " + err.message);
    }
  };

  const handleGenerateCodesForAllMissingUsers = async () => {
    try {
      let count = 0;
      for (const u of registeredUsers) {
        if (!u.recovery_code) {
          const newCode = generate7CharRecoveryCode();
          await supabase.from("registered_users").update({ recovery_code: newCode }).eq("id", u.id);
          count++;
        }
      }
      setSuccess(`Generated 7-character recovery codes for ${count} existing users!`);
      loadRegisteredUsers();
    } catch (err) {
      setError("Failed to bulk generate codes: " + err.message);
    }
  };

  const loadFeedbacks = async () => {
    try {
      let combinedFeedbacks = [];

      // 1. Try querying student_feedbacks table
      try {
        const { data: data1, error: err1 } = await supabase
          .from("student_feedbacks")
          .select("*")
          .order("created_at", { ascending: false });
        if (!err1 && data1 && data1.length > 0) {
          combinedFeedbacks.push(...data1);
        }
      } catch (e) {
        console.warn("Notice querying student_feedbacks:", e);
      }

      // 2. Try querying student_feedback table
      try {
        const { data: data2, error: err2 } = await supabase
          .from("student_feedback")
          .select("*")
          .order("created_at", { ascending: false });
        if (!err2 && data2 && data2.length > 0) {
          combinedFeedbacks.push(...data2);
        }
      } catch (e) {
        console.warn("Notice querying student_feedback:", e);
      }

      // 3. Fallback & local merge: Always check localStorage cache
      try {
        const local = JSON.parse(localStorage.getItem("ca_quiz_student_feedbacks") || "[]");
        if (local && local.length > 0) {
          combinedFeedbacks.push(...local);
        }
      } catch (e) {
        console.warn("Notice querying local feedbacks:", e);
      }

      // Deduplicate by id or (username + message + created_at)
      const seen = new Set();
      const uniqueList = [];
      for (const item of combinedFeedbacks) {
        const key = item.id || `${item.username}_${item.message}_${item.created_at}`;
        if (!seen.has(key)) {
          seen.add(key);
          uniqueList.push(item);
        }
      }

      // Sort newest first
      uniqueList.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

      const mapped = uniqueList.map((f) => ({
        id: f.id,
        student: f.username || "Guest",
        type: f.category || f.type || "Feedback",
        rating: f.rating || 5,
        comment: f.message,
        date: f.created_at ? new Date(f.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "Recently"
      }));
      setFeedbacks(mapped);
    } catch (err) {
      console.warn("Failed to load student feedbacks:", err);
    }
  };

  const loadFormSubmissions = async () => {
    try {
      const { data, error } = await supabase
        .from("google_form_submissions")
        .select("*")
        .order("created_at", { ascending: false });
      if (!error && data) {
        const mapped = data.map((sub) => ({
          id: sub.id,
          studentEmail: sub.student_email,
          chapterId: String(sub.chapter_id),
          topic: sub.topic,
          question: sub.question,
          option_a: sub.option_a,
          option_b: sub.option_b,
          option_c: sub.option_c,
          option_d: sub.option_d,
          correct_option: sub.correct_option,
          explanation: sub.explanation
        }));
        setFormSubmissions(mapped);
      }
    } catch (err) {
      console.warn("Failed to load Google Form submissions:", err);
    }
  };

  // Load chapters & initial data
  useEffect(() => {
    if (!isAdmin) return;
    loadChapters();
    loadKpisAndStats();
    loadFlags();
    loadRegisteredUsers();
    loadFeedbacks();
    loadFormSubmissions();

    // Poll platform database statistics every 5 minutes (300,000ms) to avoid rate limits
    const pollInterval = setInterval(() => {
      loadKpisAndStats();
      loadFlags();
      loadRegisteredUsers();
      loadFeedbacks();
      loadFormSubmissions();
    }, 300000);

    return () => clearInterval(pollInterval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  useEffect(() => {
    if (activeTab === "recovery") {
      loadRegisteredUsers();
    }
    if (activeTab === "broadcast") {
      loadSentBroadcasts();
    }
  }, [activeTab]);

  // Flag actions
  const handleKeepQuestion = async (questionId) => {
    setError(null);
    setSuccess(null);
    try {
      // 1. Delete from Supabase if table exists
      await supabase
        .from("question_flags")
        .delete()
        .eq("question_id", questionId);

      // 2. Delete from LocalStorage fallback cache
      const local = getLocalFlags().filter((f) => f.question_id !== questionId);
      localStorage.setItem("ca_quiz_local_flags", JSON.stringify(local));

      setSuccess("Flags dismissed. Question kept.");
      setFlaggedItems((prev) => prev.filter((item) => item.id !== questionId));
      loadKpisAndStats();
    } catch (err) {
      console.error(err);
      setError("Failed to dismiss flags.");
    }
  };

  const handleRemoveQuestion = async (questionId) => {
    if (!window.confirm("Are you sure you want to permanently delete this question from the database? This cannot be undone.")) return;
    setError(null);
    setSuccess(null);
    try {
      // 0. Auto-notify the reporting student (Message 2) before deleting
      const item = flaggedItems.find((i) => i.id === questionId);
      const flaggedBy = item?.flaggedBy;
      if (flaggedBy && flaggedBy !== "student") {
        try {
          const cleanUsername = flaggedBy.includes("@") ? flaggedBy.split("@")[0] : flaggedBy;
          await sendAppreciationNotification(
            cleanUsername,
            "Thanks! We're happy to let you know that the question you flagged was also reported by a few other students. After reviewing it, we've removed it from the quiz."
          );
        } catch (notifErr) {
          console.warn("Could not notify student of removal:", notifErr);
        }
      }

      // 1. Delete flags
      await supabase
        .from("question_flags")
        .delete()
        .eq("question_id", questionId);

      const local = getLocalFlags().filter((f) => f.question_id !== questionId);
      localStorage.setItem("ca_quiz_local_flags", JSON.stringify(local));

      // 2. Delete question
      const { error: qError } = await supabase
        .from("questions")
        .delete()
        .eq("id", questionId);

      if (qError) throw qError;

      setSuccess("Question deleted successfully and student notified.");
      setFlaggedItems((prev) => prev.filter((item) => item.id !== questionId));
      loadKpisAndStats();
    } catch (err) {
      console.error(err);
      setError("Failed to delete question.");
    }
  };

  // Resolution
  const handleResolveFeedback = async (id) => {
    try {
      await supabase
        .from("student_feedbacks")
        .delete()
        .eq("id", id);
    } catch (err) {
      console.warn("Failed to delete feedback row:", err);
    }
    setFeedbacks((prev) => prev.filter((f) => f.id !== id));
    setSuccess("Feedback resolved.");
  };

  const handleDismissSubmission = async (id) => {
    setError(null);
    setSuccess(null);
    try {
      const { error: delError } = await supabase
        .from("google_form_submissions")
        .delete()
        .eq("id", id);
      
      if (delError) throw delError;

      setFormSubmissions((prev) => prev.filter((s) => s.id !== id));
      setSuccess("Google Form suggestion dismissed and removed from database.");
    } catch (err) {
      console.error(err);
      setError("Failed to dismiss suggestion from database.");
    }
  };

  // Send Appreciation Notification (Strict preset message only)
  const handleSendAppreciation = async (id, targetUser) => {
    setError(null);
    setSuccess(null);
    const cleanUsername = targetUser.includes("@") ? targetUser.split("@")[0] : targetUser;
    
    try {
      const sent = await sendAppreciationNotification(
        cleanUsername,
        "Thanks for flagging the question. We'll review it, and if a few other students also report the same issue, we'll remove or correct it."
      );
      if (sent) {
        setSentAppreciations((prev) => ({ ...prev, [id]: true }));
        setSuccess(`Appreciation sent to student "${cleanUsername}".`);
      } else {
        setError("Could not deliver message.");
      }
    } catch {
      setError("Failed to send message.");
    }
  };

  const loadSentBroadcasts = async () => {
    try {
      const { data, error } = await supabase
        .from("user_notifications")
        .select("*")
        .order("created_at", { ascending: false });
      if (!error && data) {
        setSentBroadcasts(data);
      }
    } catch (e) {
      console.warn("Notice loading sent broadcasts:", e);
    }
  };

  // Send Broadcast Update
  const handleSendBroadcast = async (e) => {
    e.preventDefault();
    if (!broadcastMessage.trim()) {
      setError("Please enter a message to broadcast.");
      return;
    }
    setBroadcastSending(true);
    setError(null);
    try {
      await broadcastNotification({
        title: broadcastTitle.trim(),
        message: broadcastMessage.trim(),
        target: broadcastTarget
      });
      setSuccess(`Broadcast update successfully dispatched to ${broadcastTarget === "all" ? "all registered & guest students" : broadcastTarget}!`);
      setBroadcastTitle("");
      setBroadcastMessage("");
      await loadSentBroadcasts();
    } catch (err) {
      setError("Failed to broadcast message: " + err.message);
    } finally {
      setBroadcastSending(false);
    }
  };

  const handleDeleteBroadcast = async (id) => {
    if (!window.confirm("Are you sure you want to permanently delete this broadcast announcement?")) return;
    try {
      await deleteNotification(id);
      setSentBroadcasts((prev) => prev.filter((b) => b.id !== id));
      setSuccess("Broadcast announcement deleted successfully.");
    } catch (err) {
      setError("Failed to delete broadcast: " + err.message);
    }
  };

  // Importer Actions
  const handleReviewSubmission = (sub) => {
    const header = "question\toption_a\toption_b\toption_c\toption_d\tcorrect_option\texplanation\ttopic";
    const dataRow = `${sub.question}\t${sub.option_a}\t${sub.option_b}\t${sub.option_c}\t${sub.option_d}\t${sub.correct_option}\t${sub.explanation}\t${sub.topic}`;
    
    setBulkText(`${header}\n${dataRow}`);
    setChapterId(sub.chapterId);
    setActiveTab("import");
    setSuccess(`Question suggested by ${sub.studentEmail} loaded in Bulk Importer!`);
  };

  const handleParseInput = () => {
    setError(null);
    setSuccess(null);
    if (!bulkText.trim()) {
      setError("Please paste some question data first.");
      return;
    }

    const lines = bulkText.split(/\r?\n/).filter((line) => line.trim());
    if (lines.length < 2) {
      setError("Must include a header row and at least one data row.");
      return;
    }

    const header = lines[0];
    const separator = header.includes("\t") ? "\t" : ",";
    const headers = header.split(separator).map((h) => h.trim().toLowerCase().replace(/["']/g, ""));

    const parsed = [];
    let skipped = 0;

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      let cols = [];
      if (separator === "\t") {
        cols = line.split("\t");
      } else {
        cols = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || line.split(",");
      }

      cols = cols.map((c) => c ? c.trim().replace(/^["']|["']$/g, "") : "");

      const row = {};
      headers.forEach((h, index) => {
        row[h] = cols[index] || "";
      });

      const normalizedRow = {
        question: row.question || row.questiontext || row.q || "",
        option_a: row.option_a || row.optiona || row.a || "",
        option_b: row.option_b || row.optionb || row.b || "",
        option_c: row.option_c || row.optionc || row.c || "",
        option_d: row.option_d || row.optiond || row.d || "",
        correct_option: (row.correct_option || row.correctoption || row.answer || row.correct || "").trim().toUpperCase(),
        explanation: row.explanation || row.exp || "",
        topic: row.topic || "General"
      };

      if (normalizedRow.question && normalizedRow.option_a && normalizedRow.correct_option) {
        parsed.push(normalizedRow);
      } else {
        skipped++;
      }
    }

    setParsedQuestions(parsed);
    if (parsed.length === 0) {
      setError("Failed to parse any valid questions. Please check column headers.");
    } else {
      setSuccess(`Successfully parsed ${parsed.length} questions.${skipped > 0 ? ` Skipped ${skipped} empty or invalid rows.` : ""}`);
    }
  };

  const handleImportToDb = async () => {
    if (parsedQuestions.length === 0) return;
    setImporting(true);
    setError(null);
    setSuccess(null);

    try {
      const rowsToInsert = parsedQuestions.map((q) => ({
        chapter_id: Number(chapterId),
        topic: q.topic,
        question: q.question,
        option_a: q.option_a,
        option_b: q.option_b,
        option_c: q.option_c,
        option_d: q.option_d,
        correct_option: q.correct_option,
        explanation: q.explanation
      }));

      const { error: insError } = await supabase
        .from("questions")
        .insert(rowsToInsert);

      if (insError) throw insError;

      setSuccess(`Successfully imported all ${parsedQuestions.length} questions into selected chapter!`);
      setParsedQuestions([]);
      setBulkText("");
      loadKpisAndStats();
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to insert questions into database.");
    } finally {
      setImporting(false);
    }
  };

  const getChapterName = (id) => {
    const chap = dbChapters.find((c) => String(c.id) === String(id));
    return chap ? chap.chapter_name : `Chapter ${id}`;
  };

  const formatActiveRoute = (path) => {
    if (!path || path === "/") return { label: "Home Page", icon: "🏠" };
    let decodedPath = path;
    try {
      decodedPath = decodeURIComponent(path);
    } catch {
      decodedPath = path;
    }
    const cleanPath = decodedPath.split("?")[0].split("#")[0];
    const searchParams = decodedPath.includes("?") ? new URLSearchParams(decodedPath.split("?")[1]) : null;
    const querySet = searchParams?.get("set") || "";

    if (cleanPath === "/admin") return { label: "Admin Portal", icon: "⚡" };
    if (cleanPath === "/login") return { label: "Login / Register", icon: "🔑" };
    if (cleanPath === "/vault") return { label: "Mistake Vault (Revision)", icon: "📚" };
    if (cleanPath === "/coming-soon") return { label: "Coming Soon", icon: "⏳" };

    if (cleanPath.startsWith("/quiz/")) {
      const chapterId = cleanPath.replace("/quiz/", "");
      const chap = dbChapters.find((c) => String(c.id) === String(chapterId));
      const chapName = chap ? chap.chapter_name : (chapterId === "9" ? "Appointment and Remuneration of Managerial Personnel" : `Chapter ${chapterId}`);
      return { label: `SPOM: Chapter Practice (SET A) — Ch.${chapterId}: ${chapName}`, icon: "🎯" };
    }

    if (cleanPath.startsWith("/take-test/")) {
      const slug = cleanPath.replace("/take-test/", "");
      const course = dbCourses.find((c) => String(c.id) === String(slug) || c.course_slug === slug);
      const courseName = course ? course.course_name : (slug === "1" || slug === "spom" ? "SPOM (SET A)" : slug.replace(/-/g, " ").toUpperCase());
      const setLabel = querySet ? ` (${querySet})` : " (SET A)";
      return { label: `SPOM: Full Mock Test${setLabel} — ${courseName}`, icon: "📝" };
    }

    if (cleanPath.startsWith("/course/")) {
      const parts = cleanPath.split("/").filter(Boolean);
      const courseSlug = parts[1] || "";
      const setType = parts[2] || querySet || "SET A";
      
      const course = dbCourses.find((c) => String(c.id) === String(courseSlug) || c.course_slug === courseSlug);
      const courseName = course ? course.course_name : (courseSlug === "1" || courseSlug === "spom" ? "SPOM Set A" : courseSlug.replace(/-/g, " ").toUpperCase());
      
      if (parts.length >= 3 || querySet) {
        return { label: `SPOM: Chapter Practice (${setType})`, icon: "📖" };
      }
      return { label: `${courseName}: Mode Selection`, icon: "🗂️" };
    }

    return { label: decodedPath, icon: "🔗" };
  };

  // Filter flagged questions
  const filteredFlags = flaggedItems.filter((item) => {
    const query = flagSearch.toLowerCase().trim();
    if (!query) return true;
    return (
      item.question.toLowerCase().includes(query) ||
      (item.topic && item.topic.toLowerCase().includes(query)) ||
      String(item.id) === query.replace("#", "") ||
      `#${item.id}` === query
    );
  });

  // Filter suggestions
  const filteredSubmissions = formSubmissions.filter((sub) => {
    const query = subSearch.toLowerCase().trim();
    if (!query) return true;
    return (
      sub.question.toLowerCase().includes(query) ||
      sub.studentEmail.toLowerCase().includes(query) ||
      String(sub.chapterId) === query ||
      getChapterName(sub.chapterId).toLowerCase().includes(query)
    );
  });

  if (!isAdmin) {
    return (
      <div className="login-page-wrapper" style={{ minHeight: "100vh" }}>
        <div className="stage loaded">
          <div className="container" style={{ width: "420px", height: "auto", padding: "40px", textAlign: "center" }}>
            <h1 style={{ fontFamily: "var(--ff-serif)", fontSize: "28px", color: "var(--red)" }}>Access Denied</h1>
            <p style={{ margin: "20px 0 30px", fontSize: "14px", color: "#6b6f78", lineHeight: "1.6" }}>
              This portal is restricted to project administrators. Please return to the homepage.
            </p>
            <Link to="/">
              <button className="btn" style={{ width: "100%", height: "46px" }}>Back to Home</button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-space-root">
      <SpaceBackground />

      {/* EXCLUSIVE ADMIN TOP NAV (Cosmic Glassmorphism) */}
      <nav className="admin-space-nav">
        <div className="brand" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div className="seal">CA</div>
          <span className="brand-title">Administrative Console</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <button
            onClick={handleManualRefresh}
            className="btn ghost"
            style={{
              height: "34px",
              fontSize: "12px",
              padding: "0 14px",
              color: "#fbbf24",
              borderColor: "rgba(251, 191, 36, 0.4)",
              borderRadius: "8px",
              cursor: "pointer",
              background: "rgba(251, 191, 36, 0.08)",
              display: "flex",
              alignItems: "center",
              gap: "6px"
            }}
            title="Force refresh database counters"
          >
            🔄 Refresh Stats
          </button>
          <span style={{ fontSize: "12.5px", color: "#94a3b8", fontWeight: 500 }}>System Owner Account</span>
          <button
            onClick={logout}
            className="btn ghost"
            style={{
              height: "34px",
              fontSize: "12px",
              padding: "0 14px",
              color: "#f8fafc",
              borderColor: "rgba(255,255,255,0.2)",
              borderRadius: "8px",
              cursor: "pointer",
              background: "rgba(255, 255, 255, 0.05)"
            }}
          >
            Sign Out
          </button>
        </div>
      </nav>

      {/* DASHBOARD BODY */}
      <div style={{ flexGrow: 1, padding: "20px 24px", position: "relative", zIndex: 5 }}>
        
        {/* Table Missing Warning banner */}
        {isFlagsTableMissing && (
          <div className="admin-alert success" style={{ background: "rgba(251, 191, 36, 0.15)", border: "1px solid rgba(251, 191, 36, 0.3)", color: "#fef08a", fontSize: "12.5px", padding: "12px 18px", marginBottom: "18px", borderRadius: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>⚠️ <strong>Supabase Setup Alert</strong>: The <code>public.question_flags</code> table is missing from your database. Running in local storage fallback cache mode. Go to Supabase SQL editor to create it.</span>
            <button
              onClick={() => {
                alert("Run this SQL in your Supabase console:\n\ncreate table public.question_flags (\n  id bigint generated by default as identity primary key,\n  question_id bigint references public.questions(id) on delete cascade,\n  flagged_by text,\n  flag_type text default 'not_required',\n  created_at timestamp with time zone default now()\n);");
              }}
              style={{ background: "none", border: "none", textDecoration: "underline", color: "#fbbf24", cursor: "pointer", fontWeight: 700, fontSize: "12px" }}
            >
              Get SQL Snippet
            </button>
          </div>
        )}

        {/* Analytics Table Setup Warning banner */}
        {isAnalyticsTableMissing && (
          <div className="admin-alert success" style={{ background: "rgba(56, 189, 248, 0.15)", border: "1px solid rgba(56, 189, 248, 0.35)", color: "#bae6fd", fontSize: "12.5px", padding: "12px 18px", marginBottom: "18px", borderRadius: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>⚡ <strong>Real-Time Analytics Sync</strong>: To store persistent 24-hour peak metrics &amp; visitor history, execute <code>supabase_analytics.sql</code> in your Supabase SQL editor. Real-time presence is actively live!</span>
            <button
              onClick={() => {
                alert("Run this SQL in your Supabase console:\n\nCREATE TABLE IF NOT EXISTS public.site_analytics_visits (\n  id BIGSERIAL PRIMARY KEY,\n  visitor_id TEXT NOT NULL,\n  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,\n  username TEXT DEFAULT 'Guest',\n  is_authenticated BOOLEAN DEFAULT FALSE,\n  session_id TEXT,\n  entry_path TEXT DEFAULT '/',\n  current_path TEXT DEFAULT '/',\n  device_type TEXT DEFAULT 'Desktop',\n  user_agent TEXT,\n  created_at TIMESTAMPTZ DEFAULT NOW(),\n  last_seen_at TIMESTAMPTZ DEFAULT NOW()\n);\n\nCREATE TABLE IF NOT EXISTS public.site_traffic_peaks (\n  id BIGSERIAL PRIMARY KEY,\n  recorded_at TIMESTAMPTZ DEFAULT NOW(),\n  peak_type TEXT NOT NULL,\n  peak_count INTEGER NOT NULL,\n  date_key DATE DEFAULT CURRENT_DATE\n);\n\nALTER TABLE public.site_analytics_visits ENABLE ROW LEVEL SECURITY;\nALTER TABLE public.site_traffic_peaks ENABLE ROW LEVEL SECURITY;\nCREATE POLICY \"Allow public insert on site_analytics_visits\" ON public.site_analytics_visits FOR INSERT WITH CHECK (true);\nCREATE POLICY \"Allow public update on site_analytics_visits\" ON public.site_analytics_visits FOR UPDATE USING (true);\nCREATE POLICY \"Allow public select on site_analytics_visits\" ON public.site_analytics_visits FOR SELECT USING (true);\nCREATE POLICY \"Allow public all on site_traffic_peaks\" ON public.site_traffic_peaks FOR ALL USING (true) WITH CHECK (true);");
              }}
              style={{ background: "none", border: "none", textDecoration: "underline", color: "#38bdf8", cursor: "pointer", fontWeight: 700, fontSize: "12px" }}
            >
              Get SQL Snippet
            </button>
          </div>
        )}

        <div className="admin-space-container">
          
          {/* SIDEBAR NAVIGATION */}
          <div className="admin-space-sidebar">
            <div>
              <h2 className="admin-title">
                <span>🌌</span> Admin Portal
              </h2>
              <div className="admin-tabs">
                <button
                  type="button"
                  className={`space-tab-btn ${activeTab === "dashboard" ? "active" : ""}`}
                  onClick={() => { setActiveTab("dashboard"); setSuccess(null); setError(null); }}
                >
                  <span>📊 Overview Dashboard</span>
                </button>
                <button
                  type="button"
                  className={`space-tab-btn ${activeTab === "flags" ? "active" : ""}`}
                  onClick={() => { setActiveTab("flags"); setSuccess(null); setError(null); }}
                >
                  <span>🚩 Flagged Questions</span>
                  {flaggedItems.length > 0 && <span className="badge" style={{ padding: "2px 8px", fontSize: "10.5px", background: "#f43f5e", borderRadius: "10px" }}>{flaggedItems.length}</span>}
                </button>
                <button
                  type="button"
                  className={`space-tab-btn ${activeTab === "submissions" ? "active" : ""}`}
                  onClick={() => { setActiveTab("submissions"); setSuccess(null); setError(null); }}
                >
                  <span>📥 Student Suggestions</span>
                  {formSubmissions.length > 0 && <span className="badge" style={{ backgroundColor: "#d97706", padding: "2px 8px", fontSize: "10.5px", borderRadius: "10px" }}>{formSubmissions.length}</span>}
                </button>
                <button
                  type="button"
                  className={`space-tab-btn ${activeTab === "import" ? "active" : ""}`}
                  onClick={() => { setActiveTab("import"); setSuccess(null); setError(null); }}
                >
                  <span>📝 Bulk Importer</span>
                </button>
                <button
                  type="button"
                  className={`space-tab-btn ${activeTab === "broadcast" ? "active" : ""}`}
                  onClick={() => { setActiveTab("broadcast"); setSuccess(null); setError(null); }}
                >
                  <span>📢 Broadcast Updates</span>
                </button>
                <button
                  type="button"
                  className={`space-tab-btn ${activeTab === "recovery" ? "active" : ""}`}
                  onClick={() => { setActiveTab("recovery"); setSuccess(null); setError(null); }}
                >
                  <span>🔑 Student Credentials</span>
                </button>
              </div>
            </div>
            
            <div className="sidebar-foot" style={{ fontSize: "11px", color: "#64748b", paddingLeft: "6px" }}>
              <p style={{ display: "flex", alignItems: "center", gap: "6px", margin: "0 0 4px" }}>
                <span className="pulse-ring-dot" style={{ width: 8, height: 8 }}></span> Database Status: Online
              </p>
              <p style={{ margin: 0 }}>System Version: 2.1.2</p>
            </div>
          </div>

          {/* CONTENT PANEL */}
          <div className="admin-content-area" style={{ background: "transparent", padding: "28px 32px" }}>
            {error && <div className="admin-alert error" style={{ fontSize: "13px", padding: "12px 16px", marginBottom: "20px", borderRadius: "10px" }}>{error}</div>}
            {success && <div className="admin-alert success" style={{ fontSize: "13px", padding: "12px 16px", marginBottom: "20px", borderRadius: "10px" }}>{success}</div>}

            {/* TAB: DASHBOARD OVERVIEW */}
            {activeTab === "dashboard" && (
              <div className="admin-panel">
                <div className="panel-head" style={{ marginBottom: "22px", display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "12px" }}>
                  <div>
                    <h3 style={{ fontSize: "20px", color: "#f8fafc", fontWeight: "700", margin: "0 0 4px" }}>Overview &amp; Live Metrics</h3>
                    <p style={{ fontSize: "13px", color: "#94a3b8", margin: 0 }}>Real-time database statistics, 24-hour peak concurrency, and live visitor tracking.</p>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "rgba(16, 185, 129, 0.12)", border: "1px solid rgba(16, 185, 129, 0.3)", padding: "6px 14px", borderRadius: "20px", fontSize: "12px", color: "#34d399", fontWeight: "600" }}>
                    <div className="pulse-ring-container" style={{ width: 10, height: 10 }}>
                      <div className="pulse-ring-dot" style={{ width: 8, height: 8 }}></div>
                      <div className="pulse-ring-wave" style={{ width: 18, height: 18 }}></div>
                    </div>
                    Supabase Realtime Live Sync Active
                  </div>
                </div>

                {/* ROW 1: REAL-TIME LIVE ACTIVITY & 24-HOUR PEAK METRICS */}
                <div className="cosmic-cards-grid" style={{ marginBottom: "16px" }}>
                  {/* Card 1: Users Online (Live) */}
                  <CosmicSpotlightCard
                    theme="emerald"
                    icon={
                      <div className="pulse-ring-container">
                        <div className="pulse-ring-dot"></div>
                        <div className="pulse-ring-wave"></div>
                      </div>
                    }
                    badgeText="Active Now"
                    value={analytics.liveTotalCount}
                    label="Live Users Online (Now)"
                    trend="● Live"
                    subtext={`${analytics.liveLoggedInCount} Logged-in · ${analytics.liveGuestCount} Guest visitors`}
                    chartType="equalizer"
                  />

                  {/* Card 2: 24h Peak Logged In Users */}
                  <CosmicSpotlightCard
                    theme="purple"
                    icon="⚡"
                    badgeText="24h Peak Record"
                    value={analytics.peakLoggedIn24h}
                    label="24h Peak Logged-In Users"
                    trend="▲ 24h High"
                    subtext="Highest simultaneous logins in 24h"
                    chartType="line"
                  />

                  {/* Card 3: 24h Total Unique Site Visitors */}
                  <CosmicSpotlightCard
                    theme="cyan"
                    icon="🌐"
                    badgeText="With / Without Login"
                    value={analytics.uniqueVisitors24h}
                    label="24h Unique Site Visitors"
                    trend="24h Total"
                    subtext="Unique devices visited in 24h"
                    chartType="line"
                  />

                  {/* Card 4: 24h Distinct Student Logins */}
                  <CosmicSpotlightCard
                    theme="indigo"
                    icon="🎓"
                    badgeText="Verified Logins"
                    value={analytics.distinctLoggedIn24h}
                    label="24h Distinct Student Logins"
                    subtext={`${kpis.totalUsersCount > 0 ? Math.round((analytics.distinctLoggedIn24h / Math.max(1, kpis.totalUsersCount)) * 100) : 0}% of student accounts active`}
                    chartType="progress"
                    progressPct={kpis.totalUsersCount > 0 ? Math.min(100, Math.round((analytics.distinctLoggedIn24h / Math.max(1, kpis.totalUsersCount)) * 100)) : 100}
                  />
                </div>

                {/* ROW 2: PLATFORM CORE & ASSET METRICS */}
                <div className="cosmic-cards-grid">
                  {/* Card 5: All-Time Unique Visitors */}
                  <CosmicSpotlightCard
                    theme="cyan"
                    icon="✨"
                    badgeText="Lifetime Reach"
                    value={analytics.allTimeUniqueVisitors}
                    label="All-Time Unique Visitors"
                    subtext="Cumulative unique devices visited"
                    chartType="line"
                  />

                  {/* Card 6: Registered Students */}
                  <CosmicSpotlightCard
                    theme="cyan"
                    icon="👥"
                    badgeText="Live DB Sync"
                    value={kpis.totalUsersCount}
                    label="Registered Students"
                    subtext="Verified student accounts"
                    chartType="line"
                  />

                  {/* Card 7: Questions Bank */}
                  <CosmicSpotlightCard
                    theme="amber"
                    icon="📚"
                    badgeText={`${dbChapters.length} Chapters`}
                    value={kpis.questionsCount}
                    label="Questions Bank"
                    subtext="Active syllabus questions"
                    chartType="progress"
                    progressPct={Math.min(100, Math.round((kpis.questionsCount / 2000) * 100))}
                  />

                  {/* Card 8: Flagged Reports */}
                  <CosmicSpotlightCard
                    theme="rose"
                    icon="🚩"
                    badgeText={kpis.flagsCount > 0 ? "Action Required" : "All Clean"}
                    value={kpis.flagsCount}
                    label="Flagged Reports"
                    subtext={kpis.flagsCount > 0 ? "Requires admin review" : "0 pending reports"}
                    chartType="line"
                  />
                </div>

                {/* REAL-TIME LIVE PRESENCE & ACTIVE VISITORS MONITOR */}
                <div className="cosmic-presence-monitor">
                  <div className="presence-header-row">
                    <div className="presence-title-wrap">
                      <div className="live-pulse-radar">
                        <div className="live-pulse-dot"></div>
                        <div className="live-pulse-ring"></div>
                      </div>
                      <div>
                        <h4 style={{ fontSize: "16px", color: "#f8fafc", fontWeight: "700", margin: "0 0 2px" }}>
                          Live Connected Visitors &amp; Students Monitor
                        </h4>
                        <p style={{ fontSize: "12px", color: "#94a3b8", margin: 0 }}>
                          Instant real-time socket presence showing active users, visited pages, and device types.
                        </p>
                      </div>
                    </div>

                    {/* Filter Chips */}
                    <div className="presence-filter-chips">
                      <button
                        type="button"
                        className={`presence-chip-btn ${liveRosterFilter === "all" ? "active" : ""}`}
                        onClick={() => setLiveRosterFilter("all")}
                      >
                        All Connected ({analytics.activeVisitors.length > 0 ? analytics.activeVisitors.length : analytics.liveTotalCount})
                      </button>
                      <button
                        type="button"
                        className={`presence-chip-btn ${liveRosterFilter === "students" ? "active" : ""}`}
                        onClick={() => setLiveRosterFilter("students")}
                      >
                        🎓 Students ({analytics.liveLoggedInCount})
                      </button>
                      <button
                        type="button"
                        className={`presence-chip-btn ${liveRosterFilter === "guests" ? "active" : ""}`}
                        onClick={() => setLiveRosterFilter("guests")}
                      >
                        👤 Guests ({analytics.liveGuestCount})
                      </button>
                    </div>
                  </div>

                  {/* Active Visitors Table */}
                  <div className="presence-table-wrap">
                    <table className="presence-table">
                      <thead>
                        <tr>
                          <th>User / Visitor</th>
                          <th>Role / Status</th>
                          <th>Current Active Route</th>
                          <th>Device</th>
                          <th>Status</th>
                          <th>Connected At</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(() => {
                          const displayList = analytics.activeVisitors.length > 0
                            ? analytics.activeVisitors
                            : [
                                {
                                  key: "admin-self",
                                  visitor_id: "self",
                                  user_id: "admin-id",
                                  username: username || "Admin",
                                  is_logged_in: true,
                                  page_path: "/admin",
                                  device_type: "Desktop",
                                  online_at: new Date().toISOString(),
                                },
                              ];

                          const filteredList = displayList.filter((v) => {
                            if (liveRosterFilter === "students") return v.is_logged_in;
                            if (liveRosterFilter === "guests") return !v.is_logged_in;
                            return true;
                          });

                          if (filteredList.length === 0) {
                            return (
                              <tr>
                                <td colSpan="6" style={{ textAlign: "center", padding: "28px", color: "#64748b" }}>
                                  No connected users found matching this filter.
                                </td>
                              </tr>
                            );
                          }

                          return filteredList.map((visitor, idx) => (
                            <tr key={visitor.key || visitor.visitor_id || idx}>
                              <td>
                                <div className="presence-user-cell">
                                  <div className={`presence-user-avatar ${visitor.is_logged_in ? "" : "guest"}`}>
                                    {visitor.is_logged_in ? (visitor.username ? visitor.username.charAt(0).toUpperCase() : "S") : "👤"}
                                  </div>
                                  <div>
                                    <div className="presence-user-name">
                                      {visitor.username || "Guest Visitor"}
                                      {visitor.username === username && (
                                        <span style={{ fontSize: "10px", color: "#a855f7", fontWeight: 700, background: "rgba(168, 85, 247, 0.15)", padding: "1px 6px", borderRadius: "6px" }}>YOU</span>
                                      )}
                                    </div>
                                    <div style={{ fontSize: "11px", color: "#64748b", fontFamily: "monospace" }}>
                                      {visitor.visitor_id ? visitor.visitor_id.substring(0, 14) + "..." : "client-session"}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td>
                                <span className={`presence-role-pill ${visitor.is_logged_in ? "student" : "guest"}`}>
                                  {visitor.is_logged_in ? "🎓 Verified Student" : "👤 Guest Visitor"}
                                </span>
                              </td>
                              <td>
                                {(() => {
                                  const fullRoute = visitor.page_path || "/";
                                  const routeInfo = formatActiveRoute(fullRoute);
                                  return (
                                    <div style={{ display: "flex", flexDirection: "column", gap: "4px", alignItems: "flex-start" }}>
                                      <span
                                        style={{
                                          display: "inline-flex",
                                          alignItems: "center",
                                          gap: "5px",
                                          fontSize: "12px",
                                          fontWeight: 600,
                                          color: "#f8fafc",
                                          background: "rgba(255, 255, 255, 0.08)",
                                          padding: "3px 9px",
                                          borderRadius: "6px",
                                          border: "1px solid rgba(255, 255, 255, 0.12)"
                                        }}
                                      >
                                        <span>{routeInfo.icon}</span>
                                        <span>{routeInfo.label}</span>
                                      </span>
                                      <span
                                        className="presence-path-badge"
                                        title={fullRoute}
                                        style={{
                                          fontSize: "11.5px",
                                          color: "#94a3b8",
                                          fontFamily: "monospace",
                                          maxWidth: "340px",
                                          overflow: "hidden",
                                          textOverflow: "ellipsis",
                                          whiteSpace: "nowrap"
                                        }}
                                      >
                                        🔗 {fullRoute}
                                      </span>
                                    </div>
                                  );
                                })()}
                              </td>
                              <td>
                                <span className="presence-device-tag">
                                  {visitor.device_type === "Mobile" ? "📱 Mobile" : visitor.device_type === "Tablet" ? "📱 Tablet" : "💻 Desktop"}
                                </span>
                              </td>
                              <td>
                                <span className="presence-status-live">
                                  <span className="live-pulse-dot" style={{ position: "static", display: "inline-block", width: 8, height: 8 }}></span>
                                  Active Now
                                </span>
                              </td>
                              <td style={{ fontSize: "12px", color: "#64748b" }}>
                                {visitor.online_at ? new Date(visitor.online_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "Just now"}
                              </td>
                            </tr>
                          ));
                        })()}
                      </tbody>
                    </table>
                  </div>

                  {/* Summary Metric Strip */}
                  <div className="presence-summary-bar">
                    <div className="summary-metric-box">
                      <div>
                        <div className="summary-metric-lbl">24h Total Site Sessions</div>
                        <div className="summary-metric-val">{analytics.totalSessions24h || analytics.uniqueVisitors24h}</div>
                      </div>
                      <span style={{ fontSize: "20px" }}>⚡</span>
                    </div>

                    <div className="summary-metric-box">
                      <div style={{ width: "100%" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                          <span className="summary-metric-lbl">24h Device Split</span>
                          <span style={{ fontSize: "11.5px", color: "#cbd5e1", fontWeight: 600 }}>
                            {analytics.desktopCount24h} Desktop · {analytics.mobileCount24h} Mobile
                          </span>
                        </div>
                        <div className="traffic-split-track">
                          <div
                            className="traffic-split-fill-desktop"
                            style={{
                              width: `${
                                analytics.desktopCount24h + analytics.mobileCount24h > 0
                                  ? Math.round((analytics.desktopCount24h / (analytics.desktopCount24h + analytics.mobileCount24h)) * 100)
                                  : 70
                              }%`,
                            }}
                          />
                          <div
                            className="traffic-split-fill-mobile"
                            style={{
                              width: `${
                                analytics.desktopCount24h + analytics.mobileCount24h > 0
                                  ? Math.round((analytics.mobileCount24h / (analytics.desktopCount24h + analytics.mobileCount24h)) * 100)
                                  : 30
                              }%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="summary-metric-box">
                      <div>
                        <div className="summary-metric-lbl">24h Total Unique Reach</div>
                        <div className="summary-metric-val">{analytics.uniqueVisitors24h} Users</div>
                      </div>
                      <span style={{ fontSize: "20px" }}>👥</span>
                    </div>
                  </div>
                </div>

                {/* FEEDBACK CARDS LIST */}
                <div className="panel-head" style={{ borderTop: "1px solid rgba(255, 255, 255, 0.1)", paddingTop: "24px", marginTop: "24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <h3 style={{ fontSize: "18px", color: "#f8fafc", fontWeight: "600", margin: "0 0 4px" }}>Student Feedback Box</h3>
                    <p style={{ fontSize: "12.5px", color: "#94a3b8", margin: 0 }}>Direct system corrections and comments submitted by users.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => loadFeedbacks()}
                    style={{
                      background: "rgba(255, 255, 255, 0.08)",
                      border: "1px solid rgba(255, 255, 255, 0.15)",
                      color: "#94a3b8",
                      padding: "6px 12px",
                      borderRadius: "6px",
                      fontSize: "12px",
                      cursor: "pointer",
                      fontWeight: 600
                    }}
                  >
                    🔄 Refresh Feedbacks
                  </button>
                </div>

                <div className="flagged-list" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginTop: "16px" }}>
                  {feedbacks.length === 0 ? (
                    <div className="empty-state" style={{ gridColumn: "span 2", padding: "30px", background: "rgba(17, 24, 39, 0.6)", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.08)", textAlign: "center" }}>
                      <span style={{ fontSize: "28px", color: "#34d399" }}>✓</span>
                      <p style={{ fontSize: "13.5px", color: "#94a3b8", marginTop: "8px" }}>All student feedback resolved!</p>
                    </div>
                  ) : (
                    feedbacks.map((f) => {
                      const isLong = f.comment && f.comment.length > 50;
                      const truncated = isLong ? f.comment.substring(0, 50) + "..." : f.comment;
                      return (
                        <div
                          key={f.id}
                          className="flagged-card"
                          onClick={() => setActiveFeedbackDetails(f)}
                          style={{
                            padding: "16px 20px",
                            border: "1px solid rgba(255, 255, 255, 0.1)",
                            borderRadius: "14px",
                            background: "rgba(17, 24, 39, 0.65)",
                            backdropFilter: "blur(10px)",
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "space-between",
                            cursor: "pointer",
                            transition: "all 0.25s ease"
                          }}
                        >
                          <div>
                            <div className="fc-top" style={{ marginBottom: "8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <span className="fc-chap" style={{ color: "#f8fafc", fontWeight: "600", fontSize: "13px" }}>
                                👤 {f.student}
                              </span>
                              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                {f.rating ? (
                                  <span style={{ fontSize: "11px", color: "#fbbf24", fontWeight: 700 }}>
                                    {"⭐".repeat(Math.min(5, Math.max(1, f.rating)))}
                                  </span>
                                ) : null}
                                <span className="fc-flag-count" style={{ background: "rgba(251, 191, 36, 0.15)", color: "#fbbf24", border: "1px solid rgba(251, 191, 36, 0.3)", fontSize: "10.5px", padding: "2px 8px", borderRadius: "10px" }}>
                                  {f.type}
                                </span>
                              </div>
                            </div>
                            <p style={{ fontSize: "13px", color: "#cbd5e1", lineHeight: "1.5", margin: "6px 0", wordBreak: "break-all" }}>
                              "{truncated}"
                              {isLong && <span style={{ color: "#c084fc", fontSize: "11px", marginLeft: "6px", fontWeight: "600" }}>Read More</span>}
                            </p>
                          </div>
                          <div style={{ borderTop: "1px solid rgba(255, 255, 255, 0.08)", paddingTop: "10px", marginTop: "10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ fontSize: "11px", color: "#64748b" }}>Submitted: {f.date}</span>
                            <button
                              type="button"
                              className="btn-admin remove"
                              style={{ padding: "4px 10px", fontSize: "11px", height: "26px", border: "1px solid rgba(244, 63, 94, 0.3)", color: "#fb7185", background: "rgba(244, 63, 94, 0.1)", borderRadius: "6px", cursor: "pointer" }}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (window.confirm("Are you sure you want to permanently delete this feedback?")) {
                                  handleResolveFeedback(f.id);
                                }
                              }}
                            >
                              Delete from DB
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* TAB: FLAGGED QUESTIONS */}
            {activeTab === "flags" && (
              <div className="admin-panel">
                <div className="panel-head" style={{ marginBottom: "18px" }}>
                  <h3 style={{ fontSize: "18px", color: "#111622", fontWeight: "600" }}>Not Required / Flagged Questions</h3>
                  <p style={{ fontSize: "12.5px", color: "#6b7280" }}>Review questions marked as basic or unnecessary by students. Filter by Ref ID or text to find items instantly.</p>
                </div>

                {/* SEARCH INPUT BAR */}
                <div className="form-group" style={{ marginBottom: "16px" }}>
                  <input
                    type="text"
                    placeholder="🔍 Search by keyword, topic name, or Question Ref ID (e.g. #14)..."
                    value={flagSearch}
                    onChange={(e) => setFlagSearch(e.target.value)}
                    style={{ padding: "8px 12px", border: "1px solid #e1e4eb", borderRadius: "6px", fontSize: "12.5px", width: "100%", outline: "none" }}
                  />
                </div>

                {flagsLoading ? (
                  <p style={{ fontSize: "13px" }}>Loading reports...</p>
                ) : filteredFlags.length === 0 ? (
                  <div className="empty-state" style={{ padding: "40px" }}>
                    <span>✓</span>
                    <p style={{ fontSize: "13px" }}>No matching flagged questions found.</p>
                  </div>
                ) : (
                  <div className="flagged-list" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    {filteredFlags.map((item) => (
                      <div key={item.id} className="flagged-card" style={{ padding: "16px", border: "1px solid #e1e4eb", borderRadius: "8px" }}>
                        <div className="fc-top" style={{ marginBottom: "8px" }}>
                          <span className="fc-chap" style={{ fontSize: "11px", fontWeight: "600" }}>{getChapterName(item.chapter_id)} &middot; {item.topic}</span>
                          <span className="fc-flag-count" style={{ fontSize: "11px", padding: "2px 8px" }}>🚩 Flagged {item.flagsCount} time{item.flagsCount > 1 ? "s" : ""}</span>
                        </div>
                        
                        <p className="fc-question" style={{ fontSize: "14px", fontWeight: "600", color: "#111622", marginBottom: "12px" }}>
                          <span style={{ color: "#c9a667", marginRight: "6px" }}>[Ref ID: #{item.id}]</span> {item.question}
                        </p>
                        
                        <div className="fc-options" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "12px" }}>
                          <div className={`fc-opt ${item.correct_option === "A" ? "correct" : ""}`} style={{ padding: "8px 12px", fontSize: "12.5px" }}><b>A</b> {item.option_a}</div>
                          <div className={`fc-opt ${item.correct_option === "B" ? "correct" : ""}`} style={{ padding: "8px 12px", fontSize: "12.5px" }}><b>B</b> {item.option_b}</div>
                          <div className={`fc-opt ${item.correct_option === "C" ? "correct" : ""}`} style={{ padding: "8px 12px", fontSize: "12.5px" }}><b>C</b> {item.option_c}</div>
                          <div className={`fc-opt ${item.correct_option === "D" ? "correct" : ""}`} style={{ padding: "8px 12px", fontSize: "12.5px" }}><b>D</b> {item.option_d}</div>
                        </div>

                        <div className="fc-explain" style={{ padding: "10px 14px", fontSize: "12px", marginBottom: "14px" }}>
                          <b>Explanation:</b> {item.explanation}
                        </div>

                        {/* ADVANCED STATISTICS DISPLAY */}
                        <div style={{ display: "flex", gap: "16px", background: "#fbfbfc", padding: "10px 16px", borderRadius: "6px", marginBottom: "14px", border: "1px solid #e1e4eb" }}>
                          <div style={{ flex: 1 }}>
                            <span style={{ fontSize: "10px", color: "#8a94a6", textTransform: "uppercase", fontWeight: 600 }}>Attempted Last 15 Days</span>
                            <div style={{ fontSize: "15px", fontWeight: "700", color: "#111622" }}>{item.attemptsLast15Days} times</div>
                          </div>
                          <div style={{ flex: 1, borderLeft: "1px solid #e1e4eb", paddingLeft: "16px" }}>
                            <span style={{ fontSize: "10px", color: "#8a94a6", textTransform: "uppercase", fontWeight: 600 }}>Not Required Opt-out rate</span>
                            <div style={{ fontSize: "15px", fontWeight: "700", color: "#b3261e" }}>{item.percentNotRequired}% of students</div>
                          </div>
                          {item.flaggedBy && (
                            <div style={{ flex: 1.5, borderLeft: "1px solid #e1e4eb", paddingLeft: "16px" }}>
                              <span style={{ fontSize: "10px", color: "#8a94a6", textTransform: "uppercase", fontWeight: 600 }}>Reported By Student</span>
                              <div style={{ fontSize: "13px", fontWeight: "600", color: "#111622", textOverflow: "ellipsis", overflow: "hidden" }}>{item.flaggedBy}</div>
                            </div>
                          )}
                        </div>

                        <div className="fc-actions" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div style={{ display: "flex", gap: "10px" }}>
                            <button
                              type="button"
                              className="btn-admin keep"
                              style={{ padding: "6px 14px", fontSize: "12px", border: "1px solid #e1e4eb" }}
                              onClick={() => handleKeepQuestion(item.id)}
                            >
                              Keep Question (Clear Flags)
                            </button>
                            <button
                              type="button"
                              className="btn-admin remove"
                              style={{ padding: "6px 14px", fontSize: "12px" }}
                              onClick={() => handleRemoveQuestion(item.id)}
                            >
                              Remove Question
                            </button>
                          </div>

                          {/* APPRECIATION MESSAGE BUTTON (Strict preset message only) */}
                          {item.flaggedBy && item.flaggedBy !== "student" && (
                            <button
                              type="button"
                              className="btn-admin"
                              style={{ padding: "6px 14px", fontSize: "12px", background: "none", border: "1px solid var(--brass)", color: "var(--brass)" }}
                              disabled={sentAppreciations[item.id]}
                              onClick={() => handleSendAppreciation(item.id, item.flaggedBy)}
                            >
                              {sentAppreciations[item.id] ? "Appreciation Sent ✓" : "Send Thank You Inbox"}
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB: GOOGLE FORM SUGGESTIONS */}
            {activeTab === "submissions" && (
              <div className="admin-panel">
                <div className="panel-head" style={{ marginBottom: "18px" }}>
                  <h3 style={{ fontSize: "18px", color: "#111622", fontWeight: "600" }}>Google Form Suggestions</h3>
                  <p style={{ fontSize: "12.5px", color: "#6b7280" }}>Review new questions suggested by students. Filter suggestions to search specific details.</p>
                </div>

                <div className="form-group" style={{ marginBottom: "16px" }}>
                  <input
                    type="text"
                    placeholder="🔍 Search suggestions by student email, topic, or keyword..."
                    value={subSearch}
                    onChange={(e) => setSubSearch(e.target.value)}
                    style={{ padding: "8px 12px", border: "1px solid #e1e4eb", borderRadius: "6px", fontSize: "12.5px", width: "100%", outline: "none" }}
                  />
                </div>

                {filteredSubmissions.length === 0 ? (
                  <div className="empty-state" style={{ padding: "40px" }}>
                    <span>✓</span>
                    <p style={{ fontSize: "13px" }}>No matching question suggestions found.</p>
                  </div>
                ) : (
                  <div className="flagged-list" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    {filteredSubmissions.map((sub) => (
                      <div key={sub.id} className="flagged-card" style={{ padding: "16px", border: "1px solid #e1e4eb", borderRadius: "8px", borderLeft: "4px solid #c9a667" }}>
                        <div className="fc-top" style={{ marginBottom: "8px" }}>
                          <span className="fc-chap" style={{ color: "#111622", fontWeight: "600", fontSize: "11px" }}>{getChapterName(sub.chapterId)} &middot; {sub.topic}</span>
                          <span style={{ fontSize: "11px", color: "#6b7280", fontWeight: 500 }}>Submitted by: {sub.studentEmail}</span>
                        </div>
                        
                        <p className="fc-question" style={{ fontSize: "14px", fontWeight: "600", color: "#111622", marginBottom: "12px" }}>{sub.question}</p>
                        
                        <div className="fc-options" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "12px" }}>
                          <div className={`fc-opt ${sub.correct_option === "A" ? "correct" : ""}`} style={{ padding: "8px 12px", fontSize: "12.5px" }}><b>A</b> {sub.option_a}</div>
                          <div className={`fc-opt ${sub.correct_option === "B" ? "correct" : ""}`} style={{ padding: "8px 12px", fontSize: "12.5px" }}><b>B</b> {sub.option_b}</div>
                          <div className={`fc-opt ${sub.correct_option === "C" ? "correct" : ""}`} style={{ padding: "8px 12px", fontSize: "12.5px" }}><b>C</b> {sub.option_c}</div>
                          <div className={`fc-opt ${sub.correct_option === "D" ? "correct" : ""}`} style={{ padding: "8px 12px", fontSize: "12.5px" }}><b>D</b> {sub.option_d}</div>
                        </div>

                        <div className="fc-explain" style={{ padding: "10px 14px", fontSize: "12px", marginBottom: "14px" }}>
                          <b>Explanation:</b> {sub.explanation}
                        </div>

                        <div className="fc-actions" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div style={{ display: "flex", gap: "10px" }}>
                            <button
                              type="button"
                              className="btn-admin"
                              style={{ padding: "6px 14px", fontSize: "12px" }}
                              onClick={() => handleReviewSubmission(sub)}
                            >
                              Review &amp; Import
                            </button>
                            <button
                              type="button"
                              className="btn-admin remove"
                              style={{ padding: "6px 14px", fontSize: "12px" }}
                              onClick={() => handleDismissSubmission(sub.id)}
                            >
                              Dismiss
                            </button>
                          </div>

                          {/* APPRECIATION MESSAGE BUTTON (Strict preset message only) */}
                          <button
                            type="button"
                            className="btn-admin"
                            style={{ padding: "6px 14px", fontSize: "12px", background: "none", border: "1px solid var(--brass)", color: "var(--brass)" }}
                            disabled={sentAppreciations[sub.id]}
                            onClick={() => handleSendAppreciation(sub.id, sub.studentEmail)}
                          >
                            {sentAppreciations[sub.id] ? "Appreciation Sent ✓" : "Send Thank You Inbox"}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB: BULK IMPORTER */}
            {activeTab === "import" && (
              <div className="admin-panel">
                <div className="panel-head" style={{ marginBottom: "18px" }}>
                  <h3 style={{ fontSize: "18px", color: "#111622", fontWeight: "600" }}>Bulk Question Importer</h3>
                  <p style={{ fontSize: "12.5px", color: "#6b7280" }}>Bulk add questions using CSV or Copy-Pasted Tab-Separated values directly from spreadsheets.</p>
                </div>

                <div className="import-controls" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div className="form-group">
                    <label style={{ fontSize: "13px", fontWeight: "600", color: "#111622" }}>Select Chapter to Import Into:</label>
                    <select
                      value={chapterId}
                      onChange={(e) => setChapterId(e.target.value)}
                      style={{ padding: "8px 12px", border: "1px solid #e1e4eb", borderRadius: "6px", fontSize: "13px", outline: "none", width: "100%" }}
                    >
                      {dbChapters.length > 0 ? (
                        dbChapters.map((c) => (
                          <option key={c.id} value={c.id}>
                            [{c.course_name}] {c.chapter_name}
                          </option>
                        ))
                      ) : (
                        [1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                          <option key={n} value={n}>Chapter {n}</option>
                        ))
                      )}
                    </select>
                  </div>

                  <div className="form-group">
                    <label style={{ fontSize: "13px", fontWeight: "600", color: "#111622" }}>Spreadsheet Rows (TSV format):</label>
                    <textarea
                      placeholder={`question\toption_a\toption_b\toption_c\toption_d\tcorrect_option\texplanation\ttopic
Which Act replaced FERA?\tSecurities Contract\tRBI Act\tFEMA, 1999\tCompanies Act\tC\tFEMA replaced FERA in 1999\tStructure of FEMA`}
                      rows="6"
                      value={bulkText}
                      onChange={(e) => setBulkText(e.target.value)}
                      style={{ padding: "12px", border: "1px solid #e1e4eb", borderRadius: "6px", fontSize: "12px", outline: "none", width: "100%", minHeight: "100px" }}
                    />
                  </div>

                  <button
                    type="button"
                    className="btn-admin"
                    style={{ width: "150px", height: "36px", fontSize: "12px", fontWeight: "600", borderRadius: "6px" }}
                    onClick={handleParseInput}
                  >
                    Parse Question Data
                  </button>
                </div>

                {parsedQuestions.length > 0 && (
                  <div className="parsed-preview" style={{ marginTop: "24px" }}>
                    <h4 style={{ fontSize: "14px", fontWeight: "600", color: "#111622", margin: "0 0 10px" }}>Parsed Preview ({parsedQuestions.length} Questions)</h4>
                    <div style={{ maxHeight: "240px", overflowY: "auto", border: "1px solid #e1e4eb", borderRadius: "6px" }}>
                      <table className="topic-table" style={{ margin: 0, fontSize: "12px" }}>
                        <thead>
                          <tr>
                            <th>Question</th>
                            <th style={{ width: "70px", textAlign: "center" }}>Correct</th>
                            <th>Topic</th>
                          </tr>
                        </thead>
                        <tbody>
                          {parsedQuestions.map((q, idx) => (
                            <tr key={idx}>
                              <td style={{ padding: "8px 12px" }}>{q.question}</td>
                              <td className="mono" style={{ textAlign: "center", padding: "8px 12px" }}>{q.correct_option}</td>
                              <td style={{ padding: "8px 12px" }}>{q.topic}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <button
                      type="button"
                      className="btn-admin import-btn"
                      style={{ marginTop: "16px", width: "200px", height: "36px", fontSize: "12.5px" }}
                      disabled={importing}
                      onClick={handleImportToDb}
                    >
                      {importing ? "Importing..." : "Import to Database"}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* TAB: STUDENT RECOVERY CREDENTIALS */}
            {activeTab === "recovery" && (
              <div className="admin-panel">
                <div className="panel-head" style={{ marginBottom: "18px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
                  <div>
                    <h3 style={{ fontSize: "18px", color: "#111622", fontWeight: "600" }}>Student Verification &amp; Recovery Codes</h3>
                    <p style={{ fontSize: "12.5px", color: "#6b7280" }}>View 7-character recovery codes for users or generate codes for existing accounts.</p>
                  </div>
                  
                  <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                    <button
                      type="button"
                      onClick={handleGenerateCodesForAllMissingUsers}
                      style={{
                        background: "#0369a1",
                        color: "#fff",
                        border: "none",
                        borderRadius: "6px",
                        padding: "8px 14px",
                        fontSize: "12px",
                        fontWeight: "600",
                        cursor: "pointer",
                      }}
                    >
                      ⚡ Auto-Generate Codes For Existing Users
                    </button>

                    <button
                      type="button"
                      onClick={() => loadRegisteredUsers()}
                      style={{
                        background: "rgba(255,255,255,0.08)",
                        color: "#94a3b8",
                        border: "1px solid rgba(255,255,255,0.15)",
                        borderRadius: "6px",
                        padding: "8px 12px",
                        fontSize: "12px",
                        fontWeight: "600",
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px"
                      }}
                    >
                      🔄 Refresh
                    </button>

                    {/* Search filter */}
                    <div style={{ position: "relative", width: "220px" }}>
                      <input
                        type="text"
                        placeholder="Search username..."
                        value={recoverySearch}
                        onChange={(e) => setRecoverySearch(e.target.value)}
                        style={{ padding: "8px 12px 8px 32px", border: "1px solid #e1e4eb", borderRadius: "6px", fontSize: "12.5px", outline: "none", width: "100%" }}
                      />
                      <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" stroke="#a3a09a" style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", width: "14px", height: "14px" }}>
                        <circle cx="11" cy="11" r="8" />
                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                      </svg>
                    </div>
                  </div>
                </div>

                {isUsersLoading ? (
                  <div className="card" style={{ padding: "36px", textAlign: "center" }}>
                    <p style={{ fontSize: "14px", color: "#94a3b8", margin: 0 }}>Loading registered student credentials from Supabase…</p>
                  </div>
                ) : registeredUsers.length > 0 ? (
                  <div style={{ overflowX: "auto", border: "1px solid #e1e4eb", borderRadius: "6px" }}>
                    <table className="topic-table" style={{ margin: 0, fontSize: "13px" }}>
                      <thead>
                        <tr>
                          <th>Username</th>
                          <th>🔑 7-Char Recovery Code</th>
                          <th>Phrase 1: Favourite Place</th>
                          <th>Phrase 2: Firstname_YOB</th>
                          <th>Registered Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {registeredUsers
                          .filter((u) => !recoverySearch || u.username.toLowerCase().includes(recoverySearch.toLowerCase()))
                          .map((user) => {
                            const code = user.recovery_code;
                            return (
                              <tr key={user.id}>
                                <td style={{ padding: "10px 14px", fontWeight: "600", color: "var(--navy)" }}>{user.username}</td>
                                <td style={{ padding: "10px 14px" }}>
                                  {code ? (
                                    <span style={{
                                      background: "#f0f9ff",
                                      border: "1px solid #bae6fd",
                                      color: "#0369a1",
                                      padding: "4px 8px",
                                      borderRadius: "6px",
                                      fontFamily: "monospace",
                                      fontWeight: "700",
                                      letterSpacing: "1px",
                                      fontSize: "13px"
                                    }}>
                                      {code}
                                    </span>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => handleAssignCodeForUser(user)}
                                      style={{
                                        background: "#fef3c7",
                                        border: "1px solid #fde68a",
                                        color: "#b45309",
                                        padding: "4px 10px",
                                        borderRadius: "6px",
                                        fontSize: "11.5px",
                                        fontWeight: "600",
                                        cursor: "pointer"
                                      }}
                                    >
                                      ⚡ Generate Code
                                    </button>
                                  )}
                                </td>
                                <td style={{ padding: "10px 14px", color: "#111622", fontWeight: "500" }}>{user.favourite_place || "—"}</td>
                                <td style={{ padding: "10px 14px", color: "#0f172a", fontFamily: "monospace", fontWeight: "600" }}>{user.firstname_yob || "—"}</td>
                                <td style={{ padding: "10px 14px", color: "#6b7280" }}>{new Date(user.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="card" style={{ padding: "24px", textAlign: "center", border: "1px dashed #e1e4eb" }}>
                    <p style={{ fontSize: "13.5px", color: "#6b7280", margin: "0 0 16px" }}>
                      {usersError ? `Supabase Notice: ${usersError}` : "No student recovery profiles found in database."}
                    </p>
                    <div style={{ maxWidth: "600px", margin: "0 auto", padding: "16px", background: "#fdf8f2", border: "1px solid #fbd5d5", borderRadius: "8px", textAlign: "left", fontSize: "12px", color: "#222" }}>
                      <strong style={{ color: "#c27803" }}>Setup Required:</strong> Run this script in your Supabase SQL editor to unlock student credentials & recovery permissions:
                      <pre style={{ background: "#272822", color: "#f8f8f2", padding: "10px", borderRadius: "4px", marginTop: "8px", overflowX: "auto", fontSize: "11px" }}>
{`-- 1. Ensure all columns exist
ALTER TABLE IF EXISTS public.registered_users ADD COLUMN IF NOT EXISTS recovery_code text;
ALTER TABLE IF EXISTS public.registered_users ADD COLUMN IF NOT EXISTS favourite_place text;
ALTER TABLE IF EXISTS public.registered_users ADD COLUMN IF NOT EXISTS firstname_yob text;

-- 2. Unlock permissions for Admin viewing
ALTER TABLE public.registered_users DISABLE ROW LEVEL SECURITY;`}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── BROADCAST UPDATES / NOTIFICATIONS TAB ── */}
            {activeTab === "broadcast" && (
              <div style={{ animation: "fadeIn 0.2s ease-out" }}>
                <div style={{ marginBottom: "20px" }}>
                  <h3 style={{ margin: "0 0 6px", fontSize: "20px", color: "#f8fafc", fontWeight: 700 }}>
                    📢 Broadcast Platform Announcements &amp; Updates
                  </h3>
                  <p style={{ margin: 0, fontSize: "13.5px", color: "#94a3b8" }}>
                    Type an announcement, exam amendment notice, or reply to student feedback. All registered users and guest students will instantly see this in their 🔔 notification inbox.
                  </p>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "24px", alignItems: "start" }}>
                  
                  {/* Broadcast Composer */}
                  <div className="card" style={{ background: "rgba(15, 23, 42, 0.8)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "14px", padding: "24px", boxShadow: "0 10px 30px rgba(0,0,0,0.3)" }}>
                    <form onSubmit={handleSendBroadcast}>
                      
                      {/* Target Audience */}
                      <div style={{ marginBottom: "18px" }}>
                        <label style={{ display: "block", fontSize: "12.5px", fontWeight: 600, color: "#cbd5e1", marginBottom: "6px" }}>
                          Target Audience:
                        </label>
                        <select
                          value={broadcastTarget}
                          onChange={(e) => setBroadcastTarget(e.target.value)}
                          style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", background: "#1e293b", border: "1px solid rgba(255,255,255,0.15)", color: "#f8fafc", fontSize: "13.5px" }}
                        >
                          <option value="all">📢 All Users (Global Broadcast to Everyone)</option>
                          <optgroup label="Direct Student Reply">
                            {registeredUsers.map((u) => (
                              <option key={u.id} value={u.username}>
                                👤 {u.username} ({u.favourite_place || "Registered Student"})
                              </option>
                            ))}
                          </optgroup>
                        </select>
                      </div>

                      {/* Announcement Title */}
                      <div style={{ marginBottom: "18px" }}>
                        <label style={{ display: "block", fontSize: "12.5px", fontWeight: 600, color: "#cbd5e1", marginBottom: "6px" }}>
                          Update / Announcement Title:
                        </label>
                        <input
                          type="text"
                          value={broadcastTitle}
                          onChange={(e) => setBroadcastTitle(e.target.value)}
                          placeholder="e.g., 🎉 New ICAI SPOM Set A Case Scenarios Added!"
                          style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", background: "#1e293b", border: "1px solid rgba(255,255,255,0.15)", color: "#f8fafc", fontSize: "13.5px", boxSizing: "border-box" }}
                        />
                      </div>

                      {/* Announcement Message Body */}
                      <div style={{ marginBottom: "20px" }}>
                        <label style={{ display: "block", fontSize: "12.5px", fontWeight: 600, color: "#cbd5e1", marginBottom: "6px" }}>
                          Announcement Message Body:
                        </label>
                        <textarea
                          value={broadcastMessage}
                          onChange={(e) => setBroadcastMessage(e.target.value)}
                          placeholder="Type your message, exam amendment notes, or replies to student queries..."
                          rows={6}
                          required
                          style={{ width: "100%", padding: "12px 14px", borderRadius: "8px", background: "#1e293b", border: "1px solid rgba(255,255,255,0.15)", color: "#f8fafc", fontSize: "13.5px", boxSizing: "border-box", resize: "vertical", fontFamily: "inherit" }}
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={broadcastSending}
                        style={{
                          width: "100%",
                          padding: "12px",
                          background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
                          color: "#fff",
                          border: "none",
                          borderRadius: "8px",
                          fontWeight: 700,
                          fontSize: "14px",
                          cursor: "pointer",
                          boxShadow: "0 4px 14px rgba(37,99,235,0.4)"
                        }}
                      >
                        {broadcastSending ? "Sending Broadcast..." : "🚀 Send Broadcast Announcement"}
                      </button>
                    </form>
                  </div>

                  {/* Live Student Preview Box */}
                  <div style={{ background: "rgba(15, 23, 42, 0.6)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "14px", padding: "20px" }}>
                    <h4 style={{ margin: "0 0 12px", fontSize: "13px", color: "#38bdf8", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      Live Student View Preview
                    </h4>
                    <div style={{ background: "#ffffff", borderRadius: "10px", padding: "14px", color: "#0f172a", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                        <span style={{ fontSize: "11px", fontWeight: 700, color: "#2563eb", background: "#eff6ff", padding: "2px 8px", borderRadius: "4px" }}>
                          🔔 Notification
                        </span>
                        <span style={{ fontSize: "10.5px", color: "#64748b" }}>Just now</span>
                      </div>
                      <div style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a", marginBottom: "4px" }}>
                        {broadcastTitle || "📢 Platform Update"}
                      </div>
                      <div style={{ fontSize: "12.5px", color: "#334155", lineHeight: "1.5", whiteSpace: "pre-wrap" }}>
                        {broadcastMessage || "Students will see your typed announcement right here."}
                      </div>
                    </div>
                  </div>

                </div>

                {/* Sent Broadcasts History */}
                <div style={{ marginTop: "32px", background: "rgba(15, 23, 42, 0.8)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "14px", padding: "24px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                    <div>
                      <h4 style={{ margin: "0 0 4px", fontSize: "16px", color: "#f8fafc", fontWeight: 700 }}>
                        📋 Dispatched Announcements &amp; Broadcast History
                      </h4>
                      <p style={{ margin: 0, fontSize: "12.5px", color: "#94a3b8" }}>
                        All active announcements currently visible to registered students and visitors in their 🔔 notification inboxes.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => loadSentBroadcasts()}
                      style={{
                        background: "rgba(255, 255, 255, 0.08)",
                        border: "1px solid rgba(255, 255, 255, 0.15)",
                        color: "#94a3b8",
                        padding: "6px 12px",
                        borderRadius: "6px",
                        fontSize: "12px",
                        cursor: "pointer",
                        fontWeight: 600
                      }}
                    >
                      🔄 Refresh History
                    </button>
                  </div>

                  {sentBroadcasts.length === 0 ? (
                    <div style={{ padding: "24px", textAlign: "center", color: "#64748b", background: "rgba(0,0,0,0.2)", borderRadius: "10px" }}>
                      No broadcast announcements dispatched yet.
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      {sentBroadcasts.map((b) => (
                        <div
                          key={b.id}
                          style={{
                            padding: "14px 18px",
                            background: "rgba(30, 41, 59, 0.6)",
                            border: "1px solid rgba(255,255,255,0.08)",
                            borderRadius: "10px",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            gap: "16px"
                          }}
                        >
                          <div style={{ flex: 1 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                              <span style={{
                                fontSize: "11px",
                                fontWeight: 700,
                                padding: "2px 8px",
                                borderRadius: "4px",
                                background: b.username === "all" ? "rgba(59, 130, 246, 0.2)" : "rgba(168, 85, 247, 0.2)",
                                color: b.username === "all" ? "#60a5fa" : "#c084fc"
                              }}>
                                {b.username === "all" ? "📢 Global Broadcast" : `👤 To: ${b.username}`}
                              </span>
                              <span style={{ fontSize: "11.5px", color: "#64748b" }}>
                                {b.created_at ? new Date(b.created_at).toLocaleString("en-IN") : "Recent"}
                              </span>
                            </div>
                            <div style={{ fontSize: "13px", color: "#e2e8f0", whiteSpace: "pre-wrap", lineHeight: "1.5" }}>
                              {b.message}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeleteBroadcast(b.id)}
                            style={{
                              background: "rgba(239, 68, 68, 0.15)",
                              border: "1px solid rgba(239, 68, 68, 0.3)",
                              color: "#f87171",
                              padding: "6px 12px",
                              borderRadius: "6px",
                              fontSize: "12px",
                              cursor: "pointer",
                              fontWeight: 600,
                              whiteSpace: "nowrap"
                            }}
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Supabase SQL Helper */}
                  <div style={{ marginTop: "24px", padding: "16px", background: "rgba(0,0,0,0.35)", borderRadius: "10px", border: "1px dashed rgba(255,255,255,0.15)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                      <span style={{ fontSize: "14px" }}>💡</span>
                      <span style={{ fontSize: "12px", fontWeight: 700, color: "#38bdf8" }}>
                        Supabase Database Setup Note
                      </span>
                    </div>
                    <p style={{ margin: "0 0 10px", fontSize: "12px", color: "#94a3b8", lineHeight: "1.5" }}>
                      Broadcasts are saved into the <code style={{ color: "#f1f5f9" }}>public.user_notifications</code> table in Supabase. Run the script in <code style={{ color: "#f1f5f9" }}>supabase_notifications.sql</code> in your Supabase SQL Editor if you haven't created the table yet.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Feedback Detail Popover Modal */}
            {activeFeedbackDetails && (
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
                  maxWidth: "520px",
                  width: "100%",
                  boxShadow: "0 10px 30px rgba(0,0,0,0.2)"
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", borderBottom: "1px solid #e1e4eb", paddingBottom: "12px" }}>
                    <h3 style={{ fontSize: "16px", color: "var(--navy)", fontWeight: 700, margin: 0 }}>
                      📝 Student Feedback Details
                    </h3>
                    <span style={{ fontSize: "11px", background: "#fbf6ec", color: "#8a7544", padding: "3px 8px", borderRadius: "4px", fontWeight: "600" }}>
                      {activeFeedbackDetails.type}
                    </span>
                  </div>

                  <div style={{ marginBottom: "20px", textAlign: "left" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12.5px", color: "#6b7280", marginBottom: "8px" }}>
                      <span>Student: <b style={{ color: "var(--navy)" }}>👤 {activeFeedbackDetails.student}</b></span>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        {activeFeedbackDetails.rating ? (
                          <span style={{ color: "#b45309", fontWeight: 700, fontSize: "12px" }}>
                            {"⭐".repeat(Math.min(5, Math.max(1, activeFeedbackDetails.rating)))} ({activeFeedbackDetails.rating}/5)
                          </span>
                        ) : null}
                        <span>Submitted: {activeFeedbackDetails.date}</span>
                      </div>
                    </div>
                    <div style={{
                      padding: "16px",
                      background: "#f9fafb",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      fontSize: "13.5px",
                      color: "#1f2937",
                      lineHeight: "1.6",
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word"
                    }}>
                      "{activeFeedbackDetails.comment}"
                    </div>
                  </div>

                  <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                    <button
                      type="button"
                      className="btn-admin remove"
                      style={{ padding: "8px 14px", fontSize: "12.5px", height: "36px", border: "1px solid #fecaca", color: "#dc2626", background: "#fef2f2", cursor: "pointer", borderRadius: "6px" }}
                      onClick={() => {
                        if (window.confirm("Are you sure you want to permanently delete this feedback from the database?")) {
                          handleResolveFeedback(activeFeedbackDetails.id);
                          setActiveFeedbackDetails(null);
                        }
                      }}
                    >
                      Delete from DB
                    </button>
                    <button
                      type="button"
                      className="btn-admin keep"
                      style={{ padding: "8px 14px", fontSize: "12.5px", height: "36px", border: "1px solid #e1e4eb", cursor: "pointer", borderRadius: "6px" }}
                      onClick={() => setActiveFeedbackDetails(null)}
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
