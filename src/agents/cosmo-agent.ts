/**
 * COSMO Agent - Main Claude Agent for CRM Intelligence
 *
 * This agent can:
 * - Search and manage contacts
 * - Run AI enrichment and generate insights
 * - Calculate segment fit scores
 * - Analyze relationship health
 * - Orchestrate multi-step analysis workflows
 */

import Anthropic from '@anthropic-ai/sdk';
import { CosmoApiClient, type CosmoConfig } from '../tools/cosmo-api.js';
import { COSMO_TOOLS, type ToolName } from '../tools/definitions.js';
import { ToolExecutor } from '../tools/executor.js';

export interface AgentConfig extends CosmoConfig {
  anthropicApiKey: string;
  apolloApiKey?: string;
  model?: string;
  maxIterations?: number;
}

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

const SYSTEM_PROMPT = `You are COSMO, an AI-powered CRM intelligence agent. You help sales teams understand their contacts, identify opportunities, and build relationships.

Your capabilities:
1. **Contact Intelligence**: Search contacts, view details, create new contacts
2. **AI Enrichment**: Generate AI insights like pain points, goals, and buying signals
3. **Segment Scoring**: Calculate how well contacts fit into different market segments
4. **Relationship Analysis**: Analyze engagement history and relationship health
5. **Full Analysis**: Run comprehensive analysis pipelines on contacts
6. **Contact Analytics**: Report how many contacts were added in a given day or month
7. **Apollo.io Integration**: Search for external prospects and import them into COSMO

When helping users:
- Be proactive in suggesting relevant analyses
- Explain insights in business terms, not technical jargon
- Highlight actionable next steps
- If a contact lacks insights, offer to run enrichment
- When showing scores, explain what they mean
- For analytics questions about counts by date, use the contact analytics tool with a preset (today, yesterday, this_week, last_week, this_month, last_month) whenever possible

IMPORTANT - Apollo.io Search Workflow:
When user asks to find prospects from Apollo and import to COSMO:
1. Use apollo_people_search ONCE with all filters (title, location, industry via q_keywords)
2. Immediately use import_apollo_contacts_to_cosmo with the search results
3. DO NOT call apollo_people_enrichment or apollo_get_person_email for each contact - this wastes API calls
4. DO NOT retry search with different parameters unless the first search returns 0 results
5. If search returns fewer results than requested, import what you have - don't keep searching

Examples of how to help:
- "Let me search for that contact and show you their profile"
- "I'll run a full analysis to give you the complete picture"
- "This contact has a 85% fit score for your Enterprise segment - they're a strong match"
- "The relationship score is low (25%) - I'd recommend scheduling a touchpoint"
- "You added 42 contacts on 2025-01-15"
- "I found 5 CTOs in Fintech from Apollo. Let me import them to COSMO now."

Always use the available tools to get real data. Never make up information about contacts.`;

export class CosmoAgent {
  private readonly anthropic: Anthropic;
  private readonly toolExecutor: ToolExecutor;
  private readonly model: string;
  private readonly maxIterations: number;
  private conversationHistory: Anthropic.MessageParam[] = [];

  constructor(config: AgentConfig) {
    this.anthropic = new Anthropic({
      apiKey: config.anthropicApiKey,
    });

    const apiClient = new CosmoApiClient({
      baseUrl: config.baseUrl,
      apiKey: config.apiKey,
      userId: config.userId,
      orgId: config.orgId,
    });

    this.toolExecutor = new ToolExecutor(apiClient, {
      apolloApiKey: config.apolloApiKey,
    });
    this.model = config.model || 'claude-sonnet-4-20250514';
    this.maxIterations = config.maxIterations || 10;
  }

  /**
   * Process a user message and return the agent's response
   */
  async chat(userMessage: string): Promise<string> {
    // Add user message to history
    this.conversationHistory.push({
      role: 'user',
      content: userMessage,
    });

    let response: Anthropic.Message;
    let iterations = 0;

    // Agentic loop - keep processing until no more tool calls
    while (iterations < this.maxIterations) {
      iterations++;

      response = await this.anthropic.messages.create({
        model: this.model,
        max_tokens: 4096,
        system: SYSTEM_PROMPT,
        tools: COSMO_TOOLS,
        messages: this.conversationHistory,
      });

      // Check if we need to handle tool calls
      if (response.stop_reason === 'tool_use') {
        // Extract tool use blocks
        const toolUseBlocks = response.content.filter(
          (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use'
        );

        // Add assistant's response with tool calls
        this.conversationHistory.push({
          role: 'assistant',
          content: response.content,
        });

        // Execute tools and collect results
        const toolResults: Anthropic.ToolResultBlockParam[] = [];

        for (const toolUse of toolUseBlocks) {
          console.log(`  → Executing tool: ${toolUse.name}`);

          const result = await this.toolExecutor.execute(
            toolUse.name as ToolName,
            toolUse.input as Record<string, unknown>
          );

          toolResults.push({
            type: 'tool_result',
            tool_use_id: toolUse.id,
            content: result,
          });
        }

        // Add tool results to history
        this.conversationHistory.push({
          role: 'user',
          content: toolResults,
        });

        // Continue the loop to let Claude process tool results
        continue;
      }

      // No more tool calls - extract final text response
      const textBlocks = response.content.filter(
        (block): block is Anthropic.TextBlock => block.type === 'text'
      );

      const finalResponse = textBlocks.map((b) => b.text).join('\n');

      // Add final response to history
      this.conversationHistory.push({
        role: 'assistant',
        content: finalResponse,
      });

      return finalResponse;
    }

    return 'I reached the maximum number of tool calls. Please try a simpler request.';
  }

  /**
   * Reset conversation history
   */
  resetConversation(): void {
    this.conversationHistory = [];
  }

  /**
   * Get conversation history for display
   */
  getHistory(): ConversationMessage[] {
    return this.conversationHistory
      .filter((msg): msg is Anthropic.MessageParam & { content: string } => typeof msg.content === 'string')
      .map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));
  }
}
