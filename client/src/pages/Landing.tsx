// client/src/pages/Landing.tsx
import { Link } from 'react-router-dom';
export default function Landing() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Reprodare</h1>
        <p className="mb-6">A safe, gamified "Truth or Dare" for counseling classrooms.</p>
        <div className="space-x-3">
          <Link to="/login" className="px-4 py-2 bg-sky-600 text-white rounded">Sign In</Link>
        </div>
      </div>
    </div>
  );
}
