import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface ContentSectionNavProps {
  basePath: 'films' | 'series';
  watchlistCount?: number;
}

export function ContentSectionNav({ basePath, watchlistCount }: ContentSectionNavProps) {
  const location = useLocation();
  const currentPath = location.pathname;

  const links = [
    { href: `/${basePath}/watchlist`, label: 'Watchlist', showCount: true },
    { href: `/${basePath}/history`, label: 'History', showCount: false },
    { href: `/${basePath}/recommendations`, label: 'Recommendations', showCount: false },
  ];

  return (
    <nav className="border-b border-border">
      <div className="flex gap-1">
        {links.map((link) => {
          const isActive = currentPath === link.href;
          return (
            <Link
              key={link.href}
              to={link.href}
              className={cn(
                'px-4 py-3 text-sm font-medium transition-colors relative',
                'hover:text-foreground',
                isActive
                  ? 'text-foreground'
                  : 'text-muted-foreground'
              )}
            >
              <span className="relative">
                {link.label}
                {link.showCount && watchlistCount !== undefined && ` (${watchlistCount})`}
                {isActive && (
                  <span className="absolute bottom-[-13px] left-0 right-0 h-[2px] bg-accent" />
                )}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
