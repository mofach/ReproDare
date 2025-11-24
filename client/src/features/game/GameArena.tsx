/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSocket } from '@/hooks/useSocket';
import { useAuthStore } from '@/store/useAuthStore';
import { Button } from '@/components/ui/button';
import { api } from '@/api/axios';
import { cn } from '@/lib/utils';
import { Loader2, Zap, MessageCircleQuestion, Trophy, AlertCircle, Send, EyeOff, Home, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion'; 
import { Wheel } from 'react-custom-roulette'; 
import { useAudio } from '@/hooks/useAudio'; // Pastikan hook ini ada sesuai tutorial sebelumnya

type GamePhase = 'IDLE' | 'SPINNING' | 'CARD_REVEAL' | 'ANSWERING' | 'GRADING';

export default function GameArena() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { socket, isConnected } = useSocket();
  const { user } = useAuthStore();
  
  // --- GAME STATE ---
  const [phase, setPhase] = useState<GamePhase>('IDLE');
  const [targetUser, setTargetUser] = useState<any>(null); 
  const [activeCard, setActiveCard] = useState<any>(null);
  const [studentAnswer, setStudentAnswer] = useState<string>('');
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false); 
  
  // --- ROULETTE STATE ---
  const [mustSpin, setMustSpin] = useState(false);
  const [prizeNumber, setPrizeNumber] = useState(0);
  
  // --- GRADING STATE ---
  const [selectedScore, setSelectedScore] = useState<number | null>(null);
  const [feedbackText, setFeedbackText] = useState<string>('');
  const [lastResult, setLastResult] = useState<{score: number, feedback: string} | null>(null);
  
  // --- DATA STATE ---
  const [participants, setParticipants] = useState<any[]>([]); 
  const [playedUserIds, setPlayedUserIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // --- AUDIO ---
  // Musik tegang untuk game (Ganti URL jika perlu)
  const gameMusic = useAudio('https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3'); 

  useEffect(() => {
    gameMusic.play();
    return () => gameMusic.stop();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- REFS (Untuk akses state terbaru di dalam listener socket) ---
  const userRef = useRef(user);
  const participantsRef = useRef(participants);
  const playedUserIdsRef = useRef(playedUserIds);
  const targetUserRef = useRef(targetUser);

  useEffect(() => { userRef.current = user; }, [user]);
  useEffect(() => { participantsRef.current = participants; }, [participants]);
  useEffect(() => { playedUserIdsRef.current = playedUserIds; }, [playedUserIds]);
  useEffect(() => { targetUserRef.current = targetUser; }, [targetUser]);

  // --- HELPERS ---
  const getStudentsOnly = () => participants.filter(p => p.user.role === 'student');
  
  // Filter: Siswa yang BELUM main
  const getPendingStudents = () => {
    const students = getStudentsOnly();
    return students.filter(p => !playedUserIds.includes(String(p.user.id)));
  };

  const pendingStudents = getPendingStudents();

  // Data Wheel Dinamis (Hanya pending students)
  const rouletteData = pendingStudents.length > 0 
    ? pendingStudents.map(p => ({ 
        option: p.user.name.length > 10 ? p.user.name.substring(0,10)+'..' : p.user.name 
      }))
    : [{ option: 'Selesai' }];

  const backgroundColors = ['#ff8f43', '#70bbe0', '#0b3351', '#f9dd50', '#ff5252', '#69f0ae'];
  const textColors = ['#ffffff'];

  // 1. FETCH DATA (Initial Load)
  useEffect(() => {
    const loadSessionData = async () => {
        try {
            const res = await api.get(`/sessions/${sessionId}`);
            const data = res.data.session || res.data.data || res.data;
            
            if (data.participants && Array.isArray(data.participants)) {
                setParticipants(data.participants);
            }

            // Sync played history dari server
            if (data.turns && Array.isArray(data.turns)) {
                const playedIds = data.turns.map((t: any) => String(t.participant.userId));
                setPlayedUserIds(playedIds);
            }
        } catch (error) {
            console.error("Gagal load data sesi", error);
        } finally {
            setIsLoading(false);
        }
    };
    loadSessionData();
  }, [sessionId]);

  // 2. SOCKET LISTENERS
  useEffect(() => {
    if (!socket || !sessionId) return;

    socket.emit('join_lobby', { sessionId });

    // A. SPINNING STARTED
    socket.on('roulette_spinning', () => {
      setPhase('SPINNING');
      setTargetUser(null);
      setActiveCard(null);
      setStudentAnswer('');
      setHasSubmitted(false);
      setLastResult(null);
      setSelectedScore(null);
      setFeedbackText('');
    });

    // B. ROULETTE RESULT
    socket.on('roulette_result', (data) => {
      const currentParticipants = participantsRef.current;
      const currentPlayedIds = playedUserIdsRef.current;

      // Hitung index di array PENDING (karena Wheel merender array pending)
      const students = currentParticipants.filter(p => p.user.role === 'student');
      const pending = students.filter(p => !currentPlayedIds.includes(String(p.user.id)));
      
      const winnerIndex = pending.findIndex(p => String(p.user.id) === String(data.selectedUserId));
      
      if (winnerIndex !== -1) {
        setPrizeNumber(winnerIndex);
        setMustSpin(true); // Trigger animasi Frontend
      }

      // Set Data User
      const found = currentParticipants.find(p => String(p.user.id) === String(data.selectedUserId));
      setTargetUser(found ? found.user : { id: data.selectedUserId, name: 'Siswa' });
    });

    // C. CARD DRAWN
    socket.on('card_drawn', ({ card }) => {
      setActiveCard(card);
      setPhase('CARD_REVEAL');
      setTimeout(() => setPhase('ANSWERING'), 3000);
    });

    // D. ANSWER SUBMITTED
    socket.on('answer_submitted', ({ answer }) => {
      setStudentAnswer(answer);
      if (userRef.current?.role === 'teacher') {
        setPhase('GRADING');
      }
    });

    // E. TURN COMPLETED (AUTO ADVANCE LOGIC)
    socket.on('turn_completed', (data) => {
      setLastResult(data); 
      
      // Update local played history
      const currentTarget = targetUserRef.current;
      setPlayedUserIds(prev => {
          if (currentTarget) return [...prev, String(currentTarget.id)];
          return prev;
      });

      // Cek apakah ini giliran terakhir?
      const allStudents = participantsRef.current.filter(p => p.user.role === 'student');
      const playedCount = playedUserIdsRef.current.length + 1; // +1 yg baru saja selesai
      
      if (playedCount >= allStudents.length) {
          // JIKA SUDAH SEMUA: Trigger End Game (Hanya Guru)
          if (userRef.current?.role === 'teacher') {
              setTimeout(() => {
                  socket.emit('end_game', { sessionId });
              }, 5000); // Delay baca hasil 5 detik, lalu end
          }
      } else {
          // JIKA BELUM: Reset ke IDLE otomatis
          setTimeout(() => {
              setLastResult(null);
              setPhase('IDLE');    
              setTargetUser(null);
              setActiveCard(null);
              setStudentAnswer('');
              setHasSubmitted(false);
          }, 5000); 
      }
    });

    // F. GAME OVER
    socket.on('game_ended', () => {
        setIsGameOver(true);
    });

    return () => {
      socket.off('roulette_spinning');
      socket.off('roulette_result');
      socket.off('card_drawn');
      socket.off('answer_submitted');
      socket.off('turn_completed');
      socket.off('game_ended');
    };
  }, [socket, sessionId, navigate]); 


  // --- ACTIONS ---

  const handleSpin = () => {
    if(!socket || !isConnected) return alert("Koneksi terputus.");
    
    const students = getStudentsOnly();
    // Filter hanya yang belum main
    const pending = students.filter(p => !playedUserIds.includes(String(p.user.id)));
    
    if (pending.length === 0) {
        // Safety check: Jika tombol muncul tapi peserta habis, end game
        if(user?.role === 'teacher') socket.emit('end_game', { sessionId });
        return;
    }

    socket.emit('spin_roulette', { sessionId, participants: pending });
  };

  const handleStopSpinning = () => {
    setMustSpin(false);
    if (user?.role === 'teacher') {
        setTimeout(() => {
            if (!socket) return; // Guard clause
            const randomType = Math.random() > 0.5 ? 'truth' : 'dare';
            socket.emit('draw_card', { sessionId, categoryId: 1, type: randomType });
        }, 500); 
    }
  };

  const handleSubmitAnswer = (e: React.FormEvent) => {
    e.preventDefault();
    if(!socket) return;
    socket.emit('submit_answer', { sessionId, answer: studentAnswer });
    setHasSubmitted(true); // Lock input
  };

  const handleSubmitGrade = () => {
    if(!socket || !targetUser || !activeCard || selectedScore === null) return;

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
    // State update akan terjadi via socket event 'turn_completed'
  };

  const handleExitGame = () => {
    if (user?.role === 'teacher') navigate('/teacher-dashboard');
    else navigate('/student-dashboard');
  };

  // --- RENDER VARIABLES ---
  const isTeacher = user?.role === 'teacher';
  const isMyTurn = targetUser && user && String(targetUser.id) === String(user.id);
  const canSeeAnswer = isTeacher || isMyTurn;

  if (isLoading) return <div className="flex h-screen items-center justify-center bg-slate-900 text-white gap-2"><Loader2 className="animate-spin" /> Memuat Arena...</div>;

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-800 via-slate-900 to-black -z-10" />

      {/* Info Status Kiri Atas */}
      <div className="absolute top-4 left-4 text-xs text-slate-500 font-mono z-20 bg-black/20 px-2 py-1 rounded">
        Played: {playedUserIds.length} / {getStudentsOnly().length}
      </div>

      {/* --- 1. GAME OVER SCREEN --- */}
      {isGameOver && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-md animate-in fade-in duration-700">
              <div className="text-center space-y-8 p-8">
                  <motion.div 
                    initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 260, damping: 20 }}
                    className="bg-green-500 w-24 h-24 rounded-full flex items-center justify-center mx-auto shadow-[0_0_50px_rgba(34,197,94,0.6)]"
                  >
                      <CheckCircle2 className="h-12 w-12 text-white" />
                  </motion.div>
                  <div>
                      <h1 className="text-5xl font-bold text-white mb-2">Sesi Selesai!</h1>
                      <p className="text-slate-400 text-lg">Terima kasih telah berpartisipasi.</p>
                  </div>
                  <Button onClick={handleExitGame} size="lg" className="bg-white text-slate-900 hover:bg-slate-200 px-8 py-6 text-xl rounded-full font-bold shadow-xl transition-transform hover:scale-105">
                      <Home className="mr-2 h-6 w-6" /> Kembali ke Dashboard
                  </Button>
              </div>
          </div>
      )}

      {/* --- 2. MODAL HASIL (POPUP RESULT) --- */}
      {lastResult && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in">
              <div className="bg-white text-slate-900 p-8 rounded-3xl max-w-sm w-full text-center shadow-2xl border-4 border-yellow-400 relative overflow-hidden">
                  {/* Timer Bar */}
                  <motion.div 
                    initial={{ width: "100%" }} animate={{ width: "0%" }} transition={{ duration: 5, ease: "linear" }}
                    className="absolute top-0 left-0 h-2 bg-yellow-500"
                  />

                  {/* Privacy Logic: Detail hanya untuk Guru & Siswa YBS */}
                  {canSeeAnswer ? (
                      <>
                        <Trophy className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold mb-2">Giliran Selesai!</h2>
                        <div className="bg-slate-100 p-4 rounded-xl mb-4">
                            <p className="text-xs text-slate-500 uppercase font-bold">Skor</p>
                            <p className="text-5xl font-extrabold text-primary">{lastResult.score}</p>
                        </div>
                        <div className="mb-2 text-left bg-green-50 p-3 rounded border border-green-200">
                            <p className="text-xs font-bold text-green-700 mb-1">Feedback:</p>
                            <p className="text-sm text-slate-700">"{lastResult.feedback}"</p>
                        </div>
                      </>
                  ) : (
                      <div className="py-10">
                          <CheckCircle2 className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                          <h2 className="text-xl font-bold text-slate-500">Giliran {targetUser?.name} Selesai</h2>
                          <p className="text-sm text-slate-400 mt-2">Bersiap untuk putaran selanjutnya...</p>
                      </div>
                  )}
                  
                  {/* Status Text */}
                  {playedUserIds.length >= getStudentsOnly().length ? (
                      <p className="text-xs text-green-600 mt-4 font-bold animate-pulse">Sesi selesai! Menutup...</p>
                  ) : (
                      <p className="text-xs text-slate-400 mt-4 italic">Lanjut otomatis dalam 5 detik...</p>
                  )}
              </div>
          </div>
      )}

      {/* --- 3. GAME UI (Hide if Game Over) --- */}
      {!isGameOver && (
        <>
            {/* IDLE PHASE */}
            {phase === 'IDLE' && !lastResult && (
                <div className="text-center space-y-6 animate-in fade-in zoom-in">
                <h1 className="text-4xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-blue-500">Game Arena</h1>
                <div className="bg-white/5 p-8 rounded-3xl border border-white/10 backdrop-blur-md max-w-md mx-auto">
                    <p className="text-xl text-slate-300 mb-6 font-light">
                        {pendingStudents.length === 0 
                            ? "Semua siswa sudah bermain." 
                            : "Siap untuk putaran berikutnya?"}
                    </p>
                    {isTeacher ? (
                    <Button onClick={handleSpin} size="lg" className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 text-xl font-bold py-8 shadow-lg hover:scale-105 transition-transform">
                        PUTAR RODA 🎡
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

            {/* SPINNING PHASE */}
            {phase === 'SPINNING' && (
                <div className="flex flex-col items-center justify-center h-full scale-90 md:scale-100">
                    <div className="pointer-events-none relative">
                        <Wheel
                            mustStartSpinning={mustSpin}
                            prizeNumber={prizeNumber}
                            data={rouletteData}
                            backgroundColors={backgroundColors}
                            textColors={textColors}
                            onStopSpinning={handleStopSpinning}
                            outerBorderColor="#1e293b"
                            outerBorderWidth={8}
                            innerRadius={20}
                            radiusLineColor="#1e293b"
                            radiusLineWidth={2}
                            fontSize={14}
                        />
                    </div>
                    <h2 className="text-2xl font-bold text-teal-400 mt-8 animate-pulse">Mengacak Siswa...</h2>
                </div>
            )}

            {/* GAMEPLAY PHASES */}
            {(phase === 'CARD_REVEAL' || phase === 'ANSWERING' || phase === 'GRADING') && activeCard && targetUser && !lastResult && (
                <div className="w-full max-w-2xl space-y-6 animate-in slide-in-from-bottom-10">
                    {/* Header Giliran */}
                    <div className="text-center">
                        <div className="inline-block px-6 py-2 rounded-full bg-white/10 border border-white/20 text-xl font-bold">
                            Giliran: <span className="text-yellow-400">{targetUser.name}</span>
                        </div>
                    </div>

                    {/* Kartu Soal */}
                    <AnimatePresence mode='wait'>
                        <motion.div 
                            key={activeCard.id}
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className={cn("p-10 rounded-3xl border-4 text-center shadow-2xl relative flex flex-col justify-center items-center bg-gradient-to-br min-h-[220px]", activeCard.type === 'truth' ? "from-blue-600 to-blue-800 border-blue-400" : "from-orange-600 to-red-700 border-orange-400")}
                        >
                            <div className="absolute -top-4 bg-slate-900 border border-white/20 px-4 py-1 rounded-full text-sm font-bold uppercase flex items-center gap-2">
                                {activeCard.type === 'truth' ? <MessageCircleQuestion className="h-4 w-4 text-blue-400"/> : <Zap className="h-4 w-4 text-orange-400"/>}
                                <span className={activeCard.type === 'truth' ? "text-blue-400" : "text-orange-400"}>{activeCard.type}</span>
                            </div>
                            <h3 className="text-2xl md:text-3xl font-bold leading-tight drop-shadow-lg text-white mt-2">"{activeCard.content}"</h3>
                        </motion.div>
                    </AnimatePresence>

                    {/* INPUT JAWABAN (PRIVATE & LOCKED) */}
                    {isMyTurn && phase === 'ANSWERING' && (
                        <div className="bg-slate-800/80 p-6 rounded-2xl border border-teal-500/30 shadow-xl">
                            <h4 className="text-lg font-medium mb-3 flex items-center gap-2 text-teal-400"><AlertCircle className="h-5 w-5" /> Jawaban Kamu (Privat):</h4>
                            {hasSubmitted ? (
                                <div className="text-center py-8 text-teal-300 bg-teal-900/20 rounded-xl border border-teal-500/20">
                                    <CheckCircle2 className="h-10 w-10 mx-auto mb-2" />
                                    <p className="font-bold">Jawaban Terkirim!</p>
                                    <p className="text-sm opacity-80">Menunggu feedback guru...</p>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmitAnswer} className="space-y-4">
                                    <textarea className="w-full bg-slate-900/50 border border-slate-600 rounded-xl p-4 text-white focus:ring-2 focus:ring-teal-500" rows={3} placeholder="Jawab jujur..." value={studentAnswer} onChange={(e) => setStudentAnswer(e.target.value)} autoFocus />
                                    <Button type="submit" className="w-full bg-teal-500 hover:bg-teal-600 text-lg font-bold py-4">Kirim Jawaban</Button>
                                </form>
                            )}
                        </div>
                    )}

                    {/* TAMPIL JAWABAN (PRIVACY PROTECTED) */}
                    {(!isMyTurn || phase === 'GRADING') && (
                        <div className="bg-white/5 p-6 rounded-2xl border border-white/10 text-center">
                            <h4 className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-3">Jawaban {targetUser.name}</h4>
                            {studentAnswer ? (
                                canSeeAnswer ? (
                                    <p className="text-xl italic text-teal-300 font-medium">"{studentAnswer}"</p>
                                ) : (
                                    <div className="flex flex-col items-center gap-2 text-slate-500 py-2">
                                        <EyeOff className="h-8 w-8 opacity-50" />
                                        <p className="text-sm">Jawaban disembunyikan (Privasi)</p>
                                    </div>
                                )
                            ) : (
                                <div className="text-slate-500 italic">Menunggu jawaban...</div>
                            )}
                        </div>
                    )}

                    {/* GRADING FORM (GURU ONLY) */}
                    {isTeacher && phase === 'GRADING' && (
                        <div className="bg-slate-800 p-6 rounded-2xl border border-yellow-500/30 shadow-2xl">
                            <h4 className="text-lg font-bold flex items-center gap-2 mb-4 text-yellow-400"><Trophy className="h-5 w-5" /> Penilaian</h4>
                            <textarea className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white mb-4 text-sm" rows={2} placeholder="Berikan feedback..." value={feedbackText} onChange={(e) => setFeedbackText(e.target.value)} />
                            <div className="grid grid-cols-5 gap-2 mb-4">
                                {Array.from({length: 10}, (_, i) => i + 1).map((score) => (
                                    <Button key={score} variant={selectedScore === score ? "default" : "outline"} className={cn("h-10 font-bold border-slate-600", selectedScore === score ? "bg-yellow-500 text-black" : "bg-slate-700 text-white")} onClick={() => setSelectedScore(score)}>{score}</Button>
                                ))}
                            </div>
                            <Button className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4" disabled={selectedScore === null} onClick={handleSubmitGrade}><Send className="mr-2 h-4 w-4" /> Kirim</Button>
                        </div>
                    )}
                </div>
            )}
        </>
      )}
    </div>
  );
}