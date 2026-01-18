/**
 * Claude Tool Definitions for COSMO Agents
 * These tools allow Claude to interact with COSMO CRM
 */

import type Anthropic from '@anthropic-ai/sdk';

export const COSMO_TOOLS: Anthropic.Tool[] = [
  // ============ Contact Tools ============
  {
    name: 'search_contacts',
    description:
      'Search for contacts in COSMO CRM. Use this to find contacts by name, email, company, or other attributes.',
    input_schema: {
      type: 'object' as const,
      properties: {
        query: {
          type: 'string',
          description: 'Search query (name, email, company)',
        },
        segment_id: {
          type: 'string',
          description: 'Optional: Filter by segment ID',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of results (default: 10)',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_contact',
    description:
      'Get detailed information about a specific contact including AI insights, relationship scores, and segment membership.',
    input_schema: {
      type: 'object' as const,
      properties: {
        contact_id: {
          type: 'string',
          description: 'The contact ID',
        },
      },
      required: ['contact_id'],
    },
  },
  {
    name: 'create_contact',
    description: 'Create a new contact in COSMO CRM.',
    input_schema: {
      type: 'object' as const,
      properties: {
        email: {
          type: 'string',
          description: 'Contact email (required)',
        },
        first_name: {
          type: 'string',
          description: 'First name',
        },
        last_name: {
          type: 'string',
          description: 'Last name',
        },
        company: {
          type: 'string',
          description: 'Company name',
        },
        title: {
          type: 'string',
          description: 'Job title',
        },
        linkedin_url: {
          type: 'string',
          description: 'LinkedIn profile URL',
        },
      },
      required: ['email'],
    },
  },

  // ============ Intelligence Tools ============
  {
    name: 'enrich_contact',
    description:
      'Run AI enrichment on a contact to generate insights like pain points, goals, and buying signals. This uses AI to analyze the contact profile and generate actionable intelligence.',
    input_schema: {
      type: 'object' as const,
      properties: {
        contact_id: {
          type: 'string',
          description: 'The contact ID to enrich',
        },
        force_refresh: {
          type: 'boolean',
          description: 'Force re-run enrichment even if insights exist',
        },
      },
      required: ['contact_id'],
    },
  },
  {
    name: 'calculate_segment_scores',
    description:
      'Calculate fit scores for a contact against all segments or specific segments. Returns how well the contact matches each segment criteria. High scores may auto-enroll the contact.',
    input_schema: {
      type: 'object' as const,
      properties: {
        contact_id: {
          type: 'string',
          description: 'The contact ID to score',
        },
        segment_ids: {
          type: 'array',
          items: { type: 'string' },
          description: 'Optional: Specific segment IDs to score against',
        },
      },
      required: ['contact_id'],
    },
  },
  {
    name: 'calculate_relationship_score',
    description:
      'Calculate relationship strength and health scores based on interaction history (emails, meetings, replies). Returns metrics for the last 30 and 90 days.',
    input_schema: {
      type: 'object' as const,
      properties: {
        contact_id: {
          type: 'string',
          description: 'The contact ID to analyze',
        },
      },
      required: ['contact_id'],
    },
  },

  // ============ Segment Tools ============
  {
    name: 'list_segments',
    description:
      'List all segments in COSMO. Segments are used to group contacts by criteria like industry, company size, engagement level.',
    input_schema: {
      type: 'object' as const,
      properties: {},
      required: [],
    },
  },
  {
    name: 'get_segment_contacts',
    description:
      'Get all contacts enrolled in a specific segment.',
    input_schema: {
      type: 'object' as const,
      properties: {
        segment_id: {
          type: 'string',
          description: 'The segment ID',
        },
      },
      required: ['segment_id'],
    },
  },

  // ============ Orchestration Tools ============
  {
    name: 'run_full_analysis',
    description:
      'Run a complete analysis pipeline on a contact: enrichment → segment scoring → relationship scoring. Use this to get comprehensive intelligence on a contact.',
    input_schema: {
      type: 'object' as const,
      properties: {
        contact_id: {
          type: 'string',
          description: 'The contact ID to analyze',
        },
      },
      required: ['contact_id'],
    },
  },
  {
    name: 'analyze_segment_health',
    description:
      'Analyze the health of a segment: average fit scores, engagement levels, and recommendations for improvement.',
    input_schema: {
      type: 'object' as const,
      properties: {
        segment_id: {
          type: 'string',
          description: 'The segment ID to analyze',
        },
      },
      required: ['segment_id'],
    },
  },
  // ============ Analytics Tools ============
  {
    name: 'count_contacts_created',
    description:
      'Count how many contacts were created in a specific time range. Use presets for relative time (today, yesterday, this_week, last_week, this_month, last_month). Default timezone is Asia/Ho_Chi_Minh (UTC+7).',
    input_schema: {
      type: 'object' as const,
      properties: {
        preset: {
          type: 'string',
          enum: ['today', 'yesterday', 'this_week', 'last_week', 'this_month', 'last_month'],
          description: 'Relative time preset (preferred for natural language queries).',
        },
        start_date: {
          type: 'string',
          description: 'Start datetime (ISO 8601). If omitted, use period + date.',
        },
        end_date: {
          type: 'string',
          description: 'End datetime (ISO 8601, exclusive). If omitted, use period + date.',
        },
        period: {
          type: 'string',
          enum: ['day', 'week', 'month'],
          description: 'Convenience period when start/end are not provided.',
        },
        date: {
          type: 'string',
          description: 'Base date (YYYY-MM-DD) for period calculations.',
        },
        timezone: {
          type: 'string',
          description: 'IANA timezone name (e.g., Asia/Ho_Chi_Minh, America/New_York). Default: Asia/Ho_Chi_Minh.',
        },
      },
      required: [],
    },
  },
];

export type ToolName =
  | 'search_contacts'
  | 'get_contact'
  | 'create_contact'
  | 'enrich_contact'
  | 'calculate_segment_scores'
  | 'calculate_relationship_score'
  | 'list_segments'
  | 'get_segment_contacts'
  | 'run_full_analysis'
  | 'analyze_segment_health'
  | 'count_contacts_created';
