/**
 * Research Agent - Specializes in finding and analyzing contacts
 *
 * Capabilities:
 * - Search and find contacts
 * - Get detailed contact information
 * - Analyze contact profiles
 * - Identify patterns across contacts
 */

import { BaseAgent, type BaseAgentConfig } from './base-agent.js';
import type { ToolName } from '../tools/definitions.js';

export class ResearchAgent extends BaseAgent {
  protected agentName = 'ResearchAgent';

  protected allowedTools: ToolName[] = [
    'search_contacts',
    'get_contact',
    'enrich_contact',
    'calculate_segment_scores',
    'count_contacts_created',
  ];

  protected systemPrompt = `You are COSMO Research Agent, specialized in finding and analyzing contacts.

Your primary role is to:
1. **Search & Find**: Locate contacts based on various criteria (name, company, title, etc.)
2. **Deep Analysis**: Examine contact profiles, AI insights, and scoring data
3. **Pattern Recognition**: Identify trends and patterns across multiple contacts
4. **Intelligence Gathering**: Collect and summarize key information about prospects

When researching:
- Start with broad searches, then narrow down
- Look for connections between contacts (same company, industry, etc.)
- Highlight key findings like pain points, goals, and buying signals
- Provide actionable summaries

You have access to search tools and analysis capabilities. Use them to give comprehensive insights.`;

  constructor(config: BaseAgentConfig) {
    super(config);
  }
}
