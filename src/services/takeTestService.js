import { supabase } from "../supabase/supabase";
import { getCasesForCourse } from "./caseService";

// ── Constants ─────────────────────────────────────────────────────────────────

const TOTAL_QUESTIONS = 100;
const SEGMENT_CAPACITIES = [20, 20, 20, 20, 11, 9]; // Starts at 1, 21, 41, 61, 81, 92 -> sum = 100
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
 * Build a 100-question take-test set with Case Scenarios placed at:
 *  - 1st question (Q1)
 *  - 21st question (Q21)
 *  - 41st question (Q41)
 *  - 61st question (Q61)
 *  - 81st question (Q81)
 *  - 92nd question (Q92)
 *
 * Each case group's related questions appear consecutively.
 * The rest of each segment is filled with non-case questions (>=30% priority).
 *
 * @param {string|number} courseId
 * @param {string|null} setType Optional set/module filter (e.g., "SET A", "Module-1")
 * @returns {Promise<Array>} Normalized question objects (total 100)
 */
export async function buildTakeTestQuestions(courseId, setType = null) {
  if (!courseId) throw new Error("courseId is required.");

  // Step 1: Fetch all chapters for this course (optionally filtered by set_type)
  let chapQuery = supabase
    .from("chapters")
    .select("id, chapter_name, course_id, subject_id, set_type")
    .eq("course_id", courseId)
    .eq("available", true);

  if (setType && setType.trim().toLowerCase() !== "all") {
    chapQuery = chapQuery.ilike("set_type", `%${setType.trim()}%`);
  }

  const { data: allChapters, error: chapErr } = await chapQuery;

  if (chapErr) console.warn("Chapter fetch notice:", chapErr.message);
  if (!allChapters || allChapters.length === 0) {
    // Fallback: fetch without set filter
    const { data: fallbackChaps } = await supabase
      .from("chapters")
      .select("id, chapter_name, course_id, subject_id, set_type")
      .eq("course_id", courseId)
      .eq("available", true);
    if (!fallbackChaps || fallbackChaps.length === 0) {
      throw new Error("No chapters found for this course.");
    }
  }

  const activeChapters = (allChapters && allChapters.length > 0) ? allChapters : [];
  const chapterIds = activeChapters.map((c) => String(c.id));

  // Step 2: Fetch ALL regular questions (batched)
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
  let caseGroups = [];
  try {
    const casesData = await getCasesForCourse(courseId);
    if (casesData && casesData.length > 0) {
      casesData.forEach((cs) => {
        if (!Array.isArray(cs.questions) || cs.questions.length === 0) return;

        const groupQs = cs.questions.map((cq, qIdx) => ({
          id: `case_${cs.id}_${cq.id || qIdx}`,
          case_id: String(cs.id),
          type: "case",
          question: cq.text || "",
          option_a: cq.options?.find((o) => o.letter === "A")?.text || "",
          option_b: cq.options?.find((o) => o.letter === "B")?.text || "",
          option_c: cq.options?.find((o) => o.letter === "C")?.text || "",
          option_d: cq.options?.find((o) => o.letter === "D")?.text || "",
          correct_option: (cq.correctLetter || "A").toUpperCase(),
          explanation: cq.explanation || "",
          topic: cs.title || cs.tag || "Case Scenario",
          is_priority: false,
          chapter_id: null,
          case_scenario: {
            id: String(cs.id),
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

  // Step 4: Separate priority vs regular non-case questions
  const priorityQs = shuffle(allQuestions.filter((q) => q.is_priority === true));
  const regularQs = shuffle(allQuestions.filter((q) => !q.is_priority));

  const sampledPriorityPool = priorityQs.map((q) => ({
    ...q,
    type: "priority",
    case_id: null,
    case_scenario: null,
  }));
  const sampledRegularPool = regularQs.map((q) => ({
    ...q,
    type: "regular",
    case_id: null,
    case_scenario: null,
  }));

  // Non-case pool combined
  let nonCasePool = shuffle([...sampledPriorityPool, ...sampledRegularPool]);

  // Step 5: Pick up to 6 case groups (one for each anchor position: Q1, Q21, Q41, Q61, Q81, Q92)
  const shuffledCaseGroups = shuffle(caseGroups);
  const selectedCasesForSegments = shuffledCaseGroups.slice(0, SEGMENT_CAPACITIES.length);

  // Step 6: Assemble questions segment-by-segment
  const final100 = [];

  for (let segIdx = 0; segIdx < SEGMENT_CAPACITIES.length; segIdx++) {
    const targetCapacity = SEGMENT_CAPACITIES[segIdx];
    const segCaseGroup = selectedCasesForSegments[segIdx] || [];

    // Push the whole case group (capped if larger than segment, though typical cases have 4-6 questions)
    const caseQsToInclude = segCaseGroup.slice(0, targetCapacity);
    final100.push(...caseQsToInclude);

    // Remaining slots in this segment to reach targetCapacity
    const remainingSlots = targetCapacity - caseQsToInclude.length;
    if (remainingSlots > 0 && nonCasePool.length > 0) {
      const nonCaseSlice = nonCasePool.splice(0, remainingSlots);
      final100.push(...nonCaseSlice);
    }
  }

  // If still under 100 due to short non-case pool, top up with remaining non-case
  if (final100.length < TOTAL_QUESTIONS && nonCasePool.length > 0) {
    const needed = TOTAL_QUESTIONS - final100.length;
    final100.push(...nonCasePool.splice(0, needed));
  }

  // Step 7: Normalize to common schema
  return final100.slice(0, TOTAL_QUESTIONS).map((q) => ({
    id: q.id,
    type: q.type || "regular",
    case_id: q.case_id || null,
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
