import { supabase } from "../supabase/supabase";

/**
 * Submit user feedback on exam experience, platform suggestions, or question errors.
 * Saves to Supabase 'student_feedbacks' table (with 'student_feedback' fallback) and localStorage.
 */
export async function submitFeedback({
  userId = null,
  username = "Guest",
  courseId = null,
  courseName = "",
  rating = 5,
  category = "General",
  message = "",
  testType = "general",
  scorePercent = null,
}) {
  const cleanUsername = String(username || "Guest").trim();
  const cleanMessage = String(message || "").trim();
  const cleanCategory = String(category || "General Feedback").trim();
  const cleanRating = Number(rating) || 5;
  const now = new Date().toISOString();

  const payload = {
    user_id: userId || null,
    username: cleanUsername,
    message: cleanMessage,
    category: cleanCategory,
    rating: cleanRating,
    created_at: now,
  };

  // 1. Always save to localStorage as persistent local cache
  try {
    const existing = JSON.parse(localStorage.getItem("ca_quiz_student_feedbacks") || "[]");
    existing.unshift({
      ...payload,
      id: "local_" + Date.now(),
    });
    localStorage.setItem("ca_quiz_student_feedbacks", JSON.stringify(existing.slice(0, 100)));
  } catch (e) {
    console.warn("Local storage feedback save notice:", e);
  }

  // 2. Attempt Supabase insert into student_feedbacks table
  let inserted = false;
  try {
    const { data, error } = await supabase
      .from("student_feedbacks")
      .insert([payload])
      .select();

    if (!error && data) {
      inserted = true;
    } else if (error) {
      // Try with minimal columns if schema mismatch
      const { data: minData, error: minErr } = await supabase
        .from("student_feedbacks")
        .insert([{ username: cleanUsername, message: cleanMessage, created_at: now }])
        .select();
      if (!minErr && minData) inserted = true;
    }
  } catch (err) {
    console.warn("Supabase student_feedbacks insert error:", err);
  }

  // 3. Fallback: try student_feedback table
  if (!inserted) {
    try {
      const { data, error } = await supabase
        .from("student_feedback")
        .insert([payload])
        .select();

      if (!error && data) {
        inserted = true;
      } else if (error) {
        const { data: minData, error: minErr } = await supabase
          .from("student_feedback")
          .insert([{ username: cleanUsername, message: cleanMessage, created_at: now }])
          .select();
        if (!minErr && minData) inserted = true;
      }
    } catch (err) {
      console.warn("Supabase student_feedback insert error:", err);
    }
  }

  // Dispatch event for instant UI update
  try {
    window.dispatchEvent(new CustomEvent("ca_quiz_feedback_submitted", { detail: payload }));
  } catch {
    // quiet
  }

  return { success: true };
}

