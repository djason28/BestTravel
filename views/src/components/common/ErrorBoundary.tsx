import { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from './Button';
import { t } from '../../i18n';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('error_title')}</h2>
            <p className="text-gray-600 mb-6">{t('error_message')}</p>
            <div className="bg-red-50 text-red-700 p-4 rounded-lg text-sm mb-6 text-left overflow-auto max-h-40">
              {this.state.error?.message}
            </div>
            <div className="flex gap-4 justify-center">
              <Button onClick={() => window.location.reload()}>
                {t('refresh_page')}
              </Button>
              <Button variant="outline" onClick={() => window.location.href = '/'}>
                {t('go_home')}
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
