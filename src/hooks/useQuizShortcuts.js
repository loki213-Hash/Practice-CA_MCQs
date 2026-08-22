import { useEffect } from "react";

/**
 * Custom hook to enable keyboard shortcuts during Quiz / Test sessions.
 * 
 * @param {Object} options
 * @param {boolean} [options.enabled=true] - Enable shortcuts when true
 * @param {Function} [options.onNext] - Triggered by Right Arrow or 'N'
 * @param {Function} [options.onPrev] - Triggered by Left Arrow or 'P'
 * @param {Function} [options.onSelectOption] - Triggered by '1'-'4' (0-indexed)
 * @param {Function} [options.onMarkAndNext] - Triggered by 'M'
 * @param {Function} [options.onClearResponse] - Triggered by 'C'
 * @param {Function} [options.onSubmit] - Triggered by Ctrl+Enter or Alt+S
 * @param {Function} [options.onBookmark] - Triggered by 'B' or Alt+B
 */
export function useQuizShortcuts({
  enabled = true,
  onNext,
  onPrev,
  onSelectOption,
  onMarkAndNext,
  onClearResponse,
  onSubmit,
  onBookmark,
}) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e) => {
      // Don't capture shortcuts when user is typing in text inputs, textareas, or dropdowns
      const target = e.target;
      const isEditable =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.isContentEditable;

      if (isEditable) return;

      // Submit test shortcut: Ctrl + Enter or Alt + S
      if ((e.ctrlKey && e.key === "Enter") || (e.altKey && (e.key === "s" || e.key === "S"))) {
        if (onSubmit) {
          e.preventDefault();
          onSubmit();
        }
        return;
      }

      // Bookmark shortcut via Alt + B
      if (e.altKey && (e.key === "b" || e.key === "B")) {
        if (onBookmark) {
          e.preventDefault();
          onBookmark();
        }
        return;
      }

      // Ignore single key shortcuts if modifier keys (Ctrl/Alt/Meta) are active
      if (e.ctrlKey || e.altKey || e.metaKey) return;

      const key = e.key;

      // Next Question: Right Arrow or 'n' / 'N'
      if (key === "ArrowRight" || key === "n" || key === "N") {
        if (onNext) {
          e.preventDefault();
          onNext();
        }
        return;
      }

      // Previous Question: Left Arrow or 'p' / 'P'
      if (key === "ArrowLeft" || key === "p" || key === "P") {
        if (onPrev) {
          e.preventDefault();
          onPrev();
        }
        return;
      }

      // Bookmark: 'b' or 'B'
      if (key === "b" || key === "B") {
        if (onBookmark) {
          e.preventDefault();
          onBookmark();
        }
        return;
      }

      // Mark for Review & Next: 'm' or 'M'
      if (key === "m" || key === "M") {
        if (onMarkAndNext) {
          e.preventDefault();
          onMarkAndNext();
        }
        return;
      }

      // Clear Response: 'c' or 'C'
      if (key === "c" || key === "C") {
        if (onClearResponse) {
          e.preventDefault();
          onClearResponse();
        }
        return;
      }

      // Option selection by numbers 1, 2, 3, 4 (Options A, B, C, D)
      if (["1", "2", "3", "4"].includes(key)) {
        if (onSelectOption) {
          e.preventDefault();
          onSelectOption(parseInt(key, 10) - 1);
        }
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [enabled, onNext, onPrev, onSelectOption, onMarkAndNext, onClearResponse, onSubmit, onBookmark]);
}

export default useQuizShortcuts;
