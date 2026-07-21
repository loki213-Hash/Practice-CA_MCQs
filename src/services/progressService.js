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

  // Filter out chapter_id: 0 which is the dummy registration placeholder
  const activeAttempts = attempts.filter((attempt) => attempt.chapter_id !== 0);

  if (activeAttempts.length === 0) {
    return { chapterCount: 0, averageAccuracy: 0, masteredChapterIds: [] };
  }

  // Calculate stats
  // Group by chapter to find highest score per chapter
  const highestScoresByChapter = {};
  let totalPercentageSum = 0;

  activeAttempts.forEach((attempt) => {
    totalPercentageSum += attempt.percentage;
    const cid = attempt.chapter_id;
    if (highestScoresByChapter[cid] === undefined || attempt.percentage > highestScoresByChapter[cid]) {
      highestScoresByChapter[cid] = attempt.percentage;
    }
  });

  const masteredChapters = Object.keys(highestScoresByChapter).filter(
    (cid) => highestScoresByChapter[cid] >= 80
  );

  const averageAccuracy = Math.round(totalPercentageSum / activeAttempts.length);

  return {
    chapterCount: masteredChapters.length,
    averageAccuracy,
    masteredChapterIds: masteredChapters.map(Number),
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
            chapter_id: 0, // Placeholder registration log
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
