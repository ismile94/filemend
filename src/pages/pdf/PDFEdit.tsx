import { useState, useCallback, useRef, useEffect } from 'react';
import { 
  FileEdit, 
  Download, 
  FileText, 
  ArrowUp, 
  ArrowDown, 
  Trash2, 
  RotateCw,
  Plus,
  X,
  ChevronLeft,
  ChevronRight,
  GripVertical
} from 'lucide-react';
import { FileDropzone } from '@/components/FileDropzone';
import { ProgressBar } from '@/components/ProgressBar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocument, degrees } from 'pdf-lib';

// PDF.js v5 için worker ayarı
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

interface PDFPage {
  id: string;
  pdfIndex: number;
  pageNumber: number;
  rotation: 0 | 90 | 180 | 270;
  thumbnail: string;
  width: number;
  height: number;
}

interface PDFFile {
  file: File;
  pdf: pdfjsLib.PDFDocumentProxy;
  pageCount: number;
}

export const PDFEdit = () => {
  const [files, setFiles] = useState<PDFFile[]>([]);
  const [pages, setPages] = useState<PDFPage[]>([]);
  const [selectedPage, setSelectedPage] = useState<number | null>(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  
  // Drag & Drop state'leri
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  // Long press için ref'ler
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLongPress = useRef(false);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const thumbnailScrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // THUMBNAIL KALİTESİ ARTIRILDI: 0.2'den 0.5'e çıkardım
  const renderPageThumbnail = async (pdf: pdfjsLib.PDFDocumentProxy, pageNum: number): Promise<{url: string, width: number, height: number}> => {
    const page = await pdf.getPage(pageNum);
    const scale = 0.5; // Kalite artırıldı (0.2 -> 0.5)
    const viewport = page.getViewport({ scale });
    
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d')!;
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    
    await page.render({ canvasContext: context, viewport }).promise;
    
    return { 
      url: canvas.toDataURL(), 
      width: page.getViewport({ scale: 1 }).width,
      height: page.getViewport({ scale: 1 }).height
    };
  };

  const handleFilesDrop = useCallback(async (fileList: FileList) => {
    const pdfFiles = Array.from(fileList).filter(
      file => file.type === 'application/pdf' || file.name.endsWith('.pdf')
    );
    
    if (pdfFiles.length === 0) {
      toast({ title: 'Hata', description: 'Lütfen sadece PDF dosyaları yükleyin.', variant: 'destructive' });
      return;
    }

    setProcessing(true);
    setProgress(0);

    try {
      const currentFileCount = files.length;
      
      for (let i = 0; i < pdfFiles.length; i++) {
        const file = pdfFiles[i];
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        
        const newFile: PDFFile = {
          file,
          pdf,
          pageCount: pdf.numPages
        };
        
        setFiles(prev => [...prev, newFile]);

        const newPages: PDFPage[] = [];
        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
          const { url, width, height } = await renderPageThumbnail(pdf, pageNum);
          newPages.push({
            id: `${currentFileCount + i}-${pageNum}`,
            pdfIndex: currentFileCount + i,
            pageNumber: pageNum,
            rotation: 0,
            thumbnail: url,
            width,
            height
          });
        }
        setPages(prev => [...prev, ...newPages]);
        setProgress(Math.round(((i + 1) / pdfFiles.length) * 100));
      }
      
      toast({ title: 'Başarılı', description: `${pdfFiles.length} PDF dosyası yüklendi.` });
    } catch (error) {
      console.error('PDF Yükleme Hatası:', error);
      toast({
        title: 'Hata',
        description: `PDF yüklenirken hata: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`,
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
      setProgress(0);
    }
  }, [files.length, toast]);

  const handleClear = useCallback(() => {
    setFiles([]);
    setPages([]);
    setSelectedPage(null);
  }, []);

  const removePage = useCallback((index: number) => {
    setPages(prev => prev.filter((_, i) => i !== index));
    if (selectedPage === index) {
      setSelectedPage(prev => (prev && prev > 0 ? prev - 1 : null));
    } else if (selectedPage !== null && selectedPage > index) {
      setSelectedPage(selectedPage - 1);
    }
  }, [selectedPage]);

  const movePage = useCallback((fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    
    setPages(prev => {
      const newPages = [...prev];
      const [movedPage] = newPages.splice(fromIndex, 1);
      newPages.splice(toIndex, 0, movedPage);
      return newPages;
    });
    
    if (selectedPage === fromIndex) {
      setSelectedPage(toIndex);
    } else if (fromIndex < toIndex && selectedPage !== null && selectedPage > fromIndex && selectedPage <= toIndex) {
      setSelectedPage(selectedPage - 1);
    } else if (fromIndex > toIndex && selectedPage !== null && selectedPage < fromIndex && selectedPage >= toIndex) {
      setSelectedPage(selectedPage + 1);
    }
  }, [selectedPage]);

  const rotatePage = useCallback((index: number) => {
    setPages(prev => {
      return prev.map((page, i) => {
        if (i !== index) return page;
        const currentRotation = page.rotation;
        const nextRotation = ((currentRotation + 90) % 360) as 0 | 90 | 180 | 270;
        return { ...page, rotation: nextRotation };
      });
    });
  }, []);

  const rotateAllPages = useCallback(() => {
    setPages(prev => 
      prev.map(page => ({
        ...page,
        rotation: ((page.rotation + 90) % 360) as 0 | 90 | 180 | 270
      }))
    );
  }, []);

  const handleExport = useCallback(async () => {
    if (pages.length === 0) {
      toast({ title: 'Hata', description: 'En az bir sayfa olmalı.', variant: 'destructive' });
      return;
    }

    setProcessing(true);
    setProgress(0);

    try {
      const newPdf = await PDFDocument.create();

      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        const pdfFile = files[page.pdfIndex];
        
        const arrayBuffer = await pdfFile.file.arrayBuffer();
        const sourcePdf = await PDFDocument.load(arrayBuffer);
        
        const [copiedPage] = await newPdf.copyPages(sourcePdf, [page.pageNumber - 1]);
        
        if (page.rotation !== 0) {
          copiedPage.setRotation(degrees(page.rotation));
        }
        
        newPdf.addPage(copiedPage);
        setProgress(Math.round(((i + 1) / pages.length) * 100));
      }

      const pdfBytes = await newPdf.save();
      const blob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'duzenlenmis.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({ title: 'Başarılı', description: 'PDF başarıyla dışa aktarıldı.' });
    } catch (error) {
      console.error('Export Hatası:', error);
      toast({ title: 'Hata', description: 'PDF dışa aktarılırken bir hata oluştu.', variant: 'destructive' });
    } finally {
      setProcessing(false);
      setProgress(0);
    }
  }, [pages, files, toast]);

  // Long Press ve Drag handlers - DÜZELTİLDİ
  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent, index: number) => {
    // Sadece sol tık veya touch ise başlat
    if ('button' in e && e.button !== 0) return;
    
    isLongPress.current = false;
    
    longPressTimer.current = setTimeout(() => {
      isLongPress.current = true;
      setDraggedIndex(index);
      setIsDragging(true);
      
      // Haptic feedback
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
    }, 400); // 400ms daha hızlı tepki
  };

  const handleTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isDragging || draggedIndex === null) return;
    
    e.preventDefault();
    
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const scrollContainer = thumbnailScrollRef.current;
    
    if (scrollContainer) {
      const rect = scrollContainer.getBoundingClientRect();
      const y = clientY - rect.top + scrollContainer.scrollTop;
      
      // Otomatik scroll (sınırda ise)
      const relativeY = clientY - rect.top;
      if (relativeY < 50 && scrollContainer.scrollTop > 0) {
        scrollContainer.scrollTop -= 10;
      } else if (relativeY > rect.height - 50) {
        scrollContainer.scrollTop += 10;
      }
      
      // Hangi index üzerinde olduğunu hesapla
      const children = Array.from(scrollContainer.children);
      for (let i = 0; i < children.length; i++) {
        const child = children[i] as HTMLElement;
        const childTop = child.offsetTop;
        const childBottom = childTop + child.offsetHeight;
        
        if (y >= childTop && y <= childBottom) {
          if (dragOverIndex !== i) {
            setDragOverIndex(i);
          }
          break;
        }
      }
    }
  };

  const handleTouchEnd = (e?: React.TouchEvent | React.MouseEvent) => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    
    if (isDragging && draggedIndex !== null && dragOverIndex !== null && draggedIndex !== dragOverIndex) {
      movePage(draggedIndex, dragOverIndex);
    }
    
    setDraggedIndex(null);
    setDragOverIndex(null);
    setIsDragging(false);
    isLongPress.current = false;
  };

  // HTML5 Drag Drop için desktop
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    setIsDragging(true);
    e.dataTransfer.effectAllowed = 'move';
    // Drag görselini ayarla
    if (e.target instanceof HTMLElement) {
      e.dataTransfer.setDragImage(e.target, 20, 20);
    }
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== dropIndex) {
      movePage(draggedIndex, dropIndex);
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
    setIsDragging(false);
  };

  useEffect(() => {
    if (selectedPage === null || !canvasRef.current || pages.length === 0) return;
    
    const renderSelectedPage = async () => {
      try {
        const page = pages[selectedPage];
        if (!page) return;
        
        const pdfFile = files[page.pdfIndex];
        if (!pdfFile) return;
        
        const pdfPage = await pdfFile.pdf.getPage(page.pageNumber);
        const viewport = pdfPage.getViewport({ scale: 1 });
        
        const canvas = canvasRef.current!;
        const context = canvas.getContext('2d')!;
        
        if (page.rotation === 90 || page.rotation === 270) {
          canvas.width = viewport.height;
          canvas.height = viewport.width;
        } else {
          canvas.width = viewport.width;
          canvas.height = viewport.height;
        }
        
        context.save();
        
        if (page.rotation !== 0) {
          context.translate(canvas.width / 2, canvas.height / 2);
          context.rotate((page.rotation * Math.PI) / 180);
          context.translate(-viewport.width / 2, -viewport.height / 2);
        }
        
        context.fillStyle = 'white';
        context.fillRect(0, 0, viewport.width, viewport.height);
        
        await pdfPage.render({ canvasContext: context, viewport }).promise;
        context.restore();
      } catch (error) {
        console.error('Sayfa render hatası:', error);
      }
    };
    
    renderSelectedPage();
  }, [selectedPage, pages, files]);

  return (
    <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8 max-w-7xl h-[calc(100vh-4rem)] flex flex-col">
      {/* Header */}
      <div className="mb-3 sm:mb-6 flex-shrink-0">
        <h1 className="text-xl sm:text-3xl font-bold flex items-center gap-2 sm:gap-3">
          <div className="p-1.5 sm:p-2 bg-red-500 rounded-lg shadow-lg">
            <FileEdit className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          PDF Düzenle
        </h1>
        <p className="text-muted-foreground mt-1 sm:mt-2 text-sm sm:text-base">
          PDF dosyalarınızı düzenleyin ve birleştirin.
        </p>
      </div>

      {pages.length === 0 && (
        <div className="flex-shrink-0">
          <FileDropzone
            onFilesDrop={handleFilesDrop}
            onClear={handleClear}
            accept=".pdf"
            multiple={true}
            selectedFiles={[]}
          />
          {processing && <div className="mt-4"><ProgressBar progress={progress} label="PDF yükleniyor..." /></div>}
        </div>
      )}

      {pages.length > 0 && (
        <div className="flex flex-col gap-3 flex-1 min-h-0">
          {/* Ana Toolbar - 3D Butonlar */}
          <Card className="flex-shrink-0 shadow-lg border-b-4 border-b-gray-200 dark:border-b-gray-800">
            <CardContent className="p-2 sm:p-3">
              {/* Mobil Toolbar */}
              <div className="flex flex-col gap-2 sm:hidden">
                <div className="grid grid-cols-3 gap-2">
                  <Button 
                    variant="outline" 
                    className="flex flex-col items-center justify-center py-3 h-auto gap-1 bg-gradient-to-b from-background to-muted shadow-md active:shadow-sm active:translate-y-[2px] transition-all border-b-4 active:border-b-0"
                    onClick={() => document.getElementById('add-pdf')?.click()}
                  >
                    <Plus className="w-5 h-5 text-primary" />
                    <span className="text-[11px] font-bold">PDF Ekle</span>
                  </Button>
                  <input
                    id="add-pdf"
                    type="file"
                    accept=".pdf"
                    multiple
                    className="hidden"
                    onChange={(e) => e.target.files && handleFilesDrop(e.target.files)}
                  />
                  
                  <Button 
                    variant="outline" 
                    className="flex flex-col items-center justify-center py-3 h-auto gap-1 bg-gradient-to-b from-background to-muted shadow-md active:shadow-sm active:translate-y-[2px] transition-all border-b-4 active:border-b-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      rotateAllPages();
                    }}
                  >
                    <RotateCw className="w-5 h-5 text-blue-600" />
                    <span className="text-[11px] font-bold">Tümünü Çevir</span>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="flex flex-col items-center justify-center py-3 h-auto gap-1 bg-gradient-to-b from-red-50 to-red-100 dark:from-red-950 dark:to-red-900 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800 shadow-md active:shadow-sm active:translate-y-[2px] transition-all border-b-4 active:border-b-0"
                    onClick={handleClear}
                  >
                    <X className="w-5 h-5" />
                    <span className="text-[11px] font-bold">Temizle</span>
                  </Button>
                </div>
                
                <div className="flex items-center justify-between px-3 py-2 bg-muted rounded-lg border-2 shadow-inner">
                  <span className="text-xs text-muted-foreground font-bold">
                    Toplam {pages.length} sayfa
                  </span>
                  <Button 
                    onClick={handleExport} 
                    disabled={processing} 
                    size="sm"
                    className="h-9 px-6 bg-gradient-to-b from-primary to-primary/90 text-primary-foreground shadow-lg active:shadow active:translate-y-[2px] transition-all border-b-4 active:border-b-0 border-primary/50 font-bold"
                  >
                    {processing ? (
                      <span className="text-xs">İşleniyor...</span>
                    ) : (
                      <>
                        <Download className="w-4 h-4 mr-2" />
                        <span className="text-xs font-bold">İndir</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Masaüstü Toolbar - 3D Efektler */}
              <div className="hidden sm:flex sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => document.getElementById('add-pdf')?.click()}
                    className="gap-2 h-10 px-4 bg-gradient-to-b from-background to-muted shadow-md hover:shadow-lg active:shadow-sm active:translate-y-[2px] transition-all border-b-4 active:border-b-0 font-bold"
                  >
                    <Plus className="w-4 h-4 text-primary" />
                    PDF Ekle
                  </Button>
                  <input
                    id="add-pdf"
                    type="file"
                    accept=".pdf"
                    multiple
                    className="hidden"
                    onChange={(e) => e.target.files && handleFilesDrop(e.target.files)}
                  />
                  
                  <div className="h-8 w-1 bg-gradient-to-b from-transparent via-border to-transparent" />
                  
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      rotateAllPages();
                    }}
                    className="gap-2 h-10 px-4 bg-gradient-to-b from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800 shadow-md hover:shadow-lg active:shadow-sm active:translate-y-[2px] transition-all border-b-4 active:border-b-0 font-bold"
                  >
                    <RotateCw className="w-4 h-4" />
                    Tümünü Döndür
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleClear}
                    className="gap-2 h-10 px-4 bg-gradient-to-b from-red-50 to-red-100 dark:from-red-950 dark:to-red-900 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800 shadow-md hover:shadow-lg active:shadow-sm active:translate-y-[2px] transition-all border-b-4 active:border-b-0 font-bold"
                  >
                    <X className="w-4 h-4" />
                    Temizle
                  </Button>
                </div>

                <div className="flex items-center gap-3 bg-gradient-to-b from-muted to-muted/80 px-4 py-2 rounded-lg border-2 shadow-inner">
                  <span className="text-sm text-muted-foreground whitespace-nowrap font-bold">
                    {pages.length} sayfa
                  </span>
                  <div className="h-6 w-px bg-gradient-to-b from-transparent via-border to-transparent" />
                  <Button 
                    onClick={handleExport} 
                    disabled={processing} 
                    size="sm"
                    className="h-9 gap-2 font-bold bg-gradient-to-b from-primary to-primary/90 text-primary-foreground shadow-lg hover:shadow-xl active:shadow active:translate-y-[2px] transition-all border-b-4 active:border-b-0 border-primary/50 px-6"
                  >
                    <Download className="w-4 h-4" />
                    {processing ? 'İşleniyor...' : 'İndir'}
                  </Button>
                </div>
              </div>
              
              {processing && (
                <div className="mt-3">
                  <ProgressBar progress={progress} label="PDF oluşturuluyor..." />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Ana İçerik Grid - KÜÇÜLTÜLMÜŞ THUMBNAIL'LER */}
          <div className="flex-1 grid grid-cols-[90px_1fr] sm:grid-cols-[140px_1fr] lg:grid-cols-[160px_1fr] gap-3 min-h-0">
            
            {/* Sol: Thumbnail Listesi - Daha küçük */}
            <Card className="h-full overflow-hidden flex flex-col shadow-lg border-b-4 border-b-gray-200 dark:border-b-gray-800">
              <CardContent className="p-2 sm:p-2 flex flex-col h-full">
                <h3 className="font-bold mb-2 text-xs shrink-0 text-center sm:text-left border-b pb-1 flex items-center justify-center sm:justify-start gap-1">
                  <GripVertical className="w-3 h-3 text-muted-foreground" />
                  Sayfalar
                </h3>
                <div 
                  ref={thumbnailScrollRef}
                  className="flex-1 flex flex-col gap-1.5 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 pr-0.5 select-none touch-none"
                >
                  {pages.map((page, index) => (
                    <div
                      key={page.id}
                      onClick={() => !isDragging && !isLongPress.current && setSelectedPage(index)}
                      onMouseDown={(e) => handleTouchStart(e, index)}
                      onMouseMove={handleTouchMove}
                      onMouseUp={handleTouchEnd}
                      onMouseLeave={(e) => {
                        if (isDragging) handleTouchEnd(e);
                      }}
                      onTouchStart={(e) => handleTouchStart(e, index)}
                      onTouchMove={handleTouchMove}
                      onTouchEnd={handleTouchEnd}
                      draggable={true}
                      onDragStart={(e) => handleDragStart(e, index)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDrop={(e) => handleDrop(e, index)}
                      onDragEnd={() => {
                        setDraggedIndex(null);
                        setDragOverIndex(null);
                        setIsDragging(false);
                      }}
                      className={cn(
                        'relative group cursor-grab active:cursor-grabbing rounded-lg border-2 transition-all flex-shrink-0 overflow-hidden select-none',
                        'shadow-sm hover:shadow-md active:shadow-sm active:translate-y-[1px]',
                        draggedIndex === index && 'opacity-40 scale-95 rotate-1 shadow-xl z-50',
                        dragOverIndex === index && draggedIndex !== index && 'border-primary ring-2 ring-primary/20 scale-[1.03] bg-primary/5',
                        selectedPage === index && !isDragging
                          ? 'border-primary bg-primary/5 shadow-md' 
                          : 'border-transparent bg-muted/50 hover:bg-muted'
                      )}
                    >
                      {/* Thumbnail Görseli - Daha kompakt */}
                      <div className="w-full aspect-[210/297] relative overflow-hidden rounded-md bg-white pointer-events-none">
                        <img
                          src={page.thumbnail}
                          alt={`Sayfa ${index + 1}`}
                          className="w-full h-full object-contain"
                          style={{ 
                            transform: `rotate(${page.rotation}deg)`,
                            pointerEvents: 'none'
                          }}
                          draggable={false}
                        />
                        
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent text-white text-[8px] sm:text-[10px] text-center py-0.5 font-bold">
                          {index + 1}
                        </div>

                        {selectedPage === index && !isDragging && (
                          <div className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full border border-white shadow-sm" />
                        )}
                        
                        {/* Drag indicator overlay */}
                        {draggedIndex === index && (
                          <div className="absolute inset-0 bg-primary/30 flex items-center justify-center">
                            <span className="bg-primary text-white text-[8px] font-bold px-1.5 py-0.5 rounded shadow">
                              Sürükleniyor
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Sağ: Ana Görüntüleyici - 3D Butonlar */}
            <Card className="h-full overflow-hidden flex flex-col shadow-lg border-b-4 border-b-gray-200 dark:border-b-gray-800">
              <CardContent className="p-2 sm:p-4 h-full flex flex-col">
                {selectedPage !== null ? (
                  <div className="flex flex-col h-full gap-3">
                    {/* Toolbar: Gezinme + İşlemler - 3D */}
                    <div className="flex items-center justify-between shrink-0 px-3 py-3 bg-gradient-to-b from-muted to-muted/80 rounded-xl border-2 shadow-inner">
                      {/* Sol: Sayfa Gezinme */}
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-10 w-10 bg-gradient-to-b from-background to-muted shadow-md active:shadow-sm active:translate-y-[2px] active:border-b-0 border-b-4 transition-all"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedPage(Math.max(0, selectedPage - 1));
                          }}
                          disabled={selectedPage === 0}
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </Button>
                        <span className="text-sm font-bold min-w-[80px] text-center bg-background rounded-lg border-2 shadow-inner px-3 py-2">
                          {selectedPage + 1} / {pages.length}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-10 w-10 bg-gradient-to-b from-background to-muted shadow-md active:shadow-sm active:translate-y-[2px] active:border-b-0 border-b-4 transition-all"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedPage(Math.min(pages.length - 1, selectedPage + 1));
                          }}
                          disabled={selectedPage === pages.length - 1}
                        >
                          <ChevronRight className="w-5 h-5" />
                        </Button>
                      </div>

                      {/* Sağ: Sayfa İşlemleri - 3D */}
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-10 w-10 bg-gradient-to-b from-background to-muted shadow-md active:shadow-sm active:translate-y-[2px] active:border-b-0 border-b-4 transition-all disabled:opacity-50"
                          onClick={(e) => {
                            e.stopPropagation();
                            movePage(selectedPage, selectedPage - 1);
                          }}
                          disabled={selectedPage === 0}
                          title="Yukarı taşı"
                        >
                          <ArrowUp className="w-5 h-5" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-10 w-10 bg-gradient-to-b from-background to-muted shadow-md active:shadow-sm active:translate-y-[2px] active:border-b-0 border-b-4 transition-all disabled:opacity-50"
                          onClick={(e) => {
                            e.stopPropagation();
                            movePage(selectedPage, selectedPage + 1);
                          }}
                          disabled={selectedPage === pages.length - 1}
                          title="Aşağı taşı"
                        >
                          <ArrowDown className="w-5 h-5" />
                        </Button>
                        <div className="w-1 h-8 bg-gradient-to-b from-transparent via-border to-transparent" />
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-10 w-10 bg-gradient-to-b from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800 shadow-md active:shadow-sm active:translate-y-[2px] active:border-b-0 border-b-4 transition-all hover:from-blue-100 hover:to-blue-200"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (selectedPage !== null) {
                              rotatePage(selectedPage);
                            }
                          }}
                          title="Saat yönünde 90° döndür"
                        >
                          <RotateCw className="w-5 h-5" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-10 w-10 bg-gradient-to-b from-red-50 to-red-100 dark:from-red-950 dark:to-red-900 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800 shadow-md active:shadow-sm active:translate-y-[2px] active:border-b-0 border-b-4 transition-all hover:from-red-100 hover:to-red-200"
                          onClick={(e) => {
                            e.stopPropagation();
                            removePage(selectedPage);
                          }}
                          title="Sayfayı sil"
                        >
                          <Trash2 className="w-5 h-5" />
                        </Button>
                      </div>
                    </div>

                    {/* Canvas Container */}
                    <div className="flex-1 relative bg-gray-100 dark:bg-gray-900 rounded-xl overflow-hidden flex items-center justify-center min-h-0 shadow-inner border-2 border-gray-200 dark:border-gray-800">
                      <canvas
                        ref={canvasRef}
                        className="max-w-full max-h-full shadow-2xl object-contain bg-white rounded-lg"
                        style={{
                          maxHeight: '95%',
                          maxWidth: '95%'
                        }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center p-6">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-b from-muted to-muted/50 flex items-center justify-center mb-4 shadow-inner border-2">
                      <FileText className="w-10 h-10 sm:w-12 sm:h-12 text-muted-foreground/50" />
                    </div>
                    <p className="text-muted-foreground text-sm sm:text-base font-bold">
                      Görüntülemek için bir sayfa seçin
                    </p>
                    <p className="text-xs text-muted-foreground/70 mt-2 font-medium">
                      Soldaki listeden sayfa sürükleyerek sıralayabilirsiniz
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};