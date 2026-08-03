import { supabase } from "../supabase/supabase";

export async function getCasesForCourse(courseId) {
  try {
    // 1. Query cases table directly from Supabase
    let query = supabase.from("cases").select("*");
    if (courseId) {
      query = query.eq("course_id", courseId);
    }

    let { data: casesData, error: casesErr } = await query;

    if (casesErr) {
      console.warn("Notice querying cases table:", casesErr.message);
    }

    // If query by course_id returned 0 rows, fallback to fetching all cases
    if (!casesData || casesData.length === 0) {
      const { data: allCases } = await supabase.from("cases").select("*");
      if (allCases && allCases.length > 0) {
        casesData = allCases;
      }
    }

    if (!casesData || casesData.length === 0) {
      return [];
    }

    // 2. Query case_questions table for each case
    const casesWithQuestions = await Promise.all(
      casesData.map(async (c) => {
        const cId = c.id || c.case_code || c.code;

        let qData = null;
        try {
          const { data, error: qErr } = await supabase
            .from("case_questions")
            .select("*")
            .or(`case_id.eq.${cId},case_code.eq.${c.case_code || cId}`);
          if (!qErr && data && data.length > 0) {
            qData = data;
          }
        } catch (e) {
          console.warn("Notice querying case_questions with .or():", e);
        }

        // JS Fallback if .or() filter returned no rows
        if (!qData || qData.length === 0) {
          const { data: allQ } = await supabase.from("case_questions").select("*");
          if (allQ && allQ.length > 0) {
            qData = allQ.filter(
              (q) =>
                String(q.case_id) === String(c.id) ||
                String(q.case_id) === String(cId) ||
                String(q.case_code) === String(c.case_code) ||
                String(q.case_code) === String(cId) ||
                !q.case_id // attach if case_id column is omitted
            );
          }
        }

        const rawQuestions = qData || [];

        const formattedQuestions = rawQuestions.map((q, idx) => {
          // Extract question text (handling different column names)
          const text = q.text || q.question_text || q.question || q.title || "";

          // Extract options (handling array, object, or option_a/b/c/d columns)
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

          // Extract correct letter
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
            id: q.id || idx + 1,
            text,
            options,
            correctLetter,
            explanation,
          };
        });

        const bodyText = c.body || c.case_scenario || c.description || c.content || c.case_text || c.paragraphs || "";
        const tableText = c.case_table || c.Case_table || c.table_content || c.table_data || c.tables || "";

        let paragraphs = Array.isArray(bodyText)
          ? bodyText
          : typeof bodyText === "string"
          ? bodyText.split(/\n\s*\n/).filter((p) => p.trim().length > 0)
          : [String(bodyText)];

        if (paragraphs.length === 0 && !tableText) {
          paragraphs = ["No case description available."];
        }

        const fullBody = [Array.isArray(bodyText) ? bodyText.join("\n\n") : bodyText, tableText]
          .filter(Boolean)
          .join("\n\n---\n\n");

        return {
          id: c.id,
          case_code: c.case_code || c.id,
          tag: c.tag || c.subject_name || "CASE SCENARIO",
          title: c.title || c.name || "Case Scenario",
          body: fullBody,
          case_table: tableText || null,
          paragraphs: paragraphs.length > 0 ? paragraphs : ["No case description available."],
          questions: formattedQuestions,
        };
      })
    );

    return casesWithQuestions;
  } catch (err) {
    console.error("Error loading cases and case_questions from Supabase:", err);
    return [];
  }
}
