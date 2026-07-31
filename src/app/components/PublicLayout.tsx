import { Outlet } from 'react-router';
import { useEffect } from 'react';

/**
 * PublicLayout - Layout for public routes that don't require authentication
 * Used for: Login page, Survey respondent pages
 */
export function PublicLayout() {
  useEffect(() => {
    console.log('🟢 PublicLayout mounted');
    console.log('🟢 Current path:', window.location.pathname);
  }, []);
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Outlet />
    </div>
  );
}