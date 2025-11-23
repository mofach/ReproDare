/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '@/api/axios';
import { useAuthStore } from '@/store/useAuthStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

interface LoginPayload {
  email: string;
  password: string;
}

export default function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { register, handleSubmit, formState: { errors } } = useForm<LoginPayload>();

  const onSubmit = async (data: LoginPayload) => {
    setIsLoading(true);
    setError('');
    
    try {
      const response = await api.post('/auth/login', data);
      
      // PERBAIKAN: Mengambil 'accessToken' (sesuai backend) dan object 'user' langsung
      const { accessToken, user } = response.data;
      
      if (!accessToken || !user) {
        throw new Error("Format respons server tidak sesuai.");
      }

      // Simpan ke Store
      login({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }, accessToken);

      // Redirect sesuai role
      if (user.role === 'student') navigate('/student-dashboard');
      else if (user.role === 'teacher') navigate('/teacher-dashboard');
      else navigate('/admin-dashboard');

    } catch (err: any) {
      console.error("Login Error:", err);
      // Menampilkan pesan error yang lebih spesifik jika ada
      const message = err.response?.data?.message || err.message || 'Gagal login. Periksa email dan password.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/50 p-4">
      <Card className="w-full max-w-md shadow-lg border-t-4 border-t-primary">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold text-primary">Masuk ReproDare</CardTitle>
          <CardDescription>
            Lanjutkan perjalanan edukasi seru kamu.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            {error && (
              <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md">
                {error}
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="nama@sekolah.sch.id" 
                {...register('email', { required: 'Email wajib diisi' })}
              />
              {errors.email && <span className="text-xs text-destructive">{errors.email.message}</span>}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input 
                id="password" 
                type="password" 
                placeholder="••••••••" 
                {...register('password', { required: 'Password wajib diisi' })}
              />
              {errors.password && <span className="text-xs text-destructive">{errors.password.message}</span>}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button className="w-full" type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Masuk
            </Button>
            <div className="text-center text-sm text-muted-foreground">
              Siswa baru?{' '}
              <Link to="/register" className="text-primary hover:underline font-medium">
                Daftar Akun
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}