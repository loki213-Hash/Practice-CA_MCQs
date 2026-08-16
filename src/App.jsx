import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import Home from "./pages/Home";

const Course = lazy(() => import("./pages/Course"));
const ChapterList = lazy(() => import("./pages/ChapterList"));
const ComingSoon = lazy(() => import("./pages/ComingSoon"));
const Quiz = lazy(() => import("./pages/Quiz"));
const Login = lazy(() => import("./pages/Login"));
const Admin = lazy(() => import("./pages/Admin"));
const NotFound = lazy(() => import("./pages/NotFound"));
const TakeTest = lazy(() => import("./pages/TakeTest"));
const MistakeVault = lazy(() => import("./pages/MistakeVault"));

function App() {
  return (
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
  );
}

export default App;

