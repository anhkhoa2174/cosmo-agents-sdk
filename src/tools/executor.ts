/**
 * Tool Executor - Handles execution of COSMO tools
 */

import * as fs from 'fs';
import { CosmoApiClient, MeetingStatus, Language } from './cosmo-api.js';
import { ApolloApiClient } from '../mcp/apollo-client.js';
import type { ToolName } from './definitions.js';

export interface ExecutorConfig {
  apolloApiKey?: string;
}

export class ToolExecutor {
  readonly client: CosmoApiClient;
  readonly apolloClient?: ApolloApiClient;

  constructor(client: CosmoApiClient, config?: ExecutorConfig) {
    this.client = client;
    if (config?.apolloApiKey) {
      this.apolloClient = new ApolloApiClient({ apiKey: config.apolloApiKey });
    }
  }

  async execute(
    toolName: ToolName,
    input: Record<string, unknown>
  ): Promise<string> {
    try {
      switch (toolName) {
        case 'search_contacts':
          return await this.searchContacts(input);
        case 'get_contact':
          return await this.getContact(input);
        case 'create_contact':
          return await this.createContact(input);
        case 'import_contacts_csv':
          return await this.importContactsCSV(input);
        case 'import_csv_from_file':
          return await this.importCSVFromFile(input);
        case 'enrich_contact':
          return await this.enrichContact(input);
        case 'calculate_segment_scores':
          return await this.calculateSegmentScores(input);
        case 'calculate_relationship_score':
          return await this.calculateRelationshipScore(input);
        case 'list_segments':
          return await this.listSegments();
        case 'get_segment_contacts':
          return await this.getSegmentContacts(input);
        case 'create_segment':
          return await this.createSegment(input);
        case 'assign_segment_score':
          return await this.assignSegmentScore(input);
        case 'list_playbooks':
          return await this.listPlaybooks();
        case 'get_playbook':
          return await this.getPlaybook(input);
        case 'create_playbook':
          return await this.createPlaybook(input);
        case 'enroll_contact_in_playbook':
          return await this.enrollContactInPlaybook(input);
        case 'list_automation_rules':
          return await this.listAutomationRules();
        case 'create_automation_rule':
          return await this.createAutomationRule(input);
        case 'recommend_contacts_for_playbook':
          return await this.recommendContactsForPlaybook(input);
        case 'run_full_analysis':
          return await this.runFullAnalysis(input);
        case 'analyze_segment_health':
          return await this.analyzeSegmentHealth(input);
        case 'start_workflow':
          return await this.startWorkflow(input);
        case 'get_workflow_status':
          return await this.getWorkflowStatus(input);
        case 'count_contacts_created':
          return await this.countContactsCreated(input);
        case 'vector_search_contacts':
          return await this.vectorSearchContacts(input);
        case 'find_similar_contacts':
          return await this.findSimilarContacts(input);
        case 'search_knowledge':
          return await this.searchKnowledge(input);
        case 'search_interactions':
          return await this.searchInteractions(input);
        case 'find_similar_segments':
          return await this.findSimilarSegments(input);
        case 'hybrid_search_contacts':
          return await this.hybridSearchContacts(input);
        // Apollo.io tools
        case 'apollo_people_search':
          return await this.apolloPeopleSearch(input);
        case 'apollo_organization_search':
          return await this.apolloOrganizationSearch(input);
        case 'apollo_people_enrichment':
          return await this.apolloPeopleEnrichment(input);
        case 'apollo_organization_enrichment':
          return await this.apolloOrganizationEnrichment(input);
        case 'apollo_employees_of_company':
          return await this.apolloEmployeesOfCompany(input);
        case 'apollo_get_person_email':
          return await this.apolloGetPersonEmail(input);
        case 'import_apollo_contacts_to_cosmo':
          return await this.importApolloContactsToCosmo(input);
        // Outreach tools (Phase 2)
        case 'suggest_outreach':
          return await this.suggestOutreach(input);
        case 'generate_outreach_draft':
          return await this.generateOutreachDraft(input);
        case 'update_outreach':
          return await this.updateOutreach(input);
        case 'get_outreach_state':
          return await this.getOutreachState(input);
        case 'get_interaction_history':
          return await this.getInteractionHistory(input);
        case 'add_interaction':
          return await this.addInteraction(input);
        case 'create_meeting':
          return await this.createMeeting(input);
        case 'update_meeting':
          return await this.updateMeeting(input);
        case 'get_meetings':
          return await this.getMeetings(input);
        case 'generate_meeting_prep':
          return await this.generateMeetingPrep(input);
        // Notes tools (Team Conversation)
        case 'add_note':
          return await this.addNote(input);
        case 'get_notes':
          return await this.getNotes(input);
        case 'update_note':
          return await this.updateNote(input);
        case 'delete_note':
          return await this.deleteNote(input);
        default:
          return JSON.stringify({ error: `Unknown tool: ${toolName}` });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return JSON.stringify({ error: message });
    }
  }

  private async searchContacts(input: Record<string, unknown>): Promise<string> {
    const filter: Record<string, unknown> = {};

    // Text search query (searches multiple fields with OR)
    if (input.query) {
      const query = input.query as string;
      filter.$or = [
        { company: query },
        { job_title: query },
        { email: query },
        { name: query },
        { city: query },
      ];
    }

    // Specific filters (exact match)
    if (input.city) {
      filter.city = input.city as string;
    }
    if (input.country) {
      filter.country = input.country as string;
    }
    if (input.industry) {
      filter.industry = input.industry as string;
    }
    if (input.contact_channel) {
      filter.contact_channel = input.contact_channel as string;
    }
    if (input.lifecycle_stage) {
      filter.lifecycle_stage = input.lifecycle_stage as string;
    }
    if (input.status) {
      filter.status = input.status as string;
    }
    if (input.segment_id) {
      filter.segment_id = input.segment_id as string;
    }

    const result = await this.client.searchContacts(filter, 0, (input.limit as number) || 10);
    const contacts = result.list;

    return JSON.stringify({
      total: result.total,
      returned: contacts.length,
      contacts: contacts.map((item) => {
        const c = item.entity;
        return {
          id: c.id,
          name: c.name || c.email,
          email: c.email,
          company: c.company,
          title: c.title,
          city: c.city,
          country: c.country,
          industry: c.industry,
          contact_channel: c.contact_channel,
          lifecycle_stage: c.lifecycle_stage,
          status: c.status,
        };
      }),
    });
  }

  private async getContact(input: Record<string, unknown>): Promise<string> {
    const contact = await this.client.getContact(input.contact_id as string);

    return JSON.stringify({
      id: contact.id,
      name: contact.name,
      email: contact.email,
      company: contact.company,
      title: contact.title,
      linkedin_url: contact.linkedin_url,
      ai_insights: contact.ai_insights,
      relationship: contact.profile?.relationship,
    });
  }

  private async createContact(input: Record<string, unknown>): Promise<string> {
    const contact = await this.client.createContact({
      email: input.email as string,
      name: input.name as string | undefined,
      company: input.company as string | undefined,
      title: input.title as string | undefined,
      linkedin_url: input.linkedin_url as string | undefined,
    });

    return JSON.stringify({
      success: true,
      contact_id: contact.id,
      message: `Contact created: ${contact.email}`,
    });
  }

  private async enrichContact(input: Record<string, unknown>): Promise<string> {
    const result = await this.client.enrichContact(
      input.contact_id as string,
      input.force_refresh as boolean | undefined
    );

    return JSON.stringify({
      success: result.insights_generated,
      contact_id: result.contact_id,
      insights: result.ai_insights,
      message: result.insights_generated
        ? 'AI insights generated successfully'
        : 'Contact already has insights (use force_refresh to regenerate)',
    });
  }

  private async importContactsCSV(input: Record<string, unknown>): Promise<string> {
    const result = await this.client.importContactsFromCSV(
      input.csv_content as string,
      input.field_mapping as Record<string, string> | undefined
    );

    return JSON.stringify({
      success: true,
      message: result.message,
      total_rows: result.total_rows,
      imported_rows: result.imported_rows,
      skipped_rows: result.skipped_rows,
    });
  }

  private async importCSVFromFile(input: Record<string, unknown>): Promise<string> {
    const filePath = input.file_path as string;

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return JSON.stringify({
        success: false,
        error: `File not found: ${filePath}`,
      });
    }

    // Read file content
    const csvContent = fs.readFileSync(filePath, 'utf-8');

    // Import using existing method
    const result = await this.client.importContactsFromCSV(
      csvContent,
      input.field_mapping as Record<string, string> | undefined
    );

    return JSON.stringify({
      success: true,
      file_path: filePath,
      message: result.message,
      total_rows: result.total_rows,
      imported_rows: result.imported_rows,
      skipped_rows: result.skipped_rows,
    });
  }

