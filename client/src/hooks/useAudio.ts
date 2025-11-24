import { useEffect, useRef, useState } from 'react';

export const useAudio = (url: string, loop = true) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const audio = new Audio(url);
    audio.loop = loop;
    audio.volume = 0.3; // Volume pelan agar tidak kaget
    audioRef.current = audio;

    return () => {
      audio.pause();
      audioRef.current = null;
    };
  }, [url, loop]);

  const play = () => {
    if (audioRef.current) {
      // Browser memblokir autoplay jika belum ada interaksi user.
      // Kita catch errornya agar aplikasi tidak crash.
      audioRef.current.play()
        .then(() => setIsPlaying(true))
        .catch(e => console.warn("Autoplay blocked by browser:", e));
    }
  };

  const stop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  };

  return { play, stop, isPlaying };
};