/**
 * Agent Orchestrator - Coordinates multiple specialized agents
 *
 * Enables agents to delegate tasks to each other:
 * - Research Agent can gather information
 * - Outreach Agent can write emails
 * - Analytics Agent can analyze data
 * - Enrichment Agent can enrich contacts
 *
 * The orchestrator routes requests to the appropriate agent
 * and allows agents to call each other through a delegation tool.
 */

import Anthropic from '@anthropic-ai/sdk';
import { CosmoApiClient, type CosmoConfig, type MergedContext } from '../tools/cosmo-api.js';
import { COSMO_TOOLS, type ToolName } from '../tools/definitions.js';
import { ToolExecutor } from '../tools/executor.js';
import { v4 as uuidv4 } from 'uuid';

// Agent types
export type AgentType = 'orchestrator' | 'research' | 'outreach' | 'analytics' | 'enrichment';

export interface OrchestratorConfig extends CosmoConfig {
  anthropicApiKey: string;
  model?: string;
  maxIterations?: number;
  sessionId?: string;
  persistHistory?: boolean;
}

export interface AgentMessage {
  agentType: AgentType;
  content: string;
  toolsUsed?: string[];
}

export interface OrchestratorResult {
  response: string;
  agentMessages: AgentMessage[];
  toolsUsed: string[];
  sessionId: string;
}

// Agent definitions with their roles and tools
const AGENT_DEFINITIONS: Record<AgentType, { name: string; prompt: string; tools: ToolName[] }> = {
  orchestrator: {
    name: 'Orchestrator',
    prompt: `You are COSMO Orchestrator, the main coordinator for a team of specialized AI agents.

Your role is to:
1. Understand user requests and break them into subtasks
2. Delegate tasks to the right specialized agent
3. Combine results from multiple agents into coherent responses
4. Ensure tasks are completed efficiently

Available agents you can delegate to:
- **research**: Finds and analyzes contacts, searches database, gathers intelligence
- **outreach**: Writes personalized emails, crafts messages, enrolls contacts in playbooks
- **analytics**: Analyzes data, counts contacts, generates reports, segment health
- **enrichment**: Enriches contacts with AI insights, calculates scores, creates segments

Use the delegate_to_agent tool to assign tasks. You can also use regular tools directly for simple tasks.

Example workflows:
- "Research John and write him an email" → delegate to research, then outreach
- "How many contacts this week?" → delegate to analytics
- "Enrich this contact and add to a segment" → delegate to enrichment
- "Create a segment for fintech and enroll contacts in playbook" → delegate to enrichment, then outreach`,
    tools: [
      'search_contacts',
      'get_contact',
      'create_contact',
      'list_segments',
      'list_playbooks',
    ],
  },
  research: {
    name: 'Research Agent',
    prompt: `You are COSMO Research Agent, specialized in finding and analyzing contacts.

Your primary role is to:
1. Search and find contacts based on criteria
2. Analyze contact profiles and AI insights
3. Identify patterns and connections
4. Provide comprehensive intelligence summaries

Always use your tools to get real data. Be thorough in your research.`,
    tools: [
      'search_contacts',
      'get_contact',
      'enrich_contact',
      'calculate_segment_scores',
      'list_segments',
      'get_segment_contacts',
    ],
  },
  outreach: {
    name: 'Outreach Agent',
    prompt: `You are COSMO Outreach Agent, specialized in crafting personalized communications and managing playbooks.

Your primary role is to:
1. Write personalized emails based on contact insights
2. Suggest communication strategies
3. Enroll contacts in appropriate playbooks for automated follow-up
4. Optimize messaging based on context

When writing:
- Reference specific details from contact profiles
- Address known pain points with relevant solutions
- Keep tone professional but personable
- Follow organization messaging guidelines when available

For automation:
- Use list_playbooks to see available playbooks
- Use enroll_contact_in_playbook to start automated sequences`,
    tools: [
      'get_contact',
      'enrich_contact',
      'search_contacts',
      'list_playbooks',
      'get_playbook',
      'enroll_contact_in_playbook',
    ],
  },
  analytics: {
    name: 'Analytics Agent',
    prompt: `You are COSMO Analytics Agent, specialized in data analysis and reporting.

Your primary role is to:
1. Count and analyze contacts by time periods
2. Analyze segment health and performance
3. Generate reports and summaries
4. Identify trends and patterns

Always be precise with numbers. Use the right time presets (today, this_week, this_month, etc.) for date queries.`,
    tools: [
      'count_contacts_created',
      'count_contacts_by_keyword',
      'list_segments',
      'get_segment_contacts',
      'analyze_segment_health',
    ],
  },
  enrichment: {
    name: 'Enrichment Agent',
    prompt: `You are COSMO Enrichment Agent, specialized in AI-powered contact intelligence and segmentation.

Your primary role is to:
1. Run AI enrichment on contacts
2. Generate pain points, goals, and buying signals
3. Calculate segment fit scores
4. Create and manage segments
5. Assign contacts to appropriate segments

Workflows:
- Create segments for specific criteria (e.g., "Enterprise Fintech", "High Intent SaaS")
- Use assign_segment_score to manually add contacts with a fit score
- Run enrichment proactively when contacts lack insights
- Explain what AI findings mean for sales strategy`,
    tools: [
      'get_contact',
      'enrich_contact',
      'calculate_segment_scores',
      'calculate_relationship_score',
      'run_full_analysis',
      'list_segments',
      'create_segment',
      'assign_segment_score',
    ],
  },
};

