import { supabase } from "../supabase/supabase";

export async function getCasesForCourse() {
  try {
    // 1. Single ultra-fast batch query for ALL cases from Supabase
    const { data: casesData, error: casesErr } = await supabase
      .from("cases")
      .select("*")
      .range(0, 1000)
      .order("created_at", { ascending: true });

    if (casesErr) {
      console.warn("Notice querying cases table:", casesErr.message);
    }

    if (!casesData || casesData.length === 0) {
      return [];
    }

    // 2. Single batch query for ALL case_questions from Supabase
    let allQuestions = [];
    try {
      const { data: qData, error: qErr } = await supabase
        .from("case_questions")
        .select("*")
        .range(0, 5000);
      if (!qErr && qData) {
        allQuestions = qData;
      }
    } catch (e) {
      console.warn("Notice querying case_questions batch:", e);
    }

    // Map questions by case_code / case_id / index in memory for O(1) instant lookup
    const questionsByCase = {};
    allQuestions.forEach((q) => {
      const key = String(q.case_code || q.case_id || q.case_number || "").trim().toUpperCase();
      if (key) {
        if (!questionsByCase[key]) questionsByCase[key] = [];
        questionsByCase[key].push(q);
      }
    });

    // 3. Format all 65 cases with mapped questions & table data
    const formattedCases = casesData.map((c, idx) => {
      const cId = String(c.id || "").trim();
      const caseCode = String(c.case_code || `CASE_${idx + 1}`).trim().toUpperCase();

      // Find questions by case_code or case_id
      const rawQuestions =
        questionsByCase[caseCode] ||
        questionsByCase[cId.toUpperCase()] ||
        questionsByCase[String(idx + 1)] ||
        [];

      const formattedQuestions = rawQuestions.map((q, qIdx) => {
        const text = q.text || q.question_text || q.question || q.title || "";

        let options;
        if (Array.isArray(q.options)) {
          options = q.options;
        } else if (typeof q.options === "object" && q.options !== null) {
          options = Object.keys(q.options).map((key) => ({
            letter: key.toUpperCase(),
            text: q.options[key],
          }));
        } else {
          options = [
            { letter: "A", text: q.option_a || q.a || q.optionA },
            { letter: "B", text: q.option_b || q.b || q.optionB },
            { letter: "C", text: q.option_c || q.c || q.optionC },
            { letter: "D", text: q.option_d || q.d || q.optionD },
          ].filter((o) => o.text);
        }

        const correctLetter = (
          q.correct_letter ||
          q.correctLetter ||
          q.correct_option ||
          q.correct ||
          q.answer ||
          "A"
        ).toString().trim().toUpperCase();

        const explanation = q.explanation || q.solution || "";

        return {
          id: q.id || qIdx + 1,
          text,
          options,
          correctLetter,
          explanation,
        };
      });

      const bodyText = c.body || c.case_scenario || c.description || c.content || c.case_text || "";
      const tableData = c.case_table || c.Case_table || c.table_content || null;

      let paragraphs = Array.isArray(bodyText)
        ? bodyText
        : typeof bodyText === "string"
        ? bodyText.split(/\n\s*\n/).filter((p) => p.trim().length > 0)
        : [String(bodyText)];

      if (paragraphs.length === 0 && !tableData) {
        paragraphs = ["No case description available."];
      }

      return {
        id: c.id || caseCode,
        case_code: caseCode,
        tag: c.tag || `Case Scenario ${idx + 1}`,
        title: c.title || c.name || `Case Scenario ${idx + 1}`,
        body: typeof bodyText === "string" ? bodyText : JSON.stringify(bodyText),
        case_table: tableData,
        topic: c.topic || "Case Scenario",
        paragraphs,
        questions: formattedQuestions,
      };
    });

    return formattedCases;
  } catch (err) {
    console.error("Error loading cases and case_questions from Supabase:", err);
    return [];
  }
}
