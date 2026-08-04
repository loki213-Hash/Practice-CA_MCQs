import { supabase } from "../supabase/supabase";

export async function getSetTypes(courseId) {
  try {
    // 1. Try fetching set_types from subjects table first
    const { data: subjectSets, error: sErr } = await supabase
      .from("subjects")
      .select("set_type")
      .eq("course_id", courseId)
      .not("set_type", "is", null)
      .order("set_type");

    if (!sErr && subjectSets && subjectSets.length > 0) {
      const types = [...new Set(subjectSets.map((s) => s.set_type?.trim()).filter(Boolean))];
      if (types.length > 0) return types;
    }
  } catch (e) {
    console.warn("Notice: Subjects set_type fetch fallback:", e.message);
  }

  // 2. Fallback: fetch set_types from chapters table
  const { data: chapterSets, error: cErr } = await supabase
    .from("chapters")
    .select("set_type")
    .eq("course_id", courseId)
    .not("set_type", "is", null)
    .order("set_type");

  if (cErr) throw cErr;
  return [...new Set(chapterSets.map((ch) => ch.set_type?.trim()).filter(Boolean))];
}

export async function getSubjects(courseId, setType) {
  const decodedSet = setType && setType !== "chapters" ? decodeURIComponent(setType).trim() : null;

  let query = supabase
    .from("subjects")
    .select("*")
    .eq("course_id", courseId)
    .order("display_order", { ascending: true });

  if (decodedSet) {
    query = query.ilike("set_type", decodedSet);
  }

  const { data, error } = await query;
  if (error) {
    console.warn("getSubjects notice:", error.message);
  }

  if (data && data.length > 0) {
    return data;
  }

  // Fallback: If querying with set_type returned empty array, fetch ALL subjects for the course
  const { data: fallbackData, error: fbErr } = await supabase
    .from("subjects")
    .select("*")
    .eq("course_id", courseId)
    .order("display_order", { ascending: true });

  if (fbErr) {
    console.warn("getSubjects fallback notice:", fbErr.message);
    return [];
  }
  return fallbackData || [];
}

export async function getSubjectById(subjectId) {
  const { data, error } = await supabase
    .from("subjects")
    .select("*")
    .eq("id", subjectId)
    .single();

  if (error) throw error;
  return data;
}
