import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { useStudy } from './context/StudyContext.tsx';
import { useStudyTimer } from './hooks/useStudyTimer.ts';
import { useCounterbalance } from './hooks/useCounterbalance.ts';
import type { StudyStep } from './types/index.ts';
import { STUDY_STEPS } from './types/index.ts';
import StudyHeader from './components/layout/StudyHeader.tsx';

import Phase1Page from './pages/Phase1Page.tsx';
import Phase2Page from './pages/Phase2Page.tsx';
import PostStudyPage from './pages/PostStudyPage.tsx';
import ThankYouPage from './pages/ThankYouPage.tsx';
import AdminPage from './pages/AdminPage.tsx';

const STEP_TO_PATH: Record<StudyStep, string> = {
  'phase1': '/',
  'phase2': '/phase2',
  'post-study': '/post-study',
  'thank-you': '/thank-you',
};

const PATH_TO_STEP: Record<string, StudyStep> = Object.fromEntries(
  Object.entries(STEP_TO_PATH).map(([k, v]) => [v, k as StudyStep])
) as Record<string, StudyStep>;

function StudyGuard({ children }: { children: React.ReactNode }) {
  const { state } = useStudy();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.pathname === '/admin') return;

    const targetStep = PATH_TO_STEP[location.pathname];
    if (!targetStep) {
      navigate(STEP_TO_PATH[state.currentStep], { replace: true });
      return;
    }

    const targetIndex = STUDY_STEPS.indexOf(targetStep);
    const currentIndex = STUDY_STEPS.indexOf(state.currentStep);

    if (targetIndex > currentIndex) {
      navigate(STEP_TO_PATH[state.currentStep], { replace: true });
    }
  }, [location.pathname, state.currentStep, navigate]);

  return <>{children}</>;
}

export default function App() {
  const { state, dispatch } = useStudy();
  const timer = useStudyTimer(state.totalElapsed);

  // Auto-assign participant ID and counterbalance on first load
  const urlParams = new URLSearchParams(window.location.search);
  const pidFromUrl = urlParams.get('pid') ?? `P${Date.now().toString(36)}`;
  const counterbalance = useCounterbalance(state.participantId || pidFromUrl);

  useEffect(() => {
    if (!state.participantId) {
      dispatch({ type: 'SET_PARTICIPANT', id: pidFromUrl });
      dispatch({ type: 'SET_COUNTERBALANCE', config: counterbalance });
    }
  }, []);

  // Timer control
  useEffect(() => {
    if (state.currentStep !== 'thank-you') {
      timer.start();
    } else {
      timer.pause();
    }
  }, [state.currentStep]);

  useEffect(() => {
    if (timer.elapsed > 0 && timer.elapsed % 5 === 0) {
      dispatch({ type: 'SET_TOTAL_ELAPSED', seconds: timer.elapsed });
    }
  }, [timer.elapsed, dispatch]);

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <StudyHeader timerFormatted={timer.formatted} />
      <div className="flex-1 overflow-auto">
        <StudyGuard>
          <Routes>
            <Route path="/" element={<Phase1Page />} />
            <Route path="/phase2" element={<Phase2Page />} />
            <Route path="/post-study" element={<PostStudyPage />} />
            <Route path="/thank-you" element={<ThankYouPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </StudyGuard>
      </div>
    </div>
  );
}
