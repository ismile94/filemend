// File types
export type FileCategory = 'pdf' | 'audio' | 'image' | 'all';

export interface ProcessedFile {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  preview?: string;
  progress: number;
  status: 'pending' | 'processing' | 'completed' | 'error';
  result?: Blob;
  errorMessage?: string;
}

// PDF Tool Types
export type PDFTool = 'merge' | 'split' | 'compress' | 'rotate' | 'extract';

export interface PDFPage {
  pageNumber: number;
  selected: boolean;
  rotated: number;
}

// Audio Tool Types
export type AudioTool = 'convert' | 'trim' | 'merge' | 'compress';

export interface AudioFormat {
  format: string;
  codec: string;
  extension: string;
}

export const AUDIO_FORMATS: AudioFormat[] = [
  { format: 'MP3', codec: 'libmp3lame', extension: 'mp3' },
  { format: 'WAV', codec: 'pcm_s16le', extension: 'wav' },
  { format: 'FLAC', codec: 'flac', extension: 'flac' },
  { format: 'OGG', codec: 'libvorbis', extension: 'ogg' },
  { format: 'AAC', codec: 'aac', extension: 'aac' },
  { format: 'M4A', codec: 'aac', extension: 'm4a' },
];

// Image Tool Types
export type ImageTool = 'compress' | 'convert' | 'resize' | 'rotate';

export interface ImageFormat {
  format: string;
  mimeType: string;
  extension: string;
}

export const IMAGE_FORMATS: ImageFormat[] = [
  { format: 'JPEG', mimeType: 'image/jpeg', extension: 'jpg' },
  { format: 'PNG', mimeType: 'image/png', extension: 'png' },
  { format: 'WebP', mimeType: 'image/webp', extension: 'webp' },
  { format: 'GIF', mimeType: 'image/gif', extension: 'gif' },
];

// Tool Category
export interface ToolCategory {
  id: string;
  title: string;
  description: string;
  icon: string;
  tools: Tool[];
}

export interface Tool {
  id: string;
  title: string;
  description: string;
  icon: string;
  path: string;
  acceptedTypes: string;
  multiple: boolean;
}
