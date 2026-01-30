import React, { useRef } from 'react';
import { Upload, File, X } from 'lucide-react';
import { useDragDrop } from '@/hooks/useDragDrop';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/contexts/LanguageContext';

interface FileDropzoneProps {
  onFilesDrop: (files: FileList) => void;
  onClear?: () => void;
  accept?: string;
  multiple?: boolean;
  maxFiles?: number;
  selectedFiles?: File[];
  className?: string;
}

export const FileDropzone: React.FC<FileDropzoneProps> = ({
  onFilesDrop,
  onClear,
  accept = '*',
  multiple = true,
  maxFiles,
  selectedFiles = [],
  className,
}) => {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const { isDragging, handleDragEnter, handleDragLeave, handleDragOver, handleDrop, handleFileInput } = useDragDrop({
    onFilesDrop,
    accept,
    multiple,
  });

  const handleClick = () => {
    inputRef.current?.click();
  };

  const formatAcceptTypes = (acceptStr: string): string => {
    if (acceptStr === '*') return '.pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.mp3,.wav,.flac,.ogg,.aac,.m4a';
    return acceptStr;
  };

  return (
    <div className={cn('w-full', className)}>
      <div
        onClick={handleClick}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={cn(
          'relative border-2 border-dashed rounded-xl p-8 transition-all duration-200 cursor-pointer',
          'flex flex-col items-center justify-center gap-4 min-h-[200px]',
          isDragging
            ? 'border-primary bg-primary/5 scale-[1.02]'
            : 'border-muted-foreground/25 hover:border-muted-foreground/50 hover:bg-muted/50',
          selectedFiles.length > 0 && 'border-solid border-primary/50 bg-primary/5'
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={formatAcceptTypes(accept)}
          multiple={multiple}
          onChange={handleFileInput}
          className="hidden"
        />

        {selectedFiles.length === 0 ? (
          <>
            <div className={cn(
              'p-4 rounded-full transition-all duration-200',
              isDragging ? 'bg-primary text-primary-foreground' : 'bg-muted'
            )}>
              <Upload className="w-8 h-8" />
            </div>
            <div className="text-center">
              <p className="text-lg font-medium">
                {isDragging ? t.dropzone.dragText : t.dropzone.dropTextActive}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {multiple ? t.dropzone.multipleFiles : t.dropzone.singleFile}
                {maxFiles && ` ${t.dropzone.maxFiles.replace('{count}', String(maxFiles))}`}
              </p>
            </div>
          </>
        ) : (
          <div className="w-full">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium">
                {t.dropzone.filesSelected.replace('{count}', String(selectedFiles.length))}
              </span>
              {onClear && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onClear();
                  }}
                >
                  <X className="w-4 h-4 mr-1" />
                  {t.dropzone.clear}
                </Button>
              )}
            </div>
            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              {selectedFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 bg-background rounded-lg border"
                >
                  <File className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {t.dropzone.fileSize.replace('{size}', (file.size / 1024 / 1024).toFixed(2))}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
