import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export function ThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="h-[36px] rounded-[10px] w-full flex items-center px-[12px] gap-[8px]">
        <div className="size-[20px] shrink-0" />
        <span className="font-medium leading-[20px] text-[14px] text-[#303C48] dark:text-foreground tracking-[-0.1504px]">
          Modo oscuro
        </span>
      </div>
    );
  }

  const isDark = resolvedTheme === 'dark';

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="h-[36px] rounded-[10px] w-full flex items-center px-[12px] gap-[8px] hover:bg-[#EBEEF4] dark:hover:bg-accent transition-colors cursor-pointer"
      aria-label={isDark ? 'Activar modo claro' : 'Activar modo oscuro'}
    >
      <div className="size-[20px] shrink-0 flex items-center justify-center">
        {isDark ? (
          <Sun className="w-5 h-5 text-[#303C48] dark:text-foreground" strokeWidth={1.67} />
        ) : (
          <Moon className="w-5 h-5 text-[#303C48] dark:text-foreground" strokeWidth={1.67} />
        )}
      </div>
      <span className="font-medium leading-[20px] text-[#303C48] dark:text-foreground text-[14px] tracking-[-0.1504px]">
        {isDark ? 'Modo claro' : 'Modo oscuro'}
      </span>
    </button>
  );
}
