import { supabase } from "../supabase/supabase";
import { getSetTypes, getSubjects } from "./subjectService";

export { getSetTypes };

export async function getChapters(courseId, setType) {
  const decodedSet =
    setType && setType !== "chapters" && setType.toLowerCase() !== "all"
      ? decodeURIComponent(setType).trim()
      : null;

  // 1. Check if there are subjects for this course and setType
  const subjects = await getSubjects(courseId, setType);
  if (subjects && subjects.length > 0) {
    const subjectIds = subjects.map((s) => s.id);
    let subQuery = supabase
      .from("chapters")
      .select("*")
      .in("subject_id", subjectIds)
      .eq("available", true)
      .order("display_order");

    if (decodedSet) {
      if (decodedSet.toUpperCase().includes("SET A")) {
        subQuery = subQuery.or("set_type.ilike.%SET A%,set_type.is.null");
      } else {
        subQuery = subQuery.ilike("set_type", `%${decodedSet}%`);
      }
    }

    const { data: chaptersBySubject, error: subErr } = await subQuery;
    if (!subErr && chaptersBySubject && chaptersBySubject.length > 0) {
      return chaptersBySubject;
    }
  }

  // 2. Direct fallback: query chapters by course_id and set_type
  let query = supabase
    .from("chapters")
    .select("*")
    .eq("course_id", courseId)
    .eq("available", true)
    .order("display_order");

  if (decodedSet) {
    if (decodedSet.toUpperCase().includes("SET A")) {
      query = query.or("set_type.ilike.%SET A%,set_type.is.null");
    } else {
      query = query.ilike("set_type", `%${decodedSet}%`);
    }
  }

  const { data, error } = await query;
  if (error) {
    console.warn("getChapters notice:", error.message);
    return [];
  }
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

/**
 * Centralized Chapter Revision Slide Decks & Presentation Registry
 * Keyed by chapter ID, chapter_slug, or normalized chapter_name.
 */
export const DEFAULT_CHAPTER_PPTS = {
  // Chapter ID 10: SEBI Act, 1992
  "10": "https://docs.google.com/presentation/d/18C59XrzlfkmM_ik1v-G9om_aOfUqkmCGEbbJ03Zf-c/edit",
  "sebi-act-1992": "https://docs.google.com/presentation/d/18C59XrzlfkmM_ik1v-G9om_aOfUqkmCGEbbJ03Zf-c/edit",
  "sebi act, 1992": "https://docs.google.com/presentation/d/18C59XrzlfkmM_ik1v-G9om_aOfUqkmCGEbbJ03Zf-c/edit",
  "sebi act": "https://docs.google.com/presentation/d/18C59XrzlfkmM_ik1v-G9om_aOfUqkmCGEbbJ03Zf-c/edit",
};

/**
 * Normalizes any Google Slides, Canva, Drive, or PDF URL to an embeddable format.
 */
export function formatEmbedUrl(url) {
  if (!url) return "";
  let formatted = String(url).trim();

  // 1. Google Slides: extract presentation ID and generate clean embed URL
  if (formatted.includes("docs.google.com/presentation/d/")) {
    const match = formatted.match(/docs\.google\.com\/presentation\/d\/([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
      return `https://docs.google.com/presentation/d/${match[1]}/embed?start=false&loop=false&delayms=3000`;
    }
  }

  // 2. Google Drive File: extract file ID and convert to preview
  if (formatted.includes("drive.google.com/file/d/")) {
    const match = formatted.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
      return `https://drive.google.com/file/d/${match[1]}/preview`;
    }
  }

  // 3. Canva Embed
  if (formatted.includes("canva.com/design/") && !formatted.includes("embed")) {
    return formatted.includes("?") ? `${formatted}&embed` : `${formatted}?embed`;
  }

  return formatted;
}

/**
 * Resolves the presentation URL for a chapter
 */
export function getResolvedChapterPptUrl(chapter) {
  if (!chapter) return "";

  // 1. Direct database field
  if (chapter.revision_ppt_url && String(chapter.revision_ppt_url).trim()) {
    return String(chapter.revision_ppt_url).trim();
  }
  if (chapter.revision_pdf_url && String(chapter.revision_pdf_url).trim()) {
    return String(chapter.revision_pdf_url).trim();
  }

  // 2. Local storage override (from Admin changes)
  try {
    const local = JSON.parse(localStorage.getItem("ca_quiz_chapter_ppts") || "{}");
    if (chapter.id && local[String(chapter.id)] && String(local[String(chapter.id)]).trim()) {
      return String(local[String(chapter.id)]).trim();
    }
  } catch {
    // ignore
  }

  // 3. By Chapter ID in DEFAULT_CHAPTER_PPTS
  if (chapter.id && DEFAULT_CHAPTER_PPTS[String(chapter.id)]) {
    return DEFAULT_CHAPTER_PPTS[String(chapter.id)];
  }

  // 4. By normalized Chapter Name
  const nameKey = (chapter.chapter_name || chapter.title || "").toLowerCase().trim();
  if (nameKey && DEFAULT_CHAPTER_PPTS[nameKey]) {
    return DEFAULT_CHAPTER_PPTS[nameKey];
  }

  // 5. By Chapter Slug
  const slugKey = (chapter.chapter_slug || "").toLowerCase().trim();
  if (slugKey && DEFAULT_CHAPTER_PPTS[slugKey]) {
    return DEFAULT_CHAPTER_PPTS[slugKey];
  }

  return "";
}
