/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import SimpleModal from '@/components/ui/simple-modal';
import { api } from '@/api/axios';
import { Plus, Trash2, GraduationCap, Loader2, Mail } from 'lucide-react';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt?: string;
}

interface CreateTeacherForm {
  name: string;
  email: string;
  password: string;
}

export default function AdminTeachers() {
  const [teachers, setTeachers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateTeacherForm>();

  // 1. Fetch Teachers
  const fetchTeachers = async () => {
    try {
      // Panggil endpoint /users dengan filter role teacher
      const res = await api.get('/users?role=teacher'); 
      const data = res.data.items || res.data.data || res.data;
      
      const teacherOnly = Array.isArray(data) 
        ? data.filter((u: any) => u.role === 'teacher') 
        : [];
        
      setTeachers(teacherOnly);
    } catch (error) {
      console.error("Gagal load guru", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, []);

  // 2. Create Teacher (Endpoint Khusus Admin)
  const onSubmit = async (data: CreateTeacherForm) => {
    try {
      await api.post('/auth/create-teacher', data);
      setIsModalOpen(false);
      reset();
      alert("Akun GURU berhasil dibuat!");
      setIsLoading(true);
      fetchTeachers();
    } catch (error: any) {
      console.error(error);
      const msg = error.response?.data?.message || "Gagal membuat akun guru.";
      alert(msg);
    }
  };

  // 3. Delete Teacher
  const handleDelete = async (id: string) => {
    if (!confirm("Hapus akun guru ini? Semua data sesinya mungkin akan error.")) return;
    try {
      await api.delete(`/users/${id}`);
      setIsLoading(true);
      fetchTeachers();
    } catch (error) {
      alert("Gagal menghapus.");
    }
  };

  return (
    <DashboardLayout role="admin">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Data Guru</h1>
          <p className="text-muted-foreground">Kelola akun pengajar (Fasilitator).</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="gap-2 bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4" /> Tambah Guru Baru
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Guru Terdaftar</CardTitle>
          <CardDescription>Total: {teachers.length} Guru</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : teachers.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground border-2 border-dashed rounded-lg">
              Belum ada data guru.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 rounded-tl-lg">Nama Lengkap</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Tanggal Dibuat</th>
                    <th className="px-4 py-3 text-right rounded-tr-lg">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {teachers.map((teacher, i) => (
                    <tr key={teacher.id || i} className="border-b hover:bg-muted/5 transition-colors">
                      <td className="px-4 py-3 font-medium flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700">
                          <GraduationCap className="h-4 w-4" />
                        </div>
                        {teacher.name}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Mail className="h-3 w-3" />
                          {teacher.email}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {teacher.createdAt 
                          ? format(new Date(teacher.createdAt), 'dd MMM yyyy', { locale: idLocale }) 
                          : '-'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-destructive hover:bg-destructive/10"
                          onClick={() => handleDelete(teacher.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal Tambah Guru */}
      <SimpleModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Buat Akun Guru Baru"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nama Guru</Label>
            <Input id="name" placeholder="Contoh: Bu Pirda" {...register('name', { required: 'Nama wajib diisi' })} />
            {errors.name && <span className="text-xs text-destructive">{errors.name.message}</span>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email Sekolah</Label>
            <Input id="email" type="email" placeholder="guru@sekolah.sch.id" {...register('email', { required: 'Email wajib diisi' })} />
            {errors.email && <span className="text-xs text-destructive">{errors.email.message}</span>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password Default</Label>
            <Input id="password" type="password" placeholder="Minimal 6 karakter" {...register('password', { required: 'Password wajib diisi', minLength: 6 })} />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Batal</Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">Buat Akun Guru</Button>
          </div>
        </form>
      </SimpleModal>
    </DashboardLayout>
  );
}