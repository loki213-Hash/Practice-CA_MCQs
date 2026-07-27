import { supabase } from "../supabase/supabase";

export async function getCasesForCourse(courseId) {
  // 1. Try querying cases_with_questions view
  try {
    const { data: viewData, error: viewErr } = await supabase
      .from("cases_with_questions")
      .select("*");

    if (!viewErr && viewData && viewData.length > 0) {
      return viewData.map((row) => ({
        id: row.id || row.case_code || row.case_id,
        case_code: row.case_code || row.id || "CASE-1",
        tag: row.tag || "CASE SCENARIO",
        title: row.title || "Case Scenario",
        body: row.body || row.description || "",
        paragraphs: (row.body || row.description || "")
          .split(/\n\s*\n/)
          .filter((p) => p.trim().length > 0),
        questions: (row.questions || []).map((q, idx) => ({
          id: q.id || idx + 1,
          text: q.text || q.question_text || q.question || "",
          options: Array.isArray(q.options)
            ? q.options
            : [
                { letter: "A", text: q.option_a || q.a },
                { letter: "B", text: q.option_b || q.b },
                { letter: "C", text: q.option_c || q.c },
                { letter: "D", text: q.option_d || q.d },
              ].filter((o) => o.text),
          correctLetter: (q.correctLetter || q.correct_letter || q.correct_option || "A").toUpperCase(),
          explanation: q.explanation || "",
        })),
      }));
    }
  } catch (err) {
    console.warn("Notice: cases_with_questions view query:", err.message);
  }

  // 2. Query cases table directly
  try {
    let query = supabase.from("cases").select("*");
    if (courseId) {
      query = query.eq("course_id", courseId);
    }

    const { data: casesData, error: casesErr } = await query;
    if (casesErr || !casesData || casesData.length === 0) {
      // Fallback sample case if DB is empty so the feature is immediately testable
      return [
        {
          id: "cs-1",
          case_code: "CASE-01",
          tag: "COMPANIES ACT, 2013",
          title: "Appointment & Disqualification of Directors in Public Companies",
          body: `ABC Limited is an unlisted public company having a paid-up share capital of Rs. 15 Crores and a turnover of Rs. 120 Crores. The Board of Directors currently comprises 5 directors. Mr. Rajesh, who was appointed as a director on 1st April 2021, failed to file his financial statements for 3 consecutive financial years.\n\nIn January 2024, the Board proposed to appoint Ms. Priya as an Independent Director. However, the Audit Committee raised an issue regarding her previous engagement as a legal advisor for the company 2 years ago.\n\nThe Board seeks clarification under the relevant provisions of the Companies Act, 2013 regarding director disqualifications, independent director eligibility, and board composition requirements.`,
          paragraphs: [
            "ABC Limited is an unlisted public company having a paid-up share capital of Rs. 15 Crores and a turnover of Rs. 120 Crores. The Board of Directors currently comprises 5 directors. Mr. Rajesh, who was appointed as a director on 1st April 2021, failed to file his financial statements for 3 consecutive financial years.",
            "In January 2024, the Board proposed to appoint Ms. Priya as an Independent Director. However, the Audit Committee raised an issue regarding her previous engagement as a legal advisor for the company 2 years ago.",
            "The Board seeks clarification under the relevant provisions of the Companies Act, 2013 regarding director disqualifications, independent director eligibility, and board composition requirements."
          ],
          questions: [
            {
              id: 101,
              text: "Is Mr. Rajesh disqualified from being re-appointed as a director in ABC Limited or appointed in any other company under Section 164(2) of the Companies Act, 2013?",
              options: [
                { letter: "A", text: "Yes, he is disqualified for a period of 5 years from the date of default." },
                { letter: "B", text: "No, default in filing financial statements only attracts monetary penalties." },
                { letter: "C", text: "Yes, but disqualification applies only to listed public companies." },
                { letter: "D", text: "No, disqualification applies only if default exceeds 5 consecutive financial years." }
              ],
              correctLetter: "A",
              explanation: "Under Section 164(2)(a) of the Companies Act, 2013, any person who is or has been a director of a company which has not filed financial statements or annual returns for any continuous period of 3 financial years shall be disqualified for 5 years."
            },
            {
              id: 102,
              text: "Does ABC Limited require at least 2 Independent Directors under Rule 4 of the Companies (Appointment and Qualification of Directors) Rules, 2014?",
              options: [
                { letter: "A", text: "No, independent directors are mandatory only for listed companies." },
                { letter: "B", text: "Yes, unlisted public companies with paid-up capital of Rs. 10 Crores or more must have at least 2 Independent Directors." },
                { letter: "C", text: "Yes, but only if turnover exceeds Rs. 200 Crores." },
                { letter: "D", text: "No, ABC Limited requires at least 3 Independent Directors." }
              ],
              correctLetter: "B",
              explanation: "Rule 4 of the Companies (Appointment and Qualification of Directors) Rules, 2014 prescribes that unlisted public companies with paid-up share capital of Rs. 10 Crore or more shall have at least 2 independent directors."
            },
            {
              id: 103,
              text: "Is Ms. Priya eligible to be appointed as an Independent Director of ABC Limited under Section 149(6)?",
              options: [
                { letter: "A", text: "Yes, because legal advisory fees do not affect independence." },
                { letter: "B", text: "No, if she had a material pecuniary relationship during the immediately preceding 3 financial years." },
                { letter: "C", text: "Yes, provided her total advisory fee was less than 50% of her total income." },
                { letter: "D", text: "No, former legal advisors are permanently barred from becoming Independent Directors." }
              ],
              correctLetter: "B",
              explanation: "Section 149(6)(e) provides that an Independent Director should not have held pecuniary relationships or been an employee/proprietor/partner of a firm of legal consultants in any of the 3 preceding financial years."
            },
            {
              id: 104,
              text: "What is the maximum penalty for a director who acts despite knowing his disqualification under Section 164(2)?",
              options: [
                { letter: "A", text: "Fine of Rs. 1 Lakh to Rs. 5 Lakhs or imprisonment up to 1 year or both." },
                { letter: "B", text: "Disqualification extension by 2 additional years." },
                { letter: "C", text: "Imprisonment up to 3 years." },
                { letter: "D", text: "Monetary penalty of Rs. 10,000 only." }
              ],
              correctLetter: "A",
              explanation: "Under Section 167(2) of the Companies Act, 2013, if a director functions despite knowing that his office has become vacant, he shall be punishable with imprisonment up to 1 year or fine of Rs. 1 Lakh to Rs. 5 Lakhs or both."
            }
          ]
        }
      ];
    }

    // Fetch case_questions for each case
    const casesWithQuestions = await Promise.all(
      casesData.map(async (c) => {
        const { data: qData } = await supabase
          .from("case_questions")
          .select("*")
          .or(`case_id.eq.${c.id},case_code.eq.${c.case_code || c.id}`);

        const formattedQuestions = (qData || []).map((q, idx) => ({
          id: q.id || idx + 1,
          text: q.text || q.question_text || q.question || "",
          options: Array.isArray(q.options)
            ? q.options
            : [
                { letter: "A", text: q.option_a || q.a },
                { letter: "B", text: q.option_b || q.b },
                { letter: "C", text: q.option_c || q.c },
                { letter: "D", text: q.option_d || q.d },
              ].filter((o) => o.text),
          correctLetter: (q.correctLetter || q.correct_letter || q.correct_option || "A").toUpperCase(),
          explanation: q.explanation || "",
        }));

        return {
          id: c.id,
          case_code: c.case_code || c.id,
          tag: c.tag || "CASE SCENARIO",
          title: c.title,
          body: c.body || c.description || "",
          paragraphs: (c.body || c.description || "")
            .split(/\n\s*\n/)
            .filter((p) => p.trim().length > 0),
          questions: formattedQuestions,
        };
      })
    );

    return casesWithQuestions;
  } catch (err) {
    console.warn("Failed to load cases from Supabase:", err);
    return [];
  }
}
