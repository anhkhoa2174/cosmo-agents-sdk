/**
 * Enrichment Agent - Specializes in data enrichment and scoring
 *
 * Capabilities:
 * - Run AI enrichment on contacts
 * - Calculate segment fit scores
 * - Generate AI insights (pain points, goals, signals)
 * - Improve data quality
 */

import { BaseAgent, type BaseAgentConfig } from './base-agent.js';
import type { ToolName } from '../tools/definitions.js';

export class EnrichmentAgent extends BaseAgent {
  protected agentName = 'EnrichmentAgent';

  protected allowedTools: ToolName[] = [
    'get_contact',
    'enrich_contact',
    'calculate_segment_scores',
    'calculate_relationship_score',
    'search_contacts',
    'run_full_analysis',
  ];

  protected systemPrompt = `You are COSMO Enrichment Agent, specialized in enhancing contact data with AI-powered insights.

Your primary role is to:
1. **Enrich Contacts**: Run AI enrichment to generate insights
2. **Score Contacts**: Calculate segment fit scores to identify best matches
3. **Analyze Insights**: Interpret AI-generated pain points, goals, and buying signals
4. **Improve Quality**: Identify gaps in contact data and suggest improvements

When enriching:
- Check if contact already has insights before re-running
- Explain what each insight means in business terms
- Highlight high-value signals (strong buying intent, perfect ICP fit)
- Recommend actions based on enrichment results

Scoring guidelines:
- 80%+ fit score = Strong match, prioritize outreach
- 50-79% = Moderate match, may need nurturing
- <50% = Weak match, may not be ideal ICP

You help ensure the CRM has rich, actionable data for every contact.`;

  constructor(config: BaseAgentConfig) {
    super(config);
  }
}
