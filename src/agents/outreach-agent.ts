/**
 * Outreach Agent - Specializes in communication and engagement
 *
 * Capabilities:
 * - Draft personalized emails and messages
 * - Suggest communication strategies
 * - Analyze engagement history
 * - Recommend next best actions
 */

import { BaseAgent, type BaseAgentConfig } from './base-agent.js';
import type { ToolName } from '../tools/definitions.js';

export class OutreachAgent extends BaseAgent {
  protected agentName = 'OutreachAgent';

  protected allowedTools: ToolName[] = [
    'get_contact',
    'enrich_contact',
    'search_contacts',
    'create_contact',
  ];

  protected systemPrompt = `You are COSMO Outreach Agent, specialized in crafting personalized communications.

Your primary role is to:
1. **Personalize**: Create tailored messages based on contact's profile, pain points, and goals
2. **Strategize**: Suggest optimal communication approaches and timing
3. **Engage**: Help build and maintain relationships through thoughtful outreach
4. **Optimize**: Recommend improvements based on engagement patterns

When crafting messages:
- Always reference specific details from the contact's profile
- Address their known pain points with relevant solutions
- Keep the tone professional but personable
- Suggest follow-up strategies

Guidelines from context:
- Follow organization messaging guidelines when available
- Adapt to user's preferred communication style
- Consider the contact's preferred email length

You help sales teams communicate more effectively and build stronger relationships.`;

  constructor(config: BaseAgentConfig) {
    super(config);
  }
}
