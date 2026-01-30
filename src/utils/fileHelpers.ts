import type { ProcessedFile } from '@/types';

export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 15);
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const createProcessedFile = (file: File): ProcessedFile => {
  return {
    id: generateId(),
    file,
    name: file.name,
    size: file.size,
    type: file.type,
    progress: 0,
    status: 'pending',
  };
};

export const downloadBlob = (blob: Blob, filename: string): void => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const readFileAsArrayBuffer = (file: File): Promise<ArrayBuffer> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
};

export const readFileAsDataURL = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const getFileExtension = (filename: string): string => {
  return filename.split('.').pop()?.toLowerCase() || '';
};

export const isValidFileType = (file: File, acceptedTypes: string[]): boolean => {
  if (acceptedTypes.includes('*')) return true;
  
  const extension = getFileExtension(file.name);
  const mimeType = file.type.toLowerCase();
  
  return acceptedTypes.some(type => {
    const lowerType = type.toLowerCase();
    if (lowerType.includes('/')) {
      return mimeType === lowerType || mimeType.startsWith(lowerType.replace('/*', ''));
    }
    return extension === lowerType;
  });
};

export const delay = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};
