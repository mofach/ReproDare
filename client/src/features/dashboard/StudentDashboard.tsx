/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/api/axios';
import { useAuthStore } from '@/store/useAuthStore';
import { Dices, PlayCircle, Loader2, RefreshCcw } from 'lucide-react';

// Sesuaikan interface dengan respons backend sesungguhnya
interface Session {
  id: number;
  title: string;
  status: 'waiting' | 'running' | 'finished'; // Backend pakai lowercase
  createdAt: string;
  teacher?: { name: string };
  category?: { name: string };
}

export default function StudentDashboard() {
  const { user } = useAuthStore();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSessions = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/sessions');
      // Respons backend Anda: { ok: true, items: [...] }
      const data = res.data.items || res.data.data || res.data;
      
      // PERBAIKAN FILTER: Gunakan lowercase 'waiting' dan 'running' sesuai database
      const available = Array.isArray(data) 
        ? data.filter((s: any) => s.status === 'waiting' || s.status === 'running')
        : [];
      
      setSessions(available);
    } catch (error) {
      console.error("Gagal load sesi", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  return (
    <DashboardLayout role="student">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Halo, {user?.name}! 👋</h1>
            <p className="text-muted-foreground mt-1">
              Siap untuk bermain? Pilih sesi yang tersedia di bawah ini.
            </p>
          </div>
          <Button variant="outline" size="icon" onClick={fetchSessions} title="Refresh Lobby">
            <RefreshCcw className="h-4 w-4" />
          </Button>
        </div>

        {/* List Sessions */}
        {isLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : sessions.length === 0 ? (
          <div className="rounded-lg bg-slate-50 p-6 border-2 border-dashed text-center py-12">
            <div className="bg-muted/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
               <Dices className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium">Belum ada sesi game aktif</h3>
            <p className="text-sm text-muted-foreground mt-2">
              Tunggu guru kamu membuat sesi baru, lalu refresh halaman ini.
            </p>
            <Button variant="outline" onClick={fetchSessions} className="mt-4">Coba Refresh</Button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {sessions.map((session) => (
              <Card key={session.id} className="hover:border-primary/50 transition-all cursor-default flex flex-col justify-between">
                <CardHeader>
                  <div className="flex justify-between items-start mb-2">
                    <span className={`px-2 py-1 text-xs font-bold rounded-full animate-pulse ${
                      session.status === 'running' 
                        ? 'bg-orange-100 text-orange-700' 
                        : 'bg-green-100 text-green-700'
                    }`}>
                      {session.status === 'running' ? 'GAME DIMULAI' : 'LOBBY DIBUKA'}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      #{session.id}
                    </span>
                  </div>
                  <CardTitle className="text-xl line-clamp-1">{session.title}</CardTitle>
                  <CardDescription>
                    Oleh: {session.teacher?.name || 'Guru'} <br/>
                    Topik: {session.category?.name || 'Umum'}
                  </CardDescription>
                </CardHeader>
                <CardFooter>
                  <Link to={`/game/lobby/${session.id}`} className="w-full">
                    <Button className="w-full gap-2 bg-gradient-to-r from-primary to-teal-500 hover:from-primary/90 hover:to-teal-600 border-0">
                      <PlayCircle className="h-4 w-4" /> 
                      {session.status === 'running' ? 'Masuk Kembali' : 'Gabung Game'}
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}