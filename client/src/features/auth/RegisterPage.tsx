/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '@/api/axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

export default function RegisterPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { register, handleSubmit, formState: { errors } } = useForm<RegisterPayload>();

  const onSubmit = async (data: RegisterPayload) => {
    setIsLoading(true);
    setError('');
    
    try {
      // Kita tidak perlu membaca return value, cukup pastikan tidak error (200/201 OK)
      await api.post('/auth/signup', data);
      
      // Jika sukses, arahkan ke login dengan pesan sukses
      navigate('/login', { state: { message: 'Registrasi berhasil! Silakan login.' } });
    } catch (err: any) {
      console.error("Register Error:", err);
      // Tangkap pesan error spesifik dari backend jika ada
      const message = err.response?.data?.message || err.message || 'Gagal mendaftar. Coba lagi nanti.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/50 p-4">
      <Card className="w-full max-w-md shadow-lg border-t-4 border-t-secondary">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold text-secondary">Daftar Siswa</CardTitle>
          <CardDescription>
            Buat akun untuk mulai bermain Truth or Dare edukatif.
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
              <Label htmlFor="name">Nama Lengkap</Label>
              <Input 
                id="name" 
                placeholder="Budi Santoso" 
                {...register('name', { required: 'Nama wajib diisi' })}
              />
              {errors.name && <span className="text-xs text-destructive">{errors.name.message}</span>}
            </div>
            
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
                placeholder="Min 6 karakter" 
                {...register('password', { required: 'Password wajib diisi', minLength: { value: 6, message: 'Password minimal 6 karakter' } })}
              />
              {errors.password && <span className="text-xs text-destructive">{errors.password.message}</span>}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button className="w-full bg-secondary hover:bg-secondary/90" type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Daftar Sekarang
            </Button>
            <div className="text-center text-sm text-muted-foreground">
              Sudah punya akun?{' '}
              <Link to="/login" className="text-secondary hover:underline font-medium">
                Masuk disini
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}