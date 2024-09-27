

import { useState, useCallback, useRef, useEffect } from 'react';

export const useAudioVisualization = () => {
  const [waveformData, setWaveformData] = useState<number[]>(new Array(50).fill(0));
  const animationFrameRef = useRef<number>();
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const startVisualization = useCallback((stream: MediaStreamTrack) => {
    console.log("Starting visualization with stream:", stream);

    if (!audioContextRef.current) {
      debugger
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const audioContext = audioContextRef.current;

    const source = audioContext.createMediaStreamSource(new MediaStream([stream]));
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);
    analyserRef.current = analyser;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const updateWaveform = () => {
      analyser.getByteTimeDomainData(dataArray);
      const normalizedData = Array.from(dataArray).map(value => Math.abs((value - 128) / 128));
      
      console.log("Raw data sample:", dataArray.slice(0, 5));
      console.log("Normalized data sample:", normalizedData.slice(0, 5));

      setWaveformData(normalizedData.slice(0, 50));
      animationFrameRef.current = requestAnimationFrame(updateWaveform);
    };

    updateWaveform();
  }, []);

  const stopVisualization = useCallback(() => {
    console.log("Stopping visualization");
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (analyserRef.current) {
      analyserRef.current.disconnect();
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      stopVisualization();
    };
  }, [stopVisualization]);

  return { waveformData, startVisualization, stopVisualization };
};