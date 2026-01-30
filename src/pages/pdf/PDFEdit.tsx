'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { 
  FileEdit, 
  Download, 
  FileText, 
  Trash2, 
  RotateCw,
  Plus,
  X,
  ChevronLeft,
  ChevronRight,
  GripHorizontal
} from 'lucide-react';
import { FileDropzone } from '@/components/FileDropzone';
import { ProgressBar } from '@/components/ProgressBar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocument, degrees } from 'pdf-lib';

// Dnd Kit imports
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  defaultDropAnimationSideEffects,
  type DragEndEvent,
  type DragStartEvent,
  TouchSensor,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// PDF.js worker
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

// ==================== SortablePageItem Bileşeni ====================
interface SortablePageProps {
  page: PDFPage;
  index: number;
  selected: boolean;
  onSelect: (index: number) => void;
  onRotate: (index: number) => void;
  onRemove: (index: number) => void;
}

const SortablePageItem = ({ 
  page, 
  index, 
  selected, 
  onSelect, 
  onRotate, 
  onRemove 
}: SortablePageProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: page.id,
    transition: {
      duration: 150,
      easing: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group relative flex flex-col gap-2 p-3 rounded-xl border-2 bg-white dark:bg-gray-900 cursor-grab active:cursor-grabbing transition-all duration-200',
        selected 
          ? 'border-primary ring-2 ring-primary/20 shadow-md' 
          : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700',
        isDragging && 'opacity-50 scale-105 rotate-2 shadow-2xl ring-2 ring-primary',
        !isDragging && 'hover:shadow-lg hover:-translate-y-1'
      )}
    >
      {/* Toolbar - Üst kısım (Sürükleme ve İşlemler) */}
      <div className="flex items-center justify-between gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
        <div 
          {...attributes} 
          {...listeners}
          className="p-1.5 rounded-md bg-muted hover:bg-muted-foreground/20 cursor-grab active:cursor-grabbing touch-none"
        >
          <GripHorizontal className="w-3 h-3 text-muted-foreground" />
        </div>
        <span className="text-[10px] font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
          {index + 1}
        </span>
        <button
          onClick={(e: React.MouseEvent) => {
            e.stopPropagation();
            onRemove(index);
          }}
          className="p-1.5 rounded-md hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 transition-colors"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>

      {/* Thumbnail Container */}
      <div 
        className="relative aspect-[210/297] w-full overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
        onClick={() => onSelect(index)}
      >
        <img
          src={page.thumbnail}
          alt={`Sayfa ${index + 1}`}
          className="w-full h-full object-contain pointer-events-none transition-transform duration-300"
          style={{ 
            transform: `rotate(${page.rotation}deg) scale(1.1)`,
          }}
          draggable={false}
        />
        
        {/* Seçim İndikatörü */}
        {selected && (
          <div className="absolute inset-0 bg-primary/10 pointer-events-none flex items-center justify-center">
            <div className="bg-primary text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
              Seçili
            </div>
          </div>
        )}
      </div>

      {/* Alt Butonlar */}
      <div className="flex items-center justify-between gap-2">
        <button
          onClick={(e: React.MouseEvent) => {
            e.stopPropagation();
            onRotate(index);
          }}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-xs font-semibold text-gray-700 dark:text-gray-300 transition-colors active:scale-95"
        >
          <RotateCw className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Döndür</span>
        </button>
      </div>
    </div>
  );
};

