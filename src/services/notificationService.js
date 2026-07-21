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

export async function sendAppreciationNotification(username, message = "Thanks For the Contribution, We have addressed the Question") {
  const cleanUsername = username ? username.trim() : "";
  if (!cleanUsername) return false;

  try {
    // 1. Try to save to Supabase
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

  // 2. LocalStorage fallback
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

export async function getNotificationsForUser(username) {
  const cleanUsername = username ? username.trim() : "";
  if (!cleanUsername) return [];

  // 1. Try fetching from Supabase
  try {
    const { data, error } = await supabase
      .from("user_notifications")
      .select("*")
      .eq("username", cleanUsername)
      .order("created_at", { ascending: false });

    if (!error && data) {
      // Sync local notifications if any exist
      const localNotifs = getLocalNotifications().filter(n => n.username === cleanUsername);
      return [...localNotifs, ...data].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }
  } catch (err) {
    console.warn("Supabase notification fetch failed, using localStorage:", err);
  }

  // 2. Fetch from LocalStorage
  return getLocalNotifications()
    .filter((n) => n.username === cleanUsername)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

export async function markAsRead(id) {
  // If it's a numeric ID (Supabase) - delete the notification immediately to save database storage space
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

  // Fallback / local check: remove from localStorage
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
