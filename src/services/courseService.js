import { supabase } from "../supabase/supabase";

export async function getCourses() {
  const { data, error } = await supabase
    .from("courses")
    .select("*")
    .order("display_order");

  if (error) throw error;

  return data || [];
}

export async function getCourseBySlug(courseSlug) {
  const slugStr = (courseSlug || "").trim();
  if (!slugStr) return null;

  try {
    // 1. Try exact ilike query first
    const { data, error } = await supabase
      .from("courses")
      .select("*")
      .ilike("course_slug", slugStr)
      .limit(1);

    if (!error && data && data.length > 0) {
      return data[0];
    }
  } catch (e) {
    console.warn("getCourseBySlug ilike notice:", e.message);
  }

  // 2. Fallback: fetch all courses and match in memory
  try {
    const { data: allCourses, error: allErr } = await supabase
      .from("courses")
      .select("*")
      .order("display_order");

    if (!allErr && allCourses && allCourses.length > 0) {
      const match = allCourses.find(
        (c) => (c.course_slug || "").toLowerCase() === slugStr.toLowerCase()
      );
      return match || allCourses[0];
    }
  } catch (e) {
    console.warn("getCourseBySlug fallback notice:", e.message);
  }

  return null;
}
