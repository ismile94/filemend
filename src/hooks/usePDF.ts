import { useState, useCallback } from 'react';
import { PDFDocument, degrees } from 'pdf-lib';
import { readFileAsArrayBuffer } from '@/utils/fileHelpers';

export const usePDF = () => {
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const mergePDFs = useCallback(async (files: File[]): Promise<Blob> => {
    setProcessing(true);
    setProgress(0);
    
    try {
      const mergedPdf = await PDFDocument.create();
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const pdfBytes = await readFileAsArrayBuffer(file);
        const pdf = await PDFDocument.load(pdfBytes);
        const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        
        pages.forEach(page => mergedPdf.addPage(page));
        setProgress(Math.round(((i + 1) / files.length) * 100));
      }

      const mergedPdfBytes = await mergedPdf.save();
      return new Blob([mergedPdfBytes as unknown as BlobPart], { type: 'application/pdf' });
    } finally {
      setProcessing(false);
    }
  }, []);

  const splitPDF = useCallback(async (
    file: File,
    pageRanges: { start: number; end: number }[]
  ): Promise<Blob[]> => {
    setProcessing(true);
    setProgress(0);
    
    try {
      const pdfBytes = await readFileAsArrayBuffer(file);
      const pdf = await PDFDocument.load(pdfBytes);
      const results: Blob[] = [];

      for (let i = 0; i < pageRanges.length; i++) {
        const { start, end } = pageRanges[i];
        const newPdf = await PDFDocument.create();
        
        const pageIndices = [];
        for (let p = start - 1; p < end; p++) {
          pageIndices.push(p);
        }
        
        const pages = await newPdf.copyPages(pdf, pageIndices);
        pages.forEach(page => newPdf.addPage(page));
        
        const newPdfBytes = await newPdf.save();
        results.push(new Blob([newPdfBytes as unknown as BlobPart], { type: 'application/pdf' }));
        
        setProgress(Math.round(((i + 1) / pageRanges.length) * 100));
      }

      return results;
    } finally {
      setProcessing(false);
    }
  }, []);

  const compressPDF = useCallback(async (file: File): Promise<Blob> => {
    setProcessing(true);
    setProgress(0);
    
    try {
      const pdfBytes = await readFileAsArrayBuffer(file);
      const pdf = await PDFDocument.load(pdfBytes, {
        updateMetadata: false,
      });

      // Compress by saving with optimization
      const compressedBytes = await pdf.save({
        useObjectStreams: true,
        addDefaultPage: false,
      });

      setProgress(100);
      return new Blob([compressedBytes as unknown as BlobPart], { type: 'application/pdf' });
    } finally {
      setProcessing(false);
    }
  }, []);

  const rotatePDF = useCallback(async (
    file: File,
    rotation: 0 | 90 | 180 | 270,
    pageNumbers?: number[]
  ): Promise<Blob> => {
    setProcessing(true);
    setProgress(0);
    
    try {
      const pdfBytes = await readFileAsArrayBuffer(file);
      const pdf = await PDFDocument.load(pdfBytes);
      const pages = pdf.getPages();

      pages.forEach((page, index) => {
        if (!pageNumbers || pageNumbers.includes(index + 1)) {
          page.setRotation(degrees(rotation));
        }
      });

      const rotatedBytes = await pdf.save();
      setProgress(100);
      return new Blob([rotatedBytes as unknown as BlobPart], { type: 'application/pdf' });
    } finally {
      setProcessing(false);
    }
  }, []);

  const extractPages = useCallback(async (
    file: File,
    pageNumbers: number[]
  ): Promise<Blob> => {
    setProcessing(true);
    setProgress(0);
    
    try {
      const pdfBytes = await readFileAsArrayBuffer(file);
      const pdf = await PDFDocument.load(pdfBytes);
      const newPdf = await PDFDocument.create();

      const pageIndices = pageNumbers.map(n => n - 1);
      const pages = await newPdf.copyPages(pdf, pageIndices);
      pages.forEach(page => newPdf.addPage(page));

      const extractedBytes = await newPdf.save();
      setProgress(100);
      return new Blob([extractedBytes as unknown as BlobPart], { type: 'application/pdf' });
    } finally {
      setProcessing(false);
    }
  }, []);

  const getPageCount = useCallback(async (file: File): Promise<number> => {
    const pdfBytes = await readFileAsArrayBuffer(file);
    const pdf = await PDFDocument.load(pdfBytes);
    return pdf.getPageCount();
  }, []);

  return {
    processing,
    progress,
    mergePDFs,
    splitPDF,
    compressPDF,
    rotatePDF,
    extractPages,
    getPageCount,
  };
};
