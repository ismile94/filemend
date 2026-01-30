import { useState, useCallback } from 'react';
import { Merge, ArrowUp, ArrowDown, Trash2, Download, FileText } from 'lucide-react';
import { FileDropzone } from '@/components/FileDropzone';
import { ProgressBar } from '@/components/ProgressBar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { usePDF } from '@/hooks/usePDF';
import { useToast } from '@/hooks/use-toast';
import { downloadBlob, formatFileSize } from '@/utils/fileHelpers';

export const PDFMerge = () => {
  const [files, setFiles] = useState<File[]>([]);
  const { mergePDFs, processing, progress } = usePDF();
  const { toast } = useToast();

  const handleFilesDrop = useCallback((fileList: FileList) => {
    const pdfFiles = Array.from(fileList).filter(
      file => file.type === 'application/pdf' || file.name.endsWith('.pdf')
    );
    
    if (pdfFiles.length === 0) {
      toast({
        title: 'Hata',
        description: 'Lütfen sadece PDF dosyaları yükleyin.',
        variant: 'destructive',
      });
      return;
    }

    setFiles(prev => [...prev, ...pdfFiles]);
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
        description: 'En az 2 PDF dosyası seçmelisiniz.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const blob = await mergePDFs(files);
      downloadBlob(blob, 'birlesik.pdf');
      toast({
        title: 'Başarılı',
        description: 'PDF dosyaları başarıyla birleştirildi.',
      });
    } catch (error) {
      toast({
        title: 'Hata',
        description: 'PDF birleştirme işlemi başarısız oldu.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <div className="p-2 bg-red-500 rounded-lg">
            <Merge className="w-6 h-6 text-white" />
          </div>
          PDF Birleştir
        </h1>
        <p className="text-muted-foreground mt-2">
          Birden fazla PDF dosyasını tek bir dosyada birleştirin.
        </p>
      </div>

      <FileDropzone
        onFilesDrop={handleFilesDrop}
        onClear={handleClear}
        accept=".pdf"
        multiple={true}
        selectedFiles={files}
      />

      {files.length > 0 && (
        <Card className="mt-6">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Sıralama (Sürükle-bırak ile sıralayın)</h3>
              <span className="text-sm text-muted-foreground">
                {files.length} dosya
              </span>
            </div>

            <div className="space-y-2">
              {files.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 bg-muted rounded-lg"
                >
                  <span className="text-sm font-medium text-muted-foreground w-6">
                    {index + 1}
                  </span>
                  <FileText className="w-5 h-5 text-red-500 flex-shrink-0" />
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

            {processing && (
              <div className="mt-6">
                <ProgressBar progress={progress} label="Birleştiriliyor..." />
              </div>
            )}

            <Button
              onClick={handleMerge}
              disabled={processing || files.length < 2}
              className="w-full mt-6"
              size="lg"
            >
              {processing ? (
                'İşleniyor...'
              ) : (
                <>
                  <Download className="w-5 h-5 mr-2" />
                  PDF Birleştir ve İndir
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
