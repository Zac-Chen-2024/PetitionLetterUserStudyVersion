import { useRef, useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

interface TaskWrapperProps {
  systemUrl: string;
  onComplete: () => void;
}

export default function TaskWrapper({ systemUrl, onComplete }: TaskWrapperProps) {
  const { t } = useTranslation();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [loadError, setLoadError] = useState(false);
  const [loading, setLoading] = useState(true);

  const handleMessage = useCallback((event: MessageEvent) => {
    if (event.data?.type === 'STUDY_TASK_COMPLETE') {
      onComplete();
    }
  }, [onComplete]);

  useEffect(() => {
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [handleMessage]);

  // Detect load failure via timeout
  useEffect(() => {
    const timer = setTimeout(() => {
      if (loading) setLoadError(true);
    }, 8000);
    return () => clearTimeout(timer);
  }, [loading, systemUrl]);

  const handleRetry = () => {
    setLoadError(false);
    setLoading(true);
    if (iframeRef.current) {
      iframeRef.current.src = systemUrl;
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 relative">
        {/* Loading / Error overlay */}
        {(loading || loadError) && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-50">
            {loadError ? (
              <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6 max-w-md text-center">
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-3">
                  <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-slate-800 mb-1">{t('phase2.connectionError')}</p>
                <p className="text-xs text-slate-500 mb-4">{t('phase2.connectionErrorHint')}</p>
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={handleRetry}
                    className="px-3 py-1.5 text-xs font-medium bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors"
                  >
                    {t('phase2.retry')}
                  </button>
                  <button
                    onClick={onComplete}
                    className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                  >
                    {t('phase2.skip')}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                {t('phase2.loading')}
              </div>
            )}
          </div>
        )}

        <iframe
          ref={iframeRef}
          src={systemUrl}
          className="w-full h-full border-0"
          title="Study Task"
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
          onLoad={() => { setLoading(false); setLoadError(false); }}
          onError={() => setLoadError(true)}
        />
      </div>

    </div>
  );
}
