import { supabase } from "../supabase/supabase";

export async function getQuestionsForChapter(chapterId) {
  const { data, error } = await supabase
    .from("questions")
    .select("id, chapter_id, topic, question, option_a, option_b, option_c, option_d, correct_option, explanation")
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
