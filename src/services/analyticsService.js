import { supabase } from "../supabase/supabase";

const VISITOR_STORAGE_KEY = "ca_quiz_visitor_uuid";
const SESSION_STORAGE_KEY = "ca_quiz_session_id";
const LOCAL_ANALYTICS_KEY = "ca_quiz_local_analytics_log";
const LOCAL_PEAKS_KEY = "ca_quiz_local_traffic_peaks";

/**
 * Get or initialize persistent unique device/visitor UUID
 */
export function getOrCreateVisitorId() {
  try {
    let vid = localStorage.getItem(VISITOR_STORAGE_KEY);
    if (!vid) {
      vid = "v_" + Date.now().toString(36) + "_" + Math.random().toString(36).substring(2, 10);
      localStorage.setItem(VISITOR_STORAGE_KEY, vid);
    }
    return vid;
  } catch {
    return "v_anon_" + Math.random().toString(36).substring(2, 10);
  }
}

/**
 * Get or initialize browser session ID
 */
export function getOrCreateSessionId() {
  try {
    let sid = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!sid) {
      sid = "s_" + Date.now().toString(36) + "_" + Math.random().toString(36).substring(2, 8);
      sessionStorage.setItem(SESSION_STORAGE_KEY, sid);
    }
    return sid;
  } catch {
    return "s_anon_" + Math.random().toString(36).substring(2, 8);
  }
}

/**
 * Detect client device type
 */
export function getDeviceType() {
  if (typeof navigator === "undefined") return "Desktop";
  const ua = navigator.userAgent;
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    return "Tablet";
  }
  if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated/i.test(ua)) {
    return "Mobile";
  }
  return "Desktop";
}

/**
 * Helper: Read local analytics visits cache
 */
