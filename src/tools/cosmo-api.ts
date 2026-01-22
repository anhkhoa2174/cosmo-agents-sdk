/**
 * COSMO Backend API Client
 * Wraps COSMO backend endpoints for agent tool calls
 */

export interface CosmoConfig {
  baseUrl: string;
  apiKey: string;
  userId?: string;
  orgId?: string;
}

export interface Contact {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  company?: string;
  title?: string;
  linkedin_url?: string;
  created_at?: string;
  ai_insights?: {
    suspected_pain_points?: Array<{ pain_point: string; evidence?: string }>;
    suspected_goals?: Array<{ goal: string; evidence?: string }>;
    buying_signals?: Array<{ signal: string; strength?: string }>;
  };
  profile?: {
    relationship?: {
      strength_score: number;
      health_score: number;
    };
  };
}

export interface Segment {
  id: string;
  name: string;
  description?: string;
  criteria?: Record<string, unknown>;
  is_active: boolean;
}

export interface Playbook {
  id: string;
  name: string;
  description?: string;
  playbook_type?: PlaybookType;
  config?: PlaybookConfig;
  performance?: PlaybookPerformance;
  is_active: boolean;
  created_at?: string;
}

export type PlaybookType = 'nurture' | 'outreach' | 're_engagement' | 'upsell';
export type StageType = 'email' | 'linkedin' | 'call' | 'wait' | 'conditional';
export type SuccessAction = 'advance' | 'complete' | 'next_stage' | 'pause';

export interface PlaybookStage {
  id?: string;
  order: number;
  name: string;
  type: StageType;
  trigger_conditions: {
    wait_duration: number; // days
    wait_for_event?: string;
  };
  content_config?: {
    template?: string;
    ai_generation_prompt?: string;
  };
  success_criteria: {
    on_reply: SuccessAction;
    on_timeout: SuccessAction;
  };
}

export interface PlaybookConfig {
  stages: PlaybookStage[];
  messaging_strategy?: Record<string, unknown>;
  timing_rules?: Record<string, unknown>;
  channel_sequence?: string[];
}

export interface PlaybookPerformance {
  contacts_enrolled: number;
  total_sent: number;
  total_replies: number;
  total_meetings: number;
  reply_rate: number;
  meeting_rate: number;
}

export interface CreatePlaybookRequest {
  name: string;
  description?: string;
  playbook_type: PlaybookType;
  stages: PlaybookStage[];
}

export interface AutomationRule {
  id: string;
  name: string;
  segment_id: string;
  segment_name?: string;
  playbook_id: string;
  playbook_name?: string;
  enrollment_criteria: EnrollmentCriteria;
  is_active: boolean;
  stats?: AutomationStats;
}

export interface EnrollmentCriteria {
  fit_score_threshold: number;
  engagement_score_threshold?: number;
  require_human_approval: boolean;
}

export interface AutomationStats {
  contacts_enrolled: number;
  contacts_pending_approval: number;
  contacts_in_progress: number;
  contacts_completed: number;
}

export interface Enrollment {
  id: string;
  contact_id: string;
  playbook_id: string;
  status: 'active' | 'paused' | 'completed' | 'cancelled';
  current_stage_id?: string;
  started_at: string;
}

export interface SegmentScore {
  segment_id: string;
  segment_name: string;
  fit_score: number;
  status: string;
  enrolled_in_campaign: boolean;
}

export interface EnrichmentResult {
  contact_id: string;
  insights_generated: boolean;
  ai_insights?: Contact['ai_insights'];
}

export interface RelationshipScore {
  contact_id: string;
  strength_score: number;
  health_score: number;
  interactions_30d: number;
  interactions_90d: number;
}

// ============ Workflow Types (Temporal) ============

export interface WorkflowStartResponse {
  workflow_id: string;
  run_id: string;
  status: string;
}

export interface WorkflowStatus {
  workflow_id: string;
  run_id: string;
  status: 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELED' | 'TERMINATED' | 'CONTINUED_AS_NEW' | 'TIMED_OUT';
  result?: unknown;
  error?: string;
}

// ============ Context Types ============

export interface TargetCriteria {
  industries?: string[];
  company_sizes?: string[];
  job_titles?: string[];
  regions?: string[];
}

export interface CompanyKnowledge {
  product_name?: string;
  product_description?: string;
  value_propositions?: string[];
  use_cases?: string[];
}

