import { useNavigate } from 'react-router-dom';
import { useStudy } from '../context/StudyContext.tsx';
import ComparisonView from '../components/phase1/ComparisonView.tsx';
import type { MaterialSetResult, DimensionDef, MaterialData } from '../types/index.ts';
import dimensionsData from '../data/dimensions.json';
import matAwards from '../data/stimuli/material_awards.json';
import matJudging from '../data/stimuli/material_judging.json';
import matScholarly from '../data/stimuli/material_scholarly.json';
import matLeading from '../data/stimuli/material_leading.json';
import matSalary from '../data/stimuli/material_salary.json';

const dimensions: DimensionDef[] = dimensionsData.dimensions as DimensionDef[];
const materials: MaterialData[] = [
  matAwards, matJudging, matScholarly, matLeading, matSalary
] as MaterialData[];

export default function Phase1Page() {
  const { state, dispatch } = useStudy();
  const navigate = useNavigate();

  const completedCount = state.phase1Results.length;
  const currentMaterialIndex = completedCount;

  const handleComplete = (result: MaterialSetResult) => {
    dispatch({ type: 'ADD_PHASE1_RESULT', result });

    if (currentMaterialIndex + 1 >= materials.length) {
      dispatch({ type: 'SET_STEP', step: 'phase2' });
      navigate('/phase2');
    }
  };

  if (currentMaterialIndex >= materials.length) {
    return null;
  }

  const currentMaterial = materials[currentMaterialIndex];
  const columnOrder = state.counterbalance?.phase1ColumnOrder ?? [0, 1, 2];

  return (
    <div className="flex flex-col h-[calc(100vh-56px)]">
      <ComparisonView
        key={currentMaterial.materialId}
        material={currentMaterial}
        dimensions={dimensions}
        columnOrder={columnOrder}
        materialIndex={currentMaterialIndex}
        totalMaterials={materials.length}
        onComplete={handleComplete}
      />
    </div>
  );
}