function getLocalAnalytics() {
  try {
    const data = localStorage.getItem(LOCAL_ANALYTICS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

/**
 * Helper: Save local analytics visits cache
 */
function saveLocalAnalytics(records) {
  try {
    // Keep max 500 recent records in local storage
    const trimmed = records.slice(-500);
    localStorage.setItem(LOCAL_ANALYTICS_KEY, JSON.stringify(trimmed));
  } catch (e) {
    console.warn("Failed to write local analytics cache:", e);
  }
}

/**
 * Helper: Read local traffic peaks
 */
function getLocalPeaks() {
  try {
    const data = localStorage.getItem(LOCAL_PEAKS_KEY);
    return data ? JSON.parse(data) : { loggedIn24h: 0, total24h: 0, lastUpdated: 0 };
  } catch {
    return { loggedIn24h: 0, total24h: 0, lastUpdated: 0 };
  }
}

/**
 * Helper: Save local traffic peaks
 */
function saveLocalPeaks(peaks) {
  try {
    localStorage.setItem(LOCAL_PEAKS_KEY, JSON.stringify(peaks));
  } catch (e) {
    console.warn("Failed to save local peaks:", e);
  }
}

/**
 * Record or update visit heartbeat in Supabase and local cache
 */
export async function recordVisitAndHeartbeat({ user = null, username = "Guest", pagePath = "/" } = {}) {
  const visitorId = getOrCreateVisitorId();
  const sessionId = getOrCreateSessionId();
  const deviceType = getDeviceType();
  const userAgent = typeof navigator !== "undefined" ? navigator.userAgent : "";
  const isAuthenticated = Boolean(user && user.id);
  const cleanUsername = isAuthenticated ? (username || user.email?.split("@")[0] || "Student") : "Guest";
  const now = new Date().toISOString();

  const record = {
    visitor_id: visitorId,
    user_id: user?.id || null,
    username: cleanUsername,
    is_authenticated: isAuthenticated,
    session_id: sessionId,
    current_path: pagePath,
    device_type: deviceType,
    user_agent: userAgent.substring(0, 255),
    last_seen_at: now,
  };

  // 1. Update local cache
  try {
    const local = getLocalAnalytics();
    const existingIndex = local.findIndex((r) => r.visitor_id === visitorId && r.session_id === sessionId);
    if (existingIndex >= 0) {
      local[existingIndex] = {
        ...local[existingIndex],
        ...record,
      };
    } else {
      local.push({
        ...record,
        entry_path: pagePath,
        created_at: now,
      });
    }
    saveLocalAnalytics(local);
  } catch (err) {
    console.warn("Local analytics heartbeat error:", err);
  }

  // 2. Write to Supabase table
  try {
    // Check if session row exists for this visitor session in Supabase
    const { data: existing, error: selectErr } = await supabase
      .from("site_analytics_visits")
      .select("id")
      .eq("visitor_id", visitorId)
      .eq("session_id", sessionId)
      .maybeSingle();

    if (selectErr) {
      return { success: false, missingTable: true };
    }

    if (existing && existing.id) {
      // Update last_seen_at & path & auth info
      await supabase
        .from("site_analytics_visits")
        .update({
          user_id: user?.id || null,
          username: cleanUsername,
          is_authenticated: isAuthenticated,
          current_path: pagePath,
          device_type: deviceType,
          last_seen_at: now,
        })
        .eq("id", existing.id);
    } else {
      // Insert new session visit record
      await supabase
        .from("site_analytics_visits")
        .insert([
          {
            visitor_id: visitorId,
            user_id: user?.id || null,
            username: cleanUsername,
            is_authenticated: isAuthenticated,
            session_id: sessionId,
            entry_path: pagePath,
            current_path: pagePath,
            device_type: deviceType,
            user_agent: userAgent.substring(0, 255),
            created_at: now,
            last_seen_at: now,
          },
        ]);
    }
    return { success: true, missingTable: false };
  } catch {
    return { success: false, missingTable: true };
  }
}

/**
 * Record peak concurrency snapshot if current count exceeds the 24h record
 */
export async function recordPeakSnapshot(peakType, currentCount) {
  if (currentCount <= 0) return;
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

  // Update local peak cache
  const localPeaks = getLocalPeaks();
  if (peakType === "logged_in_concurrent") {
    if (currentCount > (localPeaks.loggedIn24h || 0)) {
      localPeaks.loggedIn24h = currentCount;
      localPeaks.lastUpdated = Date.now();
      saveLocalPeaks(localPeaks);
    }
  } else {
    if (currentCount > (localPeaks.total24h || 0)) {
      localPeaks.total24h = currentCount;
      localPeaks.lastUpdated = Date.now();
      saveLocalPeaks(localPeaks);
    }
  }

  // Record to Supabase
  try {
    const { data: maxPeakData } = await supabase
      .from("site_traffic_peaks")
      .select("peak_count")
      .eq("peak_type", peakType)
      .gte("recorded_at", oneDayAgo)
      .order("peak_count", { ascending: false })
      .limit(1);

    const highestIn24h = maxPeakData && maxPeakData.length > 0 ? maxPeakData[0].peak_count : 0;

    if (currentCount > highestIn24h) {
      await supabase
        .from("site_traffic_peaks")
        .insert([
          {
            peak_type: peakType,
            peak_count: currentCount,
            recorded_at: now.toISOString(),
          },
        ]);
    }
  } catch (err) {
    console.warn("Notice recording traffic peak to Supabase:", err);
  }
}

/**
 * Aggregate comprehensive 24-hour and all-time traffic statistics
 */
export async function fetchAnalyticsMetrics() {
  const now = new Date();
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  let isTableMissing = false;

  let uniqueVisitors24h = 0;
  let distinctLoggedIn24h = 0;
  let allTimeUniqueVisitors = 0;
  let peakLoggedIn24h = 0;
  let peakTotal24h = 0;
  let totalSessions24h = 0;
  let guestVisits24h = 0;
  let desktopCount24h = 0;
  let mobileCount24h = 0;

  try {
    // 1. Query site_analytics_visits for the past 24 hours
    const { data: recentVisits, error: visitErr } = await supabase
      .from("site_analytics_visits")
      .select("visitor_id, user_id, is_authenticated, device_type, last_seen_at")
      .gte("last_seen_at", twentyFourHoursAgo);

    if (visitErr) {
      isTableMissing = true;
      throw visitErr;
    }

    if (recentVisits) {
      totalSessions24h = recentVisits.length;
      const uniqueVIds24h = new Set();
      const uniqueUIds24h = new Set();

      recentVisits.forEach((r) => {
        if (r.visitor_id) uniqueVIds24h.add(r.visitor_id);
        if (r.is_authenticated && r.user_id) uniqueUIds24h.add(r.user_id);
        if (r.device_type === "Mobile" || r.device_type === "Tablet") {
          mobileCount24h++;
        } else {
          desktopCount24h++;
        }
        if (!r.is_authenticated) {
          guestVisits24h++;
        }
      });

      uniqueVisitors24h = uniqueVIds24h.size;
      distinctLoggedIn24h = uniqueUIds24h.size;
    }

    // 2. Query all-time unique visitors
    const { data: allVisits } = await supabase
      .from("site_analytics_visits")
      .select("visitor_id");

    if (allVisits) {
      const allVIds = new Set(allVisits.map((v) => v.visitor_id).filter(Boolean));
      allTimeUniqueVisitors = allVIds.size;
    }

    // 3. Query 24h Peak Logged In Users from site_traffic_peaks
    const { data: loggedPeakData } = await supabase
      .from("site_traffic_peaks")
      .select("peak_count")
      .eq("peak_type", "logged_in_concurrent")
      .gte("recorded_at", twentyFourHoursAgo)
      .order("peak_count", { ascending: false })
      .limit(1);

    if (loggedPeakData && loggedPeakData.length > 0) {
      peakLoggedIn24h = loggedPeakData[0].peak_count;
    }

    // 4. Query 24h Peak Total Visitors
    const { data: totalPeakData } = await supabase
      .from("site_traffic_peaks")
      .select("peak_count")
      .eq("peak_type", "total_concurrent")
      .gte("recorded_at", twentyFourHoursAgo)
      .order("peak_count", { ascending: false })
      .limit(1);

    if (totalPeakData && totalPeakData.length > 0) {
      peakTotal24h = totalPeakData[0].peak_count;
    }
  } catch (err) {
    console.warn("Supabase analytics query fallback to local cache:", err?.message || err);
    // Fallback: Read local storage analytics cache
    const local = getLocalAnalytics();
    const localPeaks = getLocalPeaks();
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;

    const recentLocal = local.filter((r) => new Date(r.last_seen_at).getTime() >= cutoff);
    const uniqueVIds24h = new Set(recentLocal.map((r) => r.visitor_id).filter(Boolean));
    const uniqueUIds24h = new Set(recentLocal.filter((r) => r.is_authenticated && r.user_id).map((r) => r.user_id));
    const allVIds = new Set(local.map((r) => r.visitor_id).filter(Boolean));

    uniqueVisitors24h = uniqueVIds24h.size;
    distinctLoggedIn24h = uniqueUIds24h.size;
    allTimeUniqueVisitors = Math.max(allVIds.size, uniqueVisitors24h);
    totalSessions24h = recentLocal.length;
    peakLoggedIn24h = localPeaks.loggedIn24h || Math.max(distinctLoggedIn24h, 1);
    peakTotal24h = localPeaks.total24h || Math.max(uniqueVisitors24h, 1);
  }

  // Cross-reference with user_progress attempts in past 24h to ensure no active logged in students are missed
  try {
    const { data: recentProgress } = await supabase
      .from("user_progress")
      .select("user_id")
      .gte("completed_at", twentyFourHoursAgo);

    if (recentProgress && recentProgress.length > 0) {
      const studentIdsFromProgress = new Set(recentProgress.map((p) => p.user_id).filter(Boolean));
      distinctLoggedIn24h = Math.max(distinctLoggedIn24h, studentIdsFromProgress.size);
    }
  } catch {
    // Ignore progress table check if network error
  }

  // Guarantee logical consistency (e.g. peak logged in is at least 1 if active, etc.)
  peakLoggedIn24h = Math.max(peakLoggedIn24h, distinctLoggedIn24h > 0 ? 1 : 0);
  peakTotal24h = Math.max(peakTotal24h, uniqueVisitors24h > 0 ? 1 : 0);
  allTimeUniqueVisitors = Math.max(allTimeUniqueVisitors, uniqueVisitors24h);

  return {
    isTableMissing,
    uniqueVisitors24h,
    distinctLoggedIn24h,
    allTimeUniqueVisitors,
    peakLoggedIn24h,
    peakTotal24h,
    totalSessions24h,
    guestVisits24h,
    desktopCount24h,
    mobileCount24h,
  };
}

/**
 * Setup Realtime Presence Channel for instant live synchronization
 * @param {Object} options - { user, username, pagePath, onPresenceChange }
 */
export function setupRealtimePresence({ user = null, username = "Guest", pagePath = "/", onPresenceChange = null }) {
  const visitorId = getOrCreateVisitorId();
  const isAuthenticated = Boolean(user && user.id);
  const cleanUsername = isAuthenticated ? (username || user.email?.split("@")[0] || "Student") : "Guest";
  const deviceType = getDeviceType();

  const channel = supabase.channel("site_presence", {
    config: {
      presence: {
        key: visitorId,
      },
    },
  });

  const handlePresenceState = () => {
    const state = channel.presenceState();
    const activeVisitors = [];
    const uniqueVisitorIds = new Set();
    const uniqueUserIds = new Set();

    Object.keys(state).forEach((key) => {
      const presences = state[key];
      if (Array.isArray(presences) && presences.length > 0) {
        const latest = presences[presences.length - 1];
        uniqueVisitorIds.add(latest.visitor_id || key);
        if (latest.is_logged_in && latest.user_id) {
          uniqueUserIds.add(latest.user_id);
        }
        activeVisitors.push({
          key,
          visitor_id: latest.visitor_id || key,
          user_id: latest.user_id || null,
          username: latest.username || "Guest",
          is_logged_in: Boolean(latest.is_logged_in),
          page_path: latest.page_path || "/",
          device_type: latest.device_type || "Desktop",
          online_at: latest.online_at || new Date().toISOString(),
        });
      }
    });

    const liveTotalCount = uniqueVisitorIds.size;
    const liveLoggedInCount = uniqueUserIds.size;
    const liveGuestCount = Math.max(0, liveTotalCount - liveLoggedInCount);

    // Record peaks if live count exceeds previous peak
    recordPeakSnapshot("logged_in_concurrent", liveLoggedInCount);
    recordPeakSnapshot("total_concurrent", liveTotalCount);

    if (typeof onPresenceChange === "function") {
      onPresenceChange({
        liveTotalCount,
        liveLoggedInCount,
        liveGuestCount,
        activeVisitors,
      });
    }
  };

  channel
    .on("presence", { event: "sync" }, () => {
      handlePresenceState();
    })
    .on("presence", { event: "join" }, () => {
      handlePresenceState();
    })
    .on("presence", { event: "leave" }, () => {
      handlePresenceState();
    })
    .subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        try {
          await channel.track({
            visitor_id: visitorId,
            user_id: user?.id || null,
            username: cleanUsername,
            is_logged_in: isAuthenticated,
            page_path: pagePath,
            device_type: deviceType,
            online_at: new Date().toISOString(),
          });
        } catch (trackErr) {
          console.warn("Presence track notice:", trackErr);
        }
      }
    });

  const updatePresence = async (newProps = {}) => {
    const updatedUser = newProps.user !== undefined ? newProps.user : user;
    const updatedUsername = newProps.username !== undefined ? newProps.username : username;
    const updatedPath = newProps.pagePath !== undefined ? newProps.pagePath : pagePath;
    const isAuth = Boolean(updatedUser && updatedUser.id);
    const resolvedName = isAuth ? (updatedUsername || updatedUser.email?.split("@")[0] || "Student") : "Guest";

    try {
      await channel.track({
        visitor_id: visitorId,
        user_id: updatedUser?.id || null,
        username: resolvedName,
        is_logged_in: isAuth,
        page_path: updatedPath,
        device_type: deviceType,
        online_at: new Date().toISOString(),
      });
    } catch (e) {
      console.warn("Could not update presence:", e);
    }
  };

  const unsubscribe = () => {
    try {
      channel.unsubscribe();
    } catch (e) {
      console.warn("Error unsubscribing presence channel:", e);
    }
  };

  return {
    channel,
    updatePresence,
    unsubscribe,
  };
}
