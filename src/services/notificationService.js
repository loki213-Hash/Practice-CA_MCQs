import { supabase } from "../supabase/supabase";

const LOCAL_STORAGE_KEY = "ca_quiz_local_notifications";

// Helper to get local notifications
function getLocalNotifications() {
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error("Failed to read local notifications", e);
    return [];
  }
}

// Helper to save local notifications
function saveLocalNotifications(notifs) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(notifs));
  } catch (e) {
    console.error("Failed to write local notifications", e);
  }
}

/**
 * Send an appreciation notification or feedback reply to a specific user
 */
export async function sendAppreciationNotification(username, message = "Thanks For the Contribution, We have addressed the Question") {
  const cleanUsername = username ? username.trim() : "";
  if (!cleanUsername) return false;

  try {
    const { error } = await supabase
      .from("user_notifications")
      .insert([
        {
          username: cleanUsername,
          message: message,
          is_read: false,
          created_at: new Date().toISOString()
        }
      ]);

    if (!error) {
      return true;
    }
    console.warn("Supabase notification insert failed, falling back to localStorage:", error.message);
  } catch (err) {
    console.warn("Supabase notification insert threw error, falling back to localStorage:", err);
  }

  // LocalStorage fallback
  const notifs = getLocalNotifications();
  const newNotif = {
    id: Date.now() + Math.random().toString(36).substr(2, 5),
    username: cleanUsername,
    message: message,
    is_read: false,
    created_at: new Date().toISOString()
  };
  notifs.push(newNotif);
  saveLocalNotifications(notifs);
  return true;
}

/**
 * Broadcast an announcement or exam update to all registered users or specific students
 */
export async function broadcastNotification({ title, message, target = "all" }) {
  const fullMessage = title ? `📢 [${title}]\n${message}` : message;
  const targetUser = target ? target.trim() : "all";

  try {
    const { error } = await supabase
      .from("user_notifications")
      .insert([
        {
          username: targetUser,
          message: fullMessage,
          is_read: false,
          created_at: new Date().toISOString()
        }
      ]);

    if (!error) {
      return { success: true };
    }
    console.warn("Supabase broadcast notification notice:", error.message);
  } catch (err) {
    console.warn("Supabase broadcast error:", err);
  }

  // LocalStorage fallback
  const notifs = getLocalNotifications();
  const newNotif = {
    id: Date.now() + Math.random().toString(36).substr(2, 5),
    username: targetUser,
    message: fullMessage,
    is_read: false,
    created_at: new Date().toISOString()
  };
  notifs.unshift(newNotif);
  saveLocalNotifications(notifs);
  return { success: true, local: true };
}

/**
 * Fetch all notifications relevant to a user (including personal messages + global 'all' broadcasts)
 */
export async function getNotificationsForUser(username) {
  const cleanUsername = username ? username.trim().toLowerCase() : "guest";

  let dbNotifs = [];
  try {
    // Fetch notifications where username matches user OR username is 'all' or 'broadcast'
    const { data, error } = await supabase
      .from("user_notifications")
      .select("*")
      .or(`username.ilike.${cleanUsername},username.ilike.all,username.ilike.broadcast,username.is.null`)
      .order("created_at", { ascending: false });

    if (!error && data) {
      dbNotifs = data;
    }
  } catch (err) {
    console.warn("Supabase notification fetch failed, checking local:", err);
  }

  // Also include matching local storage notifications
  const localNotifs = getLocalNotifications().filter(
    (n) =>
      n.username === "all" ||
      n.username === "broadcast" ||
      n.username?.toLowerCase() === cleanUsername
  );

  // Combine and deduplicate by message + date
  const combined = [...localNotifs, ...dbNotifs];
  const seen = new Set();
  const deduplicated = [];

  for (const n of combined) {
    const key = `${n.id || n.message}_${n.created_at}`;
    if (!seen.has(key)) {
      seen.add(key);
      deduplicated.push(n);
    }
  }

  return deduplicated.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

export async function markAsRead(id) {
  if (typeof id === "number" || (!isNaN(id) && !String(id).includes("-"))) {
    try {
      const { error } = await supabase
        .from("user_notifications")
        .delete()
        .eq("id", Number(id));

      if (!error) return true;
    } catch (err) {
      console.warn("Supabase notification delete failed:", err);
    }
  }

  const notifs = getLocalNotifications();
  const filtered = notifs.filter((n) => String(n.id) !== String(id));
  saveLocalNotifications(filtered);
  return true;
}

export async function deleteNotification(id) {
  if (typeof id === "number" || (!isNaN(id) && !String(id).includes("-"))) {
    try {
      const { error } = await supabase
        .from("user_notifications")
        .delete()
        .eq("id", Number(id));

      if (!error) return true;
    } catch (err) {
      console.warn("Supabase notification delete failed:", err);
    }
  }

  const notifs = getLocalNotifications();
  const filtered = notifs.filter((n) => String(n.id) !== String(id));
  saveLocalNotifications(filtered);
  return true;
}
