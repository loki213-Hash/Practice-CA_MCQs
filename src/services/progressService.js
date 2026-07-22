import { supabase } from "../supabase/supabase";

export async function saveQuizAttempt({ chapterId, score, totalQuestions }) {
  const percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;
  const attemptObj = {
    chapter_id: chapterId,
    score,
    total_questions: totalQuestions,
    percentage,
    completed_at: new Date().toISOString(),
  };

  // Always save to localStorage progress cache first (ensures progress is saved for all users)
  try {
    const localAttempts = JSON.parse(localStorage.getItem("ca_quiz_local_attempts") || "[]");
    localAttempts.push(attemptObj);
    localStorage.setItem("ca_quiz_local_attempts", JSON.stringify(localAttempts));
  } catch (e) {
    console.warn("Failed to write local progress cache:", e);
  }

  // Dispatch custom browser event for real-time update across open components/tabs
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("ca_quiz_progress_updated"));
  }

  // Also save to Supabase if user is logged in
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data, error } = await supabase
        .from("user_progress")
        .insert([
          {
            user_id: user.id,
            ...attemptObj,
          },
        ]);
      if (error) console.warn("Supabase progress save error:", error.message);
      return data;
    }
  } catch (err) {
    console.warn("User progress save notice:", err);
  }

  return attemptObj;
}

export async function getUserProgressStats() {
  let attempts = [];

  // 1. Load from localStorage cache
  try {
    const localAttempts = JSON.parse(localStorage.getItem("ca_quiz_local_attempts") || "[]");
    attempts = [...localAttempts];
  } catch (e) {
    console.warn("Failed to read local progress:", e);
  }

  // 2. Load from Supabase if logged in
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: dbAttempts, error } = await supabase
        .from("user_progress")
        .select("chapter_id, percentage")
        .eq("user_id", user.id);
      if (!error && dbAttempts) {
        attempts = [...attempts, ...dbAttempts];
      }
    }
  } catch (e) {
    console.warn("Failed to fetch Supabase progress:", e);
  }

  if (!attempts || attempts.length === 0) {
    return { chapterCount: 0, averageAccuracy: 0, masteredChapterIds: [] };
  }

  // Filter out chapter_id: null or 0 which are dummy registration placeholders
  const activeAttempts = attempts.filter((attempt) => attempt.chapter_id !== null && attempt.chapter_id !== 0);

  if (activeAttempts.length === 0) {
    return { chapterCount: 0, averageAccuracy: 0, masteredChapterIds: [] };
  }

  // Group by chapter to find highest score per chapter
  const highestScoresByChapter = {};
  let totalPercentageSum = 0;

  activeAttempts.forEach((attempt) => {
    const cid = attempt.chapter_id;
    const score = attempt.percentage;
    if (highestScoresByChapter[cid] === undefined || score > highestScoresByChapter[cid]) {
      highestScoresByChapter[cid] = score;
    }
  });

  const uniqueChapters = Object.keys(highestScoresByChapter);
  uniqueChapters.forEach((cid) => {
    totalPercentageSum += highestScoresByChapter[cid];
  });

  const averageAccuracy = uniqueChapters.length > 0 ? Math.round(totalPercentageSum / uniqueChapters.length) : 0;
  const masteredChapterIds = uniqueChapters.filter((cid) => highestScoresByChapter[cid] >= 80).map(Number);

  return {
    chapterCount: uniqueChapters.length,
    averageAccuracy,
    masteredChapterIds,
  };
}

export async function initializeUserProgress() {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return;

  try {
    const { data: existing, error } = await supabase
      .from("user_progress")
      .select("id")
      .eq("user_id", user.id)
      .limit(1);

    if (!error && (!existing || existing.length === 0)) {
      await supabase
        .from("user_progress")
        .insert([
          {
            user_id: user.id,
            chapter_id: null, // Placeholder registration log (uses NULL instead of 0 to avoid foreign key errors)
            score: 0,
            total_questions: 0,
            percentage: 0,
            completed_at: new Date().toISOString()
          }
        ]);
    }
  } catch (err) {
    console.warn("Failed to initialize user progress placeholder:", err);
  }
}

export async function getTotalAttemptsCount() {
  try {
    // Exclude dummy user registration placeholders where chapter_id is null or 0
    const { count, error } = await supabase
      .from("user_progress")
      .select("*", { count: "exact", head: true })
      .not("chapter_id", "is", null)
      .neq("chapter_id", 0);
    
    if (!error) {
      return count || 0;
    }
  } catch (err) {
    console.warn("Failed to load total attempts count:", err);
  }
  return 0;
}
