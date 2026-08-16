import { supabase } from "../supabase/supabase";

/**
 * Submit user feedback on exam experience or question error.
 * Saves to Supabase 'student_feedback' table with graceful localStorage fallback.
 */
export async function submitFeedback({
  userId = null,
  username = "Guest",
  courseId = null,
  courseName = "",
  rating = 5,
  category = "General",
  message = "",
  testType = "take-test",
  scorePercent = null,
}) {
  const payload = {
    user_id: userId,
    username: username || "Guest",
    course_id: courseId,
    course_name: courseName,
    rating: Number(rating) || 5,
    category: category || "General",
    message: String(message || "").trim(),
    test_type: testType,
    score_percent: scorePercent,
    created_at: new Date().toISOString(),
  };

  // Always save to localStorage as local cache
  try {
    const existing = JSON.parse(localStorage.getItem("ca_quiz_student_feedbacks") || "[]");
    existing.unshift(payload);
    localStorage.setItem("ca_quiz_student_feedbacks", JSON.stringify(existing.slice(0, 100)));
  } catch (e) {
    console.warn("Local storage feedback save notice:", e);
  }

  // Attempt Supabase insert
  try {
    const { data, error } = await supabase
      .from("student_feedback")
      .insert([payload])
      .select();

    if (error) {
      console.warn("Supabase student_feedback notice:", error.message);
    }
    return { success: true, data };
  } catch (err) {
    console.warn("Supabase feedback insert error:", err);
    return { success: true, offline: true };
  }
}
