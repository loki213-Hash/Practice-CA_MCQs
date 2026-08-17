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

/**
 * Fair Stratified Round-Robin Question Sampler across Chapters and Topics.
 * Ensures every listed chapter and every topic within chapters has an equal opportunity
 * to be represented in the test.
 *
 * @param {Array} allQuestions Pool of regular questions
 * @param {number} targetCount Total number of non-case questions to pick
 * @returns {Array} Shuffled array of stratified questions
 */
function sampleStratifiedNonCaseQuestions(allQuestions, targetCount) {
  if (!allQuestions || allQuestions.length === 0 || targetCount <= 0) return [];

  // Group questions by chapter_id -> topic
  const questionsByChapter = {};
  allQuestions.forEach((q) => {
    const cid = String(q.chapter_id || "general");
    const top = String(q.topic || "General").trim();
    if (!questionsByChapter[cid]) questionsByChapter[cid] = {};
    if (!questionsByChapter[cid][top]) questionsByChapter[cid][top] = [];
    questionsByChapter[cid][top].push(q);
  });

  // Prepare chapter & topic randomized queues
  const chapterIds = shuffle(Object.keys(questionsByChapter));
  const chapterTopicQueues = {};

  chapterIds.forEach((cid) => {
    const topicsObj = questionsByChapter[cid];
    const topicNames = shuffle(Object.keys(topicsObj));
    chapterTopicQueues[cid] = {
      topicNames,
      topicQueues: {},
      topicIndex: 0,
      totalRemaining: 0,
    };

    topicNames.forEach((tname) => {
      // Prioritize priority questions within the topic if available, while keeping selection randomized
      const qList = topicsObj[tname];
      const pQs = shuffle(qList.filter((q) => q.is_priority === true));
      const regQs = shuffle(qList.filter((q) => !q.is_priority));
      // Stack: regular at bottom, priority on top (popped first)
      const topicStack = [...regQs, ...pQs];

      chapterTopicQueues[cid].topicQueues[tname] = topicStack;
      chapterTopicQueues[cid].totalRemaining += topicStack.length;
    });
  });

  const selectedQuestions = [];
  const selectedIds = new Set();
  let activeChapterList = chapterIds.filter((cid) => chapterTopicQueues[cid].totalRemaining > 0);

  // Multi-pass Round-Robin across chapters and topics
  while (selectedQuestions.length < targetCount && activeChapterList.length > 0) {
    const nextActiveList = [];

    for (const cid of activeChapterList) {
      if (selectedQuestions.length >= targetCount) break;

      const cData = chapterTopicQueues[cid];
      if (cData.totalRemaining <= 0) continue;

      let pickedQ = null;
      let attempts = 0;
      const numTopics = cData.topicNames.length;

      // Cycle through topics in this chapter
      while (attempts < numTopics && !pickedQ) {
        const currentTopic = cData.topicNames[cData.topicIndex];
        const tQueue = cData.topicQueues[currentTopic];

        cData.topicIndex = (cData.topicIndex + 1) % numTopics;
        attempts++;

        if (tQueue && tQueue.length > 0) {
          pickedQ = tQueue.pop();
          cData.totalRemaining--;
        }
      }

      if (pickedQ && !selectedIds.has(pickedQ.id)) {
        selectedIds.add(pickedQ.id);
        selectedQuestions.push({
          ...pickedQ,
          type: pickedQ.is_priority ? "priority" : "regular",
          case_id: null,
          case_scenario: null,
        });
      }

      if (cData.totalRemaining > 0) {
        nextActiveList.push(cid);
      }
    }

    activeChapterList = nextActiveList;
  }

  // Shuffle the selected pool so that questions from different chapters/topics are dispersed throughout the test
  return shuffle(selectedQuestions);
}

function normalizeQuestion(q) {
  return {
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
    raw_id: q.raw_id || q.id,
    case_question_id: q.case_question_id || null,
  };
}

