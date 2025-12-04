
import React, { useState } from 'react';
import { User, LogOut, Menu, X, Calendar, LayoutDashboard, Settings, User as UserIcon, BookOpen } from 'lucide-react';
import { useAuth } from '../App';
import { APP_NAME } from '../constants';
import { Link, useLocation } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
  title: string;
}

export const Layout: React.FC<LayoutProps> = ({ children, title }) => {
  const { user, logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();

  const navItems = [
    { label: 'Mi Horario', icon: Calendar, path: '/' },
    ...(user?.role === 'admin' ? [
      { label: 'Dashboard', icon: LayoutDashboard, path: '/admin' },
      { label: 'Gestión de Cursos', icon: BookOpen, path: '/careers' },
      { label: 'Generar Horarios', icon: Settings, path: '/generate' },
    ] : []),
  ];

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-30 w-64 bg-slate-900 text-white transform transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:inset-0
      `}>
        <div className="flex items-center justify-between h-16 px-6 bg-slate-800">
          <span className="text-xl font-bold tracking-wider">SIGHA</span>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <div className="p-4">
          <div className="flex items-center gap-3 px-4 py-3 mb-6 bg-slate-800 rounded-lg">
            <div className="p-2 bg-brand-600 rounded-full">
              <UserIcon size={20} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">{user?.displayName}</p>
              <p className="text-xs text-slate-400 capitalize">
                {user?.role === 'admin' ? 'Administrador' : 'Estudiante/Docente'}
              </p>
            </div>
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                    isActive 
                      ? 'bg-brand-600 text-white shadow-md' 
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <item.icon size={20} className={isActive ? 'text-white' : 'text-slate-400'} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="absolute bottom-0 w-full p-4 border-t border-slate-800">
          <button
            onClick={logout}
            className="flex items-center w-full gap-3 px-4 py-3 text-sm font-medium text-red-400 rounded-lg hover:bg-slate-800 hover:text-red-300 transition-colors"
          >
            <LogOut size={20} />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="flex items-center justify-between h-16 px-6 bg-white border-b border-slate-200 lg:px-8">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden text-slate-500 hover:text-slate-700">
              <Menu size={24} />
            </button>
            <h1 className="text-xl font-semibold text-slate-800">{title}</h1>
          </div>
          <div className="hidden sm:block text-sm text-slate-500">
            {APP_NAME}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