export interface Competitor {
  name: string;
  differentiators?: string[];
  weaknesses?: string[];
}

export interface OrgContext {
  organization_id: string;
  icp_definition?: string;
  target_criteria?: TargetCriteria;
  company_knowledge?: CompanyKnowledge;
  common_pain_points?: string[];
  common_goals?: string[];
  competitors?: Competitor[];
  messaging_guidelines?: string;
  ai_instructions?: string;
}

export interface UserPreferences {
  default_language?: string;
  timezone?: string;
  notification_preferences?: Record<string, boolean>;
}

export interface RecentContact {
  contact_id: string;
  contact_name: string;
  last_touched: string;
  action: string;
}

export interface UserContext {
  user_id: string;
  organization_id: string;
  preferences?: UserPreferences;
  communication_style?: string;
  preferred_email_length?: string;
  personal_notes?: string;
  recent_contacts?: RecentContact[];
  ai_instructions?: string;
}

export interface MergedContext {
  merged: {
    // Org context
    icp_definition?: string;
    target_criteria?: TargetCriteria;
    company_knowledge?: CompanyKnowledge;
    common_pain_points?: string[];
    common_goals?: string[];
    competitors?: Competitor[];
    messaging_guidelines?: string;
    org_ai_instructions?: string;
    // User context
    user_preferences?: UserPreferences;
    communication_style?: string;
    preferred_email_length?: string;
    personal_notes?: string;
    recent_contacts?: RecentContact[];
    user_ai_instructions?: string;
    // Conversation
    conversation_history?: ConversationHistoryItem[];
  };
  prompt_context: string;
}

export interface ConversationHistoryItem {
  id: string;
  session_id: string;
  role: 'user' | 'assistant';
  content: string;
  contact_id?: string;
  tools_used?: string[];
  created_at: string;
}

export interface ContactSearchResponse<T = Contact> {
  list: Array<{ entity: T }>;
  total: number;
  offset: number;
  limit: number;
}

// ============ Vector Search Types ============

export interface VectorSearchContactsResponse {
  results: ContactSearchResult[];
  query: string;
  count: number;
}

export interface ContactSearchResult {
  contact_id: string;
  similarity: number;
  first_name?: string;
  last_name?: string;
  email?: string;
  company?: string;
  job_title?: string;
  metadata?: Record<string, unknown>;
}

export interface SearchKnowledgeResponse {
  results: KnowledgeSearchResult[];
  query: string;
  count: number;
}

export interface KnowledgeSearchResult {
  knowledge_id: string;
  chunk_index: number;
  chunk_text: string;
  similarity: number;
}

export interface SearchInteractionsResponse {
  results: InteractionSearchResult[];
  query: string;
  count: number;
}

export interface InteractionSearchResult {
  interaction_id: string;
  contact_id?: string;
  interaction_type?: string;
  similarity: number;
  content_preview?: string;
  metadata?: Record<string, unknown>;
}

export interface FindSimilarSegmentsResponse {
  results: SegmentSearchResult[];
  query: string;
  count: number;
}

export interface SegmentSearchResult {
  segment_id: string;
  segment_name: string;
  similarity: number;
  contact_count?: number;
  avg_fit_score?: number;
}

export interface HybridSearchResponse {
  results: HybridSearchResult[];
  query: string;
  count: number;
}

export interface HybridSearchResult {
  contact_id: string;
  keyword_score: number;
  semantic_score: number;
  combined_score: number;
  first_name?: string;
  last_name?: string;
  email?: string;
  company?: string;
  metadata?: Record<string, unknown>;
}

export class CosmoApiClient {
  readonly config: CosmoConfig;

