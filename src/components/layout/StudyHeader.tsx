import { useTranslation } from 'react-i18next';
import { useStudy } from '../../context/StudyContext.tsx';
import { STUDY_STEPS } from '../../types/index.ts';

interface StudyHeaderProps {
  timerFormatted: string;
}

export default function StudyHeader({ timerFormatted }: StudyHeaderProps) {
  const { i18n } = useTranslation();
  const { state } = useStudy();

  const currentIndex = STUDY_STEPS.indexOf(state.currentStep);
  const progress = Math.round((currentIndex / (STUDY_STEPS.length - 1)) * 100);

  const toggleLang = () => {
    const next = i18n.language === 'en' ? 'zh' : 'en';
    i18n.changeLanguage(next);
    localStorage.setItem('userstudy_language', next);
  };

  return (
    <header className="h-14 bg-white border-b border-slate-200 flex items-center px-4 gap-4 shrink-0">
      {/* Progress */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden max-w-48">
          <div
            className="h-full bg-blue-600 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-xs text-slate-400 tabular-nums">{progress}%</span>
      </div>

      {/* Participant ID */}
      {state.participantId && (
        <span className="text-xs text-slate-500">
          ID: <span className="font-medium text-slate-700">{state.participantId}</span>
        </span>
      )}

      {/* Timer */}
      <div className="flex items-center gap-1.5">
        <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <circle cx="12" cy="12" r="10" />
          <path d="M12 6v6l4 2" />
        </svg>
        <span className="text-xs font-mono text-slate-600">{timerFormatted}</span>
      </div>

      {/* Language toggle */}
      <button
        onClick={toggleLang}
        className="text-xs px-2.5 py-1.5 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
      >
        {i18n.language === 'en' ? '中文' : 'EN'}
      </button>
    </header>
  );
}
