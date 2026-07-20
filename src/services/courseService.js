import { supabase } from "../supabase/supabase";

export async function getCourses() {
  const { data, error } = await supabase
    .from("courses")
    .select("*")
    .order("display_order");

  if (error) throw error;

  return data;
}

export async function getCourseBySlug(courseSlug) {
  const { data, error } = await supabase
    .from("courses")
    .select("*")
    .eq("course_slug", courseSlug)
    .single();

  if (error) throw error;
  return data;
}
