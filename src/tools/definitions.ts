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
      'Search for contacts in COSMO CRM. Returns total count of matching contacts and a paginated list. Use this to find contacts by name, email, company, city, country, industry, or other attributes. To get total count, call with no filters.',
    input_schema: {
      type: 'object' as const,
      properties: {
        query: {
          type: 'string',
          description: 'Text search query (searches name, email, company, job_title)',
        },
        city: {
          type: 'string',
          description: 'Filter by city (e.g., "Ho Chi Minh", "Ha Noi", "Da Nang")',
        },
        country: {
          type: 'string',
          description: 'Filter by country (e.g., "Vietnam", "Singapore")',
        },
        industry: {
          type: 'string',
          description: 'Filter by industry (e.g., "Fintech", "SaaS", "Healthcare")',
        },
        contact_channel: {
          type: 'string',
          description: 'Filter by contact channel (e.g., "LinkedIn", "Email")',
        },
        lifecycle_stage: {
          type: 'string',
          description: 'Filter by lifecycle stage (new, contacted, replied, qualified, proposal, won, lost)',
        },
        status: {
          type: 'string',
          description: 'Filter by status (ready, pending)',
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
      required: [],
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
        name: {
          type: 'string',
          description: 'Full name',
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

  {
    name: 'import_contacts_csv',
    description:
      'Import contacts from CSV data. Supports field mapping to map CSV columns to contact fields. Standard fields: name, email, phone, company, job_title, address, city, country, state, zip. Non-standard fields are stored as custom fields in the profile.',
    input_schema: {
      type: 'object' as const,
      properties: {
        csv_content: {
          type: 'string',
          description: 'The CSV content as a string (with headers in first row)',
        },
        field_mapping: {
          type: 'object',
          description:
            'Optional mapping of CSV column names to contact fields. Example: {"Company Name": "company", "Custom Field": "profile.custom_field"}',
          additionalProperties: { type: 'string' },
        },
      },
      required: ['csv_content'],
    },
  },
  {
    name: 'import_csv_from_file',
    description:
      'Import contacts from a CSV file path. Reads the file and imports contacts into COSMO. Use this when user provides a file path instead of CSV content directly.',
    input_schema: {
      type: 'object' as const,
      properties: {
        file_path: {
          type: 'string',
          description: 'The absolute path to the CSV file (e.g., /path/to/contacts.csv)',
        },
        field_mapping: {
          type: 'object',
          description:
            'Optional mapping of CSV column names to contact fields. Example: {"Company Name": "company"}',
          additionalProperties: { type: 'string' },
        },
      },
      required: ['file_path'],
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
    name: 'create_playbook',
    description:
      'Create a new playbook with stages for automated outreach. Each stage can be email, linkedin, call, or wait. Use this to build multi-step engagement sequences.',
    input_schema: {
      type: 'object' as const,
      properties: {
        name: {
          type: 'string',
          description: 'Playbook name (e.g., "Enterprise Cold Outreach", "Fintech Nurture Sequence")',
        },
        description: {
          type: 'string',
          description: 'Description of the playbook purpose and target audience',
        },
        playbook_type: {
          type: 'string',
          enum: ['nurture', 'outreach', 're_engagement', 'upsell'],
          description: 'Type of playbook: nurture (warm leads), outreach (cold), re_engagement (inactive), upsell (existing customers)',
        },
        stages: {
          type: 'array',
          description: 'Array of stages in the playbook',
          items: {
            type: 'object',
            properties: {
              order: { type: 'number', description: 'Stage order (1, 2, 3...)' },
              name: { type: 'string', description: 'Stage name (e.g., "Initial Email", "Follow-up")' },
              type: { type: 'string', enum: ['email', 'linkedin', 'call', 'wait'], description: 'Stage type' },
              wait_days: { type: 'number', description: 'Days to wait before this stage (0 for immediate)' },
              ai_prompt: { type: 'string', description: 'AI prompt for generating email content' },
              on_reply: { type: 'string', enum: ['advance', 'complete', 'pause'], description: 'Action when contact replies' },
              on_timeout: { type: 'string', enum: ['advance', 'complete', 'pause'], description: 'Action when no reply after wait' },
            },
            required: ['order', 'name', 'type'],
          },
        },
      },
      required: ['name', 'playbook_type', 'stages'],
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

  // ============ Automation Rule Tools ============
  {
    name: 'list_automation_rules',
    description:
      'List all automation rules. Automation rules auto-enroll contacts from a segment into a playbook based on fit score thresholds.',
    input_schema: {
      type: 'object' as const,
      properties: {},
      required: [],
    },
  },
  {
    name: 'create_automation_rule',
    description:
      'Create an automation rule to auto-enroll contacts from a segment into a playbook. Contacts with fit scores above the threshold will be enrolled automatically (or pending approval if require_human_approval is true).',
    input_schema: {
      type: 'object' as const,
      properties: {
        name: {
          type: 'string',
          description: 'Rule name (e.g., "High-fit Fintech to Outreach")',
        },
        segment_id: {
          type: 'string',
          description: 'Segment ID to watch for contacts',
        },
        playbook_id: {
          type: 'string',
          description: 'Playbook ID to enroll contacts into',
        },
        fit_score_threshold: {
          type: 'number',
          description: 'Minimum fit score (0-100) to trigger enrollment',
        },
        require_human_approval: {
          type: 'boolean',
          description: 'If true, contacts go to pending approval queue instead of auto-enrolling',
        },
      },
      required: ['name', 'segment_id', 'playbook_id', 'fit_score_threshold'],
    },
  },
  {
    name: 'recommend_contacts_for_playbook',
    description:
      'Find contacts that are good candidates for a playbook based on segment fit scores. Returns contacts with high fit scores that are not yet enrolled.',
    input_schema: {
      type: 'object' as const,
      properties: {
        segment_id: {
          type: 'string',
          description: 'Segment ID to search in',
        },
        min_fit_score: {
          type: 'number',
          description: 'Minimum fit score threshold (default: 70)',
        },
        limit: {
          type: 'number',
          description: 'Maximum contacts to return (default: 10)',
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

  // ============ Vector Search Tools ============
  {
    name: 'vector_search_contacts',
    description:
      'Search contacts using natural language semantic search. Example: "Find CTOs interested in AI and machine learning". This uses AI embeddings for intelligent matching beyond keyword search.',
    input_schema: {
      type: 'object' as const,
      properties: {
        query: {
          type: 'string',
          description: 'Natural language search query (e.g., "CTOs at fintech startups interested in automation")',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of results (default: 10, max: 50)',
        },
        threshold: {
          type: 'number',
          description: 'Minimum similarity threshold 0-1 (default: 0.7)',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'find_similar_contacts',
    description:
      'Find contacts similar to a given contact. Use case: "Show me more contacts like this high-value customer".',
    input_schema: {
      type: 'object' as const,
      properties: {
        contact_id: {
          type: 'string',
          description: 'The contact ID to find similar contacts for',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of results (default: 10)',
        },
        threshold: {
          type: 'number',
          description: 'Minimum similarity threshold 0-1 (default: 0.7)',
        },
      },
      required: ['contact_id'],
    },
  },
  {
    name: 'search_knowledge',
    description:
      'Search the knowledge base using semantic similarity. Use for RAG (Retrieval Augmented Generation) to find relevant company info, product docs, case studies, etc.',
    input_schema: {
      type: 'object' as const,
      properties: {
        query: {
          type: 'string',
          description: 'Natural language query (e.g., "enterprise pricing strategies", "customer success stories")',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of results (default: 5)',
        },
        threshold: {
          type: 'number',
          description: 'Minimum similarity threshold 0-1 (default: 0.6)',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'search_interactions',
    description:
      'Search interaction history (emails, meetings, calls) using semantic similarity. Find conversations about specific topics.',
    input_schema: {
      type: 'object' as const,
      properties: {
        query: {
          type: 'string',
          description: 'Natural language query (e.g., "discussions about contract renewal", "pricing negotiations")',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of results (default: 20)',
        },
        threshold: {
          type: 'number',
          description: 'Minimum similarity threshold 0-1 (default: 0.7)',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'find_similar_segments',
    description:
      'Find segments that match a profile or query. Use case: "Which segments would this type of contact fit into?"',
    input_schema: {
      type: 'object' as const,
      properties: {
        query: {
          type: 'string',
          description: 'Profile description or query (e.g., "VP of Engineering at SaaS companies")',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of results (default: 5)',
        },
        threshold: {
          type: 'number',
          description: 'Minimum similarity threshold 0-1 (default: 0.6)',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'hybrid_search_contacts',
    description:
      'Combine keyword and semantic search for best results. Use when you need both exact keyword matches and semantic understanding.',
    input_schema: {
      type: 'object' as const,
      properties: {
        query: {
          type: 'string',
          description: 'Natural language query for semantic matching',
        },
        keywords: {
          type: 'array',
          items: { type: 'string' },
          description: 'Exact keywords to match (e.g., ["VP", "Engineering", "SaaS"])',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of results (default: 20)',
        },
      },
      required: ['query'],
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

  // ============ Apollo.io Tools (External Data Source) ============
  {
    name: 'apollo_people_search',
    description:
      'Search for people/contacts using Apollo.io API. Find prospects by job titles, locations, industry, company details, and more. IMPORTANT: After getting results, immediately use import_apollo_contacts_to_cosmo to import them - do NOT call this search multiple times or try to enrich each contact individually.',
    input_schema: {
      type: 'object' as const,
      properties: {
        person_titles: {
          type: 'array',
          items: { type: 'string' },
          description: 'Job titles to search for (e.g., ["CEO", "CTO", "VP Engineering"])',
        },
        include_similar_titles: {
          type: 'boolean',
          description: 'Include similar job titles in results (default: true)',
        },
        q_keywords: {
          type: 'string',
          description: 'Keywords to filter results (e.g., industry keywords like "fintech", "healthcare", "saas")',
        },
        person_locations: {
          type: 'array',
          items: { type: 'string' },
          description: 'Locations where people live (e.g., ["california", "los angeles", "new york"])',
        },
        person_seniorities: {
          type: 'array',
          items: { type: 'string' },
          description: 'Seniority levels: owner, founder, c_suite, partner, vp, head, director, manager, senior, entry, intern',
        },
        organization_locations: {
          type: 'array',
          items: { type: 'string' },
          description: 'Company headquarters locations',
        },
        organization_industry_tag_ids: {
          type: 'array',
          items: { type: 'string' },
          description: 'Industry tags to filter by (e.g., ["fintech", "financial services", "banking", "healthcare", "software"])',
        },
        q_organization_domains_list: {
          type: 'array',
          items: { type: 'string' },
          description: 'Company domains (e.g., ["google.com", "microsoft.com"])',
        },
        contact_email_status: {
          type: 'array',
          items: { type: 'string' },
          description: 'Email statuses: verified, unverified, likely to engage, unavailable',
        },
        organization_num_employees_ranges: {
          type: 'array',
          items: { type: 'string' },
          description: 'Employee count ranges (e.g., ["1,10", "50,100", "1000,5000"])',
        },
        page: {
          type: 'number',
          description: 'Page number for pagination',
        },
        per_page: {
          type: 'number',
          description: 'Results per page (default: 10, max: 25)',
        },
      },
      required: [],
    },
  },
  {
    name: 'apollo_organization_search',
    description:
      'Search for companies/organizations using Apollo.io API. Find companies by name, industry, size, location, funding, and more. NOTE: If user wants to find PEOPLE at companies, use apollo_people_search directly with company filters - do NOT search organizations first then search people.',
    input_schema: {
      type: 'object' as const,
      properties: {
        q_organization_name: {
          type: 'string',
          description: 'Company name to search for',
        },
        q_organization_domains_list: {
          type: 'array',
          items: { type: 'string' },
          description: 'Company domains to search',
        },
        organization_num_employees_ranges: {
          type: 'array',
          items: { type: 'string' },
          description: 'Employee count ranges (e.g., ["1,10", "50,100"])',
        },
        organization_locations: {
          type: 'array',
          items: { type: 'string' },
          description: 'Headquarters locations',
        },
        currently_using_any_of_technology_uids: {
          type: 'array',
          items: { type: 'string' },
          description: 'Technologies the company uses (e.g., ["salesforce", "hubspot"])',
        },
        revenue_range_min: {
          type: 'number',
          description: 'Minimum revenue',
        },
        revenue_range_max: {
          type: 'number',
          description: 'Maximum revenue',
        },
        page: {
          type: 'number',
          description: 'Page number',
        },
        per_page: {
          type: 'number',
          description: 'Results per page',
        },
      },
      required: [],
    },
  },
  {
    name: 'apollo_people_enrichment',
    description:
      'Enrich a SINGLE person data using Apollo.io. Only use this when user asks to enrich ONE specific person by email/name/LinkedIn. DO NOT use this in a loop for multiple contacts - apollo_people_search already returns enriched data.',
    input_schema: {
      type: 'object' as const,
      properties: {
        email: {
          type: 'string',
          description: 'Person email address',
        },
        first_name: {
          type: 'string',
          description: 'First name',
        },
        last_name: {
          type: 'string',
          description: 'Last name',
        },
        organization_name: {
          type: 'string',
          description: 'Company name',
        },
        domain: {
          type: 'string',
          description: 'Company domain',
        },
        linkedin_url: {
          type: 'string',
          description: 'LinkedIn profile URL',
        },
      },
      required: [],
    },
  },
  {
    name: 'apollo_organization_enrichment',
    description:
      'Enrich a SINGLE company data using Apollo.io domain. Only use when user asks about ONE specific company. DO NOT use this for multiple companies.',
    input_schema: {
      type: 'object' as const,
      properties: {
        domain: {
          type: 'string',
          description: 'Company domain (e.g., "google.com")',
        },
      },
      required: ['domain'],
    },
  },
  {
    name: 'apollo_employees_of_company',
    description:
      'Find employees of ONE specific company. Only use when user asks for people at a SINGLE named company (e.g., "find engineers at Google"). For broader searches (e.g., "find CTOs in fintech"), use apollo_people_search instead.',
    input_schema: {
      type: 'object' as const,
      properties: {
        company: {
          type: 'string',
          description: 'Company name (required)',
        },
        website_url: {
          type: 'string',
          description: 'Company website URL',
        },
        linkedin_url: {
          type: 'string',
          description: 'Company LinkedIn URL',
        },
        person_seniorities: {
          type: 'string',
          description: 'Comma-separated seniorities to filter (e.g., "c_suite,vp,director")',
        },
        contact_email_status: {
          type: 'string',
          description: 'Comma-separated email statuses (e.g., "verified,likely to engage")',
        },
      },
      required: ['company'],
    },
  },
  {
    name: 'apollo_get_person_email',
    description:
      'Get email for ONE person using Apollo ID. Only use when user specifically asks for email of a single person. DO NOT use this in a loop - apollo_people_search already returns emails when available.',
    input_schema: {
      type: 'object' as const,
      properties: {
        apollo_id: {
          type: 'string',
          description: 'Apollo person ID',
        },
      },
      required: ['apollo_id'],
    },
  },

  // ============ Outreach Tools (Phase 2) ============
  {
    name: 'suggest_outreach',
    description:
      'Get suggested contacts for outreach. Returns contacts that need cold outreach, follow-up, or both. Use this to find contacts to work on today.',
    input_schema: {
      type: 'object' as const,
      properties: {
        type: {
          type: 'string',
          enum: ['cold', 'followup', 'mixed'],
          description: 'Type of outreach: cold (new contacts), followup (contacts needing follow-up), mixed (60% cold, 40% follow-up)',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of contacts to return (default: 50)',
        },
      },
      required: ['type'],
    },
  },
  {
    name: 'generate_outreach_draft',
    description:
      'Generate an AI-powered message draft for a contact based on their profile, conversation history, and outreach state. Supports English and Vietnamese.',
    input_schema: {
      type: 'object' as const,
      properties: {
        contact_id: {
          type: 'string',
          description: 'The contact ID to generate draft for',
        },
        language: {
          type: 'string',
          enum: ['en', 'vi'],
          description: 'Language for the generated draft. en=English, vi=Vietnamese. Default: vi',
        },
      },
      required: ['contact_id'],
    },
  },
  {
    name: 'update_outreach',
    description:
      'Update outreach status after sending a message, receiving a reply, or marking no reply. This logs the interaction and updates the contact state.',
    input_schema: {
      type: 'object' as const,
      properties: {
        contact_id: {
          type: 'string',
          description: 'The contact ID to update',
        },
        event: {
          type: 'string',
          enum: ['sent', 'replied', 'no_reply', 'meeting_booked', 'meeting_done', 'drop'],
          description: 'The outreach event: sent (message sent), replied (contact replied), no_reply (no response), meeting_booked, meeting_done, drop (stop outreach)',
        },
        content: {
          type: 'string',
          description: 'Message content (for sent/replied events)',
        },
        channel: {
          type: 'string',
          enum: ['LinkedIn', 'Email', 'Call', 'Meeting', 'Note'],
          description: 'Channel of interaction (default: LinkedIn)',
        },
        sentiment: {
          type: 'string',
          enum: ['positive', 'neutral', 'negative'],
          description: 'Sentiment of reply (for replied events)',
        },
      },
      required: ['contact_id', 'event'],
    },
  },
  {
    name: 'get_outreach_state',
    description:
      'Get the current outreach state for a contact including conversation state, last outcome, next step, and days since last interaction.',
    input_schema: {
      type: 'object' as const,
      properties: {
        contact_id: {
          type: 'string',
          description: 'The contact ID to get state for',
        },
      },
      required: ['contact_id'],
    },
  },
  {
    name: 'get_interaction_history',
    description:
      'Get interaction history for a contact including all sent/received messages and notes.',
    input_schema: {
      type: 'object' as const,
      properties: {
        contact_id: {
          type: 'string',
          description: 'The contact ID to get history for',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of interactions to return (default: 10)',
        },
      },
      required: ['contact_id'],
    },
  },
  {
    name: 'add_interaction',
    description:
      'Add a new interaction record for a contact. Use this to log outgoing messages, incoming replies, or internal notes.',
    input_schema: {
      type: 'object' as const,
      properties: {
        contact_id: {
          type: 'string',
          description: 'The contact ID to add interaction for',
        },
        direction: {
          type: 'string',
          enum: ['outgoing', 'incoming', 'internal'],
          description: 'Direction of the interaction: outgoing (sent to contact), incoming (received from contact), internal (team notes)',
        },
        channel: {
          type: 'string',
          description: 'Communication channel (e.g., "email", "linkedin", "phone", "meeting")',
        },
        content: {
          type: 'string',
          description: 'Content of the interaction (message text, note content, etc.)',
        },
        sentiment: {
          type: 'string',
          enum: ['positive', 'neutral', 'negative'],
          description: 'Optional sentiment analysis of the interaction',
        },
      },
      required: ['contact_id', 'direction', 'channel', 'content'],
    },
  },
  {
    name: 'create_meeting',
    description:
      'Create a meeting with a contact. Use this after a contact agrees to meet.',
    input_schema: {
      type: 'object' as const,
      properties: {
        contact_id: {
          type: 'string',
          description: 'The contact ID to create meeting with',
        },
        title: {
          type: 'string',
          description: 'Meeting title',
        },
        time: {
          type: 'string',
          description: 'Meeting time in ISO format (e.g., "2026-01-25T10:00:00Z")',
        },
        duration_minutes: {
          type: 'number',
          description: 'Meeting duration in minutes (default: 30)',
        },
        channel: {
          type: 'string',
          enum: ['Zoom', 'Google Meet', 'Call', 'Offline'],
          description: 'Meeting channel (default: Zoom)',
        },
        meeting_url: {
          type: 'string',
          description: 'Meeting URL (e.g., Zoom link)',
        },
        note: {
          type: 'string',
          description: 'Meeting note or agenda',
        },
      },
      required: ['contact_id', 'time'],
    },
  },
  {
    name: 'update_meeting',
    description:
      'Update a meeting status (completed, cancelled) and add notes/outcome.',
    input_schema: {
      type: 'object' as const,
      properties: {
        meeting_id: {
          type: 'string',
          description: 'The meeting ID to update',
        },
        status: {
          type: 'string',
          enum: ['scheduled', 'completed', 'cancelled', 'no_show'],
          description: 'New meeting status',
        },
        note: {
          type: 'string',
          description: 'Meeting notes',
        },
        outcome: {
          type: 'string',
          description: 'Meeting outcome summary',
        },
        next_steps: {
          type: 'string',
          description: 'Agreed next steps',
        },
      },
      required: ['meeting_id', 'status'],
    },
  },
  {
    name: 'get_meetings',
    description:
      'Get all meetings for a contact.',
    input_schema: {
      type: 'object' as const,
      properties: {
        contact_id: {
          type: 'string',
          description: 'The contact ID to get meetings for',
        },
      },
      required: ['contact_id'],
    },
  },
  {
    name: 'generate_meeting_prep',
    description:
      'Generate an AI meeting preparation document with meeting objectives, talking points, discovery questions, potential objections, and suggested next steps. Only works for scheduled meetings. Supports English and Vietnamese.',
    input_schema: {
      type: 'object' as const,
      properties: {
        meeting_id: {
          type: 'string',
          description: 'The meeting ID to generate prep for',
        },
        language: {
          type: 'string',
          enum: ['en', 'vi'],
          description: 'Language for the meeting prep. en=English, vi=Vietnamese. Default: vi',
        },
      },
      required: ['meeting_id'],
    },
  },

  // ============ Notes Tools (Team Conversation History) ============
  {
    name: 'add_note',
    description:
      'Add an internal team note for a contact. Notes are internal and not visible to the contact - use for tracking internal discussions, observations, or important information.',
    input_schema: {
      type: 'object' as const,
      properties: {
        contact_id: {
          type: 'string',
          description: 'The contact ID to add the note for',
        },
        content: {
          type: 'string',
          description: 'The note content (can be multi-line, markdown supported)',
        },
      },
      required: ['contact_id', 'content'],
    },
  },
  {
    name: 'get_notes',
    description:
      'Get all internal team notes for a contact. Returns notes in reverse chronological order.',
    input_schema: {
      type: 'object' as const,
      properties: {
        contact_id: {
          type: 'string',
          description: 'The contact ID to get notes for',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of notes to return (default: 50)',
        },
      },
      required: ['contact_id'],
    },
  },
  {
    name: 'update_note',
    description:
      'Update an existing internal note.',
    input_schema: {
      type: 'object' as const,
      properties: {
        contact_id: {
          type: 'string',
          description: 'The contact ID',
        },
        note_id: {
          type: 'string',
          description: 'The note ID to update',
        },
        content: {
          type: 'string',
          description: 'The new note content',
        },
      },
      required: ['contact_id', 'note_id', 'content'],
    },
  },
  {
    name: 'delete_note',
    description:
      'Delete an internal note.',
    input_schema: {
      type: 'object' as const,
      properties: {
        contact_id: {
          type: 'string',
          description: 'The contact ID',
        },
        note_id: {
          type: 'string',
          description: 'The note ID to delete',
        },
      },
      required: ['contact_id', 'note_id'],
    },
  },

  // ============ Apollo to COSMO Import Tools ============
  {
    name: 'import_apollo_contacts_to_cosmo',
    description:
      'Import contacts from Apollo.io search results into COSMO CRM. Use this IMMEDIATELY after apollo_people_search - pass the search results directly without any additional enrichment or email lookups. This tool handles batch import efficiently.',
    input_schema: {
      type: 'object' as const,
      properties: {
        apollo_contacts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              first_name: { type: 'string' },
              last_name: { type: 'string' },
              email: { type: 'string' },
              title: { type: 'string' },
              linkedin_url: { type: 'string' },
              company: { type: 'string' },
              phone: { type: 'string' },
              city: { type: 'string' },
              state: { type: 'string' },
              country: { type: 'string' },
            },
          },
          description: 'Array of contacts from Apollo search results',
        },
        tags: {
          type: 'object',
          additionalProperties: { type: 'string' },
          description: 'Tags to apply to imported contacts (e.g., {"source": "apollo", "campaign": "q1_outreach"})',
        },
        segment_id: {
          type: 'string',
          description: 'Optional segment ID to assign contacts to',
        },
        playbook_id: {
          type: 'string',
          description: 'Optional playbook ID to enroll contacts in',
        },
      },
      required: ['apollo_contacts'],
    },
  },
];

export type ToolName =
  | 'search_contacts'
  | 'get_contact'
  | 'create_contact'
  | 'import_contacts_csv'
  | 'import_csv_from_file'
  | 'enrich_contact'
  | 'calculate_segment_scores'
  | 'calculate_relationship_score'
  | 'list_segments'
  | 'get_segment_contacts'
  | 'create_segment'
  | 'assign_segment_score'
  | 'list_playbooks'
  | 'get_playbook'
  | 'create_playbook'
  | 'enroll_contact_in_playbook'
  | 'list_automation_rules'
  | 'create_automation_rule'
  | 'recommend_contacts_for_playbook'
  | 'run_full_analysis'
  | 'analyze_segment_health'
  | 'start_workflow'
  | 'get_workflow_status'
  | 'vector_search_contacts'
  | 'find_similar_contacts'
  | 'search_knowledge'
  | 'search_interactions'
  | 'find_similar_segments'
  | 'hybrid_search_contacts'
  | 'count_contacts_created'
  | 'count_contacts_by_keyword'
  // Outreach tools (Phase 2)
  | 'suggest_outreach'
  | 'generate_outreach_draft'
  | 'update_outreach'
  | 'get_outreach_state'
  | 'get_interaction_history'
  | 'add_interaction'
  | 'create_meeting'
  | 'update_meeting'
  | 'get_meetings'
  | 'generate_meeting_prep'
  // Notes tools (Team Conversation)
  | 'add_note'
  | 'get_notes'
  | 'update_note'
  | 'delete_note'
  // Apollo.io tools
  | 'apollo_people_search'
  | 'apollo_organization_search'
  | 'apollo_people_enrichment'
  | 'apollo_organization_enrichment'
  | 'apollo_employees_of_company'
  | 'apollo_get_person_email'
  | 'import_apollo_contacts_to_cosmo';
