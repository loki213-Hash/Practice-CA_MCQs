import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import Home from "./pages/Home";

// Helper to auto-retry dynamic module loading on new deployments
function lazyWithRetry(componentImport) {
  return lazy(async () => {
    const pageHasAlreadyBeenForceRefreshed = JSON.parse(
      window.sessionStorage.getItem("page-has-been-force-refreshed") || "false"
    );

    try {
      const component = await componentImport();
      window.sessionStorage.setItem("page-has-been-force-refreshed", "false");
      return component;
    } catch (error) {
      if (!pageHasAlreadyBeenForceRefreshed) {
        window.sessionStorage.setItem("page-has-been-force-refreshed", "true");
        window.location.reload();
        return;
      }
      throw error;
    }
  });
}

const Course = lazyWithRetry(() => import("./pages/Course"));
const ChapterList = lazyWithRetry(() => import("./pages/ChapterList"));
const ComingSoon = lazyWithRetry(() => import("./pages/ComingSoon"));
const Quiz = lazyWithRetry(() => import("./pages/Quiz"));
const Login = lazyWithRetry(() => import("./pages/Login"));
const Admin = lazyWithRetry(() => import("./pages/Admin"));
const NotFound = lazyWithRetry(() => import("./pages/NotFound"));
const TakeTest = lazyWithRetry(() => import("./pages/TakeTest"));
const MistakeVault = lazyWithRetry(() => import("./pages/MistakeVault"));

import AnalyticsTracker from "./components/AnalyticsTracker";
import GuestAuthPrompt from "./components/GuestAuthPrompt";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";

function App() {
  return (
    <>
      <Analytics />
      <SpeedInsights />
      <AnalyticsTracker />
      <GuestAuthPrompt />
      <Suspense fallback={<div className="loader-container">Loading...</div>}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/course/:courseSlug" element={<Course />} />
          <Route path="/course/:courseSlug/:setType" element={<ChapterList />} />
          <Route path="/quiz/:chapterId" element={<Quiz />} />
          <Route path="/take-test/:courseSlug" element={<TakeTest />} />
          <Route path="/vault" element={<MistakeVault />} />
          <Route path="/coming-soon" element={<ComingSoon />} />
          <Route path="/login" element={<Login />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </>
  );
}

export default App;
