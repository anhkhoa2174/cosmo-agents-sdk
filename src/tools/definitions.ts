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
  {
    name: 'create_segment',
    description:
      'Create a new segment to group contacts by criteria. Segments can be used for campaigns, targeting, and analytics.',
    input_schema: {
      type: 'object' as const,
      properties: {
        name: {
          type: 'string',
          description: 'Segment name (e.g., "Enterprise Tech Leaders", "High Intent Fintech")',
        },
        description: {
          type: 'string',
          description: 'Description of the segment criteria and purpose',
        },
        criteria: {
          type: 'object',
          description: 'Optional filter criteria for auto-matching contacts',
        },
      },
      required: ['name'],
    },
  },
  {
    name: 'assign_segment_score',
    description:
      'Assign or update a fit score for a contact in a segment. Use this to manually enroll contacts into segments or update their scores.',
    input_schema: {
      type: 'object' as const,
      properties: {
        contact_id: {
          type: 'string',
          description: 'The contact ID',
        },
        segment_id: {
          type: 'string',
          description: 'The segment ID to assign to',
        },
        fit_score: {
          type: 'number',
          description: 'Fit score from 0-100 (higher = better match)',
        },
        status: {
          type: 'string',
          enum: ['active', 'pending', 'excluded'],
          description: 'Status of the contact in this segment',
        },
      },
      required: ['contact_id', 'segment_id', 'fit_score'],
    },
  },

  // ============ Playbook Tools ============
  {
    name: 'list_playbooks',
    description:
      'List all playbooks in COSMO. Playbooks are automated sequences of actions for engaging contacts (emails, tasks, etc.).',
    input_schema: {
      type: 'object' as const,
      properties: {},
      required: [],
    },
  },
  {
    name: 'get_playbook',
    description:
      'Get details of a specific playbook including its stages and actions.',
    input_schema: {
      type: 'object' as const,
      properties: {
        playbook_id: {
          type: 'string',
          description: 'The playbook ID',
        },
      },
      required: ['playbook_id'],
    },
  },
  {
    name: 'enroll_contact_in_playbook',
    description:
      'Enroll a contact in a playbook to start automated outreach. The playbook will execute its stages (emails, tasks) for this contact.',
    input_schema: {
      type: 'object' as const,
      properties: {
        contact_id: {
          type: 'string',
          description: 'The contact ID to enroll',
        },
        playbook_id: {
          type: 'string',
          description: 'The playbook ID to enroll in',
        },
      },
      required: ['contact_id', 'playbook_id'],
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
  // ============ Workflow Tools (Temporal) ============
  {
    name: 'start_workflow',
    description:
      'Start a Temporal workflow for complex, long-running operations. Available workflows: full_analysis (comprehensive contact analysis), batch_enrichment (enrich multiple contacts), segment_analysis (analyze segment health), daily_analytics (run daily analytics report).',
    input_schema: {
      type: 'object' as const,
      properties: {
        workflow_type: {
          type: 'string',
          enum: ['full_analysis', 'batch_enrichment', 'segment_analysis', 'daily_analytics'],
          description: 'Type of workflow to run',
        },
        contact_id: {
          type: 'string',
          description: 'Contact ID (required for full_analysis)',
        },
        contact_ids: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of contact IDs (required for batch_enrichment)',
        },
        segment_id: {
          type: 'string',
          description: 'Segment ID (required for segment_analysis)',
        },
      },
      required: ['workflow_type'],
    },
  },
  {
    name: 'get_workflow_status',
    description:
      'Check the status of a running Temporal workflow. Returns current status, progress, and result if completed.',
    input_schema: {
      type: 'object' as const,
      properties: {
        workflow_id: {
          type: 'string',
          description: 'The workflow ID returned from start_workflow',
        },
      },
      required: ['workflow_id'],
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
  {
    name: 'count_contacts_by_keyword',
    description:
      'Count contacts matching a keyword across common fields (company, job title, headline/about). Example: "fintech".',
    input_schema: {
      type: 'object' as const,
      properties: {
        keyword: {
          type: 'string',
          description: 'Keyword to match (case-insensitive).',
        },
      },
      required: ['keyword'],
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
  | 'create_segment'
  | 'assign_segment_score'
  | 'list_playbooks'
  | 'get_playbook'
  | 'enroll_contact_in_playbook'
  | 'run_full_analysis'
  | 'analyze_segment_health'
  | 'start_workflow'
  | 'get_workflow_status'
  | 'count_contacts_created'
  | 'count_contacts_by_keyword';
