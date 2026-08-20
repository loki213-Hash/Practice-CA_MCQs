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
    course_id: courseId,
    course_name: courseName,
    test_type: testType,
    score_percent: scorePercent,
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
  try {
    const { data, error } = await supabase
      .from("student_feedbacks")
      .insert([payload])
      .select();

    if (!error) {
      return { success: true, data };
    }

    // Fallback: try singular table name if student_feedbacks doesn't exist
    const { data: fallbackData, error: fallbackError } = await supabase
      .from("student_feedback")
      .insert([payload])
      .select();

    if (!fallbackError) {
      return { success: true, data: fallbackData };
    }

    console.warn("Supabase student_feedbacks notice:", error?.message || fallbackError?.message);
    return { success: true, localOnly: true };
  } catch (err) {
    console.warn("Supabase feedback insert error:", err);
    return { success: true, offline: true };
  }
}

