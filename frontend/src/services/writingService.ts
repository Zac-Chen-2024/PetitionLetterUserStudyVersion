/**
 * Writing Service - Unified writing API layer
 *
 * All writing API calls are funneled through this service.
 * WritingContext and ContextProviders call these methods instead of apiClient directly.
 */

import { apiClient } from './api';

export interface SentenceWithProvenance {
  text: string;
  snippet_ids: string[];
  subargument_id?: string | null;
  argument_id?: string | null;
  exhibit_refs?: string[];
  sentence_type?: 'opening' | 'body' | 'closing';
  changeStatus?: string;
  suggestedText?: string;
  changeReason?: string;
  originalText?: string;
}

export interface ProvenanceIndex {
  by_subargument: Record<string, number[]>;
  by_argument: Record<string, number[]>;
  by_snippet: Record<string, number[]>;
}

export interface ValidationResult {
  total_sentences: number;
  traced_sentences: number;
  warnings: string[];
}

export interface WritingSectionResponse {
  success: boolean;
  section: string;
  paragraph_text: string;
  sentences: SentenceWithProvenance[];
  provenance_index?: ProvenanceIndex;
  validation?: ValidationResult;
  error?: string;
  updated_subargument_snippets?: Record<string, string[]>;
}

export interface WritingSectionsListResponse {
  project_id: string;
  sections: Array<{
    section: string;
    paragraph_text: string;
    sentences: SentenceWithProvenance[];
    provenance_index?: ProvenanceIndex;
    validation?: ValidationResult;
    version_id?: string;
    timestamp?: string;
  }>;
  section_count: number;
}

/** Raw backend response (snake_case) */
interface RawImpactAnalysisResponse {
  success: boolean;
  suggestions: Array<{
    sentence_index: number;
    original_text?: string;
    suggested_text?: string;
    reason?: string;
    change_status?: string;
    change_reason?: string;
  }>;
}

/** Frontend-facing impact suggestion (camelCase) */
export interface ImpactSuggestion {
  sentenceIndex: number;
  originalText: string;
  suggestedText: string;
  reason: string;
  changeStatus?: string;
  changeReason?: string;
}

export interface ImpactAnalysisResponse {
  success: boolean;
  suggestions: ImpactSuggestion[];
}

export const writingService = {
  /** Generate/rewrite a standard's writing section */
  generateSection: (
    projectId: string,
    standardKey: string,
    options: {
      provider?: string;
      subargument_ids?: string[];
      exploration_writing?: boolean;
      additional_instructions?: string;
    } = {}
  ) =>
    apiClient.post<WritingSectionResponse>(
      `/writing/${projectId}/${standardKey}`,
      options
    ),

  /** Get all saved writing sections */
  getAllSections: (projectId: string) =>
    apiClient.get<WritingSectionsListResponse>(
      `/writing/${projectId}/sections`
    ),

  /** Analyze impact of SubArgument changes (converts snake_case → camelCase) */
  analyzeImpact: async (
    projectId: string,
    params: {
      standard_key: string;
      change_type: string;
      affected_subargument_id: string;
      affected_title?: string;
    }
  ): Promise<ImpactAnalysisResponse> => {
    const raw = await apiClient.post<RawImpactAnalysisResponse>(
      `/writing/${projectId}/analyze-impact`,
      params
    );
    return {
      success: raw.success,
      suggestions: (raw.suggestions || []).map(s => ({
        sentenceIndex: s.sentence_index,
        originalText: s.original_text || '',
        suggestedText: s.suggested_text || '',
        reason: s.reason || s.change_reason || '',
        changeStatus: s.change_status,
        changeReason: s.change_reason,
      })),
    };
  },
};

export default writingService;
