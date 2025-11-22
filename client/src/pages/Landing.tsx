// client/src/pages/Landing.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import logo from '../assets/logo.png';
import hero from '../assets/hero.png';

export default function Landing(): React.ReactElement {
  return (
    <div className="min-h-screen flex flex-col">
      {/* nav */}
      <nav className="max-w-6xl mx-auto w-full flex items-center justify-between p-6">
        <div className="flex items-center gap-3">
          <img src={logo} alt="ReproDare logo" className="w-28 h-auto" />
          <span className="text-sm text-slate-700 hidden md:inline">Edukasi reproduksi & konseling — gamified</span>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login" className="btn-primary">Masuk</Link>
        </div>
      </nav>

      {/* hero */}
      <header className="max-w-6xl mx-auto w-full flex flex-col md:flex-row items-center gap-8 px-6 py-6">
        <div className="flex-1">
          <div className="hero-card p-6 rounded-2xl">
            <h1 className="text-4xl md:text-5xl font-extrabold leading-tight" style={{ color: 'var(--color-text)' }}>
              Selamat datang di <span style={{ color: 'var(--color-primary)' }}>ReproDare</span>
            </h1>
            <p className="mt-4 text-lg text-slate-700">
              Aplikasi edukatif berbasis gamifikasi "Truth or Dare" untuk remaja — dirancang untuk
              memudahkan guru BK memfasilitasi sesi yang aman, reflektif, dan partisipatif tentang
              kesehatan reproduksi, relasi sehat, batas pribadi, dan topik penting lain.
            </p>

            <div className="mt-6 flex gap-3">
              <Link to="/login" className="btn-primary inline-flex items-center gap-2">
                Mulai Sekarang
              </Link>
              <a
                href="#features"
                className="px-4 py-2 rounded-md bg-white/60 border border-white"
                aria-hidden
              >
                Pelajari lebih lanjut
              </a>
            </div>
          </div>

          {/* quick cards */}
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <QuickCard title="Mode Fasilitator" text="Guru BK memfasilitasi sesi kelas, memilih kategori & memantau refleksi siswa." />
            <QuickCard title="Mode Siswa" text="Akun pribadi untuk setiap siswa; privasi jawaban terjamin." />
            <QuickCard title="Laporan & History" text="Rekap nilai & feedback untuk evaluasi guru." />
          </div>
        </div>

        <div className="flex-1 flex justify-center">
          <div className="w-full max-w-md">
            <img src={hero} alt="illustration" className="w-full rounded-2xl shadow-lg" />
          </div>
        </div>
      </header>

      {/* features */}
      <main id="features" className="max-w-6xl mx-auto px-6 pb-12">
        <section className="mt-6 grid md:grid-cols-2 gap-6">
          <div className="p-6 hero-card">
            <h3 className="text-2xl font-semibold">Apa itu ReproDare?</h3>
            <p className="mt-3 text-slate-700">
              ReproDare adalah media bantu konseling yang memadukan edukasi reproduksi dengan
              mekanik permainan "Truth or Dare". Tujuannya: membuka ruang aman bagi remaja untuk
              berefleksi dan berbagi tanpa takut dihakimi — sementara guru mendapatkan alat
              monitoring dan feedback terstruktur. (Sumber: PKM ReproDare — ringkasan produk).
            </p>
          </div>

          <div className="p-6 hero-card">
            <h3 className="text-2xl font-semibold">Fitur Utama</h3>
            <ul className="mt-3 space-y-2 text-slate-700">
              <li>• Pemilihan kategori topik (Pubertas, Relasi, Kesehatan Mental, dll).</li>
              <li>• Roulette nama peserta & giliran jawaban privat.</li>
              <li>• Sistem penilaian & feedback guru (1–10) dan rekap sesi.</li>
              <li>• History pribadi siswa (pertanyaan, jawaban, feedback).</li>
            </ul>
          </div>
        </section>

        <section className="mt-8">
          <div className="p-6 hero-card">
            <h3 className="text-xl font-semibold">Siapa targetnya?</h3>
            <p className="mt-2 text-slate-700">
              Siswa SMP/SMA (13–18 th), Guru BK, fasilitator PIK-R, dan sekolah yang ingin metode
              konseling lebih interaktif. Fokus pilot awal: sekolah di Bandung & sekitarnya.
            </p>
            <div className="mt-4 flex gap-3">
              <Link to="/teacher" className="px-4 py-2 bg-indigo-600 text-white rounded">Mode Fasilitator</Link>
              <Link to="/student" className="px-4 py-2 bg-amber-400 text-slate-800 rounded">Mode Siswa</Link>
            </div>
          </div>
        </section>

        <footer className="mt-8 text-sm text-slate-600">
          <p>ReproDare — edukasi reproduksi yang aman, menyenangkan, dan reflektif. © {new Date().getFullYear()}</p>
        </footer>
      </main>
    </div>
  );
}

/* small QuickCard component below */
function QuickCard({ title, text }: { title: string; text: string }) {
  return (
    <div className="p-4 rounded-xl bg-white/60 border hero-card">
      <h4 className="font-semibold">{title}</h4>
      <p className="text-sm mt-2 text-slate-700">{text}</p>
    </div>
  );
}
