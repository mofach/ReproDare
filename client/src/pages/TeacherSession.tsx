// client/src/pages/TeacherSession.tsx
import { useParams } from 'react-router-dom';
export default function TeacherSession() {
  const params = useParams();
  return <div className="p-6">Teacher Session (stub) — sessionId: {params.id}</div>;
}
