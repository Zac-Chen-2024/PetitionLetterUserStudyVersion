import { createContext, useContext, useReducer, useEffect, useCallback, type ReactNode } from 'react';
import type {
  StudyStep, CounterbalanceConfig,
  MaterialSetResult, TaskResult, SurveyResponse, StudyRecord,
} from '../types/index.ts';

// ── State shape ──
interface StudyState {
  participantId: string;
  currentStep: StudyStep;
  counterbalance: CounterbalanceConfig | null;
  phase1Results: MaterialSetResult[];
  phase2Results: TaskResult[];
  postStudySurvey: SurveyResponse;
  totalElapsed: number;
  startedAt: string;
}

const initialState: StudyState = {
  participantId: '',
  currentStep: 'phase1',
  counterbalance: null,
  phase1Results: [],
  phase2Results: [],
  postStudySurvey: {},
  totalElapsed: 0,
  startedAt: '',
};

// ── Actions ──
type Action =
  | { type: 'SET_PARTICIPANT'; id: string }
  | { type: 'SET_STEP'; step: StudyStep }
  | { type: 'SET_COUNTERBALANCE'; config: CounterbalanceConfig }
  | { type: 'ADD_PHASE1_RESULT'; result: MaterialSetResult }
  | { type: 'ADD_PHASE2_RESULT'; result: TaskResult }
  | { type: 'SET_POST_STUDY'; data: SurveyResponse }
  | { type: 'SET_TOTAL_ELAPSED'; seconds: number }
  | { type: 'RESTORE'; state: StudyState };

function reducer(state: StudyState, action: Action): StudyState {
  switch (action.type) {
    case 'SET_PARTICIPANT':
      return { ...state, participantId: action.id, startedAt: new Date().toISOString() };
    case 'SET_STEP':
      return { ...state, currentStep: action.step };
    case 'SET_COUNTERBALANCE':
      return { ...state, counterbalance: action.config };
    case 'ADD_PHASE1_RESULT':
      return { ...state, phase1Results: [...state.phase1Results, action.result] };
    case 'ADD_PHASE2_RESULT':
      return { ...state, phase2Results: [...state.phase2Results, action.result] };
    case 'SET_POST_STUDY':
      return { ...state, postStudySurvey: action.data };
    case 'SET_TOTAL_ELAPSED':
      return { ...state, totalElapsed: action.seconds };
    case 'RESTORE':
      return action.state;
    default:
      return state;
  }
}

// ── Context ──
interface StudyContextValue {
  state: StudyState;
  dispatch: React.Dispatch<Action>;
  exportRecord: () => StudyRecord;
  hasExistingSession: (id: string) => boolean;
  restoreSession: (id: string) => boolean;
}

const StudyContext = createContext<StudyContextValue | null>(null);

function storageKey(id: string) {
  return `userstudy_${id}`;
}

export function StudyProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Persist to localStorage on every state change
  useEffect(() => {
    if (state.participantId) {
      localStorage.setItem(storageKey(state.participantId), JSON.stringify(state));
    }
  }, [state]);

  const hasExistingSession = useCallback((id: string) => {
    return localStorage.getItem(storageKey(id)) !== null;
  }, []);

  const restoreSession = useCallback((id: string) => {
    const raw = localStorage.getItem(storageKey(id));
    if (raw) {
      try {
        const saved = JSON.parse(raw) as StudyState;
        dispatch({ type: 'RESTORE', state: saved });
        return true;
      } catch {
        return false;
      }
    }
    return false;
  }, []);

  const exportRecord = useCallback((): StudyRecord => {
    return {
      version: '1.0',
      participant: {
        id: state.participantId,
      },
      counterbalance: state.counterbalance ?? {
        phase1ColumnOrder: [0, 1, 2],
        phase2ConditionOrder: ['conditionA', 'conditionB'],
        seed: 0,
      },
      phase1: { materialSets: state.phase1Results },
      phase2: { tasks: state.phase2Results },
      postStudy: state.postStudySurvey,
      totalDuration: state.totalElapsed,
    };
  }, [state]);

  return (
    <StudyContext.Provider value={{ state, dispatch, exportRecord, hasExistingSession, restoreSession }}>
      {children}
    </StudyContext.Provider>
  );
}

export function useStudy() {
  const ctx = useContext(StudyContext);
  if (!ctx) throw new Error('useStudy must be used within StudyProvider');
  return ctx;
}
