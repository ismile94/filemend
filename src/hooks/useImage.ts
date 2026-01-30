import { useState, useCallback } from 'react';
import Compressor from 'compressorjs';
import { readFileAsDataURL } from '@/utils/fileHelpers';

export const useImage = () => {
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const compressImage = useCallback((
    file: File,
    quality: number = 0.8,
    maxWidth?: number,
    maxHeight?: number
  ): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      setProcessing(true);
      setProgress(0);

      const options: Compressor.Options = {
        quality,
        maxWidth,
        maxHeight,
        success(result) {
          setProgress(100);
          setProcessing(false);
          resolve(result);
        },
        error(err) {
          setProcessing(false);
          reject(err);
        },
      };

      new Compressor(file, options);
    });
  }, []);

  const convertImage = useCallback(async (
    file: File,
    outputFormat: string,
    quality: number = 0.9
  ): Promise<Blob> => {
    setProcessing(true);
    setProgress(0);

    try {
      const dataUrl = await readFileAsDataURL(file);
      
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Could not get canvas context'));
            return;
          }

          // Fill white background for formats that don't support transparency
          if (outputFormat === 'jpeg' || outputFormat === 'jpg') {
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
          }

          ctx.drawImage(img, 0, 0);

          const mimeType = `image/${outputFormat === 'jpg' ? 'jpeg' : outputFormat}`;
          
          canvas.toBlob(
            (blob) => {
              if (blob) {
                setProgress(100);
                resolve(blob);
              } else {
                reject(new Error('Conversion failed'));
              }
            },
            mimeType,
            quality
          );
        };
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = dataUrl;
      });
    } finally {
      setProcessing(false);
    }
  }, []);

  const resizeImage = useCallback(async (
    file: File,
    width: number,
    height: number,
    maintainAspectRatio: boolean = true
  ): Promise<Blob> => {
    setProcessing(true);
    setProgress(0);

    try {
      const dataUrl = await readFileAsDataURL(file);
      
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          let targetWidth = width;
          let targetHeight = height;

          if (maintainAspectRatio) {
            const aspectRatio = img.width / img.height;
            if (width / height > aspectRatio) {
              targetWidth = height * aspectRatio;
            } else {
              targetHeight = width / aspectRatio;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = targetWidth;
          canvas.height = targetHeight;
          
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Could not get canvas context'));
            return;
          }

          ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

          const mimeType = file.type || 'image/jpeg';
          
          canvas.toBlob(
            (blob) => {
              if (blob) {
                setProgress(100);
                resolve(blob);
              } else {
                reject(new Error('Resize failed'));
              }
            },
            mimeType,
            0.9
          );
        };
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = dataUrl;
      });
    } finally {
      setProcessing(false);
    }
  }, []);

  const rotateImage = useCallback(async (
    file: File,
    degrees: 90 | 180 | 270
  ): Promise<Blob> => {
    setProcessing(true);
    setProgress(0);

    try {
      const dataUrl = await readFileAsDataURL(file);
      
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          
          if (degrees === 90 || degrees === 270) {
            canvas.width = img.height;
            canvas.height = img.width;
          } else {
            canvas.width = img.width;
            canvas.height = img.height;
          }
          
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Could not get canvas context'));
            return;
          }

          ctx.translate(canvas.width / 2, canvas.height / 2);
          ctx.rotate((degrees * Math.PI) / 180);
          ctx.drawImage(img, -img.width / 2, -img.height / 2);

          const mimeType = file.type || 'image/jpeg';
          
          canvas.toBlob(
            (blob) => {
              if (blob) {
                setProgress(100);
                resolve(blob);
              } else {
                reject(new Error('Rotation failed'));
              }
            },
            mimeType,
            0.9
          );
        };
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = dataUrl;
      });
    } finally {
      setProcessing(false);
    }
  }, []);

  return {
    processing,
    progress,
    compressImage,
    convertImage,
    resizeImage,
    rotateImage,
  };
};
