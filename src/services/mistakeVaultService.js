import { supabase } from "../supabase/supabase";

const LOCAL_VAULT_KEY = "ca_quiz_mistake_vault";

// ── Helpers ──────────────────────────────────────────────────────────────────

function getLocalVault() {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_VAULT_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveLocalVault(items) {
  try {
    localStorage.setItem(LOCAL_VAULT_KEY, JSON.stringify(items));
  } catch (e) {
    console.warn("Failed to save local vault:", e);
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * After any test completes, save wrong/skipped questions to vault.
 * If a question was answered correctly this time, remove it from vault (mastered).
 * @param {Array} questions  — active question objects from the test
 * @param {Array} answers    — student's answers (null = skipped, letter = chosen)
 * @param {string|number} chapterIdFallback — chapter id to use if q.chapter_id missing
 */
export async function saveToMistakeVault(questions, answers, chapterIdFallback = "") {
  if (!Array.isArray(questions) || questions.length === 0) return;

  const now = new Date().toISOString();

  const toAdd = [];    // wrong or skipped
  const toRemove = []; // now correct → remove from vault

  questions.forEach((q, i) => {
    const chosen = answers[i];
    const isCorrect =
      chosen &&
      String(chosen).toUpperCase() === String(q.correct_option || "").toUpperCase();

    if (isCorrect) {
      toRemove.push(String(q.id));
    } else {
      toAdd.push({
        question_id: String(q.id),
        chapter_id: String(q.chapter_id || chapterIdFallback),
        question_text: q.question || q.text || "",
        option_a: q.option_a || "",
        option_b: q.option_b || "",
        option_c: q.option_c || "",
        option_d: q.option_d || "",
        correct_option: String(q.correct_option || "A").toUpperCase(),
        explanation: q.explanation || "",
        topic: q.topic || "General",
        is_priority: !!q.is_priority,
        last_wrong_at: now,
      });
    }
  });

  // ── 1. Update localStorage cache ──
  let local = getLocalVault();

  // Remove mastered
  local = local.filter((v) => !toRemove.includes(String(v.question_id)));

  // Add / update wrong
  toAdd.forEach((item) => {
    const idx = local.findIndex((v) => v.question_id === item.question_id);
    if (idx !== -1) {
      local[idx].attempt_count = (local[idx].attempt_count || 1) + 1;
      local[idx].last_wrong_at = now;
    } else {
      local.push({ ...item, attempt_count: 1 });
    }
  });

  saveLocalVault(local);

  // ── 2. Sync to Supabase if logged in ──
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    // Remove mastered from DB
    if (toRemove.length > 0) {
      await supabase
        .from("student_mistake_vault")
        .delete()
        .eq("user_id", user.id)
        .in("question_id", toRemove);
    }

    // Upsert wrong/skipped
    if (toAdd.length > 0) {
      const upsertRows = toAdd.map((item) => ({
        user_id: user.id,
        ...item,
      }));
      await supabase
        .from("student_mistake_vault")
        .upsert(upsertRows, {
          onConflict: "user_id,question_id",
          ignoreDuplicates: false,
        });
    }
  } catch (err) {
    console.warn("Supabase vault sync notice:", err);
  }
}

/**
 * Fetch all vault questions for the current user.
 * Merges Supabase DB (authoritative) with localStorage (guest fallback).
 */
export async function getMistakeVaultQuestions() {
  const local = getLocalVault();

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data: dbItems, error } = await supabase
        .from("student_mistake_vault")
        .select("*")
        .eq("user_id", user.id)
        .order("last_wrong_at", { ascending: false });

      if (!error && dbItems && dbItems.length > 0) {
        const dbIds = new Set(dbItems.map((d) => String(d.question_id)));
        const localOnly = local.filter((l) => !dbIds.has(String(l.question_id)));
        return [...dbItems, ...localOnly];
      }
    }
  } catch (err) {
    console.warn("Vault fetch from Supabase notice:", err);
  }

  return local;
}

/**
 * Remove a single question from the vault (student mastered it).
 */
export async function removeFromVault(questionId) {
  const qId = String(questionId);

  // Remove from local
  const updated = getLocalVault().filter((v) => String(v.question_id) !== qId);
  saveLocalVault(updated);

  // Remove from Supabase
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from("student_mistake_vault")
        .delete()
        .eq("user_id", user.id)
        .eq("question_id", qId);
    }
  } catch (err) {
    console.warn("Remove from vault notice:", err);
  }
}

/**
 * Get a quick count of vault questions (for nav badges, home dashboard).
 */
export async function getVaultCount() {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { count } = await supabase
        .from("student_mistake_vault")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);
      return count || 0;
    }
  } catch {
    // ignore
  }
  return getLocalVault().length;
}
