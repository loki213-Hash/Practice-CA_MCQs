import { supabase } from "../supabase/supabase";

export async function getQuestionsForChapter(chapterId) {
  // DB stores chapter_id as TEXT — cast to string for safety
  const { data, error } = await supabase
    .from("questions")
    .select("*")
    .eq("chapter_id", String(chapterId))
    .eq("active", true)
    .order("display_order", { ascending: true })
    .order("id", { ascending: true });

  if (error) {
    // Retry without active filter in case column doesn't exist / is null
    const { data: fallback, error: fbErr } = await supabase
      .from("questions")
      .select("*")
      .eq("chapter_id", String(chapterId))
      .order("display_order", { ascending: true })
      .order("id", { ascending: true });
    if (fbErr) throw fbErr;
    return fallback || [];
  }
  return data || [];
}

export async function getQuestionCount(chapterId) {
  const { count, error } = await supabase
    .from("questions")
    .select("*", { count: "exact", head: true })
    .eq("chapter_id", String(chapterId));

  if (error) {
    console.warn("getQuestionCount error:", error.message);
    return 0;
  }
  return count ?? 0;
}

export async function getStatsForCourse(courseId) {
  const { data: chapters, error: chapterError } = await supabase
    .from("chapters")
    .select("id")
    .eq("course_id", courseId);

  if (chapterError) throw chapterError;
  if (!chapters || chapters.length === 0) return { chapterCount: 0, questionCount: 0 };

  const chapterIds = chapters.map((c) => String(c.id));

  const { count: questionCount, error: countError } = await supabase
    .from("questions")
    .select("*", { count: "exact", head: true })
    .in("chapter_id", chapterIds);

  if (countError) {
    console.warn("getStatsForCourse count error:", countError.message);
    return { chapterCount: chapters.length, questionCount: 0 };
  }

  return {
    chapterCount: chapters.length,
    questionCount: questionCount ?? 0,
  };
}
