import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface CustomCursorProps {
  enabled: boolean;
}

export const CustomCursor: React.FC<CustomCursorProps> = ({ enabled }) => {
  const [mousePosition, setMousePosition] = useState({ x: -100, y: -100 });
  const [isHovering, setIsHovering] = useState(false);
  const [isMouseDown, setIsMouseDown] = useState(false);

  useEffect(() => {
    if (!enabled) return;

    const onMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });

      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'BUTTON' ||
          target.tagName === 'A' ||
          target.tagName === 'INPUT' ||
          target.closest('button') ||
          target.closest('a') ||
          target.classList.contains('interactive'))
      ) {
        setIsHovering(true);
      } else {
        setIsHovering(false);
      }
    };

    const onMouseDown = () => setIsMouseDown(true);
    const onMouseUp = () => setIsMouseDown(false);

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <>
      {/* Outer Glow Halo */}
      <motion.div
        className="fixed top-0 left-0 w-8 h-8 pointer-events-none z-50 rounded-full border border-sky-400/50 mix-blend-screen"
        animate={{
          x: mousePosition.x - 16,
          y: mousePosition.y - 16,
          scale: isHovering ? 2 : isMouseDown ? 0.8 : 1,
          backgroundColor: isHovering ? 'rgba(56, 189, 248, 0.15)' : 'rgba(56, 189, 248, 0)',
        }}
        transition={{ type: 'spring', damping: 25, stiffness: 250, mass: 0.1 }}
      />

      {/* Center Precision Dot */}
      <motion.div
        className="fixed top-0 left-0 w-2 h-2 bg-cyan-400 rounded-full pointer-events-none z-50 shadow-[0_0_10px_#38bdf8]"
        animate={{
          x: mousePosition.x - 4,
          y: mousePosition.y - 4,
          scale: isHovering ? 0.5 : 1,
        }}
        transition={{ type: 'spring', damping: 30, stiffness: 400, mass: 0.05 }}
      />
    </>
  );
};
