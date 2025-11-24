import React, { useEffect } from 'react';

// Lightweight idle tasks: analytics beacon + preloading non-critical route chunks + warming testimonial images
export const IdleTasks: React.FC = () => {
  useEffect(() => {
    const run = () => {
      // Analytics: simple performance mark
      try { performance.mark('idleTasksStart'); } catch {}

      // Prefetch some secondary routes if not yet requested
      // Dynamic imports for secondary routes (correct relative paths)
      import('../../pages/public/AboutPage').catch(() => {});
      import('../../pages/public/ContactPage').catch(() => {});

      // Warm a few testimonial images (already lazy but increases cache hit later)
      const imgs = [
        'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?w=200',
        'https://images.pexels.com/photos/91227/pexels-photo-91227.jpeg?w=200',
        'https://images.pexels.com/photos/733872/pexels-photo-733872.jpeg?w=200'
      ];
      imgs.forEach(src => {
        const i = new Image();
        i.decoding = 'async';
        i.src = src;
      });
    };

    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(run, { timeout: 1000 });
    } else {
      setTimeout(run, 400);
    }
  }, []);
  return null;
};

export default IdleTasks;