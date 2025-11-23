import { Link } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dices, PlusCircle, Users } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';

export default function TeacherDashboard() {
  const { user } = useAuthStore();

  return (
    <DashboardLayout role="teacher">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Halo, {user?.name} 👋</h1>
          <p className="text-muted-foreground mt-2">
            Selamat datang di Panel Guru. Apa yang ingin Anda lakukan hari ini?
          </p>
        </div>

        {/* Quick Actions Grid */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Dices className="h-5 w-5 text-primary" />
                Mulai Sesi Baru
              </CardTitle>
              <CardDescription>Buat room game untuk kelas Anda</CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/teacher-dashboard/sessions">
                <Button className="w-full">Buat Game</Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <PlusCircle className="h-5 w-5 text-secondary" />
                Tambah Kartu
              </CardTitle>
              <CardDescription>Buat pertanyaan Truth/Dare baru</CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/teacher-dashboard/cards">
                <Button variant="outline" className="w-full">Kelola Bank Soal</Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5 text-muted-foreground" />
                Akun Siswa
              </CardTitle>
              <CardDescription>Registrasikan akun untuk siswa</CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/teacher-dashboard/students">
                <Button variant="ghost" className="w-full border">Kelola Siswa</Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Info Area */}
        <div className="rounded-lg bg-slate-50 p-6 border border-dashed text-center py-12">
          <h3 className="text-lg font-medium text-muted-foreground">Belum ada aktivitas terkini</h3>
          <p className="text-sm text-muted-foreground/80">Riwayat sesi game akan muncul di sini.</p>
        </div>
      </div>
    </DashboardLayout>
  );
}