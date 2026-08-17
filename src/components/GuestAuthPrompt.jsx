import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import AuthModal from "./AuthModal";

const TIMER_STORAGE_KEY = "ca_quiz_guest_active_sec";
const SNOOZE_STORAGE_KEY = "ca_quiz_guest_snooze_until";
const THRESHOLD_SECONDS = 300; // 5 minutes of active guest preparation

/**
 * GuestAuthPrompt
 * Tracks active guest session duration across all pages.
 * After 5 minutes of active preparation, gracefully prompts the student
 * to Login or Register so their progress, weak chapters, and Mistake Vault
 * are preserved, allowing them to seamlessly continue right from where they stopped.
 */
export default function GuestAuthPrompt() {
  const { user } = useAuth();
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // If user is already authenticated, do not run guest timer
    if (user) {
      setShowPrompt(false);
      return;
    }

    const interval = setInterval(() => {
      // Don't accumulate time if user has minimized tab
      if (document.hidden) return;

      // Check if previously snoozed
      const snoozeUntil = Number(sessionStorage.getItem(SNOOZE_STORAGE_KEY) || 0);
      if (snoozeUntil && Date.now() < snoozeUntil) {
        return;
      }

      const currentSec = Number(sessionStorage.getItem(TIMER_STORAGE_KEY) || 0) + 1;
      sessionStorage.setItem(TIMER_STORAGE_KEY, currentSec.toString());

      if (currentSec >= THRESHOLD_SECONDS && !showPrompt) {
        setShowPrompt(true);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [user, showPrompt]);

  const handleClose = () => {
    setShowPrompt(false);
    // Snooze for 10 minutes (600s) before prompting again if still in guest mode
    sessionStorage.setItem(SNOOZE_STORAGE_KEY, (Date.now() + 10 * 60 * 1000).toString());
    // Reset active counter so next threshold starts after snooze
    sessionStorage.setItem(TIMER_STORAGE_KEY, "0");
  };

  const handleSuccess = () => {
    setShowPrompt(false);
    sessionStorage.removeItem(TIMER_STORAGE_KEY);
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
      bannerNotice="✨ You've been practicing for over 5 minutes as a guest! Create a free account or sign in to save your test progress, track chapter accuracy, and access your Mistake Vault across all devices."
    />
  );
}
