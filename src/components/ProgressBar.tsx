import React from 'react';
import { cn } from '@/lib/utils';

interface ProgressBarProps {
  progress: number;
  label?: string;
  className?: string;
  showPercentage?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'success' | 'warning' | 'error';
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  label,
  className,
  showPercentage = true,
  size = 'md',
  variant = 'default',
}) => {
  const clampedProgress = Math.min(Math.max(progress, 0), 100);

  const sizeClasses = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  };

  const variantClasses = {
    default: 'bg-primary',
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    error: 'bg-red-500',
  };

  return (
    <div className={cn('w-full', className)}>
      {(label || showPercentage) && (
        <div className="flex justify-between items-center mb-2">
          {label && (
            <span className="text-sm font-medium text-muted-foreground">{label}</span>
          )}
          {showPercentage && (
            <span className="text-sm font-medium">{Math.round(clampedProgress)}%</span>
          )}
        </div>
      )}
      <div className={cn('w-full bg-muted rounded-full overflow-hidden', sizeClasses[size])}>
        <div
          className={cn(
            'transition-all duration-300 ease-out rounded-full',
            sizeClasses[size],
            variantClasses[variant]
          )}
          style={{ width: `${clampedProgress}%` }}
          role="progressbar"
          aria-valuenow={clampedProgress}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
    </div>
  );
};
