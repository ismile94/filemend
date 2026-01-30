import { useState, useRef, useCallback } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL } from '@ffmpeg/util';

export const useFFmpeg = () => {
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const ffmpegRef = useRef<FFmpeg | null>(null);

  const loadFFmpeg = useCallback(async () => {
    if (loaded || loading) return;
    
    setLoading(true);
    try {
      const ffmpeg = new FFmpeg();
      
      ffmpeg.on('progress', ({ progress }) => {
        setProgress(Math.round(progress * 100));
      });

      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
      await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      });

      ffmpegRef.current = ffmpeg;
      setLoaded(true);
    } catch (error) {
      console.error('FFmpeg loading error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [loaded, loading]);

  const convertAudio = useCallback(async (
    inputFile: File,
    outputFormat: string,
    outputCodec: string
  ): Promise<Blob> => {
    if (!ffmpegRef.current || !loaded) {
      throw new Error('FFmpeg not loaded');
    }

    const ffmpeg = ffmpegRef.current;
    const inputName = `input.${inputFile.name.split('.').pop()}`;
    const outputName = `output.${outputFormat}`;

    // Write input file
    const inputData = await inputFile.arrayBuffer();
    await ffmpeg.writeFile(inputName, new Uint8Array(inputData));

    // Convert
    await ffmpeg.exec([
      '-i', inputName,
      '-c:a', outputCodec,
      '-q:a', '2',
      outputName
    ]);

    // Read output file
    const outputData = await ffmpeg.readFile(outputName);
    const blob = new Blob([outputData as unknown as BlobPart], { type: `audio/${outputFormat}` });

    // Cleanup
    await ffmpeg.deleteFile(inputName);
    await ffmpeg.deleteFile(outputName);

    return blob;
  }, [loaded]);

  const trimAudio = useCallback(async (
    inputFile: File,
    startTime: number,
    endTime: number,
    outputFormat: string
  ): Promise<Blob> => {
    if (!ffmpegRef.current || !loaded) {
      throw new Error('FFmpeg not loaded');
    }

    const ffmpeg = ffmpegRef.current;
    const inputName = `input.${inputFile.name.split('.').pop()}`;
    const outputName = `output.${outputFormat}`;

    const inputData = await inputFile.arrayBuffer();
    await ffmpeg.writeFile(inputName, new Uint8Array(inputData));

    const duration = endTime - startTime;
    
    await ffmpeg.exec([
      '-i', inputName,
      '-ss', startTime.toString(),
      '-t', duration.toString(),
      '-c', 'copy',
      outputName
    ]);

    const outputData = await ffmpeg.readFile(outputName);
    const blob = new Blob([outputData as unknown as BlobPart], { type: `audio/${outputFormat}` });

    await ffmpeg.deleteFile(inputName);
    await ffmpeg.deleteFile(outputName);

    return blob;
  }, [loaded]);

  const mergeAudio = useCallback(async (
    inputFiles: File[],
    outputFormat: string
  ): Promise<Blob> => {
    if (!ffmpegRef.current || !loaded) {
      throw new Error('FFmpeg not loaded');
    }

    const ffmpeg = ffmpegRef.current;
    const inputNames: string[] = [];

    // Write all input files
    for (let i = 0; i < inputFiles.length; i++) {
      const ext = inputFiles[i].name.split('.').pop();
      const inputName = `input${i}.${ext}`;
      inputNames.push(inputName);
      
      const inputData = await inputFiles[i].arrayBuffer();
      await ffmpeg.writeFile(inputName, new Uint8Array(inputData));
    }

    // Create concat list
    const concatList = inputNames.map(name => `file '${name}'`).join('\n');
    await ffmpeg.writeFile('concat_list.txt', concatList);

    const outputName = `output.${outputFormat}`;

    // Merge using concat demuxer
    await ffmpeg.exec([
      '-f', 'concat',
      '-safe', '0',
      '-i', 'concat_list.txt',
      '-c', 'copy',
      outputName
    ]);

    const outputData = await ffmpeg.readFile(outputName);
    const blob = new Blob([outputData as unknown as BlobPart], { type: `audio/${outputFormat}` });

    // Cleanup
    for (const name of inputNames) {
      await ffmpeg.deleteFile(name);
    }
    await ffmpeg.deleteFile('concat_list.txt');
    await ffmpeg.deleteFile(outputName);

    return blob;
  }, [loaded]);

  return {
    loaded,
    loading,
    progress,
    loadFFmpeg,
    convertAudio,
    trimAudio,
    mergeAudio,
  };
};
