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

// Idle: all neutral gray outline, no color
const IDLE_COLORS = [
  'border-slate-300 hover:border-slate-400',
  'border-slate-300 hover:border-slate-400',
  'border-slate-300 hover:border-slate-400',
  'border-slate-300 hover:border-slate-400',
  'border-slate-300 hover:border-slate-400',
  'border-slate-300 hover:border-slate-400',
  'border-slate-300 hover:border-slate-400',
];

const SELECTED_COLORS = [
  'bg-red-600 border-red-600 text-white shadow-md',
  'bg-red-500 border-red-500 text-white shadow-md',
  'bg-red-400 border-red-400 text-white shadow-md',
  'bg-slate-500 border-slate-500 text-white shadow-md',
  'bg-green-400 border-green-400 text-white shadow-md',
  'bg-green-500 border-green-500 text-white shadow-md',
  'bg-green-600 border-green-600 text-white shadow-md',
];

export default function PostTaskSurvey({ onSubmit }: PostTaskSurveyProps) {
  const { t } = useTranslation();
  const [responses, setResponses] = useState<SurveyResponse>({});

  const allAnswered = QUESTIONS.every(q => responses[q.id] !== undefined);

  const handleSelect = (questionId: string, value: number) => {
    setResponses(prev => ({ ...prev, [questionId]: value }));
  };

  return (
    <div className="w-full px-16 py-10 overflow-y-auto h-full custom-scrollbar">
      {/* Header */}
      <div className="mb-10">
        <h2 className="text-[36px] font-bold text-slate-900 mb-3 tracking-tight">{t('postTask.title')}</h2>
        <p className="text-[22px] text-slate-500 leading-relaxed">
          Please rate your agreement with each statement on a 7-point scale.
        </p>
      </div>

      {/* Scale legend bar */}
      <div className="rounded-xl border border-slate-200/80 bg-gradient-to-r from-red-50 via-slate-50 to-green-50 px-8 py-5 mb-8 flex items-center justify-between shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <span className="text-[18px] font-semibold text-red-500">1 = Strongly Disagree</span>
        <div className="flex gap-8">
          {SCALE_LABELS.map((label, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <span className="text-[17px] font-bold text-slate-700">{i + 1}</span>
              <span className="text-[13px] text-slate-400 leading-tight text-center w-16">{label}</span>
            </div>
          ))}
        </div>
        <span className="text-[18px] font-semibold text-green-600">7 = Strongly Agree</span>
      </div>

      {/* Questions */}
      <div className="space-y-6">
        {QUESTIONS.map((q, qIdx) => {
          const selected = responses[q.id] as number | undefined;
          return (
            <div
              key={q.id}
              className={`rounded-2xl border-2 p-8 transition-all duration-300 ease-out ${
                selected !== undefined
                  ? 'border-blue-200/80 bg-blue-50/30 shadow-[0_2px_8px_rgba(59,130,246,0.06)]'
                  : 'border-slate-200 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:shadow-[0_2px_6px_rgba(0,0,0,0.06)]'
              }`}
            >
              {/* Question text */}
              <div className="flex gap-5 mb-7">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-[22px] font-bold shrink-0 transition-all duration-300 ease-out ${
                  selected !== undefined
                    ? 'bg-blue-600 text-white shadow-[0_2px_6px_rgba(37,99,235,0.25)]'
                    : 'bg-slate-800 text-white'
                }`}>
                  {qIdx + 1}
                </div>
                <div className="pt-1">
                  <h3 className="text-[24px] font-bold text-slate-900 tracking-tight">{q.label}</h3>
                  <p className="text-[19px] text-slate-500 mt-2 leading-relaxed">{q.desc}</p>
                </div>
              </div>

              {/* 7-point Likert scale */}
              <div className="flex items-center px-6">
                <span className="text-[18px] font-medium text-slate-400 w-32 text-right pr-6 shrink-0 leading-snug">
                  Strongly<br />Disagree
                </span>

                <div className="flex items-center gap-5 flex-1 justify-center">
                  {SCALE_LABELS.map((label, i) => {
                    const value = i + 1;
                    const isSelected = selected === value;
                    const distance = Math.abs(i - 3);
                    const sizes = ['w-12 h-12', 'w-[52px] h-[52px]', 'w-14 h-14', 'w-16 h-16'];
                    const sizeClass = sizes[distance];

                    return (
                      <button
                        key={value}
                        onClick={() => handleSelect(q.id, value)}
                        title={label}
                        className={`
                          ${sizeClass} rounded-full border-[3px] flex items-center justify-center text-[19px] font-bold cursor-pointer
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

                <span className="text-[18px] font-medium text-slate-400 w-32 pl-6 shrink-0 leading-snug">
                  Strongly<br />Agree
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Submit */}
      <div className="mt-10 pb-10">
        <button
          onClick={() => onSubmit(responses)}
          disabled={!allAnswered}
          className={`
            w-full py-5 rounded-2xl text-[22px] font-bold transition-all duration-300 ease-out
            ${allAnswered
              ? 'bg-slate-800 text-white hover:bg-slate-900 active:scale-[0.99] shadow-[0_2px_8px_rgba(15,23,42,0.2)] hover:shadow-[0_4px_12px_rgba(15,23,42,0.25)]'
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
