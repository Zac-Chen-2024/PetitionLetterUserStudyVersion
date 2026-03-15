/**
 * Snippet Service - Snippet 管理 API
 */

import apiClient from './api';

export interface BBox {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface SnippetRegistry {
  snippet_id: string;
  document_id: string;
  exhibit_id: string;
  material_id: string;
  text: string;
  page: number;
  bbox: BBox | null;
  standard_key: string;
  source_block_ids: string[];
}

export interface SnippetLink {
  snippet_a: string;
  snippet_b: string;
  link_type: 'co-reference' | 'relation-based' | 'hybrid';
  shared_entities: string[];
  shared_relations?: string[];
  strength: number;
}

export interface SnippetStats {
  total_snippets: number;
  by_standard: Record<string, number>;
  by_exhibit: Record<string, number>;
  with_bbox: number;
  bbox_coverage: number;
}

export const snippetService = {
  getRegistry: (projectId: string) =>
    apiClient.get<{
      project_id: string;
      snippets: SnippetRegistry[];
      stats: SnippetStats;
    }>(`/snippets/${projectId}`),

  getByStandard: (projectId: string, standardKey: string) =>
    apiClient.get<{
      standard_key: string;
      snippets: SnippetRegistry[];
      count: number;
    }>(`/snippets/${projectId}/by-standard/${standardKey}`),

  mapToStandard: (projectId: string, snippetId: string, standardKey: string) =>
    apiClient.post<{
      success: boolean;
      snippet_id: string;
      new_standard_key: string;
    }>(`/snippets/${projectId}/map`, {
      snippet_id: snippetId,
      standard_key: standardKey,
    }),

  getLinks: (projectId: string) =>
    apiClient.get<{
      project_id: string;
      links: SnippetLink[];
      link_count: number;
    }>(`/snippets/${projectId}/links`),
};

export default snippetService;
