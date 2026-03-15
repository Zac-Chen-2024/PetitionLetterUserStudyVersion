import { useTranslation } from 'react-i18next';

interface TaskInstructionsProps {
  condition: string;
  onStart: () => void;
}

export default function TaskInstructions({ condition, onStart }: TaskInstructionsProps) {
  const { t } = useTranslation();

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 max-w-lg text-center">
        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-slate-800 mb-2">{t('phase2.title')}</h2>
        <p className="text-sm text-slate-500 mb-1">{t('phase2.condition')}: {condition}</p>
        <p className="text-sm text-slate-600 mb-6 leading-relaxed">{t('phase2.taskDescription')}</p>
        <button
          onClick={onStart}
          className="px-6 py-2.5 rounded-lg text-sm font-medium bg-blue-500 text-white hover:bg-blue-600 transition-colors"
        >
          {t('phase2.startTask')}
        </button>
      </div>
    </div>
  );
}
