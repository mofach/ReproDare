/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/api/axios';
import { useAuthStore } from '@/store/useAuthStore';
import { Dices, PlayCircle, Loader2, RefreshCcw, Trophy } from 'lucide-react';

// Sesuaikan interface dengan respons backend
interface Session {
  id: number;
  title: string;
  status: 'waiting' | 'running' | 'finished';
  createdAt: string;
  teacher?: { name: string };
  category?: { name: string };
}

export default function StudentDashboard() {
  const { user } = useAuthStore();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [totalScore, setTotalScore] = useState(0); // State untuk Total Poin
  const [isLoading, setIsLoading] = useState(true);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      // 1. Load Sesi Game
      const sessRes = await api.get('/sessions');
      const data = sessRes.data.items || sessRes.data.data || sessRes.data;
      
      // Filter: Hanya status waiting atau running
      const available = Array.isArray(data) 
        ? data.filter((s: any) => s.status === 'waiting' || s.status === 'running')
        : [];
      setSessions(available);

      // 2. Load Total Score (Fitur Baru)
      const scoreRes = await api.get('/users/me/score');
      setTotalScore(scoreRes.data.score || 0);

    } catch (error) {
      console.error("Gagal load data dashboard", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return (
    <DashboardLayout role="student">
      <div className="space-y-6">
        
        {/* HEADER & SCORE CARD SECTION */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Halo, {user?.name}! 👋</h1>
            <p className="text-muted-foreground mt-1">
              Siap untuk bermain? Pilih sesi yang tersedia di bawah ini.
            </p>
          </div>

          {/* KARTU TOTAL POIN */}
          <Card className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-0 shadow-lg min-w-[200px] w-full md:w-auto">
             <div className="p-4 flex items-center gap-4">
                <div className="bg-white/20 p-3 rounded-full backdrop-blur-sm">
                    <Trophy className="h-6 w-6 text-white" />
                </div>
                <div>
                    <p className="text-[10px] font-bold uppercase text-yellow-100 tracking-wider">Total Poinmu</p>
                    <p className="text-3xl font-extrabold">{totalScore}</p>
                </div>
             </div>
          </Card>
        </div>

        {/* ACTION BAR */}
        <div className="flex items-center justify-between pt-4">
             <h2 className="text-xl font-semibold flex items-center gap-2">
               <Dices className="h-5 w-5 text-primary" /> Lobby Tersedia
             </h2>
             <Button variant="outline" size="sm" onClick={fetchDashboardData} title="Refresh Lobby" className="gap-2">
                <RefreshCcw className="h-4 w-4" /> Refresh
             </Button>
        </div>

        {/* LIST SESSION GRID */}
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
            <Button variant="outline" onClick={fetchDashboardData} className="mt-4">Coba Refresh</Button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {sessions.map((session) => (
              <Card key={session.id} className="hover:border-primary/50 transition-all cursor-default flex flex-col justify-between shadow-sm hover:shadow-md">
                <CardHeader>
                  <div className="flex justify-between items-start mb-2">
                    <span className={`px-2 py-1 text-xs font-bold rounded-full animate-pulse ${
                      session.status === 'running' 
                        ? 'bg-orange-100 text-orange-700' 
                        : 'bg-green-100 text-green-700'
                    }`}>
                      {session.status === 'running' ? 'GAME DIMULAI' : 'LOBBY DIBUKA'}
                    </span>
                    <span className="text-xs text-muted-foreground bg-slate-100 px-2 py-1 rounded">
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
                    <Button className="w-full gap-2 bg-gradient-to-r from-primary to-teal-500 hover:from-primary/90 hover:to-teal-600 border-0 font-semibold shadow-md shadow-primary/20">
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