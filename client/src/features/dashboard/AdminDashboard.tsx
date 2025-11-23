import { Link } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GraduationCap, Users } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';

export default function AdminDashboard() {
  const { user } = useAuthStore();

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-destructive">Admin Panel 🛡️</h1>
          <p className="text-muted-foreground mt-2">
            Selamat datang, {user?.name}. Anda memiliki akses penuh sistem.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
          {/* Card Manage Guru */}
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-blue-500" />
                Manajemen Guru
              </CardTitle>
              <CardDescription>
                Daftarkan akun guru baru atau hapus akun lama.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/admin-dashboard/teachers">
                <Button className="w-full">Kelola Guru</Button>
              </Link>
            </CardContent>
          </Card>

          {/* Card Manage Siswa */}
          <Card className="border-l-4 border-l-green-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-green-500" />
                Manajemen Siswa
              </CardTitle>
              <CardDescription>
                Pantau seluruh akun siswa yang terdaftar.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/admin-dashboard/students">
                <Button variant="outline" className="w-full">Kelola Siswa</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}