import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/card';
import { api } from '@/api/axios';
import { Loader2, History, Calendar, Trophy } from 'lucide-react';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

interface HistorySession {
  id: number;
  title: string;
  createdAt: string;
  teacher: { name: string };
  category: { name: string };
  turns: { score: number; feedback: string; answer_text: string }[];
}

export default function StudentHistory() {
  const [history, setHistory] = useState<HistorySession[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await api.get('/sessions/history');
        setHistory(res.data.items || []);
      } catch (error) {
        console.error("Gagal load history", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchHistory();
  }, []);

  return (
    <DashboardLayout role="student">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <History className="h-8 w-8 text-primary" /> Riwayat Permainan
        </h1>
        <p className="text-muted-foreground">Lihat nilai dan feedback dari game yang pernah kamu ikuti.</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10"><Loader2 className="animate-spin text-primary" /></div>
      ) : history.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed rounded-lg text-muted-foreground">
            Belum ada riwayat permainan.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
            {history.map((sess) => {
                // Ambil nilai dari turn pertama (asumsi 1 siswa 1 turn per sesi)
                const myTurn = sess.turns && sess.turns.length > 0 ? sess.turns[0] : null;

                return (
                    <Card key={sess.id} className="p-5 hover:shadow-md transition-all border-l-4 border-l-slate-400">
                        <div className="flex justify-between items-start mb-3">
                            <div>
                                <h3 className="font-bold text-lg">{sess.title}</h3>
                                <p className="text-sm text-muted-foreground flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {format(new Date(sess.createdAt), 'dd MMMM yyyy', { locale: idLocale })}
                                </p>
                            </div>
                            {myTurn && (
                                <div className="text-center bg-yellow-50 border border-yellow-200 p-2 rounded-lg min-w-[60px]">
                                    <div className="text-xs text-yellow-700 font-bold uppercase">SKOR</div>
                                    <div className="text-xl font-extrabold text-yellow-600">{myTurn.score}</div>
                                </div>
                            )}
                        </div>
                        
                        <div className="text-sm space-y-2 bg-slate-50 p-3 rounded-md">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Guru:</span>
                                <span className="font-medium">{sess.teacher?.name}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Topik:</span>
                                <span className="font-medium">{sess.category?.name}</span>
                            </div>
                        </div>

                        {myTurn && (
                            <div className="mt-4 pt-4 border-t">
                                <p className="text-xs font-bold text-muted-foreground mb-1">JAWABANMU:</p>
                                <p className="text-sm italic mb-3">"{myTurn.answer_text}"</p>
                                
                                <p className="text-xs font-bold text-green-600 mb-1 flex items-center gap-1">
                                    <Trophy className="h-3 w-3" /> FEEDBACK GURU:
                                </p>
                                <p className="text-sm text-slate-700 bg-green-50 p-2 rounded border border-green-100">
                                    "{myTurn.feedback}"
                                </p>
                            </div>
                        )}
                    </Card>
                );
            })}
        </div>
      )}
    </DashboardLayout>
  );
}