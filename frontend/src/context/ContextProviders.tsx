import { useEffect, type ReactNode } from 'react';
import { ProjectProvider, useProject } from './ProjectContext';
import { SnippetsProvider, useSnippets } from './SnippetsContext';
import { ArgumentsProvider, useArguments } from './ArgumentsContext';
import { UIProvider } from './UIContext';
import { WritingProvider, useWriting } from './WritingContext';
import { convertBackendArguments, convertBackendSubArguments } from './ArgumentsContext';
import type { Snippet, LetterSection } from '../types';
import { apiClient } from '../services/api';
import { writingService } from '../services/writingService';

// ============================================
// ContextProviders
// Nests all 5 context providers and includes a DataLoader
// that loads project data when projectId changes.
// ============================================

// Default color for unassigned snippets
const DEFAULT_SNIPPET_COLOR = '#94a3b8';

// New unified extraction format (with subject attribution)
interface UnifiedSnippet {
  snippet_id: string;
  block_id: string;
  exhibit_id: string;
  text: string;
  subject: string;
  subject_role: string;
  is_applicant_achievement: boolean;
  evidence_type: string;
  confidence: number;
  reasoning: string;
  page?: number;
  bbox?: { x1: number; y1: number; x2: number; y2: number } | null;
}

function convertUnifiedSnippet(us: UnifiedSnippet): Snippet {
  return {
    id: us.snippet_id,
    documentId: `doc_${us.exhibit_id}`,
    content: us.text,
    summary: us.text.substring(0, 80) + (us.text.length > 80 ? '...' : ''),
    boundingBox: us.bbox ? {
      x: us.bbox.x1,
      y: us.bbox.y1,
      width: us.bbox.x2 - us.bbox.x1,
      height: us.bbox.y2 - us.bbox.y1,
      page: us.page || 1,
    } : { x: 0, y: 0, width: 100, height: 50, page: us.page || 1 },
    materialType: 'other',
    color: DEFAULT_SNIPPET_COLOR,
    exhibitId: us.exhibit_id,
    page: us.page || 1,
    subject: us.subject,
    subjectRole: us.subject_role,
    isApplicantAchievement: us.is_applicant_achievement,
    evidenceType: us.evidence_type,
  };
}

/**
 * DataLoader: Sits inside all providers and loads data when projectId changes.
 * This replaces the single big useEffect that was in AppProvider.
 */
function DataLoader({ children }: { children: ReactNode }) {
  const { projectId, setIsLoading, setLoadError, setPipelineState } = useProject();
  const { setSnippets } = useSnippets();
  const { setArguments, setSubArguments } = useArguments();
  const { setLetterSections } = useWriting();

  useEffect(() => {
    let cancelled = false;

    async function loadProjectData() {
      setIsLoading(true);
      setLoadError(null);

      // CRITICAL: Clear all project-specific state before loading new project data.
      // Without this, switching from a project with data (e.g. yaruo_qu) to one
      // without (e.g. dehuan_liu) would show the old project's stale data.
      setSnippets([]);
      setArguments([]);
      setSubArguments([]);
      setLetterSections([]);

      // Helper: load saved letter sections
      async function loadLetterSections() {
        console.log('[DataLoader] Loading letter sections...');
        try {
          const sectionsResp = await writingService.getAllSections(projectId);

          if (cancelled) return;

          if (sectionsResp.sections && sectionsResp.sections.length > 0) {
            const converted: LetterSection[] = sectionsResp.sections.map((s, i) => ({
              id: `section-${s.section}`,
              title: s.section.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
              standardId: s.section,
              content: s.paragraph_text,
              isGenerated: true,
              order: i,
              sentences: s.sentences,
              provenanceIndex: s.provenance_index ? {
                bySubArgument: s.provenance_index.by_subargument || {},
                byArgument: s.provenance_index.by_argument || {},
                bySnippet: s.provenance_index.by_snippet || {},
              } : undefined,
            }));
            setLetterSections(converted);
            // Only advance to petition_ready if we've already passed mapping_confirmed
            setPipelineState(prev => {
              const validPriorStages = ['mapping_confirmed', 'petition_ready'];
              if (validPriorStages.includes(prev.stage)) {
                return { ...prev, stage: 'petition_ready' };
              }
              return prev;
            });
            console.log(`Loaded ${converted.length} saved letter sections`);
          }
        } catch {
          console.log('No saved letter sections found');
        }
      }

      try {
        // Load snippets from unified extraction API
        const extractionResponse = await apiClient.get<{
          project_id: string;
          total: number;
          snippets: UnifiedSnippet[];
        }>(`/extraction/${projectId}/snippets?limit=2000`);

        if (cancelled) return;

        if (extractionResponse.snippets && extractionResponse.snippets.length > 0) {
          const converted = extractionResponse.snippets.map(convertUnifiedSnippet);
          setSnippets(converted);
          setPipelineState(prev => ({ ...prev, stage: 'snippets_ready', snippetCount: converted.length }));
          console.log(`Loaded ${converted.length} unified extraction snippets from project ${projectId}`);
        }

        // Load generated arguments and sub-arguments
        try {
          const argsResponse = await apiClient.get<{
            project_id: string;
            arguments: Array<{
              id: string;
              title: string;
              subject: string;
              snippet_ids: string[];
              standard_key: string;
              confidence: number;
              created_at: string;
              is_ai_generated: boolean;
              sub_argument_ids?: string[];
            }>;
            sub_arguments: Array<{
              id: string;
              argument_id: string;
              title: string;
              purpose: string;
              relationship: string;
              snippet_ids: string[];
              pending_snippet_ids?: string[];
              needs_snippet_confirmation?: boolean;
              is_ai_generated: boolean;
              status: string;
              created_at: string;
            }>;
            main_subject: string | null;
            generated_at: string | null;
          }>(`/arguments/${projectId}`);

          if (cancelled) return;

          if (argsResponse.arguments && argsResponse.arguments.length > 0) {
            const convertedArgs = convertBackendArguments(argsResponse.arguments);
            setArguments(convertedArgs);
            setPipelineState(prev => ({ ...prev, stage: 'mapping_confirmed' }));
            console.log(`Loaded ${convertedArgs.length} generated arguments from backend`);
          }

          const subArgsData = argsResponse.sub_arguments || [];
          const convertedSubArgs = convertBackendSubArguments(subArgsData);
          setSubArguments(convertedSubArgs);
          console.log(`Loaded ${convertedSubArgs.length} sub-arguments from backend`);
        } catch {
          console.log('No generated arguments found');
        }

        // Load saved letter sections
        await loadLetterSections();
      } catch (err) {
        if (cancelled) return;
        console.error('Failed to load project data:', err);
        setLoadError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadProjectData();
    return () => { cancelled = true; };
  }, [projectId, setIsLoading, setLoadError, setPipelineState, setSnippets, setArguments, setSubArguments, setLetterSections]);

  return <>{children}</>;
}

/**
 * AppProviders: Nests all context providers in the correct order.
 * ProjectProvider is outermost (no dependencies).
 * SnippetsProvider and ArgumentsProvider are next.
 * UIProvider and WritingProvider are innermost.
 * DataLoader sits inside all providers to access all setters.
 */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ProjectProvider>
      <SnippetsProvider>
        <ArgumentsProvider>
          <UIProvider>
            <WritingProvider>
              <DataLoader>
                {children}
              </DataLoader>
            </WritingProvider>
          </UIProvider>
        </ArgumentsProvider>
      </SnippetsProvider>
    </ProjectProvider>
  );
}