// ==================== Ana PDFEdit Bileşeni ====================
export const PDFEdit = () => {
  const [files, setFiles] = useState<PDFFile[]>([]);
  const [pages, setPages] = useState<PDFPage[]>([]);
  const [selectedPage, setSelectedPage] = useState<number | null>(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [activeId, setActiveId] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();

  // Dnd Kit Sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: (_, { context }) => {
        const { active, over } = context;
        if (!active || !over) return { x: 0, y: 0 };
        
        const index = pages.findIndex(p => p.id === active.id);
        if (index === -1) return { x: 0, y: 0 };
        
        const column = index % 4;
        const row = Math.floor(index / 4);
        return { x: column * 200, y: row * 250 };
      },
    })
  );

  const renderPageThumbnail = async (pdf: pdfjsLib.PDFDocumentProxy, pageNum: number): Promise<{url: string, width: number, height: number}> => {
    const page = await pdf.getPage(pageNum);
    const scale = 0.5;
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
            id: `pdf-${currentFileCount + i}-page-${pageNum}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
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
        description: 'PDF yüklenirken hata oluştu.',
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
      setSelectedPage(prev => (prev !== null ? prev - 1 : null));
    }
  }, [selectedPage]);

  const movePage = useCallback((oldIndex: number, newIndex: number) => {
    setPages(prev => arrayMove(prev, oldIndex, newIndex));
    
    if (selectedPage === oldIndex) {
      setSelectedPage(newIndex);
    } else if (selectedPage !== null) {
      if (oldIndex < newIndex && selectedPage > oldIndex && selectedPage <= newIndex) {
        setSelectedPage(selectedPage - 1);
      } else if (oldIndex > newIndex && selectedPage < oldIndex && selectedPage >= newIndex) {
        setSelectedPage(selectedPage + 1);
      }
    }
  }, [selectedPage]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = pages.findIndex(p => p.id === active.id);
      const newIndex = pages.findIndex(p => p.id === over.id);
      
      movePage(oldIndex, newIndex);
    }
    setActiveId(null);
  };

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
      toast({ title: 'Hata', description: 'PDF dışa aktarılırken hata oluştu.', variant: 'destructive' });
    } finally {
      setProcessing(false);
      setProgress(0);
    }
  }, [pages, files, toast]);

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

  const activePage = activeId ? pages.find(p => p.id === activeId) : null;

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl min-h-[calc(100vh-4rem)] flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
            <div className="p-2 bg-red-500 rounded-lg shadow-lg">
              <FileEdit className="w-6 h-6 text-white" />
            </div>
            PDF Düzenle
          </h1>
          <p className="text-muted-foreground mt-2">
            Sayfaları sürükleyip bırakarak yeniden sıralayın, döndürün ve düzenleyin.
          </p>
        </div>
        
        {pages.length > 0 && (
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              onClick={() => document.getElementById('add-pdf')?.click()}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
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
            <Button 
              onClick={handleExport} 
              disabled={processing}
              className="gap-2"
            >
              <Download className="w-4 h-4" />
              {processing ? 'İşleniyor...' : 'İndir'}
            </Button>
          </div>
        )}
      </div>

      {pages.length === 0 ? (
        <div className="flex-1 flex flex-col justify-center">
          <FileDropzone
            onFilesDrop={handleFilesDrop}
            onClear={handleClear}
            accept=".pdf"
            multiple={true}
            selectedFiles={[]}
          />
          {processing && (
            <div className="mt-4">
              <ProgressBar progress={progress} label="PDF yükleniyor..." />
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-6 flex-1">
          {/* Sol Panel: Grid Görünümü */}
          <Card className="flex-1 lg:flex-[2] overflow-hidden flex flex-col shadow-lg">
            <CardContent className="p-4 flex flex-col h-full">
              {/* Toolbar */}
              <div className="flex items-center justify-between mb-4 pb-4 border-b">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-muted-foreground">
                    {pages.length} Sayfa
                  </span>
                  <div className="h-4 w-px bg-border mx-2" />
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={rotateAllPages}
                    className="gap-2 text-xs"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                    Tümünü Döndür
                  </Button>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={handleClear}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 gap-2 text-xs"
                >
                  <X className="w-3.5 h-3.5" />
                  Temizle
                </Button>
              </div>

              {/* Drag & Drop Grid Container */}
              <div className="flex-1 overflow-y-auto pr-2 -mr-2">
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext 
                    items={pages.map(p => p.id)} 
                    strategy={rectSortingStrategy}
                  >
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {pages.map((page, index) => (
                        <SortablePageItem
                          key={page.id}
                          page={page}
                          index={index}
                          selected={selectedPage === index}
                          onSelect={setSelectedPage}
                          onRotate={rotatePage}
                          onRemove={removePage}
                        />
                      ))}
                    </div>
                  </SortableContext>

                  <DragOverlay dropAnimation={{ sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: '0.5' } } }) }}>
                    {activePage ? (
                      <div className="flex flex-col gap-2 p-3 rounded-xl border-2 border-primary bg-white dark:bg-gray-900 shadow-2xl rotate-3 scale-105 opacity-90 cursor-grabbing">
                        <div className="aspect-[210/297] w-full overflow-hidden rounded-lg bg-gray-100">
                          <img
                            src={activePage.thumbnail}
                            alt="Sürüklenen sayfa"
                            className="w-full h-full object-contain"
                            style={{ transform: `rotate(${activePage.rotation}deg)` }}
                          />
                        </div>
                        <div className="text-center text-xs font-bold text-primary">
                          Taşınıyor...
                        </div>
                      </div>
                    ) : null}
                  </DragOverlay>
                </DndContext>
              </div>

              {processing && (
                <div className="mt-4">
                  <ProgressBar progress={progress} label="PDF oluşturuluyor..." />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Sağ Panel: Önizleme */}
          <Card className="lg:w-[400px] xl:w-[450px] flex flex-col shadow-lg">
            <CardContent className="p-4 flex flex-col h-full">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Sayfa Önizleme
              </h3>
              
              {selectedPage !== null ? (
                <div className="flex flex-col h-full gap-4">
                  <div className="flex items-center justify-between bg-muted rounded-lg p-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setSelectedPage(Math.max(0, selectedPage - 1))}
                      disabled={selectedPage === 0}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="text-sm font-medium">
                      {selectedPage + 1} / {pages.length}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setSelectedPage(Math.min(pages.length - 1, selectedPage + 1))}
                      disabled={selectedPage === pages.length - 1}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="flex-1 bg-gray-100 dark:bg-gray-900 rounded-lg overflow-hidden flex items-center justify-center min-h-[400px] border border-gray-200 dark:border-gray-800">
                    <canvas
                      ref={canvasRef}
                      className="max-w-full max-h-full shadow-lg bg-white rounded"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => rotatePage(selectedPage)}
                      className="gap-2"
                    >
                      <RotateCw className="w-4 h-4" />
                      90° Döndür
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removePage(selectedPage)}
                      className="gap-2 text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                      Sayfayı Sil
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-muted-foreground">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                    <FileText className="w-8 h-8 opacity-50" />
                  </div>
                  <p className="font-medium">Görüntülemek için bir sayfa seçin</p>
                  <p className="text-sm mt-2 opacity-70">
                    Soldaki listeden bir sayfa seçerek detayları görüntüleyebilirsiniz
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