// ── Main Export ───────────────────────────────────────────────────────────────

/**
 * Build a take-test question set.
 * For SET A (and sets with full questions available):
 *  - 100-question exam simulation with Case Scenarios placed at anchor points (Q1, Q21, Q41, Q61, Q81, Q92)
 *  - Fairly sampled stratified questions across chapters and topics
 *
 * For SET B (or any set where regular questions are not added yet):
 *  - Automatically loads and uses all available Case Scenario questions
 *  - If regular questions ARE available for SET B, uses the full question pool
 *
 * @param {string|number} courseId
 * @param {string|null} setType Optional set/module filter (e.g., "SET A", "SET B", "Module-1")
 * @returns {Promise<Array>} Normalized question objects
 */
export async function buildTakeTestQuestions(courseId, setType = null) {
  if (!courseId) throw new Error("courseId is required.");

  const isSetA =
    !setType ||
    setType.toLowerCase() === "all" ||
    setType.toUpperCase().includes("SET A");

  let chapterIds = [];

  // Step 1: Resolve chapters
  if (isSetA) {
    // ── SET A: Strictly preserve original behavior ──
    let chapQuery = supabase
      .from("chapters")
      .select("id, chapter_name, course_id, subject_id, set_type")
      .eq("course_id", courseId)
      .eq("available", true);

    if (setType && setType.trim().toLowerCase() !== "all") {
      chapQuery = chapQuery.or("set_type.ilike.%SET A%,set_type.is.null");
    }

    const { data: allChapters, error: chapErr } = await chapQuery;
    if (chapErr) console.warn("Chapter fetch notice (SET A):", chapErr.message);

    if (allChapters && allChapters.length > 0) {
      chapterIds = allChapters.map((c) => String(c.id));
    } else {
      // Fallback: fetch without set filter
      const { data: fallbackChaps } = await supabase
        .from("chapters")
        .select("id, chapter_name, course_id, subject_id, set_type")
        .eq("course_id", courseId)
        .eq("available", true);
      if (fallbackChaps && fallbackChaps.length > 0) {
        chapterIds = fallbackChaps.map((c) => String(c.id));
      }
    }
  } else {
    // ── SET B or other sets: Query subjects & chapters for this set ──
    const decodedSet = decodeURIComponent(setType).trim();

    try {
      // Check subjects first
      const { data: subData } = await supabase
        .from("subjects")
        .select("id")
        .eq("course_id", courseId)
        .ilike("set_type", `%${decodedSet}%`);

      if (subData && subData.length > 0) {
        const subIds = subData.map((s) => s.id);
        const { data: chapsBySub } = await supabase
          .from("chapters")
          .select("id")
          .in("subject_id", subIds)
          .eq("available", true);

        if (chapsBySub && chapsBySub.length > 0) {
          chapterIds = chapsBySub.map((c) => String(c.id));
        }
      }

      // Also check chapters with direct set_type match
      const { data: directChaps } = await supabase
        .from("chapters")
        .select("id")
        .eq("course_id", courseId)
        .ilike("set_type", `%${decodedSet}%`)
        .eq("available", true);

      if (directChaps && directChaps.length > 0) {
        const directIds = directChaps.map((c) => String(c.id));
        chapterIds = [...new Set([...chapterIds, ...directIds])];
      }
    } catch (e) {
      console.warn("Set chapter resolution notice:", e);
    }
  }

  // Step 2: Fetch ALL regular questions for resolved chapters (if any exist)
  let allQuestions = [];
  if (chapterIds.length > 0) {
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
  }

  // Step 3: Fetch & group Case Scenario questions
  let caseGroups = [];
  try {
    const casesData = await getCasesForCourse(courseId, setType);
    if (casesData && casesData.length > 0) {
      casesData.forEach((cs) => {
        if (!Array.isArray(cs.questions) || cs.questions.length === 0) return;

        const groupQs = cs.questions.map((cq, qIdx) => ({
          id: `case_${cs.id}_${cq.id || qIdx}`,
          raw_id: cq.raw_id || cq.id,
          case_question_id: cq.raw_id || cq.id,
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

  // Step 4: Handle Test Assembly
  // Scenario 1: No regular questions are added yet (e.g. SET B with only Case Scenarios)
  if (allQuestions.length === 0) {
    if (caseGroups.length === 0) {
      if (isSetA) {
        throw new Error("No questions available for this course.");
      }
      return [];
    }

    // Include ALL questions from ALL available case scenarios (preserving consecutive group ordering)
    const allCaseQuestions = [];
    caseGroups.forEach((cg) => {
      allCaseQuestions.push(...cg);
    });

    return allCaseQuestions.slice(0, TOTAL_QUESTIONS).map(normalizeQuestion);
  }

  // Scenario 2: Regular questions ARE available (SET A, or SET B when regular MCQs are present)
  // Step 4b: Pick up to 6 case groups (one for each anchor position: Q1, Q21, Q41, Q61, Q81, Q92)
  const shuffledCaseGroups = shuffle(caseGroups);
  const selectedCasesForSegments = shuffledCaseGroups.slice(0, SEGMENT_CAPACITIES.length);

  // Calculate total case questions to determine exact non-case questions needed
  const totalCaseQsCount = selectedCasesForSegments.reduce(
    (sum, cg, idx) => sum + Math.min(cg.length, SEGMENT_CAPACITIES[idx]),
    0
  );
  const totalNonCaseNeeded = Math.max(0, TOTAL_QUESTIONS - totalCaseQsCount);

  // Step 5: Sample non-case questions with equal-opportunity representation across every chapter & topic
  const nonCasePool = sampleStratifiedNonCaseQuestions(allQuestions, totalNonCaseNeeded);

  // Step 6: Assemble questions segment-by-segment
  const finalTestQuestions = [];

  for (let segIdx = 0; segIdx < SEGMENT_CAPACITIES.length; segIdx++) {
    const targetCapacity = SEGMENT_CAPACITIES[segIdx];
    const segCaseGroup = selectedCasesForSegments[segIdx] || [];

    // Push the whole case group (capped if larger than segment, though typical cases have 4-6 questions)
    const caseQsToInclude = segCaseGroup.slice(0, targetCapacity);
    finalTestQuestions.push(...caseQsToInclude);

    // Remaining slots in this segment to reach targetCapacity filled from balanced non-case pool
    const remainingSlots = targetCapacity - caseQsToInclude.length;
    if (remainingSlots > 0 && nonCasePool.length > 0) {
      const nonCaseSlice = nonCasePool.splice(0, remainingSlots);
      finalTestQuestions.push(...nonCaseSlice);
    }
  }

  // If still under 100 due to short non-case pool, top up with remaining non-case
  if (finalTestQuestions.length < TOTAL_QUESTIONS && nonCasePool.length > 0) {
    const needed = TOTAL_QUESTIONS - finalTestQuestions.length;
    finalTestQuestions.push(...nonCasePool.splice(0, needed));
  }

  // If still under 100 and extra case groups were left over, add them
  if (finalTestQuestions.length < TOTAL_QUESTIONS && shuffledCaseGroups.length > SEGMENT_CAPACITIES.length) {
    const remainingCaseGroups = shuffledCaseGroups.slice(SEGMENT_CAPACITIES.length);
    for (const cg of remainingCaseGroups) {
      if (finalTestQuestions.length >= TOTAL_QUESTIONS) break;
      const needed = TOTAL_QUESTIONS - finalTestQuestions.length;
      finalTestQuestions.push(...cg.slice(0, needed));
    }
  }

  // Step 7: Normalize to common schema
  return finalTestQuestions.slice(0, TOTAL_QUESTIONS).map(normalizeQuestion);
}
