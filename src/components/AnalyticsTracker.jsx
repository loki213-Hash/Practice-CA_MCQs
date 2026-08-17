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

  // Initial Presence Channel Setup
  useEffect(() => {
    // Record initial visit immediately
    recordVisitAndHeartbeat({
      user,
      username,
      pagePath: location.pathname,
    });

    // Setup Supabase Realtime Presence Channel
    const presenceObj = setupRealtimePresence({
      user,
      username,
      pagePath: location.pathname,
    });
    presenceRef.current = presenceObj;

    // Periodic Heartbeat every 30 seconds
    const heartbeatInterval = setInterval(() => {
      recordVisitAndHeartbeat({
        user,
        username,
        pagePath: location.pathname,
      });
    }, 30000);

    // Tab visibility change handler
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        recordVisitAndHeartbeat({
          user,
          username,
          pagePath: location.pathname,
        });
        if (presenceRef.current?.updatePresence) {
          presenceRef.current.updatePresence({
            user,
            username,
            pagePath: location.pathname,
          });
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(heartbeatInterval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
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
      pagePath: location.pathname,
    });

    if (presenceRef.current?.updatePresence) {
      presenceRef.current.updatePresence({
        user,
        username,
        pagePath: location.pathname,
      });
    }
  }, [location.pathname, user, username]);

  return null;
}
