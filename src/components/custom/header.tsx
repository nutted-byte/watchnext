import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Film, Search, User, LogOut } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuthContext } from '@/context/auth-context';
import { signOut } from '@/hooks/use-auth';
import { toast } from 'sonner';

export function Header() {
  const { isAuthenticated, user } = useAuthContext();

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('Signed out successfully');
    } catch (error) {
      toast.error('Failed to sign out');
    }
  };

  return (
    <header className="border-b bg-card">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <Film className="w-6 h-6 text-accent" />
            <span className="text-xl font-bold">WatchNext</span>
          </Link>

          {/* Navigation - only show if authenticated */}
          {isAuthenticated && (
            <nav className="hidden md:flex items-center gap-6">
              <Link
                to="/films"
                className="text-sm font-medium hover:text-accent transition-colors"
              >
                Films
              </Link>
              <Link
                to="/series"
                className="text-sm font-medium hover:text-accent transition-colors"
              >
                TV Series
              </Link>
              <Link
                to="/search"
                className="text-sm font-medium hover:text-accent transition-colors"
              >
                Search
              </Link>
            </nav>
          )}

          {/* Right side actions */}
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <Link to="/search">
                  <Button variant="ghost" size="icon">
                    <Search className="w-5 h-5" />
                  </Button>
                </Link>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <User className="w-5 h-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>
                      {user?.email || 'My Account'}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut}>
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <Link to="/">
                <Button>Sign In</Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
