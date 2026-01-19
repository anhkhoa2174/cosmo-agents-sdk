/**
 * Tool Executor - Handles execution of COSMO tools
 */

import { CosmoApiClient } from './cosmo-api.js';
import type { ToolName } from './definitions.js';

export class ToolExecutor {
  private client: CosmoApiClient;

  constructor(client: CosmoApiClient) {
    this.client = client;
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
        case 'enroll_contact_in_playbook':
          return await this.enrollContactInPlaybook(input);
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
        default:
          return JSON.stringify({ error: `Unknown tool: ${toolName}` });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return JSON.stringify({ error: message });
    }
  }

  private async searchContacts(input: Record<string, unknown>): Promise<string> {
    const contacts = await this.client.listContacts({
      search: input.query as string,
      segment_id: input.segment_id as string | undefined,
      limit: (input.limit as number) || 10,
    });

    return JSON.stringify({
      count: contacts.length,
      contacts: contacts.map((c) => ({
        id: c.id,
        name: `${c.first_name || ''} ${c.last_name || ''}`.trim() || c.email,
        email: c.email,
        company: c.company,
        title: c.title,
      })),
    });
  }

  private async getContact(input: Record<string, unknown>): Promise<string> {
    const contact = await this.client.getContact(input.contact_id as string);

    return JSON.stringify({
      id: contact.id,
      name: `${contact.first_name || ''} ${contact.last_name || ''}`.trim(),
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
      first_name: input.first_name as string | undefined,
      last_name: input.last_name as string | undefined,
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
        name: `${c.first_name || ''} ${c.last_name || ''}`.trim() || c.email,
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
        is_active: p.is_active,
        stages_count: p.stages?.length || 0,
      })),
    });
  }

  private async getPlaybook(input: Record<string, unknown>): Promise<string> {
    const playbook = await this.client.getPlaybook(input.playbook_id as string);

    return JSON.stringify({
      id: playbook.id,
      name: playbook.name,
      description: playbook.description,
      is_active: playbook.is_active,
      stages: playbook.stages?.map((s) => ({
        id: s.id,
        name: s.name,
        type: s.type,
        delay_days: s.delay_days,
      })),
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
      const hours = parseInt(match[2], 10);
      const minutes = parseInt(match[3] || '0', 10);
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
}
