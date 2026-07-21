import { Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import Course from "./pages/Course";
import ChapterList from "./pages/ChapterList";
import ComingSoon from "./pages/ComingSoon";
import Quiz from "./pages/Quiz";
import Login from "./pages/Login";
import Admin from "./pages/Admin";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/course/:courseSlug" element={<Course />} />
      <Route path="/course/:courseSlug/:setType" element={<ChapterList />} />
      <Route path="/quiz/:chapterId" element={<Quiz />} />
      <Route path="/coming-soon" element={<ComingSoon />} />
      <Route path="/login" element={<Login />} />
      <Route path="/admin" element={<Admin />} />
    </Routes>
  );
}

export default App;
