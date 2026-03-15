import { useTranslation } from 'react-i18next';
import { useStudy } from '../context/StudyContext.tsx';
import { downloadJson } from '../services/studyDataService.ts';
import PageContainer from '../components/layout/PageContainer.tsx';

export default function ThankYouPage() {
  const { t } = useTranslation();
  const { state, exportRecord } = useStudy();

  const handleDownload = () => {
    const record = exportRecord();
    downloadJson(record, `userstudy_${state.participantId}_${Date.now()}.json`);
  };

  return (
    <PageContainer>
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center">
        {/* Checkmark icon */}
        <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mb-6">
          <svg className="w-8 h-8 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className="text-3xl font-semibold text-slate-800 mb-3">{t('thankYou.title')}</h1>
        <p className="text-slate-600 mb-8 max-w-md leading-relaxed">{t('thankYou.message')}</p>

        <button
          onClick={handleDownload}
          className="px-6 py-2.5 rounded-lg text-sm font-medium border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors mb-6"
        >
          {t('thankYou.downloadData')}
        </button>

        <p className="text-sm text-slate-400">{t('thankYou.studyComplete')}</p>
        <p className="text-xs text-slate-400 mt-2">{t('thankYou.contactInfo')}</p>
      </div>
    </PageContainer>
  );
}
