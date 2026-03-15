import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { getAllRecords, downloadJson, exportPhase1Csv, downloadCsv } from '../services/studyDataService.ts';
import type { StudyRecord } from '../types/index.ts';
import PageContainer from '../components/layout/PageContainer.tsx';

export default function AdminPage() {
  const { t } = useTranslation();
  const [records, setRecords] = useState<StudyRecord[]>([]);

  const refresh = () => setRecords(getAllRecords());

  useEffect(() => { refresh(); }, []);

  const handleExportAll = () => {
    downloadJson(records, `userstudy_all_${Date.now()}.json`);
  };

  const handleExportCsv = () => {
    const csv = exportPhase1Csv(records);
    downloadCsv(csv, `userstudy_phase1_${Date.now()}.csv`);
  };

  const handleDelete = (pid: string) => {
    if (!confirm(t('admin.confirmDelete'))) return;
    localStorage.removeItem(`userstudy_${pid}`);
    refresh();
  };

  const handleClearAll = () => {
    if (!confirm(t('admin.confirmClearAll'))) return;
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('userstudy_') && key !== 'userstudy_language') {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(k => localStorage.removeItem(k));
    refresh();
  };

  return (
    <PageContainer wide>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-slate-800">{t('admin.title')}</h1>
        <div className="flex gap-3">
          <button
            onClick={handleExportAll}
            disabled={records.length === 0}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-500 text-white hover:bg-blue-600 disabled:bg-slate-200 disabled:text-slate-400 transition-colors"
          >
            {t('admin.exportAll')}
          </button>
          <button
            onClick={handleExportCsv}
            disabled={records.length === 0}
            className="px-4 py-2 rounded-lg text-sm font-medium border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:bg-slate-100 disabled:text-slate-400 transition-colors"
          >
            {t('admin.exportCsv')}
          </button>
          <button
            onClick={handleClearAll}
            disabled={records.length === 0}
            className="px-4 py-2 rounded-lg text-sm font-medium border border-red-300 text-red-600 hover:bg-red-50 disabled:bg-slate-100 disabled:text-slate-400 transition-colors"
          >
            {t('admin.clearAll')}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 mb-4">
        <span className="text-sm text-slate-600">{t('admin.participantCount')}: <span className="font-semibold">{records.length}</span></span>
      </div>

      {records.length === 0 ? (
        <div className="text-center py-12 text-slate-400">{t('admin.noData')}</div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left px-4 py-3 font-medium text-slate-600">{t('common.participantId')}</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">{t('admin.currentStep')}</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Phase 1</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Phase 2</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">{t('common.timer')}</th>
                <th className="text-right px-4 py-3 font-medium text-slate-600"></th>
              </tr>
            </thead>
            <tbody>
              {records.map((r) => (
                <tr key={r.participant.id} className="border-b border-slate-50 hover:bg-slate-25">
                  <td className="px-4 py-3 font-mono text-slate-700">{r.participant.id}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {/* Read currentStep from localStorage directly for accuracy */}
                    {(() => {
                      try {
                        const raw = localStorage.getItem(`userstudy_${r.participant.id}`);
                        return raw ? JSON.parse(raw).currentStep : '—';
                      } catch { return '—'; }
                    })()}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{r.phase1.materialSets.length} sets</td>
                  <td className="px-4 py-3 text-slate-600">{r.phase2.tasks.length} tasks</td>
                  <td className="px-4 py-3 font-mono text-slate-600">
                    {Math.floor(r.totalDuration / 60)}:{String(r.totalDuration % 60).padStart(2, '0')}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleDelete(r.participant.id)}
                      className="text-xs text-red-500 hover:text-red-700"
                    >
                      {t('admin.delete')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </PageContainer>
  );
}
