import React, { useEffect, useRef, useState } from 'react';

interface LazySectionProps {
  children: React.ReactNode;
  minHeight?: number;
  className?: string;
  rootMargin?: string;
  threshold?: number;
}

export const LazySection: React.FC<LazySectionProps> = ({
  children,
  minHeight = 400,
  className = '',
  rootMargin = '200px',
  threshold = 0.01,
}) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (visible) return;
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            // Defer actual render slightly to allow main thread free time
            if ('requestIdleCallback' in window) {
              (window as any).requestIdleCallback(() => setVisible(true), { timeout: 150 });
            } else {
              setTimeout(() => setVisible(true), 50);
            }
            observer.disconnect();
          }
        });
      },
      { rootMargin, threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [visible, rootMargin, threshold]);

  return (
    <div ref={ref} className={className}>
      {visible ? (
        children
      ) : (
        <div style={{ minHeight }} className="animate-pulse flex items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-200 to-blue-300" />
        </div>
      )}
    </div>
  );
};

export default LazySection;