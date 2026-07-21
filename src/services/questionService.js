import { supabase } from "../supabase/supabase";

export async function getQuestionsForChapter(chapterId) {
  const { data, error } = await supabase
    .from("questions")
    .select("id, chapter_id, topic, question, option_a, option_b, option_c, option_d, correct_option, explanation, is_priority")
    .eq("chapter_id", chapterId)
    .order("id");

  if (error) throw error;
  return data;
}

export async function getQuestionCount(chapterId) {
  const { count, error } = await supabase
    .from("questions")
    .select("*", { count: "exact", head: true })
    .eq("chapter_id", chapterId);

  if (error) throw error;
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

  if (countError) throw countError;

  return {
    chapterCount: chapters.length,
    questionCount: questionCount ?? 0,
  };
}
