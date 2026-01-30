import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Menu, 
  FileText, 
  Music, 
  Image, 
  Home,
  ChevronDown
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';

interface NavItem {
  title: string;
  path: string;
  icon: React.ElementType;
  children?: { title: string; path: string }[];
}

const navItems: NavItem[] = [
  { title: 'Ana Sayfa', path: '/', icon: Home },
  {
    title: 'PDF Araçları',
    path: '/pdf',
    icon: FileText,
    children: [
      { title: 'PDF Düzenle', path: '/pdf/edit' },
      { title: 'PDF Böl', path: '/pdf/split' },
      { title: 'PDF Sıkıştır', path: '/pdf/compress' },
      { title: 'PDF Döndür', path: '/pdf/rotate' },
    ],
  },
  {
    title: 'Ses Araçları',
    path: '/audio',
    icon: Music,
    children: [
      { title: 'Ses Dönüştür', path: '/audio/convert' },
      { title: 'Ses Kırp', path: '/audio/trim' },
      { title: 'Ses Birleştir', path: '/audio/merge' },
    ],
  },
  {
    title: 'Görüntü Araçları',
    path: '/image',
    icon: Image,
    children: [
      { title: 'Görüntü Sıkıştır', path: '/image/compress' },
      { title: 'Görüntü Dönüştür', path: '/image/convert' },
      { title: 'Görüntü Boyutlandır', path: '/image/resize' },
      { title: 'Görüntü Döndür', path: '/image/rotate' },
    ],
  },
];

export const Navigation = () => {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <div className="p-2 bg-primary rounded-lg">
            <FileText className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold hidden sm:inline">FileTools</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-1">
          {navItems.map((item) => (
            item.children ? (
              <DropdownMenu key={item.path}>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant={isActive(item.path) ? 'secondary' : 'ghost'}
                    className={cn(
                      'gap-2',
                      isActive(item.path) && 'bg-secondary'
                    )}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.title}
                    <ChevronDown className="w-3 h-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48">
                  {item.children.map((child) => (
                    <DropdownMenuItem key={child.path} asChild>
                      <Link
                        to={child.path}
                        className={cn(
                          'cursor-pointer',
                          location.pathname === child.path && 'bg-accent'
                        )}
                      >
                        {child.title}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                key={item.path}
                variant={isActive(item.path) ? 'secondary' : 'ghost'}
                asChild
              >
                <Link to={item.path} className="gap-2">
                  <item.icon className="w-4 h-4" />
                  {item.title}
                </Link>
              </Button>
            )
          ))}
        </nav>

        {/* Mobile Navigation */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild className="lg:hidden">
            <Button variant="ghost" size="icon">
              <Menu className="w-5 h-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[300px]">
            <div className="flex flex-col gap-4 mt-8">
              {navItems.map((item) => (
                <div key={item.path}>
                  <Link
                    to={item.path}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-lg transition-colors',
                      isActive(item.path)
                        ? 'bg-secondary text-secondary-foreground'
                        : 'hover:bg-muted'
                    )}
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="font-medium">{item.title}</span>
                  </Link>
                  {item.children && (
                    <div className="ml-8 mt-2 space-y-1">
                      {item.children.map((child) => (
                        <Link
                          key={child.path}
                          to={child.path}
                          onClick={() => setMobileOpen(false)}
                          className={cn(
                            'block p-2 rounded-lg text-sm transition-colors',
                            location.pathname === child.path
                              ? 'bg-accent text-accent-foreground'
                              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                          )}
                        >
                          {child.title}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
};
