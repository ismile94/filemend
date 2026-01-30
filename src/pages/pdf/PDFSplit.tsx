import { useState, useCallback } from 'react';
import { Split, Download, FileText, Plus, Trash2 } from 'lucide-react';
import { FileDropzone } from '@/components/FileDropzone';
import { ProgressBar } from '@/components/ProgressBar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { usePDF } from '@/hooks/usePDF';
import { useToast } from '@/hooks/use-toast';
import { downloadBlob, formatFileSize } from '@/utils/fileHelpers';
import { useTranslation } from '@/contexts/LanguageContext';

interface PageRange {
  id: string;
  start: number;
  end: number;
}

export const PDFSplit = () => {
  const { t } = useTranslation();
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState<number>(0);
  const [ranges, setRanges] = useState<PageRange[]>([{ id: '1', start: 1, end: 1 }]);
  const { splitPDF, getPageCount, processing, progress } = usePDF();
  const { toast } = useToast();

  const handleFilesDrop = useCallback(async (fileList: FileList) => {
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
    
    try {
      const count = await getPageCount(pdfFile);
      setPageCount(count);
      setRanges([{ id: '1', start: 1, end: count }]);
    } catch (error) {
      toast({
        title: t.messages.error,
        description: t.messages.pageError,
        variant: 'destructive',
      });
    }
  }, [toast, getPageCount]);

  const handleClear = () => {
    setFile(null);
    setPageCount(0);
    setRanges([{ id: '1', start: 1, end: 1 }]);
  };

  const addRange = () => {
    setRanges(prev => [
      ...prev,
      { id: Date.now().toString(), start: 1, end: pageCount }
    ]);
  };

  const removeRange = (id: string) => {
    setRanges(prev => prev.filter(r => r.id !== id));
  };

  const updateRange = (id: string, field: 'start' | 'end', value: number) => {
    setRanges(prev =>
      prev.map(r =>
        r.id === id ? { ...r, [field]: Math.max(1, Math.min(pageCount, value)) } : r
      )
    );
  };

  const handleSplit = async () => {
    if (!file) return;

    const validRanges = ranges
      .filter(r => r.start <= r.end && r.start >= 1 && r.end <= pageCount)
      .map(r => ({ start: r.start, end: r.end }));

    if (validRanges.length === 0) {
      toast({
        title: t.messages.error,
        description: t.messages.rangeError,
        variant: 'destructive',
      });
      return;
    }

    try {
      const blobs = await splitPDF(file, validRanges);
      
      blobs.forEach((blob, idx) => {
        const range = validRanges[idx];
        downloadBlob(blob, `bolum-${range.start}-${range.end}.pdf`);
      });

      toast({
        title: t.messages.success,
        description: `${blobs.length} PDF ${t.additional.fileCreated}`,
      });
    } catch (error) {
      toast({
        title: t.messages.error,
        description: t.additional.fileSplitError,
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <div className="p-2 bg-red-500 rounded-lg">
            <Split className="w-6 h-6 text-white" />
          </div>
          {t.pdfSplit.title}
        </h1>
        <p className="text-muted-foreground mt-2">
          {t.pdfSplit.description}
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
              <div>
                <p className="font-medium">{file.name}</p>
                <p className="text-sm text-muted-foreground">
                  {formatFileSize(file.size)} • {t.additional.pageCount.replace('{count}', String(pageCount))}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>{t.ui.pageRanges}</Label>
                <Button variant="outline" size="sm" onClick={addRange}>
                  <Plus className="w-4 h-4 mr-1" />
                  {t.pdfSplit.addRange}
                </Button>
              </div>

              {ranges.map((range) => (
                <div key={range.id} className="flex items-center gap-3">
                  <div className="flex-1 grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs mb-1">{t.pdfSplit.start}</Label>
                      <Input
                        type="number"
                        min={1}
                        max={pageCount}
                        value={range.start}
                        onChange={(e) => updateRange(range.id, 'start', parseInt(e.target.value))}
                      />
                    </div>
                    <div>
                      <Label className="text-xs mb-1">{t.pdfSplit.end}</Label>
                      <Input
                        type="number"
                        min={1}
                        max={pageCount}
                        value={range.end}
                        onChange={(e) => updateRange(range.id, 'end', parseInt(e.target.value))}
                      />
                    </div>
                  </div>
                  {ranges.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeRange(range.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            {processing && (
              <div className="mt-6">
                <ProgressBar progress={progress} label={t.pdfSplit.splitting} />
              </div>
            )}

            <Button
              onClick={handleSplit}
              disabled={processing}
              className="w-full mt-6"
              size="lg"
            >
              {processing ? (
                t.pdfSplit.processing
              ) : (
                <>
                  <Download className="w-5 h-5 mr-2" />
                  {t.pdfSplit.splitAndDownload}
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
