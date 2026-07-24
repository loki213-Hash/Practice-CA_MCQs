import { supabase } from "../supabase/supabase";
import { getSetTypes, getSubjects } from "./subjectService";

export { getSetTypes };

export async function getChapters(courseId, setType) {
  // 1. Check if there are subjects for this course and setType
  const subjects = await getSubjects(courseId, setType);
  if (subjects.length > 0) {
    const subjectIds = subjects.map((s) => s.id);
    // Fetch chapters for these subjects
    const { data: chaptersBySubject, error: subErr } = await supabase
      .from("chapters")
      .select("*")
      .in("subject_id", subjectIds)
      .eq("available", true)
      .order("display_order");

    if (!subErr && chaptersBySubject && chaptersBySubject.length > 0) {
      return chaptersBySubject;
    }
  }

  // 2. Direct fallback: query chapters by course_id and set_type
  let query = supabase.from("chapters").select("*").eq("course_id", courseId).eq("available", true).order("display_order");
  query = setType && setType !== "chapters" ? query.eq("set_type", setType) : query;
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function getChaptersBySubjectId(subjectId) {
  const { data, error } = await supabase
    .from("chapters")
    .select("*")
    .eq("subject_id", subjectId)
    .eq("available", true)
    .order("display_order");

  if (error) throw error;
  return data || [];
}

export async function getChapterById(chapterId) {
  const { data: chapter, error } = await supabase
    .from("chapters")
    .select("*")
    .eq("id", chapterId)
    .single();

  if (error) throw error;

  if (chapter) {
    // Resolve subject if subject_id is present
    if (chapter.subject_id) {
      try {
        const { data: subject } = await supabase
          .from("subjects")
          .select("id, subject_name, subject_slug, set_type, course_id")
          .eq("id", chapter.subject_id)
          .single();
        if (subject) {
          chapter.subject = subject;
          if (!chapter.course_id && subject.course_id) {
            chapter.course_id = subject.course_id;
          }
        }
      } catch (e) {
        console.warn("Fallback subject fetch warning:", e.message);
      }
    }

    // Resolve course
    if (chapter.course_id) {
      try {
        const { data: course } = await supabase
          .from("courses")
          .select("id, course_name, course_slug")
          .eq("id", chapter.course_id)
          .single();
        if (course) {
          chapter.courses = course;
        }
      } catch (e) {
        console.warn("Fallback course fetch warning:", e.message);
      }
    }
  }

  return chapter;
}
