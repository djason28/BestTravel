import React from 'react';
import { Loader2 } from 'lucide-react';
import logoShort from '../../assets/branding/logo pendek.png';
import { t } from '../../i18n';

interface LoadingProps {
  fullScreen?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const Loading: React.FC<LoadingProps> = ({ fullScreen = false, size = 'md' }) => {
  const sizes = {
    sm: 'h-6 w-6',
    md: 'h-12 w-12',
    lg: 'h-16 w-16',
  };

  const spinner = <Loader2 className={`animate-spin text-blue-600 ${sizes[size]}`} />;

  const content = (
    <div className="flex flex-col items-center justify-center gap-3">
      {fullScreen && (
        <img
          src={logoShort}
          alt="Logo"
          className="w-20 h-20 object-contain animate-[pulse_2.5s_ease-in-out_infinite] select-none"
          draggable={false}
        />
      )}
      <div className="relative">
        <div className="absolute inset-0 rounded-full border-4 border-blue-100 animate-[ping_1.8s_linear_infinite]" />
        {spinner}
      </div>
      <p className="text-sm text-gray-600 animate-pulse">{t('loading') || 'Loading...'}</p>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white bg-opacity-95 flex items-center justify-center z-50">
        {content}
      </div>
    );
  }

  return content;
};

export const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => {
  return <div className={`animate-pulse bg-gray-200 rounded ${className}`}></div>;
};

export const PackageCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <Skeleton className="h-48 w-full" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <div className="flex justify-between items-center pt-2">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-8 w-20" />
        </div>
      </div>
    </div>
  );
};
