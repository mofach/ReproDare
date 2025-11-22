// client/src/pages/StudentSession.tsx
import { useParams } from 'react-router-dom';
export default function StudentSession() {
  const params = useParams();
  return <div className="p-6">Student Session (stub) — sessionId: {params.id}</div>;
}
