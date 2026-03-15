import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { SurveyResponse } from '../../types/index.ts';

interface PostTaskSurveyProps {
  onSubmit: (responses: SurveyResponse) => void;
}

const QUESTIONS = [
  {
    id: 'sourceTraceability',
    label: 'Source Traceability',
    desc: 'I felt like I could trace each claim in the generated text back to a specific source document and page number.',
  },
  {
    id: 'citationAccuracy',
    label: 'Citation Accuracy',
    desc: 'I felt confident that the exhibit citations (e.g., [Exhibit C2, p.2]) in the generated text accurately pointed to the correct source location.',
  },
  {
    id: 'factualGrounding',
    label: 'Factual Grounding',
    desc: 'I felt confident that the generated text only contained facts from the provided source materials, without hallucinated or fabricated information.',
  },
  {
    id: 'argumentOrganization',
    label: 'Argument Organization',
    desc: 'I felt like the tool helped me organize evidence into a coherent legal argument structure.',
  },
  {
    id: 'legalReasoningQuality',
    label: 'Legal Reasoning Quality',
    desc: 'I felt like the generated text demonstrated sound legal reasoning — not just summarizing facts, but arguing why evidence satisfies the regulatory standard.',
  },
  {
    id: 'processTransparency',
    label: 'Process Transparency',
    desc: 'I felt like I understood what the tool was doing at each stage of the writing process and could anticipate what the output would look like.',
  },
  {
    id: 'efficiency',
    label: 'Efficiency',
    desc: 'I felt like using this tool saved me significant time compared to writing the same section from scratch.',
  },
  {
    id: 'trust',
    label: 'Trust',
    desc: 'I would trust the generated text enough to include it in an actual petition filing after a brief review.',
  },
  {
    id: 'learnability',
    label: 'Learnability',
    desc: 'I felt like I could quickly understand how to use the system\'s features without extensive training.',
  },
] as const;

const SCALE_LABELS = [
  'Strongly Disagree',
  'Disagree',
  'Somewhat Disagree',
  'Neutral',
  'Somewhat Agree',
  'Agree',
  'Strongly Agree',
];

// Idle: all neutral gray outline
const IDLE_COLORS = [
  'border-slate-300 hover:border-slate-400',
  'border-slate-300 hover:border-slate-400',
  'border-slate-300 hover:border-slate-400',
  'border-slate-300 hover:border-slate-400',
  'border-slate-300 hover:border-slate-400',
  'border-slate-300 hover:border-slate-400',
  'border-slate-300 hover:border-slate-400',
];

// Unified blue palette for selected state (darker = more extreme)
const SELECTED_COLORS = [
  'bg-blue-700 border-blue-700 text-white',
  'bg-blue-600 border-blue-600 text-white',
  'bg-blue-500 border-blue-500 text-white',
  'bg-blue-400 border-blue-400 text-white',
  'bg-blue-500 border-blue-500 text-white',
  'bg-blue-600 border-blue-600 text-white',
  'bg-blue-700 border-blue-700 text-white',
];

export default function PostTaskSurvey({ onSubmit }: PostTaskSurveyProps) {
  const { t } = useTranslation();
  const [responses, setResponses] = useState<SurveyResponse>({});

  const allAnswered = QUESTIONS.every(q => responses[q.id] !== undefined);

  const handleSelect = (questionId: string, value: number) => {
    setResponses(prev => ({ ...prev, [questionId]: value }));
  };

  return (
    <div className="w-full px-8 py-8 overflow-y-auto h-full custom-scrollbar">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-slate-900 mb-2 tracking-tight">{t('postTask.title')}</h2>
        <p className="text-sm text-slate-500 leading-relaxed">
          Please rate your agreement with each statement on a 7-point scale.
        </p>
      </div>

      {/* Scale legend bar */}
      <div className="rounded-lg border border-slate-200/80 bg-slate-50 px-6 py-4 mb-6 flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500">1 = Strongly Disagree</span>
        <div className="flex gap-6">
          {SCALE_LABELS.map((label, i) => (
            <div key={i} className="flex flex-col items-center gap-0.5">
              <span className="text-sm font-semibold text-slate-700">{i + 1}</span>
              <span className="text-[11px] text-slate-400 leading-tight text-center w-14">{label}</span>
            </div>
          ))}
        </div>
        <span className="text-xs font-semibold text-slate-500">7 = Strongly Agree</span>
      </div>

      {/* Questions */}
      <div className="space-y-4">
        {QUESTIONS.map((q, qIdx) => {
          const selected = responses[q.id] as number | undefined;
          return (
            <div
              key={q.id}
              className={`rounded-xl border p-5 transition-all duration-200 ease-out ${
                selected !== undefined
                  ? 'border-blue-200/80 bg-blue-50/30 shadow-[0_2px_8px_rgba(59,130,246,0.06)]'
                  : 'border-slate-200 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:shadow-[0_2px_6px_rgba(0,0,0,0.06)]'
              }`}
            >
              {/* Question text */}
              <div className="flex gap-4 mb-4">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 transition-all duration-200 ease-out ${
                  selected !== undefined
                    ? 'bg-blue-600 text-white shadow-[0_2px_6px_rgba(37,99,235,0.25)]'
                    : 'bg-slate-600 text-white'
                }`}>
                  {qIdx + 1}
                </div>
                <div className="pt-0.5">
                  <h3 className="text-base font-semibold text-slate-900 tracking-tight">{q.label}</h3>
                  <p className="text-sm text-slate-500 mt-1 leading-relaxed">{q.desc}</p>
                </div>
              </div>

              {/* 7-point Likert scale */}
              <div className="flex items-center px-4">
                <span className="text-xs font-medium text-slate-400 w-24 text-right pr-4 shrink-0 leading-snug">
                  Strongly<br />Disagree
                </span>

                <div className="flex items-center gap-3 flex-1 justify-center">
                  {SCALE_LABELS.map((label, i) => {
                    const value = i + 1;
                    const isSelected = selected === value;

                    return (
                      <button
                        key={value}
                        onClick={() => handleSelect(q.id, value)}
                        title={label}
                        className={`
                          w-10 h-10 rounded-full border-2 flex items-center justify-center text-sm font-semibold cursor-pointer
                          transition-all duration-200 ease-out
                          ${isSelected
                            ? `${SELECTED_COLORS[i]} likert-select`
                            : `${IDLE_COLORS[i]} text-slate-400 hover:scale-105 hover:shadow-sm active:scale-95`
                          }
                        `}
                      >
                        {value}
                      </button>
                    );
                  })}
                </div>

                <span className="text-xs font-medium text-slate-400 w-24 pl-4 shrink-0 leading-snug">
                  Strongly<br />Agree
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Submit */}
      <div className="mt-8 pb-8">
        <button
          onClick={() => onSubmit(responses)}
          disabled={!allAnswered}
          className={`
            w-full py-3 rounded-lg text-sm font-semibold transition-all duration-200 ease-out
            ${allAnswered
              ? 'bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.99] shadow-sm hover:shadow-md'
              : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
            }
          `}
        >
          {allAnswered
            ? t('common.submit')
            : `Please answer all questions (${Object.keys(responses).length}/${QUESTIONS.length})`
          }
        </button>
      </div>
    </div>
  );
}
