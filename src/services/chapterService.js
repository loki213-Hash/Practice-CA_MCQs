import { supabase } from "../supabase/supabase";

export async function getSetTypes(courseId) {
  const { data, error } = await supabase
    .from("chapters")
    .select("set_type")
    .eq("course_id", courseId)
    .not("set_type", "is", null)
    .order("set_type");

  if (error) throw error;
  return [...new Set(data.map((chapter) => chapter.set_type))];
}

export async function getChapters(courseId, setType) {
  let query = supabase.from("chapters").select("*").eq("course_id", courseId).eq("available", true).order("display_order");
  query = setType ? query.eq("set_type", setType) : query.is("set_type", null);
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function getChapterById(chapterId) {
  const { data, error } = await supabase
    .from("chapters")
    .select("*, courses(course_name, course_slug)")
    .eq("id", chapterId)
    .single();

  if (error) throw error;
  return data;
}
