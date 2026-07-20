import { useEffect, useState } from "react";
import { getCourses } from "./services/courseService";

function App() {
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    async function loadCourses() {
      const data = await getCourses();
      setCourses(data);
    }

    loadCourses();
  }, []);

  return (
    <div
      style={{
        maxWidth: "900px",
        margin: "40px auto",
        fontFamily: "Arial",
      }}
    >
      <h1>CA Quiz Platform</h1>

      {courses.map((course) => (
        <div
          key={course.id}
          style={{
            border: "1px solid #ddd",
            borderRadius: "10px",
            padding: "20px",
            marginBottom: "20px",
          }}
        >
          <h2>{course.course_name}</h2>

          {course.available ? (
            <button>Start</button>
          ) : (
            <button disabled>Coming Soon</button>
          )}
        </div>
      ))}
    </div>
  );
}

export default App;