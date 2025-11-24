import { ReactNode, useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
import { Button } from '@/components/ui/button';
import { 
  LayoutDashboard, Dices, LibraryBig, LogOut, Users, 
  GraduationCap, ShieldAlert, Menu, X 
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface DashboardLayoutProps {
  children: ReactNode;
  role: 'teacher' | 'student' | 'admin';
}

export default function DashboardLayout({ children, role }: DashboardLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Definisi Menu
  const teacherMenu = [
    { label: 'Dashboard', href: '/teacher-dashboard', icon: LayoutDashboard },
    { label: 'Sesi Game', href: '/teacher-dashboard/sessions', icon: Dices },
    { label: 'Bank Soal', href: '/teacher-dashboard/cards', icon: LibraryBig },
    { label: 'Data Siswa', href: '/teacher-dashboard/students', icon: Users },
  ];

  const studentMenu = [
    { label: 'Lobby Game', href: '/student-dashboard', icon: Dices },
    { label: 'Riwayat', href: '/student-dashboard/history', icon: LibraryBig },
  ];

  const adminMenu = [
    { label: 'Dashboard', href: '/admin-dashboard', icon: ShieldAlert },
    { label: 'Data Guru', href: '/admin-dashboard/teachers', icon: GraduationCap },
    { label: 'Data Siswa', href: '/admin-dashboard/students', icon: Users },
  ];

  let menuItems = teacherMenu;
  if (role === 'student') menuItems = studentMenu;
  if (role === 'admin') menuItems = adminMenu;

  // Komponen Navigasi (Dipakai di Desktop Sidebar & Mobile Overlay)
  const NavContent = () => (
    <div className="flex flex-col h-full bg-white text-slate-900">
      <div className="p-6 border-b flex items-center gap-3">
        <img src="/logo.png" alt="Logo" className="h-8 w-auto object-contain" />
        <span className="font-bold text-xl tracking-tight text-primary">ReproDare</span>
      </div>

      <div className="flex-1 py-6 px-4 space-y-2 overflow-y-auto">
        <p className="px-2 text-xs font-semibold text-muted-foreground mb-4 uppercase tracking-wider">
          Menu {role}
        </p>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.href;
          return (
            <Link key={item.href} to={item.href} onClick={() => setIsMobileMenuOpen(false)}>
              <Button 
                variant={isActive ? "secondary" : "ghost"} 
                className={cn("w-full justify-start", isActive && "bg-secondary/10 text-secondary hover:bg-secondary/20")}
              >
                <Icon className="mr-2 h-4 w-4" />
                {item.label}
              </Button>
            </Link>
          );
        })}
      </div>

      <div className="p-4 border-t bg-muted/10 mt-auto">
        <div className="flex items-center gap-3 mb-4 px-2">
          <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold">
            {user?.name?.charAt(0) || 'U'}
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-medium truncate">{user?.name}</p>
            <p className="text-xs text-muted-foreground truncate capitalize">{user?.role}</p>
          </div>
        </div>
        <Button variant="outline" className="w-full text-destructive hover:text-destructive" onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          Keluar
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-muted/20 overflow-hidden">
      {/* 1. DESKTOP SIDEBAR (Hidden on Mobile) */}
      <aside className="w-64 border-r hidden md:flex flex-col h-full bg-white">
        <NavContent />
      </aside>

      {/* 2. MOBILE LAYOUT & CONTENT */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        
        {/* Mobile Header (FIX: bg-white solid & shadow) */}
        <header className="md:hidden h-16 border-b bg-white flex items-center justify-between px-4 flex-shrink-0 z-50 shadow-sm relative">
           <div className="flex items-center gap-2">
              <img src="/logo.png" alt="Logo" className="h-8 w-auto" />
              <span className="font-bold text-lg text-primary">ReproDare</span>
           </div>
           <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(true)}>
             <Menu className="h-6 w-6" />
           </Button>
        </header>

        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-[60] bg-black/50 md:hidden">
            <div className="absolute right-0 top-0 h-full w-72 shadow-2xl animate-in slide-in-from-right duration-200 bg-white">
               <div className="absolute top-4 right-4 z-10">
                 <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(false)}>
                   <X className="h-6 w-6" />
                 </Button>
               </div>
               <NavContent />
            </div>
          </div>
        )}

        {/* Main Content Scrollable Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-10">
          <div className="container mx-auto max-w-6xl pb-20">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
