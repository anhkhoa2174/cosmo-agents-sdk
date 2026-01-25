# Feature Specification: Configurable Agent System

## Overview

### Problem Statement

Currently, AI agents in the COSMO SDK are hardcoded with fixed prompts, tool sets, and behaviors. Sales teams need the ability to create personalized AI agents that:
- Represent different sales representative personas
- Have access to specific knowledge bases relevant to their domain
- Maintain conversational context across sessions
- Can be dynamically extended with new skills/tools
- Produce outputs that require human approval before external actions

Without this configurability, each new sales persona or workflow requires code changes, limiting scalability and preventing non-technical users from customizing agent behavior.

### Vision

A flexible agent definition system where users can configure AI agents through JSON/YAML definitions. Each agent embodies a sales representative persona, has access to specified knowledge (vector DB), maintains persistent context (memory), and produces outputs stored in S3 for human review and approval. Agents can perform autonomous actions when permitted or queue outputs for manual human execution.

## User Scenarios & Testing

### Primary User Flow

1. User creates a sales representative persona definition in JSON format specifying name, role, communication style, and target audience
2. User configures an agent with:
   - The persona to embody
   - A system prompt tailored to their use case
   - Skills/tools the agent can use
   - A vector database containing relevant knowledge
   - Context/memory settings for conversation persistence
3. User starts a session with the agent, asking it to generate outreach content
4. Agent uses its knowledge base to research the prospect, applies the persona's communication style, and generates personalized outreach
5. Agent stores the generated content in S3 and notifies the user for approval
6. User reviews the output, approves or requests modifications
7. Upon approval, if the action can be automated (e.g., email via API), the agent executes it; otherwise, the user manually sends the content

### Acceptance Scenarios

**Scenario: Agent generates content using persona and knowledge**
- Given an agent configured with a "Enterprise Sales" persona and product knowledge base
- When the user requests "Generate an outreach email for John at Acme Corp"
- Then the agent retrieves relevant product information from the vector DB
- And generates an email matching the persona's communication style
- And stores the output in S3 with a pending approval status

**Scenario: Human approves automated action**
- Given an agent has generated outreach content pending approval
- When the user approves the content with "auto-send" enabled
- Then the agent sends the email via the configured email integration
- And logs the action as completed

**Scenario: Human takes manual action**
- Given an agent has generated social media post content pending approval
- When the user approves the content for manual execution
- Then the system marks the output as "approved for manual action"
- And provides the content in a copy-ready format

**Scenario: User adds new skill to agent**
- Given an existing agent without LinkedIn integration
- When the user adds the "linkedin_post" skill to the agent configuration
- Then the agent can use LinkedIn posting in subsequent sessions

**Scenario: Agent maintains context across sessions**
- Given an agent with memory enabled has had a previous conversation about prospect "Jane"
- When the user starts a new session and asks "What do we know about Jane?"
- Then the agent retrieves the previous context and provides relevant information

## Functional Requirements

### [FR-1] Agent Definition Schema
**Description**: Users can define agents using a structured JSON/YAML schema that specifies persona, prompt, skills, knowledge source, and memory configuration.
**Acceptance Criteria**:
- Agent definition includes: name, description, persona reference, system prompt, skill list, knowledge base reference, memory provider configuration
- Schema validation prevents incomplete or invalid configurations
- Definitions can be versioned and updated without losing session history

### [FR-2] Sales Representative Persona Definition
**Description**: Users can define sales representative personas in JSON format that agents embody during interactions. Personas are tenant-scoped for data isolation.
**Acceptance Criteria**:
- Persona includes: name, role/title, communication style, tone, target audience, signature elements
- Multiple personas can be defined and assigned to different agents
- Persona attributes influence how the agent communicates
- Personas are scoped to the tenant/organization that creates them
- Each organization manages their own persona library independently

### [FR-3] Knowledge Base Integration
**Description**: Agents can access a vector database containing domain-specific knowledge for context-aware responses.
**Acceptance Criteria**:
- Agent configuration references a vector database by identifier
- Agent can query the knowledge base during conversations
- Knowledge retrieval is transparent to the user (they see informed responses)
- Users can update knowledge base content without reconfiguring the agent

### [FR-4] Persistent Context/Memory
**Description**: Agents maintain conversational context across sessions using a pluggable memory provider architecture.
**Acceptance Criteria**:
- Memory stores relevant facts, preferences, and conversation history
- Context is scoped per agent and optionally per user/prospect
- Users can view, edit, or clear stored context
- Memory system is provider-agnostic with a common interface
- mem0 is the default provider, but other providers can be configured
- Provider configuration is part of the agent definition

### [FR-5] Dynamic Skill/Tool Management
**Description**: Users can add, remove, or modify the skills available to an agent.
**Acceptance Criteria**:
- Skills are defined separately and referenced by agents
- Adding a skill makes it immediately available in new sessions
- Removing a skill prevents its use in subsequent sessions
- Skill changes do not affect in-progress sessions

### [FR-6] Output Storage in S3
**Description**: Agent outputs (generated content, reports, artifacts) are stored in S3 for persistence and review.
**Acceptance Criteria**:
- Each output is stored with metadata: agent ID, session ID, timestamp, status, content type
- Outputs are organized by agent and date for easy retrieval
- Storage supports text, JSON, and file attachments
- Outputs can be retrieved by ID or queried by filters
- Per-agent daily output limits are enforced (configurable, default: 100 outputs/day)
- Rate limit exceeded returns clear error with reset time

