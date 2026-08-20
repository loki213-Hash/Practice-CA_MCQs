import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { recordVisitAndHeartbeat, setupRealtimePresence } from "../services/analyticsService";

/**
 * Global Real-Time Analytics & Presence Tracker
 * Mounts once at the root level of App to track all visitors and student sessions
 */
export default function AnalyticsTracker() {
  const location = useLocation();
  const { user, username } = useAuth();
  const presenceRef = useRef(null);

  let rawPath = location.pathname + location.search + location.hash;
  let fullPath = rawPath;
  try {
    fullPath = decodeURI(rawPath);
  } catch {
    fullPath = rawPath;
  }

  const currentPathRef = useRef(fullPath);
  const currentUserRef = useRef(user);
  const currentUsernameRef = useRef(username);

  // Keep refs always up to date
  useEffect(() => {
    currentPathRef.current = fullPath;
    currentUserRef.current = user;
    currentUsernameRef.current = username;
  }, [fullPath, user, username]);

  // Initial Presence Channel Setup
  useEffect(() => {
    // Record initial visit immediately
    recordVisitAndHeartbeat({
      user,
      username,
      pagePath: fullPath,
    });

    // Setup Supabase Realtime Presence Channel
    const presenceObj = setupRealtimePresence({
      user,
      username,
      pagePath: fullPath,
    });
    presenceRef.current = presenceObj;

    // Periodic Heartbeat every 25 seconds using latest ref values
    const heartbeatInterval = setInterval(() => {
      const u = currentUserRef.current;
      const un = currentUsernameRef.current;
      const p = currentPathRef.current;
      recordVisitAndHeartbeat({
        user: u,
        username: un,
        pagePath: p,
      });
      if (presenceRef.current?.updatePresence) {
        presenceRef.current.updatePresence({
          user: u,
          username: un,
          pagePath: p,
        });
      }
    }, 25000);

    // Tab visibility change handler
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        const u = currentUserRef.current;
        const un = currentUsernameRef.current;
        const p = currentPathRef.current;
        recordVisitAndHeartbeat({
          user: u,
          username: un,
          pagePath: p,
        });
        if (presenceRef.current?.updatePresence) {
          presenceRef.current.updatePresence({
            user: u,
            username: un,
            pagePath: p,
          });
        }
      }
    };

    // Instant auth/progress update handler
    const handleAuthOrProgressUpdate = () => {
      const u = currentUserRef.current;
      const un = currentUsernameRef.current;
      const p = currentPathRef.current;
      recordVisitAndHeartbeat({
        user: u,
        username: un,
        pagePath: p,
      });
      if (presenceRef.current?.updatePresence) {
        presenceRef.current.updatePresence({
          user: u,
          username: un,
          pagePath: p,
        });
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("ca_quiz_auth_changed", handleAuthOrProgressUpdate);
    window.addEventListener("ca_quiz_progress_updated", handleAuthOrProgressUpdate);

    return () => {
      clearInterval(heartbeatInterval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("ca_quiz_auth_changed", handleAuthOrProgressUpdate);
      window.removeEventListener("ca_quiz_progress_updated", handleAuthOrProgressUpdate);
      if (presenceRef.current?.unsubscribe) {
        presenceRef.current.unsubscribe();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update presence and database log whenever path or user changes
  useEffect(() => {
    recordVisitAndHeartbeat({
      user,
      username,
      pagePath: fullPath,
    });

    if (presenceRef.current?.updatePresence) {
      presenceRef.current.updatePresence({
        user,
        username,
        pagePath: fullPath,
      });
    }
  }, [fullPath, user, username]);

  return null;
}
