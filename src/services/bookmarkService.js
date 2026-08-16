import { supabase } from "../supabase/supabase";

const LOCAL_BOOKMARKS_KEY = "ca_quiz_bookmarks";

// ── Helpers ──────────────────────────────────────────────────────────────────

function getLocalBookmarks() {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_BOOKMARKS_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveLocalBookmarks(items) {
  try {
    localStorage.setItem(LOCAL_BOOKMARKS_KEY, JSON.stringify(items));
  } catch (e) {
    console.warn("Failed to save local bookmarks:", e);
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Toggle bookmark on a question. Returns true if now bookmarked, false if removed.
 */
export async function toggleBookmark(question, chapterId) {
  const qId = String(question.id);
  const local = getLocalBookmarks();
  const existingIdx = local.findIndex((b) => b.question_id === qId);

  if (existingIdx !== -1) {
    // Already bookmarked → remove
    local.splice(existingIdx, 1);
    saveLocalBookmarks(local);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from("student_bookmarks")
          .delete()
          .eq("user_id", user.id)
          .eq("question_id", qId);
      }
    } catch (e) {
      console.warn("Bookmark remove notice:", e);
    }
    return false;
  }

  // Not bookmarked → add
  const item = {
    question_id: qId,
    chapter_id: String(chapterId || question.chapter_id || ""),
    question_text: question.question || question.text || "",
    option_a: question.option_a || "",
    option_b: question.option_b || "",
    option_c: question.option_c || "",
    option_d: question.option_d || "",
    correct_option: String(question.correct_option || "A").toUpperCase(),
    explanation: question.explanation || "",
    topic: question.topic || "General",
    sticky_note: "",
    created_at: new Date().toISOString(),
  };

  local.push(item);
  saveLocalBookmarks(local);

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("student_bookmarks").upsert(
        [{ user_id: user.id, ...item }],
        { onConflict: "user_id,question_id" }
      );
    }
  } catch (e) {
    console.warn("Bookmark add notice:", e);
  }

  return true;
}

/**
 * Check if a specific question is bookmarked (local cache check — instant).
 */
export function isQuestionBookmarkedSync(questionId) {
  const local = getLocalBookmarks();
  return local.some((b) => b.question_id === String(questionId));
}

/**
 * Get a Set of all bookmarked question IDs (for batch UI rendering).
 */
export function getBookmarkedIdsSync() {
  return new Set(getLocalBookmarks().map((b) => b.question_id));
}

/**
 * Fetch all bookmarks, merging Supabase DB + localStorage.
 */
export async function getAllBookmarks() {
  const local = getLocalBookmarks();

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data, error } = await supabase
        .from("student_bookmarks")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (!error && data && data.length > 0) {
        const dbIds = new Set(data.map((d) => d.question_id));
        const localOnly = local.filter((l) => !dbIds.has(l.question_id));
        // Sync DB bookmarks to local cache for instant subsequent reads
        const merged = [...data, ...localOnly];
        saveLocalBookmarks(merged);
        return merged;
      }
    }
  } catch (e) {
    console.warn("Bookmarks fetch notice:", e);
  }

  return local;
}

/**
 * Update the sticky note for a bookmarked question.
 */
export async function updateStickyNote(questionId, noteText) {
  const qId = String(questionId);
  const local = getLocalBookmarks();
  const idx = local.findIndex((b) => b.question_id === qId);
  if (idx !== -1) {
    local[idx].sticky_note = noteText;
    saveLocalBookmarks(local);
  }

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from("student_bookmarks")
        .update({ sticky_note: noteText })
        .eq("user_id", user.id)
        .eq("question_id", qId);
    }
  } catch (e) {
    console.warn("Sticky note update notice:", e);
  }
}

/**
 * Remove a bookmark by question ID.
 */
export async function removeBookmark(questionId) {
  const qId = String(questionId);
  const updated = getLocalBookmarks().filter((b) => b.question_id !== qId);
  saveLocalBookmarks(updated);

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from("student_bookmarks")
        .delete()
        .eq("user_id", user.id)
        .eq("question_id", qId);
    }
  } catch (e) {
    console.warn("Bookmark delete notice:", e);
  }
}

/**
 * Get bookmark count (for badges/nav).
 */
export async function getBookmarkCount() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { count } = await supabase
        .from("student_bookmarks")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);
      return count || 0;
    }
  } catch {
    // ignore
  }
  return getLocalBookmarks().length;
}
