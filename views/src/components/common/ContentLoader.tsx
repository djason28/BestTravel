import React from 'react';
import { Loading } from './Loading';

interface ContentLoaderProps {
  /** Show overlay that covers only the content area (not header/footer) */
  overlay?: boolean;
  /** Minimum height reserved while loading (helps prevent layout shift) */
  minHeight?: number | string;
  /** Optional message (defaults to t('loading')) */
  message?: string;
}

/**
 * ContentLoader renders a localized loading indicator inside page content
 * while keeping global chrome (header/footer) visible.
 * - overlay: absolute positioned dim layer with spinner centered.
 * - non-overlay: skeleton reservation with centered spinner.
 */
export const ContentLoader: React.FC<ContentLoaderProps> = ({ overlay = false, minHeight = 300, message }) => {
  const heightStyle = typeof minHeight === 'number' ? `${minHeight}px` : minHeight;
  if (overlay) {
    return (
      <div className="relative" style={{ minHeight: heightStyle }}>
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-10">
          <Loading size="md" />
          {message && <span className="sr-only">{message}</span>}
        </div>
      </div>
    );
  }
  return (
    <div className="flex items-center justify-center" style={{ minHeight: heightStyle }}>
      <Loading size="md" />
      {message && <span className="sr-only">{message}</span>}
    </div>
  );
};

export default ContentLoader;