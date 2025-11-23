/* eslint-disable @typescript-eslint/no-unused-vars */
import { useEffect, useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import SimpleModal from '@/components/ui/simple-modal';
import { api } from '@/api/axios';
import { Dices, Plus, PlayCircle, Loader2, Calendar, Trash2, Clock, History, Archive } from 'lucide-react';
import { format, differenceInMinutes } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface Session {
  id: number;
  title: string;
  status: 'waiting' | 'running' | 'finished';
  createdAt: string;
  category?: { name: string };
}

interface CreateSessionForm {
  title: string;
  categoryId: number;
}

export default function TeacherSessions() {
  const [activeSessions, setActiveSessions] = useState<Session[]>([]);
  const [historySessions, setHistorySessions] = useState<Session[]>([]);
  const [categories, setCategories] = useState<{id: number, name: string}[]>([]);
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');
  
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { register, handleSubmit, reset } = useForm<CreateSessionForm>();

  // 1. Fetch Data
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      // A. Load Active List (Raw)
      const sessRes = await api.get('/sessions');
      const rawSessions = sessRes.data.items || sessRes.data.data || sessRes.data || [];
      
      // FILTER OTOMATIS:
      // 1. Status belum finished
      // 2. CreatedAt < 60 menit yang lalu (Kecuali status running, biarkan tetap muncul)
      const now = new Date();
      const active = rawSessions.filter((s: Session) => {
        if (s.status === 'finished') return false;
        if (s.status === 'running') return true; // Game jalan jangan dihide
        
        // Jika waiting, cek umur
        const ageInMinutes = differenceInMinutes(now, new Date(s.createdAt));
        return ageInMinutes < 60; // Hapus tampilan jika > 60 menit
      });
      
      setActiveSessions(active);

      // B. Load History (Dari Endpoint Baru)
      const histRes = await api.get('/sessions/history');
      const historyData = histRes.data.items || [];
      setHistorySessions(historyData);

      // C. Load Categories
      const catRes = await api.get('/categories');
      const catData = catRes.data.items || [];
      setCategories(catData);

    } catch (error) {
      console.error("Gagal load data", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 2. Create Session
  const onSubmit = async (data: CreateSessionForm) => {
    try {
      setIsLoading(true);
      await api.post('/sessions', { ...data, categoryId: Number(data.categoryId) });
      setIsModalOpen(false);
      reset();
      await fetchData();
    } catch (error) {
      alert("Gagal membuat sesi game.");
      setIsLoading(false);
    }
  };

  // 3. Manual Archive (Hapus dari list aktif)
  const handleArchive = async (id: number) => {
    if(!confirm("Akhiri sesi ini? Sesi akan pindah ke Riwayat dan tidak bisa dimainkan lagi.")) return;
    try {
      await api.patch(`/sessions/${id}/archive`);
      fetchData(); // Refresh list
    } catch (error) {
      alert("Gagal mengarsipkan sesi.");
    }
  };

  return (
    <DashboardLayout role="teacher">
      <div className="flex flex-col md:flex-row items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Manajemen Sesi</h1>
          <p className="text-muted-foreground">Kelola permainan yang sedang berlangsung dan lihat riwayat.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="gap-2 shadow-lg shadow-primary/20">
          <Plus className="h-4 w-4" /> Buat Sesi Baru
        </Button>
      </div>

      {/* TABS NAVIGATION */}
      <div className="flex gap-4 border-b mb-6">
        <button 
          onClick={() => setActiveTab('active')}
          className={cn(
            "pb-3 px-4 text-sm font-medium transition-all border-b-2",
            activeTab === 'active' 
              ? "border-primary text-primary" 
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          <div className="flex items-center gap-2">
            <Dices className="h-4 w-4" /> Sesi Aktif ({activeSessions.length})
          </div>
        </button>
        <button 
          onClick={() => setActiveTab('history')}
          className={cn(
            "pb-3 px-4 text-sm font-medium transition-all border-b-2",
            activeTab === 'history' 
              ? "border-primary text-primary" 
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          <div className="flex items-center gap-2">
            <History className="h-4 w-4" /> Riwayat ({historySessions.length})
          </div>
        </button>
      </div>

      {isLoading && (
        <div className="flex justify-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {/* TAB CONTENT: ACTIVE */}
      {!isLoading && activeTab === 'active' && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {activeSessions.length === 0 ? (
            <div className="col-span-full text-center py-12 border-2 border-dashed rounded-lg bg-muted/10">
              <p className="text-muted-foreground mb-4">Tidak ada sesi aktif saat ini.</p>
              <p className="text-xs text-muted-foreground/70 mb-4">Sesi yang sudah lebih dari 1 jam otomatis disembunyikan.</p>
              <Button onClick={() => setIsModalOpen(true)} variant="outline">Buat Room Pertama</Button>
            </div>
          ) : (
            activeSessions.map((session) => (
              <Card key={session.id} className="flex flex-col hover:shadow-md transition-all border-l-4 border-l-green-500">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start mb-2">
                    <span className={cn(
                      "px-2 py-1 text-xs font-bold rounded-full",
                      session.status === 'running' ? "bg-orange-100 text-orange-700 animate-pulse" : "bg-green-100 text-green-700"
                    )}>
                      {session.status === 'running' ? 'SEDANG MAIN' : 'MENUNGGU'}
                    </span>
                    {/* TOMBOL HAPUS MANUAL */}
                    <Button 
                        variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive -mt-1 -mr-2"
                        onClick={() => handleArchive(session.id)}
                        title="Akhiri Sesi (Hapus dari list)"
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <CardTitle className="text-lg leading-tight">{session.title}</CardTitle>
                  <CardDescription className="text-xs mt-1">
                    Topik: {session.category?.name || 'Umum'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 text-xs text-muted-foreground flex items-center gap-2 mt-2">
                  <Clock className="h-3 w-3" />
                  {session.createdAt ? format(new Date(session.createdAt), 'HH:mm, dd MMM', { locale: idLocale }) : '-'}
                </CardContent>
                <CardFooter className="pt-2">
                  <Link to={`/game/lobby/${session.id}`} className="w-full">
                    <Button className="w-full gap-2 bg-secondary hover:bg-secondary/90 text-white h-9 text-sm">
                      <PlayCircle className="h-4 w-4" /> Masuk Lobby
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            ))
          )}
        </div>
      )}

      {/* TAB CONTENT: HISTORY */}
      {!isLoading && activeTab === 'history' && (
        <div className="space-y-4">
            {historySessions.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">Belum ada riwayat permainan.</div>
            ) : (
                historySessions.map((sess) => (
                    <Card key={sess.id} className="flex items-center justify-between p-4 hover:bg-slate-50">
                        <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500">
                                <Archive className="h-5 w-5" />
                            </div>
                            <div>
                                <h4 className="font-bold text-sm">{sess.title}</h4>
                                <p className="text-xs text-muted-foreground">
                                    {sess.createdAt ? format(new Date(sess.createdAt), 'dd MMMM yyyy, HH:mm', { locale: idLocale }) : '-'}
                                    {' • '}
                                    {sess.category?.name}
                                </p>
                            </div>
                        </div>
                        <div className="text-right">
                            <span className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded-md font-medium">Selesai</span>
                        </div>
                    </Card>
                ))
            )}
        </div>
      )}

      <SimpleModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Buat Sesi Game Baru">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Judul Sesi</Label>
            <Input placeholder="Contoh: Kelas X-A (Senin)" {...register('title', { required: true })} />
          </div>
          <div className="space-y-2">
            <Label>Pilih Kategori Topik</Label>
            <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" {...register('categoryId', { required: true })}>
              <option value="">-- Pilih Topik --</option>
              {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Batal</Button>
            <Button type="submit">Buat Room</Button>
          </div>
        </form>
      </SimpleModal>
    </DashboardLayout>
  );
}