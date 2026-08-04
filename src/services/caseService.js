import { supabase } from "../supabase/supabase";

// eslint-disable-next-line no-unused-vars
export async function getCasesForCourse(courseId) {
  try {
    // 1. Fetch all published cases
    const { data: casesData, error: casesErr } = await supabase
      .from("cases")
      .select("*")
      .eq("is_published", true)
      .order("created_at", { ascending: true });

    if (casesErr) {
      console.warn("Notice querying cases table:", casesErr.message);
    }

    if (!casesData || casesData.length === 0) {
      // Try without is_published filter (in case column doesn't exist or all are null)
      const { data: fallbackCases, error: fbErr } = await supabase
        .from("cases")
        .select("*")
        .order("created_at", { ascending: true });

      if (fbErr || !fallbackCases || fallbackCases.length === 0) return [];
      return formatCasesWithQuestions(fallbackCases);
    }

    return formatCasesWithQuestions(casesData);
  } catch (err) {
    console.error("Error loading cases from Supabase:", err);
    return [];
  }
}

async function formatCasesWithQuestions(casesData) {
  try {
    // Sort cases numerically by number in case_code
    casesData.sort((a, b) => {
      const getNum = (c) => {
        const s = (c.case_code || c.tag || "").replace(/\D/g, "");
        return parseInt(s, 10) || 0;
      };
      return getNum(a) - getNum(b);
    });

    // Batch fetch ALL case_questions using case_id (UUID) — correct column name
    let allQuestions = [];
    try {
      const { data: qData, error: qErr } = await supabase
        .from("case_questions")
        .select("*")
        .eq("active", true)
        .range(0, 5000);

      if (qErr) {
        console.warn("Notice querying case_questions:", qErr.message);
        // Retry without active filter
        const { data: qData2 } = await supabase
          .from("case_questions")
          .select("*")
          .range(0, 5000);
        if (qData2) allQuestions = qData2;
      } else if (qData) {
        allQuestions = qData;
      }
    } catch (e) {
      console.warn("Notice querying case_questions batch:", e);
    }

    // Map questions by case_id (UUID string) for O(1) lookup — correct column
    const questionsByCaseId = {};
    allQuestions.forEach((q) => {
      const key = String(q.case_id || "").trim();
      if (key) {
        if (!questionsByCaseId[key]) questionsByCaseId[key] = [];
        questionsByCaseId[key].push(q);
      }
    });

    // Format all cases
    const formattedCases = casesData.map((c, idx) => {
      const caseId = String(c.id || "").trim();
      const caseCode = String(c.case_code || `CASE_${idx + 1}`).trim().toUpperCase();

      // Get questions by case_id (primary) or case_code (fallback)
      const rawQuestions = questionsByCaseId[caseId] || [];

      // Sort questions by question_order
      rawQuestions.sort((a, b) => (a.question_order || 0) - (b.question_order || 0));

      const formattedQuestions = rawQuestions.map((q, qIdx) => {
        // DB column is 'question' not 'text' or 'question_text'
        const text = q.question || q.text || q.question_text || q.title || "";

        let options = [
          { letter: "A", text: q.option_a || q.optionA || q.a || "" },
          { letter: "B", text: q.option_b || q.optionB || q.b || "" },
          { letter: "C", text: q.option_c || q.optionC || q.c || "" },
          { letter: "D", text: q.option_d || q.optionD || q.d || "" },
        ].filter((o) => o.text && o.text.trim());

        // If structured options array in DB
        if (!options.length && Array.isArray(q.options)) {
          options = q.options;
        }

        // DB correct_option is uppercase letter (A/B/C/D)
        const correctLetter = String(
          q.correct_option || q.correct_letter || q.correct || q.answer || "A"
        ).trim().toUpperCase();

        const explanation = q.explanation || q.solution || "";
        const explanations = q.explanations || null;

        return {
          id: q.id || qIdx + 1,
          text,
          options,
          correctLetter,
          explanation,
          explanations,
        };
      });

      const tableData = c.case_table || null;

      // Use case_intro for the text BEFORE the table.
      // Fall back to body/case_scenario only if case_intro is absent.
      const introText = c.case_intro || c.body || c.case_scenario || c.description || c.content || c.case_text || "";
      const outroText = c.case_outro || null;

      const toParagraphs = (text) => {
        if (Array.isArray(text)) return text;
        if (typeof text === "string" && text.trim())
          return text.split(/\n\s*\n/).filter((p) => p.trim().length > 0);
        return [];
      };

      const paragraphs = toParagraphs(introText);
      const outroParagraphs = outroText ? toParagraphs(outroText) : [];

      if (paragraphs.length === 0 && !tableData) {
        paragraphs.push("No case description available.");
      }

      return {
        id: c.id || caseCode,
        case_code: caseCode,
        tag: c.tag || `Case Scenario ${idx + 1}`,
        title: c.title || c.name || `Case Scenario ${idx + 1}`,
        body: introText,
        case_intro: introText,
        case_table: tableData,
        case_outro: outroText,
        topic: c.topic || "Case Scenario",
        paragraphs,
        outro_paragraphs: outroParagraphs,
        questions: formattedQuestions,
      };
    });

    return formattedCases;
  } catch (err) {
    console.error("Error formatting cases:", err);
    return [];
  }
}
