import { supabase } from "../supabase/supabase";
import { getCasesForCourse } from "./caseService";

// ── Constants ─────────────────────────────────────────────────────────────────

const TOTAL_QUESTIONS = 100;
const MIN_CASE_QUESTIONS = 5;
const MIN_PRIORITY_RATIO = 0.30;

// ── Utils ─────────────────────────────────────────────────────────────────────

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── Main Export ───────────────────────────────────────────────────────────────

/**
 * Build a 100-question take-test set.
 *
 * ORDERING:
 *  1. Case scenario questions FIRST — grouped by case (all sub-questions of
 *     the same case appear consecutively). Cases themselves are shuffled.
 *  2. Priority regular questions next  (>=30% of remaining non-case slots)
 *  3. Regular questions fill the rest
 *
 * @param {string|number} courseId
 * @returns {Promise<Array>} Normalized question objects (up to 100)
 */
export async function buildTakeTestQuestions(courseId) {
  if (!courseId) throw new Error("courseId is required.");

  // Step 1: Fetch all chapters for this course
  const { data: allChapters, error: chapErr } = await supabase
    .from("chapters")
    .select("id, chapter_name, course_id, subject_id")
    .eq("course_id", courseId)
    .eq("available", true);

  if (chapErr) console.warn("Chapter fetch notice:", chapErr.message);
  if (!allChapters || allChapters.length === 0) {
    throw new Error("No chapters found for this course.");
  }

  const chapterIds = allChapters.map((c) => String(c.id));

  // Step 2: Fetch ALL regular questions (batched to avoid URL-length limits)
  let allQuestions = [];
  const BATCH = 40;
  for (let i = 0; i < chapterIds.length; i += BATCH) {
    const batch = chapterIds.slice(i, i + BATCH);
    try {
      const { data: batchQs, error: bErr } = await supabase
        .from("questions")
        .select("*")
        .in("chapter_id", batch)
        .eq("active", true);

      if (!bErr && batchQs) {
        allQuestions = [...allQuestions, ...batchQs];
      } else {
        const { data: fallback } = await supabase
          .from("questions")
          .select("*")
          .in("chapter_id", batch);
        if (fallback) allQuestions = [...allQuestions, ...fallback];
      }
    } catch (e) {
      console.warn("Question batch fetch error:", e);
    }
  }

  if (allQuestions.length === 0) {
    throw new Error("No questions available for this course.");
  }

  // Step 3: Fetch & group Case Scenario questions
  //
  // KEY BEHAVIOUR: every case's sub-questions stay together as a group.
  // We shuffle the ORDER of cases, but within each case the sub-questions
  // maintain their natural order.
  //
  let caseGroups = []; // each entry = array of normalized question objects for one case
  try {
    const casesData = await getCasesForCourse(courseId);
    if (casesData && casesData.length > 0) {
      casesData.forEach((cs) => {
        if (!Array.isArray(cs.questions) || cs.questions.length === 0) return;

        const groupQs = cs.questions.map((cq, qIdx) => ({
          id: `case_${cs.id}_${cq.id || qIdx}`,
          case_id: String(cs.id), // unique per case — used for boundary detection in UI
          type: "case",
          question: cq.text || "",
          option_a: cq.options?.find((o) => o.letter === "A")?.text || "",
          option_b: cq.options?.find((o) => o.letter === "B")?.text || "",
          option_c: cq.options?.find((o) => o.letter === "C")?.text || "",
          option_d: cq.options?.find((o) => o.letter === "D")?.text || "",
          correct_option: (cq.correctLetter || "A").toUpperCase(),
          explanation: cq.explanation || "",
          topic: "Case Scenario",
          is_priority: false,
          chapter_id: null,
          case_scenario: {
            title: cs.title || cs.tag || "Case Scenario",
            tag: cs.tag || "",
            paragraphs: cs.paragraphs || [],
            case_table: cs.case_table || null,
            outro_paragraphs: cs.outro_paragraphs || [],
          },
        }));

        caseGroups.push(groupQs);
      });
    }
  } catch (e) {
    console.warn("Case scenario fetch notice:", e);
  }

  // Step 4: Pick whole case groups until we reach MIN_CASE_QUESTIONS sub-questions
  // Shuffle the group ORDER so the exam isn't always the same cases first.
  const shuffledCaseGroups = shuffle(caseGroups);
  const selectedCaseQs = [];
  for (const group of shuffledCaseGroups) {
    selectedCaseQs.push(...group); // always push the FULL group
    if (selectedCaseQs.length >= MIN_CASE_QUESTIONS) break;
  }

  const caseSlotCount = selectedCaseQs.length;
  const nonCaseSlots = TOTAL_QUESTIONS - caseSlotCount;

  // Step 5: Separate priority vs regular non-case questions
  const priorityQs = allQuestions.filter((q) => q.is_priority === true);
  const regularQs  = allQuestions.filter((q) => !q.is_priority);

  const prioritySlotsWanted = Math.ceil(nonCaseSlots * MIN_PRIORITY_RATIO);
  const prioritySlots = Math.min(prioritySlotsWanted, priorityQs.length);
  const regularSlots  = Math.max(0, nonCaseSlots - prioritySlots);

  // Step 6: Sample non-case questions
  const sampledPriorityQs = shuffle(priorityQs)
    .slice(0, prioritySlots)
    .map((q) => ({ ...q, type: "priority", case_id: null, case_scenario: null }));

  const priorityIds = new Set(sampledPriorityQs.map((q) => String(q.id)));
  const availableRegular = regularQs.filter((q) => !priorityIds.has(String(q.id)));
  const sampledRegularQs = shuffle(availableRegular)
    .slice(0, regularSlots)
    .map((q) => ({ ...q, type: "regular", case_id: null, case_scenario: null }));

  // Step 7: Assemble final list
  //
  //  ORDER:
  //    [Case group 1 Qs] -> [Case group 2 Qs] -> ... -> [Priority Qs shuffled] -> [Regular Qs shuffled]
  //
  const nonCasePool = shuffle([...sampledPriorityQs, ...sampledRegularQs]);
  const finalQuestions = [...selectedCaseQs, ...nonCasePool];

  // Step 8: Normalize to common schema
  return finalQuestions.slice(0, TOTAL_QUESTIONS).map((q) => ({
    id: q.id,
    type: q.type || "regular",
    case_id: q.case_id || null,           // used for detecting case boundaries in UI
    question: String(q.question || q.text || ""),
    option_a: String(q.option_a || ""),
    option_b: String(q.option_b || ""),
    option_c: String(q.option_c || ""),
    option_d: String(q.option_d || ""),
    correct_option: String(q.correct_option || "A").toUpperCase(),
    explanation: String(q.explanation || ""),
    topic: String(q.topic || (q.type === "case" ? "Case Scenario" : "General")),
    is_priority: !!q.is_priority,
    chapter_id: q.chapter_id ? String(q.chapter_id) : null,
    case_scenario: q.case_scenario || null,
    has_table: !!q.has_table,
    table_data: q.table_data || null,
    question_intro: q.question_intro || null,
    question_outro: q.question_outro || null,
  }));
}
