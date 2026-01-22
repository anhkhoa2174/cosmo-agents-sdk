/**
 * COSMO Agents SDK
 *
 * Claude Agent Development Kit integration for COSMO CRM
 */

// Main agent (backwards compatible)
export { CosmoAgent, type AgentConfig, type ConversationMessage } from './agents/cosmo-agent.js';

// Base agent for building custom agents
export { BaseAgent, type BaseAgentConfig, type AgentResult } from './agents/base-agent.js';

// Specialized agents
export { ResearchAgent } from './agents/research-agent.js';
export { OutreachAgent } from './agents/outreach-agent.js';
export { AnalyticsAgent } from './agents/analytics-agent.js';
export { EnrichmentAgent } from './agents/enrichment-agent.js';

// Multi-agent orchestration
export {
  AgentOrchestrator,
  type OrchestratorConfig,
  type OrchestratorResult,
  type AgentMessage,
  type AgentType,
} from './agents/orchestrator.js';

// API client and types
export {
  CosmoApiClient,
  type CosmoConfig,
  type Contact,
  type Segment,
  type SegmentScore,
  type Playbook,
  type PlaybookStage,
  type Enrollment,
  type OrgContext,
  type UserContext,
  type MergedContext,
  type ConversationHistoryItem,
  type TargetCriteria,
  type CompanyKnowledge,
  type Competitor,
  type UserPreferences,
  type RecentContact,
} from './tools/cosmo-api.js';

// Tools
export { COSMO_TOOLS, type ToolName } from './tools/definitions.js';
export { ToolExecutor, type ExecutorConfig } from './tools/executor.js';

// MCP Integration (Apollo.io)
export {
  ApolloApiClient,
  type ApolloConfig,
  type PeopleSearchQuery,
  type OrganizationSearchQuery,
  type PeopleEnrichmentQuery,
  type ApolloContact,
} from './mcp/apollo-client.js';

export {
  MCPClientManager,
  type MCPServerConfig,
  type MCPClientConfig,
} from './mcp/mcp-client.js';