// Delegation tool definition
const DELEGATE_TOOL: Anthropic.Tool = {
  name: 'delegate_to_agent',
  description: `Delegate a task to a specialized agent. Use this when a task requires specific expertise.

Available agents:
- research: Find contacts, analyze profiles, gather intelligence
- outreach: Write emails, craft messages, communication strategy
- analytics: Count contacts, analyze data, generate reports
- enrichment: AI enrichment, segment scores, relationship analysis

The agent will execute the task and return results.`,
  input_schema: {
    type: 'object' as const,
    properties: {
      agent: {
        type: 'string',
        enum: ['research', 'outreach', 'analytics', 'enrichment'],
        description: 'The specialized agent to delegate to',
      },
      task: {
        type: 'string',
        description: 'Clear description of what you want the agent to do',
      },
      context: {
        type: 'string',
        description: 'Optional: Additional context from previous agent results',
      },
    },
    required: ['agent', 'task'],
  },
};

export class AgentOrchestrator {
  private anthropic: Anthropic;
  private client: CosmoApiClient;
  private toolExecutor: ToolExecutor;
  private model: string;
  private maxIterations: number;
  private sessionId: string;
  private persistHistory: boolean;
  private conversationHistory: Anthropic.MessageParam[] = [];
  private context: MergedContext | null = null;
  private agentMessages: AgentMessage[] = [];

  constructor(config: OrchestratorConfig) {
    this.anthropic = new Anthropic({
      apiKey: config.anthropicApiKey,
    });

    this.client = new CosmoApiClient({
      baseUrl: config.baseUrl,
      apiKey: config.apiKey,
      userId: config.userId,
      orgId: config.orgId,
    });

    this.toolExecutor = new ToolExecutor(this.client);
    this.model = config.model || 'claude-sonnet-4-20250514';
    this.maxIterations = config.maxIterations || 15;
    this.sessionId = config.sessionId || uuidv4();
    this.persistHistory = config.persistHistory ?? true;
  }

  /**
   * Load context from backend
   */
  async loadContext(): Promise<void> {
    try {
      this.context = await this.client.getMergedContext(this.sessionId);
    } catch (error) {
      console.warn('Failed to load context:', error);
      this.context = null;
    }
  }

  /**
   * Get tools for a specific agent type
   */
  private getToolsForAgent(agentType: AgentType): Anthropic.Tool[] {
    const definition = AGENT_DEFINITIONS[agentType];
    const tools = COSMO_TOOLS.filter((tool) =>
      definition.tools.includes(tool.name as ToolName)
    );

    // Orchestrator also gets the delegation tool
    if (agentType === 'orchestrator') {
      tools.push(DELEGATE_TOOL);
    }

    return tools;
  }

  /**
   * Build system prompt for an agent
   */
  private buildSystemPrompt(agentType: AgentType): string {
    let prompt = AGENT_DEFINITIONS[agentType].prompt;

    if (this.context?.prompt_context) {
      prompt += `\n\n## Context from Organization\n${this.context.prompt_context}`;
    }

    return prompt;
  }

