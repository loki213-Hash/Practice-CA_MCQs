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
  const decodedSet =
    setType && setType !== "chapters" && setType.toLowerCase() !== "all"
      ? decodeURIComponent(setType).trim()
      : null;

  let query = supabase
    .from("subjects")
    .select("*")
    .eq("course_id", courseId)
    .order("display_order", { ascending: true });

  if (decodedSet) {
    if (decodedSet.toUpperCase().includes("SET A")) {
      // SET A: match explicitly labeled SET A subjects or legacy subjects with set_type null
      query = query.or("set_type.ilike.%SET A%,set_type.is.null");
    } else {
      // SET B, Module-1, Module-2, etc.
      query = query.ilike("set_type", `%${decodedSet}%`);
    }
  }

  const { data, error } = await query;
  if (error) {
    console.warn("getSubjects notice:", error.message);
  }

  if (data && data.length > 0) {
    return data;
  }

  // If a specific set was requested (e.g. SET B or Module-1) and no subjects match,
  // do NOT leak all subjects from other sets!
  if (decodedSet) {
    return [];
  }

  // Fallback: Only when NO set was specified (e.g. full course overview)
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
