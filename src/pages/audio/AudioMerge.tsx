import React, { useState, useCallback, useEffect } from 'react';
import { Merge, ArrowUp, ArrowDown, Trash2, Download, FileAudio, Loader2 } from 'lucide-react';
import { FileDropzone } from '@/components/FileDropzone';
import { ProgressBar } from '@/components/ProgressBar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useFFmpeg } from '@/hooks/useFFmpeg';
import { useToast } from '@/hooks/use-toast';
import { downloadBlob, formatFileSize } from '@/utils/fileHelpers';

export const AudioMerge: React.FC = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [merging, setMerging] = useState(false);
  const { loaded, loading, loadFFmpeg, mergeAudio, progress } = useFFmpeg();
  const { toast } = useToast();

  useEffect(() => {
    if (!loaded && !loading) {
      loadFFmpeg().catch(() => {
        toast({
          title: 'Hata',
          description: 'FFmpeg yüklenirken bir hata oluştu.',
          variant: 'destructive',
        });
      });
    }
  }, [loaded, loading, loadFFmpeg, toast]);

  const handleFilesDrop = useCallback((fileList: FileList) => {
    const audioFiles = Array.from(fileList).filter(
      f => f.type.startsWith('audio/') || 
           ['.mp3', '.wav', '.flac', '.ogg', '.aac', '.m4a'].some(ext => 
             f.name.toLowerCase().endsWith(ext)
           )
    );

    if (audioFiles.length === 0) {
      toast({
        title: 'Hata',
        description: 'Lütfen ses dosyaları yükleyin.',
        variant: 'destructive',
      });
      return;
    }

    setFiles(prev => [...prev, ...audioFiles]);
  }, [toast]);

  const handleClear = () => {
    setFiles([]);
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const moveFile = (index: number, direction: 'up' | 'down') => {
    setFiles(prev => {
      const newFiles = [...prev];
      if (direction === 'up' && index > 0) {
        [newFiles[index], newFiles[index - 1]] = [newFiles[index - 1], newFiles[index]];
      } else if (direction === 'down' && index < newFiles.length - 1) {
        [newFiles[index], newFiles[index + 1]] = [newFiles[index + 1], newFiles[index]];
      }
      return newFiles;
    });
  };

  const handleMerge = async () => {
    if (files.length < 2) {
      toast({
        title: 'Hata',
        description: 'En az 2 ses dosyası seçmelisiniz.',
        variant: 'destructive',
      });
      return;
    }

    setMerging(true);
    try {
      const ext = files[0].name.split('.').pop() || 'mp3';
      const blob = await mergeAudio(files, ext);
      downloadBlob(blob, `birlesik.${ext}`);
      
      toast({
        title: 'Başarılı',
        description: 'Ses dosyaları başarıyla birleştirildi.',
      });
    } catch (error) {
      toast({
        title: 'Hata',
        description: 'Ses birleştirme işlemi başarısız oldu.',
        variant: 'destructive',
      });
    } finally {
      setMerging(false);
    }
  };

  const isProcessing = loading || merging;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <div className="p-2 bg-blue-500 rounded-lg">
            <Merge className="w-6 h-6 text-white" />
          </div>
          Ses Birleştir
        </h1>
        <p className="text-muted-foreground mt-2">
          Birden fazla ses dosyasını tek bir dosyada birleştirin.
        </p>
      </div>

      {!loaded && (
        <Card className="mb-6 bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-900">
          <CardContent className="p-4 flex items-center gap-3">
            <Loader2 className="w-5 h-5 animate-spin text-yellow-600" />
            <p className="text-sm text-yellow-700 dark:text-yellow-400">
              Ses işleme kütüphanesi yükleniyor... Lütfen bekleyin.
            </p>
          </CardContent>
        </Card>
      )}

      <FileDropzone
        onFilesDrop={handleFilesDrop}
        onClear={handleClear}
        accept="audio/*"
        multiple={true}
        selectedFiles={files}
      />

      {files.length > 0 && (
        <Card className="mt-6">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Sıralama</h3>
              <span className="text-sm text-muted-foreground">
                {files.length} dosya
              </span>
            </div>

            <div className="space-y-2 mb-6">
              {files.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 bg-muted rounded-lg"
                >
                  <span className="text-sm font-medium text-muted-foreground w-6">
                    {index + 1}
                  </span>
                  <FileAudio className="w-5 h-5 text-blue-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => moveFile(index, 'up')}
                      disabled={index === 0}
                      className="h-8 w-8"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => moveFile(index, 'down')}
                      disabled={index === files.length - 1}
                      className="h-8 w-8"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeFile(index)}
                      className="h-8 w-8 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {isProcessing && (
              <div className="mb-6">
                <ProgressBar 
                  progress={loading ? 0 : progress} 
                  label={loading ? 'Yükleniyor...' : 'Birleştiriliyor...'} 
                />
              </div>
            )}

            <Button
              onClick={handleMerge}
              disabled={isProcessing || files.length < 2 || !loaded}
              className="w-full"
              size="lg"
            >
              {isProcessing ? (
                'İşleniyor...'
              ) : (
                <>
                  <Download className="w-5 h-5 mr-2" />
                  Ses Birleştir ve İndir
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
