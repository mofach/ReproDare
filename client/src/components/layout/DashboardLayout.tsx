import { ReactNode } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
import { Button } from '@/components/ui/button';
import { 
  LayoutDashboard, 
  Dices, 
  LibraryBig, 
  LogOut, 
  Users,
  GraduationCap,
  ShieldAlert
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

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // 1. Menu Guru
  const teacherMenu = [
    { label: 'Dashboard', href: '/teacher-dashboard', icon: LayoutDashboard },
    { label: 'Sesi Game', href: '/teacher-dashboard/sessions', icon: Dices },
    { label: 'Bank Soal', href: '/teacher-dashboard/cards', icon: LibraryBig },
    { label: 'Data Siswa', href: '/teacher-dashboard/students', icon: Users },
  ];

  // 2. Menu Siswa
  const studentMenu = [
    { label: 'Lobby Game', href: '/student-dashboard', icon: Dices },
    { label: 'Riwayat', href: '/student-dashboard/history', icon: LibraryBig }, // Pastikan ini ada
  ];

  // 3. Menu Admin
  const adminMenu = [
    { label: 'Dashboard', href: '/admin-dashboard', icon: ShieldAlert },
    { label: 'Data Guru', href: '/admin-dashboard/teachers', icon: GraduationCap },
    { label: 'Data Siswa', href: '/admin-dashboard/students', icon: Users },
  ];

  let menuItems = teacherMenu;
  if (role === 'student') menuItems = studentMenu;
  if (role === 'admin') menuItems = adminMenu;

  return (
    <div className="flex h-screen bg-muted/20">
      {/* Sidebar */}
      <aside className="w-64 bg-card border-r flex flex-col hidden md:flex">
        <div className="p-6 border-b flex items-center gap-2">
          <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-bold">
            R
          </div>
          <span className="font-bold text-xl tracking-tight text-primary">ReproDare</span>
        </div>

        <div className="flex-1 py-6 px-4 space-y-2">
          <p className="px-2 text-xs font-semibold text-muted-foreground mb-4 uppercase tracking-wider">
            Menu {role}
          </p>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;
            
            return (
              <Link key={item.href} to={item.href}>
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

        <div className="p-4 border-t bg-muted/10">
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
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto p-6 md:p-10 max-w-6xl">
          {children}
        </div>
      </main>
    </div>
  );
}