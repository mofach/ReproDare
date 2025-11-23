import { Routes, Route, Navigate } from 'react-router-dom';

// --- Auth Features ---
import LoginPage from '@/features/auth/LoginPage';
import RegisterPage from '@/features/auth/RegisterPage';

// --- Teacher Features ---
import TeacherDashboard from '@/features/dashboard/TeacherDashboard';
import TeacherSessions from '@/features/dashboard/TeacherSessions';
import TeacherCategories from '@/features/dashboard/TeacherCategories';
import TeacherCardList from '@/features/dashboard/TeacherCardList';
import TeacherStudents from '@/features/dashboard/TeacherStudents';

// --- Student Features ---
import StudentDashboard from '@/features/dashboard/StudentDashboard';
import StudentHistory from '@/features/dashboard/StudentHistory'; // <--- Import Baru

// --- Admin Features ---
import AdminDashboard from '@/features/dashboard/AdminDashboard';
import AdminTeachers from '@/features/dashboard/AdminTeachers';
import AdminStudents from '@/features/dashboard/AdminStudents';

// --- Game Features ---
import LobbyPage from '@/features/game/LobbyPage';
import GameArena from '@/features/game/GameArena';

function App() {
  return (
    <Routes>
      {/* --- PUBLIC ROUTES --- */}
      {/* Redirect root ke login */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* --- TEACHER DASHBOARD ROUTES --- */}
      <Route path="/teacher-dashboard" element={<TeacherDashboard />} />
      <Route path="/teacher-dashboard/sessions" element={<TeacherSessions />} />
      <Route path="/teacher-dashboard/cards" element={<TeacherCategories />} />
      <Route path="/teacher-dashboard/cards/:categoryId" element={<TeacherCardList />} />
      <Route path="/teacher-dashboard/students" element={<TeacherStudents />} />

      {/* --- STUDENT DASHBOARD ROUTES --- */}
      <Route path="/student-dashboard" element={<StudentDashboard />} />
      <Route path="/student-dashboard" element={<StudentDashboard />} />
      <Route path="/student-dashboard/history" element={<StudentHistory />} />
      
      {/* --- ADMIN DASHBOARD ROUTES --- */}
      <Route path="/admin-dashboard" element={<AdminDashboard />} />
      <Route path="/admin-dashboard/teachers" element={<AdminTeachers />} />
      <Route path="/admin-dashboard/students" element={<AdminStudents />} />

      {/* --- GAME ROUTES --- */}
    <Route path="/game/lobby/:sessionId" element={<LobbyPage />} />
    <Route path="/game/play/:sessionId" element={<GameArena />} />

      {/* --- 404 NOT FOUND --- */}
      <Route path="*" element={
        <div className="flex h-screen w-full flex-col items-center justify-center gap-4 bg-muted/20">
          <h1 className="text-4xl font-bold text-primary">404</h1>
          <p className="text-muted-foreground">Halaman tidak ditemukan.</p>
          <button 
            onClick={() => window.history.back()}
            className="text-sm font-medium text-primary hover:underline"
          >
            Kembali ke Halaman Sebelumnya
          </button>
        </div>
      } />
    </Routes>
  );
}

export default App;