import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import LoginPage from './pages/Login';
import TeacherDashboard from './pages/TeacherDashboard';
import StudentDashboard from './pages/StudentDashboard';
import TeacherSession from './pages/TeacherSession';
import StudentSession from './pages/StudentSession';
import HistoryPage from './pages/History';
import ProtectedRoute from './components/ProtectedRoute.tsx';


export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<LoginPage />} />
        {/* Protected */}
        <Route
          path="/teacher"
          element={
            <ProtectedRoute roles={['teacher', 'admin']}>
              <TeacherDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/sessions/:id"
          element={
            <ProtectedRoute roles={['teacher', 'admin']}>
              <TeacherSession />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student"
          element={
            <ProtectedRoute roles={['student']}>
              <StudentDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/sessions/:id"
          element={
            <ProtectedRoute roles={['student']}>
              <StudentSession />
            </ProtectedRoute>
          }
        />
        <Route
          path="/history"
          element={
            <ProtectedRoute roles={['student']}>
              <HistoryPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<div className="p-8">404 — Not found</div>} />
      </Routes>
    </BrowserRouter>
  );
}
