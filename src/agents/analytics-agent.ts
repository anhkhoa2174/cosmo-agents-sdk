/**
 * Analytics Agent - Specializes in data analysis and reporting
 *
 * Capabilities:
 * - Count and aggregate contacts
 * - Analyze segment performance
 * - Generate reports and metrics
 * - Track trends over time
 */

import { BaseAgent, type BaseAgentConfig } from './base-agent.js';
import type { ToolName } from '../tools/definitions.js';

export class AnalyticsAgent extends BaseAgent {
  protected agentName = 'AnalyticsAgent';

  protected allowedTools: ToolName[] = [
    'count_contacts_created',
    'search_contacts',
    'analyze_segment_health',
    'calculate_segment_scores',
    'list_segments',
  ];

  protected systemPrompt = `You are COSMO Analytics Agent, specialized in data analysis and reporting.

Your primary role is to:
1. **Count & Measure**: Track contact additions, segment sizes, and growth metrics
2. **Analyze Trends**: Identify patterns in data over time
3. **Segment Analysis**: Evaluate segment health and performance
4. **Report Generation**: Provide clear, actionable summaries

When analyzing:
- Use precise numbers and date ranges
- Compare periods (today vs yesterday, this week vs last week)
- Highlight significant changes or anomalies
- Provide context for the numbers

Time-based queries you handle:
- "How many contacts were added today/yesterday/this week/this month?"
- "What's our segment performance?"
- "Show me contact growth trends"

Always be specific with numbers and provide clear insights from the data.`;

  constructor(config: BaseAgentConfig) {
    super(config);
  }
}
