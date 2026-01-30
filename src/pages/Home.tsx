import { 
  FileText, 
  Music, 
  Image, 
  Merge, 
  Split, 
  Minimize2, 
  RotateCw,
  Scissors,
  Move,
  Shield,
  Zap,
  Lock,
  FileEdit
} from 'lucide-react';
import { ToolCard } from '@/components/ToolCard';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useTranslation } from '@/contexts/LanguageContext';





export const Home = () => {
  const { t } = useTranslation();

  const pdfTools = [
    {
      title: t.home.pdfTools.edit.title,
      description: t.home.pdfTools.edit.description,
      icon: FileEdit,
      path: '/pdf/edit',
      color: 'bg-red-500',
    },
    {
      title: t.home.pdfTools.split.title,
      description: t.home.pdfTools.split.description,
      icon: Split,
      path: '/pdf/split',
      color: 'bg-red-500',
    },
    {
      title: t.home.pdfTools.compress.title,
      description: t.home.pdfTools.compress.description,
      icon: Minimize2,
      path: '/pdf/compress',
      color: 'bg-red-500',
    },
  ];

  const audioTools = [
    {
      title: t.home.audioTools.convert.title,
      description: t.home.audioTools.convert.description,
      icon: Music,
      path: '/audio/convert',
      color: 'bg-blue-500',
    },
    {
      title: t.home.audioTools.trim.title,
      description: t.home.audioTools.trim.description,
      icon: Scissors,
      path: '/audio/trim',
      color: 'bg-blue-500',
    },
    {
      title: t.home.audioTools.merge.title,
      description: t.home.audioTools.merge.description,
      icon: Merge,
      path: '/audio/merge',
      color: 'bg-blue-500',
    },
  ];

  const imageTools = [
    {
      title: t.home.imageTools.compress.title,
      description: t.home.imageTools.compress.description,
      icon: Minimize2,
      path: '/image/compress',
      color: 'bg-green-500',
    },
    {
      title: t.home.imageTools.convert.title,
      description: t.home.imageTools.convert.description,
      icon: Move,
      path: '/image/convert',
      color: 'bg-green-500',
    },
    {
      title: t.home.imageTools.resize.title,
      description: t.home.imageTools.resize.description,
      icon: Image,
      path: '/image/resize',
      color: 'bg-green-500',
    },
    {
      title: t.home.imageTools.rotate.title,
      description: t.home.imageTools.rotate.description,
      icon: RotateCw,
      path: '/image/rotate',
      color: 'bg-green-500',
    },
  ];

  const features = [
    {
      icon: Shield,
      title: t.home.features.secure.title,
      description: t.home.features.secure.description,
    },
    {
      icon: Zap,
      title: t.home.features.fast.title,
      description: t.home.features.fast.description,
    },
    {
      icon: Lock,
      title: t.home.features.private.title,
      description: t.home.features.private.description,
    },
  ];
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-secondary/20" />
        <div className="container mx-auto px-4 relative">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <Zap className="w-4 h-4" />
              {t.home.hero.badge}
            </div>
            <h1 className="text-4xl lg:text-6xl font-bold tracking-tight mb-6">
              {t.home.hero.title}{' '}
              <span className="text-primary">{t.home.hero.titleHighlight}</span>
            </h1>
            <p className="text-lg lg:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              {t.home.hero.description}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="gap-2">
                <Link to="/pdf/edit">
                  <FileEdit className="w-5 h-5" />
                  {t.home.hero.primaryButton}
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="gap-2">
                <Link to="/audio/convert">
                  <Music className="w-5 h-5" />
                  {t.home.hero.secondaryButton}
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* PDF Tools Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-red-500 rounded-lg">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">{t.home.pdfTools.title}</h2>
              <p className="text-muted-foreground">{t.home.pdfTools.description}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {pdfTools.map((tool) => (
              <ToolCard key={tool.path} {...tool} />
            ))}
          </div>
        </div>
      </section>

      {/* Audio Tools Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-blue-500 rounded-lg">
              <Music className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">{t.home.audioTools.title}</h2>
              <p className="text-muted-foreground">{t.home.audioTools.description}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {audioTools.map((tool) => (
              <ToolCard key={tool.path} {...tool} />
            ))}
          </div>
        </div>
      </section>

      {/* Image Tools Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-green-500 rounded-lg">
              <Image className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">{t.home.imageTools.title}</h2>
              <p className="text-muted-foreground">{t.home.imageTools.description}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {imageTools.map((tool) => (
              <ToolCard key={tool.path} {...tool} />
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl font-bold mb-4">{t.home.features.title}</h2>
            <p className="text-muted-foreground">
              {t.home.features.subtitle}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="p-6 rounded-xl bg-card border text-center hover:shadow-lg transition-shadow"
              >
                <div className="inline-flex p-3 rounded-full bg-primary/10 text-primary mb-4">
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};
