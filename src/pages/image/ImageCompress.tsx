import { useState, useCallback } from 'react';
import { Minimize2, Download } from 'lucide-react';
import { FileDropzone } from '@/components/FileDropzone';
import { ProgressBar } from '@/components/ProgressBar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { useImage } from '@/hooks/useImage';
import { useToast } from '@/hooks/use-toast';
import { downloadBlob, formatFileSize } from '@/utils/fileHelpers';

export const ImageCompress = () => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [quality, setQuality] = useState(80);
  const [compressedBlob, setCompressedBlob] = useState<Blob | null>(null);
  const [compressedPreview, setCompressedPreview] = useState<string | null>(null);
  const { compressImage, processing, progress } = useImage();
  const { toast } = useToast();

  const handleFilesDrop = useCallback((fileList: FileList) => {
    const imageFile = Array.from(fileList).find(
      f => f.type.startsWith('image/') || 
           ['.jpg', '.jpeg', '.png', '.webp', '.gif'].some(ext => 
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
    setCompressedBlob(null);
    setCompressedPreview(null);
    
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(imageFile);
  }, [toast]);

  const handleClear = () => {
    setFile(null);
    setPreview(null);
    setCompressedBlob(null);
    setCompressedPreview(null);
    setQuality(80);
  };

  const handleCompress = async () => {
    if (!file) return;

    try {
      const blob = await compressImage(file, quality / 100);
      setCompressedBlob(blob);
      
      const reader = new FileReader();
      reader.onload = () => setCompressedPreview(reader.result as string);
      reader.readAsDataURL(blob);
      
      const ext = file.name.split('.').pop() || 'jpg';
      downloadBlob(blob, `sikistirilmis.${ext}`);
      
      toast({
        title: 'Başarılı',
        description: 'Görüntü başarıyla sıkıştırıldı.',
      });
    } catch (error) {
      toast({
        title: 'Hata',
        description: 'Görüntü sıkıştırma işlemi başarısız oldu.',
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
          <div className="p-2 bg-green-500 rounded-lg">
            <Minimize2 className="w-6 h-6 text-white" />
          </div>
          Görüntü Sıkıştır
        </h1>
        <p className="text-muted-foreground mt-2">
          Görüntü dosyalarınızın boyutunu kaliteyi koruyarak küçültün.
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Original */}
              <div>
                <Label className="mb-2 block">Orijinal</Label>
                <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                  {preview && (
                    <img
                      src={preview}
                      alt="Original"
                      className="w-full h-full object-contain"
                    />
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-2 text-center">
                  {formatFileSize(file.size)}
                </p>
              </div>

              {/* Compressed */}
              <div>
                <Label className="mb-2 block">Sıkıştırılmış</Label>
                <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                  {compressedPreview ? (
                    <img
                      src={compressedPreview}
                      alt="Compressed"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      Henüz sıkıştırılmadı
                    </div>
                  )}
                </div>
                {compressedBlob && (
                  <p className="text-sm text-muted-foreground mt-2 text-center">
                    {formatFileSize(compressedBlob.size)}
                    {' '}(%{compressionRatio} küçültüldü)
                  </p>
                )}
              </div>
            </div>

            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <Label>Kalite: %{quality}</Label>
              </div>
              <Slider
                value={[quality]}
                onValueChange={(v) => setQuality(v[0])}
                min={10}
                max={100}
                step={5}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Düşük kalite = daha küçük dosya boyutu
              </p>
            </div>

            {processing && (
              <div className="mb-6">
                <ProgressBar progress={progress} label="Sıkıştırılıyor..." />
              </div>
            )}

            <Button
              onClick={handleCompress}
              disabled={processing}
              className="w-full"
              size="lg"
            >
              {processing ? (
                'İşleniyor...'
              ) : compressedBlob ? (
                <>
                  <Download className="w-5 h-5 mr-2" />
                  Tekrar Sıkıştır ve İndir
                </>
              ) : (
                <>
                  <Minimize2 className="w-5 h-5 mr-2" />
                  Görüntü Sıkıştır
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