  private async calculateSegmentScores(
    input: Record<string, unknown>
  ): Promise<string> {
    const scores = await this.client.calculateSegmentScores(
      input.contact_id as string,
      input.segment_ids as string[] | undefined
    );

    return JSON.stringify({
      contact_id: input.contact_id,
      scores: scores.map((s) => ({
        segment_name: s.segment_name,
        fit_score: s.fit_score,
        status: s.status,
        enrolled: s.enrolled_in_campaign,
      })),
      summary: `Calculated scores for ${scores.length} segments. ${
        scores.filter((s) => s.enrolled_in_campaign).length
      } auto-enrolled.`,
    });
  }

  private async calculateRelationshipScore(
    input: Record<string, unknown>
  ): Promise<string> {
    const score = await this.client.calculateRelationshipScore(
      input.contact_id as string
    );

    return JSON.stringify({
      contact_id: score.contact_id,
      strength_score: score.strength_score,
      health_score: score.health_score,
      interactions_30d: score.interactions_30d,
      interactions_90d: score.interactions_90d,
      interpretation: this.interpretRelationshipScore(score.strength_score),
    });
  }

  private interpretRelationshipScore(score: number): string {
    if (score >= 80) return 'Strong relationship - highly engaged contact';
    if (score >= 60) return 'Good relationship - regular engagement';
    if (score >= 40) return 'Moderate relationship - some engagement';
    if (score >= 20) return 'Weak relationship - minimal engagement';
    return 'Very weak relationship - needs nurturing';
  }

  private async listSegments(): Promise<string> {
    const segments = await this.client.listSegments();

    return JSON.stringify({
      count: segments.length,
      segments: segments.map((s) => ({
        id: s.id,
        name: s.name,
        description: s.description,
        is_active: s.is_active,
      })),
    });
  }

  private async getSegmentContacts(
    input: Record<string, unknown>
  ): Promise<string> {
    const [segment, contacts] = await Promise.all([
      this.client.getSegment(input.segment_id as string),
      this.client.getSegmentContacts(input.segment_id as string),
    ]);

    return JSON.stringify({
      segment: {
        id: segment.id,
        name: segment.name,
        description: segment.description,
      },
      contact_count: contacts.length,
      contacts: contacts.slice(0, 20).map((c) => ({
        id: c.id,
        name: c.name || c.email,
        email: c.email,
        company: c.company,
      })),
    });
  }

  private async createSegment(input: Record<string, unknown>): Promise<string> {
    const segment = await this.client.createSegment({
      name: input.name as string,
      description: input.description as string | undefined,
      criteria: input.criteria as Record<string, unknown> | undefined,
    });

    return JSON.stringify({
      success: true,
      segment_id: segment.id,
      name: segment.name,
      message: `Segment "${segment.name}" created successfully`,
    });
  }

  private async assignSegmentScore(input: Record<string, unknown>): Promise<string> {
    const score = await this.client.assignSegmentScore(
      input.contact_id as string,
      input.segment_id as string,
      input.fit_score as number,
      input.status as string | undefined
    );

    return JSON.stringify({
      success: true,
      contact_id: input.contact_id,
      segment_id: score.segment_id,
      fit_score: score.fit_score,
      status: score.status,
      message: `Contact assigned to segment with ${score.fit_score}% fit score`,
    });
  }

  // ============ Playbook Methods ============

