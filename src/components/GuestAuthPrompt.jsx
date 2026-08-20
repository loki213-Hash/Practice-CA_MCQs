import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import AuthModal from "./AuthModal";

const GUEST_START_KEY = "ca_quiz_guest_session_start_time";
const SNOOZE_STORAGE_KEY = "ca_quiz_guest_snooze_until";
const THRESHOLD_SECONDS = 300; // 5 minutes of guest session duration

/**
 * GuestAuthPrompt
 * Tracks guest session duration based on real wall-clock timestamps.
 * Continues running seamlessly if the user changes tabs or minimizes.
 * After 5 minutes, prompts the student to Login or Register to preserve
 * test progress, mistake vault, and bookmarks.
 */
export default function GuestAuthPrompt() {
  const { user } = useAuth();
  const [showPrompt, setShowPrompt] = useState(false);

  const checkElapsed = useCallback(() => {
    if (user) {
      setShowPrompt(false);
      return;
    }

    // Check if snooze is currently active
    const snoozeUntil = Number(sessionStorage.getItem(SNOOZE_STORAGE_KEY) || 0);
    if (snoozeUntil && Date.now() < snoozeUntil) {
      return;
    }

    // Get or initialize guest session start timestamp
    let startTime = Number(sessionStorage.getItem(GUEST_START_KEY) || 0);
    if (!startTime) {
      startTime = Date.now();
      sessionStorage.setItem(GUEST_START_KEY, startTime.toString());
    }

    const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);

    if (elapsedSeconds >= THRESHOLD_SECONDS && !showPrompt) {
      setShowPrompt(true);
    }
  }, [user, showPrompt]);

  useEffect(() => {
    if (user) {
      setShowPrompt(false);
      return;
    }

    // Initial check
    checkElapsed();

    // Regular interval check
    const interval = setInterval(checkElapsed, 1000);

    // Event listeners to handle tab switching and window focus without freezing
    const handleVisibility = () => {
      checkElapsed();
    };

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("focus", handleVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("focus", handleVisibility);
    };
  }, [user, checkElapsed]);

  const handleClose = () => {
    setShowPrompt(false);
    // Snooze for 10 minutes (600s) before prompting again if still in guest mode
    sessionStorage.setItem(SNOOZE_STORAGE_KEY, (Date.now() + 10 * 60 * 1000).toString());
    // Reset start time so next 5-minute counter begins after snooze
    sessionStorage.setItem(GUEST_START_KEY, (Date.now() + 10 * 60 * 1000).toString());
  };

  const handleSuccess = () => {
    setShowPrompt(false);
    sessionStorage.removeItem(GUEST_START_KEY);
    sessionStorage.removeItem(SNOOZE_STORAGE_KEY);
    // Trigger platform-wide progress sync for the newly logged-in student
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("ca_quiz_progress_updated"));
    }
  };

  if (!showPrompt || user) return null;

  return (
    <AuthModal
      isOpen={showPrompt}
      onClose={handleClose}
      onSuccess={handleSuccess}
      initialMode="register"
      allowClose={false}
      bannerNotice="✨ You've been practicing for over 5 minutes as a guest! Create a free account or sign in to save your test progress, track chapter accuracy, and access your Mistake Vault across all devices."
    />
  );
}
