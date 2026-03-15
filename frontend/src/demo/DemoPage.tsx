/**
 * DemoPage — Renders the Write Mode interface with mock data.
 *
 * Uses the real React components (EvidenceCardPool, ArgumentGraph,
 * LetterPanel, ConnectionLines) but replaces the DataLoader with
 * a MockDataLoader that injects pre-configured mock data.
 *
 * Navigate to /demo to see this page (no backend required).
 */

import { useEffect, useRef, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { ProjectProvider } from '../context/ProjectContext';
import { SnippetsProvider, useSnippets } from '../context/SnippetsContext';
import { ArgumentsProvider, useArguments } from '../context/ArgumentsContext';
import { UIProvider, useUI } from '../context/UIContext';
import { WritingProvider, useWriting } from '../context/WritingContext';
import { useProject } from '../context/ProjectContext';
import {
  EvidenceCardPool,
  ArgumentGraph,
  ConnectionLines,
} from '../components';
import { LetterPanel } from '../components/LetterPanel';
import {
  mockSnippets,
  mockArguments,
  mockSubArguments,
  mockLetterSections,
} from './mockData';

// ============================================
// MockDataLoader
// Injects mock data into all contexts, then sets
// the interaction state (subarg-1a focused, snip-1 selected).
// ============================================
function MockDataLoader({ children }: { children: ReactNode }) {
  const { setIsLoading, setPipelineState } = useProject();
  const { setSnippets } = useSnippets();
  const { setArguments, setSubArguments, addArgumentMapping } = useArguments();
  const { setLetterSections } = useWriting();
  const {
    setFocusState,
    setSelectedSnippetId,
    setSelectedDocumentId,
    setWorkMode,
  } = useUI();

  useEffect(() => {
    // 1. Inject mock data
    setSnippets(mockSnippets);
    setArguments(mockArguments);
    setSubArguments(mockSubArguments);
    setLetterSections(mockLetterSections);

    // 2. Argument→Standard mappings
    addArgumentMapping('arg-1', 'original_contribution');
    addArgumentMapping('arg-2', 'leading_role');
    addArgumentMapping('arg-3', 'awards');
    addArgumentMapping('arg-4', 'scholarly_articles');

    // 3. Pipeline = petition_ready (so LetterPanel shows content)
    setPipelineState((prev) => ({ ...prev, stage: 'petition_ready' }));

    // 4. Write mode
    setWorkMode('write');

    // 5. Interaction state: as if user clicked [Exhibit A1, p.3]
    setFocusState({ type: 'subargument', id: 'subarg-1a' });
    setSelectedSnippetId('snip-1');
    setSelectedDocumentId('doc_A1');

    // 6. Done loading
    setIsLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <>{children}</>;
}

// ============================================
// MockPdfViewer
// Lightweight PDF-like display that shows a static page
// with a highlighted bounding box. Reports bbox position
// for ConnectionLines.
// ============================================
function MockPdfViewer() {
  const { updatePdfBboxPosition, selectedSnippetId } = useUI();
  const bboxRef = useRef<HTMLDivElement>(null);

  // Report bbox position so ConnectionLines can draw PDF→Card curves
  useEffect(() => {
    function reportPosition() {
      if (bboxRef.current && selectedSnippetId) {
        const rect = bboxRef.current.getBoundingClientRect();
        updatePdfBboxPosition(selectedSnippetId, {
          x: rect.right,
          y: rect.top + rect.height / 2,
          width: rect.width,
          height: rect.height,
        });
      }
    }
    reportPosition();
    window.addEventListener('resize', reportPosition);
    return () => window.removeEventListener('resize', reportPosition);
  }, [selectedSnippetId, updatePdfBboxPosition]);

  // Helper: render a single fake PDF page
  const renderPage = (pageNum: number, hasBbox: boolean) => (
    <div
      key={`page-${pageNum}`}
      className="bg-white rounded shadow-sm border border-slate-200 p-4 mx-auto mb-2"
      style={{ maxWidth: 480 }}
    >
      {/* Page number */}
      <div className="text-right text-[9px] text-slate-300 mb-1">p.{pageNum}</div>

      {/* Title area on first page */}
      {pageNum === 1 && (
        <div className="mb-2">
          <div className="h-[4px] bg-slate-300 rounded mb-[7px]" style={{ width: '60%' }} />
          <div className="h-[3px] bg-slate-200 rounded mb-[5px]" style={{ width: '35%' }} />
        </div>
      )}

      {/* Lines before bbox (fewer on bbox page) */}
      {Array.from({ length: hasBbox ? 3 : 10 }, (_, i) => (
        <div
          key={`b-${i}`}
          className="h-[3px] bg-slate-200 rounded mb-[7px]"
          style={{ width: `${90 - ((i * 9 + pageNum * 5) % 18)}%` }}
        />
      ))}

      {/* Highlighted bbox (only on the target page) */}
      {hasBbox && (
        <>
          <div
            ref={bboxRef}
            className="border-[1.5px] border-dashed border-purple-400 bg-purple-50/40 rounded px-3 py-2 my-1"
          >
            <div className="h-[3px] bg-slate-700 rounded mb-[5px]" style={{ width: '96%' }} />
            <div className="h-[3px] bg-slate-700 rounded mb-[5px]" style={{ width: '90%' }} />
            <div className="h-[3px] bg-slate-700 rounded mb-[5px]" style={{ width: '84%' }} />
            <div className="h-[3px] bg-slate-700 rounded" style={{ width: '70%' }} />
          </div>
          {Array.from({ length: 5 }, (_, i) => (
            <div
              key={`a-${i}`}
              className="h-[3px] bg-slate-200 rounded mb-[7px]"
              style={{ width: `${88 - ((i * 11) % 20)}%` }}
            />
          ))}
        </>
      )}
    </div>
  );

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header bar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-200 flex-shrink-0">
        <span className="text-xs font-semibold text-slate-600">PDF Preview</span>
        <span className="text-xs text-slate-400">Exhibit A1 · 5 pages</span>
      </div>

      {/* Multi-page continuous document */}
      <div className="flex-1 overflow-auto p-2 bg-slate-50">
        {renderPage(1, false)}
        {renderPage(2, false)}
        {renderPage(3, true)}
        {renderPage(4, false)}
        {renderPage(5, false)}
      </div>
    </div>
  );
}

// ============================================
// DemoProviders
// Same nesting as AppProviders but uses MockDataLoader
// instead of the real DataLoader (no backend API calls).
// ============================================
function DemoProviders({ children }: { children: ReactNode }) {
  return (
    <ProjectProvider>
      <SnippetsProvider>
        <ArgumentsProvider>
          <UIProvider>
            <WritingProvider>
              <MockDataLoader>{children}</MockDataLoader>
            </WritingProvider>
          </UIProvider>
        </ArgumentsProvider>
      </SnippetsProvider>
    </ProjectProvider>
  );
}

// ============================================
// DemoContent
// Renders the Write Mode three-panel layout.
// Layout matches MappingPage write mode exactly.
// ============================================
function DemoContent() {
  // Force English for paper figures
  const { i18n } = useTranslation();
  useEffect(() => { i18n.changeLanguage('en'); }, [i18n]);

  return (
    <div className="flex flex-col h-screen bg-slate-100">
      {/* Simplified header (no API calls, no project selector) */}
      <div className="h-10 bg-white border-b border-slate-200 flex items-center px-4 flex-shrink-0">
        <span className="text-sm font-semibold text-slate-600">
          Write Mode — Petition Letter Composition
        </span>
      </div>

      {/* Main content area — Write mode layout */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left panel (25%): Evidence Cards + PDF Preview (split 45/55) */}
        <div className="w-[25%] flex-shrink-0 border-r border-slate-200 overflow-hidden flex flex-col relative z-0">
          <div className="h-[45%] border-b border-slate-200 overflow-hidden">
            <EvidenceCardPool />
          </div>
          <div className="h-[55%] overflow-hidden">
            <MockPdfViewer />
          </div>
        </div>

        {/* Center panel (flex): Writing Tree */}
        <div className="flex-1 bg-white overflow-hidden relative z-0">
          <ArgumentGraph />
        </div>

        {/* Right panel (480px): Letter Panel */}
        <div className="w-[480px] flex-shrink-0 border-l border-slate-200 overflow-hidden relative z-0">
          <LetterPanel className="h-full" />
        </div>
      </div>

      {/* Connection Lines — SVG overlay across all panels */}
      <ConnectionLines />
    </div>
  );
}

// ============================================
// DemoPage — Entry point
// ============================================
export default function DemoPage() {
  return (
    <DemoProviders>
      <DemoContent />
    </DemoProviders>
  );
}
