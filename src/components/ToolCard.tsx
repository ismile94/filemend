import { useNavigate } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';

interface ToolCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  path: string;
  color?: string;
  className?: string;
}

export const ToolCard = ({
  title,
  description,
  icon: Icon,
  path,
  color = 'bg-blue-500',
  className,
}: ToolCardProps) => {
  const navigate = useNavigate();

  return (
    <Card
      onClick={() => navigate(path)}
      className={cn(
        'cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02]',
        'group border-2 border-transparent hover:border-primary/20',
        className
      )}
    >
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className={cn(
            'p-3 rounded-xl transition-transform duration-200 group-hover:scale-110',
            color,
            'text-white'
          )}>
            <Icon className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-1 group-hover:text-primary transition-colors">
              {title}
            </h3>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {description}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
