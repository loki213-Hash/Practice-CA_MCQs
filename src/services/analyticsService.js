import { supabase } from "../supabase/supabase";

const VISITOR_STORAGE_KEY = "ca_quiz_visitor_uuid";
const SESSION_STORAGE_KEY = "ca_quiz_session_id";
const SESSION_START_KEY = "ca_quiz_session_start_time";
const LOCAL_ANALYTICS_KEY = "ca_quiz_local_analytics_log";
const LOCAL_PEAKS_KEY = "ca_quiz_local_traffic_peaks";
const HEARTBEAT_DEDUP_WINDOW_MS = 2_000;
const ANALYTICS_PAGE_SIZE = 1_000;

// React Strict Mode intentionally mounts effects twice in development. Keep a
// short, module-level dedupe window so that one browser session is not recorded
// twice before the database unique constraint can protect it.
const recentHeartbeatRequests = new Map();

function isUuid(value) {
  return typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function isAdminUsername(username) {
  return typeof username === "string" && username.trim().toLowerCase() === "admin";
}

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
 * Get or initialize persistent browser session ID
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
 * Get or initialize session start timestamp (persists for entire active session, never resets on refresh)
 */
export function getOrCreateSessionStartTime() {
  try {
    let startTime = sessionStorage.getItem(SESSION_START_KEY);
    if (!startTime) {
      startTime = new Date().toISOString();
      sessionStorage.setItem(SESSION_START_KEY, startTime);
    }
    return startTime;
  } catch {
    return new Date().toISOString();
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
 * Helper: Resolve user identity accurately from active props, user_metadata, email, or cached profile
 */
export function resolveUserIdentity({ user = null, username = null } = {}) {
  let cachedUser = null;
  try {
    const raw = localStorage.getItem("ca_quiz_user_profile");
    if (raw) cachedUser = JSON.parse(raw);
  } catch {
    // ignore
  }

  const activeUser = user || cachedUser;
  const userId = isUuid(activeUser?.id) ? activeUser.id : null;
  const isAdminUser = Boolean(
    (user && (user.email === "admin.caquiz@gmail.com" || isAdminUsername(user.user_metadata?.username))) ||
    isAdminUsername(username) ||
    (cachedUser && (cachedUser.email === "admin.caquiz@gmail.com" || isAdminUsername(cachedUser.username)))
  );

  // user_id is a UUID foreign key in Supabase. Never send synthetic values such
  // as "admin-session" or username-derived IDs: Postgres rejects those writes,
  // which made a real admin disappear from the heartbeat fallback.
  if (isAdminUser && userId) {
    return {
      isAuth: true,
      userId,
      username: "admin",
      isAdmin: true,
    };
  }

  const isAuth = Boolean(userId);
  
  let resolvedName = "Guest";
  if (isAuth) {
    if (username && username !== "Guest" && username !== "Student") {
      resolvedName = username;
    } else if (activeUser?.username && activeUser.username !== "Guest" && activeUser.username !== "Student") {
      resolvedName = activeUser.username;
    } else if (activeUser?.user_metadata?.username) {
      resolvedName = activeUser.user_metadata.username;
    } else if (activeUser?.email) {
      resolvedName = activeUser.email.split("@")[0].replace(".caquiz", "");
    } else {
      resolvedName = "Student";
    }
  }

  return {
    isAuth,
    userId,
    username: resolvedName,
    isAdmin: false,
  };
}

/**
 * Record or update visit heartbeat in Supabase and local cache
 */
export async function recordVisitAndHeartbeat({ user = null, username = null, pagePath = "/" } = {}) {
  const visitorId = getOrCreateVisitorId();
  const sessionId = getOrCreateSessionId();
  const deviceType = getDeviceType();
  const userAgent = typeof navigator !== "undefined" ? navigator.userAgent : "";
  const identity = resolveUserIdentity({ user, username });
  const now = new Date().toISOString();

  const record = {
    visitor_id: visitorId,
    user_id: identity.userId,
    username: identity.username,
    is_authenticated: identity.isAuth,
    session_id: sessionId,
    entry_path: pagePath,
    current_path: pagePath,
    device_type: deviceType,
    user_agent: userAgent.substring(0, 255),
    last_seen_at: now,
  };

  const dedupeKey = `${visitorId}:${sessionId}`;
  const fingerprint = `${identity.userId || "guest"}:${identity.username}:${identity.isAuth}:${identity.isAdmin}:${pagePath}`;
  const previous = recentHeartbeatRequests.get(dedupeKey);
  if (previous && previous.fingerprint === fingerprint && Date.now() - previous.at < HEARTBEAT_DEDUP_WINDOW_MS) {
    return previous.promise;
  }

  const writePromise = (async () => {
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
          created_at: now,
        });
      }
      saveLocalAnalytics(local);
    } catch (err) {
      console.warn("Local analytics heartbeat error:", err);
    }

    // 2. One atomic upsert per browser session. The SQL migration adds the
    // required unique index. The fallback keeps deployments safe until the
    // migration is applied to an older project.
    const visitRow = record;

    try {
      const { error: upsertError } = await supabase
        .from("site_analytics_visits")
        .upsert(visitRow, { onConflict: "visitor_id,session_id" });

      if (!upsertError) {
        return { success: true, missingTable: false };
      }

      const { data: existing, error: selectErr } = await supabase
        .from("site_analytics_visits")
        .select("id")
        .eq("visitor_id", visitorId)
        .eq("session_id", sessionId)
        .order("last_seen_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (selectErr) {
        console.warn("Analytics heartbeat could not be stored:", upsertError.message || upsertError);
        return { success: false, missingTable: true };
      }

      if (existing?.id) {
        const { error: updateErr } = await supabase
          .from("site_analytics_visits")
          .update(record)
          .eq("id", existing.id);
        return { success: !updateErr, missingTable: Boolean(updateErr) };
      }

      const { error: insertErr } = await supabase
        .from("site_analytics_visits")
        .insert({ ...visitRow, created_at: now });
      return { success: !insertErr, missingTable: Boolean(insertErr) };
    } catch (err) {
      console.warn("Analytics heartbeat error:", err);
      return { success: false, missingTable: true };
    }
  })();

  recentHeartbeatRequests.set(dedupeKey, {
    fingerprint,
    at: Date.now(),
    promise: writePromise,
  });

  return writePromise;
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
async function fetchAnalyticsVisitRows({ since = null, columns }) {
  const rows = [];
  let offset = 0;

  while (true) {
    let query = supabase
      .from("site_analytics_visits")
      .select(columns)
      .order("last_seen_at", { ascending: false })
      .order("id", { ascending: false })
      .range(offset, offset + ANALYTICS_PAGE_SIZE - 1);

    if (since) query = query.gte("last_seen_at", since);

    const { data, error } = await query;
    if (error) throw error;

    rows.push(...(data || []));
    if (!data || data.length < ANALYTICS_PAGE_SIZE) return rows;
    offset += ANALYTICS_PAGE_SIZE;
  }
}

