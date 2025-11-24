import React from 'react';
import { t } from '../../i18n';

interface MultiParagraphTextProps {
  mainKey: string; // Combined multi-paragraph key, e.g. 'story_text'
  fallbackKeys?: string[]; // Legacy per-paragraph keys in order
  ParagraphComponent?: React.ElementType; // Custom paragraph component if needed
  className?: string; // Optional wrapper class
}

/**
 * Renders multi-paragraph translated text.
 * Strategy:
 * 1. Attempt main combined key (expects paragraphs separated by \n\n).
 * 2. If missing, joins fallbackKeys by \n\n (backward compatibility).
 * 3. Splits on two or more newlines to produce paragraphs.
 */
export const MultiParagraphText: React.FC<MultiParagraphTextProps> = ({
  mainKey,
  fallbackKeys = [],
  ParagraphComponent = 'p',
  className,
}) => {
  const combined = t(mainKey) || (fallbackKeys.length ? fallbackKeys.map(k => t(k)).join('\n\n') : '');
  if (!combined) return null;
  const paragraphs = combined.split(/\n{2,}/);
  return (
    <div className={className}>
      {paragraphs.map((text, idx) => (
        <ParagraphComponent key={idx}>{text}</ParagraphComponent>
      ))}
    </div>
  );
};

export default MultiParagraphText;