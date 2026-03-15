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
        <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center mb-8 checkmark-appear shadow-[0_4px_12px_rgba(16,185,129,0.12)]">
          <svg className="w-10 h-10 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className="text-[45px] font-semibold text-slate-800 mb-5 tracking-tight fade-up fade-up-delay-1">{t('thankYou.title')}</h1>
        <p className="text-[25px] text-slate-500 mb-12 max-w-2xl leading-relaxed fade-up fade-up-delay-2">{t('thankYou.message')}</p>

        <button
          onClick={handleDownload}
          className="px-10 py-4 rounded-xl text-[23px] font-semibold bg-emerald-500 text-white hover:bg-emerald-600 active:scale-[0.98] transition-all duration-200 ease-out mb-10 shadow-[0_2px_8px_rgba(16,185,129,0.3)] hover:shadow-[0_4px_12px_rgba(16,185,129,0.35)] fade-up fade-up-delay-3"
        >
          {t('thankYou.downloadData')}
        </button>

        <div className="fade-up fade-up-delay-4">
          <p className="text-[23px] text-slate-400">{t('thankYou.studyComplete')}</p>
          <p className="text-[21px] text-slate-400 mt-3">{t('thankYou.contactInfo')}</p>
        </div>
    </div>
  );
}
