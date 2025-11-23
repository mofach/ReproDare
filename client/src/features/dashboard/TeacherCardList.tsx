/* eslint-disable @typescript-eslint/no-unused-vars */
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import SimpleModal from '@/components/ui/simple-modal';
import { api } from '@/api/axios';
import { ArrowLeft, Plus, Trash2, Pencil, Loader2, MessageCircleQuestion, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

// Tipe Data
interface GameCard {
  id: number;
  type: 'truth' | 'dare';
  content: string;
}

interface CardForm {
  type: 'truth' | 'dare';
  content: string;
}

export default function TeacherCardList() {
  const { categoryId } = useParams();
  const [cards, setCards] = useState<GameCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [categoryName, setCategoryName] = useState('Loading...');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<GameCard | null>(null);

  const { register, handleSubmit, reset, setValue, watch } = useForm<CardForm>({
    defaultValues: { type: 'truth' }
  });

  const selectedType = watch('type');

  // 1. Fetch Info Kategori & Kartu
  const fetchData = async () => {
    if (!categoryId) return;
    setIsLoading(true);
    try {
      // Ambil detail kategori (untuk judul)
      const catRes = await api.get(`/categories/${categoryId}`);
      // Handle response detail kategori (bisa items[0] atau object langsung)
      const catData = catRes.data.items ? catRes.data.items[0] : (catRes.data.data || catRes.data);
      setCategoryName(catData?.name || 'Kategori');

      // Ambil list kartu (filter by categoryId)
      const cardRes = await api.get(`/cards?categoryId=${categoryId}`);
      
      // PERBAIKAN DISINI: Cek 'items' dulu
      const cardData = cardRes.data.items || cardRes.data.data || cardRes.data;
      setCards(Array.isArray(cardData) ? cardData : []);
      
    } catch (error) {
      console.error("Gagal load data", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [categoryId]);

  // 2. Submit Form
  const onSubmit = async (data: CardForm) => {
    if (!categoryId) return;
    try {
      if (editingCard) {
        await api.put(`/cards/${editingCard.id}`, data);
      } else {
        await api.post('/cards', { ...data, categoryId });
      }
      closeModal();
      fetchData();
    } catch (error) {
      console.error("Error saving card", error);
      alert("Gagal menyimpan kartu");
    }
  };

  // 3. Delete
  const handleDelete = async (id: number) => {
    if (!confirm("Hapus kartu ini?")) return;
    try {
      await api.delete(`/cards/${id}`);
      fetchData();
    } catch (error) {
      alert("Gagal menghapus");
    }
  };

  // Helpers
  const openAddModal = () => {
    setEditingCard(null);
    reset({ type: 'truth', content: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (card: GameCard) => {
    setEditingCard(card);
    setValue('type', card.type);
    setValue('content', card.content);
    setIsModalOpen(true);
  };

  const closeModal = () => setIsModalOpen(false);

  return (
    <DashboardLayout role="teacher">
      {/* Header */}
      <div className="mb-6">
        <Link to="/teacher-dashboard/cards" className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1 mb-2">
          <ArrowLeft className="h-4 w-4" /> Kembali ke Kategori
        </Link>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Topik: {categoryName}</h1>
          <Button onClick={openAddModal} className="gap-2">
            <Plus className="h-4 w-4" /> Tambah Kartu
          </Button>
        </div>
      </div>

      {isLoading && (
        <div className="flex justify-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {/* Grid Kartu */}
      {!isLoading && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {cards.length === 0 ? (
            <div className="col-span-full text-center py-12 bg-muted/20 rounded-lg border-dashed border-2">
              <p className="text-muted-foreground">Belum ada kartu Truth atau Dare di topik ini.</p>
              <Button variant="link" onClick={openAddModal}>Buat yang pertama</Button>
            </div>
          ) : (
            cards.map((card) => (
              <Card key={card.id} className="relative overflow-hidden group hover:shadow-md transition-all">
                {/* Visual Indicator: Biru (Truth) / Orange (Dare) */}
                <div className={cn(
                  "absolute top-0 left-0 w-1 h-full",
                  card.type === 'truth' ? "bg-blue-500" : "bg-orange-500"
                )} />
                
                <CardContent className="p-5 pl-7">
                  <div className="flex items-center justify-between mb-3">
                    <span className={cn(
                      "text-xs font-bold px-2 py-1 rounded uppercase tracking-wider flex items-center gap-1",
                      card.type === 'truth' 
                        ? "bg-blue-100 text-blue-700" 
                        : "bg-orange-100 text-orange-700"
                    )}>
                      {card.type === 'truth' ? <MessageCircleQuestion className="h-3 w-3"/> : <Zap className="h-3 w-3"/>}
                      {card.type.toUpperCase()}
                    </span>
                    
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditModal(card)}>
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(card.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <p className="font-medium text-lg leading-snug text-foreground/90">
                    "{card.content}"
                  </p>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Modal Form */}
      <SimpleModal 
        isOpen={isModalOpen} 
        onClose={closeModal} 
        title={editingCard ? "Edit Kartu" : "Tambah Kartu Baru"}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Tipe Kartu</Label>
            <div className="grid grid-cols-2 gap-4">
              <label className={cn(
                "cursor-pointer border rounded-md p-4 flex flex-col items-center gap-2 transition-all hover:bg-muted",
                selectedType === 'truth' ? "border-blue-500 bg-blue-50 ring-1 ring-blue-500" : "opacity-70"
              )}>
                <input type="radio" value="truth" className="sr-only" {...register('type')} />
                <MessageCircleQuestion className="h-6 w-6 text-blue-600" />
                <span className="font-bold text-blue-700">TRUTH</span>
              </label>

              <label className={cn(
                "cursor-pointer border rounded-md p-4 flex flex-col items-center gap-2 transition-all hover:bg-muted",
                selectedType === 'dare' ? "border-orange-500 bg-orange-50 ring-1 ring-orange-500" : "opacity-70"
              )}>
                <input type="radio" value="dare" className="sr-only" {...register('type')} />
                <Zap className="h-6 w-6 text-orange-600" />
                <span className="font-bold text-orange-700">DARE</span>
              </label>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Pertanyaan / Tantangan</Label>
            <textarea 
              id="content"
              className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder={selectedType === 'truth' ? "Contoh: Apa ketakutan terbesarmu?" : "Contoh: Joget selama 30 detik!"}
              {...register('content', { required: true })}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={closeModal}>Batal</Button>
            <Button type="submit">{editingCard ? 'Simpan' : 'Tambah'}</Button>
          </div>
        </form>
      </SimpleModal>
    </DashboardLayout>
  );
}