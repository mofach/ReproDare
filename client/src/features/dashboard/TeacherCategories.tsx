/* eslint-disable @typescript-eslint/no-unused-vars */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import SimpleModal from '@/components/ui/simple-modal';
import { api } from '@/api/axios';
import { Plus, Pencil, Trash2, ArrowRight, Loader2, BookOpen } from 'lucide-react';

interface Category {
  id: number;
  name: string;
  description: string;
}

interface CategoryForm {
  name: string;
  description: string;
}

export default function TeacherCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const { register, handleSubmit, reset, setValue } = useForm<CategoryForm>();

  // 1. Fetch Data (GET) - PERBAIKAN DISINI
  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/categories');
      
      // LOGIKA BARU: Cek 'items' dulu sesuai response API Anda
      // Fallback ke 'data' atau array langsung jika format berubah
      const rawData = res.data.items || res.data.data || res.data;
      
      setCategories(Array.isArray(rawData) ? rawData : []);
    } catch (error) {
      console.error("Gagal ambil kategori", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // 2. Handle Submit
  const onSubmit = async (data: CategoryForm) => {
    try {
      if (editingId) {
        await api.put(`/categories/${editingId}`, data);
      } else {
        await api.post('/categories', data);
      }
      closeModal();
      fetchCategories();
    } catch (error) {
      console.error("Gagal simpan", error);
      alert("Gagal menyimpan data");
    }
  };

  // 3. Handle Delete
  const handleDelete = async (id: number) => {
    if (!confirm('Yakin hapus kategori ini?')) return;
    try {
      await api.delete(`/categories/${id}`);
      fetchCategories();
    } catch (error) {
      alert("Gagal menghapus");
    }
  };

  const openAddModal = () => {
    setEditingId(null);
    reset({ name: '', description: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (cat: Category) => {
    setEditingId(cat.id);
    setValue('name', cat.name);
    setValue('description', cat.description);
    setIsModalOpen(true);
  };

  const closeModal = () => setIsModalOpen(false);

  return (
    <DashboardLayout role="teacher">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bank Soal</h1>
          <p className="text-muted-foreground">Kelola topik dan pertanyaan untuk sesi game.</p>
        </div>
        <Button onClick={openAddModal} className="gap-2">
          <Plus className="h-4 w-4" /> Tambah Kategori
        </Button>
      </div>

      {isLoading && (
        <div className="flex justify-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {!isLoading && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {categories.length === 0 ? (
            <div className="col-span-full text-center py-10 border-2 border-dashed rounded-lg bg-muted/20">
              <p className="text-muted-foreground mb-4">Belum ada kategori yang dibuat.</p>
              <Button onClick={openAddModal} variant="outline">Buat Kategori Pertama</Button>
            </div>
          ) : (
            categories.map((cat) => (
              <Card key={cat.id} className="flex flex-col hover:shadow-md transition-all border-l-4 border-l-primary/40">
                <CardHeader>
                  <CardTitle className="flex justify-between items-start text-xl">
                    <span className="truncate pr-2">{cat.name}</span>
                  </CardTitle>
                  <CardDescription className="line-clamp-2 min-h-[40px]">
                    {cat.description || "Tidak ada deskripsi"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                   <div className="flex items-center gap-2 text-xs font-medium px-3 py-1 bg-secondary/10 text-secondary w-fit rounded-full">
                     <BookOpen className="h-3 w-3" />
                     Topik Game
                   </div>
                </CardContent>
                <CardFooter className="flex justify-between border-t pt-4 bg-muted/5 mt-auto">
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => openEditModal(cat)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(cat.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <Link to={`/teacher-dashboard/cards/${cat.id}`}>
                    <Button size="sm" className="gap-2 group bg-primary/10 text-primary hover:bg-primary hover:text-white">
                      Lihat Kartu 
                      <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            ))
          )}
        </div>
      )}

      <SimpleModal 
        isOpen={isModalOpen} 
        onClose={closeModal} 
        title={editingId ? "Edit Kategori" : "Buat Kategori Baru"}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nama Kategori</Label>
            <Input id="name" placeholder="Misal: Pubertas" {...register('name', { required: true })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Deskripsi Singkat</Label>
            <Input id="description" placeholder="Apa yang dibahas di topik ini?" {...register('description')} />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="ghost" onClick={closeModal}>Batal</Button>
            <Button type="submit">{editingId ? 'Simpan Perubahan' : 'Buat Kategori'}</Button>
          </div>
        </form>
      </SimpleModal>
    </DashboardLayout>
  );
}