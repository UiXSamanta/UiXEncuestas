import { useNavigate, useLocation } from 'react-router';
import Logo from '../../imports/Logo';
import svgPaths from '../../imports/svg-w42kgq06su';
import { Bell, GitCompare } from 'lucide-react';
import * as api from '../lib/api';
import { ThemeToggle } from './ThemeToggle';

interface AdminSidebarProps {
  unreadCount?: number;
}

export function AdminSidebar({ unreadCount = 0 }: AdminSidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();

  // Read inside component so it's always fresh after login
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  const isActive = (path: string) => location.pathname === path;

  // Check permissions
  const isAdminPrincipal = currentUser.email === 'samanta.camacho@upax.com.mx';
  const canAccessNotifications = isAdminPrincipal || currentUser.can_access_notifications === true;
  const canAccessSettings = isAdminPrincipal || currentUser.can_access_settings === true;

  const navItem = (active: boolean) =>
    active
      ? 'bg-gradient-to-r from-[#597AFF] to-[#8C59FE] h-[36px] rounded-[10px] w-full flex items-center px-[12px] gap-[8px] cursor-pointer shadow-md'
      : 'h-[36px] rounded-[10px] w-full flex items-center px-[12px] gap-[8px] hover:bg-[#EBEEF4] dark:hover:bg-accent transition-colors cursor-pointer';

  const textClass = (active: boolean) =>
    active
      ? 'font-medium leading-[20px] text-[14px] text-white tracking-[-0.1504px]'
      : 'font-medium leading-[20px] text-[#303C48] dark:text-foreground text-[14px] tracking-[-0.1504px]';

  return (
    <aside className="w-64 bg-white dark:bg-card border-r border-[#EBEEF4] dark:border-border flex flex-col shrink-0">
      {/* Header with Logo */}
      <div className="flex flex-col gap-[12px] pt-[24px] px-[24px] pb-[24px] shrink-0">
        <div className="w-16 h-7">
          <Logo />
        </div>
        <h1 className="font-semibold leading-[28px] text-[#303C48] dark:text-foreground text-[20px] tracking-[-0.4492px]">Encuestas</h1>
        <div className="flex items-center gap-[8px]">
          <div className="size-[12px] shrink-0">
            <svg className="block size-full" fill="none" viewBox="0 0 12 12">
              <path d={svgPaths.pb47e900} stroke="#8C59FE" strokeLinecap="round" strokeLinejoin="round" />
              <path d={svgPaths.p289e9716} stroke="#8C59FE" strokeLinecap="round" strokeLinejoin="round" />
              <path d={svgPaths.p39602200} stroke="#8C59FE" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <p className="font-normal leading-[16px] text-[#81878E] dark:text-muted-foreground text-[12px]">Supabase + LocalStorage</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-[4px] px-[12px] shrink-0">
        {/* Dashboard */}
        <div
          className={navItem(isActive('/admin'))}
          onClick={() => navigate('/admin')}
        >
          <div className="size-[20px] shrink-0">
            <svg className="block size-full" fill="none" viewBox="0 0 20 20">
              <path d={svgPaths.p1fc96a00} stroke={isActive('/admin') ? 'white' : '#303C48'} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
              <path d={svgPaths.p33089d00} stroke={isActive('/admin') ? 'white' : '#303C48'} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
              <path d={svgPaths.p49cfa80}  stroke={isActive('/admin') ? 'white' : '#303C48'} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
              <path d={svgPaths.p1cfbf300} stroke={isActive('/admin') ? 'white' : '#303C48'} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
            </svg>
          </div>
          <span className={textClass(isActive('/admin'))}>Dashboard</span>
        </div>

        {/* Notificaciones - Solo visible con permisos */}
        {canAccessNotifications && (
          <div
            className={`${navItem(isActive('/notifications'))} relative`}
            onClick={() => navigate('/notifications')}
          >
            <div className="size-[20px] shrink-0 flex items-center justify-center">
              <Bell
                className="w-5 h-5"
                stroke={isActive('/notifications') ? 'white' : '#303C48'}
                strokeWidth={1.67}
              />
            </div>
            <span className={textClass(isActive('/notifications'))}>Notificaciones</span>
            {unreadCount > 0 && (
              <span className={`ml-auto text-[11px] font-semibold px-[6px] py-[1px] rounded-full ${
                isActive('/notifications') ? 'bg-white text-[#8C59FE]' : 'bg-gradient-to-r from-[#597AFF] to-[#8C59FE] text-white'
              }`}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </div>
        )}

        {/* Configuración - Solo visible con permisos */}
        {canAccessSettings && (
          <div
            className={navItem(isActive('/settings'))}
            onClick={() => navigate('/settings')}
          >
            <div className="size-[20px] shrink-0">
              <svg className="block size-full" fill="none" viewBox="0 0 20 20">
                <path d={svgPaths.ped54800} stroke={isActive('/settings') ? 'white' : '#303C48'} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
                <path d={svgPaths.p3b27f100} stroke={isActive('/settings') ? 'white' : '#303C48'} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
              </svg>
            </div>
            <span className={textClass(isActive('/settings'))}>Configuración</span>
          </div>
        )}

        {/* Comparador — solo visible para admin principal */}
        {isAdminPrincipal && (
          <div
            className={navItem(isActive('/comparador'))}
            onClick={() => navigate('/comparador')}
          >
            <div className="size-[20px] shrink-0 flex items-center justify-center">
              <GitCompare
                className="w-5 h-5"
                stroke={isActive('/comparador') ? 'white' : '#303C48'}
                strokeWidth={1.67}
              />
            </div>
            <span className={textClass(isActive('/comparador'))}>WIP Comparador IA</span>
          </div>
        )}
      </nav>

      {/* Theme toggle */}
      <div className="px-[12px] mt-[4px] shrink-0">
        <ThemeToggle />
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* User section */}
      <div className="border-t border-[#EBEEF4] dark:border-border pt-[17px] px-[16px] pb-[17px] shrink-0">
        <div className="flex items-center gap-[12px]">
          <div className="bg-gradient-to-br from-[#597AFF] to-[#8C59FE] rounded-full size-[40px] flex items-center justify-center shrink-0 shadow-md">
            <span className="font-semibold leading-[24px] text-[16px] text-white tracking-[-0.3125px]">
              {(currentUser.name || currentUser.email || 'U').charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex flex-col flex-1 min-w-0">
            <p className="font-medium leading-[20px] text-[#303C48] dark:text-foreground text-[14px] tracking-[-0.1504px] truncate">
              {currentUser.name || 'Usuario'}
            </p>
            <p className="font-normal leading-[16px] text-[#81878E] dark:text-muted-foreground text-[12px] truncate">
              {currentUser.email}
            </p>
            <button
              onClick={async () => {
                await api.signOut();
                localStorage.removeItem('access_token');
                localStorage.removeItem('user');
                window.location.href = '/login';
              }}
              className="text-left font-medium leading-[20px] text-[#e7000b] text-[14px] tracking-[-0.1504px] underline decoration-solid mt-[2px] hover:text-red-800 transition-colors"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}