import { useEffect } from 'react';

export default function useWindowResize(
  callback: (windowSize: { width: number; height: number }) => void,
  {
    minWidth,
    minHeight,
    maxWidth,
    maxHeight,
  }: {
    minWidth: number;
    minHeight: number;
    maxWidth: number;
    maxHeight: number;
  },
) {
  useEffect(() => {
    function handleResize() {
      const width = Math.min(Math.max(window.innerWidth, minWidth), maxWidth);
      const height = Math.min(
        Math.max(window.innerHeight, minHeight),
        maxHeight,
      );
      callback({ width, height });
    }

    window.addEventListener('resize', handleResize);
    handleResize(); // 초기 실행

    return () => window.removeEventListener('resize', handleResize);
  }, [callback, minWidth, minHeight, maxWidth, maxHeight]);
}
