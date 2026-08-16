import { supabase } from "../supabase/supabase";
import { cleanCorruptedText } from "../utils/helpers";

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
    return (fallback || []).map(formatQuestionData);
  }
  return (data || []).map(formatQuestionData);
}

function formatQuestionData(q) {
  if (!q) return q;
  return {
    ...q,
    question: cleanCorruptedText(q.question),
    option_a: cleanCorruptedText(q.option_a),
    option_b: cleanCorruptedText(q.option_b),
    option_c: cleanCorruptedText(q.option_c),
    option_d: cleanCorruptedText(q.option_d),
    explanation: cleanCorruptedText(q.explanation),
    question_intro: cleanCorruptedText(q.question_intro),
    question_outro: cleanCorruptedText(q.question_outro),
    table_data: cleanCorruptedText(q.table_data),
    topic: cleanCorruptedText(q.topic),
  };
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