  constructor(config: CosmoConfig) {
    this.config = config;
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown
  ): Promise<T> {
    const url = `${this.config.baseUrl}${path}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.config.apiKey}`,
    };

    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const error = await response.text();
      console.log(`  [API] Error: ${response.status} - ${error.substring(0, 100)}`);
      throw new Error(`COSMO API Error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  // ============ Contact Operations ============

  async getContact(contactId: string): Promise<Contact> {
    const result = await this.request<{ data: Contact }>(
      'GET',
      `/v1/contact/${contactId}`
    );
    return result.data;
  }

  async listContacts(params?: {
    search?: string;
    segment_id?: string;
    limit?: number;
  }): Promise<Contact[]> {
    // Use POST /v1/contacts/search with proper filter structure
    const offset = 0;
    const limit = params?.limit || 25; // Increase default to get more results

    // Build filter object
    const filter: Record<string, any> = {};

    if (params?.segment_id) {
      filter.segment_id = params.segment_id;
    }

    // Get contacts from backend
    const result = await this.searchContacts(filter, offset, limit);

    // Extract contacts from {entity: Contact} wrapper
    const contacts = result.list.map(item => item.entity);

    // If search query provided, filter results client-side
    if (params?.search) {
      const searchLower = params.search.toLowerCase();
      return contacts.filter(contact => {
        const searchableText = [
          contact.first_name,
          contact.last_name,
          contact.email,
          contact.company,
          contact.title
        ].filter(Boolean).join(' ').toLowerCase();

        return searchableText.includes(searchLower);
      });
    }

    return contacts;
  }

  async createContact(data: Partial<Contact>): Promise<Contact> {
    const result = await this.request<{ data: Contact }>(
      'POST',
      '/v1/contacts',
      data
    );
    return result.data;
  }

  async updateContact(
    contactId: string,
    data: Partial<Contact>
  ): Promise<Contact> {
    const result = await this.request<{ data: Contact }>(
      'PATCH',
      `/v1/contacts/${contactId}`,
      data
    );
    return result.data;
  }

  async searchContacts(filter: Record<string, unknown>, offset = 0, limit = 25): Promise<ContactSearchResponse> {
    const query = new URLSearchParams();
    query.set('offset', offset.toString());
    query.set('limit', limit.toString());

    const result = await this.request<{ data: ContactSearchResponse }>(
      'POST',
      `/v1/contacts/search?${query.toString()}`,
      { filter }
    );
    return result.data;
  }

  async countContactsCreated(startDate: string, endDate: string): Promise<number> {
    // Use backend filter operators: $gte, $lt (not >= or <)
    const filter = {
      created_at: {
        '$gte': startDate,
        '$lt': endDate,
      },
    };
    const result = await this.searchContacts(filter, 0, 1);
    return result.total;
  }

  /**
   * Import contacts from CSV file
   * @param csvContent - CSV content as string
   * @param fieldMapping - Optional mapping of CSV columns to contact fields.
   *                       Standard fields: first_name, last_name, email, phone, company, job_title, address, city, country, state, zip
   *                       Non-standard fields will be stored in profile (custom fields).
   *                       Example: { "Company Name": "company", "Custom Field": "profile.custom_field" }
   * @returns Import result with counts
   */
  async importContactsFromCSV(
    csvContent: string,
    fieldMapping?: Record<string, string>
  ): Promise<{ message: string; total_rows: number; imported_rows: number; skipped_rows: number }> {
    const formData = new FormData();

    // Create a Blob from the CSV content
    const csvBlob = new Blob([csvContent], { type: 'text/csv' });
    formData.append('csv_file', csvBlob, 'import.csv');

    // Add field mapping if provided
    if (fieldMapping) {
      formData.append('field_mapping', JSON.stringify(fieldMapping));
    }

    const headers: Record<string, string> = {
      'Authorization': `Bearer ${this.config.apiKey}`,
    };
    if (this.config.userId) {
      headers['X-User-ID'] = this.config.userId;
    }
    if (this.config.orgId) {
      headers['X-Org-ID'] = this.config.orgId;
    }

    const response = await fetch(`${this.config.baseUrl}/v1/contacts/import-csv`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to import CSV: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    return result.data;
  }

  // ============ Intelligence Operations ============

  async enrichContact(
    contactId: string,
    forceRefresh = false
  ): Promise<EnrichmentResult> {
    const result = await this.request<{ data: EnrichmentResult }>(
      'POST',
      `/v1/intelligence/contacts/${contactId}/enrich`,
      { force_refresh: forceRefresh }
    );
    return result.data;
  }

  async calculateSegmentScores(
    contactId: string,
    segmentIds?: string[]
  ): Promise<SegmentScore[]> {
    const result = await this.request<{ data: { scores: SegmentScore[] } }>(
      'POST',
      `/v1/intelligence/contacts/${contactId}/scores`,
      { segment_ids: segmentIds }
    );
    return result.data.scores;
  }

  async calculateRelationshipScore(
    contactId: string
  ): Promise<RelationshipScore> {
    const result = await this.request<{ data: RelationshipScore }>(
      'POST',
      `/v1/intelligence/contacts/${contactId}/relationship-score`
    );
    return result.data;
  }

  // ============ Segment Operations ============

  async listSegments(): Promise<Segment[]> {
    const result = await this.request<{ data: Segment[] }>(
      'GET',
      '/v1/segmentations'
    );
    return result.data;
  }

  async getSegment(segmentId: string): Promise<Segment> {
    const result = await this.request<{ data: Segment }>(
      'GET',
      `/v1/segmentations/${segmentId}`
    );
    return result.data;
  }

  async getSegmentContacts(segmentId: string, limit = 100): Promise<Contact[]> {
    const result = await this.request<{ data: { contacts: Contact[]; total: number } }>(
      'GET',
      `/v1/segmentations/${segmentId}/contacts?limit=${limit}`
    );
    return result.data.contacts;
  }

  async createSegment(data: { name: string; description?: string; criteria?: Record<string, unknown> }): Promise<Segment> {
    const result = await this.request<{ data: Segment }>(
      'POST',
      '/v1/segmentations',
      data
    );
    return result.data;
  }

  async assignSegmentScore(
    contactId: string,
    segmentId: string,
    fitScore: number,
    status?: string
  ): Promise<SegmentScore> {
    const result = await this.request<{ data: SegmentScore }>(
      'PUT',
      `/v1/segmentations/${segmentId}/contacts/${contactId}/score`,
      { fit_score: fitScore, status: status || 'active' }
    );
    return result.data;
  }

  // ============ Playbook Operations ============

  async listPlaybooks(): Promise<Playbook[]> {
    const result = await this.request<{ data: Playbook[] }>(
      'GET',
      '/v1/playbooks'
    );
    return result.data;
  }

  async getPlaybook(playbookId: string): Promise<Playbook> {
    const result = await this.request<{ data: Playbook }>(
      'GET',
      `/v1/playbooks/${playbookId}`
    );
    return result.data;
  }

  async enrollContactInPlaybook(contactId: string, playbookId: string): Promise<{ message: string }> {
    const result = await this.request<{ data: { message: string } }>(
      'POST',
      `/v1/contacts/${contactId}/enroll`,
      { playbook_id: playbookId }
    );
    return result.data;
  }

  async createPlaybook(data: CreatePlaybookRequest): Promise<Playbook> {
    const result = await this.request<{ data: Playbook }>(
      'POST',
      '/v1/playbooks',
      data
    );
    return result.data;
  }

  // ============ Automation Rule Operations ============

  async listAutomationRules(): Promise<AutomationRule[]> {
    const result = await this.request<{ data: AutomationRule[] }>(
      'GET',
      '/v1/automation-rules'
    );
    return result.data;
  }

  async createAutomationRule(data: {
    name: string;
    segment_id: string;
    playbook_id: string;
    enrollment_criteria: EnrollmentCriteria;
    is_active?: boolean;
  }): Promise<AutomationRule> {
    const result = await this.request<{ data: AutomationRule }>(
      'POST',
      '/v1/automation-rules',
      data
    );
    return result.data;
  }

  async toggleAutomationRule(ruleId: string): Promise<AutomationRule> {
    const result = await this.request<{ data: AutomationRule }>(
      'PATCH',
      `/v1/automation-rules/${ruleId}/toggle`
    );
    return result.data;
  }

  // ============ Orchestration ============

  async triggerContactOrchestration(
    contactId: string,
    event: string
  ): Promise<{ task_id: string }> {
    const result = await this.request<{ data: { task_id: string } }>(
      'POST',
      `/v1/orchestration/contact`,
      { contact_id: contactId, event }
    );
    return result.data;
  }

  // ============ Context Management ============

  async getOrgContext(): Promise<OrgContext> {
    const result = await this.request<{ data: OrgContext }>(
      'GET',
      '/v1/context/org'
    );
    return result.data;
  }

  async updateOrgContext(updates: Partial<OrgContext>): Promise<void> {
    await this.request('PATCH', '/v1/context/org', updates);
  }

  async getUserContext(): Promise<UserContext> {
    const result = await this.request<{ data: UserContext }>(
      'GET',
      '/v1/context/user'
    );
    return result.data;
  }

  async updateUserContext(updates: Partial<UserContext>): Promise<void> {
    await this.request('PATCH', '/v1/context/user', updates);
  }

  async getMergedContext(sessionId?: string): Promise<MergedContext> {
    const query = sessionId ? `?session_id=${sessionId}` : '';
    const result = await this.request<{ data: MergedContext }>(
      'GET',
      `/v1/context/merged${query}`
    );
    return result.data;
  }

  // ============ Conversation History ============

  async getConversationHistory(sessionId: string, limit = 20): Promise<ConversationHistoryItem[]> {
    const result = await this.request<{ data: ConversationHistoryItem[] }>(
      'GET',
      `/v1/context/history?session_id=${sessionId}&limit=${limit}`
    );
    return result.data;
  }

  async saveConversationMessage(
    sessionId: string,
    role: 'user' | 'assistant',
    content: string,
    contactId?: string,
    toolsUsed?: string[]
  ): Promise<void> {
    await this.request('POST', '/v1/context/history', {
      session_id: sessionId,
      role,
      content,
      contact_id: contactId,
      tools_used: toolsUsed,
    });
  }

  async clearConversationHistory(sessionId: string): Promise<void> {
    await this.request('DELETE', `/v1/context/history?session_id=${sessionId}`);
  }

  // ============ Workflow Operations (Temporal) ============

  async startFullAnalysisWorkflow(contactId: string): Promise<WorkflowStartResponse> {
    const result = await this.request<{ data: WorkflowStartResponse }>(
      'POST',
      '/v1/workflows/full-analysis',
      { contact_id: contactId }
    );
    return result.data;
  }

  async startBatchEnrichmentWorkflow(contactIds: string[]): Promise<WorkflowStartResponse> {
    const result = await this.request<{ data: WorkflowStartResponse }>(
      'POST',
      '/v1/workflows/batch-enrichment',
      { contact_ids: contactIds }
    );
    return result.data;
  }

  async startSegmentAnalysisWorkflow(segmentId: string): Promise<WorkflowStartResponse> {
    const result = await this.request<{ data: WorkflowStartResponse }>(
      'POST',
      '/v1/workflows/segment-analysis',
      { segment_id: segmentId }
    );
    return result.data;
  }

  async startDailyAnalyticsWorkflow(): Promise<WorkflowStartResponse> {
    const result = await this.request<{ data: WorkflowStartResponse }>(
      'POST',
      '/v1/workflows/daily-analytics',
      {}
    );
    return result.data;
  }

  async getWorkflowStatus(workflowId: string): Promise<WorkflowStatus> {
    const result = await this.request<{ data: WorkflowStatus }>(
      'GET',
      `/v1/workflows/${workflowId}/status`
    );
    return result.data;
  }

  // ============ Vector Search Operations ============

  async vectorSearchContacts(query: string, limit = 10, threshold = 1): Promise<VectorSearchContactsResponse> {
    const result = await this.request<{ data: VectorSearchContactsResponse }>(
      'POST',
      '/v1/intelligence/vector-search/contacts',
      { query, limit, threshold }
    );
    return result.data;
  }

  async findSimilarContacts(contactId: string, limit = 10, threshold = 1): Promise<VectorSearchContactsResponse> {
    const result = await this.request<{ data: VectorSearchContactsResponse }>(
      'POST',
      '/v1/intelligence/vector-search/similar',
      { contact_id: contactId, limit, threshold }
    );
    return result.data;
  }

  async searchKnowledge(query: string, limit = 5, threshold = 1): Promise<SearchKnowledgeResponse> {
    const result = await this.request<{ data: SearchKnowledgeResponse }>(
      'POST',
      '/v1/intelligence/vector-search/knowledge',
      { query, limit, threshold }
    );
    return result.data;
  }

  async searchInteractions(query: string, limit = 20, threshold = 0.7): Promise<SearchInteractionsResponse> {
    const result = await this.request<{ data: SearchInteractionsResponse }>(
      'POST',
      '/v1/intelligence/vector-search/interactions',
      { query, limit, threshold }
    );
    return result.data;
  }

  async findSimilarSegments(query: string, limit = 5, threshold = 0.6): Promise<FindSimilarSegmentsResponse> {
    const result = await this.request<{ data: FindSimilarSegmentsResponse }>(
      'POST',
      '/v1/intelligence/vector-search/segments',
      { query, limit, threshold }
    );
    return result.data;
  }

  async hybridSearchContacts(query: string, keywords: string[] = [], limit = 20): Promise<HybridSearchResponse> {
    const result = await this.request<{ data: HybridSearchResponse }>(
      'POST',
      '/v1/intelligence/vector-search/hybrid',
      { query, keywords, limit }
    );
    return result.data;
  }
}
