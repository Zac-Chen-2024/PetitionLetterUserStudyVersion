import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStudy } from '../context/StudyContext.tsx';
import type { SurveyResponse } from '../types/index.ts';
import TaskInstructions from '../components/phase2/TaskInstructions.tsx';
import TaskWrapper from '../components/phase2/TaskWrapper.tsx';
import PostTaskSurvey from '../components/phase2/PostTaskSurvey.tsx';

type TaskPhase = 'instructions' | 'active' | 'survey';

export default function Phase2Page() {
  const { state, dispatch } = useStudy();
  const navigate = useNavigate();

  const conditionOrder = state.counterbalance?.phase2ConditionOrder ?? ['conditionA', 'conditionB'];
  const completedTasks = state.phase2Results.length;
  const currentTaskIndex = completedTasks;

  const [phase, setPhase] = useState<TaskPhase>('instructions');
  const taskStartRef = useRef(0);

  // All tasks complete → advance
  if (currentTaskIndex >= conditionOrder.length) {
    dispatch({ type: 'SET_STEP', step: 'post-study' });
    navigate('/post-study');
    return null;
  }

  const currentCondition = conditionOrder[currentTaskIndex];

  // Build the iframe URL based on condition
  const getSystemUrl = (condition: string) => {
    const base = 'http://localhost:5173';
    if (condition === 'conditionA') {
      return `${base}/mapping?studyMode=true&condition=A`;
    }
    return `${base}/mapping?studyMode=true&condition=B`;
  };

  const handleStart = () => {
    taskStartRef.current = Date.now();
    setPhase('active');
  };

  const handleTaskComplete = () => {
    setPhase('survey');
  };

  const handleSurveySubmit = (survey: SurveyResponse) => {
    const duration = Math.round((Date.now() - taskStartRef.current) / 1000);
    dispatch({
      type: 'ADD_PHASE2_RESULT',
      result: {
        taskId: `task_${currentTaskIndex}`,
        condition: currentCondition,
        duration,
        completed: true,
        postTaskSurvey: survey,
      },
    });
    // Reset for next task
    setPhase('instructions');
  };

  return (
    <div className="h-[calc(100vh-48px)] flex flex-col">
      {phase === 'instructions' && (
        <TaskInstructions condition={currentCondition} onStart={handleStart} />
      )}
      {phase === 'active' && (
        <TaskWrapper
          systemUrl={getSystemUrl(currentCondition)}
          onComplete={handleTaskComplete}
        />
      )}
      {phase === 'survey' && (
        <PostTaskSurvey onSubmit={handleSurveySubmit} />
      )}
    </div>
  );
}
