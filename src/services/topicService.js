import { supabase } from "../supabase/supabase";

export async function getTopicsForChapter(chapterId) {
  try {
    const { data, error } = await supabase
      .from("topics")
      .select("*")
      .eq("chapter_id", chapterId)
      .order("display_order", { ascending: true });

    if (!error && data && data.length > 0) {
      return data;
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
        const { count, error } = await supabase
          .from("topics")
          .select("*", { count: "exact", head: true })
          .eq("chapter_id", cid);

        if (!error && count !== null) {
          counts[cid] = count;
        }
      })
    );
  } catch (err) {
    console.warn("getTopicCountsForChapters error:", err);
  }

  return counts;
}
