/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSocket } from '@/hooks/useSocket';
import { useAuthStore } from '@/store/useAuthStore';
import { Button } from '@/components/ui/button';
import { api } from '@/api/axios';
import { cn } from '@/lib/utils';
import { Loader2, Zap, MessageCircleQuestion, Trophy, AlertCircle, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion'; 

type GamePhase = 'IDLE' | 'SPINNING' | 'CARD_REVEAL' | 'ANSWERING' | 'GRADING';

export default function GameArena() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { socket, isConnected } = useSocket();
  const { user } = useAuthStore();
  
  const [phase, setPhase] = useState<GamePhase>('IDLE');
  const [targetUser, setTargetUser] = useState<any>(null); 
  const [activeCard, setActiveCard] = useState<any>(null);
  const [studentAnswer, setStudentAnswer] = useState<string>('');
  
  // State Grading
  const [selectedScore, setSelectedScore] = useState<number | null>(null);
  const [feedbackText, setFeedbackText] = useState<string>('');
  
  // Data
  const [participants, setParticipants] = useState<any[]>([]); 
  const [playedUserIds, setPlayedUserIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 1. LOAD DATA
  useEffect(() => {
    const loadSessionData = async () => {
        try {
            const res = await api.get(`/sessions/${sessionId}`);
            const data = res.data.session || res.data.data || res.data;
            if (data.participants && Array.isArray(data.participants)) {
                setParticipants(data.participants);
            }
        } catch (error) {
            console.error("Gagal load data sesi", error);
        } finally {
            setIsLoading(false);
        }
    };
    loadSessionData();
  }, [sessionId]);

  // Helper: Dapatkan list siswa murni (Tanpa Guru/Admin)
  const getStudentsOnly = () => {
    return participants.filter(p => p.user.role === 'student');
  };

  // 2. SOCKET LISTENERS
  useEffect(() => {
    if (!socket || !sessionId) return;

    socket.emit('join_lobby', { sessionId });

    socket.on('roulette_spinning', () => {
      setPhase('SPINNING');
      setTargetUser(null);
      setActiveCard(null);
      setStudentAnswer('');
      setSelectedScore(null);
      setFeedbackText('');
    });

    socket.on('roulette_result', (data) => {
      const found = participants.find(p => String(p.user.id) === String(data.selectedUserId));
      setTargetUser(found ? found.user : { id: data.selectedUserId, name: 'Siswa Terpilih' });

      if (user?.role === 'teacher') {
        setTimeout(() => {
           const randomType = Math.random() > 0.5 ? 'truth' : 'dare';
           socket.emit('draw_card', { sessionId, categoryId: 1, type: randomType });
        }, 2000);
      }
    });

    socket.on('card_drawn', ({ card }) => {
      setActiveCard(card);
      setPhase('CARD_REVEAL');
      setTimeout(() => setPhase('ANSWERING'), 3000);
    });

    socket.on('answer_submitted', ({ answer }) => {
      setStudentAnswer(answer);
      if (user?.role === 'teacher') {
        setPhase('GRADING');
      }
    });

    socket.on('turn_completed', (data) => {
      alert(`Nilai: ${data.score}/10\nFeedback: "${data.feedback}"`);
      setPhase('IDLE');
      setTargetUser(null);
      setActiveCard(null);
      setStudentAnswer('');
      setPlayedUserIds((prev) => prev); // Trigger re-render if needed
    });

    socket.on('game_ended', () => {
        alert("Sesi Game Telah Berakhir.");
        if (user?.role === 'teacher') navigate('/teacher-dashboard');
        else navigate('/student-dashboard');
    });

    return () => {
      socket.off('roulette_spinning');
      socket.off('roulette_result');
      socket.off('card_drawn');
      socket.off('answer_submitted');
      socket.off('turn_completed');
      socket.off('game_ended');
    };
  }, [socket, sessionId, participants, user, navigate]);


  // --- ACTIONS ---

  const handleSpin = () => {
    if(!socket || !isConnected) {
        alert("Koneksi terputus.");
        return;
    }

    // LOGIC UTAMA: Filter hanya STUDENT
    const studentParticipants = getStudentsOnly();

    if (studentParticipants.length === 0) {
        alert("Tidak ada siswa di room ini.");
        return;
    }

    // Logic End Game / Reset
    if (playedUserIds.length >= studentParticipants.length) {
        if(confirm("Semua siswa sudah mendapat giliran. Akhiri sesi?")) {
            socket.emit('end_game', { sessionId });
        } else {
            if(confirm("Mulai putaran baru? (Reset giliran)")) {
                setPlayedUserIds([]);
                // Putar ulang dengan semua siswa
                socket.emit('spin_roulette', { sessionId, participants: studentParticipants });
            }
        }
        return;
    }

    // Filter: Hanya yang BELUM main
    const pendingStudents = studentParticipants.filter(p => !playedUserIds.includes(String(p.user.id)));
    
    // Fallback (jika terjadi bug count, pake semua student)
    const pool = pendingStudents.length > 0 ? pendingStudents : studentParticipants;

    socket.emit('spin_roulette', { sessionId, participants: pool });
  };

  const handleSubmitAnswer = (e: React.FormEvent) => {
    e.preventDefault();
    if(!socket) return;
    socket.emit('submit_answer', { sessionId, answer: studentAnswer });
  };

  const handleSubmitGrade = () => {
    if(!socket || !targetUser || !activeCard) return;
    if(selectedScore === null) {
        alert("Pilih nilai terlebih dahulu!");
        return;
    }

    const pId = participants.find(p => String(p.user.id) === String(targetUser.id))?.id;
    
    socket.emit('submit_grade', {
        sessionId,
        participantId: pId,
        cardId: activeCard.id,
        type: activeCard.type,
        answer: studentAnswer,
        score: selectedScore,
        feedback: feedbackText || "Kerja bagus!"
    });

    // Update local state: User ini sudah main
    setPlayedUserIds(prev => [...prev, String(targetUser.id)]);

    // Cek Auto End Game
    const totalStudents = getStudentsOnly().length;
    // +1 karena playedUserIds update async
    if (playedUserIds.length + 1 >= totalStudents) {
        setTimeout(() => {
            if(confirm(`Semua ${totalStudents} siswa sudah bermain. Akhiri Sesi?`)) {
                socket.emit('end_game', { sessionId });
            }
        }, 1000);
    }
  };

  const isTeacher = user?.role === 'teacher';
  const isMyTurn = targetUser && user && String(targetUser.id) === String(user.id);

  if (isLoading) return <div className="flex h-screen items-center justify-center bg-slate-900 text-white gap-2"><Loader2 className="animate-spin" /> Memuat Arena...</div>;

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-800 via-slate-900 to-black -z-10" />

      {/* Status Pojok Kiri */}
      <div className="absolute top-4 left-4 text-xs text-slate-500 font-mono">
        <p>Played: {playedUserIds.length} / {getStudentsOnly().length}</p>
      </div>

      {phase === 'IDLE' && (
        <div className="text-center space-y-6 animate-in fade-in zoom-in duration-500">
          <h1 className="text-4xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-blue-500 tracking-tight">
            Game Arena
          </h1>
          <div className="bg-white/5 p-8 rounded-2xl border border-white/10 backdrop-blur-sm max-w-md mx-auto shadow-2xl">
             <p className="text-xl text-slate-300 mb-6 font-light">
                {playedUserIds.length > 0 
                  ? `${playedUserIds.length} siswa telah bermain.` 
                  : "Siap untuk giliran pertama?"}
             </p>
             {isTeacher ? (
               <Button onClick={handleSpin} size="lg" className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-xl font-bold py-8 h-auto shadow-lg hover:scale-105 transition-transform">
                 PUTAR ROLET 🎲
               </Button>
             ) : (
               <div className="flex flex-col items-center gap-4 py-4">
                 <Loader2 className="h-10 w-10 animate-spin text-teal-400" />
                 <p className="text-slate-400 animate-pulse">Menunggu guru...</p>
               </div>
             )}
          </div>
        </div>
      )}

      {phase === 'SPINNING' && (
        <div className="flex flex-col items-center justify-center h-full">
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.5, ease: "linear" }} className="text-9xl mb-8">🎡</motion.div>
            <h2 className="text-3xl font-bold text-teal-400 animate-pulse">Mengacak Siswa...</h2>
        </div>
      )}

      {(phase === 'CARD_REVEAL' || phase === 'ANSWERING' || phase === 'GRADING') && activeCard && targetUser && (
        <div className="w-full max-w-2xl space-y-6">
            <div className="text-center mb-6">
                <div className="inline-block px-8 py-3 rounded-full bg-white/10 border border-white/20 text-xl md:text-2xl font-bold shadow-lg backdrop-blur-md">
                    Giliran: <span className="text-yellow-400 drop-shadow-md">{targetUser.name}</span>
                </div>
            </div>

            <AnimatePresence mode='wait'>
                <motion.div 
                    key={activeCard.id}
                    initial={{ scale: 0.8, opacity: 0, y: 50 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    className={cn(
                        "p-10 rounded-3xl border-4 text-center shadow-2xl relative min-h-[250px] flex flex-col justify-center items-center bg-gradient-to-br",
                        activeCard.type === 'truth' ? "from-blue-600 to-blue-800 border-blue-400" : "from-orange-600 to-red-700 border-orange-400"
                    )}
                >
                    <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-slate-900 border border-white/20 px-6 py-2 rounded-full text-sm font-bold uppercase tracking-widest flex items-center gap-2 shadow-xl">
                        {activeCard.type === 'truth' ? <MessageCircleQuestion className="h-4 w-4 text-blue-400"/> : <Zap className="h-4 w-4 text-orange-400"/>}
                        <span className={activeCard.type === 'truth' ? "text-blue-400" : "text-orange-400"}>{activeCard.type}</span>
                    </div>
                    <h3 className="text-2xl md:text-4xl font-bold leading-tight drop-shadow-lg text-white my-4">"{activeCard.content}"</h3>
                </motion.div>
            </AnimatePresence>

            {isMyTurn && phase === 'ANSWERING' && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-slate-800/80 p-6 rounded-2xl border border-teal-500/30 shadow-xl backdrop-blur-md">
                    <h4 className="text-lg font-medium mb-3 flex items-center gap-2 text-teal-400"><AlertCircle className="h-5 w-5" /> Jawaban Kamu:</h4>
                    <form onSubmit={handleSubmitAnswer} className="space-y-4">
                        <textarea className="w-full bg-slate-900/50 border border-slate-600 rounded-xl p-4 text-white focus:outline-none focus:ring-2 focus:ring-teal-500 text-lg" rows={3} placeholder="Jawab jujur..." value={studentAnswer} onChange={(e) => setStudentAnswer(e.target.value)} autoFocus />
                        <Button type="submit" className="w-full bg-teal-500 hover:bg-teal-600 text-lg font-bold py-6 rounded-xl">Kirim Jawaban</Button>
                    </form>
                </motion.div>
            )}

            {(!isMyTurn || phase === 'GRADING') && (
                <div className="bg-white/5 p-6 rounded-2xl border border-white/10 text-center flex flex-col justify-center">
                    <h4 className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-3">Jawaban {targetUser.name}</h4>
                    {studentAnswer ? <p className="text-xl italic text-teal-300 font-medium">"{studentAnswer}"</p> : <div className="text-slate-500 italic">Menunggu jawaban...</div>}
                </div>
            )}

            {/* AREA PENILAIAN (1-10) */}
            {isTeacher && phase === 'GRADING' && (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-slate-800 p-6 rounded-2xl border border-yellow-500/30 shadow-2xl">
                    <h4 className="text-lg font-bold flex items-center gap-2 mb-4 text-yellow-400"><Trophy className="h-5 w-5" /> Penilaian Guru</h4>
                    
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm text-slate-400">Feedback:</label>
                            <textarea className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-yellow-500 text-sm" rows={2} placeholder="Berikan masukan..." value={feedbackText} onChange={(e) => setFeedbackText(e.target.value)} />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm text-slate-400">Skor (1-10):</label>
                            {/* Grid 5x2 untuk nilai 1-10 */}
                            <div className="grid grid-cols-5 gap-2">
                                {Array.from({length: 10}, (_, i) => i + 1).map((score) => (
                                    <Button 
                                        key={score} 
                                        variant={selectedScore === score ? "default" : "outline"} 
                                        className={cn("h-10 font-bold transition-all border-slate-600", selectedScore === score ? "bg-yellow-500 text-black border-yellow-500" : "bg-slate-700 text-white")}
                                        onClick={() => setSelectedScore(score)}
                                    >
                                        {score}
                                    </Button>
                                ))}
                            </div>
                        </div>

                        <Button className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-6 text-lg mt-2" disabled={selectedScore === null} onClick={handleSubmitGrade}>
                            <Send className="mr-2 h-5 w-5" /> Kirim Penilaian
                        </Button>
                    </div>
                </motion.div>
            )}
        </div>
      )}
    </div>
  );
}