### [FR-7] Human Approval Workflow
**Description**: Agents seek human approval before executing external actions or finalizing outputs, using webhooks to integrate with external systems.
**Acceptance Criteria**:
- Outputs follow linear state flow: pending → approved/rejected → executed/manual
- System sends webhook notifications to configured external endpoints for pending approvals
- Failed webhooks retry with exponential backoff (3-5 attempts); after exhaustion, output marked 'notification_failed' but remains pending
- Webhooks include output details, approval URL/token, and metadata
- External systems can approve/reject via callback endpoint
- Concurrent approval attempts use first-write-wins: first decision recorded, subsequent attempts return 'already decided' error
- Approval decisions are logged with timestamp and user ID
- Approved outputs transition to 'executed' (if automated) or 'manual' (if human action required)

### [FR-8] Automated vs Manual Action Handling
**Description**: The system distinguishes between actions the agent can execute automatically and those requiring manual human intervention.
**Acceptance Criteria**:
- Each skill/action is tagged as "automatable" or "manual-only"
- Automatable actions execute upon approval if integration is configured
- Manual-only actions provide copy-ready output for human execution
- Users can override automation preferences per action

## Success Criteria

- [ ] Users can create and configure a new agent in under 5 minutes using the JSON schema
- [ ] Agents correctly apply persona communication style in 90%+ of generated outputs (as rated by users)
- [ ] Knowledge base queries return relevant context for 95%+ of user requests
- [ ] Agent context persists correctly across sessions with zero data loss
- [ ] 100% of outputs requiring approval are captured in S3 before any external action
- [ ] Human approval workflow has clear visibility - users can find and act on pending items within 30 seconds
- [ ] Skill additions are available in new sessions within 1 minute of configuration change
- [ ] System supports at least 50 concurrent configured agents without degradation

## Key Entities

| Entity         | Description                      | Key Attributes                                                                                            |
|----------------|----------------------------------|-----------------------------------------------------------------------------------------------------------|
| Agent          | Configured AI agent instance     | id, name, description, persona_id, system_prompt, skill_ids[], knowledge_base_id, memory_config, created_at |
| Persona        | Sales rep persona definition     | id, name, role, communication_style, tone, target_audience, signature_elements                           |
| Skill          | Tool/capability available to agents | id, name, description, is_automatable, required_config                                                  |
| KnowledgeBase  | Vector DB reference              | id, name, provider, connection_config, last_updated                                                       |
| MemoryConfig   | Context/memory settings          | provider, scope, retention_policy                                                                         |
| Output         | Agent-generated artifact         | id, agent_id, session_id, content, content_type, status (pending/approved/rejected/executed/manual/notification_failed), s3_path, created_at, updated_at |
| ApprovalRecord | Human decision on output         | id, output_id, decision, user_id, timestamp, notes                                                        |

## Edge Cases & Failure Handling

- **Webhook delivery failure**: After 3-5 retries with exponential backoff, mark output as 'notification_failed' but keep status 'pending'; users can discover via manual query or dashboard
- **Concurrent approval race condition**: First approval/rejection wins; subsequent attempts receive 'already decided' response with existing decision details
- **Rate limit exceeded**: Return error with message "Daily output limit reached for agent {name}. Resets at {UTC time}."
- **Memory provider unavailable**: Agent continues without context; logs warning; session proceeds with degraded experience
- **Knowledge base query timeout**: Return partial response with disclaimer "Could not retrieve full context"; use 10-second timeout default

## Dependencies & Assumptions

### Dependencies
- S3 or compatible object storage for output persistence
- Vector database service for knowledge base (e.g., Pinecone, Weaviate, or similar)
- Memory provider service (e.g., mem0 or compatible)
- Claude API for agent reasoning
- Notification system for approval alerts (email, webhook, or in-app)

### Assumptions
- Users have basic JSON literacy for creating agent/persona definitions (or a UI will be provided in future iteration)
- S3 bucket and credentials are pre-configured in the environment
- Vector database is pre-populated with knowledge; this feature focuses on querying, not ingestion
- Memory provider handles persistence; this feature integrates with its API
- Email/social media integrations exist as skills that can be attached to agents
- Session-based authentication exists for tracking which user approves outputs

## Previous Work

- Existing `BaseAgent` and `CosmoAgent` classes provide foundation for agent architecture
- Current tool system in `src/tools/` demonstrates skill/tool patterns
- MCP integration shows external service connection patterns

## Out of Scope

- Vector database content ingestion and management (assumes pre-populated)
- Building the notification infrastructure (assumes exists or uses webhooks)
- UI for agent/persona configuration (JSON-based for this iteration)
- Multi-agent collaboration and handoffs
- Real-time streaming of agent outputs
- Billing and usage tracking per agent

## Resolved Decisions

**Memory Provider Architecture**: Provider-agnostic design with mem0 as the default. The system will define a common memory interface that abstracts provider-specific details, allowing organizations to swap providers if needed while maintaining a sensible default.

**Approval Workflow Integration**: Webhook-based notifications to external systems. This provides maximum flexibility for teams to integrate approvals into their existing workflows (Slack, custom dashboards, ticketing systems) without requiring a dedicated COSMO UI for approvals.

**Persona Scope**: Tenant-scoped only. Each organization maintains their own persona library with complete data isolation. This simplifies permissions and ensures organizations have full control over their personas.

## Clarifications

### Session 2026-01-25

- Q: What should happen when a webhook notification fails to deliver? → A: Retry with exponential backoff (3-5 retries with increasing delays), then mark as 'notification failed' but keep output pending for manual discovery.
- Q: What is the valid state transition for Output status? → A: Linear flow: pending → approved/rejected → executed/manual.
- Q: How should the system handle concurrent approval attempts on the same output? → A: First-write-wins; first approval/rejection is recorded, subsequent attempts return 'already decided' error.
- Q: Should agents have rate limits on output generation? → A: Yes, per-agent daily limits (configurable, e.g., 100 outputs/day) to prevent abuse while allowing flexibility.