function countVisitMetrics(rows) {
  const latestVisitByVisitor = new Map();
  const uniqueSessionIds = new Set();
  const authenticatedStudentIds = new Set();

  for (const row of rows) {
    if (row.session_id) {
      uniqueSessionIds.add(row.session_id);
    } else if (row.id) {
      // Legacy rows created before session IDs were introduced still represent
      // one session each and must not disappear from the count.
      uniqueSessionIds.add(`legacy-${row.id}`);
    }

    if (row.visitor_id && !latestVisitByVisitor.has(row.visitor_id)) {
      latestVisitByVisitor.set(row.visitor_id, row);
    }

    if (row.is_authenticated && row.user_id && !isAdminUsername(row.username)) {
      authenticatedStudentIds.add(row.user_id);
    }
  }

  let desktopCount24h = 0;
  let mobileCount24h = 0;
  let guestVisits24h = 0;
  latestVisitByVisitor.forEach((row) => {
    if (row.device_type === "Mobile" || row.device_type === "Tablet") {
      mobileCount24h++;
    } else {
      desktopCount24h++;
    }
    if (!row.is_authenticated) guestVisits24h++;
  });

  return {
    uniqueVisitors: latestVisitByVisitor.size,
    distinctStudents: authenticatedStudentIds.size,
    totalSessions: uniqueSessionIds.size,
    guestVisits: guestVisits24h,
    desktopCount: desktopCount24h,
    mobileCount: mobileCount24h,
  };
}

