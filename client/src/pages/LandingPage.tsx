import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
import { Button } from '@/components/ui/button';
import { ArrowRight, ShieldCheck, HeartPulse, Users, Zap } from 'lucide-react';

export default function LandingPage() {
  const { isAuthenticated, user } = useAuthStore();
  const navigate = useNavigate();

  // 1. Logic Redirect jika sudah login
  useEffect(() => {
    if (isAuthenticated() && user) {
      if (user.role === 'teacher') navigate('/teacher-dashboard');
      else if (user.role === 'admin') navigate('/admin-dashboard');
      else navigate('/student-dashboard');
    }
  }, [isAuthenticated, user, navigate]);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* NAVBAR */}
      <nav className="w-full border-b bg-white/80 backdrop-blur-md fixed top-0 z-50">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* LOGO */}
            <img src="/logo.png" alt="ReproDare Logo" className="h-10 w-auto object-contain" />
            <span className="text-xl font-bold text-primary tracking-tight hidden md:block">ReproDare</span>
          </div>
          <div className="flex gap-3">
            <Link to="/login">
              <Button variant="ghost" className="font-semibold">Masuk</Button>
            </Link>
            <Link to="/register">
              <Button className="bg-secondary hover:bg-secondary/90 font-bold rounded-full px-6">Daftar Sekarang</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="pt-32 pb-20 px-6 bg-gradient-to-b from-teal-50 to-white">
        <div className="container mx-auto text-center max-w-4xl">
          <div className="inline-flex items-center gap-2 bg-white border border-primary/20 px-4 py-1.5 rounded-full text-primary text-sm font-semibold mb-6 shadow-sm">
            <Zap className="h-4 w-4 fill-current" />
            Revolusi Bimbingan Konseling Digital
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 mb-6 leading-tight">
            Belajar Kesehatan Reproduksi <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-teal-400">
              Tanpa Rasa Canggung
            </span>
          </h1>
          <p className="text-lg md:text-xl text-slate-600 mb-10 leading-relaxed max-w-2xl mx-auto">
            Aplikasi edukatif berbasis gamifikasi <strong>"Truth or Dare"</strong> yang dirancang khusus untuk remaja. 
            Diskusikan isu sensitif di ruang aman bersama Guru BK.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register">
              <Button size="lg" className="h-14 px-8 text-lg rounded-full shadow-xl shadow-primary/20">
                Mulai Bermain
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/login">
                <Button variant="outline" size="lg" className="h-14 px-8 text-lg rounded-full border-2">
                    Sudah Punya Akun?
                </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* FEATURES / VALUE PROP */}
      <section className="py-20 px-6">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 hover:shadow-lg transition-all hover:-translate-y-1">
              <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mb-6 text-blue-600">
                <ShieldCheck className="h-7 w-7" />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-slate-800">Ruang Aman (Safe Space)</h3>
              <p className="text-slate-600 leading-relaxed">
                Wadah diskusi privat antara siswa dan guru BK tanpa takut dihakimi. Privasi terjaga untuk membahas hal sensitif.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 hover:shadow-lg transition-all hover:-translate-y-1">
              <div className="w-14 h-14 bg-orange-100 rounded-2xl flex items-center justify-center mb-6 text-orange-600">
                <HeartPulse className="h-7 w-7" />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-slate-800">Edukasi Interaktif</h3>
              <p className="text-slate-600 leading-relaxed">
                Materi kesehatan reproduksi dikemas dalam permainan kartu Truth or Dare yang seru, tidak membosankan seperti ceramah biasa.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 hover:shadow-lg transition-all hover:-translate-y-1">
              <div className="w-14 h-14 bg-teal-100 rounded-2xl flex items-center justify-center mb-6 text-teal-600">
                <Users className="h-7 w-7" />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-slate-800">Refleksi & Feedback</h3>
              <p className="text-slate-600 leading-relaxed">
                Guru memberikan umpan balik langsung (feedback) dan penilaian terhadap pemahaman siswa secara realtime.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-slate-900 text-slate-400 py-12 px-6 mt-auto">
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
             <img src="/logo.png" alt="Logo" className="h-8 w-auto opacity-80 grayscale" />
             <span className="font-bold text-white text-lg">ReproDare</span>
          </div>
          <p className="text-sm">
            © 2025 Tim PKM-K ReproDare. Inovasi untuk Kesehatan Remaja Indonesia.
          </p>
        </div>
      </footer>
    </div>
  );
}