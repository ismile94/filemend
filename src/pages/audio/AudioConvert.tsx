import React, { useState, useCallback, useEffect } from 'react';
import { Music, Download, FileAudio, Loader2 } from 'lucide-react';
import { FileDropzone } from '@/components/FileDropzone';
import { ProgressBar } from '@/components/ProgressBar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useFFmpeg } from '@/hooks/useFFmpeg';
import { useToast } from '@/hooks/use-toast';
import { downloadBlob, formatFileSize } from '@/utils/fileHelpers';
import { AUDIO_FORMATS } from '@/types';

export const AudioConvert: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [outputFormat, setOutputFormat] = useState('mp3');
  const [converting, setConverting] = useState(false);
  const { loaded, loading, loadFFmpeg, convertAudio, progress } = useFFmpeg();
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
    const audioFile = Array.from(fileList).find(
      f => f.type.startsWith('audio/') || 
           ['.mp3', '.wav', '.flac', '.ogg', '.aac', '.m4a', '.wma'].some(ext => 
             f.name.toLowerCase().endsWith(ext)
           )
    );

    if (!audioFile) {
      toast({
        title: 'Hata',
        description: 'Lütfen bir ses dosyası yükleyin.',
        variant: 'destructive',
      });
      return;
    }

    setFile(audioFile);
  }, [toast]);

  const handleClear = () => {
    setFile(null);
  };

  const handleConvert = async () => {
    if (!file || !loaded) return;

    setConverting(true);
    try {
      const format = AUDIO_FORMATS.find(f => f.extension === outputFormat);
      if (!format) throw new Error('Format not found');

      const blob = await convertAudio(file, outputFormat, format.codec);
      const outputName = file.name.replace(/\.[^/.]+$/, `.${outputFormat}`);
      downloadBlob(blob, outputName);
      
      toast({
        title: 'Başarılı',
        description: 'Ses dosyası başarıyla dönüştürüldü.',
      });
    } catch (error) {
      toast({
        title: 'Hata',
        description: 'Ses dönüştürme işlemi başarısız oldu.',
        variant: 'destructive',
      });
    } finally {
      setConverting(false);
    }
  };

  const isProcessing = loading || converting;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <div className="p-2 bg-blue-500 rounded-lg">
            <Music className="w-6 h-6 text-white" />
          </div>
          Ses Dönüştür
        </h1>
        <p className="text-muted-foreground mt-2">
          Ses dosyalarınızı farklı formatlara dönüştürün.
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
        multiple={false}
        selectedFiles={file ? [file] : []}
      />

      {file && (
        <Card className="mt-6">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-6 p-3 bg-muted rounded-lg">
              <FileAudio className="w-8 h-8 text-blue-500" />
              <div>
                <p className="font-medium">{file.name}</p>
                <p className="text-sm text-muted-foreground">
                  {formatFileSize(file.size)}
                </p>
              </div>
            </div>

            <div className="mb-6">
              <Label htmlFor="format" className="text-base font-medium mb-2 block">
                Çıktı Formatı
              </Label>
              <Select value={outputFormat} onValueChange={setOutputFormat}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Format seçin" />
                </SelectTrigger>
                <SelectContent>
                  {AUDIO_FORMATS.map((format) => (
                    <SelectItem key={format.extension} value={format.extension}>
                      {format.format} (.{format.extension})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {isProcessing && (
              <div className="mb-6">
                <ProgressBar 
                  progress={loading ? 0 : progress} 
                  label={loading ? 'Yükleniyor...' : 'Dönüştürülüyor...'} 
                />
              </div>
            )}

            <Button
              onClick={handleConvert}
              disabled={isProcessing || !loaded}
              className="w-full"
              size="lg"
            >
              {isProcessing ? (
                'İşleniyor...'
              ) : (
                <>
                  <Download className="w-5 h-5 mr-2" />
                  Ses Dönüştür ve İndir
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
