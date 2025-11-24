/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSocket } from '@/hooks/useSocket';
import { useAuthStore } from '@/store/useAuthStore';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { api } from '@/api/axios';
import { Loader2, Users, Crown, LogOut, Copy, Wifi, WifiOff } from 'lucide-react';
import { useAudio } from '@/hooks/useAudio';

interface Participant {
  id: number;
  userId: number;
  is_present: boolean;
  user: {
    id: number;
    name: string;
    role: string;
  }
}

interface SessionDetail {
  id: number;
  title: string;
  status: string;
  teacher: { id: number; name: string };
  category: { name: string };
}

export default function LobbyPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  
  const { socket, isConnected } = useSocket();
  const { user } = useAuthStore();
  
  const [session, setSession] = useState<SessionDetail | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const lobbyMusic = useAudio('https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'); 

  useEffect(() => {
    lobbyMusic.play();
    return () => lobbyMusic.stop();
  }, []);

  // --- 1. FETCH DATA AWAL ---
  useEffect(() => {
    const fetchSession = async () => {
      try {
        const res = await api.get(`/sessions/${sessionId}`);
        const data = res.data.session || res.data.data || res.data; 
        setSession(data);
        
        if (data.participants) {
          setParticipants(data.participants);
        }

        // FAILSAFE 1: Jika pas masuk status sudah running, langsung lempar ke game
        if (data.status === 'running') {
            console.log("[LOBBY] Sesi sudah berjalan, redirecting...");
            navigate(`/game/play/${sessionId}`);
        }

      } catch (error) {
        console.error("Gagal load sesi", error);
        alert("Sesi tidak ditemukan atau sudah berakhir.");
        navigate('/student-dashboard');
      } finally {
        setIsLoading(false);
      }
    };
    fetchSession();
  }, [sessionId, navigate]);

  // --- 2. SOCKET LOGIC ---
  useEffect(() => {
    if (!socket || !sessionId) return;

    socket.emit('join_lobby', { sessionId });

    // Listener: Update Data Lobby
    const handleLobbyUpdate = (data: any) => {
      // Update list peserta
      if (data && data.participants) {
        setParticipants(data.participants);
      }

      // FAILSAFE 2: Cek status dari update lobby. 
      // Jika backend bilang status berubah jadi 'running', siswa otomatis pindah.
      // Ini mengatasi masalah jika event 'game_started' terlewat.
      if (data && data.status === 'running') {
          console.log("[LOBBY] Status update: RUNNING. Moving to Arena...");
          navigate(`/game/play/${sessionId}`);
      }
    };

    // Listener: Event Start Eksplisit
    const handleGameStart = () => {
      console.log("[LOBBY] Game Start Event received!");
      navigate(`/game/play/${sessionId}`);
    };

    socket.on('lobby_update', handleLobbyUpdate);
    socket.on('game_started', handleGameStart);

    return () => {
      socket.off('lobby_update', handleLobbyUpdate);
      socket.off('game_started', handleGameStart);
    };
  }, [socket, sessionId, navigate]);

  // --- ACTIONS ---
  const handleStartGame = () => {
    if (!socket || !isConnected) return alert("Koneksi terputus.");
    socket.emit('start_game', { sessionId });
  };

  const copyId = () => {
    if (sessionId) {
      navigator.clipboard.writeText(sessionId);
      alert("ID Sesi disalin!");
    }
  };

  // --- FILTERING ---
  const studentParticipants = participants.filter(p => p.user.role === 'student');
  
  // Hitung yang online BENERAN
  const onlineCount = studentParticipants.filter(p => p.is_present).length;

  // --- RENDER ---
  if (isLoading || !session) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 flex-col gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <span className="text-lg font-medium text-muted-foreground">Menyiapkan Lobby...</span>
      </div>
    );
  }

  const isTeacher = user?.role === 'teacher';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-5xl shadow-2xl overflow-hidden border-0">
        
        {/* HEADER */}
        <div className="bg-primary p-8 text-primary-foreground text-center relative overflow-hidden">
           <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent" />
           
           <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/20 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-bold shadow-sm border border-white/10">
             {isConnected ? <Wifi className="h-3 w-3 text-green-400" /> : <WifiOff className="h-3 w-3 text-red-400" />}
             <span className={isConnected ? "text-green-100" : "text-red-100"}>
               {isConnected ? 'CONNECTED' : 'DISCONNECTED'}
             </span>
           </div>
           
           <div className="relative z-10">
             <h1 className="text-3xl md:text-4xl font-extrabold mb-2 tracking-tight">{session.title}</h1>
             <div className="flex items-center justify-center gap-4 text-primary-foreground/80 text-sm md:text-base">
               <span className="flex items-center gap-1"><Users className="h-4 w-4" /> Host: {session.teacher?.name}</span>
               <span className="h-1 w-1 bg-white/50 rounded-full" />
               <span>Topik: {session.category?.name || 'Umum'}</span>
             </div>
             
             <div className="mt-8 inline-flex items-center bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl px-6 py-3 gap-4 transition-all cursor-pointer group" onClick={copyId}>
               <span className="text-xs uppercase tracking-widest opacity-70 font-semibold">ID SESI</span>
               <span className="text-2xl font-mono font-bold tracking-widest">{sessionId}</span>
               <Copy className="h-4 w-4 opacity-50 group-hover:opacity-100 transition-opacity" />
             </div>
           </div>
        </div>

        {/* CONTENT */}
        <div className="p-8 bg-white">
          <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4 border-b pb-6">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2 text-slate-800">
                <Users className="h-6 w-6 text-primary" />
                Daftar Siswa
              </h2>
              <p className="text-muted-foreground mt-1">
                Total: {studentParticipants.length} Siswa ({onlineCount} Online)
              </p>
            </div>
            
            {isTeacher && (
              <div className="flex items-center gap-2 px-4 py-2 bg-yellow-50 text-yellow-700 rounded-full text-sm font-medium border border-yellow-200 animate-pulse">
                <Loader2 className="h-4 w-4 animate-spin" />
                Menunggu siswa bergabung...
              </div>
            )}
          </div>

          {/* GRID PESERTA */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-8 min-h-[200px]">
             {studentParticipants.map((p) => (
               <div 
                 key={p.id} 
                 className={`relative flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all duration-300 ${
                   p.is_present 
                     ? 'bg-white border-primary/20 shadow-sm scale-100 opacity-100' 
                     : 'bg-slate-50 border-slate-100 grayscale opacity-60 scale-95'
                 }`}
               >
                 <div className={`h-14 w-14 rounded-full flex items-center justify-center text-white font-bold text-xl mb-3 shadow-md ${
                   p.is_present ? 'bg-gradient-to-br from-primary to-teal-400' : 'bg-slate-300'
                 }`}>
                   {p.user.name.charAt(0).toUpperCase()}
                 </div>
                 <span className="text-sm font-semibold text-center truncate w-full px-2 text-slate-700">
                   {p.user.name}
                 </span>
                 <div className={`mt-2 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                   p.is_present ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-500'
                 }`}>
                   {p.is_present ? 'Online' : 'Offline'}
                 </div>
               </div>
             ))}

             {studentParticipants.length === 0 && (
               <div className="col-span-full flex flex-col items-center justify-center py-12 text-muted-foreground border-2 border-dashed rounded-xl bg-slate-50/50">
                 <Users className="h-10 w-10 mb-2 opacity-20" />
                 <p className="font-medium">Lobby masih kosong.</p>
                 <p className="text-sm">Bagikan ID Sesi ke siswa untuk memulai.</p>
               </div>
             )}
          </div>

          {/* FOOTER ACTIONS */}
          <div className="flex flex-col md:flex-row gap-4 justify-between items-center pt-4">
            <Button 
              variant="outline" 
              className="text-muted-foreground hover:text-destructive hover:border-destructive/50 w-full md:w-auto" 
              onClick={() => navigate(-1)}
            >
              <LogOut className="mr-2 h-4 w-4" /> Keluar Lobby
            </Button>

            {isTeacher ? (
              <Button 
                size="lg" 
                className={`w-full md:w-auto px-10 text-lg font-bold shadow-xl shadow-primary/20 transition-all ${
                  onlineCount > 0 
                    ? 'hover:scale-105 hover:shadow-primary/40' 
                    : 'opacity-50 cursor-not-allowed'
                }`}
                onClick={handleStartGame}
                // FIX 3: Disable jika tidak ada siswa ONLINE (bukan cuma terdaftar)
                disabled={onlineCount === 0}
              >
                <Crown className="mr-2 h-5 w-5" />
                Mulai Permainan
              </Button>
            ) : (
              <div className="flex flex-col items-center bg-slate-100 px-6 py-3 rounded-lg w-full md:w-auto">
                 <div className="flex items-center gap-2 text-primary font-medium">
                   <Loader2 className="h-5 w-5 animate-spin" />
                   <span>Menunggu Host...</span>
                 </div>
                 <p className="text-xs text-muted-foreground mt-1">Game akan otomatis dimulai di layar kamu.</p>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}