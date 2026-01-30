import { useState, useCallback } from 'react';
import { Minimize2, Download, FileText, CheckCircle } from 'lucide-react';
import { FileDropzone } from '@/components/FileDropzone';
import { ProgressBar } from '@/components/ProgressBar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { usePDF } from '@/hooks/usePDF';
import { useToast } from '@/hooks/use-toast';
import { downloadBlob, formatFileSize } from '@/utils/fileHelpers';
import { useTranslation } from '@/contexts/LanguageContext';

export const PDFCompress = () => {
  const { t } = useTranslation();
  const [file, setFile] = useState<File | null>(null);
  const [compressedBlob, setCompressedBlob] = useState<Blob | null>(null);
  const { compressPDF, processing, progress } = usePDF();
  const { toast } = useToast();

  const handleFilesDrop = useCallback((fileList: FileList) => {
    const pdfFile = Array.from(fileList).find(
      f => f.type === 'application/pdf' || f.name.endsWith('.pdf')
    );

    if (!pdfFile) {
      toast({
        title: t.messages.error,
        description: `${t.messages.pleaseUpload} ${t.messages.pdfFile} ${t.messages.fileUpload}`,
        variant: 'destructive',
      });
      return;
    }

    setFile(pdfFile);
    setCompressedBlob(null);
  }, [toast]);

  const handleClear = () => {
    setFile(null);
    setCompressedBlob(null);
  };

  const handleCompress = async () => {
    if (!file) return;

    try {
      const blob = await compressPDF(file);
      setCompressedBlob(blob);
      downloadBlob(blob, 'compressed.pdf');
      toast({
        title: t.messages.success,
        description: `${t.pdfCompress.pdfPrefix}${t.messages.fileCompressed}`,
      });
    } catch (error) {
      toast({
        title: t.messages.error,
        description: `${t.pdfCompress.pdfPrefix}${t.messages.processingError}`,
        variant: 'destructive',
      });
    }
  };

  const compressionRatio = compressedBlob && file
    ? Math.round(((file.size - compressedBlob.size) / file.size) * 100)
    : 0;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <div className="p-2 bg-red-500 rounded-lg">
            <Minimize2 className="w-6 h-6 text-white" />
          </div>
          {t.pdfCompress.title}
        </h1>
        <p className="text-muted-foreground mt-2">
          {t.pdfCompress.description}
        </p>
      </div>

      <FileDropzone
        onFilesDrop={handleFilesDrop}
        onClear={handleClear}
        accept=".pdf"
        multiple={false}
        selectedFiles={file ? [file] : []}
      />

      {file && (
        <Card className="mt-6">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-6 p-3 bg-muted rounded-lg">
              <FileText className="w-8 h-8 text-red-500" />
              <div className="flex-1">
                <p className="font-medium">{file.name}</p>
                <p className="text-sm text-muted-foreground">
                  {t.pdfCompress.originalSize}: {formatFileSize(file.size)}
                </p>
              </div>
            </div>

            {compressedBlob && (
              <div className="mb-6 p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-lg">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-6 h-6 text-green-500" />
                  <div>
                    <p className="font-medium text-green-700 dark:text-green-400">
                      {t.pdfCompress.compressionCompleted}
                    </p>
                    <p className="text-sm text-green-600 dark:text-green-500">
                      {formatFileSize(file.size)} → {formatFileSize(compressedBlob.size)}
                      {t.pdfCompress.reducedBy.replace('{ratio}', compressionRatio.toString())}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {processing && (
              <div className="mb-6">
                <ProgressBar progress={progress} label={t.pdfCompress.compressing} />
              </div>
            )}

            <Button
              onClick={handleCompress}
              disabled={processing}
              className="w-full"
              size="lg"
            >
              {processing ? (
                t.pdfCompress.processing
              ) : compressedBlob ? (
                <>
                  <Download className="w-5 h-5 mr-2" />
                  {t.pdfCompress.downloadAgain}
                </>
              ) : (
                <>
                  <Minimize2 className="w-5 h-5 mr-2" />
                  {t.pdfCompress.title}
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
