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

        const { data: qData, error: qErr } = await supabase
          .from("case_questions")
          .select("*")
          .or(`case_id.eq.${cId},case_code.eq.${c.case_code || cId}`);

        if (qErr) {
          console.warn(`Notice querying case_questions for case ${cId}:`, qErr.message);
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

        const bodyText = c.body || c.description || c.content || c.case_text || c.paragraphs || "";
        const paragraphs = Array.isArray(bodyText)
          ? bodyText
          : typeof bodyText === "string"
          ? bodyText.split(/\n\s*\n/).filter((p) => p.trim().length > 0)
          : [String(bodyText)];

        return {
          id: c.id,
          case_code: c.case_code || c.id,
          tag: c.tag || c.subject_name || "CASE SCENARIO",
          title: c.title || c.name || "Case Scenario",
          body: Array.isArray(bodyText) ? bodyText.join("\n\n") : bodyText,
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
