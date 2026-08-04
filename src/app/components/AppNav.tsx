import { useNavigate, useLocation } from 'react-router';
import { Home, LayoutDashboard } from 'lucide-react';

export function AppNav() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Don't show nav on login, admin dashboard, settings, or respondent pages
  if (
    location.pathname === '/login' ||
    location.pathname === '/admin' || 
    location.pathname === '/' ||
    location.pathname === '/settings' ||
    location.pathname.startsWith('/survey/')
  ) {
    return null;
  }

  return (
    <nav className="bg-white dark:bg-card border-b border-gray-200 dark:border-border px-6 py-3">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/admin')}
          className="flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-foreground hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-accent rounded-lg transition-colors"
        >
          <Home className="w-4 h-4" />
          <span className="text-sm font-medium">Admin Home</span>
        </button>
        
        <div className="flex items-center gap-2 text-sm text-gray-400 dark:text-muted-foreground">
          <span>/</span>
          <span className="text-gray-600 dark:text-muted-foreground">
            {location.pathname.includes('/builder') && 'Survey Builder'}
            {location.pathname.includes('/analytics') && 'Analytics Dashboard'}
            {location.pathname.includes('/survey') && 'Survey Preview'}
          </span>
        </div>
      </div>
    </nav>
  );
}