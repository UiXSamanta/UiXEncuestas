import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router';
import Logo from '../../imports/Logo';
import svgPaths from '../../imports/svg-w42kgq06su';
import { Bell, GitCompare, ExternalLink, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import * as api from '../lib/api';
import { ThemeToggle } from './ThemeToggle';
import { UIX_SPACE_URL, clearUixSpaceSsoSession, isUixSpaceSsoUser } from '../lib/uixSso';

const SIDEBAR_COLLAPSED_KEY = 'admin_sidebar_collapsed';

interface AdminSidebarProps {
  unreadCount?: number;
}

export function AdminSidebar({ unreadCount = 0 }: AdminSidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === '1';
    } catch {
      return false;
    }
  });

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const showUixSpaceReturn = isUixSpaceSsoUser(currentUser);

  const isActive = (path: string) => location.pathname === path;

  const isAdminPrincipal = currentUser.email === 'samanta.camacho@upax.com.mx';
  const canAccessNotifications = isAdminPrincipal || currentUser.can_access_notifications === true;
  const canAccessSettings = isAdminPrincipal || currentUser.can_access_settings === true;

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(SIDEBAR_COLLAPSED_KEY, next ? '1' : '0');
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  const navItem = (active: boolean) =>
    active
      ? `bg-gradient-to-r from-[#597AFF] to-[#8C59FE] h-[36px] rounded-[10px] w-full flex items-center ${collapsed ? 'justify-center px-0' : 'px-[12px]'} gap-[8px] cursor-pointer shadow-md`
      : `h-[36px] rounded-[10px] w-full flex items-center ${collapsed ? 'justify-center px-0' : 'px-[12px]'} gap-[8px] hover:bg-[#EBEEF4] dark:hover:bg-accent transition-colors cursor-pointer`;

  const textClass = (active: boolean) =>
    active
      ? 'font-medium leading-[20px] text-[14px] text-white tracking-[-0.1504px]'
      : 'font-medium leading-[20px] text-[#303C48] dark:text-foreground text-[14px] tracking-[-0.1504px]';

  return (
    <aside
      className={`${collapsed ? 'w-[72px]' : 'w-64'} bg-white dark:bg-card border-r border-[#EBEEF4] dark:border-border flex flex-col shrink-0 transition-[width] duration-200`}
    >
      {/* Header with Logo */}
      <div className={`flex flex-col gap-[12px] pt-[24px] ${collapsed ? 'px-[16px]' : 'px-[24px]'} pb-[16px] shrink-0`}>
        <div className="flex items-center justify-between gap-2">
          <div className={`${collapsed ? 'w-10 h-5 mx-auto' : 'w-16 h-7'} shrink-0`}>
            <Logo />
          </div>
          {!collapsed && (
            <button
              type="button"
              onClick={toggleCollapsed}
              className="p-1.5 rounded-lg text-[#81878E] hover:bg-[#EBEEF4] dark:hover:bg-accent transition-colors"
              title="Contraer menú"
              aria-label="Contraer menú"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          )}
        </div>
        {collapsed && (
          <button
            type="button"
            onClick={toggleCollapsed}
            className="mx-auto p-1.5 rounded-lg text-[#81878E] hover:bg-[#EBEEF4] dark:hover:bg-accent transition-colors"
            title="Expandir menú"
            aria-label="Expandir menú"
          >
            <PanelLeftOpen className="w-4 h-4" />
          </button>
        )}
        {!collapsed && (
          <>
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
          </>
        )}
      </div>

      {/* Navigation */}
      <nav className={`flex flex-col gap-[4px] ${collapsed ? 'px-[8px]' : 'px-[12px]'} shrink-0`}>
        <div
          className={navItem(isActive('/admin'))}
          onClick={() => navigate('/admin')}
          title={collapsed ? 'Dashboard' : undefined}
        >
          <div className="size-[20px] shrink-0">
            <svg className="block size-full" fill="none" viewBox="0 0 20 20">
              <path d={svgPaths.p1fc96a00} stroke={isActive('/admin') ? 'white' : '#303C48'} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
              <path d={svgPaths.p33089d00} stroke={isActive('/admin') ? 'white' : '#303C48'} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
              <path d={svgPaths.p49cfa80}  stroke={isActive('/admin') ? 'white' : '#303C48'} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
              <path d={svgPaths.p1cfbf300} stroke={isActive('/admin') ? 'white' : '#303C48'} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
            </svg>
          </div>
          {!collapsed && <span className={textClass(isActive('/admin'))}>Dashboard</span>}
        </div>

        {canAccessNotifications && (
          <div
            className={`${navItem(isActive('/notifications'))} relative`}
            onClick={() => navigate('/notifications')}
            title={collapsed ? 'Notificaciones' : undefined}
          >
            <div className="size-[20px] shrink-0 flex items-center justify-center">
              <Bell
                className="w-5 h-5"
                stroke={isActive('/notifications') ? 'white' : '#303C48'}
                strokeWidth={1.67}
              />
            </div>
            {!collapsed && <span className={textClass(isActive('/notifications'))}>Notificaciones</span>}
            {unreadCount > 0 && (
              <span className={`${collapsed ? 'absolute -top-1 -right-1' : 'ml-auto'} text-[11px] font-semibold px-[6px] py-[1px] rounded-full ${
                isActive('/notifications') ? 'bg-white text-[#8C59FE]' : 'bg-gradient-to-r from-[#597AFF] to-[#8C59FE] text-white'
              }`}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </div>
        )}

        {canAccessSettings && (
          <div
            className={navItem(isActive('/settings'))}
            onClick={() => navigate('/settings')}
            title={collapsed ? 'Configuración' : undefined}
          >
            <div className="size-[20px] shrink-0">
              <svg className="block size-full" fill="none" viewBox="0 0 20 20">
                <path d={svgPaths.ped54800} stroke={isActive('/settings') ? 'white' : '#303C48'} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
                <path d={svgPaths.p3b27f100} stroke={isActive('/settings') ? 'white' : '#303C48'} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
              </svg>
            </div>
            {!collapsed && <span className={textClass(isActive('/settings'))}>Configuración</span>}
          </div>
        )}

        {isAdminPrincipal && (
          <div
            className={navItem(isActive('/comparador'))}
            onClick={() => navigate('/comparador')}
            title={collapsed ? 'WIP Comparador IA' : undefined}
          >
            <div className="size-[20px] shrink-0 flex items-center justify-center">
              <GitCompare
                className="w-5 h-5"
                stroke={isActive('/comparador') ? 'white' : '#303C48'}
                strokeWidth={1.67}
              />
            </div>
            {!collapsed && <span className={textClass(isActive('/comparador'))}>WIP Comparador IA</span>}
          </div>
        )}
      </nav>

      {/* Theme toggle */}
      <div className={`${collapsed ? 'px-[8px]' : 'px-[12px]'} mt-[4px] shrink-0`}>
        <ThemeToggle collapsed={collapsed} />
      </div>

      <div className="flex-1" />

      {/* UiX Space return (SSO users) */}
      {showUixSpaceReturn && (
        <div className={`${collapsed ? 'px-[8px]' : 'px-[12px]'} pb-[8px] shrink-0`}>
          <div
            className={navItem(false)}
            onClick={() => { window.location.href = UIX_SPACE_URL; }}
            title={collapsed ? 'Regresar a UiX Space' : undefined}
          >
            <div className="size-[20px] shrink-0 flex items-center justify-center">
              <ExternalLink className="w-5 h-5 text-[#303C48] dark:text-foreground" strokeWidth={1.67} />
            </div>
            {!collapsed && (
              <span className={textClass(false)}>Regresar a UiX Space</span>
            )}
          </div>
        </div>
      )}

      {/* User section */}
      <div className={`border-t border-[#EBEEF4] dark:border-border pt-[17px] ${collapsed ? 'px-[12px]' : 'px-[16px]'} pb-[17px] shrink-0`}>
        <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-[12px]'}`}>
          <div
            className="bg-gradient-to-br from-[#597AFF] to-[#8C59FE] rounded-full size-[40px] flex items-center justify-center shrink-0 shadow-md"
            title={collapsed ? (currentUser.name || currentUser.email || 'Usuario') : undefined}
          >
            <span className="font-semibold leading-[24px] text-[16px] text-white tracking-[-0.3125px]">
              {(currentUser.name || currentUser.email || 'U').charAt(0).toUpperCase()}
            </span>
          </div>
          {!collapsed && (
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
                  clearUixSpaceSsoSession();
                  window.location.href = '/login';
                }}
                className="text-left font-medium leading-[20px] text-[#e7000b] text-[14px] tracking-[-0.1504px] underline decoration-solid mt-[2px] hover:text-red-800 transition-colors"
              >
                Cerrar Sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
