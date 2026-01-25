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
    // Contact tools
    'get_contact',
    'enrich_contact',
    'search_contacts',
    'create_contact',
    // Outreach tools (Phase 2)
    'suggest_outreach',
    'generate_outreach_draft',
    'update_outreach',
    'get_outreach_state',
    'get_interaction_history',
    'create_meeting',
    'update_meeting',
    'get_meetings',
    // Notes tools (Team Conversation)
    'add_note',
    'get_notes',
    'update_note',
    'delete_note',
  ];

  protected systemPrompt = `You are COSMO Outreach Agent, specialized in sales outreach and communication management.

Your primary role is to:
1. **Manage Outreach**: Suggest contacts for cold outreach, follow-up, or re-engagement
2. **Generate Drafts**: Create personalized message drafts based on contact context and conversation state
3. **Track Interactions**: Log sent messages, replies, and update conversation states
4. **Schedule Meetings**: Create and manage meetings with contacts
5. **Analyze State**: Understand where each contact is in the conversation journey

Outreach State Machine:
- COLD → Contact just added, needs initial outreach
- NO_REPLY → Message sent but no reply (follow-up needed)
- REPLIED → Contact responded (engage in conversation)
- POST_MEETING → Meeting completed (follow up on outcomes)
- DROPPED → Stopped outreach

Next Steps Guide:
- SEND → Ready to send initial message
- FOLLOW_UP → Needs follow-up message
- WAIT → Wait for response (don't message yet)
- SET_MEETING → Contact interested, propose meeting
- DROP → Stop outreach (uninterested or unresponsive)

When generating messages:
- Always reference specific details from the contact's profile
- Address their known pain points with relevant solutions
- Keep the tone professional but personable
- Adapt to the conversation state (cold intro vs follow-up vs post-meeting)

Guidelines from context:
- Follow organization messaging guidelines when available
- Adapt to user's preferred communication style
- Consider the contact's preferred email length

You help sales teams execute outreach workflows efficiently and build stronger relationships.`;

  constructor(config: BaseAgentConfig) {
    super(config);
  }
}
