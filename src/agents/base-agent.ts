/**
 * Base Agent - Foundation for all specialized agents
 * Provides common functionality: context loading, tool execution, conversation management
 */

import Anthropic from '@anthropic-ai/sdk';
import { CosmoApiClient, type CosmoConfig, type MergedContext } from '../tools/cosmo-api.js';
import { COSMO_TOOLS, type ToolName } from '../tools/definitions.js';
import { ToolExecutor } from '../tools/executor.js';
import { v4 as uuidv4 } from 'uuid';

export interface BaseAgentConfig extends CosmoConfig {
  anthropicApiKey: string;
  model?: string;
  maxIterations?: number;
  sessionId?: string;
  persistHistory?: boolean;
}

export interface AgentResult {
  response: string;
  toolsUsed: string[];
  sessionId: string;
}

export abstract class BaseAgent {
  protected anthropic: Anthropic;
  protected client: CosmoApiClient;
  protected toolExecutor: ToolExecutor;
  protected model: string;
  protected maxIterations: number;
  protected sessionId: string;
  protected persistHistory: boolean;
  protected conversationHistory: Anthropic.MessageParam[] = [];
  protected context: MergedContext | null = null;

  // Subclasses must define these
  protected abstract systemPrompt: string;
  protected abstract agentName: string;
  protected abstract allowedTools: ToolName[];

  constructor(config: BaseAgentConfig) {
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
    this.maxIterations = config.maxIterations || 10;
    this.sessionId = config.sessionId || uuidv4();
    this.persistHistory = config.persistHistory ?? true;
  }

  /**
   * Load context from backend (org + user context)
   */
  async loadContext(): Promise<void> {
    try {
      this.context = await this.client.getMergedContext(this.sessionId);
    } catch (error) {
      console.warn('Failed to load context, using empty context:', error);
      this.context = null;
    }
  }

  /**
   * Load conversation history from backend
   */
  async loadHistory(): Promise<void> {
    if (!this.persistHistory) return;

    try {
      const history = await this.client.getConversationHistory(this.sessionId);
      this.conversationHistory = history.map((item) => ({
        role: item.role as 'user' | 'assistant',
        content: item.content,
      }));
    } catch (error) {
      console.warn('Failed to load history:', error);
    }
  }

  /**
   * Build the full system prompt with context
   */
  protected buildSystemPrompt(): string {
    let prompt = this.systemPrompt;

    if (this.context?.prompt_context) {
      prompt += `\n\n${this.context.prompt_context}`;
    }

    return prompt;
  }

  /**
   * Get filtered tools for this agent
   */
  protected getTools(): Anthropic.Tool[] {
    return COSMO_TOOLS.filter((tool) =>
      this.allowedTools.includes(tool.name as ToolName)
    );
  }

  /**
   * Process a message through the agent
   */
  async chat(userMessage: string): Promise<AgentResult> {
    // Load context if not loaded
    if (!this.context) {
      await this.loadContext();
    }

    // Add user message
    this.conversationHistory.push({
      role: 'user',
      content: userMessage,
    });

    // Save user message to backend
    if (this.persistHistory) {
      await this.client.saveConversationMessage(
        this.sessionId,
        'user',
        userMessage
      ).catch(() => {});
    }

    const toolsUsed: string[] = [];
    let response: Anthropic.Message;
    let iterations = 0;

    // Agentic loop
    while (iterations < this.maxIterations) {
      iterations++;

      response = await this.anthropic.messages.create({
        model: this.model,
        max_tokens: 4096,
        system: this.buildSystemPrompt(),
        tools: this.getTools(),
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
          console.log(`  [${this.agentName}] → ${toolUse.name}`);
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

        this.conversationHistory.push({
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
          toolsUsed.length > 0 ? toolsUsed : undefined
        ).catch(() => {});
      }

      return {
        response: finalResponse,
        toolsUsed,
        sessionId: this.sessionId,
      };
    }

    return {
      response: 'Reached maximum iterations.',
      toolsUsed,
      sessionId: this.sessionId,
    };
  }

  /**
   * Reset conversation
   */
  async resetConversation(): Promise<void> {
    this.conversationHistory = [];
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
