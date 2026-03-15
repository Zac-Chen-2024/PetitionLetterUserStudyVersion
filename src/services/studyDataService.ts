import type { StudyRecord } from '../types/index.ts';

/**
 * Download a JSON file to the user's machine.
 */
export function downloadJson(data: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Export Phase 1 ratings as CSV.
 */
export function exportPhase1Csv(records: StudyRecord[]): string {
  const headers = [
    'participant_id',
    'material_id',
    'system_label',
    'source_id',
    'dimension_id',
    'score',
    'comment',
    'reading_duration_s',
    'column_order',
    'counterbalance_seed',
  ];

  const rows: string[] = [headers.join(',')];

  for (const record of records) {
    for (const ms of record.phase1.materialSets) {
      for (const rating of ms.ratings) {
        for (const [dimId, score] of Object.entries(rating.scores)) {
          rows.push([
            record.participant.id,
            ms.materialId,
            rating.systemLabel,
            rating.sourceId,
            dimId,
            String(score),
            `"${(rating.comment || '').replace(/"/g, '""')}"`,
            String(ms.readingDuration),
            `"${ms.columnOrder.join(';')}"`,
            String(record.counterbalance.seed),
          ].join(','));
        }
      }
    }
  }

  return rows.join('\n');
}

export function downloadCsv(csv: string, filename: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Gather all participant records from localStorage.
 */
export function getAllRecords(): StudyRecord[] {
  const records: StudyRecord[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith('userstudy_') && key !== 'userstudy_language') {
      try {
        const raw = localStorage.getItem(key);
        if (!raw) continue;
        const state = JSON.parse(raw);
        // Convert internal state to StudyRecord format
        records.push({
          version: '1.0',
          participant: {
            id: state.participantId,
          },
          counterbalance: state.counterbalance ?? {
            phase1ColumnOrder: [0, 1, 2],
            phase2ConditionOrder: ['conditionA', 'conditionB'],
            seed: 0,
          },
          phase1: { materialSets: state.phase1Results || [] },
          phase2: { tasks: state.phase2Results || [] },
          postStudy: state.postStudySurvey || {},
          totalDuration: state.totalElapsed || 0,
        });
      } catch {
        // skip corrupted entries
      }
    }
  }
  return records;
}
