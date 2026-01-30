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
import { useTranslation } from '@/contexts/LanguageContext';
import type { Language } from '@/locales';

interface NavItem {
  title: string;
  path: string;
  icon: React.ElementType;
  children?: { title: string; path: string }[];
}


export const Navigation = () => {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { t, language, setLanguage } = useTranslation();

  const navItems: NavItem[] = [
    { title: t.nav.home, path: '/', icon: Home },
    {
      title: t.nav.pdfTools,
      path: '/pdf',
      icon: FileText,
      children: [
        { title: t.nav.pdfEdit, path: '/pdf/edit' },
        { title: t.nav.pdfSplit, path: '/pdf/split' },
        { title: t.nav.pdfCompress, path: '/pdf/compress' },
        { title: t.nav.pdfRotate, path: '/pdf/rotate' },
      ],
    },
    {
      title: t.nav.audioTools,
      path: '/audio',
      icon: Music,
      children: [
        { title: t.nav.audioConvert, path: '/audio/convert' },
        { title: t.nav.audioTrim, path: '/audio/trim' },
        { title: t.nav.audioMerge, path: '/audio/merge' },
      ],
    },
    {
      title: t.nav.imageTools,
      path: '/image',
      icon: Image,
      children: [
        { title: t.nav.imageCompress, path: '/image/compress' },
        { title: t.nav.imageConvert, path: '/image/convert' },
        { title: t.nav.imageResize, path: '/image/resize' },
        { title: t.nav.imageRotate, path: '/image/rotate' },
      ],
    },
  ];

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
  };

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
          <span className="text-xl font-bold hidden sm:inline">{t.siteName}</span>
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

        {/* Language Selector & Mobile Menu */}
        <div className="flex items-center gap-2">
          {/* Desktop Language Selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild className="hidden sm:flex">
              <Button variant="ghost" size="sm" className="gap-2">
                <span className="text-sm font-medium">{t.language.flags[language]}</span>
                <ChevronDown className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem 
                onClick={() => handleLanguageChange('tr')}
                className={cn(
                  "cursor-pointer flex items-center gap-2",
                  language === 'tr' && "bg-accent text-accent-foreground font-medium"
                )}
              >
                <span className="text-lg">{t.language.flags.tr}</span>
                {t.language.turkish}
                {language === 'tr' && <span className="ml-auto text-xs">✓</span>}
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => handleLanguageChange('en')}
                className={cn(
                  "cursor-pointer flex items-center gap-2",
                  language === 'en' && "bg-accent text-accent-foreground font-medium"
                )}
              >
                <span className="text-lg">{t.language.flags.en}</span>
                {t.language.english}
                {language === 'en' && <span className="ml-auto text-xs">✓</span>}
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => handleLanguageChange('pt')}
                className={cn(
                  "cursor-pointer flex items-center gap-2",
                  language === 'pt' && "bg-accent text-accent-foreground font-medium"
                )}
              >
                <span className="text-lg">{t.language.flags.pt}</span>
                {t.language.portuguese}
                {language === 'pt' && <span className="ml-auto text-xs">✓</span>}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Mobile Navigation */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild className="lg:hidden">
            <Button variant="ghost" size="icon">
              <Menu className="w-5 h-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[300px]">
            <div className="flex flex-col gap-4 mt-8">
              {/* Mobile Language Selector */}
              <div className="flex items-center gap-2 p-3 rounded-lg border">
                <span className="font-medium">{t.language.select}</span>
                <span className="ml-auto text-lg">{t.language.flags[language]}</span>
              </div>
              <div className="ml-8 space-y-1">
                <Button
                  variant={language === 'tr' ? 'secondary' : 'ghost'}
                  size="sm"
                  className="w-full justify-start gap-2"
                  onClick={() => handleLanguageChange('tr')}
                >
                  <span className="text-lg">{t.language.flags.tr}</span>
                  {t.language.turkish}
                  {language === 'tr' && <span className="ml-auto">✓</span>}
                </Button>
                <Button
                  variant={language === 'en' ? 'secondary' : 'ghost'}
                  size="sm"
                  className="w-full justify-start gap-2"
                  onClick={() => handleLanguageChange('en')}
                >
                  <span className="text-lg">{t.language.flags.en}</span>
                  {t.language.english}
                  {language === 'en' && <span className="ml-auto">✓</span>}
                </Button>
                <Button
                  variant={language === 'pt' ? 'secondary' : 'ghost'}
                  size="sm"
                  className="w-full justify-start gap-2"
                  onClick={() => handleLanguageChange('pt')}
                >
                  <span className="text-lg">{t.language.flags.pt}</span>
                  {t.language.portuguese}
                  {language === 'pt' && <span className="ml-auto">✓</span>}
                </Button>
              </div>
              
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
      </div>
    </header>
  );
};
