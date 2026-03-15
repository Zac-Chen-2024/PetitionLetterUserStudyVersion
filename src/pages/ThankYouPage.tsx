import { useTranslation } from 'react-i18next';
import { useStudy } from '../context/StudyContext.tsx';
import { downloadJson } from '../services/studyDataService.ts';

export default function ThankYouPage() {
  const { t } = useTranslation();
  const { state, exportRecord } = useStudy();

  const handleDownload = () => {
    const record = exportRecord();
    downloadJson(record, `userstudy_${state.participantId}_${Date.now()}.json`);
  };

  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-6">
        {/* Checkmark icon */}
        <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mb-6 checkmark-appear shadow-[0_4px_12px_rgba(16,185,129,0.12)]">
          <svg className="w-8 h-8 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className="text-3xl font-semibold text-slate-800 mb-3 tracking-tight fade-up fade-up-delay-1">{t('thankYou.title')}</h1>
        <p className="text-base text-slate-500 mb-8 max-w-2xl leading-relaxed fade-up fade-up-delay-2">{t('thankYou.message')}</p>

        <button
          onClick={handleDownload}
          className="px-6 py-3 rounded-lg text-sm font-semibold bg-emerald-500 text-white hover:bg-emerald-600 active:scale-[0.98] transition-all duration-200 ease-out mb-8 shadow-sm hover:shadow-md fade-up fade-up-delay-3"
        >
          {t('thankYou.downloadData')}
        </button>

        <div className="fade-up fade-up-delay-4">
          <p className="text-sm text-slate-400">{t('thankYou.studyComplete')}</p>
          <p className="text-sm text-slate-400 mt-2">{t('thankYou.contactInfo')}</p>
        </div>
    </div>
  );
}