  /**
   * Run a specialized agent on a task
   */
  private async runAgent(
    agentType: AgentType,
    task: string,
    additionalContext?: string
  ): Promise<{ response: string; toolsUsed: string[] }> {
    const agentName = AGENT_DEFINITIONS[agentType].name;
    console.log(`\n  [${agentName}] Starting task: ${task.substring(0, 50)}...`);

    const messages: Anthropic.MessageParam[] = [
      {
        role: 'user',
        content: additionalContext
          ? `Context: ${additionalContext}\n\nTask: ${task}`
          : task,
      },
    ];

    const toolsUsed: string[] = [];
    let iterations = 0;

    while (iterations < this.maxIterations) {
      iterations++;

      const response = await this.anthropic.messages.create({
        model: this.model,
        max_tokens: 4096,
        system: this.buildSystemPrompt(agentType),
        tools: this.getToolsForAgent(agentType),
        messages,
      });

      if (response.stop_reason === 'tool_use') {
        const toolUseBlocks = response.content.filter(
          (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use'
        );

        messages.push({
          role: 'assistant',
          content: response.content,
        });

        const toolResults: Anthropic.ToolResultBlockParam[] = [];

        for (const toolUse of toolUseBlocks) {
          console.log(`    [${agentName}] → ${toolUse.name}`);
          toolsUsed.push(toolUse.name);

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

        messages.push({
          role: 'user',
          content: toolResults,
        });

        continue;
      }

      // Final response
      const textBlocks = response.content.filter(
        (block): block is Anthropic.TextBlock => block.type === 'text'
      );

      const finalResponse = textBlocks.map((b) => b.text).join('\n');
      console.log(`  [${agentName}] Completed`);

      return { response: finalResponse, toolsUsed };
    }

    return { response: 'Agent reached maximum iterations.', toolsUsed };
  }

  /**
   * Main chat interface - orchestrates agents
   */
  async chat(userMessage: string): Promise<OrchestratorResult> {
    // Load context if not loaded
    if (!this.context) {
      await this.loadContext();
    }

    // Reset agent messages for this request
    this.agentMessages = [];

    // Add user message
    this.conversationHistory.push({
      role: 'user',
      content: userMessage,
    });

    // Save to backend
    if (this.persistHistory) {
      await this.client.saveConversationMessage(
        this.sessionId,
        'user',
        userMessage
      ).catch(() => {});
    }

    const allToolsUsed: string[] = [];
    let iterations = 0;

    // Orchestrator loop
    while (iterations < this.maxIterations) {
      iterations++;

      const response = await this.anthropic.messages.create({
        model: this.model,
        max_tokens: 4096,
        system: this.buildSystemPrompt('orchestrator'),
        tools: this.getToolsForAgent('orchestrator'),
        messages: this.conversationHistory,
      });

      if (response.stop_reason === 'tool_use') {
        const toolUseBlocks = response.content.filter(
          (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use'
        );

        this.conversationHistory.push({
          role: 'assistant',
          content: response.content,
        });

        const toolResults: Anthropic.ToolResultBlockParam[] = [];

        for (const toolUse of toolUseBlocks) {
          // Handle delegation to sub-agents
          if (toolUse.name === 'delegate_to_agent') {
            const input = toolUse.input as {
              agent: AgentType;
              task: string;
              context?: string;
            };

            console.log(`\n  [Orchestrator] Delegating to ${input.agent}`);

            const agentResult = await this.runAgent(
              input.agent,
              input.task,
              input.context
            );

            // Track agent message
            this.agentMessages.push({
              agentType: input.agent,
              content: agentResult.response,
              toolsUsed: agentResult.toolsUsed,
            });

            allToolsUsed.push(...agentResult.toolsUsed);

            toolResults.push({
              type: 'tool_result',
              tool_use_id: toolUse.id,
              content: JSON.stringify({
                agent: input.agent,
                result: agentResult.response,
                tools_used: agentResult.toolsUsed,
              }),
            });
          } else {
            // Regular tool execution
            console.log(`  [Orchestrator] → ${toolUse.name}`);
            allToolsUsed.push(toolUse.name);

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
        }

        this.conversationHistory.push({
          role: 'user',
          content: toolResults,
        });

        continue;
      }

      // Final response from orchestrator
      const textBlocks = response.content.filter(
        (block): block is Anthropic.TextBlock => block.type === 'text'
      );

      const finalResponse = textBlocks.map((b) => b.text).join('\n');

      this.conversationHistory.push({
        role: 'assistant',
        content: finalResponse,
      });

      // Save to backend
      if (this.persistHistory) {
        await this.client.saveConversationMessage(
          this.sessionId,
          'assistant',
          finalResponse,
          undefined,
          allToolsUsed.length > 0 ? allToolsUsed : undefined
        ).catch(() => {});
      }

      return {
        response: finalResponse,
        agentMessages: this.agentMessages,
        toolsUsed: allToolsUsed,
        sessionId: this.sessionId,
      };
    }

    return {
      response: 'Reached maximum iterations.',
      agentMessages: this.agentMessages,
      toolsUsed: allToolsUsed,
      sessionId: this.sessionId,
    };
  }

  /**
   * Reset conversation
   */
  async resetConversation(): Promise<void> {
    this.conversationHistory = [];
    this.agentMessages = [];
    if (this.persistHistory) {
      await this.client.clearConversationHistory(this.sessionId).catch(() => {});
    }
  }

  /**
   * Get session ID
   */
  getSessionId(): string {
    return this.sessionId;
  }
}
