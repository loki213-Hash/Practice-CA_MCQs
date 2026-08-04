import { supabase } from "../supabase/supabase";

export async function getTopicsForChapter(chapterId) {
  try {
    // 1. Fetch topics from topics table
    const { data: dbTopics, error: dbErr } = await supabase
      .from("topics")
      .select("*")
      .eq("chapter_id", chapterId)
      .order("display_order", { ascending: true });

    if (!dbErr && dbTopics && dbTopics.length > 0) {
      return dbTopics;
    }

    // 2. Fallback: extract distinct topics from questions table for this chapter
    const { data: qTopics, error: qErr } = await supabase
      .from("questions")
      .select("topic")
      .eq("chapter_id", String(chapterId));

    if (!qErr && qTopics && qTopics.length > 0) {
      const uniqueTopicNames = Array.from(
        new Set(qTopics.map((q) => q.topic?.trim()).filter(Boolean))
      );
      return uniqueTopicNames.map((name, idx) => ({
        id: idx + 1,
        topic_name: name,
        chapter_id: chapterId,
        display_order: idx + 1,
      }));
    }
  } catch (err) {
    console.warn("getTopicsForChapter notice:", err.message);
  }
  return [];
}

export async function getTopicCountsForChapters(chapterIds) {
  const counts = {};
  chapterIds.forEach((id) => { counts[id] = 0; });

  try {
    await Promise.all(
      chapterIds.map(async (cid) => {
        // 1. Check topics table
        let dbTopicCount = 0;
        try {
          const { count, error } = await supabase
            .from("topics")
            .select("*", { count: "exact", head: true })
            .eq("chapter_id", cid);
          if (!error && count !== null) {
            dbTopicCount = count;
          }
        } catch (e) {}

        // 2. Check distinct topics in questions table
        let questionTopicCount = 0;
        try {
          const { data: qData, error: qErr } = await supabase
            .from("questions")
            .select("topic")
            .eq("chapter_id", String(cid));

          if (!qErr && qData) {
            const uniqueQuestionTopics = new Set(
              qData.map((q) => q.topic?.trim()).filter(Boolean)
            );
            questionTopicCount = uniqueQuestionTopics.size;
          }
        } catch (e) {}

        counts[cid] = Math.max(dbTopicCount, questionTopicCount);
      })
    );
  } catch (err) {
    console.warn("getTopicCountsForChapters error:", err);
  }

  return counts;
}
