/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import SimpleModal from '@/components/ui/simple-modal';
import { api } from '@/api/axios';
import { Plus, Search, Trash2, User, Loader2, Mail, ShieldAlert } from 'lucide-react';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

interface Student {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt?: string;
}

interface CreateStudentForm {
  name: string;
  email: string;
  password: string;
}

export default function AdminStudents() {
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateStudentForm>();

  // 1. Fetch Students
  const fetchStudents = useCallback(async () => {
    try {
      // Ambil semua user dengan role student
      const res = await api.get('/users?role=student'); 
      const data = res.data.items || res.data.data || res.data;
      
      const studentOnly = Array.isArray(data) 
        ? data.filter((u: any) => u.role === 'student') 
        : [];
        
      setStudents(studentOnly);
    } catch (error) {
      console.error("Gagal load siswa", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  // 2. Create Student (Admin mendaftarkan siswa)
  const onSubmit = async (data: CreateStudentForm) => {
    try {
      await api.post('/auth/signup', data);
      setIsModalOpen(false);
      reset();
      alert("Akun siswa berhasil dibuat!");
      
      // Refresh list
      setIsLoading(true);
      fetchStudents();
    } catch (error: any) {
      console.error(error);
      const msg = error.response?.data?.message || "Gagal membuat akun siswa.";
      alert(msg);
      setIsLoading(false);
    }
  };

  // 3. Delete Student
  const handleDelete = async (id: string) => {
    if (!confirm("HAPUS PERMANEN? Data histori game siswa ini juga akan hilang.")) return;
    try {
      await api.delete(`/users/${id}`);
      setIsLoading(true);
      fetchStudents();
    } catch (error) {
      alert("Gagal menghapus akun siswa.");
      setIsLoading(false);
    }
  };

  // Filter Search
  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardLayout role="admin">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-destructive flex items-center gap-2">
            Manajemen Siswa <ShieldAlert className="h-6 w-6" />
          </h1>
          <p className="text-muted-foreground">Kelola seluruh data akun siswa dalam sistem.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="gap-2 bg-destructive hover:bg-destructive/90">
          <Plus className="h-4 w-4" /> Tambah Siswa Manual
        </Button>
      </div>

      <Card className="border-t-4 border-t-destructive">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Database Siswa</CardTitle>
              <CardDescription>Total: {filteredStudents.length} Siswa Terdaftar</CardDescription>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Cari nama atau email..." 
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-destructive" />
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground border-2 border-dashed rounded-lg">
              {searchTerm ? "Tidak ada siswa yang cocok dengan pencarian." : "Database siswa kosong."}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 rounded-tl-lg">Nama Lengkap</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Terdaftar Sejak</th>
                    <th className="px-4 py-3 text-right rounded-tr-lg">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((student, i) => (
                    <tr key={student.id || i} className="border-b hover:bg-muted/5 transition-colors">
                      <td className="px-4 py-3 font-medium flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center text-green-700">
                          <User className="h-4 w-4" />
                        </div>
                        {student.name}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Mail className="h-3 w-3" />
                          {student.email}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {student.createdAt 
                          ? format(new Date(student.createdAt), 'dd MMM yyyy', { locale: idLocale }) 
                          : '-'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-destructive hover:bg-destructive/10"
                          onClick={() => handleDelete(student.id)}
                          title="Hapus Akun"
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

      {/* Modal Tambah Siswa */}
      <SimpleModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Registrasi Siswa Baru (Admin)"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="p-3 bg-yellow-50 text-yellow-800 text-sm rounded-md border border-yellow-200">
            <strong>Catatan Admin:</strong> Akun yang dibuat disini akan langsung aktif. Pastikan email benar.
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Nama Lengkap</Label>
            <Input id="name" placeholder="Nama Siswa" {...register('name', { required: 'Nama wajib diisi' })} />
            {errors.name && <span className="text-xs text-destructive">{errors.name.message}</span>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="siswa@sekolah.sch.id" {...register('email', { required: 'Email wajib diisi' })} />
            {errors.email && <span className="text-xs text-destructive">{errors.email.message}</span>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" placeholder="Min 6 karakter" {...register('password', { required: 'Password wajib diisi', minLength: 6 })} />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Batal</Button>
            <Button type="submit" variant="destructive">Buat Akun</Button>
          </div>
        </form>
      </SimpleModal>
    </DashboardLayout>
  );
}