  private async listPlaybooks(): Promise<string> {
    const playbooks = await this.client.listPlaybooks();

    return JSON.stringify({
      count: playbooks.length,
      playbooks: playbooks.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        playbook_type: p.playbook_type,
        is_active: p.is_active,
        stages_count: p.config?.stages?.length || 0,
        performance: p.performance,
      })),
    });
  }

  private async getPlaybook(input: Record<string, unknown>): Promise<string> {
    const playbook = await this.client.getPlaybook(input.playbook_id as string);
    const stages = playbook.config?.stages || [];

    return JSON.stringify({
      id: playbook.id,
      name: playbook.name,
      description: playbook.description,
      playbook_type: playbook.playbook_type,
      is_active: playbook.is_active,
      stages: stages.map((s) => ({
        id: s.id,
        order: s.order,
        name: s.name,
        type: s.type,
        wait_days: s.trigger_conditions?.wait_duration || 0,
        ai_prompt: s.content_config?.ai_generation_prompt,
        on_reply: s.success_criteria?.on_reply,
        on_timeout: s.success_criteria?.on_timeout,
      })),
      performance: playbook.performance,
    });
  }

  private async enrollContactInPlaybook(input: Record<string, unknown>): Promise<string> {
    const result = await this.client.enrollContactInPlaybook(
      input.contact_id as string,
      input.playbook_id as string
    );

    return JSON.stringify({
      success: true,
      contact_id: input.contact_id,
      playbook_id: input.playbook_id,
      message: result.message || 'Contact enrolled in playbook successfully',
    });
  }

  private async createPlaybook(input: Record<string, unknown>): Promise<string> {
    const stages = (input.stages as Array<Record<string, unknown>>).map((s, i) => ({
      id: `stage_${i + 1}`,
      order: (s.order as number) || i + 1,
      name: s.name as string,
      type: s.type as string,
      trigger_conditions: {
        wait_duration: (s.wait_days as number) || 0,
      },
      content_config: s.ai_prompt ? {
        ai_generation_prompt: s.ai_prompt as string,
      } : undefined,
      success_criteria: {
        on_reply: (s.on_reply as string) || 'complete',
        on_timeout: (s.on_timeout as string) || 'advance',
      },
    }));

    const playbook = await this.client.createPlaybook({
      name: input.name as string,
      description: input.description as string | undefined,
      playbook_type: input.playbook_type as 'nurture' | 'outreach' | 're_engagement' | 'upsell',
      stages: stages as any,
    });

    return JSON.stringify({
      success: true,
      playbook_id: playbook.id,
      name: playbook.name,
      stages_count: stages.length,
      message: `Playbook "${playbook.name}" created with ${stages.length} stages`,
    });
  }

  private async listAutomationRules(): Promise<string> {
    const rules = await this.client.listAutomationRules();

    return JSON.stringify({
      count: rules.length,
      rules: rules.map((r) => ({
        id: r.id,
        name: r.name,
        segment_name: r.segment_name,
        playbook_name: r.playbook_name,
        fit_score_threshold: r.enrollment_criteria.fit_score_threshold,
        require_approval: r.enrollment_criteria.require_human_approval,
        is_active: r.is_active,
        stats: r.stats,
      })),
    });
  }

  private async createAutomationRule(input: Record<string, unknown>): Promise<string> {
    const rule = await this.client.createAutomationRule({
      name: input.name as string,
      segment_id: input.segment_id as string,
      playbook_id: input.playbook_id as string,
      enrollment_criteria: {
        fit_score_threshold: input.fit_score_threshold as number,
        require_human_approval: (input.require_human_approval as boolean) ?? true,
      },
      is_active: true,
    });

    return JSON.stringify({
      success: true,
      rule_id: rule.id,
      name: rule.name,
      message: `Automation rule "${rule.name}" created. Contacts with fit score >= ${input.fit_score_threshold}% will be ${input.require_human_approval ? 'queued for approval' : 'auto-enrolled'}.`,
    });
  }

  private async recommendContactsForPlaybook(input: Record<string, unknown>): Promise<string> {
    const segmentId = input.segment_id as string;
    const minFitScore = (input.min_fit_score as number) || 70;
    const limit = (input.limit as number) || 10;

    // Get segment contacts
    const contacts = await this.client.getSegmentContacts(segmentId);

    // Filter by fit score - we need to get scores for each contact
    const recommendations: Array<{
      contact_id: string;
      name: string;
      email: string;
      company?: string;
      fit_score: number;
      reason: string;
    }> = [];

    for (const contact of contacts.slice(0, limit * 2)) {
      try {
        const scores = await this.client.calculateSegmentScores(contact.id, [segmentId]);
        const segmentScore = scores.find((s) => s.segment_id === segmentId);

        if (segmentScore && segmentScore.fit_score >= minFitScore && !segmentScore.enrolled_in_campaign) {
          recommendations.push({
            contact_id: contact.id,
            name: contact.name || contact.email,
            email: contact.email,
            company: contact.company,
            fit_score: segmentScore.fit_score,
            reason: this.generateRecommendationReason(contact, segmentScore.fit_score),
          });

          if (recommendations.length >= limit) break;
        }
      } catch {
        // Skip contacts that fail scoring
      }
    }

    return JSON.stringify({
      segment_id: segmentId,
      min_fit_score: minFitScore,
      recommendations_count: recommendations.length,
      recommendations: recommendations.sort((a, b) => b.fit_score - a.fit_score),
      message: recommendations.length > 0
        ? `Found ${recommendations.length} contacts with fit score >= ${minFitScore}%`
        : `No contacts found with fit score >= ${minFitScore}%`,
    });
  }

  private generateRecommendationReason(contact: { ai_insights?: any; company?: string; title?: string }, fitScore: number): string {
    const reasons: string[] = [];

    if (fitScore >= 90) {
      reasons.push('Excellent segment fit');
    } else if (fitScore >= 80) {
      reasons.push('Strong segment fit');
    } else {
      reasons.push('Good segment fit');
    }

    if (contact.ai_insights?.buying_signals?.length > 0) {
      reasons.push('has buying signals');
    }

    if (contact.ai_insights?.suspected_pain_points?.length > 0) {
      reasons.push('identified pain points');
    }

    return reasons.join(', ');
  }

  private async runFullAnalysis(
    input: Record<string, unknown>
  ): Promise<string> {
    const contactId = input.contact_id as string;

    // Run all three analyses in sequence
    const [enrichment, segmentScores, relationshipScore] = await Promise.all([
      this.client.enrichContact(contactId, false),
      this.client.calculateSegmentScores(contactId),
      this.client.calculateRelationshipScore(contactId),
    ]);

    const topSegments = segmentScores
      .filter((s) => s.fit_score >= 50)
      .sort((a, b) => b.fit_score - a.fit_score)
      .slice(0, 3);

    return JSON.stringify({
      contact_id: contactId,
      enrichment: {
        success: enrichment.insights_generated,
        pain_points_count: enrichment.ai_insights?.suspected_pain_points?.length || 0,
        goals_count: enrichment.ai_insights?.suspected_goals?.length || 0,
        buying_signals_count: enrichment.ai_insights?.buying_signals?.length || 0,
      },
      segment_fit: {
        total_segments: segmentScores.length,
        top_matches: topSegments.map((s) => ({
          name: s.segment_name,
          score: s.fit_score,
          enrolled: s.enrolled_in_campaign,
        })),
      },
      relationship: {
        strength: relationshipScore.strength_score,
        health: relationshipScore.health_score,
        recent_activity: relationshipScore.interactions_30d,
      },
      summary: this.generateAnalysisSummary(
        enrichment,
        topSegments,
        relationshipScore
      ),
    });
  }

  private generateAnalysisSummary(
    enrichment: { insights_generated: boolean; ai_insights?: any },
    topSegments: { segment_name: string; fit_score: number }[],
    relationship: { strength_score: number; interactions_30d: number }
  ): string {
    const parts: string[] = [];

    if (enrichment.insights_generated) {
      parts.push('New AI insights generated');
    }

    if (topSegments.length > 0) {
      parts.push(
        `Best segment match: ${topSegments[0].segment_name} (${topSegments[0].fit_score}% fit)`
      );
    }

    if (relationship.strength_score >= 60) {
      parts.push(`Strong relationship (${relationship.strength_score}%)`);
    } else if (relationship.strength_score < 30) {
      parts.push('Relationship needs nurturing');
    }

    return parts.join('. ') || 'Analysis complete';
  }

  private async analyzeSegmentHealth(
    input: Record<string, unknown>
  ): Promise<string> {
    const segmentId = input.segment_id as string;
    const [segment, contacts] = await Promise.all([
      this.client.getSegment(segmentId),
      this.client.getSegmentContacts(segmentId),
    ]);

    // Calculate segment health metrics
    const totalContacts = contacts.length;
    const withInsights = contacts.filter(
      (c) => c.ai_insights?.suspected_pain_points?.length
    ).length;
    const strongRelationships = contacts.filter(
      (c) => (c.profile?.relationship?.strength_score || 0) >= 60
    ).length;

    return JSON.stringify({
      segment: {
        id: segment.id,
        name: segment.name,
        description: segment.description,
      },
      health_metrics: {
        total_contacts: totalContacts,
        with_ai_insights: withInsights,
        insights_coverage: totalContacts
          ? Math.round((withInsights / totalContacts) * 100)
          : 0,
        strong_relationships: strongRelationships,
        relationship_health: totalContacts
          ? Math.round((strongRelationships / totalContacts) * 100)
          : 0,
      },
      recommendations: this.generateSegmentRecommendations(
        totalContacts,
        withInsights,
        strongRelationships
      ),
    });
  }

  private generateSegmentRecommendations(
    total: number,
    withInsights: number,
    strongRelationships: number
  ): string[] {
    const recommendations: string[] = [];

    if (total === 0) {
      recommendations.push('Add contacts to this segment to get started');
      return recommendations;
    }

    const insightsCoverage = (withInsights / total) * 100;
    const relationshipHealth = (strongRelationships / total) * 100;

    if (insightsCoverage < 50) {
      recommendations.push(
        'Run AI enrichment on more contacts to improve targeting'
      );
    }

    if (relationshipHealth < 30) {
      recommendations.push(
        'Schedule outreach to strengthen relationships in this segment'
      );
    }

    if (total < 10) {
      recommendations.push(
        'Consider expanding segment criteria to include more contacts'
      );
    }

    if (recommendations.length === 0) {
      recommendations.push('Segment is healthy - continue current strategy');
    }

    return recommendations;
  }

  private async countContactsCreated(
    input: Record<string, unknown>
  ): Promise<string> {
    const timezone = (input.timezone as string | undefined) || 'Asia/Ho_Chi_Minh';
    const range = this.resolveDateRange(input, timezone);
    const total = await this.client.countContactsCreated(
      range.start.toISOString(),
      range.end.toISOString()
    );

    return JSON.stringify({
      start: range.start.toISOString(),
      end: range.end.toISOString(),
      total_contacts: total,
      timezone,
    });
  }

  private resolveDateRange(input: Record<string, unknown>, timezone: string): { start: Date; end: Date } {
    const preset = input.preset as string | undefined;
    if (preset) {
      return this.resolvePresetRange(preset, timezone);
    }

    const startDate = input.start_date as string | undefined;
    const endDate = input.end_date as string | undefined;

    if (startDate && endDate) {
      return { start: new Date(startDate), end: new Date(endDate) };
    }

    const period = (input.period as string | undefined) || 'day';
    const dateStr = (input.date as string | undefined) || this.getTodayInTimezone(timezone);
    const [year, month, day] = dateStr.split('-').map((v) => Number(v));

    if (!year || !month || !day) {
      throw new Error('Invalid date format. Use YYYY-MM-DD.');
    }

    if (period === 'month') {
      const start = this.timezoneStartOfDay(year, month, 1, timezone);
      const end = this.timezoneStartOfDay(year, month + 1, 1, timezone);
      return { start, end };
    }

    if (period === 'week') {
      const weekStart = this.startOfWeekInTimezone(year, month, day, timezone);
      const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
      return { start: weekStart, end: weekEnd };
    }

    const start = this.timezoneStartOfDay(year, month, day, timezone);
    const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
    return { start, end };
  }

  private resolvePresetRange(preset: string, timezone: string): { start: Date; end: Date } {
    const todayStr = this.getTodayInTimezone(timezone);
    const [year, month, day] = todayStr.split('-').map((v) => Number(v));
    const todayStart = this.timezoneStartOfDay(year, month, day, timezone);
    const tomorrowStart = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

    switch (preset) {
      case 'today':
        return { start: todayStart, end: tomorrowStart };
      case 'yesterday': {
        const yesterdayStart = new Date(todayStart.getTime() - 24 * 60 * 60 * 1000);
        return { start: yesterdayStart, end: todayStart };
      }
      case 'this_week': {
        const weekStart = this.startOfWeekInTimezone(year, month, day, timezone);
        const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
        return { start: weekStart, end: weekEnd };
      }
      case 'last_week': {
        const thisWeekStart = this.startOfWeekInTimezone(year, month, day, timezone);
        const lastWeekStart = new Date(thisWeekStart.getTime() - 7 * 24 * 60 * 60 * 1000);
        return { start: lastWeekStart, end: thisWeekStart };
      }
      case 'this_month': {
        const start = this.timezoneStartOfDay(year, month, 1, timezone);
        const end = this.timezoneStartOfDay(year, month + 1, 1, timezone);
        return { start, end };
      }
      case 'last_month': {
        const start = this.timezoneStartOfDay(year, month - 1, 1, timezone);
        const end = this.timezoneStartOfDay(year, month, 1, timezone);
        return { start, end };
      }
      default:
        return { start: todayStart, end: tomorrowStart };
    }
  }

  /**
   * Get today's date string (YYYY-MM-DD) in the given timezone
   */
  private getTodayInTimezone(timezone: string): string {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return formatter.format(now); // Returns YYYY-MM-DD
  }

  /**
   * Get UTC Date representing start of day (00:00:00) in the given timezone
   */
  private timezoneStartOfDay(year: number, month: number, day: number, timezone: string): Date {
    // Handle month overflow/underflow
    const tempDate = new Date(Date.UTC(year, month - 1, day));
    const actualYear = tempDate.getUTCFullYear();
    const actualMonth = tempDate.getUTCMonth() + 1;
    const actualDay = tempDate.getUTCDate();

    // Create a date string in the target timezone and parse it
    const dateStr = `${actualYear}-${String(actualMonth).padStart(2, '0')}-${String(actualDay).padStart(2, '0')}T00:00:00`;

    // Get the offset for this specific date in the timezone
    const tempDateInTz = new Date(dateStr);
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      timeZoneName: 'shortOffset',
    });
    const parts = formatter.formatToParts(tempDateInTz);
    const tzPart = parts.find((p) => p.type === 'timeZoneName');
    const offsetStr = tzPart?.value || '+00:00';

    // Parse offset like "GMT+7" or "GMT-5"
    const match = offsetStr.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/);
    let offsetMinutes = 0;
    if (match) {
      const sign = match[1] === '+' ? 1 : -1;
      const hours = Number.parseInt(match[2], 10);
      const minutes = Number.parseInt(match[3] || '0', 10);
      offsetMinutes = sign * (hours * 60 + minutes);
    }

    // Create UTC date that represents start of day in target timezone
    const utcDate = new Date(Date.UTC(actualYear, actualMonth - 1, actualDay, 0, 0, 0, 0));
    utcDate.setUTCMinutes(utcDate.getUTCMinutes() - offsetMinutes);
    return utcDate;
  }

  /**
   * Get start of week (Monday) in the given timezone
   */
  private startOfWeekInTimezone(year: number, month: number, day: number, timezone: string): Date {
    const dayStart = this.timezoneStartOfDay(year, month, day, timezone);
    // Get day of week (0 = Sunday, 1 = Monday, ...)
    const tempDate = new Date(Date.UTC(year, month - 1, day));
    const dayOfWeek = tempDate.getUTCDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Monday as start of week
    return new Date(dayStart.getTime() + diff * 24 * 60 * 60 * 1000);
  }

  // ============ Workflow Methods (Temporal) ============

  private async startWorkflow(input: Record<string, unknown>): Promise<string> {
    const workflowType = input.workflow_type as string;

    let result;
    switch (workflowType) {
      case 'full_analysis': {
        const contactId = input.contact_id as string;
        if (!contactId) {
          return JSON.stringify({ error: 'contact_id is required for full_analysis workflow' });
        }
        result = await this.client.startFullAnalysisWorkflow(contactId);
        break;
      }
      case 'batch_enrichment': {
        const contactIds = input.contact_ids as string[];
        if (!contactIds || contactIds.length === 0) {
          return JSON.stringify({ error: 'contact_ids array is required for batch_enrichment workflow' });
        }
        result = await this.client.startBatchEnrichmentWorkflow(contactIds);
        break;
      }
      case 'segment_analysis': {
        const segmentId = input.segment_id as string;
        if (!segmentId) {
          return JSON.stringify({ error: 'segment_id is required for segment_analysis workflow' });
        }
        result = await this.client.startSegmentAnalysisWorkflow(segmentId);
        break;
      }
      case 'daily_analytics': {
        result = await this.client.startDailyAnalyticsWorkflow();
        break;
      }
      default:
        return JSON.stringify({ error: `Unknown workflow type: ${workflowType}` });
    }

    return JSON.stringify({
      success: true,
      workflow_id: result.workflow_id,
      run_id: result.run_id,
      status: result.status,
      message: `Workflow ${workflowType} started successfully. Use get_workflow_status to check progress.`,
    });
  }

  private async getWorkflowStatus(input: Record<string, unknown>): Promise<string> {
    const workflowId = input.workflow_id as string;
    if (!workflowId) {
      return JSON.stringify({ error: 'workflow_id is required' });
    }

    const status = await this.client.getWorkflowStatus(workflowId);

    return JSON.stringify({
      workflow_id: status.workflow_id,
      run_id: status.run_id,
      status: status.status,
      result: status.result,
      error: status.error,
      is_running: status.status === 'RUNNING',
      is_completed: status.status === 'COMPLETED',
      is_failed: status.status === 'FAILED',
    });
  }

  // ============ Vector Search Methods ============

  private async vectorSearchContacts(input: Record<string, unknown>): Promise<string> {
    const query = input.query as string;
    const limit = (input.limit as number) || 10;
    const threshold = (input.threshold as number) || 0.7;

    const result = await this.client.vectorSearchContacts(query, limit, threshold);

    return JSON.stringify({
      query: result.query,
      count: result.count,
      contacts: result.results.map((r) => ({
        contact_id: r.contact_id,
        name: r.name || r.email,
        email: r.email,
        company: r.company,
        job_title: r.job_title,
        similarity: Math.round(r.similarity * 100) / 100,
      })),
    });
  }

  private async findSimilarContacts(input: Record<string, unknown>): Promise<string> {
    const contactId = input.contact_id as string;
    const limit = (input.limit as number) || 10;
    const threshold = (input.threshold as number) || 0.7;

    const result = await this.client.findSimilarContacts(contactId, limit, threshold);

    return JSON.stringify({
      source_contact_id: contactId,
      query: result.query,
      count: result.count,
      similar_contacts: result.results.map((r) => ({
        contact_id: r.contact_id,
        name: r.name || r.email,
        email: r.email,
        company: r.company,
        job_title: r.job_title,
        similarity: Math.round(r.similarity * 100) / 100,
      })),
    });
  }

  private async searchKnowledge(input: Record<string, unknown>): Promise<string> {
    const query = input.query as string;
    const limit = (input.limit as number) || 5;
    const threshold = (input.threshold as number) || 0.6;

    const result = await this.client.searchKnowledge(query, limit, threshold);

    return JSON.stringify({
      query: result.query,
      count: result.count,
      results: result.results.map((r) => ({
        knowledge_id: r.knowledge_id,
        chunk_index: r.chunk_index,
        content: r.chunk_text,
        similarity: Math.round(r.similarity * 100) / 100,
      })),
    });
  }

  private async searchInteractions(input: Record<string, unknown>): Promise<string> {
    const query = input.query as string;
    const limit = (input.limit as number) || 20;
    const threshold = (input.threshold as number) || 0.7;

    const result = await this.client.searchInteractions(query, limit, threshold);

    return JSON.stringify({
      query: result.query,
      count: result.count,
      interactions: result.results.map((r) => ({
        interaction_id: r.interaction_id,
        contact_id: r.contact_id,
        type: r.interaction_type,
        preview: r.content_preview,
        similarity: Math.round(r.similarity * 100) / 100,
      })),
    });
  }

  private async findSimilarSegments(input: Record<string, unknown>): Promise<string> {
    const query = input.query as string;
    const limit = (input.limit as number) || 5;
    const threshold = (input.threshold as number) || 0.6;

    const result = await this.client.findSimilarSegments(query, limit, threshold);

    return JSON.stringify({
      query: result.query,
      count: result.count,
      segments: result.results.map((r) => ({
        segment_id: r.segment_id,
        name: r.segment_name,
        contact_count: r.contact_count,
        avg_fit_score: r.avg_fit_score,
        similarity: Math.round(r.similarity * 100) / 100,
      })),
    });
  }

  private async hybridSearchContacts(input: Record<string, unknown>): Promise<string> {
    const query = input.query as string;
    const keywords = (input.keywords as string[]) || [];
    const limit = (input.limit as number) || 20;

    const result = await this.client.hybridSearchContacts(query, keywords, limit);

    return JSON.stringify({
      query: result.query,
      keywords: keywords,
      count: result.count,
      contacts: result.results.map((r) => ({
        contact_id: r.contact_id,
        name: r.name || r.email,
        email: r.email,
        company: r.company,
        keyword_score: Math.round(r.keyword_score * 100) / 100,
        semantic_score: Math.round(r.semantic_score * 100) / 100,
        combined_score: Math.round(r.combined_score * 100) / 100,
      })),
    });
  }

  // ============ Apollo.io Methods ============

  private ensureApolloClient(): ApolloApiClient {
    if (!this.apolloClient) {
      throw new Error('Apollo API key not configured. Set APOLLO_IO_API_KEY environment variable or pass apolloApiKey in config.');
    }
    return this.apolloClient;
  }

  private async apolloPeopleSearch(input: Record<string, unknown>): Promise<string> {
    const apollo = this.ensureApolloClient();
    const result = await apollo.peopleSearch({
      person_titles: input.person_titles as string[] | undefined,
      include_similar_titles: input.include_similar_titles as boolean | undefined,
      q_keywords: input.q_keywords as string | undefined,
      person_locations: input.person_locations as string[] | undefined,
      person_seniorities: input.person_seniorities as string[] | undefined,
      organization_locations: input.organization_locations as string[] | undefined,
      q_organization_domains_list: input.q_organization_domains_list as string[] | undefined,
      contact_email_status: input.contact_email_status as string[] | undefined,
      organization_num_employees_ranges: input.organization_num_employees_ranges as string[] | undefined,
      page: input.page as number | undefined,
      per_page: input.per_page as number | undefined,
    });

    return JSON.stringify({
      count: result.people.length,
      pagination: result.pagination,
      people: result.people.map((p) => ({
        id: p.id,
        name: p.name || `${p.first_name || ''} ${p.last_name || ''}`.trim(),
        first_name: p.first_name,
        last_name: p.last_name,
        email: p.email,
        title: p.title,
        linkedin_url: p.linkedin_url,
        city: p.city,
        state: p.state,
        country: p.country,
        company: p.organization?.name,
        company_website: p.organization?.website_url,
        company_industry: p.organization?.industry,
        company_size: p.organization?.estimated_num_employees,
      })),
    });
  }

  private async apolloOrganizationSearch(input: Record<string, unknown>): Promise<string> {
    const apollo = this.ensureApolloClient();
    const result = await apollo.organizationSearch({
      q_organization_name: input.q_organization_name as string | undefined,
      q_organization_domains_list: input.q_organization_domains_list as string[] | undefined,
      organization_num_employees_ranges: input.organization_num_employees_ranges as string[] | undefined,
      organization_locations: input.organization_locations as string[] | undefined,
      currently_using_any_of_technology_uids: input.currently_using_any_of_technology_uids as string[] | undefined,
      revenue_range_min: input.revenue_range_min as number | undefined,
      revenue_range_max: input.revenue_range_max as number | undefined,
      page: input.page as number | undefined,
      per_page: input.per_page as number | undefined,
    });

    return JSON.stringify({
      count: result.organizations.length,
      pagination: result.pagination,
      organizations: result.organizations,
    });
  }

  private async apolloPeopleEnrichment(input: Record<string, unknown>): Promise<string> {
    const apollo = this.ensureApolloClient();
    const result = await apollo.peopleEnrichment({
      email: input.email as string | undefined,
      first_name: input.first_name as string | undefined,
      last_name: input.last_name as string | undefined,
      organization_name: input.organization_name as string | undefined,
      domain: input.domain as string | undefined,
      linkedin_url: input.linkedin_url as string | undefined,
    });

    return JSON.stringify({
      success: !!result?.person,
      person: result?.person,
    });
  }

  private async apolloOrganizationEnrichment(input: Record<string, unknown>): Promise<string> {
    const apollo = this.ensureApolloClient();
    const domain = input.domain as string;
    const result = await apollo.organizationEnrichment(domain);

    return JSON.stringify({
      success: !!result?.organization,
      organization: result?.organization,
    });
  }

  private async apolloEmployeesOfCompany(input: Record<string, unknown>): Promise<string> {
    const apollo = this.ensureApolloClient();
    const result = await apollo.employeesOfCompany({
      company: input.company as string,
      website_url: input.website_url as string | undefined,
      linkedin_url: input.linkedin_url as string | undefined,
      person_seniorities: input.person_seniorities as string | undefined,
      contact_email_status: input.contact_email_status as string | undefined,
    });

    return JSON.stringify({
      count: result.people.length,
      pagination: result.pagination,
      employees: result.people.map((p) => ({
        id: p.id,
        name: p.name || `${p.first_name || ''} ${p.last_name || ''}`.trim(),
        first_name: p.first_name,
        last_name: p.last_name,
        email: p.email,
        title: p.title,
        linkedin_url: p.linkedin_url,
      })),
    });
  }

  private async apolloGetPersonEmail(input: Record<string, unknown>): Promise<string> {
    const apollo = this.ensureApolloClient();
    const apolloId = input.apollo_id as string;
    const emails = await apollo.getPersonEmail(apolloId);

    return JSON.stringify({
      apollo_id: apolloId,
      emails: emails,
      primary_email: emails[0] || null,
    });
  }

  private async importApolloContactsToCosmo(input: Record<string, unknown>): Promise<string> {
    const apolloContacts = input.apollo_contacts as Array<{
      first_name?: string;
      last_name?: string;
      email?: string;
      title?: string;
      linkedin_url?: string;
      company?: string;
      phone?: string;
      city?: string;
      state?: string;
      country?: string;
    }>;
    // Note: tags would be handled by backend if needed
    const segmentId = input.segment_id as string | undefined;
    const playbookId = input.playbook_id as string | undefined;

    const results: Array<{
      email: string;
      success: boolean;
      contact_id?: string;
      error?: string;
    }> = [];

    for (const apolloContact of apolloContacts) {
      if (!apolloContact.email) {
        results.push({
          email: 'unknown',
          success: false,
          error: 'No email provided',
        });
        continue;
      }

      try {
        // Create contact in COSMO
        // Note: tags are passed separately to backend, not in the contact object
        // Combine Apollo's first_name and last_name into COSMO's name field
        const name = `${apolloContact.first_name || ''} ${apolloContact.last_name || ''}`.trim();
        const contact = await this.client.createContact({
          email: apolloContact.email,
          name: name || undefined,
          company: apolloContact.company,
          title: apolloContact.title,
          linkedin_url: apolloContact.linkedin_url,
        });

        // Assign to segment if provided
        if (segmentId && contact.id) {
          try {
            await this.client.assignSegmentScore(contact.id, segmentId, 80, 'active');
          } catch {
            // Continue even if segment assignment fails
          }
        }

        // Enroll in playbook if provided
        if (playbookId && contact.id) {
          try {
            await this.client.enrollContactInPlaybook(contact.id, playbookId);
          } catch {
            // Continue even if playbook enrollment fails
          }
        }

        results.push({
          email: apolloContact.email,
          success: true,
          contact_id: contact.id,
        });
      } catch (error) {
        results.push({
          email: apolloContact.email,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    const failedCount = results.filter((r) => !r.success).length;

    return JSON.stringify({
      total: apolloContacts.length,
      imported: successCount,
      failed: failedCount,
      segment_id: segmentId,
      playbook_id: playbookId,
      results: results,
      message: `Imported ${successCount} contacts from Apollo to COSMO${segmentId ? `, assigned to segment` : ''}${playbookId ? `, enrolled in playbook` : ''}`,
    });
  }

  // ============ Outreach Methods (Phase 2) ============

  private async suggestOutreach(input: Record<string, unknown>): Promise<string> {
    const type = input.type as 'cold' | 'followup' | 'mixed';
    const limit = (input.limit as number) || 50;

    const result = await this.client.suggestOutreach(type, limit);

    return JSON.stringify({
      type,
      count: result.length,
      suggestions: result.map((s: any) => ({
        contact_id: s.contact?.id,
        name: s.contact?.name || 'Unknown',
        company: s.contact?.company,
        title: s.contact?.job_title,
        type: s.type,
        state: s.state?.conversation_state,
        next_step: s.next_step,
        days_since: s.days_since,
        message_draft: s.message_draft,
      })),
    });
  }

  private async generateOutreachDraft(input: Record<string, unknown>): Promise<string> {
    const contactId = input.contact_id as string;
    const language = (input.language as Language) || 'vi';

    const result = await this.client.generateOutreachDraft(contactId, language);

    return JSON.stringify({
      contact_id: contactId,
      draft: result.draft,
      state: result.state,
      scenario: result.scenario,
      language,
    });
  }

  private async updateOutreach(input: Record<string, unknown>): Promise<string> {
    const contactId = input.contact_id as string;
    const event = input.event as string;
    const content = input.content as string | undefined;
    const channel = (input.channel as string) || 'LinkedIn';
    const sentiment = input.sentiment as string | undefined;

    await this.client.updateOutreach({
      contact_id: contactId,
      event,
      content,
      channel,
      sentiment,
    });

    return JSON.stringify({
      success: true,
      contact_id: contactId,
      event,
      message: `Outreach updated: ${event}`,
    });
  }

  private async getOutreachState(input: Record<string, unknown>): Promise<string> {
    const contactId = input.contact_id as string;

    const result = await this.client.getOutreachState(contactId);

    return JSON.stringify({
      contact_id: contactId,
      conversation_state: result.conversation_state,
      context_level: result.context_level,
      outreach_intent: result.outreach_intent,
      scenario: result.scenario,
      last_outcome: result.last_outcome,
      next_step: result.next_step,
      days_since_last_interaction: result.days_since_last_interaction,
      followup_count: result.followup_count,
      message_draft: result.message_draft,
    });
  }

  private async getInteractionHistory(input: Record<string, unknown>): Promise<string> {
    const contactId = input.contact_id as string;
    const limit = (input.limit as number) || 10;

    const result = await this.client.getInteractionHistory(contactId, limit);

    return JSON.stringify({
      contact_id: contactId,
      count: result.length,
      interactions: result.map((i: any) => ({
        id: i.id,
        channel: i.channel,
        direction: i.direction,
        content: i.content,
        sentiment: i.sentiment,
        timestamp: i.timestamp,
      })),
    });
  }

  private async addInteraction(input: Record<string, unknown>): Promise<string> {
    const contactId = input.contact_id as string;
    const direction = input.direction as 'outgoing' | 'incoming' | 'internal';
    const channel = input.channel as string;
    const content = input.content as string;
    const sentiment = input.sentiment as 'positive' | 'neutral' | 'negative' | undefined;

    const result = await this.client.addInteraction(contactId, {
      direction,
      channel,
      content,
      sentiment,
    });

    return JSON.stringify({
      success: true,
      interaction: {
        id: result.id,
        contact_id: result.contact_id,
        channel: result.channel,
        direction: result.direction,
        content: result.content,
        sentiment: result.sentiment,
        timestamp: result.timestamp,
      },
    });
  }

  private async createMeeting(input: Record<string, unknown>): Promise<string> {
    const contactId = input.contact_id as string;
    const time = input.time as string;
    const title = input.title as string | undefined;
    const durationMinutes = (input.duration_minutes as number) || 30;
    const channel = (input.channel as string) || 'Zoom';
    const meetingUrl = input.meeting_url as string | undefined;
    const note = input.note as string | undefined;

    const result = await this.client.createMeeting({
      contact_id: contactId,
      time,
      title,
      duration_minutes: durationMinutes,
      channel,
      meeting_url: meetingUrl,
      note,
    });

    return JSON.stringify({
      success: true,
      meeting_id: result.id,
      contact_id: contactId,
      time: result.time,
      channel: result.channel,
      status: result.status,
      message: `Meeting scheduled for ${time}`,
    });
  }

  private async updateMeeting(input: Record<string, unknown>): Promise<string> {
    const meetingId = input.meeting_id as string;
    const status = input.status as MeetingStatus | undefined;
    const note = input.note as string | undefined;
    const outcome = input.outcome as string | undefined;
    const nextSteps = input.next_steps as string | undefined;

    const result = await this.client.updateMeeting({
      meeting_id: meetingId,
      status,
      note,
      outcome,
      next_steps: nextSteps,
    });

    return JSON.stringify({
      success: true,
      meeting_id: meetingId,
      status: result.status,
      message: `Meeting updated to ${status}`,
    });
  }

  private async getMeetings(input: Record<string, unknown>): Promise<string> {
    const contactId = input.contact_id as string;

    const result = await this.client.getMeetings(contactId);

    return JSON.stringify({
      contact_id: contactId,
      count: result.length,
      meetings: result.map((m: any) => ({
        id: m.id,
        title: m.title,
        time: m.time,
        duration_minutes: m.duration_minutes,
        channel: m.channel,
        status: m.status,
        note: m.note,
        outcome: m.outcome,
        next_steps: m.next_steps,
      })),
    });
  }

  private async generateMeetingPrep(input: Record<string, unknown>): Promise<string> {
    const meetingId = input.meeting_id as string;
    const language = (input.language as Language) || 'vi';

    const result = await this.client.generateMeetingPrep(meetingId, language);

    return JSON.stringify({
      success: true,
      meeting_id: meetingId,
      contact_id: result.contact_id,
      title: result.title,
      time: result.time,
      status: result.status,
      meeting_prep: result.meeting_prep,
      language,
      message: `Meeting prep generated in ${language === 'en' ? 'English' : 'Vietnamese'}`,
    });
  }

  // ============ Notes Tools ============

  private async addNote(input: Record<string, unknown>): Promise<string> {
    const contactId = input.contact_id as string;
    const content = input.content as string;

    const result = await this.client.addNote(contactId, content);

    return JSON.stringify({
      message: 'Note added successfully',
      note: {
        id: result.id,
        contact_id: result.contact_id,
        content: result.content,
        timestamp: result.timestamp,
      },
    });
  }

  private async getNotes(input: Record<string, unknown>): Promise<string> {
    const contactId = input.contact_id as string;
    const limit = (input.limit as number) || 50;

    const result = await this.client.getNotes(contactId, limit);

    return JSON.stringify({
      contact_id: contactId,
      count: result.length,
      notes: result.map((n: any) => ({
        id: n.id,
        content: n.content,
        timestamp: n.timestamp,
        created_at: n.created_at,
      })),
    });
  }

  private async updateNote(input: Record<string, unknown>): Promise<string> {
    const contactId = input.contact_id as string;
    const noteId = input.note_id as string;
    const content = input.content as string;

    const result = await this.client.updateNote(contactId, noteId, content);

    return JSON.stringify({
      message: 'Note updated successfully',
      note: {
        id: result.id,
        content: result.content,
        timestamp: result.timestamp,
      },
    });
  }

  private async deleteNote(input: Record<string, unknown>): Promise<string> {
    const contactId = input.contact_id as string;
    const noteId = input.note_id as string;

    await this.client.deleteNote(contactId, noteId);

    return JSON.stringify({
      message: 'Note deleted successfully',
      contact_id: contactId,
      note_id: noteId,
    });
  }
}
