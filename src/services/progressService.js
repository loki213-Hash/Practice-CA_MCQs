import { supabase } from "../supabase/supabase";

export async function saveQuizAttempt({ chapterId, score, totalQuestions }) {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    throw new Error("User must be logged in to save progress.");
  }

  const percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;

  const { data, error } = await supabase
    .from("user_progress")
    .insert([
      {
        user_id: user.id,
        chapter_id: chapterId,
        score,
        total_questions: totalQuestions,
        percentage,
        completed_at: new Date().toISOString(),
      },
    ]);

  if (error) throw error;
  return data;
}

export async function getUserProgressStats() {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return { chapterCount: 0, averageAccuracy: 0, masteredChapterIds: [] };
  }

  const { data: attempts, error } = await supabase
    .from("user_progress")
    .select("chapter_id, percentage")
    .eq("user_id", user.id);

  if (error) throw error;
  if (!attempts || attempts.length === 0) {
    return { chapterCount: 0, averageAccuracy: 0, masteredChapterIds: [] };
  }

  // Filter out chapter_id: null or 0 which are dummy registration placeholders
  const activeAttempts = attempts.filter((attempt) => attempt.chapter_id !== null && attempt.chapter_id !== 0);

  if (activeAttempts.length === 0) {
    return { chapterCount: 0, averageAccuracy: 0, masteredChapterIds: [] };
  }

  // Calculate stats
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
