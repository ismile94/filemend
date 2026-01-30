import { useState, useCallback } from 'react';
import { Move, Download, Image as ImageIcon } from 'lucide-react';
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
import { useImage } from '@/hooks/useImage';
import { useToast } from '@/hooks/use-toast';
import { downloadBlob, formatFileSize } from '@/utils/fileHelpers';
import { IMAGE_FORMATS } from '@/types';

export const ImageConvert = () => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [outputFormat, setOutputFormat] = useState('png');
  const { convertImage, processing, progress } = useImage();
  const { toast } = useToast();

  const handleFilesDrop = useCallback((fileList: FileList) => {
    const imageFile = Array.from(fileList).find(
      f => f.type.startsWith('image/') || 
           ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp'].some(ext => 
             f.name.toLowerCase().endsWith(ext)
           )
    );

    if (!imageFile) {
      toast({
        title: 'Hata',
        description: 'Lütfen bir görüntü dosyası yükleyin.',
        variant: 'destructive',
      });
      return;
    }

    setFile(imageFile);
    
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(imageFile);
  }, [toast]);

  const handleClear = () => {
    setFile(null);
    setPreview(null);
    setOutputFormat('png');
  };

  const handleConvert = async () => {
    if (!file) return;

    try {
      const blob = await convertImage(file, outputFormat, 0.9);
      
      const outputName = file.name.replace(/\.[^/.]+$/, `.${outputFormat}`);
      downloadBlob(blob, outputName);
      
      toast({
        title: 'Başarılı',
        description: 'Görüntü başarıyla dönüştürüldü.',
      });
    } catch (error) {
      toast({
        title: 'Hata',
        description: 'Görüntü dönüştürme işlemi başarısız oldu.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <div className="p-2 bg-green-500 rounded-lg">
            <Move className="w-6 h-6 text-white" />
          </div>
          Görüntü Dönüştür
        </h1>
        <p className="text-muted-foreground mt-2">
          Görüntü dosyalarınızı farklı formatlara dönüştürün.
        </p>
      </div>

      <FileDropzone
        onFilesDrop={handleFilesDrop}
        onClear={handleClear}
        accept="image/*"
        multiple={false}
        selectedFiles={file ? [file] : []}
      />

      {file && (
        <Card className="mt-6">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-6 p-3 bg-muted rounded-lg">
              <ImageIcon className="w-8 h-8 text-green-500" />
              <div className="flex-1">
                <p className="font-medium">{file.name}</p>
                <p className="text-sm text-muted-foreground">
                  {formatFileSize(file.size)}
                </p>
              </div>
            </div>

            {preview && (
              <div className="mb-6">
                <Label className="mb-2 block">Önizleme</Label>
                <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                  <img
                    src={preview}
                    alt="Preview"
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
            )}

            <div className="mb-6">
              <Label htmlFor="format" className="text-base font-medium mb-2 block">
                Çıktı Formatı
              </Label>
              <Select value={outputFormat} onValueChange={setOutputFormat}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Format seçin" />
                </SelectTrigger>
                <SelectContent>
                  {IMAGE_FORMATS.map((format) => (
                    <SelectItem key={format.extension} value={format.extension}>
                      {format.format} (.{format.extension})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {processing && (
              <div className="mb-6">
                <ProgressBar progress={progress} label="Dönüştürülüyor..." />
              </div>
            )}

            <Button
              onClick={handleConvert}
              disabled={processing}
              className="w-full"
              size="lg"
            >
              {processing ? (
                'İşleniyor...'
              ) : (
                <>
                  <Download className="w-5 h-5 mr-2" />
                  Görüntü Dönüştür ve İndir
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