export async function fetchAnalyticsMetrics() {
  const now = new Date();
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  let isTableMissing = false;

  let uniqueVisitors24h;
  let distinctLoggedIn24h;
  let allTimeUniqueVisitors;
  let peakLoggedIn24h = 0;
  let peakTotal24h = 0;
  let totalSessions24h;
  let guestVisits24h;
  let desktopCount24h;
  let mobileCount24h;

  try {
    // Fetch all pages, rather than Supabase's first 1,000 rows only. That
    // keeps all-time unique visitors and busy 24h windows exact.
    const recentVisits = await fetchAnalyticsVisitRows({
      since: twentyFourHoursAgo,
      columns: "id, visitor_id, user_id, username, is_authenticated, session_id, device_type, last_seen_at",
    });
    const recentMetrics = countVisitMetrics(recentVisits);
    uniqueVisitors24h = recentMetrics.uniqueVisitors;
    distinctLoggedIn24h = recentMetrics.distinctStudents;
    totalSessions24h = recentMetrics.totalSessions;
    guestVisits24h = recentMetrics.guestVisits;
    desktopCount24h = recentMetrics.desktopCount;
    mobileCount24h = recentMetrics.mobileCount;

    const allVisits = await fetchAnalyticsVisitRows({
      columns: "id, visitor_id, last_seen_at",
    });
    allTimeUniqueVisitors = new Set(allVisits.map((visit) => visit.visitor_id).filter(Boolean)).size;

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
    isTableMissing = true;
    console.warn("Supabase analytics query fallback to local cache:", err?.message || err);
    // Fallback: Read local storage analytics cache
    const local = getLocalAnalytics();
    const localPeaks = getLocalPeaks();
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;

    const recentLocal = local.filter((r) => new Date(r.last_seen_at).getTime() >= cutoff);
    const localMetrics = countVisitMetrics(recentLocal);
    const allVIds = new Set(local.map((r) => r.visitor_id).filter(Boolean));

    uniqueVisitors24h = localMetrics.uniqueVisitors;
    distinctLoggedIn24h = localMetrics.distinctStudents;
    allTimeUniqueVisitors = Math.max(allVIds.size, uniqueVisitors24h);
    totalSessions24h = localMetrics.totalSessions;
    guestVisits24h = localMetrics.guestVisits;
    desktopCount24h = localMetrics.desktopCount;
    mobileCount24h = localMetrics.mobileCount;
    peakLoggedIn24h = localPeaks.loggedIn24h || (distinctLoggedIn24h > 0 ? 1 : 0);
    peakTotal24h = localPeaks.total24h || (uniqueVisitors24h > 0 ? 1 : 0);
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

// ── Shared Singleton Presence Management ─────────────────────────────────────
let globalPresenceChannel = null;
let currentTrackedPayload = null;
const presenceListeners = new Set();
let latestPresenceData = {
  liveTotalCount: 0,
  liveLoggedInCount: 0,
  liveAdminCount: 0,
  liveStudentCount: 0,
  liveGuestCount: 0,
  activeVisitors: [],
};

function dispatchPresenceChange(data) {
  latestPresenceData = data;
  presenceListeners.forEach((listener) => {
    try {
      listener(data);
    } catch (err) {
      console.warn("Presence listener notice:", err);
    }
  });
}

function processPresenceState(channel) {
  if (!channel) return;
  try {
    const state = channel.presenceState();
    const activeVisitors = [];
    const sessionStartTime = getOrCreateSessionStartTime();

    Object.keys(state).forEach((key) => {
      const presences = state[key];
      if (Array.isArray(presences) && presences.length > 0) {
        // One presence key represents one browser/device. Prefer the most
        // informative tab state so an initial guest heartbeat cannot hide a
        // later authenticated admin or student update from the live roster.
        const chosen = presences.find((p) => p.is_admin) ||
          presences.find((p) => p.is_logged_in) ||
          presences[presences.length - 1];
        const isAuth = Boolean(chosen.is_logged_in);
        const visitorId = chosen.visitor_id || key;

        activeVisitors.push({
          key,
          visitor_id: visitorId,
          user_id: chosen.user_id || null,
          username: chosen.username || (isAuth ? "Student" : "Guest"),
          is_logged_in: isAuth,
          is_admin: Boolean(chosen.is_admin),
          page_path: chosen.page_path || "/",
          device_type: chosen.device_type || "Desktop",
          online_at: chosen.online_at || sessionStartTime,
          last_seen_at: chosen.last_seen_at || new Date().toISOString(),
        });
      }
    });

    const liveTotalCount = activeVisitors.length;
    const liveAdminCount = activeVisitors.filter((visitor) => visitor.is_admin).length;
    const liveStudentCount = activeVisitors.filter((visitor) => visitor.is_logged_in && !visitor.is_admin).length;
    const liveLoggedInCount = liveAdminCount + liveStudentCount;
    const liveGuestCount = activeVisitors.filter((visitor) => !visitor.is_logged_in).length;

    // Record peaks if live count exceeds previous peak
    recordPeakSnapshot("logged_in_concurrent", liveLoggedInCount);
    recordPeakSnapshot("total_concurrent", liveTotalCount);

    const payload = {
      liveTotalCount,
      liveLoggedInCount,
      liveAdminCount,
      liveStudentCount,
      liveGuestCount,
      activeVisitors,
    };

    dispatchPresenceChange(payload);
  } catch (e) {
    console.warn("Error processing presence state:", e);
  }
}

function getOrCreatePresenceChannel(visitorId) {
  if (globalPresenceChannel) {
    return globalPresenceChannel;
  }

  // Check if channel already exists in Supabase client to avoid duplicate registration error
  try {
    const existingChannels = supabase.getChannels ? supabase.getChannels() : [];
    const prev = existingChannels.find((ch) => ch.topic === "realtime:site_presence");
    if (prev) {
      globalPresenceChannel = prev;
      return prev;
    }
  } catch {
    // ignore
  }

  const channel = supabase.channel("site_presence", {
    config: {
      presence: {
        key: visitorId,
      },
    },
  });

  // Attach all presence event handlers BEFORE subscribe()
  channel
    .on("presence", { event: "sync" }, () => {
      processPresenceState(channel);
    })
    .on("presence", { event: "join" }, () => {
      processPresenceState(channel);
    })
    .on("presence", { event: "leave" }, () => {
      processPresenceState(channel);
    })
    .subscribe((status) => {
      if (status === "SUBSCRIBED") {
        if (currentTrackedPayload) {
          channel.track(currentTrackedPayload).catch(() => {});
        }
        processPresenceState(channel);
      }
    });

  globalPresenceChannel = channel;
  return channel;
}

/**
 * Setup Realtime Presence Channel for instant live synchronization
 * Safe across multiple components, route changes, and admin monitor
 * @param {Object} options - { user, username, pagePath, onPresenceChange }
 */
export function setupRealtimePresence({ user = null, username = null, pagePath = "/", onPresenceChange = null }) {
  const visitorId = getOrCreateVisitorId();
  const sessionStartTime = getOrCreateSessionStartTime();
  const deviceType = getDeviceType();

  const channel = getOrCreatePresenceChannel(visitorId);

  // Register listener callback if supplied
  if (typeof onPresenceChange === "function") {
    presenceListeners.add(onPresenceChange);
    // Immediately deliver current snapshot if already available
    if (latestPresenceData.liveTotalCount > 0 || latestPresenceData.activeVisitors.length > 0) {
      try {
        onPresenceChange(latestPresenceData);
      } catch (err) {
        console.warn("Immediate presence listener error:", err);
      }
    }
  }

  const trackState = async (customProps = {}) => {
    const targetUser = customProps.user !== undefined ? customProps.user : user;
    const targetUsername = customProps.username !== undefined ? customProps.username : username;
    const targetPath = customProps.pagePath !== undefined ? customProps.pagePath : pagePath;
    const identity = resolveUserIdentity({ user: targetUser, username: targetUsername });

    let cleanPath;
    try {
      cleanPath = decodeURI(targetPath);
    } catch {
      cleanPath = targetPath;
    }

    const payload = {
      visitor_id: visitorId,
      user_id: identity.userId,
      username: identity.username,
      is_logged_in: identity.isAuth,
      is_admin: identity.isAdmin,
      page_path: cleanPath,
      device_type: deviceType,
      online_at: sessionStartTime,
      last_seen_at: new Date().toISOString(),
    };

    currentTrackedPayload = payload;

    const attemptTrack = async (retries = 8) => {
      try {
        if (channel.state === "joined" || channel.status === "SUBSCRIBED") {
          await channel.track(payload);
        } else if (retries > 0) {
          setTimeout(() => attemptTrack(retries - 1), 400);
        }
      } catch (e) {
        if (retries > 0) {
          setTimeout(() => attemptTrack(retries - 1), 400);
        } else {
          console.warn("Could not update presence track:", e);
        }
      }
    };

    attemptTrack();
  };

  // Track state immediately
  trackState();

  const updatePresence = async (newProps = {}) => {
    await trackState(newProps);
  };

  const unsubscribe = () => {
    if (typeof onPresenceChange === "function") {
      presenceListeners.delete(onPresenceChange);
    }
  };

  return {
    channel,
    updatePresence,
    unsubscribe,
  };
}

/**
 * Direct DB active visitors fetch (cold-load fallback only — uses tight 45s window)
 * 45s = 1.5× the 30s heartbeat interval. Any user who hasn't heartbeated in 45s is gone.
 */
export async function fetchLiveActiveVisitors() {
  const ninetySecondsAgo = new Date(Date.now() - 90 * 1000).toISOString();
  try {
    const { data, error } = await supabase
      .from("site_analytics_visits")
      .select("visitor_id, user_id, username, is_authenticated, current_path, device_type, created_at, last_seen_at")
      .gte("last_seen_at", ninetySecondsAgo)
      .order("last_seen_at", { ascending: false });

    if (!error && data) {
      const visitorMap = new Map();
      data.forEach((row) => {
        if (row.visitor_id && !visitorMap.has(row.visitor_id)) {
          const isAdm = row.username?.toLowerCase() === "admin" || row.user_id === "admin";
          visitorMap.set(row.visitor_id, {
            key: row.visitor_id,
            visitor_id: row.visitor_id,
            user_id: row.user_id,
            username: isAdm ? "admin" : (row.username || (row.is_authenticated ? "Student" : "Guest")),
            is_logged_in: Boolean(row.is_authenticated || isAdm),
            page_path: row.current_path || "/",
            device_type: row.device_type || "Desktop",
            online_at: row.created_at || row.last_seen_at,
            last_seen_at: row.last_seen_at,
            is_admin: isAdm,
          });
        }
      });
      return Array.from(visitorMap.values());
    }
  } catch (err) {
    console.warn("Notice fetching active visits fallback:", err);
  }
  return [];
}
